// Screenshot staging: the app reads its own URL so the maker can drive it
// hands-free. ?shot=cover renders just the cover on a bare dark page (the
// first screenshot, the cover itself). ?shot=editor shows the whole editor
// with a photo loaded. Both take &photo=<sample file>, &caption=<title>,
// &grade=<sunset|neon|vice>, &layout=<hero|panels|trio> and &size=<WxH>.
// shots.json in the repository lists the three shots this file stages.

import { SIZES } from './cover.js';

function sizeFromDims(w, h) {
  for (const [name, [sw, sh]] of Object.entries(SIZES)) {
    if (sw === w && sh === h) return name;
  }
  return null;
}

export async function applyStaging(state, render, loadImage, canvas) {
  const q = new URLSearchParams(window.location.search);
  if (!q.has('shot')) return;
  const shot = q.get('shot');
  const caption = q.get('caption');
  const grade = q.get('grade');
  const layout = q.get('layout');
  const photo = q.get('photo');
  const size = q.get('size');
  const w = Number(q.get('w') ?? 0);
  const h = Number(q.get('h') ?? 0);

  if (caption) state.title = caption;
  if (grade && ['sunset', 'neon', 'vice'].includes(grade)) state.grade = grade;
  if (layout && ['hero', 'panels', 'trio'].includes(layout)) state.layout = layout;
  // A named export size wins; w/h is the fallback for an unnamed one.
  if (size && SIZES[size]) {
    state.size = size;
  } else if (w > 0 && h > 0) {
    const named = sizeFromDims(w, h);
    if (named) {
      state.size = named;
    } else {
      // An unnamed size: keep the closest preset for the label, the cover
      // itself is drawn at w x h by the shot's own canvas below.
      state.size = w > h ? '1920x1080' : w === h ? '1080x1080' : '1080x1350';
    }
  }
  if (photo) {
    try {
      // A bare name (portrait1) is a sample; a path or a filename with an
      // extension is used as given, so ?photo=samples/portrait2.jpg works
      // too instead of doubling the samples/ prefix.
      const src = photo.includes('/') || /\.(jpe?g|png|webp)$/i.test(photo) ? photo : `samples/${photo}.jpg`;
      state.photo = await loadImage(src);
    } catch {
      // Keep the sample the editor already loaded.
    }
  }

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Fit the bare cover to the viewport without distortion.
    const [cw, ch] = SIZES[state.size] ?? [1080, 1080];
    const aspect = cw / ch;
    if (aspect >= 1) {
      canvas.style.width = '100vw';
      canvas.style.height = 'auto';
      canvas.style.maxHeight = '100vh';
    } else {
      canvas.style.height = '100vh';
      canvas.style.width = 'auto';
      canvas.style.maxWidth = '100vw';
    }
  }
  render();
}
