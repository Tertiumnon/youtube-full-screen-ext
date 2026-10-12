const manifestPath = "src/manifest.json";
const manifest = await Bun.file(manifestPath).json();
manifest.version = (await Bun.file("package.json").json()).version;
await Bun.write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
