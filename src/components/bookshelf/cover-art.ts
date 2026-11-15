import { catalog, type CatalogBook } from "./catalog";

const serif = '"Newsreader", "Instrument Serif", "Iowan Old Style", Georgia, serif';
const sans = '"Plus Jakarta Sans", "Inter", Arial, sans-serif';

function seeded(seed: string) {
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an authentic woven buckram book cloth texture on the canvas
 */
function applyClothTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Add micro linen weave noise
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const index = (y * width + x) * 4;
      const noise = (Math.random() - 0.5) * 12;
      const linenH = (y % 6 === 0) ? 6 : -4;
      const linenV = (x % 6 === 0) ? 6 : -4;
      const totalNoise = noise + linenH + linenV;

      data[index] = Math.min(255, Math.max(0, data[index] + totalNoise));
      data[index + 1] = Math.min(255, Math.max(0, data[index + 1] + totalNoise));
      data[index + 2] = Math.min(255, Math.max(0, data[index + 2] + totalNoise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Soft Vignette Shadow along cover edges
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.35,
    width / 2,
    height / 2,
    width * 0.75,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Creates metallic gold foil gradient fill/stroke
 */
function getGoldFoilGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const grad = ctx.createLinearGradient(x, y, x + width, y + height);
  grad.addColorStop(0, "#fce8a6");
  grad.addColorStop(0.25, "#e5c158");
  grad.addColorStop(0.5, "#fff3c4");
  grad.addColorStop(0.75, "#c49a37");
  grad.addColorStop(1, "#eed483");
  return grad;
}

function computeWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 6,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 6,
) {
  const sliced = computeWrappedLines(ctx, text, maxWidth, maxLines);
  sliced.forEach((entry, index) => {
    ctx.fillText(entry, x, y + index * lineHeight);
  });
  return sliced.length;
}

function fitCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped.trimEnd()}…`;
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  width = 4,
) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  book: CatalogBook,
  width: number,
  height: number,
) {
  const random = seeded(book.id);
  ctx.save();

  const gold = getGoldFoilGradient(ctx, 100, 300, width - 200, height - 600);
  ctx.strokeStyle = gold;
  ctx.fillStyle = gold;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (book.motif) {
    case "lattice": {
      const nodes: Array<[number, number]> = [];
      for (let i = 0; i < 28; i += 1) {
        nodes.push([
          120 + random() * (width - 240),
          420 + random() * (height - 620),
        ]);
      }
      ctx.globalAlpha = 0.45;
      nodes.forEach((point, i) => {
        nodes.slice(i + 1).forEach((other) => {
          const distance = Math.hypot(point[0] - other[0], point[1] - other[1]);
          if (distance < 260) strokeLine(ctx, [point, other], 3);
        });
      });
      ctx.globalAlpha = 0.95;
      nodes.forEach(([x, y], index) => {
        ctx.beginPath();
        ctx.arc(x, y, index % 4 === 0 ? 14 : 7, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case "branches": {
      ctx.globalAlpha = 0.85;
      const startX = width * 0.5;
      const startY = height * 0.76;
      function drawBranch(x: number, y: number, angle: number, len: number, depth: number) {
        if (depth === 0) return;
        const endX = x + Math.cos(angle) * len;
        const endY = y + Math.sin(angle) * len;
        strokeLine(ctx, [[x, y], [endX, endY]], depth * 3);
        drawBranch(endX, endY, angle - 0.42 + (random() * 0.15), len * 0.74, depth - 1);
        drawBranch(endX, endY, angle + 0.42 - (random() * 0.15), len * 0.74, depth - 1);
      }
      drawBranch(startX, startY, -Math.PI / 2, 160, 5);
      break;
    }
    case "network": {
      ctx.globalAlpha = 0.75;
      const cols = 7;
      const rows = 9;
      for (let x = 0; x < cols; x += 1) {
        for (let y = 0; y < rows; y += 1) {
          const px = 140 + x * 124;
          const py = 420 + y * 98;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
          if (x < cols - 1) strokeLine(ctx, [[px, py], [px + 124, py]], 2);
          if (y < rows - 1) strokeLine(ctx, [[px, py], [px, py + 98]], 2);
        }
      }
      break;
    }
    case "efficiency":
    default: {
      ctx.globalAlpha = 0.82;
      for (let x = 140; x < width - 100; x += 150) {
        ctx.strokeRect(x, 480, 94, height - 760);
        for (let y = 540; y < height - 280; y += 130) {
          ctx.beginPath();
          ctx.arc(x + 47, y, 28, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
  }
  ctx.restore();
}

export function createFrontCover(
  book: CatalogBook,
  width = 900,
  height = 1350,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  applyClothTexture(ctx, width, height, book.cover);

  const gold = getGoldFoilGradient(ctx, 40, 40, width - 80, height - 80);
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  ctx.strokeStyle = gold;
  ctx.lineWidth = 16;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.lineWidth = 3;
  ctx.strokeRect(72, 72, width - 144, height - 144);

  const cornerSize = 40;
  const corners = [
    [88, 88],
    [width - 88, 88],
    [width - 88, height - 88],
    [88, height - 88],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, cornerSize, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ctx.restore();

  drawMotif(ctx, book, width, height);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = gold;
  ctx.textAlign = "left";
  ctx.font = `700 96px ${serif}`;
  const linesUsed = wrapText(ctx, book.title, 110, 195, width - 220, 104, 4);

  ctx.font = `600 36px ${sans}`;
  wrapText(ctx, book.author.toUpperCase(), 110, 225 + linesUsed * 104, width - 220, 46, 2);

  ctx.font = `400 34px ${serif}`;
  wrapText(ctx, book.description, 110, height - 240, width - 220, 46, 4);
  ctx.restore();

  return canvas;
}

export function createTitleDecal(
  book: CatalogBook,
  width = 900,
  height = 1350,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const gold = getGoldFoilGradient(ctx, 100, 100, width - 200, height - 200);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = gold;
  ctx.font = `700 96px ${serif}`;
  const linesUsed = wrapText(ctx, book.title, 110, 195, width - 220, 104, 4);

  ctx.font = `600 36px ${sans}`;
  wrapText(ctx, book.author.toUpperCase(), 110, 225 + linesUsed * 104, width - 220, 46, 2);
  ctx.restore();

  return canvas;
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function createSpineCover(
  book: CatalogBook,
  width = 256,
  height = 1024,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 1. Buckram cloth texture
  applyClothTexture(ctx, width, height, book.cover);

  const gold = getGoldFoilGradient(ctx, 20, 20, width - 40, height - 40);

  // 2. 5 Raised 3D Spine Ribs / Hubs
  const ribRatios = [0.12, 0.28, 0.68, 0.84];
  
  ribRatios.forEach((ratio) => {
    const y = height * ratio;
    
    // Drop shadow under rib
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(20, y + 10, width - 40, 16);

    // Rib body (raised leather band)
    const bandGrad = ctx.createLinearGradient(0, y - 12, 0, y + 12);
    bandGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
    bandGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.1)");
    bandGrad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = bandGrad;
    ctx.fillRect(16, y - 12, width - 32, 24);

    // Top highlight line
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillRect(20, y - 12, width - 40, 3);
  });

  // 3. Gold Foliated Borders & Filigree on Compartments
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  // Top Compartment: Monogram Crest
  ctx.fillStyle = gold;
  ctx.textAlign = "center";
  ctx.font = `700 38px ${serif}`;
  ctx.fillText("✦  KF  ✦", width / 2, height * 0.068);
  ctx.restore();

  // Main Middle Compartment: Vertical Spine Title & Author
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 3;

  ctx.translate(width * 0.5, height * 0.48);
  ctx.rotate(Math.PI / 2);

  ctx.fillStyle = gold;
  ctx.textAlign = "center";
  ctx.font = `700 48px ${serif}`;
  ctx.fillText((book.shortTitle || book.title).toUpperCase(), 0, -6);

  ctx.font = `600 22px ${sans}`;
  ctx.fillText(book.author.toUpperCase(), 0, 36);

  ctx.restore();

  // Bottom Volume Stamp Compartment
  const bookIdx = catalog.findIndex((b) => b.id === book.id);
  const romanVol = ROMAN_NUMERALS[bookIdx >= 0 ? bookIdx : 0] || "I";
  const editionVol = bookIdx >= 0 ? ROMAN_NUMERALS[bookIdx] || "I" : "I";

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = gold;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;

  const tailTop = height * 0.84 + 18;
  const tailHeight = height - tailTop - 32;
  ctx.strokeRect(28, tailTop, width - 56, tailHeight);

  ctx.textAlign = "center";
  ctx.font = `700 28px ${serif}`;
  ctx.fillText(`VOL. ${romanVol}`, width * 0.5, tailTop + tailHeight * 0.52);

  ctx.font = `600 16px ${sans}`;
  ctx.fillText(`EDITION ${editionVol}`, width * 0.5, tailTop + tailHeight * 0.82);
  ctx.restore();

  return canvas;
}

export function createBackCover(
  book: CatalogBook,
  width = 384,
  height = 576,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  applyClothTexture(ctx, width, height, book.cover);

  ctx.save();
  ctx.scale(width / 600, height / 900);
  const gold = getGoldFoilGradient(ctx, 40, 40, 520, 820);

  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;

  ctx.strokeStyle = gold;
  ctx.lineWidth = 10;
  ctx.strokeRect(48, 48, 504, 804);

  ctx.fillStyle = gold;
  ctx.textAlign = "center";
  ctx.font = `italic 42px ${serif}`;
  wrapText(ctx, `“${book.quote}”`, 300, 396, 340, 60, 5);

  ctx.font = `600 30px ${sans}`;
  ctx.fillText(`— ${book.quoteBy.toUpperCase()}`, 300, 594);

  ctx.restore();

  return canvas;
}

const mono = '"Geist Mono", "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

/**
 * Renders a warm Chalk cotton archival paper base with realistic spine gutter & vignette
 */
function drawPaperBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gutterSide: "left" | "right",
) {
  // Warm Chalk editorial rag paper
  ctx.fillStyle = "#f4ecdc";
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural drafting paper grain
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 24) {
    const noise = (Math.random() - 0.5) * 6;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Spine binding gutter shadow
  const gutterWidth = 104;
  let gutter: CanvasGradient;
  if (gutterSide === "right") {
    gutter = ctx.createLinearGradient(width - gutterWidth, 0, width, 0);
    gutter.addColorStop(0, "rgba(38, 28, 20, 0)");
    gutter.addColorStop(0.72, "rgba(38, 28, 20, 0.14)");
    gutter.addColorStop(1, "rgba(38, 28, 20, 0.34)");
    ctx.fillStyle = gutter;
    ctx.fillRect(width - gutterWidth, 0, gutterWidth, height);
  } else {
    gutter = ctx.createLinearGradient(0, 0, gutterWidth, 0);
    gutter.addColorStop(0, "rgba(38, 28, 20, 0.34)");
    gutter.addColorStop(0.28, "rgba(38, 28, 20, 0.14)");
    gutter.addColorStop(1, "rgba(38, 28, 20, 0)");
    ctx.fillStyle = gutter;
    ctx.fillRect(0, 0, gutterWidth, height);
  }

  // Soft edge vignette
  const borderVignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.45,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72,
  );
  borderVignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  borderVignette.addColorStop(1, "rgba(38, 28, 20, 0.07)");
  ctx.fillStyle = borderVignette;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draws a crisp circular Amaranth archival seal stamp
 */
function drawSealStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  _text: string,
  serial: string,
) {
  ctx.save();
  ctx.translate(x, y);

  const stampColor = "rgba(147, 59, 91, 0.88)";
  ctx.strokeStyle = stampColor;
  ctx.fillStyle = stampColor;

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, radius - 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = `700 ${Math.round(radius * 0.17)}px ${sans}`;
  ctx.fillText("ARCHIVUM CODEX", 0, -radius * 0.36);

  ctx.font = `700 ${Math.round(radius * 0.39)}px ${serif}`;
  ctx.fillText("KF", 0, radius * 0.12);

  ctx.font = `600 ${Math.round(radius * 0.14)}px ${mono}`;
  ctx.fillText(fitCanvasText(ctx, serial, radius * 1.35), 0, radius * 0.52);

  ctx.restore();
}

const figureImageCache = new Map<string, HTMLImageElement>();

/**
 * Draws a legible, high-contrast system architecture diagram card
 */
function drawTechnicalFigure(
  ctx: CanvasRenderingContext2D,
  figure: {
    figureNumber?: string;
    caption: string;
    type?: string;
    title?: string;
    imageUrl?: string;
    nodes?: Array<{ label: string; sub?: string; x?: number; y?: number; w?: number; h?: number; color?: string }>;
    connections?: Array<{ from: number; to: number; label?: string }>;
  },
  x: number,
  y: number,
  w: number,
  h: number,
  onUpdate?: () => void,
) {
  ctx.save();

  ctx.fillStyle = "#faf5ea";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(147, 59, 91, 0.36)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Subtle architectural grid
  ctx.strokeStyle = "rgba(147, 59, 91, 0.06)";
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let gx = x + gridSize; gx < x + w; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y + gridSize; gy < y + h; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }

  const bannerH = 44;
  if (figure.title) {
    ctx.fillStyle = "rgba(147, 59, 91, 0.08)";
    ctx.fillRect(x, y, w, bannerH);
    ctx.strokeStyle = "rgba(147, 59, 91, 0.25)";
    ctx.beginPath();
    ctx.moveTo(x, y + bannerH);
    ctx.lineTo(x + w, y + bannerH);
    ctx.stroke();

    ctx.font = `700 17px ${mono}`;
    ctx.fillStyle = "#933B5B";
    ctx.textAlign = "left";
    ctx.fillText(fitCanvasText(ctx, `SYS.FIG // ${figure.title}`, w - 36), x + 18, y + 28);
  }

  const renderVectorNodes = () => {
    if (!figure.nodes || figure.nodes.length === 0) {
      ctx.strokeStyle = "rgba(43, 37, 32, 0.22)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(x + 28, y + bannerH + 22, w - 56, h - bannerH - 44);
      ctx.setLineDash([]);
      ctx.font = `600 18px ${mono}`;
      ctx.fillStyle = "rgba(43, 37, 32, 0.55)";
      ctx.textAlign = "center";
      ctx.fillText("ARCHIVAL SCHEMATIC SPECIFICATION", x + w * 0.5, y + h * 0.5 + 8);
      return;
    }

    const nodeCount = figure.nodes.length;
    const padding = 24;
    const gap = 36;
    const availW = w - padding * 2;
    const boxW = Math.min(200, (availW - (nodeCount - 1) * gap) / nodeCount);
    const boxH = 98;
    const centerY = y + bannerH + (h - bannerH) * 0.52;

    const computedPositions = figure.nodes.map((node, i) => {
      const step = (availW - boxW) / Math.max(1, nodeCount - 1);
      const nx = x + padding + i * step;
      const ny = centerY - boxH * 0.5;
      return { x: nx, y: ny, w: boxW, h: boxH, node };
    });

    if (figure.connections) {
      figure.connections.forEach((conn) => {
        const from = computedPositions[conn.from];
        const to = computedPositions[conn.to];
        if (!from || !to) return;

        const startX = from.x + from.w;
        const startY = from.y + from.h * 0.5;
        const endX = to.x;
        const endY = to.y + to.h * 0.5;

        ctx.strokeStyle = "#4d433b";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.fillStyle = "#4d433b";
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 10, endY - 6);
        ctx.lineTo(endX - 10, endY + 6);
        ctx.closePath();
        ctx.fill();

        if (conn.label) {
          ctx.font = `700 14px ${mono}`;
          ctx.fillStyle = "#933B5B";
          ctx.textAlign = "center";
          ctx.fillText(conn.label, (startX + endX) * 0.5, startY - 11);
        }
      });
    }

    computedPositions.forEach(({ x: bx, y: by, w: bw, h: bh, node }) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = node.color || "#933B5B";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = node.color || "#933B5B";
      ctx.fillRect(bx, by, bw, 7);

      ctx.textAlign = "center";
      ctx.font = `700 18px ${sans}`;
      ctx.fillStyle = "#231d19";
      ctx.fillText(fitCanvasText(ctx, node.label, bw - 16), bx + bw * 0.5, by + 48);

      if (node.sub) {
        ctx.font = `600 14px ${mono}`;
        ctx.fillStyle = "rgba(43, 37, 32, 0.72)";
        ctx.fillText(fitCanvasText(ctx, node.sub, bw - 16), bx + bw * 0.5, by + 76);
      }
    });
  };

  if (figure.imageUrl) {
    const drawImgOntoCanvas = (img: HTMLImageElement) => {
      const topY = figure.title ? y + bannerH + 8 : y + 10;
      const boxH = figure.title ? h - bannerH - 18 : h - 20;
      const boxW = w - 20;
      const boxX = x + 10;

      const imgAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
      const targetAspect = boxW / Math.max(1, boxH);
      let dw = boxW;
      let dh = boxH;
      let dx = boxX;
      let dy = topY;

      if (imgAspect > targetAspect) {
        dh = boxW / imgAspect;
        dy = topY + (boxH - dh) * 0.5;
      } else {
        dw = boxH * imgAspect;
        dx = boxX + (boxW - dw) * 0.5;
      }

      ctx.save();
      ctx.fillStyle = "rgba(40, 30, 20, 0.04)";
      ctx.fillRect(boxX, topY, boxW, boxH);
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.strokeStyle = "rgba(45, 36, 26, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx, dy, dw, dh);
      ctx.restore();
    };

    const cached = figureImageCache.get(figure.imageUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      drawImgOntoCanvas(cached);
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = figure.imageUrl;
      img.onload = () => {
        figureImageCache.set(figure.imageUrl!, img);
        drawImgOntoCanvas(img);
        onUpdate?.();
      };
      img.onerror = () => {
        renderVectorNodes();
        onUpdate?.();
      };
    }
  } else {
    renderVectorNodes();
  }

  ctx.restore();

  ctx.font = `italic 20px ${serif}`;
  ctx.fillStyle = "rgba(43, 37, 32, 0.78)";
  ctx.textAlign = "left";
  const captionPrefix = figure.figureNumber ? `${figure.figureNumber}: ` : "Figure 1: ";
  wrapText(ctx, `${captionPrefix}${figure.caption}`, x, y + h + 28, w, 26, 2);
}

