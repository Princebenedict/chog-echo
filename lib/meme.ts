import {
  FAMILY,
  drawArtPlaceholder,
  drawCover,
  drawLines,
  drawSpaced,
  fitText,
  loadCanvasFonts,
  loadImage,
  roundRectPath,
  type Ctx,
} from "./canvas";
import { AXIS_LABELS, type AxisKey, type Persona } from "./personality";
import type { ChogToken } from "./types";

export type MemeLayoutId = "classic" | "poster" | "post" | "decree" | "burst" | "deadpan";

export type MemeSpec = {
  layout: MemeLayoutId;
  top: string;
  bottom: string;
  caption: string;
  description: string;
};

export type MemeLayout = {
  id: MemeLayoutId;
  label: string;
  hint: string;
  unlock?: { axis: AxisKey; min: number };
};

export const MEME_LAYOUTS: MemeLayout[] = [
  { id: "classic", label: "Classic", hint: "Top and bottom captions over the art" },
  { id: "poster", label: "Poster", hint: "Art on a gradient with a caption card" },
  { id: "post", label: "Post card", hint: "Looks like a social post with the art attached" },
  { id: "decree", label: "Decree", hint: "A gold-framed statement", unlock: { axis: "confidence", min: 8 } },
  { id: "burst", label: "Comic burst", hint: "Loud, tilted, full of energy", unlock: { axis: "chaos", min: 8 } },
  { id: "deadpan", label: "Deadpan", hint: "Quiet and minimal", unlock: { axis: "sarcasm", min: 7 } },
];

export function isUnlocked(layout: MemeLayout, persona: Persona): boolean {
  return !layout.unlock || persona.axes[layout.unlock.axis] >= layout.unlock.min;
}

export function unlockHint(layout: MemeLayout): string {
  if (!layout.unlock) return "";
  return `Unlocks at ${AXIS_LABELS[layout.unlock.axis]} ${layout.unlock.min} or higher`;
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

// Reads the model's JSON answer. Falls back to TOP/BOTTOM lines, then to plain text.
export function parseMeme(raw: string): Omit<MemeSpec, "layout"> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const json = JSON.parse(raw.slice(start, end + 1));
      const top = clip(json.top, 90);
      const bottom = clip(json.bottom, 90);
      const caption = clip(json.caption, 270);
      const description = clip(json.description, 200);
      if (top || bottom || caption) return { top, bottom, caption: caption || [top, bottom].filter(Boolean).join(" "), description };
    } catch {
      // fall through to the text parsers
    }
  }
  const pick = (label: string) => new RegExp(`${label}\\s*:\\s*(.+)`, "i").exec(raw)?.[1]?.trim() ?? "";
  const top = clip(pick("TOP"), 90);
  const bottom = clip(pick("BOTTOM"), 90);
  const description = clip(pick("IMAGE"), 200);
  if (top || bottom) return { top, bottom, caption: [top, bottom].filter(Boolean).join(" "), description };
  const plain = clip(raw, 270);
  return { top: "", bottom: "", caption: plain, description: "" };
}

export function memeImageSrc(token: ChogToken): string | null {
  if (!token.image) return null;
  if (token.isDemo || token.image.startsWith("/")) return token.image;
  return `/api/token-image?tokenId=${encodeURIComponent(token.tokenId)}`;
}

export const MEME_W = 1080;
export const MEME_H = 1350;

type Img = HTMLImageElement | null;
export type MemeInfo = { name: string; archetype: string; imageSrc: string | null };

function drawArt(ctx: Ctx, img: Img, x: number, y: number, w: number, h: number, name: string) {
  if (img) drawCover(ctx, img, x, y, w, h);
  else drawArtPlaceholder(ctx, x, y, w, h, name);
}

function captionOf(spec: MemeSpec) {
  return spec.caption || [spec.top, spec.bottom].filter(Boolean).join(" ");
}

