import {
  ACTIVE_CLASS,
  ANCESTOR_CLASS,
  BUTTON_CLASS,
  FULLSCREEN_BUTTON_SELECTOR,
  PLAYER_CLASS,
  PLAYER_SELECTOR,
  RIGHT_CONTROLS_SELECTOR,
} from "./content.constants";
import type { ContentState } from "./content.types";

export function setFullWindow(state: ContentState, active: boolean) {
  const wasActive = document.documentElement.classList.contains(ACTIVE_CLASS);
  if (active && !wasActive)
    state.scrollPosition = { left: window.scrollX, top: window.scrollY };
  for (const ancestor of state.ancestors)
    ancestor.classList.remove(ANCESTOR_CLASS);
  state.ancestors = [];
  if (active && state.player) {
    for (
      let parent = state.player.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      state.ancestors.push(parent);
      parent.classList.add(ANCESTOR_CLASS);
    }
  }
  document.documentElement.classList.toggle(ACTIVE_CLASS, active);
  state.player?.classList.toggle(PLAYER_CLASS, active);
  state.button?.setAttribute("aria-pressed", String(active));
  const label = active ? "Exit full window (Esc)" : "Full window";
  state.button?.setAttribute("aria-label", label);
  state.button?.setAttribute("title", label);
  if (!active && wasActive)
    window.scrollTo({ ...state.scrollPosition, behavior: "instant" });
  // YouTube recalculates its progress bar and overlays on window resize.
  window.dispatchEvent(new Event("resize"));
}

export function syncButton(
  state: ContentState,
  setFullWindowMode: (active: boolean) => void,
) {
  const nextPlayer =
    location.pathname === "/watch"
      ? document.querySelector<HTMLElement>(PLAYER_SELECTOR)
      : null;
  if (nextPlayer !== state.player) {
    setFullWindowMode(false);
    state.button?.remove();
    state.button = null;
    state.player = nextPlayer;
  }
  const fullscreen = state.player?.querySelector(FULLSCREEN_BUTTON_SELECTOR);
  const controls =
    fullscreen?.parentElement ??
    state.player?.querySelector(RIGHT_CONTROLS_SELECTOR);
  if (!controls || (state.button && controls.contains(state.button))) return;
  state.button?.remove();
  state.button = document.createElement("button");
  state.button.className = BUTTON_CLASS;
  state.button.type = "button";
  state.button.setAttribute(
    "aria-pressed",
    String(document.documentElement.classList.contains(ACTIVE_CLASS)),
  );
  const label = document.documentElement.classList.contains(ACTIVE_CLASS)
    ? "Exit full window (Esc)"
    : "Full window";
  state.button.setAttribute("aria-label", label);
  state.button.title = label;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm.5 2a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13z",
  );
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  const arrows = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrows.setAttribute("d", "M9.5 10l2.5-2 2.5 2M9.5 14l2.5 2 2.5-2");
  arrows.setAttribute("fill", "none");
  arrows.setAttribute("stroke", "currentColor");
  arrows.setAttribute("stroke-width", "1.5");
  svg.append(arrows);
  state.button.append(svg);
  state.button.addEventListener("click", () => {
    setFullWindowMode(
      !document.documentElement.classList.contains(ACTIVE_CLASS),
    );
  });
  controls.insertBefore(state.button, fullscreen ?? null);
}
