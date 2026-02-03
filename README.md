# Zoho Widget Packer

Standalone packer for Zoho widgets built with frameworks like React.

Repository: https://github.com/ahmedsaeed195/zoho-widget-packer

## How it works
1. Runs your build command in the app directory (Defaults: `npm run build`, `--app-dir=.`; change via `--build-cmd` and `--app-dir`).
2. Copies the build output into `widget_dist/app` (Defaults: `--build-dir=dist`, `--out-dir=widget_dist`; change via `--build-dir` and `--out-dir`).
3. Ensures a valid `plugin-manifest.json` exists for the target service (Defaults: `--manifest-path=.`; change via `--manifest-path`).
4. Injects the correct Zoho SDK script into the entry HTML file (Defaults: `--entry=index.html`, SDK auto-selected by `--target`; change via `--entry` and `--sdk-url`).
5. Creates a zip archive at `widget_dist.zip` (Defaults: `--zip-path=widget_dist.zip`; change via `--zip-path`).

The SDK injection step adds a `<script src="..."></script>` tag to your entry HTML
if it is not already present. The default SDK URL is selected based on `--target`,
or you can override it with `--sdk-url`.

## Install
```bash
npm install -g zoho-widget-packer
```

## Usage
```bash
zoho-widget-packer --target=creator
zoho-widget-packer --target=crm
```

### Flags / env vars
- `--target` (required) or `WIDGET_TARGET`
- `--root-dir` or `WIDGET_ROOT_DIR` (default: current working dir)
- `--app-dir` or `WIDGET_APP_DIR` (default: `.`)
- `--build-dir` or `WIDGET_BUILD_DIR` (default: `dist` under `--app-dir`)
- `--out-dir` or `WIDGET_OUT_DIR` (default: `widget_dist`)
- `--zip-path` or `WIDGET_ZIP_PATH` (default: `widget_dist.zip`)
- `--manifest-path` or `WIDGET_MANIFEST_PATH` (default: `.`; writes `plugin-manifest.json`)
- `--entry` or `WIDGET_ENTRY` (default: `index.html`)
- `--sdk-url` or `WIDGET_SDK_URL` (override default SDK URL)
- `--build-cmd` or `WIDGET_BUILD_CMD` (default: `npm run build`)

## Notes
- Creator uses the v2 SDK by default.
- CRM uses the Embedded JS SDK (v1.5) by default.
- Currently supported Zoho services: Creator and CRM.
- Currently supported: React + Vite only.
