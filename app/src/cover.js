// Vice City Nights — the cover renderer.
//
// drawCover paints one cover onto any 2D canvas: panels, grade,
// lettering, badge ribbon and star meter. The same function draws the
// live preview, the exported PNG and the screenshot scenes, so what the
// editor shows is exactly what the PNG holds.
import { GRADES, applyGrade, drawHalftoneBand } from './grade.js';

export const LAYOUTS = {
  grid: 'Four-panel grid',
  hero: 'Hero and three',
  bleed: 'Full-bleed hero',
  tilt: 'Tilted snapshots',
};

export const SIZES = {
  square: { label: 'Square · 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide · 1920 × 1080', width: 1920, height: 1080 },
};

// Panel rectangles for each layout, in fractions of the cover. The white
// gutters between panels are the poster's frame.
export function layoutPanels(layout, width, height) {
  const gutter = 0.012 * Math.min(width, height);
  const full = { x: 0, y: 0, w: width, h: height };
  if (layout === 'hero') {
    const top = height * 0.58;
    const small = (width - gutter * 2) / 3;
    return [
      { x: 0, y: 0, w: width, h: top },
      { x: 0, y: top + gutter, w: small, h: height - top - gutter },
      { x: small + gutter, y: top + gutter, w: small, h: height - top - gutter },
      { x: (small + gutter) * 2, y: top + gutter, w: small, h: height - top - gutter },
    ];
  }
  if (layout === 'bleed') {
    return [full, full, full, full];
  }
  if (layout === 'tilt') {
    const pw = width * 0.56;
    const ph = height * 0.52;
    return [
      { x: width * 0.04, y: height * 0.05, w: pw, h: ph, tilt: -0.07 },
      { x: width * 0.4, y: height * 0.3, w: pw, h: ph, tilt: 0.05 },
      { x: width * 0.08, y: height * 0.48, w: pw, h: ph, tilt: -0.03 },
      { x: width * 0.36, y: height * 0.06, w: pw, h: ph, tilt: 0.09 },
    ];
  }
  const halfW = (width - gutter) / 2;
  const halfH = (height - gutter) / 2;
  return [
    { x: 0, y: 0, w: halfW, h: halfH },
    { x: halfW + gutter, y: 0, w: halfW, h: halfH },
    { x: 0, y: halfH + gutter, w: halfW, h: halfH },
    { x: halfW + gutter, y: halfH + gutter, w: halfW, h: halfH },
  ];
}

