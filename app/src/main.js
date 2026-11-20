// Vice City Nights — the editor.
//
// Wires the page to the cover renderer: photo uploads per panel, drag to
// position and scroll to zoom, layout and grade pickers, caption editing,
// and one-step PNG export. The two fictional sample portraits load by
// default, so the editor shows a finished-looking cover on first open.
import { GRADES } from './grade.js';
import { LAYOUTS, SIZES, drawCover, layoutPanels, renderCover } from './cover.js';
import { setupShotScene } from './shots.js';

const SAMPLES = ['samples/portrait1.jpg', 'samples/portrait2.jpg'];

export const state = {
  layout: 'grid',
  grade: 'sunset',
  title: 'SOLARA',
  subtitle: 'Vice City Nights',
  badge: 'SOLARA CITY',
  stars: 4,
  size: 'wide',
  panels: [
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.1, ox: 0, oy: 0 },
    { img: null, zoom: 1.4, ox: 0, oy: 0 },
    { img: null, zoom: 1.35, ox: 0, oy: 0 },
  ],
};

const preview = document.getElementById('preview');
const previewCtx = preview.getContext('2d');
const statusLine = document.getElementById('status');

// Fit the preview canvas to the chosen export size, capped for speed —
// except in a screenshot scene, where the canvas renders at the full
// export size so the capture is the cover itself.
function fitPreview() {
  const size = SIZES[state.size];
  if (document.body.classList.contains('shot-cover')) {
    preview.width = size.width;
    preview.height = size.height;
    return;
  }
  const scale = Math.min(1, 760 / Math.max(size.width, size.height));
  preview.width = Math.round(size.width * scale);
  preview.height = Math.round(size.height * scale);
}

export function redraw() {
  fitPreview();
  drawCover(previewCtx, state, preview.width, preview.height);
  const size = SIZES[state.size];
  statusLine.textContent = `${LAYOUTS[state.layout]} · ${GRADES[state.grade].label} grade · export ${size.width} × ${size.height} PNG`;
}

// Frame a photo in its panel so the subject's face lands in view: the
// visible window's top sits 12% down the photo, where faces live in a
// portrait shot, clamped so the photo always covers the whole panel.
// Without this, a tall portrait in a wide panel crops to the chest and
// the face is cut off at the panel's top edge.
export function framePanelForPhoto(index) {
  const panel = state.panels[index];
  const img = panel.img;
  if (!img || !img.naturalWidth) return;
  fitPreview();
  const rects = layoutPanels(state.layout, preview.width, preview.height);
  const rect = rects[index];
  if (!rect) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = panel.zoom || 1.15;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dh = ih * scale;
  const baseDy = (rect.h - dh) / 2;
  const dyTarget = -0.12 * dh;
  const oyMin = (rect.h - dh) / (2 * rect.h);
  const oyMax = (dh - rect.h) / (2 * rect.h);
  panel.oy = Math.max(oyMin, Math.min(oyMax, (dyTarget - baseDy) / rect.h));
  panel.ox = 0;
}

// Load an image file (or a sample path) into one panel. The panel keeps
// its zoom but is reframed for the new photo, so a fresh photo starts
// with its subject in view instead of cropped to the chest.
export function loadPhotoIntoPanel(index, source) {
  const img = new Image();
  img.onload = () => {
    state.panels[index].img = img;
    framePanelForPhoto(index);
    redraw();
  };
  img.src = source;
}

function loadSamples() {
  loadPhotoIntoPanel(0, SAMPLES[0]);
  loadPhotoIntoPanel(1, SAMPLES[1]);
  loadPhotoIntoPanel(2, SAMPLES[0]);
  loadPhotoIntoPanel(3, SAMPLES[1]);
}

