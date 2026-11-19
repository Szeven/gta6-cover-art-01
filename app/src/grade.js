// Photo grading for the cover maker: every filter is computed here, in plain
// canvas pixels, so the app works offline with no library. A grade is three
// moves: a colour curve (sunset warmth, neon cyan/magenta, vice purple dusk),
// a posterize step that flattens the photo into flat comic tones, and two
// print effects — halftone dots in the shadows and an ink outline along hard
// edges. Each move is its own function so the cover composer can mix them
// per panel.

// Draw an image cover-fit into a fresh canvas of w x h, zoomed toward a
// focus point (fx, fy in 0..1). Returns the canvas.
export function coverFit(image, w, h, zoom = 1, fx = 0.5, fy = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const scale = Math.max(w / image.width, h / image.height) * zoom;
  const dw = image.width * scale;
  const dh = image.height * scale;
  const dx = (w - dw) * fx;
  const dy = (h - dh) * fy;
  ctx.drawImage(image, dx, dy, dw, dh);
  return canvas;
}

// The three grades. Each is a per-pixel curve: [red, green, blue] gain and
// lift, plus a saturation push. Values were tuned by eye on the sample
// portraits, not copied from any preset.
const GRADES = {
  sunset: { gain: [1.18, 1.0, 0.82], lift: [10, 2, -6], sat: 1.35 },
  neon: { gain: [0.92, 1.08, 1.22], lift: [-4, 0, 10], sat: 1.45 },
  vice: { gain: [1.08, 0.9, 1.18], lift: [6, -6, 12], sat: 1.3 },
};

export function gradeNames() {
  return Object.keys(GRADES);
}

// Apply a grade curve and posterize to `levels` flat tones, in place on the
// canvas. Posterize is what makes a photo read as poster art: smooth skin
// becomes three flat tones, skies become bands of colour.
export function applyGrade(canvas, gradeName, levels = 5) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const g = GRADES[gradeName] ?? GRADES.sunset;
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    // Grade curve: gain, lift, then a saturation push around grey.
    let r = d[i] * g.gain[0] + g.lift[0];
    let gg = d[i + 1] * g.gain[1] + g.lift[1];
    let b = d[i + 2] * g.gain[2] + g.lift[2];
    const grey = 0.299 * r + 0.587 * gg + 0.114 * b;
    r = grey + (r - grey) * g.sat;
    gg = grey + (gg - grey) * g.sat;
    b = grey + (b - grey) * g.sat;
    // Posterize each channel to the nearest flat level.
    d[i] = Math.max(0, Math.min(255, Math.round(r / step) * step));
    d[i + 1] = Math.max(0, Math.min(255, Math.round(gg / step) * step));
    d[i + 2] = Math.max(0, Math.min(255, Math.round(b / step) * step));
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Halftone dots: a grid of black dots whose size grows where the image is
// dark — the print texture of a comic poster. `spacing` is the grid step in
// pixels, `maxR` the largest dot radius.
export function addHalftone(canvas, spacing = 14, maxR = 5) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  for (let y = spacing / 2; y < h; y += spacing) {
    for (let x = spacing / 2; x < w; x += spacing) {
      const i = (Math.floor(y) * w + Math.floor(x)) * 4;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const darkness = 1 - lum / 255;
      if (darkness < 0.35) continue;
      const r = darkness * maxR;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvas;
}

// Ink outline: a Sobel edge pass on luminance, drawing a dark line wherever
// the brightness changes fast — the heavy black contour of comic art.
export function addInk(canvas, threshold = 90) {
  const w = canvas.width;
  const h = canvas.height;
  const src = canvas.getContext('2d');
  const img = src.getImageData(0, 0, w, h);
  const d = img.data;
  const lum = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    lum[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }
  const out = src.createImageData(w, h);
  const o = out.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx =
        -lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1] +
        lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1];
      const gy =
        -lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1] +
        lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1];
      const edge = Math.sqrt(gx * gx + gy * gy);
      if (edge > threshold) {
        const i = p * 4;
        o[i] = 12;
        o[i + 1] = 8;
        o[i + 2] = 18;
        o[i + 3] = Math.min(255, (edge - threshold) * 2.2);
      }
    }
  }
  // Composite the ink over the photo instead of replacing it: putImageData
  // writes every pixel, so an edge-only map would erase the photo and leave
  // a black page. Draw the edge map onto its own canvas and drawImage it
  // on top, so only the dark edge lines land on the graded photo.
  const ink = document.createElement('canvas');
  ink.width = w;
  ink.height = h;
  ink.getContext('2d').putImageData(out, 0, 0);
  src.drawImage(ink, 0, 0);
  return canvas;
}

// One call that grades a photo into a finished panel: cover-fit, grade,
// ink, then a light halftone in the shadows.
export function gradePanel(image, w, h, gradeName, zoom = 1, fx = 0.5, fy = 0.4) {
  const canvas = coverFit(image, w, h, zoom, fx, fy);
  applyGrade(canvas, gradeName, 5);
  addInk(canvas, 110);
  addHalftone(canvas, 16, 4);
  return canvas;
}
