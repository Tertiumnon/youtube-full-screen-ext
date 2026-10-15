import { afterEach, expect, test } from "bun:test";
import { Window, type HTMLButtonElement } from "happy-dom";
import { runInNewContext } from "node:vm";

const windows: Window[] = [];
const build = await Bun.build({
  entrypoints: ["src/content.ts"],
  target: "browser",
  format: "iife",
});
if (!build.success)
  throw new AggregateError(build.logs, "Content build failed");
const script = await build.outputs[0].text();

function setup(nestedControls = false) {
  const window = new Window({ url: "https://www.youtube.com/watch?v=test" });
  windows.push(window);
  window.document.body.innerHTML = `<header>Header</header><main><div id="movie_player"><video></video><div class="ytp-right-controls"><button class="ytp-fullscreen-button"></button></div></div><aside>Recommendations</aside></main>`;
  if (nestedControls) {
    window.document.querySelector(".ytp-right-controls")!.innerHTML =
      '<div class="ytp-right-controls-left"></div><div class="ytp-right-controls-right"><button class="ytp-fullscreen-button"></button></div>';
  }
  inject(window);
  return window;
}

function inject(window: Window) {
  runInNewContext(script, {
    window,
    document: window.document,
    location: window.location,
    MutationObserver: window.MutationObserver,
    Event: window.Event,
    AbortController: window.AbortController,
  });
}

afterEach(async () => {
  await Promise.all(windows.splice(0).map((window) => window.happyDOM.close()));
});

test("reinjection replaces the old instance without duplicate buttons or handlers", async () => {
  const window = setup(true);
  window.document.querySelector<HTMLButtonElement>(".ytfw-button")!.click();
  inject(window);
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(window.document.querySelectorAll(".ytfw-button").length).toBe(1);
  expect(window.document.querySelector(".ytfw-active")).toBe(null);
  const button =
    window.document.querySelector<HTMLButtonElement>(".ytfw-button")!;
  button.click();
  expect(
    window.document.documentElement.classList.contains("ytfw-active"),
  ).toBe(true);
  window.document.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape" }),
  );
  expect(window.document.querySelector(".ytfw-active")).toBe(null);
  window.document.querySelector(".ytp-right-controls-right")!.innerHTML =
    '<button class="ytp-fullscreen-button"></button>';
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(window.document.querySelectorAll(".ytfw-button").length).toBe(1);
});

test("button appears beside fullscreen when controls are nested", () => {
  const window = setup(true);
  const button =
    window.document.querySelector<HTMLButtonElement>(".ytfw-button")!;
  expect(button).not.toBe(null);
  expect(button.parentElement?.className).toBe("ytp-right-controls-right");
  expect(button.nextElementSibling?.className).toBe("ytp-fullscreen-button");
  button.click();
  expect(
    window.document.documentElement.classList.contains("ytfw-active"),
  ).toBe(true);
});

test("button toggles window mode, preserves the player and restores with Escape", () => {
  const window = setup();
  const document = window.document;
  const player = document.querySelector("#movie_player");
  const button = document.querySelector<HTMLButtonElement>(".ytfw-button")!;
  window.scrollTo({ top: 300 });
  expect(button.nextElementSibling?.className).toBe("ytp-fullscreen-button");
  button.click();
  expect(document.documentElement.classList.contains("ytfw-active")).toBe(true);
  expect(player?.classList.contains("ytfw-player")).toBe(true);
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(
    document.querySelector("main")?.classList.contains("ytfw-ancestor"),
  ).toBe(true);
  button.click();
  expect(document.querySelector(".ytfw-active")).toBe(null);
  button.click();
  document.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape" }),
  );
  expect(
    document.querySelector(".ytfw-active, .ytfw-ancestor, .ytfw-player"),
  ).toBe(null);
  expect(document.querySelector("#movie_player")).toBe(player);
  expect(document.activeElement).toBe(button);
  expect(window.scrollY).toBe(300);
});

test("navigation resets mode; replaced controls get exactly one button", async () => {
  const window = setup();
  const document = window.document;
  document.querySelector<HTMLButtonElement>(".ytfw-button")!.click();
  document.dispatchEvent(new window.Event("yt-navigate-start"));
  expect(document.querySelector(".ytfw-active")).toBe(null);
  document.querySelector(".ytp-right-controls")!.innerHTML =
    '<button class="ytp-fullscreen-button"></button>';
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(document.querySelectorAll(".ytfw-button").length).toBe(1);
  document.dispatchEvent(new window.Event("yt-navigate-finish"));
  expect(document.querySelectorAll(".ytfw-button").length).toBe(1);
  window.location.href = "https://www.youtube.com/";
  document.dispatchEvent(new window.Event("yt-navigate-finish"));
  expect(document.querySelector(".ytfw-button")).toBe(null);
});