function memeCaption(ctx: Ctx, text: string, edge: number, anchor: "top" | "bottom") {
  const t = text.trim().toUpperCase();
  if (!t) return;
  const { size, lines, lineHeight } = fitText(ctx, t, FAMILY.anton, "400", 980, 3, 118, 54, 1.06);
  const total = lines.length * lineHeight;
  const first = anchor === "top" ? edge + size * 0.92 : edge - total + size * 0.92;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = size / 6;
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#fff";
  lines.forEach((line, i) => {
    const y = first + i * lineHeight;
    ctx.strokeText(line, MEME_W / 2, y);
    ctx.fillText(line, MEME_W / 2, y);
  });
}

function drawClassic(ctx: Ctx, spec: MemeSpec, img: Img, info: MemeInfo) {
  const g = ctx.createLinearGradient(0, 0, 0, MEME_H);
  g.addColorStop(0, "#1d1230");
  g.addColorStop(1, "#10081d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  const y0 = (MEME_H - MEME_W) / 2;
  drawArt(ctx, img, 0, y0, MEME_W, MEME_W, info.name);
  const top = ctx.createLinearGradient(0, y0, 0, y0 + 300);
  top.addColorStop(0, "rgba(0,0,0,.5)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, y0, MEME_W, 300);
  const bottom = ctx.createLinearGradient(0, y0 + MEME_W - 300, 0, y0 + MEME_W);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,.5)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, y0 + MEME_W - 300, MEME_W, 300);
  memeCaption(ctx, spec.top, y0 + 36, "top");
  memeCaption(ctx, spec.bottom, y0 + MEME_W - 36, "bottom");
  ctx.fillStyle = "rgba(246,240,255,.7)";
  ctx.font = `700 30px ${FAMILY.display}`;
  drawLines(ctx, ["Chog Echo"], MEME_W / 2, MEME_H - 52, 0, "center");
}

