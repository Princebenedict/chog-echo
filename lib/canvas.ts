// Drawing helpers shared by the meme maker and the Voice DNA card. Browser only.

export const FONT_FILES = {
  anton: "/fonts/anton-latin-400-normal.woff2",
  display: "/fonts/bricolage-grotesque-latin-wght-normal.woff2",
  body: "/fonts/figtree-latin-wght-normal.woff2",
};

export const FAMILY = {
  anton: '"ChogAnton", Impact, "Arial Black", sans-serif',
  display: '"ChogDisplay", system-ui, sans-serif',
  body: '"ChogBody", system-ui, sans-serif',
};

export type Ctx = CanvasRenderingContext2D;

let fontsReady: Promise<void> | null = null;

export function loadCanvasFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      const faces = [
        new FontFace("ChogAnton", `url(${FONT_FILES.anton})`, { weight: "400" }),
        new FontFace("ChogDisplay", `url(${FONT_FILES.display})`, { weight: "200 800" }),
        new FontFace("ChogBody", `url(${FONT_FILES.body})`, { weight: "300 900" }),
      ];
      const results = await Promise.allSettled(faces.map((f) => f.load()));
      for (const r of results) if (r.status === "fulfilled") document.fonts.add(r.value);
    })();
  }
  return fontsReady;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      imageCache.delete(src);
      reject(new Error("image failed to load"));
    };
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawCover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Picture frame used when a Chog has no readable artwork.
export function drawArtPlaceholder(ctx: Ctx, x: number, y: number, w: number, h: number, name: string) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "#8754F6");
  g.addColorStop(1, "#2a1a4d");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(246,240,255,.9)";
  ctx.font = `800 ${Math.round(h * 0.42)}px ${FAMILY.display}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((name.trim()[0] ?? "C").toUpperCase(), x + w / 2, y + h / 2);
  ctx.textBaseline = "alphabetic";
}

export function wrapLines(ctx: Ctx, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(test).width <= maxWidth) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Finds the largest font size that fits the text inside maxLines lines.
export function fitText(
  ctx: Ctx,
  text: string,
  family: string,
  weight: string | number,
  maxWidth: number,
  maxLines: number,
  start: number,
  min: number,
  lineHeightRatio = 1.2,
) {
  let size = start;
  let lines: string[] = [];
  for (; size >= min; size -= 2) {
    ctx.font = `${weight} ${size}px ${family}`;
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length <= maxLines) break;
  }
  size = Math.max(size, min);
  ctx.font = `${weight} ${size}px ${family}`;
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s.,;:!?-]*$/, "")}…`;
  }
  return { size, lines, lineHeight: size * lineHeightRatio };
}

export function drawLines(ctx: Ctx, lines: string[], x: number, y: number, lineHeight: number, align: CanvasTextAlign = "left") {
  ctx.textAlign = align;
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
}

export function drawSpaced(ctx: Ctx, text: string, cx: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("could not export image"))), "image/png");
  });
}

export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyCanvasImage(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await canvasToBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function shareCanvasFile(canvas: HTMLCanvasElement, filename: string, text: string): Promise<boolean> {
  try {
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], filename, { type: "image/png" });
    if (!navigator.canShare || !navigator.canShare({ files: [file] })) return false;
    await navigator.share({ files: [file], text });
    return true;
  } catch {
    return false;
  }
}

export function canShareFiles(): boolean {
  try {
    const probe = new File([new Blob(["x"])], "x.png", { type: "image/png" });
    return typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}
