# Development

Requires Bun 1.4.2+, Node.js 22+ (used by Mozilla's `web-ext` CLI), and Firefox 142+. The project pins `web-ext` 10.7.0; commands follow Mozilla's [2026 web-ext reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).

```sh
bun install
bun run dev
```

`dev` builds the extension, opens Firefox with a temporary profile, and watches all files in `src/` (TypeScript, CSS, and manifest). Changes rebuild `dist/`, then `web-ext` reloads the extension. Refresh an existing YouTube tab after a reload to apply content-script changes. Stop with Ctrl+C. Restart the command after changing `build.ts` or tooling configuration.

| Command | Purpose |
| --- | --- |
| `bun run dev` | Build, watch sources, and run Firefox with extension reloads. |
| `bun run start` | Build and open Firefox without watching TypeScript sources. |
| `bun run watch` | Rebuild on source changes without launching Firefox. |
| `bun run firefox` | Run the existing `dist/` build in Firefox. |
| `bun run build` | Compile and copy extension files to `dist/`. |
| `bun run icons` | Regenerate `src/icons/` from `img/logo.png` with sharp. |
| `bun run check` | Check TypeScript types. |
| `bun test` | Run behavior tests. |
| `bun run lint` | Build and run Mozilla's validator; warnings fail the command. |
| `bun run validate` | Run type checking, tests, build, and extension lint. |
| `bun run package` | Validate and create an unsigned ZIP in `web-ext-artifacts/`. |
| `bun run sign` | Validate and submit to Mozilla for unlisted signing; download the signed XPI. |
| `bun run publish` | Validate and submit a public AMO listing or update. |
| `bun run changelog` | Preview the next changelog entry from Git history. |
| `bun run release:patch`, `release:minor`, `release:major` | Validate, bump versions, update the changelog, then create a local Git commit and tag. |

To select a Firefox executable or open debugging tools:

```sh
bun run build
bun run firefox --firefox="C:/Program Files/Mozilla Firefox/firefox.exe" --devtools
```

For `dev`, set `WEB_EXT_FIREFOX` to the executable path in your environment. `web-ext-config.mjs` shares the build directory, artifact directory, and starting URL across commands.

## Load manually

Run `bun run build`, then:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…** and select `dist/manifest.json`.
3. Open or reload a YouTube video and click the new window icon in the player controls.

Temporary add-ons are removed when Firefox restarts. Permanent installation requires a Mozilla-signed release. After editing the source, rebuild, reload the extension in `about:debugging`, and refresh YouTube.