/**
 * Draws a crisp, properly fitted benchmark comparison table with zero column overflow
 */
function drawBenchmarkTable(
  ctx: CanvasRenderingContext2D,
  table: {
    title: string;
    headers: [string, string, string];
    rows: Array<[string, string, string]>;
  },
  x: number,
  y: number,
  w: number,
): number {
  ctx.save();

  ctx.font = `700 18px ${mono}`;
  ctx.fillStyle = "#933B5B";
  ctx.textAlign = "left";
  ctx.fillText(fitCanvasText(ctx, table.title.toUpperCase(), w), x, y);

  const tableTop = y + 18;
  const rowHeight = 52;
  const col1W = w * 0.35;
  const col2W = w * 0.29;
  const col3W = w - col1W - col2W;
  const pad = 14;

  ctx.fillStyle = "rgba(147, 59, 91, 0.08)";
  ctx.fillRect(x, tableTop, w, rowHeight);
  ctx.strokeStyle = "rgba(147, 59, 91, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, tableTop);
  ctx.lineTo(x + w, tableTop);
  ctx.moveTo(x, tableTop + rowHeight);
  ctx.lineTo(x + w, tableTop + rowHeight);
  ctx.stroke();

  ctx.font = `700 16.5px ${sans}`;
  ctx.fillStyle = "#231d19";
  ctx.textAlign = "left";
  ctx.fillText(fitCanvasText(ctx, table.headers[0], col1W - pad * 1.5), x + pad, tableTop + 32);
  ctx.fillText(fitCanvasText(ctx, table.headers[1], col2W - pad * 1.5), x + col1W + pad, tableTop + 32);
  ctx.fillText(fitCanvasText(ctx, table.headers[2], col3W - pad * 1.5), x + col1W + col2W + pad, tableTop + 32);

  let rowY = tableTop + rowHeight;
  table.rows.slice(0, 4).forEach((row, idx) => {
    if (idx % 2 === 1) {
      ctx.fillStyle = "rgba(43, 37, 32, 0.035)";
      ctx.fillRect(x, rowY, w, rowHeight);
    }

    ctx.font = `600 19.5px ${serif}`;
    ctx.fillStyle = "#231d19";
    ctx.textAlign = "left";
    ctx.fillText(fitCanvasText(ctx, row[0], col1W - pad * 1.5), x + pad, rowY + 33);

    ctx.font = `500 16.5px ${mono}`;
    ctx.fillStyle = "rgba(43, 37, 32, 0.72)";
    ctx.fillText(fitCanvasText(ctx, row[1], col2W - pad * 1.5), x + col1W + pad, rowY + 33);

    ctx.font = `700 16.5px ${mono}`;
    ctx.fillStyle = "#2b5b3f";
    ctx.fillText(fitCanvasText(ctx, row[2], col3W - pad * 1.5), x + col1W + col2W + pad, rowY + 33);

    ctx.strokeStyle = "rgba(43, 37, 32, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, rowY + rowHeight);
    ctx.lineTo(x + w, rowY + rowHeight);
    ctx.stroke();

    rowY += rowHeight;
  });

  ctx.strokeStyle = "rgba(147, 59, 91, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, rowY);
  ctx.lineTo(x + w, rowY);
  ctx.stroke();

  ctx.restore();
  return rowY;
}

