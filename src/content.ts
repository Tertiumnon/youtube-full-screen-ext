import { ACTIVE_CLASS } from "./content.constants";
import { setFullWindow, syncButton } from "./content.utils";
import type { ContentState } from "./content.types";

(() => {
  // Dispose the previous content-script instance before a development reload.
  document.dispatchEvent(new Event("ytfw-dispose"));
  document.querySelectorAll(".ytfw-button").forEach((node) => node.remove());
  const listeners = new AbortController();
  const state: ContentState = {
    player: null,
    button: null,
    ancestors: [],
    scrollPosition: { left: 0, top: 0 },
  };
  const setFullWindowMode = (active: boolean) => setFullWindow(state, active);
  const updateButton = () => syncButton(state, setFullWindowMode);

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        document.documentElement.classList.contains(ACTIVE_CLASS)
      ) {
        setFullWindowMode(false);
        state.button?.focus();
      }
    },
    { capture: true, signal: listeners.signal },
  );
  document.addEventListener(
    "yt-navigate-start",
    () => setFullWindowMode(false),
    {
      signal: listeners.signal,
    },
  );
  document.addEventListener("yt-navigate-finish", updateButton, {
    signal: listeners.signal,
  });
  window.addEventListener("popstate", updateButton, {
    signal: listeners.signal,
  });
  document.addEventListener(
    "fullscreenchange",
    () => {
      if (document.fullscreenElement) setFullWindowMode(false);
    },
    { signal: listeners.signal },
  );
  // shortcut: YouTube has no public controls API; update selectors if its player DOM changes.
  const observer = new MutationObserver(updateButton);
  document.addEventListener(
    "ytfw-dispose",
    () => {
      observer.disconnect();
      listeners.abort();
      setFullWindowMode(false);
      state.button?.remove();
    },
    { signal: listeners.signal },
  );
  observer.observe(document.body, { childList: true, subtree: true });
  updateButton();
})();
