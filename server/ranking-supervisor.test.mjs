import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter, once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createRankingSupervisor, isCommitSha, parseUpdateInterval } from "./ranking-supervisor.mjs";

test("acepta únicamente SHA completos de Git", () => {
  assert.equal(isCommitSha("a".repeat(40)), true);
  assert.equal(isCommitSha("A".repeat(40)), false);
  assert.equal(isCommitSha("a".repeat(39)), false);
  assert.equal(isCommitSha("main"), false);
});

test("usa cinco minutos por defecto y rechaza intervalos demasiado cortos", () => {
  assert.equal(parseUpdateInterval(undefined), 300_000);
  assert.equal(parseUpdateInterval("30000"), 300_000);
  assert.equal(parseUpdateInterval("60000"), 60_000);
  assert.equal(parseUpdateInterval("900000"), 900_000);
});

const first = { sha: "a".repeat(40), directory: "/app/releases/" + "a".repeat(40) };
const next = { sha: "b".repeat(40), directory: "/app/releases/" + "b".repeat(40) };

function fixture(t, initial = null) {
  const files = new Map();
  const launches = [];
  const healthFailures = new Set();
  let failWrites = false;
  let failRenames = false;
  let latest = next.sha;
  let offline = false;
  let liveProcess = null;
  let clock = 0;
  let onWait = async () => {};
  if (initial) files.set("/app/ranking-release.json", JSON.stringify({ sha: initial.sha }));
  for (const release of [first, next]) {
    files.set(`${release.directory}/ranking-server.mjs`, "server");
    files.set(`${release.directory}/ranking-domain.mjs`, "domain");
  }
  const fs = {
    mkdir: async () => {},
    readFile: async (path) => {
      if (!files.has(path)) throw new Error("ENOENT");
      return files.get(path);
    },
    writeFile: async (path, value) => {
      if (failWrites) throw new Error("ENOSPC");
      files.set(path, value);
    },
    rename: async (source, target) => {
      if (failRenames) throw new Error("EACCES");
      files.set(target, files.get(source));
      files.delete(source);
    },
    rm: async (path) => { files.delete(path); },
  };
  const options = {
    env: { RANKING_APP_DIRECTORY: "/app" }, fs, logger: { info() {}, error() {} },
    now: () => clock, sleep: async (duration) => { clock += duration; },
    spawnSync: () => ({ status: 0 }),
    spawn: (_executable, _args, config) => {
      assert.equal(liveProcess, null, "no debe arrancar otra versión antes de terminar la anterior");
      const processChild = new EventEmitter();
      processChild.exitCode = null;
      processChild.signalCode = null;
      processChild.sha = config.env.RANKING_RELEASE_SHA;
      processChild.kill = (signal) => {
        queueMicrotask(() => {
          processChild.signalCode = signal;
          if (liveProcess === processChild) liveProcess = null;
          processChild.emit("exit", null, signal);
        });
      };
      liveProcess = processChild;
      launches.push(processChild);
      return processChild;
    },
    fetch: async (url) => {
      if (url.startsWith("http://127.0.0.1:")) return {
        ok: !!liveProcess && !healthFailures.has(liveProcess.sha),
        json: async () => ({ release: liveProcess?.sha.slice(0, 12) }),
      };
      if (offline) throw new Error("Sin conexión");
      return { ok: true, json: async () => ({ sha: latest }) };
    },
    waitForNextCheck: async (milliseconds) => onWait(milliseconds),
  };
  const supervisor = createRankingSupervisor(options);
  t.after(() => supervisor.shutdown());
  return {
    supervisor, options, files, launches, healthFailures,
    set failWrites(value) { failWrites = value; },
    set failRenames(value) { failRenames = value; },
    set latest(value) { latest = value; },
    set offline(value) { offline = value; },
    set onWait(value) { onWait = value; },
  };
}

test("un fallo de escritura inicial no confirma una versión detenida y permite reintentar el mismo SHA", async (t) => {
  const f = fixture(t);
  f.failWrites = true;
  await assert.rejects(f.supervisor.activateRelease(next), /ENOSPC/);
  assert.equal(f.supervisor.getState().currentRelease, null);
  assert.equal(f.supervisor.getState().running, false);
  assert.equal(f.files.has("/app/ranking-release.json"), false);
  f.failWrites = false;
  await f.supervisor.checkForUpdates();
  assert.equal(f.supervisor.getState().currentRelease.sha, next.sha);
  assert.equal(f.supervisor.getState().running, true);
  assert.equal(JSON.parse(f.files.get("/app/ranking-release.json")).sha, next.sha);
});

test("si falla el rename del estado recupera proceso y archivo anteriores", async (t) => {
  const f = fixture(t);
  await f.supervisor.activateRelease(first);
  f.failRenames = true;
  await assert.rejects(f.supervisor.activateRelease(next), /EACCES/);
  assert.equal(f.supervisor.getState().currentRelease.sha, first.sha);
  assert.equal(f.supervisor.getState().running, true);
  assert.equal(JSON.parse(f.files.get("/app/ranking-release.json")).sha, first.sha);
  assert.equal(f.files.has("/app/ranking-release.json.tmp"), false);
  assert.deepEqual(f.launches.map((child) => child.sha), [first.sha, next.sha, first.sha]);
});

test("rollback tras salud fallida conserva el SHA confirmado y nunca persiste el candidato", async (t) => {
  const f = fixture(t);
  await f.supervisor.activateRelease(first);
  f.healthFailures.add(next.sha);
  await assert.rejects(f.supervisor.activateRelease(next), /versión esperada/);
  assert.equal(f.supervisor.getState().currentRelease.sha, first.sha);
  assert.equal(f.supervisor.getState().running, true);
  assert.equal(JSON.parse(f.files.get("/app/ranking-release.json")).sha, first.sha);
});

