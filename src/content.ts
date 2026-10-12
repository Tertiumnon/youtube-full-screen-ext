(() => {
  // Dispose the previous content-script instance before a development reload.
  document.dispatchEvent(new Event("ytfw-dispose"));
  document.querySelectorAll(".ytfw-button").forEach(node => node.remove());
  const listeners = new AbortController();
  const activeClass = "ytfw-active";
  const ancestorClass = "ytfw-ancestor";
  let player: HTMLElement | null = null;
  let button: HTMLButtonElement | null = null;
  let ancestors: HTMLElement[] = [];
  let scrollPosition = { left: 0, top: 0 };

  function setFullWindow(active: boolean) {
    const wasActive = document.documentElement.classList.contains(activeClass);
    if (active && !wasActive) scrollPosition = { left: window.scrollX, top: window.scrollY };
    for (const ancestor of ancestors) ancestor.classList.remove(ancestorClass);
    ancestors = [];
    if (active && player) {
      for (let parent = player.parentElement; parent; parent = parent.parentElement) {
        ancestors.push(parent);
        parent.classList.add(ancestorClass);
      }
    }
    document.documentElement.classList.toggle(activeClass, active);
    player?.classList.toggle("ytfw-player", active);
    button?.setAttribute("aria-pressed", String(active));
    const label = active ? "Exit full window (Esc)" : "Full window";
    button?.setAttribute("aria-label", label);
    button?.setAttribute("title", label);
    if (!active && wasActive) window.scrollTo({ ...scrollPosition, behavior: "instant" });
    // YouTube recalculates its progress bar and overlays on window resize.
    window.dispatchEvent(new Event("resize"));
  }

  function syncButton() {
    const nextPlayer = location.pathname === "/watch"
      ? document.querySelector<HTMLElement>("#movie_player") : null;
    if (nextPlayer !== player) {
      setFullWindow(false);
      button?.remove();
      button = null;
      player = nextPlayer;
    }
    const fullscreen = player?.querySelector(".ytp-fullscreen-button");
    const controls = fullscreen?.parentElement ?? player?.querySelector(".ytp-right-controls");
    if (!controls || (button && controls.contains(button))) return;
    button?.remove();
    button = document.createElement("button");
    button.className = "ytp-button ytfw-button";
    button.type = "button";
    button.setAttribute("aria-pressed", String(document.documentElement.classList.contains(activeClass)));
    const label = document.documentElement.classList.contains(activeClass)
      ? "Exit full window (Esc)" : "Full window";
    button.setAttribute("aria-label", label);
    button.title = label;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm.5 2a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13z");
    path.setAttribute("fill", "currentColor");
    svg.append(path);
    const arrows = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrows.setAttribute("d", "M9.5 10l2.5-2 2.5 2M9.5 14l2.5 2 2.5-2");
    arrows.setAttribute("fill", "none");
    arrows.setAttribute("stroke", "currentColor");
    arrows.setAttribute("stroke-width", "1.5");
    svg.append(arrows);
    button.append(svg);
    button.addEventListener("click", () => {
      setFullWindow(!document.documentElement.classList.contains(activeClass));
    });
    controls.insertBefore(button, fullscreen ?? null);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.documentElement.classList.contains(activeClass)) {
      setFullWindow(false);
      button?.focus();
    }
  }, { capture: true, signal: listeners.signal });
  document.addEventListener("yt-navigate-start", () => setFullWindow(false), { signal: listeners.signal });
  document.addEventListener("yt-navigate-finish", syncButton, { signal: listeners.signal });
  window.addEventListener("popstate", syncButton, { signal: listeners.signal });
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) setFullWindow(false);
  }, { signal: listeners.signal });
  // shortcut: YouTube has no public controls API; update selectors if its player DOM changes.
  const observer = new MutationObserver(syncButton);
  document.addEventListener("ytfw-dispose", () => {
    observer.disconnect();
    listeners.abort();
    setFullWindow(false);
    button?.remove();
  }, { signal: listeners.signal });
  observer.observe(document.body, { childList: true, subtree: true });
  syncButton();
})();
