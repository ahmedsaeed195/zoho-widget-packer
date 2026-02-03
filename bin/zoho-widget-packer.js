#!/usr/bin/env node

const { runCli } = require("../lib/cli");

runCli().catch((err) => {
  console.error(err);
  process.exit(1);
});
