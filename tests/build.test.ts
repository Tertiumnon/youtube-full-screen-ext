import { expect, test } from "bun:test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function waitFor(check: () => boolean | Promise<boolean>) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (await check()) return;
    await Bun.sleep(25);
  }
  throw new Error("Timed out waiting for watch build");
}

test("watch rebuilds TS, CSS and manifest and recovers after a build error", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ytfw-build-"));
  let child: ReturnType<typeof Bun.spawn> | undefined;
  try {
    await cp("src", join(directory, "src"), { recursive: true });
    await cp("build.ts", join(directory, "build.ts"));
    child = Bun.spawn([process.execPath, "build.ts", "--watch"], {
      cwd: directory,
      stdout: "pipe",
      stderr: "ignore",
    });
    let output = "";
    const stdout = child.stdout as ReadableStream<Uint8Array>;
    const reading = stdout.pipeTo(
      new WritableStream({
        write(chunk) {
          output += new TextDecoder().decode(chunk);
        },
      }),
    );
    await waitFor(() => output.includes("Watching src/"));
    const css = Bun.file(join(directory, "dist/content.css"));
    await Bun.write(join(directory, "src/content.css"), "/* watch check */");
    await waitFor(async () => (await css.text()) === "/* watch check */");

    const manifest = await Bun.file(
      join(directory, "src/manifest.json"),
    ).json();
    manifest.version = "1.0.1";
    await Bun.write(
      join(directory, "src/manifest.json"),
      JSON.stringify(manifest),
    );
    await waitFor(async () => {
      // The watcher may still be writing the manifest when this poll reads it.
      const text = await Bun.file(join(directory, "dist/manifest.json")).text();
      return text === JSON.stringify(manifest);
    });

    await Bun.write(join(directory, "src/content.ts"), "const = ;");
    await Bun.sleep(150);
    expect(child.exitCode).toBe(null);
    await Bun.write(
      join(directory, "src/content.ts"),
      'console.log("watch recovered");',
    );
    await waitFor(async () =>
      (await Bun.file(join(directory, "dist/content.js")).text()).includes(
        "watch recovered",
      ),
    );
    child.kill();
    await child.exited;
    await reading;
  } finally {
    child?.kill();
    if (child) await child.exited;
    await rm(directory, { recursive: true, force: true });
  }
}, 15000);
