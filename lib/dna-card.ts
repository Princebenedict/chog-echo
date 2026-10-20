import {
  FAMILY,
  drawArtPlaceholder,
  drawCover,
  drawLines,
  fitText,
  loadCanvasFonts,
  loadImage,
  roundRectPath,
} from "./canvas";
import { AXIS_COLORS, describeEffect } from "./dna-text";
import { AXIS_LABELS, type AxisKey, type Persona } from "./personality";

export const DNA_W = 1080;
export const DNA_H = 1350;

export type DnaInfo = { name: string; imageSrc: string | null; persona: Persona };

// Draws a shareable image of a Chog's Voice DNA from its real traits and derived scores.
export async function renderDnaCard({ name, imageSrc, persona }: DnaInfo): Promise<HTMLCanvasElement> {
  await loadCanvasFonts();
  let img: HTMLImageElement | null = null;
  if (imageSrc) {
    try {
      img = await loadImage(imageSrc);
    } catch {
      img = null;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = DNA_W;
  canvas.height = DNA_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const bg = ctx.createLinearGradient(0, 0, 0, DNA_H);
  bg.addColorStop(0, "#1d1230");
  bg.addColorStop(1, "#10081d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, DNA_W, DNA_H);
  const g1 = ctx.createRadialGradient(160, 120, 20, 160, 120, 760);
  g1.addColorStop(0, "rgba(135,84,246,.5)");
  g1.addColorStop(1, "rgba(135,84,246,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, DNA_W, DNA_H);
  const g2 = ctx.createRadialGradient(980, 1300, 20, 980, 1300, 640);
  g2.addColorStop(0, "rgba(85,240,176,.2)");
  g2.addColorStop(1, "rgba(85,240,176,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, DNA_W, DNA_H);

  ctx.fillStyle = "#F6F0FF";
  ctx.font = `800 40px ${FAMILY.display}`;
  drawLines(ctx, ["Chog"], 80, 100, 0);
  const chogW = ctx.measureText("Chog ").width;
  ctx.fillStyle = "#55F0B0";
  drawLines(ctx, ["Echo"], 80 + chogW, 100, 0);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  roundRectPath(ctx, 80, 150, 320, 320, 60);
  ctx.fillStyle = "#1d1230";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRectPath(ctx, 80, 150, 320, 320, 60);
  ctx.clip();
  if (img) drawCover(ctx, img, 80, 150, 320, 320);
  else drawArtPlaceholder(ctx, 80, 150, 320, 320, name);
  ctx.restore();
  roundRectPath(ctx, 80, 150, 320, 320, 60);
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const title = fitText(ctx, name, FAMILY.display, 800, 560, 1, 64, 36, 1.1);
  ctx.fillStyle = "#F6F0FF";
  drawLines(ctx, title.lines, 440, 250, 0);

  ctx.font = `600 30px ${FAMILY.body}`;
  const pillW = ctx.measureText(persona.archetype).width + 52;
  roundRectPath(ctx, 440, 290, pillW, 58, 29);
  ctx.fillStyle = "rgba(85,240,176,.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(85,240,176,.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#55F0B0";
  drawLines(ctx, [persona.archetype], 466, 330, 0);

  ctx.fillStyle = "#B9A9D1";
  ctx.font = `500 30px ${FAMILY.body}`;
  drawLines(ctx, ["Voice DNA"], 440, 420, 0);

  const axes = Object.keys(AXIS_LABELS) as AxisKey[];
  axes.forEach((axis, i) => {
    const y = 560 + i * 74;
    ctx.fillStyle = "#B9A9D1";
    ctx.font = `500 32px ${FAMILY.body}`;
    drawLines(ctx, [AXIS_LABELS[axis]], 80, y + 8, 0);
    roundRectPath(ctx, 330, y - 14, 670, 24, 12);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fill();
    const w = Math.max(24, (670 * persona.axes[axis]) / 10);
    const bar = ctx.createLinearGradient(330, 0, 330 + w, 0);
    bar.addColorStop(0, `${AXIS_COLORS[axis]}66`);
    bar.addColorStop(1, AXIS_COLORS[axis]);
    roundRectPath(ctx, 330, y - 14, w, 24, 12);
    ctx.fillStyle = bar;
    ctx.fill();
  });

  persona.effects.slice(0, 5).forEach((effect, i) => {
    const y = 976 + i * 70;
    ctx.fillStyle = "#B9A9D1";
    ctx.font = `500 31px ${FAMILY.body}`;
    const label = `${effect.trait.trait_type} `;
    drawLines(ctx, [label], 80, y, 0);
    const labelW = ctx.measureText(label).width;
    ctx.fillStyle = "#F6F0FF";
    ctx.font = `700 31px ${FAMILY.body}`;
    drawLines(ctx, [effect.trait.value], 80 + labelW, y, 0);
    const line = fitText(ctx, describeEffect(effect).detail, FAMILY.body, 400, 920, 1, 27, 20, 1.2);
    ctx.fillStyle = "rgba(246,240,255,.72)";
    drawLines(ctx, line.lines, 80, y + 34, 0);
  });

  return canvas;
}