/**
 * Creates the inside left cover (Folio Reverso) with Monograph Specification, Architectural Frontispiece & Seal
 */
/**
 * Creates the inside left cover (Folio Reverso) with high-legibility monograph brief, topology & seal
 */
export function createInsideCover(
  book: CatalogBook,
  width = 1120,
  height = 1750,
  onUpdate?: () => void,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  drawPaperBase(ctx, width, height, "right");

  const paper = book.paper;
  const leftSpec = paper?.leftPage;
  const logicalW = 1120;
  const logicalH = 1750;

  ctx.save();
  if (width !== logicalW || height !== logicalH) {
    ctx.scale(width / logicalW, height / logicalH);
  }

  // Architectural outer border with Amaranth hairline corners
  const margin = 52;
  ctx.strokeStyle = "rgba(43, 37, 32, 0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(margin, margin, logicalW - margin * 2, logicalH - margin * 2);

  ctx.strokeStyle = "rgba(147, 59, 91, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(margin + 12, margin + 12, logicalW - (margin + 12) * 2, logicalH - (margin + 12) * 2);

  // Corner architectural bracket ticks
  const tickLen = 22;
  ctx.strokeStyle = "#933B5B";
  ctx.lineWidth = 3;
  [
    [margin + 12, margin + 12, 1, 1],
    [logicalW - margin - 12, margin + 12, -1, 1],
    [logicalW - margin - 12, logicalH - margin - 12, -1, -1],
    [margin + 12, logicalH - margin - 12, 1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * tickLen);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * tickLen, cy);
    ctx.stroke();
  });

  const padX = 96;
  const innerW = logicalW - padX * 2;

  // Top Header Lockup
  ctx.textAlign = "center";
  ctx.font = `700 17px ${mono}`;
  ctx.fillStyle = "#933B5B";
  ctx.fillText(
    fitCanvasText(ctx, `[ ${leftSpec?.header || "ARCHIVUM CODEX · MONOGRAPH BRIEF"} ]`, innerW),
    logicalW * 0.5,
    118,
  );

  ctx.font = `700 46px ${serif}`;
  ctx.fillStyle = "#211b17";
  ctx.fillText(fitCanvasText(ctx, book.shortTitle.toUpperCase(), innerW), logicalW * 0.5, 174);

  ctx.font = `italic 22px ${serif}`;
  ctx.fillStyle = "rgba(43, 37, 32, 0.72)";
  ctx.fillText("Kirren Fraginal · Systems Engineering & Software Architecture", logicalW * 0.5, 212);

  // Pull Quote Card
  const quoteY = 248;
  const quoteH = 152;
  ctx.fillStyle = "rgba(147, 59, 91, 0.065)";
  ctx.fillRect(padX, quoteY, innerW, quoteH);
  ctx.strokeStyle = "rgba(147, 59, 91, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padX, quoteY, innerW, quoteH);
  ctx.fillStyle = "#933B5B";
  ctx.fillRect(padX, quoteY, 6, quoteH);

  ctx.fillStyle = "#211b17";
  ctx.font = `italic 27px ${serif}`;
  ctx.textAlign = "center";
  wrapText(ctx, `“${book.quote}”`, logicalW * 0.5, quoteY + 56, innerW - 72, 36, 2);

  ctx.font = `700 15px ${mono}`;
  ctx.fillStyle = "#933B5B";
  ctx.fillText(`— ${book.quoteBy.toUpperCase()}`, logicalW * 0.5, quoteY + 128);

  // System Specification Matrix
  let curY = 448;
  ctx.textAlign = "left";
  ctx.font = `700 18px ${mono}`;
  ctx.fillStyle = "#933B5B";
  ctx.fillText("01 // SYSTEM SPECIFICATION MATRIX", padX, curY);

  ctx.strokeStyle = "rgba(147, 59, 91, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, curY + 12);
  ctx.lineTo(padX + innerW, curY + 12);
  ctx.stroke();

  const rawRows = leftSpec?.specTable || [
    ["CATALOG ID", book.id.toUpperCase()],
    ["ARCHITECTURE", book.format],
    ["AVAILABILITY", book.availability],
    ["STATUS", "Active & Verified Production Spec"],
  ];
  const specRows = rawRows.slice(0, 4);

  curY += 50;
  specRows.forEach(([label, value]) => {
    ctx.font = `700 17px ${mono}`;
    ctx.fillStyle = "rgba(43, 37, 32, 0.68)";
    ctx.fillText(fitCanvasText(ctx, label, 250), padX, curY);

    ctx.font = `600 22px ${serif}`;
    ctx.fillStyle = "#211b17";
    ctx.fillText(fitCanvasText(ctx, value, innerW - 270), padX + 270, curY);

    ctx.strokeStyle = "rgba(43, 37, 32, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, curY + 16);
    ctx.lineTo(padX + innerW, curY + 16);
    ctx.stroke();

    curY += 54;
  });

  // Architectural Overview
  curY += 22;
  ctx.font = `700 18px ${mono}`;
  ctx.fillStyle = "#933B5B";
  ctx.fillText(`02 // ${leftSpec?.overviewTitle || "ARCHITECTURAL OVERVIEW"}`, padX, curY);

  ctx.strokeStyle = "rgba(147, 59, 91, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, curY + 12);
  ctx.lineTo(padX + innerW, curY + 12);
  ctx.stroke();

  const overviewText = leftSpec?.overviewText || book.description;
  ctx.font = `400 25px ${serif}`;
  ctx.fillStyle = "#231d19";
  const overviewLines = wrapText(ctx, overviewText, padX, curY + 50, innerW, 35, 3);
  curY += 50 + overviewLines * 35 + 24;

  // High-Legibility Architecture Schematic Box
  const schematicH = 290;
  drawTechnicalFigure(
    ctx,
    leftSpec?.architectureDiagram || {
      figureNumber: "Figure 0",
      caption: "High-level architectural topology, event pipelines, and subsystem integration boundaries.",
      title: "SYSTEM TOPOLOGY & INTEGRATION BLUEPRINT",
      nodes: [
        { label: "Client Layer", sub: "DOM / Events", x: 60, y: 50, color: "#933B5B" },
        { label: "Core Pipeline", sub: "State / Logic", x: 260, y: 50, color: "#2d4a6f" },
        { label: "Persistence", sub: "Journal / WAL", x: 460, y: 50, color: "#385141" },
        { label: "Verification", sub: "QA Telemetry", x: 660, y: 50, color: "#7a5432" },
      ],
      connections: [
        { from: 0, to: 1, label: "Stream" },
        { from: 1, to: 2, label: "Commit" },
        { from: 1, to: 3, label: "Audit" },
      ],
    },
    padX,
    curY,
    innerW,
    schematicH,
    onUpdate,
  );

  // Certified Amaranth Archival Seal Stamp anchored cleanly near footer
  const sealY = logicalH - 210;
  drawSealStamp(
    ctx,
    logicalW * 0.5,
    sealY,
    94,
    leftSpec?.sealText || "CERTIFIED ARCHITECTURE · VERIFIED",
    leftSpec?.sealSerial || `SPEC-2025-${book.id.slice(0, 4).toUpperCase()}`,
  );

  ctx.font = `600 16px ${mono}`;
  ctx.fillStyle = "rgba(43, 37, 32, 0.58)";
  ctx.textAlign = "center";
  ctx.fillText("FOLIO REVERSO · ARCHITECTURAL SPECIFICATION", logicalW * 0.5, logicalH - 74);

  ctx.restore();
  return canvas;
}

