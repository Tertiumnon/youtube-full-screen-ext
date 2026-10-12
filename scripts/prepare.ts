import { existsSync } from "node:fs";

// Source archives lack .git but still need to install for Mozilla review.
if (existsSync(".git")) {
  const result = Bun.spawnSync(["git", "config", "core.hooksPath", ".githooks"]);
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
}
