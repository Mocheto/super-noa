import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repository = process.env.RANKING_UPDATE_REPOSITORY ?? "Mocheto/super-noa";
const branch = process.env.RANKING_UPDATE_BRANCH ?? "main";
const appDirectory = process.env.RANKING_APP_DIRECTORY ?? "/app";
const releasesDirectory = join(appDirectory, "releases");
const stateFile = join(appDirectory, "ranking-release.json");
const serverFiles = ["ranking-server.mjs", "ranking-domain.mjs"];

export function isCommitSha(value) {
  return typeof value === "string" && /^[a-f\d]{40}$/.test(value);
}

export function parseUpdateInterval(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 60_000 ? parsed : 300_000;
}

const updateInterval = parseUpdateInterval(process.env.RANKING_UPDATE_INTERVAL_MS);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchChecked(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "super-noa-ranking-updater",
    },
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
  const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `No se pudo validar ${path}.`);
}

async function downloadRelease(sha) {
  if (!isCommitSha(sha)) throw new Error("No se puede descargar un commit no válido.");
  const releaseDirectory = join(releasesDirectory, sha);
  try {
    await readFile(join(releaseDirectory, "ranking-server.mjs"));
    return releaseDirectory;
  } catch {
    // La versión todavía no está descargada.
  }

  const temporaryDirectory = join(releasesDirectory, `.download-${sha}-${process.pid}`);
  await rm(temporaryDirectory, { recursive: true, force: true });
  await mkdir(temporaryDirectory, { recursive: true });
  try {
    for (const filename of serverFiles) {
      const response = await fetchChecked(`https://raw.githubusercontent.com/${repository}/${sha}/server/${filename}`);
      const destination = join(temporaryDirectory, filename);
      await writeFile(destination, await response.text(), "utf8");
      validateServerFile(destination);
    }
    await mkdir(dirname(releaseDirectory), { recursive: true });
    await rename(temporaryDirectory, releaseDirectory);
    return releaseDirectory;
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function readSavedRelease() {
  try {
    const saved = JSON.parse(await readFile(stateFile, "utf8"));
    if (!isCommitSha(saved?.sha)) return null;
    const directory = join(releasesDirectory, saved.sha);
    await readFile(join(directory, "ranking-server.mjs"));
    return { sha: saved.sha, directory };
  } catch {
    return null;
  }
}

async function saveRelease(sha) {
  const temporaryState = `${stateFile}.tmp`;
  await writeFile(temporaryState, `${JSON.stringify({ sha })}\n`, "utf8");
  await rename(temporaryState, stateFile);
}

let child = null;
let currentRelease = null;
let stopping = false;
let shuttingDown = false;

function startServer(release) {
  const launched = spawn(process.execPath, [join(release.directory, "ranking-server.mjs")], {
    cwd: release.directory,
    env: { ...process.env, RANKING_RELEASE_SHA: release.sha },
    stdio: "inherit",
  });
  child = launched;
  launched.on("exit", (code, signal) => {
    if (child !== launched) return;
    child = null;
    if (stopping || shuttingDown) return;
    console.error(`El ranking se detuvo (${signal ?? code}); se reintentará en 5 segundos.`);
    setTimeout(() => {
      if (!child && !shuttingDown && currentRelease) startServer(currentRelease);
    }, 5_000).unref();
  });
  return launched;
}

async function waitForHealth(launched) {
  const port = Number.parseInt(process.env.PORT ?? "8088", 10);
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (launched.exitCode !== null) throw new Error("El proceso nuevo se cerró antes de estar preparado.");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // El servidor puede tardar unos segundos en abrir el puerto.
    }
    await delay(500);
  }
  throw new Error("El proceso nuevo no respondió a la comprobación de salud.");
}

async function stopServer() {
  const running = child;
  if (!running) return;
  stopping = true;
  running.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => running.once("exit", resolve)),
    delay(10_000).then(() => running.kill("SIGKILL")),
  ]);
  if (child === running) child = null;
  stopping = false;
}

async function activateRelease(nextRelease) {
  const previousRelease = currentRelease;
  await stopServer();
  console.info(`Activando backend del ranking ${nextRelease.sha.slice(0, 12)}.`);
  const launched = startServer(nextRelease);
  try {
    await waitForHealth(launched);
    currentRelease = nextRelease;
    await saveRelease(nextRelease.sha);
    console.info(`Backend ${nextRelease.sha.slice(0, 12)} actualizado correctamente.`);
  } catch (error) {
    console.error("La versión nueva no arrancó; se conserva la anterior.", error);
    await stopServer();
    if (!previousRelease) throw error;
    const restored = startServer(previousRelease);
    await waitForHealth(restored);
    currentRelease = previousRelease;
  }
}

async function checkForUpdates() {
  const sha = await findLatestCommit();
  if (currentRelease?.sha === sha) return;
  const directory = await downloadRelease(sha);
  await activateRelease({ sha, directory });
}

async function run() {
  await mkdir(releasesDirectory, { recursive: true });
  const savedRelease = await readSavedRelease();
  if (savedRelease) {
    currentRelease = savedRelease;
    const launched = startServer(savedRelease);
    await waitForHealth(launched);
    console.info(`Backend guardado ${savedRelease.sha.slice(0, 12)} iniciado.`);
  }

  try {
    await checkForUpdates();
  } catch (error) {
    console.error("No se pudo comprobar la actualización inicial.", error);
    if (!currentRelease) throw error;
  }

  console.info(`Se comprobarán actualizaciones cada ${Math.round(updateInterval / 60_000)} minutos.`);
  while (!shuttingDown) {
    await delay(updateInterval);
    if (shuttingDown) break;
    try {
      await checkForUpdates();
    } catch (error) {
      console.error("No se pudo comprobar o aplicar una actualización; se mantiene la versión activa.", error);
    }
  }
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await stopServer();
}

function requestShutdown() {
  shutdown()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("No se pudo detener limpiamente el ranking.", error);
      process.exit(1);
    });
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  process.on("SIGINT", requestShutdown);
  process.on("SIGTERM", requestShutdown);
  run().catch((error) => {
    console.error("El supervisor del ranking no pudo arrancar.", error);
    process.exitCode = 1;
  });
}
