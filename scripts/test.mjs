import { readdirSync } from "node:fs";
import { spawn } from "node:child_process";
const files = ["src/lib", "scripts"].flatMap((dir) => readdirSync(dir)
  .filter((name) => /\.test\.(ts|mjs)$/.test(name)).map((name) => `${dir}/${name}`));
const child = spawn(process.execPath, ["--conditions=react-server", "--import", "tsx", "--test", ...files], { stdio: "inherit" });
child.on("error", (error) => { console.error(error.message); process.exit(1); });
child.on("exit", (code) => process.exit(code ?? 1));
