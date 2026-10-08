// Regenerates the committed golden documents (tests/golden/*).
// Cross-platform: sets UPDATE_GOLDEN=1 and runs the golden tests.
//   pnpm golden:update
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", "tests/golden"],
  {
    stdio: "inherit",
    env: { ...process.env, UPDATE_GOLDEN: "1" },
    shell: process.platform === "win32",
  },
);
process.exit(result.status ?? 1);
