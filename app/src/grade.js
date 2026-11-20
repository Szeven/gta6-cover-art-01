// Vice City Nights — colour grades.
//
// Each grade is a gradient map plus a tint, a halftone band, grain and a
// vignette, drawn over the finished panels. The grades are what make a
// photo read as a Vice City sunset or a neon night: warm amber and pink
// for sunset, magenta and cyan for neon, teal and violet for vice.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    // Deep amber shadows, hot pink midtones, pale gold highlights.
    stops: [[0, '#2b0f3d'], [0.45, '#c2436b'], [0.75, '#ff8a3d'], [1, '#ffd98a']],
    tint: '#ff7a2f',
    tintAlpha: 0.16,
    halftone: '#ff5e8a',
    grain: 0.05,
    vignette: 0.32,
  },
  neon: {
    label: 'Neon',
    // Violet shadows, magenta midtones, electric cyan highlights.
    stops: [[0, '#12082e'], [0.45, '#a4138f'], [0.75, '#ff2e88'], [1, '#37e6ff']],
    tint: '#ff2e88',
    tintAlpha: 0.14,
    halftone: '#37e6ff',
    grain: 0.06,
    vignette: 0.36,
  },
  vice: {
    label: 'Vice',
    // Teal shadows, violet midtones, warm cream highlights.
    stops: [[0, '#062a2e'], [0.45, '#3d2b8f'], [0.75, '#c65df0'], [1, '#ffe9b0']],
    tint: '#7b5cff',
    tintAlpha: 0.15,
    halftone: '#ffb03d',
    grain: 0.05,
    vignette: 0.34,
  },
};

// A tiny seeded random so grain is identical on every render of the same
// cover — the exported PNG must look the same every time it is made.
export function seededRandom(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// The grade names, in the order the editor lists them.
export function gradeNames() {
  return Object.keys(GRADES);
}

// Paint the grade over the whole cover: gradient map, tint, grain,
// vignette. The lettering is drawn after this, so it stays crisp.
export function applyGrade(ctx, width, height, gradeName, seed = 7) {
  const grade = GRADES[gradeName] || GRADES.sunset;
  const vignette = Math.max(0, Math.min(0.6, grade.vignette));
  ctx.save();
  const map = ctx.createLinearGradient(0, 0, 0, height);
  for (const [at, color] of grade.stops) map.addColorStop(at, color);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = map;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
  drawGrain(ctx, width, height, grade.grain, seed);
  drawVignette(ctx, width, height, vignette);
  ctx.restore();
}

// Speckle the frame with faint light and dark grain.
export function drawGrain(ctx, width, height, amount, seed = 7) {
  const rand = seededRandom(seed);
  const count = Math.floor(width * height * amount / 900);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const light = rand() > 0.5;
    ctx.globalAlpha = 0.05 + rand() * 0.09;
    ctx.fillStyle = light ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

// Darken the corners so the middle of the cover pops.
export function drawVignette(ctx, width, height, strength) {
  const radius = Math.hypot(width, height) / 2;
  const glow = ctx.createRadialGradient(
    width / 2, height / 2, radius * 0.45,
    width / 2, height / 2, radius,
  );
  glow.addColorStop(0, 'rgba(0,0,0,0)');
  glow.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// A band of halftone dots for the title block: dots grow as the band
// falls, like ink on a poster.
export function drawHalftoneBand(ctx, x, y, width, height, color, seed = 11) {
  const rand = seededRandom(seed);
  const gap = Math.max(7, height / 9);
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row * gap < height; row++) {
    for (let col = 0; col * gap < width; col++) {
      const depth = row / Math.max(1, Math.floor(height / gap));
      const radius = gap * (0.12 + depth * 0.3);
      const jitter = (rand() - 0.5) * gap * 0.2;
      ctx.beginPath();
      ctx.arc(x + col * gap + gap / 2 + jitter, y + row * gap + gap / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