test("si también falla el rollback no declara un proceso sano y puede recuperarse después", async (t) => {
  const f = fixture(t);
  await f.supervisor.activateRelease(first);
  f.healthFailures.add(first.sha);
  f.healthFailures.add(next.sha);
  await assert.rejects(f.supervisor.activateRelease(next), /versión esperada/);
  assert.equal(f.supervisor.getState().currentRelease, null);
  assert.equal(f.supervisor.getState().running, false);
  assert.equal(JSON.parse(f.files.get("/app/ranking-release.json")).sha, first.sha);
  f.healthFailures.clear();
  await f.supervisor.checkForUpdates();
  assert.equal(f.supervisor.getState().currentRelease.sha, next.sha);
  assert.equal(f.supervisor.getState().running, true);
});

test("no confirma la versión nueva antes del rename atómico del estado", async (t) => {
  const f = fixture(t);
  const rename = f.options.fs.rename;
  let supervisor;
  f.options.fs.rename = async (source, target) => {
    if (target.endsWith("ranking-release.json")) assert.equal(supervisor.getState().currentRelease, null);
    return rename(source, target);
  };
  supervisor = createRankingSupervisor(f.options);
  t.after(() => supervisor.shutdown());
  await supervisor.activateRelease(next);
  assert.equal(supervisor.getState().currentRelease.sha, next.sha);
});

test("espera la salida real tras SIGKILL antes de sustituir un hijo que ignora SIGTERM", async (t) => {
  const f = fixture(t);
  const spawnFake = f.options.spawn;
  const signals = [];
  f.options.stopTimeoutMs = 5;
  f.options.spawn = (...args) => {
    const child = spawnFake(...args);
    const kill = child.kill;
    child.kill = (signal) => {
      signals.push(signal);
      if (signal === "SIGKILL") kill(signal);
    };
    return child;
  };
  const supervisor = createRankingSupervisor(f.options);
  t.after(() => supervisor.shutdown());
  await supervisor.activateRelease(first);
  await supervisor.activateRelease(next);
  assert.deepEqual(signals, ["SIGTERM", "SIGKILL"]);
  assert.equal(supervisor.getState().currentRelease.sha, next.sha);
});

test("una versión guardada que falla no impide consultar y arrancar una corrección", async (t) => {
  const f = fixture(t, first);
  f.healthFailures.add(first.sha);
  f.onWait = async () => {
    assert.equal(f.supervisor.getState().currentRelease.sha, next.sha);
    await f.supervisor.shutdown();
  };
  await f.supervisor.run();
  assert.deepEqual(f.launches.map((child) => child.sha), [first.sha, next.sha]);
});

test("sin versión arrancable ni GitHub el bucle sigue vivo y se recupera en la siguiente iteración", async (t) => {
  const f = fixture(t, first);
  f.healthFailures.add(first.sha);
  f.offline = true;
  let waits = 0;
  f.onWait = async (milliseconds) => {
    if (++waits === 1) {
      assert.equal(milliseconds, 5_000);
      assert.equal(f.supervisor.getState().running, false);
      f.offline = false;
      return;
    }
    assert.equal(f.supervisor.getState().currentRelease.sha, next.sha);
    await f.supervisor.shutdown();
  };
  await f.supervisor.run();
  assert.equal(waits, 2);
});

test("un hijo terminado se reinicia aunque la rama siga apuntando al mismo SHA", async (t) => {
  const f = fixture(t);
  await f.supervisor.activateRelease(next);
  f.launches[0].kill("SIGTERM");
  await Promise.resolve();
  assert.equal(f.supervisor.getState().running, false);
  await f.supervisor.checkForUpdates();
  assert.equal(f.launches.length, 2);
  assert.equal(f.supervisor.getState().running, true);
});

test("shutdown durante una activación impide dejar un hijo huérfano o confirmar estado", async (t) => {
  const f = fixture(t);
  const activation = f.supervisor.activateRelease(next);
  const shutdown = f.supervisor.shutdown();
  await assert.rejects(activation, /deteniendo/);
  await shutdown;
  assert.equal(f.supervisor.getState().running, false);
  assert.equal(f.supervisor.getState().currentRelease, null);
});

test("la activación y parada funcionan también con proceso Node y HTTP reales", async (t) => {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const f = fixture(t);
  const children = [];
  const supervisor = createRankingSupervisor({
    ...f.options,
    env: { RANKING_APP_DIRECTORY: "/app", PORT: String(port) },
    fetch, now: Date.now, sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    spawn: (_executable, _args, config) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e",
        `import {createServer} from "node:http";
         const server=createServer((request,response)=>{response.setHeader("Content-Type","application/json");response.end(JSON.stringify({release:process.env.RANKING_RELEASE_SHA.slice(0,12)}));});
         server.listen(Number(process.env.PORT),"127.0.0.1");
         process.on("SIGTERM",()=>server.close());`],
      { ...config, cwd: process.cwd(), stdio: "ignore" });
      children.push(child);
      return child;
    },
  });
  t.after(() => supervisor.shutdown());
  await supervisor.activateRelease(next);
  assert.equal(supervisor.getState().currentRelease.sha, next.sha);
  assert.equal((await fetch(`http://127.0.0.1:${port}/health`).then((response) => response.json())).release, next.sha.slice(0, 12));
  await supervisor.shutdown();
  assert.ok(children[0].exitCode !== null || children[0].signalCode !== null);
});
