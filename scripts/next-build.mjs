import { spawn } from "node:child_process";
import path from "node:path";

const cwd = process.cwd();
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextBin, "build", "--webpack", ...process.argv.slice(2)], {
  cwd,
  env: {
    ...process.env,
    NEXT_TEST_WASM_DIR: path.join(cwd, "node_modules", "@next", "swc-wasm-nodejs"),
    LOCALAPPDATA: path.join(cwd, ".appdata", "Local"),
    APPDATA: path.join(cwd, ".appdata", "Roaming"),
    XDG_CONFIG_HOME: path.join(cwd, ".config")
  },
  stdio: "inherit"
});

child.on("exit", (code) => process.exit(code ?? 0));
