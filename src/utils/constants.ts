export const Constants = {
  defaultSpriteName: "default",
} as const;

export const defaultSpriteContent = [
  "<?xml version='1.0' encoding='UTF-8'?>",
  "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>",
  "<defs>", // for semantics: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs
  "</defs>",
  "</svg>",
  "", // trailing newline
].join("\n");