// Draw one photo into its panel, cover-fit, with the panel's zoom and
// pan. A panel with no photo yet gets a striped placeholder instead.
export function drawPanelPhoto(ctx, panel, photo) {
  const rect = panel;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo && photo.img && photo.img.naturalWidth > 0) {
    const iw = photo.img.naturalWidth;
    const ih = photo.img.naturalHeight;
    const scale = Math.max(rect.w / iw, rect.h / ih) * (photo.zoom || 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = rect.x + (rect.w - dw) / 2 + (photo.ox || 0) * rect.w;
    const dy = rect.y + (rect.h - dh) / 2 + (photo.oy || 0) * rect.h;
    ctx.drawImage(photo.img, dx, dy, dw, dh);
  } else {
    drawPhotoPlaceholder(ctx, rect);
  }
  ctx.restore();
  // A thin inner line keeps each panel crisp against its neighbour.
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(1, rect.w * 0.002);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawPhotoPlaceholder(ctx, rect) {
  ctx.save();
  ctx.fillStyle = '#241a33';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = Math.max(2, rect.w * 0.01);
  for (let x = -rect.h; x < rect.w + rect.h; x += rect.w * 0.08) {
    ctx.beginPath();
    ctx.moveTo(rect.x + x, rect.y);
    ctx.lineTo(rect.x + x + rect.h, rect.y + rect.h);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `700 ${Math.round(rect.w * 0.045)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

// A five-pointed star, for the heat meter.
function starPath(ctx, cx, cy, radius) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// The heat meter: five stars, filled gold up to the cover's heat.
export function drawHeatMeter(ctx, x, y, size, filled) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const cx = x + i * size * 1.25;
    starPath(ctx, cx, y, size / 2);
    ctx.fillStyle = i < filled ? '#ffc93d' : 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.stroke();
  }
  ctx.restore();
}

// The badge ribbon across the top-left corner.
export function drawBadge(ctx, text, width, height) {
  const pad = width * 0.02;
  const bandH = height * 0.045;
  ctx.save();
  ctx.translate(pad, pad);
  ctx.rotate(-0.02);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width * 0.3, bandH);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, bandH - 3, width * 0.3, 3);
  ctx.fillStyle = '#fff';
  ctx.font = `800 ${Math.round(bandH * 0.52)}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad * 0.7, bandH / 2 + 1);
  ctx.restore();
}

// Shrink the title until it fits the cover's width, so a long caption
// never runs off the frame.
function fitTitleFont(ctx, title, width, startSize) {
  let size = startSize;
  const maxWidth = width * 0.94;
  while (size > 24) {
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
    if (ctx.measureText(title).width <= maxWidth) break;
    size = Math.round(size * 0.92);
  }
  return size;
}

// The title block: a halftone band, the big title in a sunset gradient
// with a black outline, and the neon script subtitle beneath it.
export function drawTitleBlock(ctx, state, width, height) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const bandH = height * 0.24;
  const bandY = height - bandH;
  ctx.save();
  const scrim = ctx.createLinearGradient(0, bandY - height * 0.08, 0, height);
  scrim.addColorStop(0, 'rgba(8,4,16,0)');
  scrim.addColorStop(1, 'rgba(8,4,16,0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - height * 0.08, width, bandH + height * 0.08);
  drawHalftoneBand(ctx, 0, bandY, width, bandH * 0.45, grade.halftone, 23);
  const title = (state.title || 'SOLARA').toUpperCase();
  // The title sits inside the band with room for the subtitle beneath
  // it: its baseline is 78% of its size below the band's top, and the
  // subtitle's baseline stays clear of the cover's bottom edge.
  const titleSize = fitTitleFont(ctx, title, width, Math.round(width * 0.1));
  ctx.font = `900 ${titleSize}px "Arial Black", Arial, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(titleSize * 0.02)}px`; } catch (e) { /* older canvas */ }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleGrad = ctx.createLinearGradient(0, bandY + titleSize * 0.2, 0, bandY + titleSize);
  titleGrad.addColorStop(0, '#ffffff');
  titleGrad.addColorStop(0.55, '#ffd98a');
  titleGrad.addColorStop(1, '#ff5e8a');
  ctx.lineWidth = Math.max(2, titleSize * 0.09);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0a0512';
  ctx.strokeText(title, width * 0.03, bandY + titleSize * 0.78);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, width * 0.03, bandY + titleSize * 0.78);
  const subSize = Math.round(width * 0.034);
  ctx.font = `italic 700 ${subSize}px Georgia, serif`;
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  ctx.shadowColor = grade.halftone;
  ctx.shadowBlur = subSize * 0.5;
  ctx.fillStyle = grade.halftone;
  ctx.fillText(state.subtitle || 'Vice City Nights', width * 0.035, height - height * 0.022);
  ctx.restore();
}

// Paint one cover. state holds layout, grade, title, subtitle, badge,
// stars and panels (each {img, zoom, ox, oy}).
export function drawCover(ctx, state, width, height) {
  ctx.save();
  ctx.fillStyle = '#f5f0ea';
  ctx.fillRect(0, 0, width, height);
  const rects = layoutPanels(state.layout, width, height);
  const panels = state.panels || [];
  if (state.layout === 'tilt') {
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt || 0);
      ctx.fillStyle = '#fff';
      const border = Math.max(4, width * 0.008);
      ctx.fillRect(-rect.w / 2 - border, -rect.h / 2 - border, rect.w + border * 2, rect.h + border * 2);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      drawPanelPhoto(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, panels[i]);
      ctx.restore();
    }
  } else if (state.layout === 'bleed') {
    drawPanelPhoto(ctx, rects[0], panels[0] || panels.find((p) => p && p.img));
  } else {
    for (let i = 0; i < rects.length; i++) {
      drawPanelPhoto(ctx, rects[i], panels[i]);
    }
  }
  applyGrade(ctx, width, height, state.grade, 7);
  drawBadge(ctx, state.badge || 'SOLARA CITY', width, height);
  drawHeatMeter(ctx, width * 0.78, height * 0.045, width * 0.032, state.stars || 4);
  drawTitleBlock(ctx, state, width, height);
  ctx.restore();
}

// Render a cover off-screen at the exact export size and hand back the
// canvas, ready for toBlob or toDataURL.
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, width, height);
  return canvas;
}
