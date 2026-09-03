import path from "node:path";

export function nextOptions(command, cwd, platform, env, extra = []) {
  const windows = platform === "win32";
  return {
    args: [path.join(cwd, "node_modules", "next", "dist", "bin", "next"), command,
      ...(windows ? ["--webpack"] : []), ...extra],
    env: windows ? {
      ...env,
      NEXT_TEST_WASM_DIR: path.join(cwd, "node_modules", "@next", "swc-wasm-nodejs"),
      LOCALAPPDATA: path.join(cwd, ".appdata", "Local"),
      APPDATA: path.join(cwd, ".appdata", "Roaming"),
      XDG_CONFIG_HOME: path.join(cwd, ".config")
    } : { ...env }
  };
}