// Which panel sits under a point on the preview canvas, in preview pixels.
function panelAt(px, py) {
  const rects = layoutPanels(state.layout, preview.width, preview.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function bindCanvasGestures() {
  let dragging = -1;
  let lastX = 0;
  let lastY = 0;
  preview.addEventListener('pointerdown', (event) => {
    const box = preview.getBoundingClientRect();
    const px = (event.clientX - box.left) * (preview.width / box.width);
    const py = (event.clientY - box.top) * (preview.height / box.height);
    const hit = panelAt(px, py);
    if (hit < 0) return;
    dragging = hit;
    lastX = px;
    lastY = py;
    preview.setPointerCapture(event.pointerId);
  });
  preview.addEventListener('pointermove', (event) => {
    if (dragging < 0) return;
    const box = preview.getBoundingClientRect();
    const px = (event.clientX - box.left) * (preview.width / box.width);
    const py = (event.clientY - box.top) * (preview.height / box.height);
    const rects = layoutPanels(state.layout, preview.width, preview.height);
    const rect = rects[dragging];
    const panel = state.panels[dragging];
    panel.ox += (px - lastX) / rect.w;
    panel.oy += (py - lastY) / rect.h;
    panel.ox = Math.max(-0.5, Math.min(0.5, panel.ox));
    panel.oy = Math.max(-0.5, Math.min(0.5, panel.oy));
    lastX = px;
    lastY = py;
    redraw();
  });
  preview.addEventListener('pointerup', () => { dragging = -1; });
  preview.addEventListener('wheel', (event) => {
    event.preventDefault();
    const box = preview.getBoundingClientRect();
    const px = (event.clientX - box.left) * (preview.width / box.width);
    const py = (event.clientY - box.top) * (preview.height / box.height);
    const hit = panelAt(px, py);
    if (hit < 0) return;
    const panel = state.panels[hit];
    panel.zoom = Math.max(1, Math.min(4, panel.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
    redraw();
  }, { passive: false });
}

// Build one row of panel controls: upload, samples, zoom, reset.
function buildPanelControls() {
  const wrap = document.getElementById('panels');
  wrap.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.innerHTML = `
      <span class="panel-name">Panel ${i + 1}</span>
      <label class="upload">Upload photo
        <input type="file" accept="image/*" data-panel="${i}" hidden>
      </label>
      <button type="button" class="sample" data-panel="${i}" data-sample="0">Driver</button>
      <button type="button" class="sample" data-panel="${i}" data-sample="1">Neon Queen</button>
      <label class="zoom">Zoom
        <input type="range" min="1" max="4" step="0.05" value="1.15" data-panel="${i}">
      </label>
      <button type="button" class="reset" data-panel="${i}">Reset</button>`;
    wrap.appendChild(row);
  }
  wrap.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      loadPhotoIntoPanel(Number(input.dataset.panel), URL.createObjectURL(file));
    });
  });
  wrap.querySelectorAll('button.sample').forEach((button) => {
    button.addEventListener('click', () => {
      loadPhotoIntoPanel(Number(button.dataset.panel), SAMPLES[Number(button.dataset.sample)]);
    });
  });
  wrap.querySelectorAll('input[type="range"]').forEach((slider) => {
    slider.addEventListener('input', () => {
      state.panels[Number(slider.dataset.panel)].zoom = Number(slider.value);
      redraw();
    });
  });
  wrap.querySelectorAll('button.reset').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.panel);
      const panel = state.panels[index];
      panel.zoom = 1.15;
      framePanelForPhoto(index);
      redraw();
    });
  });
}

// A row of toggle buttons: one active at a time, calling onPick.
function bindPicker(id, values, onPick) {
  const wrap = document.getElementById(id);
  wrap.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      onPick(button.dataset.value);
      redraw();
    });
  });
}

function bindTextInputs() {
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const badge = document.getElementById('badge');
  title.addEventListener('input', () => { state.title = title.value; redraw(); });
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; redraw(); });
  badge.addEventListener('input', () => { state.badge = badge.value; redraw(); });
  document.getElementById('stars').addEventListener('change', (event) => {
    state.stars = Number(event.target.value);
    redraw();
  });
}

// Export the cover at the chosen post size and download the PNG.
function exportCover() {
  const size = SIZES[state.size];
  const canvas = renderCover(state, size.width, size.height);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solara-cover-${state.size}-${size.width}x${size.height}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    statusLine.textContent = `Exported ${size.width} × ${size.height} PNG — check your downloads.`;
  }, 'image/png');
}

function init() {
  bindPicker('layouts', LAYOUTS, (value) => { state.layout = value; });
  bindPicker('grades', GRADES, (value) => { state.grade = value; });
  bindPicker('sizes', SIZES, (value) => { state.size = value; });
  bindTextInputs();
  buildPanelControls();
  bindCanvasGestures();
  document.getElementById('export').addEventListener('click', exportCover);
  // Ctrl/Cmd+E exports without reaching for the button.
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      exportCover();
    }
  });
  loadSamples();
  setupShotScene(state, redraw);
  redraw();
}

init();
