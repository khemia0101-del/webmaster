import { spawn } from "node:child_process";
import { nextOptions } from "./next-options.mjs";

const cwd = process.cwd();
const { args, env } = nextOptions("build", cwd, process.platform, process.env, process.argv.slice(2));

const child = spawn(process.execPath, args, {
  cwd,
  env,
  stdio: "inherit"
});

child.on("error", (error) => { console.error(error.message); process.exit(1); });
child.on("exit", (code) => process.exit(code ?? 1));
