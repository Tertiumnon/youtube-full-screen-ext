import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("release version sync updates the Firefox manifest", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ytfw-release-"));
  try {
    await mkdir(join(directory, "src"));
    await Bun.write(
      join(directory, "package.json"),
      JSON.stringify({ version: "0.2.0" }),
    );
    await Bun.write(
      join(directory, "src/manifest.json"),
      JSON.stringify({ manifest_version: 3, version: "0.1.0" }),
    );
    const child = Bun.spawn(
      [process.execPath, join(import.meta.dir, "../scripts/sync-version.ts")],
      {
        cwd: directory,
        stdout: "ignore",
        stderr: "pipe",
      },
    );
    expect(await child.exited).toBe(0);
    expect(await Bun.file(join(directory, "src/manifest.json")).json()).toEqual(
      { manifest_version: 3, version: "0.2.0" },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
