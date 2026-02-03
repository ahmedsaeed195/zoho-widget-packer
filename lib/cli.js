const path = require("node:path");
const { packWidget } = require("./pack");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const trimmed = arg.slice(2);
    if (trimmed.includes("=")) {
      const [key, value] = trimmed.split("=");
      args[key] = value;
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[trimmed] = next;
      i += 1;
      continue;
    }
    args[trimmed] = true;
  }
  return args;
}

function resolveOption(key, args, envKey, fallback) {
  if (args[key] !== undefined) return args[key];
  if (envKey && process.env[envKey] !== undefined) return process.env[envKey];
  return fallback;
}

function resolvePath(value, rootDir) {
  if (!value) return value;
  if (path.isAbsolute(value)) return value;
  return path.resolve(rootDir, value);
}

async function runCli(options = {}) {
  const args = parseArgs(process.argv);
  const defaultRootDir = options.defaultRootDir || process.cwd();
  const rootDir = resolvePath(resolveOption("root-dir", args, "WIDGET_ROOT_DIR", defaultRootDir), defaultRootDir);

  const target = resolveOption("target", args, "WIDGET_TARGET", "");
  const appDir = resolvePath(resolveOption("app-dir", args, "WIDGET_APP_DIR", "."), rootDir);
  const distDir = resolvePath(resolveOption("build-dir", args, "WIDGET_BUILD_DIR", "dist"), appDir);
  const outDir = resolvePath(resolveOption("out-dir", args, "WIDGET_OUT_DIR", "widget_dist"), rootDir);
  const zipPath = resolvePath(resolveOption("zip-path", args, "WIDGET_ZIP_PATH", "widget_dist.zip"), rootDir);
  const manifestDir = resolvePath(resolveOption("manifest-path", args, "WIDGET_MANIFEST_PATH", "."), rootDir);
  const entry = resolveOption("entry", args, "WIDGET_ENTRY", "index.html");
  const appFolder = "app";
  const sdkUrl = resolveOption("sdk-url", args, "WIDGET_SDK_URL", "");
  const buildCmd = resolveOption("build-cmd", args, "WIDGET_BUILD_CMD", "npm run build");
  const framework = "react";
  const bundler = "vite";

  await packWidget({
    target,
    rootDir,
    appDir,
    distDir,
    outDir,
    zipPath,
    manifestDir,
    entry,
    appFolder,
    sdkUrl,
    buildCmd,
    framework,
    bundler,
  });
}

module.exports = {
  runCli,
};
