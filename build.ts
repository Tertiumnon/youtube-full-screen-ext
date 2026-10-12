import { cp, watch } from "node:fs/promises";

async function build() {
  const result = await Bun.build({
    entrypoints: ["src/content.ts"],
    outdir: "dist",
    target: "browser",
    format: "iife",
  });
  if (!result.success) throw new AggregateError(result.logs, "Build failed");
  for (const file of ["manifest.json", "content.css"]) {
    await Bun.write(`dist/${file}`, Bun.file(`src/${file}`));
  }
  await cp("src/icons", "dist/icons", { recursive: true });
  console.log("Built Firefox extension in dist/");
}

await build();
if (process.argv.includes("--watch")) {
  console.log("Watching src/ for changes (Ctrl+C to stop)");
  for await (const _event of watch("src", { recursive: true })) {
    try {
      await build();
    } catch (error) {
      console.error(error);
    }
  }
}
