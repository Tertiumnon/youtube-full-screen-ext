# Scope and checks

TypeScript source is in `src/`; Bun produces the JavaScript Firefox loads in `dist/`. No runtime dependencies, background process, storage, analytics, or network requests are added. Access is limited to `https://www.youtube.com/*` through a manifest content script ([Mozilla documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts)).

Automated DOM tests cover toggling, Escape, preserving the player, navigation cleanup, and replacing controls without duplicate buttons. They do not verify video rendering. For a browser check, try a regular and portrait video, resize the window, open captions/settings, exit using both methods, and navigate to another video. Confirm native fullscreen still works.

YouTube's internal DOM is not a stable API. Its layout changes may require selector or CSS updates. Shorts and embedded players are outside this extension's scope.
