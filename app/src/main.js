// Vice City Nights — the editor wiring. State lives in one object; every
// control writes it and calls render(), which draws the cover fresh onto the
// preview canvas at the export size (CSS scales it down). Export draws the
// same cover onto a fresh canvas and downloads it as a PNG. Nothing here
// talks to a network: photos are local files or samples, the drawing is all
// canvas, the export is a blob URL.

import { drawCover, SIZES } from './cover.js';
import { applyStaging } from './shots.js';

const state = {
  photo: null,
  title: 'SOLARA',
  tagline: 'A Solara City Story',
  layout: 'hero',
  grade: 'sunset',
  size: '1080x1080',
};

const canvas = document.getElementById('cover');
const sizeLabel = document.getElementById('sizeLabel');
const exportBtn = document.getElementById('exportBtn');
const downloadLink = document.getElementById('downloadLink');

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

function currentDims() {
  return SIZES[state.size] ?? [1080, 1080];
}

// Draw the placeholder when no photo is loaded yet: a dusk gradient, the
// sun mark's colours, and a prompt to load a photo.
function drawEmpty() {
  const [w, h] = currentDims();
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b0f2e');
  sky.addColorStop(0.55, '#ff2e88');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `900 ${Math.round(w * 0.045)}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('LOAD A PHOTO', w / 2, h / 2 - 10);
  ctx.font = `700 ${Math.round(w * 0.02)}px "Arial Black", Impact, sans-serif`;
  ctx.fillStyle = '#ffe08a';
  ctx.fillText('TO MAKE YOUR COVER', w / 2, h / 2 + Math.round(w * 0.045));
}

function render() {
  const [w, h] = currentDims();
  sizeLabel.textContent = `${w} × ${h}`;
  if (!state.photo) {
    drawEmpty();
    return;
  }
  drawCover(canvas, {
    photo: state.photo,
    title: state.title,
    tagline: state.tagline,
    layout: state.layout,
    grade: state.grade,
    width: w,
    height: h,
  });
}

function setSeg(id, attr, value) {
  const seg = document.getElementById(id);
  for (const btn of seg.querySelectorAll('button')) {
    btn.classList.toggle('on', btn.dataset[attr] === value);
  }
}

document.getElementById('titleInput').addEventListener('input', (e) => {
  state.title = e.target.value.trim() || 'SOLARA';
  render();
});

document.getElementById('taglineInput').addEventListener('input', (e) => {
  state.tagline = e.target.value.trim() || 'A Solara City Story';
  render();
});

document.getElementById('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    state.photo = await loadImage(URL.createObjectURL(file));
    render();
  } catch {
    alert('That photo could not be read. Try another file.');
  }
});

for (const btn of document.querySelectorAll('[data-sample]')) {
  btn.addEventListener('click', async () => {
    try {
      state.photo = await loadImage(btn.dataset.sample);
      render();
    } catch {
      alert('That sample could not be loaded.');
    }
  });
}

document.getElementById('layoutSeg').addEventListener('click', (e) => {
  const layout = e.target.dataset?.layout;
  if (!layout) return;
  state.layout = layout;
  setSeg('layoutSeg', 'layout', layout);
  render();
});

document.getElementById('gradeSeg').addEventListener('click', (e) => {
  const grade = e.target.dataset?.grade;
  if (!grade) return;
  state.grade = grade;
  setSeg('gradeSeg', 'grade', grade);
  render();
});

document.getElementById('sizeSeg').addEventListener('click', (e) => {
  const size = e.target.dataset?.size;
  if (!size) return;
  state.size = size;
  setSeg('sizeSeg', 'size', size);
  render();
});

// Export: draw the same cover at full size onto a fresh canvas and download
// it. The exported PNG is the app's own drawing, byte for byte.
exportBtn.addEventListener('click', () => {
  if (!state.photo) {
    alert('Load a photo first.');
    return;
  }
  const [w, h] = currentDims();
  const out = document.createElement('canvas');
  drawCover(out, {
    photo: state.photo,
    title: state.title,
    tagline: state.tagline,
    layout: state.layout,
    grade: state.grade,
    width: w,
    height: h,
  });
  out.toBlob((blob) => {
    if (!blob) return;
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `solara-cover-${state.size}.png`;
    downloadLink.click();
    setTimeout(() => URL.revokeObjectURL(downloadLink.href), 5000);
  }, 'image/png');
});

// Boot: the first sample photo, then the URL staging (screenshots drive the
// app through ?shot=cover|editor&photo=..&caption=..&grade=..&layout=..).
loadImage('samples/portrait1.jpg')
  .then((img) => {
    state.photo = img;
    return applyStaging(state, render, loadImage, canvas);
  })
  .then(() => {
    // Staging drives state from the URL; bring the controls along so the
    // buttons and inputs show what the cover actually uses, not the
    // defaults the page shipped with.
    setSeg('layoutSeg', 'layout', state.layout);
    setSeg('gradeSeg', 'grade', state.grade);
    setSeg('sizeSeg', 'size', state.size);
    document.getElementById('titleInput').value = state.title;
    document.getElementById('taglineInput').value = state.tagline;
  })
  .then(render)
  .catch(() => render());
