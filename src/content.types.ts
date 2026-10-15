export type ScrollPosition = { left: number; top: number };

export type ContentState = {
  player: HTMLElement | null;
  button: HTMLButtonElement | null;
  ancestors: HTMLElement[];
  scrollPosition: ScrollPosition;
};
