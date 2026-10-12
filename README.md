# YouTube Full Window

A Firefox extension that adds a window icon immediately before YouTube's fullscreen button on desktop watch pages. Click it to fill the browser's content area with the player. The browser tabs and address bar stay visible; the surrounding YouTube page disappears. The video keeps its aspect ratio, with black bars where needed.

YouTube's controls, captions, settings and normal auto-hide behavior remain available. Click the window icon again or press Escape to restore the page. Navigating to another video exits full-window mode.

## Build and load

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
| `bun run check` | Check TypeScript types. |
| `bun test` | Run behavior tests. |
| `bun run lint` | Build and run Mozilla's validator; warnings fail the command. |
| `bun run validate` | Run type checking, tests, build, and extension lint. |
| `bun run package` | Validate and create an unsigned ZIP in `web-ext-artifacts/`. |
| `bun run sign` | Validate and submit to Mozilla for unlisted signing; download the signed XPI. |
| `bun run publish` | Validate and submit a public AMO listing or update. |

To select a Firefox executable or open debugging tools:

```sh
bun run build
bun run firefox --firefox="C:/Program Files/Mozilla Firefox/firefox.exe" --devtools
```

For `dev`, set `WEB_EXT_FIREFOX` to the executable path in your environment. `web-ext-config.mjs` shares the build directory, artifact directory, and starting URL across commands.

### Load manually

Run `bun run build`, then:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…** and select `dist/manifest.json`.
3. Open or reload a YouTube video and click the new window icon in the player controls.

Temporary add-ons are removed when Firefox restarts. Permanent installation requires a Mozilla-signed release. After editing the source, rebuild, reload the extension in `about:debugging`, and refresh YouTube.

### Sign or publish

`package` creates an unsigned ZIP suitable for uploading to the [AMO Developer Hub](https://addons.mozilla.org/developers/). Renaming it to `.xpi` does not sign it.

For CLI submission, obtain [AMO API credentials](https://addons.mozilla.org/developers/addon/api/key/) and set `WEB_EXT_API_KEY` (JWT issuer) and `WEB_EXT_API_SECRET` (JWT secret) in your environment. Alternatively, place them in a local `.env` file; Bun loads it and Git ignores it. Never put credentials in package scripts or commit them.

Run `bun run sign` for a signed extension you distribute yourself, or `bun run publish` for a public AMO submission. Both commands upload the extension to Mozilla. For a first public listing, pass `--amo-metadata=amo-metadata.json` to `bun run publish`; supply your summary, category, and chosen license according to [Mozilla's metadata requirements](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#--amo-metadata). No license is selected for you. Public submissions may require review and do not necessarily produce a local XPI immediately.

For review of this TypeScript build, provide a source archive using `--upload-source-code=path/to/source.zip` (or upload it through the Developer Hub). Include `src/`, `tests/`, `build.ts`, `package.json`, `bun.lock`, `tsconfig.json`, `web-ext-config.mjs`, and this README; exclude credentials, `node_modules/`, and generated artifacts. Reviewers can reproduce the build with `bun install --frozen-lockfile` and `bun run build`.

Keep the extension ID stable after the first submission. Increase `src/manifest.json`'s version for each release and keep `package.json`'s version in sync. Signing and publishing require your AMO account; they are not part of `build`, `validate`, or `package`.

## Scope and checks

TypeScript source is in `src/`; Bun produces the JavaScript Firefox loads in `dist/`. No runtime dependencies, background process, storage, analytics, or network requests are added. Access is limited to `https://www.youtube.com/*` through a manifest content script ([Mozilla documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts)).

Automated DOM tests cover toggling, Escape, preserving the player, navigation cleanup, and replacing controls without duplicate buttons. They do not verify video rendering. For a browser check, try a regular and portrait video, resize the window, open captions/settings, exit using both methods, and navigate to another video. Confirm native fullscreen still works.

YouTube's internal DOM is not a stable API. Its layout changes may require selector or CSS updates. Shorts and embedded players are outside this extension's scope.
