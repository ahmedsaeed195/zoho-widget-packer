const fs = require("fs-extra");
const path = require("node:path");
const { execa } = require("execa");

const creatorSdkUrl = "https://js.zohostatic.com/creator/widgets/version/2.0/widgetsdk-min.js";
const crmSdkUrl = "https://live.zwidgets.com/js-sdk/1.5/ZohoEmbededAppSDK.min.js";

const creatorManifest = {
  service: "CREATOR",
  cspDomains: {
    "connect-src": [],
  },
  config: [],
};
const crmManifest = {
  service: "CRM",
};

function loadArchiver() {
  try {
    return require("archiver");
  } catch (err) {
    const fallbackPaths = [path.join(process.cwd(), "app"), process.cwd()];
    return require(require.resolve("archiver", { paths: fallbackPaths }));
  }
}

function resolveShell() {
  const envShell = process.env.ComSpec;
  if (envShell && fs.existsSync(envShell)) return envShell;
  const systemRoot = process.env.SystemRoot || "C:\\Windows";
  const powershellPath = path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  if (fs.existsSync(powershellPath)) return powershellPath;
  return "powershell.exe";
}

async function run(command, cwd) {
  const shell = process.platform === "win32" ? resolveShell() : process.env.SHELL || true;
  await execa.command(command, { stdio: "inherit", cwd, shell });
}

function ensureSdkInjected(html, sdkUrl) {
  if (html.includes(sdkUrl)) return html;
  const sdkTag = `<script src="${sdkUrl}"></script>`;
  if (html.includes("</title>")) {
    return html.replace("</title>", `</title>\n    ${sdkTag}`);
  }
  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${sdkTag}\n</head>`);
  }
  return `${html}\n${sdkTag}\n`;
}

function isValidManifest(value, target) {
  if (!value || typeof value !== "object") return false;
  if (target === "crm") {
    return value.service === "CRM";
  }
  if (value.service !== "CREATOR") return false;
  const csp = value.cspDomains;
  if (!csp || typeof csp !== "object") return false;
  if (!Array.isArray(csp["connect-src"])) return false;
  if (!Array.isArray(value.config)) return false;
  return true;
}

function ensureManifest(manifestPath, target) {
  const desiredManifest = target === "crm" ? crmManifest : creatorManifest;
  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, "utf8");
      manifest = JSON.parse(raw);
    } catch (err) {
      manifest = null;
    }
  }

  if (!isValidManifest(manifest, target)) {
    fs.writeFileSync(manifestPath, JSON.stringify(desiredManifest, null, 2) + "\n", "utf8");
    return desiredManifest;
  }

  return manifest;
}

function normalizeTarget(target) {
  const normalized = String(target || "").toLowerCase();
  if (!normalized) {
    throw new Error("Missing target. Use --target=creator|crm or set WIDGET_TARGET=creator|crm.");
  }
  if (normalized === "creator" || normalized === "crm") return normalized;
  throw new Error(`Invalid target "${normalized}". Use --target=creator|crm.`);
}

function ensureDir(pathToCreate) {
  fs.ensureDirSync(pathToCreate);
}

async function zipWidget(widgetDistDir, zipPath) {
  const archiver = loadArchiver();
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(widgetDistDir, false);
    archive.finalize();
  });
}

async function packWidget(options) {
  const target = normalizeTarget(options.target);
  const sdkUrl = options.sdkUrl || (target === "crm" ? crmSdkUrl : creatorSdkUrl);

  const appDir = options.appDir;
  const distDir = options.distDir;
  const widgetDistDir = options.outDir;
  const widgetAppDir = path.join(widgetDistDir, options.appFolder);
  const zipPath = options.zipPath;
  const manifestPath = path.join(options.manifestDir, "plugin-manifest.json");
  const entryFile = options.entry;

  await run(options.buildCmd, appDir);

  fs.removeSync(widgetDistDir);
  ensureDir(widgetAppDir);
  fs.copySync(distDir, widgetAppDir);

  const manifest = ensureManifest(manifestPath, target);
  fs.writeFileSync(path.join(widgetDistDir, "plugin-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  const entryPath = path.join(widgetAppDir, entryFile);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Entry file not found at ${entryPath}`);
  }

  const entryHtml = fs.readFileSync(entryPath, "utf8");
  const updatedHtml = ensureSdkInjected(entryHtml, sdkUrl);
  fs.writeFileSync(entryPath, updatedHtml, "utf8");

  fs.removeSync(zipPath);

  await zipWidget(widgetDistDir, zipPath);
  console.log(`Widget package created: ${zipPath}`);
}

module.exports = {
  packWidget,
};
