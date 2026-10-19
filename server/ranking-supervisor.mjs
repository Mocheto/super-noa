import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function isCommitSha(value) {
  return typeof value === "string" && /^[a-f\d]{40}$/.test(value);
}

export function parseUpdateInterval(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 60_000 ? parsed : 300_000;
}

export function createRankingSupervisor(options = {}) {
  const env = options.env ?? process.env;
  const repository = env.RANKING_UPDATE_REPOSITORY ?? "Mocheto/super-noa";
  const branch = env.RANKING_UPDATE_BRANCH ?? "main";
  const appDirectory = env.RANKING_APP_DIRECTORY ?? "/app";
  const releasesDirectory = join(appDirectory, "releases");
  const stateFile = join(appDirectory, "ranking-release.json");
  const serverFiles = ["ranking-server.mjs", "ranking-domain.mjs"];
  const fs = options.fs ?? { mkdir, readFile, rename, rm, writeFile };
  const launch = options.spawn ?? spawn;
  const checkSyntax = options.spawnSync ?? spawnSync;
  const fetchUrl = options.fetch ?? fetch;
  const logger = options.logger ?? console;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const updateInterval = parseUpdateInterval(env.RANKING_UPDATE_INTERVAL_MS);
  let child = null;
  let currentRelease = null;
  let savedRelease = null;
  let shuttingDown = false;
  let wake = null;
  let transition = Promise.resolve();

  async function fetchChecked(url) {
    const response = await fetchUrl(url, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "super-noa-ranking-updater" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`GitHub respondió ${response.status} al consultar ${url}.`);
    return response;
  }

  async function findLatestCommit() {
    const response = await fetchChecked(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(branch)}`);
    const payload = await response.json();
    if (!isCommitSha(payload?.sha)) throw new Error("GitHub no devolvió un commit válido.");
    return payload.sha;
  }

  function validateServerFile(path) {
    const result = checkSyntax(process.execPath, ["--check", path], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr?.trim() || `No se pudo validar ${path}.`);
  }

  async function downloadRelease(sha) {
    if (!isCommitSha(sha)) throw new Error("No se puede descargar un commit no válido.");
    const directory = join(releasesDirectory, sha);
    try {
      for (const filename of serverFiles) {
        await fs.readFile(join(directory, filename));
        validateServerFile(join(directory, filename));
      }
      return directory;
    } catch {
      // Una caché incompleta no debe impedir volver a descargar la versión.
    }
    const staging = join(releasesDirectory, `.download-${sha}-${process.pid}`);
    await fs.rm(staging, { recursive: true, force: true });
    await fs.mkdir(staging, { recursive: true });
    try {
      for (const filename of serverFiles) {
        const response = await fetchChecked(`https://raw.githubusercontent.com/${repository}/${sha}/server/${filename}`);
        const destination = join(staging, filename);
        await fs.writeFile(destination, await response.text(), "utf8");
        validateServerFile(destination);
      }
      await fs.mkdir(dirname(directory), { recursive: true });
      await fs.rm(directory, { recursive: true, force: true });
      await fs.rename(staging, directory);
      return directory;
    } catch (error) {
      await fs.rm(staging, { recursive: true, force: true });
      throw error;
    }
  }

  async function readSavedRelease() {
    try {
      const saved = JSON.parse(await fs.readFile(stateFile, "utf8"));
      if (!isCommitSha(saved?.sha)) return null;
      const directory = join(releasesDirectory, saved.sha);
      for (const filename of serverFiles) await fs.readFile(join(directory, filename));
      return { sha: saved.sha, directory };
    } catch {
      return null;
    }
  }

  async function saveRelease(sha) {
    const staging = `${stateFile}.tmp`;
    try {
      await fs.writeFile(staging, `${JSON.stringify({ sha })}\n`, "utf8");
      await fs.rename(staging, stateFile);
    } catch (error) {
      await fs.rm(staging, { force: true }).catch(() => {});
      throw error;
    }
  }

  function startServer(release) {
    if (shuttingDown) throw new Error("El supervisor se está deteniendo.");
    const processChild = launch(process.execPath, [join(release.directory, "ranking-server.mjs")], {
      cwd: release.directory, env: { ...env, RANKING_RELEASE_SHA: release.sha }, stdio: "inherit",
    });
    const launched = { process: processChild, error: null };
    child = launched;
    processChild.on("error", (error) => { launched.error = error; wake?.(); });
    processChild.on("exit", () => {
      if (child !== launched) return;
      child = null;
      wake?.();
    });
    return launched;
  }

  async function waitForHealth(launched, release) {
    const port = Number.parseInt(env.PORT ?? "8088", 10);
    const deadline = now() + 15_000;
    while (now() < deadline) {
      if (shuttingDown) throw new Error("El supervisor se está deteniendo.");
      if (launched.error) throw launched.error;
      if (launched.process.exitCode !== null || launched.process.signalCode != null) throw new Error("El proceso nuevo se cerró antes de estar preparado.");
      try {
        const response = await fetchUrl(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1_000) });
        if (response.ok && (await response.json()).release === release.sha.slice(0, 12)) return;
      } catch {
        // El proceso puede tardar unos segundos en abrir su puerto.
      }
      await sleep(500);
    }
    throw new Error("El proceso nuevo no respondió con la versión esperada.");
  }

  async function stopServer() {
    const running = child;
    if (!running) return;
    const processChild = running.process;
    if (processChild.exitCode !== null || processChild.signalCode != null || running.error) {
      if (child === running) child = null;
      return;
    }
    await new Promise((resolve, reject) => {
      let timer;
      const exited = () => { clearTimeout(timer); resolve(); };
      processChild.once("exit", exited);
      timer = setTimeout(() => {
        timer = setTimeout(() => {
          processChild.removeListener("exit", exited);
          reject(new Error("El proceso anterior no terminó después de SIGKILL."));
        }, options.stopTimeoutMs ?? 10_000);
        processChild.kill("SIGKILL");
      }, options.stopTimeoutMs ?? 10_000);
      processChild.kill("SIGTERM");
    });
    if (child === running) child = null;
  }

  async function activate(nextRelease, persist) {
    if (!isCommitSha(nextRelease.sha)) throw new Error("No se puede activar un commit no válido.");
    const previousRelease = currentRelease;
    await stopServer();
    try {
      const launched = startServer(nextRelease);
      await waitForHealth(launched, nextRelease);
      if (shuttingDown) throw new Error("El supervisor se está deteniendo.");
      if (persist) await saveRelease(nextRelease.sha);
      currentRelease = nextRelease;
      savedRelease = nextRelease;
      logger.info(`Backend ${nextRelease.sha.slice(0, 12)} preparado y confirmado.`);
    } catch (error) {
      logger.error("No se pudo confirmar la versión nueva; se intentará recuperar la anterior.", error);
      await stopServer();
      currentRelease = null;
      if (previousRelease && !shuttingDown) {
        try {
          const restored = startServer(previousRelease);
          await waitForHealth(restored, previousRelease);
          currentRelease = previousRelease;
        } catch (restoreError) {
          await stopServer();
          logger.error("La versión anterior tampoco pudo arrancar; se volverá a intentar.", restoreError);
        }
      }
      throw error;
    }
  }

  function activateRelease(release, { persist = true } = {}) {
    const result = transition.then(() => activate(release, persist));
    transition = result.catch(() => {});
    return result;
  }

  async function checkForUpdates() {
    const sha = await findLatestCommit();
    if (currentRelease?.sha === sha && child && !child.error) return;
    const directory = await downloadRelease(sha);
    await activateRelease({ sha, directory });
  }

  function waitForNextCheck(milliseconds) {
    if (options.waitForNextCheck) return options.waitForNextCheck(milliseconds);
    return new Promise((resolve) => {
      const timer = setTimeout(done, milliseconds);
      function done() {
        clearTimeout(timer);
        if (wake === done) wake = null;
        resolve();
      }
      wake = done;
      if (shuttingDown) done();
    });
  }

  async function recoverSavedRelease() {
    if (child || !savedRelease || shuttingDown) return;
    try {
      await activateRelease(savedRelease, { persist: false });
    } catch (error) {
      logger.error("No pudo arrancar la versión guardada; se buscará otra versión.", error);
    }
  }

  async function updateSafely() {
    try {
      await checkForUpdates();
    } catch (error) {
      logger.error("No se pudo comprobar o aplicar la actualización; se volverá a intentar.", error);
    }
  }

  async function run() {
    await fs.mkdir(releasesDirectory, { recursive: true });
    savedRelease = await readSavedRelease();
    await recoverSavedRelease();
    if (!shuttingDown) await updateSafely();
    while (!shuttingDown) {
      await waitForNextCheck(child ? updateInterval : 5_000);
      if (shuttingDown) break;
      await recoverSavedRelease();
      if (!shuttingDown) await updateSafely();
    }
  }

  async function shutdown() {
    shuttingDown = true;
    wake?.();
    await transition;
    await stopServer();
  }

  return {
    run, shutdown, activateRelease, checkForUpdates,
    getState: () => ({ currentRelease, savedRelease, running: !!child && !child.error, shuttingDown }),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const supervisor = createRankingSupervisor();
  const requestShutdown = () => {
    supervisor.shutdown().then(() => process.exit(0)).catch((error) => {
      console.error("No se pudo detener limpiamente el ranking.", error);
      process.exit(1);
    });
  };
  process.on("SIGINT", requestShutdown);
  process.on("SIGTERM", requestShutdown);
  supervisor.run().catch((error) => {
    console.error("El supervisor no pudo preparar su directorio de trabajo.", error);
    process.exitCode = 1;
  });
}
