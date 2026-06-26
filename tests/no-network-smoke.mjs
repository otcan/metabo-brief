import { createServer } from "node:http";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_PORT = Number(process.env.METABOBRIEF_SMOKE_PORT || 18941);
const DEBUG_PORT = Number(process.env.METABOBRIEF_CDP_PORT || 19941);
const USER_DATA_DIR = `/tmp/metabobrief-no-network-${process.pid}`;
const SAMPLE_FILE = path.resolve(process.env.METABOBRIEF_SMOKE_FILE || path.join(ROOT, "examples", "synthetic-23andme.txt"));
const REPORT_TIMEOUT_MS = Number(process.env.METABOBRIEF_SMOKE_REPORT_TIMEOUT_MS || 12000);

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ].filter(Boolean);
  return candidates.find(candidate => existsSync(candidate)) || null;
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://127.0.0.1:${APP_PORT}`);
      const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const resolved = path.resolve(ROOT, relative);
      if (!resolved.startsWith(`${ROOT}${path.sep}`)) {
        response.writeHead(400);
        response.end("Bad request");
        return;
      }
      const body = await readFile(resolved);
      response.writeHead(200, { "Content-Type": contentType(resolved) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  return new Promise(resolve => {
    server.listen(APP_PORT, "127.0.0.1", () => resolve(server));
  });
}

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Wait for Chrome to expose the DevTools endpoint.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function cdpSession() {
  const targets = await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
  const target = targets.find(item => item.type === "page") || targets[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const requests = [];

  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Network.requestWillBeSent") {
      requests.push({
        url: message.params.request.url,
        method: message.params.request.method,
        type: message.params.type
      });
    }
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  function call(method, params = {}) {
    const callId = ++id;
    ws.send(JSON.stringify({ id: callId, method, params }));
    return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
  }

  return { call, requests, close: () => ws.close() };
}

function waitForChromeExit(process) {
  return new Promise(resolve => {
    process.once("exit", resolve);
  });
}

const chrome = findChrome();
if (!chrome) {
  const message = "Skipping browser no-network smoke test because Chrome/Chromium is not installed.";
  if (process.env.METABOBRIEF_REQUIRE_BROWSER_SMOKE === "1") {
    throw new Error(message);
  }
  console.log(message);
  process.exit(0);
}

let server;
let browser;
let session;
try {
  server = await startServer();
  browser = spawn(chrome, [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=${USER_DATA_DIR}`,
    `http://127.0.0.1:${APP_PORT}/analyze.html`
  ], { stdio: "ignore" });

  session = await cdpSession();
  await session.call("Page.enable");
  await session.call("Network.enable");
  await session.call("Runtime.enable");
  await session.call("DOM.enable");

  await session.call("Runtime.evaluate", {
    awaitPromise: true,
    expression: `
      (async () => {
        const started = Date.now();
        while (Date.now() - started < ${REPORT_TIMEOUT_MS}) {
          if (document.getElementById("panel-release")?.textContent.trim() !== "Loading") return true;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error("panel did not load");
      })()
    `
  });

  session.requests.length = 0;
  const doc = await session.call("DOM.getDocument", { depth: -1, pierce: true });
  const input = await session.call("DOM.querySelector", { nodeId: doc.root.nodeId, selector: "input[type=file]" });
  if (!input.nodeId) {
    throw new Error("Analyzer file input not found.");
  }
  await session.call("DOM.setFileInputFiles", { nodeId: input.nodeId, files: [SAMPLE_FILE] });
  await session.call("Runtime.evaluate", {
    awaitPromise: true,
    expression: `
      (async () => {
        const input = document.getElementById("snp-file");
        input.dispatchEvent(new Event("change", { bubbles: true }));
        const started = Date.now();
        while (Date.now() - started < ${REPORT_TIMEOUT_MS}) {
          if (document.querySelectorAll(".pathway-score-card").length >= 16) return true;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error("report did not render");
      })()
    `
  });

  const unexpected = session.requests.filter(request => !request.url.startsWith(`http://127.0.0.1:${APP_PORT}/`));
  if (session.requests.length > 0 || unexpected.length > 0) {
    throw new Error(`Analysis triggered network requests after file selection: ${JSON.stringify(session.requests, null, 2)}`);
  }

  console.log("Browser no-network analyzer smoke test passed.");
} finally {
  session?.close();
  if (browser && !browser.killed) {
    browser.kill("SIGTERM");
    await Promise.race([
      waitForChromeExit(browser),
      new Promise(resolve => setTimeout(resolve, 1000))
    ]);
  }
  await new Promise(resolve => server?.close(resolve));
  await rm(USER_DATA_DIR, { recursive: true, force: true });
}