/**
 * Creates the right page (Folio Recto) as a high-legibility single-column editorial technical monograph
 */
export function createFirstPage(
  book: CatalogBook,
  width = 1120,
  height = 1750,
  onUpdate?: () => void,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  drawPaperBase(ctx, width, height, "left");

  const paper = book.paper;
  const logicalW = 1120;
  const logicalH = 1750;
  ctx.save();
  if (width !== logicalW || height !== logicalH) {
    ctx.scale(width / logicalW, height / logicalH);
  }

  const marginX = 82;
  const contentW = logicalW - marginX * 2;
  const maxContentBottom = logicalH - 108;

  // 1. Running Header
  const headerY = 78;
  ctx.fillStyle = "rgba(43, 37, 32, 0.72)";
  ctx.font = `700 16px ${mono}`;
  ctx.textAlign = "left";
  ctx.fillText(
    fitCanvasText(ctx, paper?.volumeFolio || "FOLIO 01 / RECTO", contentW * 0.52),
    marginX,
    headerY,
  );

  ctx.textAlign = "right";
  ctx.fillStyle = "#933B5B";
  ctx.fillText("[ ARCHITECTURAL MONOGRAPH ]", logicalW - marginX, headerY);

  ctx.strokeStyle = "rgba(147, 59, 91, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, headerY + 14);
  ctx.lineTo(logicalW - marginX, headerY + 14);
  ctx.stroke();

  // 2. Title, Subtitle & Author
  let curY = headerY + 64;
  const titleText = paper?.paperTitle || book.title;
  ctx.fillStyle = "#211b17";
  ctx.font = `700 42px ${serif}`;
  ctx.textAlign = "left";
  const titleLines = wrapText(ctx, titleText, marginX, curY, contentW, 50, 3);
  curY += titleLines * 50 + 6;

  if (paper?.paperSubtitle) {
    ctx.font = `italic 23px ${serif}`;
    ctx.fillStyle = "rgba(43, 37, 32, 0.76)";
    const subLines = wrapText(ctx, paper.paperSubtitle, marginX, curY, contentW, 30, 2);
    curY += subLines * 30 + 10;
  }

  ctx.font = `700 17px ${mono}`;
  ctx.fillStyle = "#385141";
  ctx.fillText(
    fitCanvasText(ctx, `${book.author.toUpperCase()}  ·  ${paper?.date || "2025–2026"}`, contentW),
    marginX,
    curY + 8,
  );
  curY += 34;

  // 3. Executive Abstract Card (Dynamic Height)
  const abstractText = paper?.abstract || book.description;
  ctx.font = `400 24px ${serif}`;
  const abstractLines = computeWrappedLines(ctx, abstractText, contentW - 52, 4);
  const abstractBodyH = abstractLines.length * 34;
  const hasKeywords = Boolean(paper?.keywords && paper.keywords.length > 0);
  const abstractBoxH = 44 + abstractBodyH + (hasKeywords ? 48 : 22);

  ctx.fillStyle = "rgba(147, 59, 91, 0.06)";
  ctx.fillRect(marginX, curY, contentW, abstractBoxH);
  ctx.strokeStyle = "rgba(147, 59, 91, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(marginX, curY, contentW, abstractBoxH);
  ctx.fillStyle = "#933B5B";
  ctx.fillRect(marginX, curY, 6, abstractBoxH);

  ctx.font = `700 16px ${mono}`;
  ctx.fillStyle = "#933B5B";
  ctx.fillText("ABSTRACT // EXECUTIVE SUMMARY", marginX + 24, curY + 28);

  ctx.font = `400 24px ${serif}`;
  ctx.fillStyle = "#211b17";
  abstractLines.forEach((line, idx) => {
    ctx.fillText(line, marginX + 24, curY + 62 + idx * 34);
  });

  if (hasKeywords && paper?.keywords) {
    let pillX = marginX + 24;
    const pillY = curY + 62 + abstractBodyH + 4;
    ctx.font = `600 15px ${mono}`;
    for (const kw of paper.keywords.slice(0, 4)) {
      const label = kw.toUpperCase();
      const pillW = ctx.measureText(label).width + 20;
      if (pillX + pillW > marginX + contentW - 18) break;
      ctx.fillStyle = "rgba(170, 186, 174, 0.34)";
      ctx.fillRect(pillX, pillY, pillW, 28);
      ctx.strokeStyle = "rgba(56, 81, 65, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pillX, pillY, pillW, 28);
      ctx.fillStyle = "#2c4234";
      ctx.fillText(label, pillX + 10, pillY + 19);
      pillX += pillW + 10;
    }
  }

  curY += abstractBoxH + 34;

  // 4. Primary Section Narrative (Single Column — Effortlessly Readable!)
  const section1 = paper?.sections?.[0];
  ctx.font = `700 19px ${mono}`;
  ctx.fillStyle = "#933B5B";
  ctx.fillText(
    fitCanvasText(
      ctx,
      `${section1?.sectionNumber || "I"}. ${(section1?.heading || "SYSTEM ARCHITECTURE").toUpperCase()}`,
      contentW,
    ),
    marginX,
    curY,
  );

  ctx.strokeStyle = "rgba(147, 59, 91, 0.32)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, curY + 10);
  ctx.lineTo(marginX + contentW, curY + 10);
  ctx.stroke();

  curY += 44;

  const p1 = section1?.paragraphs?.[0] || book.description;
  const dropLetter = p1.charAt(0);
  const p1Words = p1.slice(1).split(/\s+/);

  const dropSize = 66;
  const dropIndent = 58;
  ctx.fillStyle = "#933B5B";
  ctx.font = `700 ${dropSize}px ${serif}`;
  ctx.fillText(dropLetter, marginX, curY + dropSize * 0.72);

  // Measure and lay out first 2 indented lines cleanly alongside Drop Cap, then continue full width
  ctx.font = `400 24px ${serif}`;
  ctx.fillStyle = "#211b17";
  let line1 = "";
  let line2 = "";
  let consumed = 0;

  for (let i = 0; i < p1Words.length; i++) {
    const test = line1 ? `${line1} ${p1Words[i]}` : p1Words[i];
    if (ctx.measureText(test).width > contentW - dropIndent && line1) break;
    line1 = test;
    consumed = i + 1;
  }
  for (let i = consumed; i < p1Words.length; i++) {
    const test = line2 ? `${line2} ${p1Words[i]}` : p1Words[i];
    if (ctx.measureText(test).width > contentW - dropIndent && line2) break;
    line2 = test;
    consumed = i + 1;
  }

  if (line1) ctx.fillText(line1, marginX + dropIndent, curY + 20);
  if (line2) ctx.fillText(line2, marginX + dropIndent, curY + 55);

  const remainingText = p1Words.slice(consumed).join(" ");
  let usedLines = 2;
  if (remainingText) {
    const restCount = wrapText(ctx, remainingText, marginX, curY + 90, contentW, 35, 3);
    usedLines += restCount;
  }

  curY += usedLines * 35 + 26;

  // Specification Callout Card
  if (section1?.callout && curY + 120 < maxContentBottom) {
    const callout = section1.callout;
    ctx.font = `italic 22px ${serif}`;
    const cLines = computeWrappedLines(ctx, callout.text, contentW - 44, 3);
    const calloutH = 48 + cLines.length * 30;

    ctx.fillStyle = "rgba(43, 37, 32, 0.04)";
    ctx.fillRect(marginX, curY, contentW, calloutH);
    ctx.strokeStyle = "rgba(147, 59, 91, 0.36)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(marginX, curY, contentW, calloutH);
    ctx.fillStyle = "#933B5B";
    ctx.fillRect(marginX, curY, 5, calloutH);

    ctx.font = `700 16px ${mono}`;
    ctx.fillStyle = "#933B5B";
    ctx.fillText(fitCanvasText(ctx, callout.title.toUpperCase(), contentW - 44), marginX + 20, curY + 26);

    ctx.font = `italic 22px ${serif}`;
    ctx.fillStyle = "#211b17";
    cLines.forEach((line, idx) => {
      ctx.fillText(line, marginX + 20, curY + 58 + idx * 30);
    });

    curY += calloutH + 28;
  }

  // 5. Full-Width Verified Benchmark Table (never overlaps or clips)
  if (paper?.benchmarkTable && curY + 210 < maxContentBottom) {
    const tableBottom = drawBenchmarkTable(ctx, paper.benchmarkTable, marginX, curY, contentW);
    curY = tableBottom + 28;
  }

  // 6. Equation / Formal Guarantee Strip (if vertical room remains)
  const section2 = paper?.sections?.[1];
  if (section2?.equation && curY + 76 < maxContentBottom) {
    const eqH = 66;
    ctx.fillStyle = "rgba(170, 186, 174, 0.2)";
    ctx.fillRect(marginX, curY, contentW, eqH);
    ctx.strokeStyle = "rgba(56, 81, 65, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(marginX, curY, contentW, eqH);

    ctx.font = `italic 23px ${serif}`;
    ctx.fillStyle = "#211b17";
    ctx.textAlign = "left";
    ctx.fillText(fitCanvasText(ctx, section2.equation.tex, contentW - 110), marginX + 24, curY + 41);

    ctx.font = `700 17px ${mono}`;
    ctx.fillStyle = "#385141";
    ctx.textAlign = "right";
    ctx.fillText(section2.equation.number || "(1)", marginX + contentW - 22, curY + 41);
  } else if (section2?.figure && !paper?.benchmarkTable && curY + 240 < maxContentBottom) {
    drawTechnicalFigure(ctx, section2.figure, marginX, curY, contentW, 220, onUpdate);
  }

  // 7. Bottom Running Footer
  const footerY = logicalH - 56;
  ctx.strokeStyle = "rgba(147, 59, 91, 0.3)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, footerY - 22);
  ctx.lineTo(logicalW - marginX, footerY - 22);
  ctx.stroke();

  ctx.font = `600 15px ${mono}`;
  ctx.fillStyle = "rgba(43, 37, 32, 0.65)";
  ctx.textAlign = "left";
  ctx.fillText(`ARCHIVE // ${book.shortTitle.toUpperCase()}`, marginX, footerY);

  ctx.textAlign = "center";
  ctx.fillStyle = "#933B5B";
  ctx.fillText("FOLIO 01", logicalW * 0.5, footerY);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(43, 37, 32, 0.58)";
  ctx.fillText(`SHA:${book.id.replace(/-/g, "").slice(0, 8)}`, logicalW - marginX, footerY);

  ctx.restore();
  return canvas;
}