function drawPoster(ctx: Ctx, spec: MemeSpec, img: Img, info: MemeInfo) {
  const g = ctx.createLinearGradient(0, 0, 0, MEME_H);
  g.addColorStop(0, "#2a1a4d");
  g.addColorStop(1, "#10081d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  const glow = ctx.createRadialGradient(540, 520, 40, 540, 520, 640);
  glow.addColorStop(0, "rgba(135,84,246,.6)");
  glow.addColorStop(1, "rgba(135,84,246,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  ctx.fillStyle = "rgba(246,240,255,.1)";
  for (let y = 20; y < MEME_H; y += 36) for (let x = 20; x < MEME_W; x += 36) if (x + y < 1000) {
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  roundRectPath(ctx, 110, 110, 860, 860, 64);
  ctx.fillStyle = "#1d1230";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRectPath(ctx, 110, 110, 860, 860, 64);
  ctx.clip();
  drawArt(ctx, img, 110, 110, 860, 860, info.name);
  ctx.restore();
  roundRectPath(ctx, 110, 110, 860, 860, 64);
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#F6F0FF";
  ctx.font = `800 34px ${FAMILY.display}`;
  drawLines(ctx, ["Chog Echo"], 110, 80, 0);
  roundRectPath(ctx, 70, 1000, 940, 270, 48);
  ctx.fillStyle = "#EDE5FF";
  ctx.fill();
  ctx.fillStyle = "#5B2FC4";
  ctx.font = `700 30px ${FAMILY.display}`;
  drawLines(ctx, [info.name], 112, 1056, 0);
  const text = fitText(ctx, captionOf(spec), FAMILY.display, 600, 860, 3, 54, 32, 1.18);
  ctx.fillStyle = "#10081D";
  drawLines(ctx, text.lines, 112, 1056 + 14 + text.size, text.lineHeight);
}

function drawPost(ctx: Ctx, spec: MemeSpec, img: Img, info: MemeInfo) {
  ctx.fillStyle = "#10081d";
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  const glow = ctx.createRadialGradient(200, 100, 20, 200, 100, 700);
  glow.addColorStop(0, "rgba(135,84,246,.35)");
  glow.addColorStop(1, "rgba(135,84,246,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  roundRectPath(ctx, 50, 50, 980, 1250, 52);
  ctx.fillStyle = "#1D1230";
  ctx.fill();
  ctx.strokeStyle = "rgba(190,145,255,.2)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 170, 64, 0, Math.PI * 2);
  ctx.clip();
  drawArt(ctx, img, 86, 106, 128, 128, info.name);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(150, 170, 64, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#F6F0FF";
  ctx.font = `700 44px ${FAMILY.display}`;
  drawLines(ctx, [info.name], 240, 166, 0);
  ctx.fillStyle = "#B9A9D1";
  ctx.font = `500 30px ${FAMILY.body}`;
  drawLines(ctx, [info.archetype], 240, 212, 0);

  const text = fitText(ctx, captionOf(spec), FAMILY.body, 500, 880, 6, 56, 34, 1.3);
  ctx.fillStyle = "#F6F0FF";
  drawLines(ctx, text.lines, 100, 320 + text.size * 0.6, text.lineHeight);
  const textEnd = 320 + text.size * 0.6 + text.lines.length * text.lineHeight;
  const artY = Math.max(textEnd + 10, 560);
  const artH = Math.min(1180 - artY, 880);
  ctx.save();
  roundRectPath(ctx, 100, artY, 880, artH, 40);
  ctx.clip();
  drawArt(ctx, img, 100, artY, 880, artH, info.name);
  ctx.restore();
  roundRectPath(ctx, 100, artY, 880, artH, 40);
  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#55F0B0";
  ctx.font = `700 30px ${FAMILY.display}`;
  drawLines(ctx, ["Chog Echo"], 100, 1260, 0);
}

function drawDecree(ctx: Ctx, spec: MemeSpec, img: Img, info: MemeInfo) {
  const g = ctx.createLinearGradient(0, 0, 0, MEME_H);
  g.addColorStop(0, "#241638");
  g.addColorStop(1, "#10081d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  const glow = ctx.createRadialGradient(540, 470, 40, 540, 470, 620);
  glow.addColorStop(0, "rgba(216,180,90,.3)");
  glow.addColorStop(1, "rgba(216,180,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  roundRectPath(ctx, 40, 40, 1000, 1270, 36);
  ctx.strokeStyle = "#D8B45A";
  ctx.lineWidth = 7;
  ctx.stroke();
  roundRectPath(ctx, 64, 64, 952, 1222, 24);
  ctx.strokeStyle = "rgba(216,180,90,.55)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#D8B45A";
  ctx.font = `700 34px ${FAMILY.display}`;
  drawSpaced(ctx, info.name.toUpperCase(), 540, 150, 8);

  ctx.save();
  ctx.beginPath();
  ctx.arc(540, 470, 250, 0, Math.PI * 2);
  ctx.clip();
  drawArt(ctx, img, 290, 220, 500, 500, info.name);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(540, 470, 250, 0, Math.PI * 2);
  ctx.strokeStyle = "#D8B45A";
  ctx.lineWidth = 12;
  ctx.stroke();

  const text = fitText(ctx, captionOf(spec), FAMILY.display, 800, 800, 5, 74, 40, 1.2);
  ctx.fillStyle = "#F6E7B8";
  drawLines(ctx, text.lines, 540, 860 + text.size * 0.4, text.lineHeight, "center");
  ctx.fillStyle = "rgba(216,180,90,.8)";
  ctx.font = `600 26px ${FAMILY.display}`;
  drawSpaced(ctx, "CHOG ECHO", 540, 1240, 10);
}

function drawBurst(ctx: Ctx, spec: MemeSpec, img: Img, info: MemeInfo) {
  ctx.fillStyle = "#6d3fe0";
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  const cx = 540;
  const cy = 560;
  const rays = 28;
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 1) / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * 1500, cy + Math.sin(a0) * 1500);
    ctx.lineTo(cx + Math.cos(a1) * 1500, cy + Math.sin(a1) * 1500);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? "#8754F6" : "#A46CFF";
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,.14)";
  for (let y = 24; y < MEME_H; y += 30) for (let x = 24; x < MEME_W; x += 30) if (y > 900) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(540, 560);
  ctx.rotate(-0.07);
  roundRectPath(ctx, -400 + 18, -400 + 18, 800, 800, 36);
  ctx.fillStyle = "#10081D";
  ctx.fill();
  roundRectPath(ctx, -400, -400, 800, 800, 36);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.save();
  roundRectPath(ctx, -386, -386, 772, 772, 26);
  ctx.clip();
  drawArt(ctx, img, -386, -386, 772, 772, info.name);
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.translate(540, 1130);
  ctx.rotate(0.035);
  roundRectPath(ctx, -450 + 14, -130 + 14, 900, 260, 30);
  ctx.fillStyle = "#10081D";
  ctx.fill();
  roundRectPath(ctx, -450, -130, 900, 260, 30);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#10081D";
  ctx.lineWidth = 8;
  ctx.stroke();
  const text = fitText(ctx, captionOf(spec).toUpperCase(), FAMILY.anton, "400", 820, 3, 92, 44, 1.08);
  ctx.fillStyle = "#10081D";
  drawLines(ctx, text.lines, 0, -((text.lines.length - 1) * text.lineHeight) / 2 + text.size * 0.34, text.lineHeight, "center");
  ctx.restore();
}

function drawDeadpan(ctx: Ctx, spec: MemeSpec, img: Img, info: MemeInfo) {
  ctx.fillStyle = "#0b0614";
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  const v = ctx.createRadialGradient(540, 500, 100, 540, 500, 900);
  v.addColorStop(0, "rgba(135,84,246,.16)");
  v.addColorStop(1, "rgba(11,6,20,0)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, MEME_W, MEME_H);
  ctx.save();
  ctx.beginPath();
  ctx.arc(540, 420, 210, 0, Math.PI * 2);
  ctx.clip();
  drawArt(ctx, img, 330, 210, 420, 420, info.name);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(540, 420, 210, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 3;
  ctx.stroke();
  const text = fitText(ctx, captionOf(spec), FAMILY.body, 400, 820, 6, 60, 34, 1.32);
  ctx.fillStyle = "#F6F0FF";
  drawLines(ctx, text.lines, 540, 800 + text.size * 0.4, text.lineHeight, "center");
  ctx.fillStyle = "#B9A9D1";
  ctx.font = `500 30px ${FAMILY.body}`;
  drawLines(ctx, [info.name], 540, 800 + text.size * 0.4 + text.lines.length * text.lineHeight + 40, 0, "center");
  ctx.fillStyle = "rgba(246,240,255,.45)";
  ctx.font = `600 26px ${FAMILY.display}`;
  drawLines(ctx, ["Chog Echo"], 540, 1280, 0, "center");
}

// Renders to an off-screen canvas so the visible canvas can be swapped in one step with no blank frame.
export async function renderMeme(spec: MemeSpec, info: MemeInfo): Promise<HTMLCanvasElement> {
  await loadCanvasFonts();
  let img: Img = null;
  if (info.imageSrc) {
    try {
      img = await loadImage(info.imageSrc);
    } catch {
      img = null;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = MEME_W;
  canvas.height = MEME_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.textBaseline = "alphabetic";
  switch (spec.layout) {
    case "poster":
      drawPoster(ctx, spec, img, info);
      break;
    case "post":
      drawPost(ctx, spec, img, info);
      break;
    case "decree":
      drawDecree(ctx, spec, img, info);
      break;
    case "burst":
      drawBurst(ctx, spec, img, info);
      break;
    case "deadpan":
      drawDeadpan(ctx, spec, img, info);
      break;
    default:
      drawClassic(ctx, spec, img, info);
  }
  return canvas;
}
