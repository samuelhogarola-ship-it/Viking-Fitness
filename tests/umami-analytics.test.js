const assert = require("node:assert/strict");
const { readdirSync, readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = process.cwd();
const bootstrapPath = path.join(projectRoot, "assets/js/umami-analytics.js");

function collectHtmlFiles(directory = projectRoot) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

async function runBootstrap(config) {
  const source = readFileSync(bootstrapPath, "utf8");
  const appended = [];
  const document = {
    createElement() {
      return { dataset: {}, defer: false };
    },
    head: {
      appendChild(element) {
        appended.push(element);
      },
    },
    querySelector() {
      return null;
    },
  };
  const window = {};
  const context = vm.createContext({
    console,
    document,
    fetch: async () => ({ json: async () => config, ok: true }),
    window,
  });

  vm.runInContext(source, context);
  await window.VikingUmamiAnalytics.ready;

  return appended[0] ?? null;
}

test("every HTML entry loads the local Umami bootstrap", () => {
  const htmlFiles = collectHtmlFiles();
  const missing = htmlFiles
    .filter(
      (file) =>
        !readFileSync(file, "utf8").includes(
          "/assets/js/umami-analytics.js",
        ),
    )
    .map((file) => path.relative(projectRoot, file));
  const duplicates = htmlFiles
    .filter((file) => {
      const matches = readFileSync(file, "utf8").match(
        /\/assets\/js\/umami-analytics\.js/g,
      );
      return matches?.length !== 1;
    })
    .map((file) => path.relative(projectRoot, file));

  assert.equal(htmlFiles.length, 26);
  assert.deepEqual(missing, []);
  assert.deepEqual(duplicates, []);
});

test("loads the personal cookieless Umami tracker", async () => {
  const tracker = await runBootstrap({
    hostUrl: "https://analytics.187.124.55.36.sslip.io",
    websiteId: "viking-test-website-id",
  });

  assert.equal(
    tracker.src,
    "https://analytics.187.124.55.36.sslip.io/script.js",
  );
  assert.equal(tracker.dataset.websiteId, "viking-test-website-id");
  assert.equal(tracker.defer, true);
});

test("does not load Umami without a website id", async () => {
  const tracker = await runBootstrap({
    hostUrl: "https://analytics.187.124.55.36.sslip.io",
    websiteId: "",
  });

  assert.equal(tracker, null);
});

test("versioned production config loads the Viking Fitness website id", async () => {
  const config = JSON.parse(readFileSync(path.join(projectRoot, "umami-config.json"), "utf8"));
  const tracker = await runBootstrap(config);

  assert.equal(tracker.dataset.websiteId, "160e32a7-bd01-4482-992e-5bdae718b088");
  assert.equal(tracker.dataset.hostUrl, "https://analytics.187.124.55.36.sslip.io");
});

test("fails closed when config points to a different Umami host", async () => {
  const tracker = await runBootstrap({
    hostUrl: "https://analytics.2.24.10.239.sslip.io",
    websiteId: "160e32a7-bd01-4482-992e-5bdae718b088",
  });

  assert.equal(tracker, null);
});
