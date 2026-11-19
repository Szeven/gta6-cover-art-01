// The cover composer: it turns one graded photo into a multi-panel GTA-style
// poster. Three layouts, one photo, three ways of looking at it — a wide hero
// panel, two stacked crops, or three vertical scenes — with a heavy title
// band, a sunset sun, and bold poster lettering with a black contour. Every
// name on the cover is invented: the city is Solara City, the game is SOLARA.
// No Rockstar logo, artwork or font is drawn anywhere.

import { gradePanel } from './grade.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const CITY = 'SOLARA CITY';
const YEAR = '2026';

// Shrink a font until the text fits maxWidth. Returns the size used.
function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  while (size > 24) {
    ctx.font = `900 ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 6;
  }
  ctx.font = `900 ${size}px ${family}`;
  return size;
}

const FAMILY = '"Arial Black", Impact, "Franklin Gothic Heavy", sans-serif';

// One poster line: a black contour, a coloured drop shadow, then the white
// face. The contour is what makes lettering read at poster distance.
function posterText(ctx, text, x, y, size, align = 'left', face = '#ffffff') {
  ctx.save();
  ctx.font = `900 ${size}px ${FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, size / 7);
  ctx.strokeStyle = '#0a0614';
  ctx.fillStyle = 'rgba(10,6,20,0.55)';
  ctx.fillText(text, x + size * 0.06, y + size * 0.07);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = face;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// A small caps eyebrow with wide tracking, drawn letter by letter.
function eyebrow(ctx, text, x, y, size, color) {
  ctx.save();
  ctx.font = `800 ${size}px ${FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const step = size * 0.35;
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + step;
  }
  ctx.restore();
}

// The little sunset sun: an orange disc with short rays, the poster's mark.
function sunMark(ctx, x, y, r) {
  ctx.save();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = Math.max(3, r / 6);
  ctx.lineCap = 'round';
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(t) * r * 1.35, y + Math.sin(t) * r * 1.35);
    ctx.lineTo(x + Math.cos(t) * r * 1.8, y + Math.sin(t) * r * 1.8);
    ctx.stroke();
  }
  const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  grad.addColorStop(0, '#ffe08a');
  grad.addColorStop(0.6, '#ff9a3d');
  grad.addColorStop(1, '#ff2e88');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A dark scrim fading up from the bottom, so the title sits on black.
function bottomScrim(ctx, w, h, topFrac) {
  const grad = ctx.createLinearGradient(0, h * topFrac, 0, h);
  grad.addColorStop(0, 'rgba(8,4,18,0)');
  grad.addColorStop(1, 'rgba(8,4,18,0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h * topFrac, w, h * (1 - topFrac));
}

// The title band: a black slab with a neon top edge, title and tagline.
function titleBand(ctx, w, h, y, bandH, title, tagline) {
  ctx.fillStyle = '#0a0614';
  ctx.fillRect(0, y, w, bandH);
  const edge = ctx.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, '#ff2e88');
  edge.addColorStop(0.5, '#ffb347');
  edge.addColorStop(1, '#22d3ee');
  ctx.fillStyle = edge;
  ctx.fillRect(0, y, w, 5);
  const pad = Math.round(w * 0.045);
  const titleSize = fitFont(ctx, title, w - pad * 2, Math.round(bandH * 0.52), FAMILY);
  posterText(ctx, title, pad, y + bandH * 0.52, titleSize, 'left');
  // The city mark sits at the band's right end. Measure it first, then fit
  // the tagline into the space left of it, so a long tagline never runs
  // into the mark.
  const mark = `${CITY} · ${YEAR}`;
  const markSize = Math.round(bandH * 0.11);
  ctx.save();
  ctx.font = `800 ${markSize}px ${FAMILY}`;
  const markW = ctx.measureText(mark).width + mark.length * markSize * 0.35;
  ctx.restore();
  const taglineRoom = w - pad * 2 - markW - 28;
  let tagSize = Math.round(bandH * 0.13);
  ctx.save();
  ctx.font = `700 ${tagSize}px ${FAMILY}`;
  while (tagSize > 12 && ctx.measureText(tagline.toUpperCase()).width > taglineRoom) {
    tagSize -= 2;
    ctx.font = `700 ${tagSize}px ${FAMILY}`;
  }
  ctx.fillStyle = '#ffb347';
  ctx.textAlign = 'left';
  ctx.fillText(tagline.toUpperCase(), pad, y + bandH * 0.86);
  ctx.restore();
  eyebrow(ctx, mark, w - pad - markW, y + bandH * 0.86, markSize, '#8f88a8');
}

// A thin white frame with corner ticks, the poster's border.
function frame(ctx, w, h, inset) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 5;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = 7;
  const t = 42;
  const corners = [
    [inset, inset, 1, 1],
    [w - inset, inset, -1, 1],
    [inset, h - inset, 1, -1],
    [w - inset, h - inset, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + t * sx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + t * sy);
    ctx.stroke();
  }
  ctx.restore();
}

// The next grade in the rotation, so side panels contrast the hero.
function nextGrade(grade) {
  return grade === 'sunset' ? 'neon' : grade === 'neon' ? 'vice' : 'sunset';
}

// Draw the whole cover onto canvas. opts: photo (Image), title, tagline,
// layout ('hero' | 'panels' | 'trio'), grade ('sunset' | 'neon' | 'vice'),
// width, height.
export function drawCover(canvas, opts) {
  const { photo, title, tagline, layout, grade, width, height } = opts;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const W = width;
  const H = height;
  const pad = Math.round(W * 0.045);
  const bandH = Math.round(H * 0.24);

  if (layout === 'hero') {
    const hero = gradePanel(photo, W, H, grade, 1.0, 0.5, 0.35);
    ctx.drawImage(hero, 0, 0);
    bottomScrim(ctx, W, H, 0.45);
    sunMark(ctx, pad + 26, pad + 26, 24);
    eyebrow(ctx, CITY, pad + 64, pad + 36, 26, '#ffffff');
    const titleSize = fitFont(ctx, title, W - pad * 2, Math.round(H * 0.13), FAMILY);
    posterText(ctx, title, pad, H - pad - Math.round(H * 0.055), titleSize, 'left');
    ctx.save();
    ctx.font = `700 ${Math.round(H * 0.022)}px ${FAMILY}`;
    ctx.fillStyle = '#ffb347';
    ctx.fillText(tagline.toUpperCase(), pad, H - pad - Math.round(H * 0.012));
    ctx.restore();
    frame(ctx, W, H, 22);
    return canvas;
  }

  if (layout === 'panels') {
    const bodyH = H - bandH;
    const gutter = 10;
    const heroW = Math.round(W * 0.6);
    const sideW = W - heroW - gutter;
    const sideH = Math.round((bodyH - gutter) / 2);
    const hero = gradePanel(photo, heroW, bodyH, grade, 1.0, 0.42, 0.35);
    ctx.drawImage(hero, 0, 0);
    const top = gradePanel(photo, sideW, sideH, nextGrade(grade), 1.8, 0.7, 0.3);
    ctx.drawImage(top, heroW + gutter, 0);
    const bottom = gradePanel(photo, sideW, sideH, grade, 2.3, 0.25, 0.55);
    ctx.drawImage(bottom, heroW + gutter, sideH + gutter);
    ctx.fillStyle = '#f4f1ff';
    ctx.fillRect(heroW, 0, gutter, bodyH);
    ctx.fillRect(heroW + gutter, sideH, sideW, gutter);
    ctx.fillRect(0, bodyH, W, gutter);
    sunMark(ctx, pad + 22, pad + 22, 20);
    eyebrow(ctx, CITY, pad + 54, pad + 30, 22, '#ffffff');
    titleBand(ctx, W, H, bodyH + gutter, bandH - gutter, title, tagline);
    frame(ctx, W, H, 16);
    return canvas;
  }

  // trio: three vertical scenes, each a different crop and grade.
  const bodyH = H - bandH;
  const gutter = 10;
  const colW = Math.round((W - gutter * 2) / 3);
  const grades = [grade, nextGrade(grade), nextGrade(nextGrade(grade))];
  const focuses = [0.2, 0.5, 0.8];
  for (let i = 0; i < 3; i++) {
    const panel = gradePanel(photo, colW, bodyH, grades[i], 1.5, focuses[i], 0.35);
    ctx.drawImage(panel, i * (colW + gutter), 0);
  }
  ctx.fillStyle = '#f4f1ff';
  ctx.fillRect(colW, 0, gutter, bodyH);
  ctx.fillRect(colW * 2 + gutter, 0, gutter, bodyH);
  ctx.fillRect(0, bodyH, W, gutter);
  sunMark(ctx, pad + 22, pad + 22, 20);
  eyebrow(ctx, CITY, pad + 54, pad + 30, 22, '#ffffff');
  titleBand(ctx, W, H, bodyH + gutter, bandH - gutter, title, tagline);
  frame(ctx, W, H, 16);
  return canvas;
}
