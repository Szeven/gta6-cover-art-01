// Vice City Nights — screenshot scenes.
//
// The app's own drawing, framed for the camera: ?shot=cover renders one
// exported cover full-frame at its export size, and ?shot=editor shows
// the editor with a photo loaded. The screenshots in screenshots/ are
// taken from these scenes in a real browser, never edited or composited.
import { SIZES } from './cover.js';

// Pick a cover scene from the query: ?shot=cover&size=wide|portrait|square
// and optional &layout=grid|hero|bleed|tilt &grade=sunset|neon|vice
// &title=... &subtitle=... so each cover shot can carry its own words.
function coverScene(state, params) {
  const sizeName = params.get('size') || 'wide';
  if (SIZES[sizeName]) state.size = sizeName;
  const layout = params.get('layout');
  if (layout) state.layout = layout;
  const grade = params.get('grade');
  if (grade) state.grade = grade;
  const title = params.get('title');
  if (title) state.title = title;
  const subtitle = params.get('subtitle');
  if (subtitle) state.subtitle = subtitle;
  document.body.classList.add('shot-cover');
  document.getElementById('app').classList.add('shot-cover');
}

// The editor scene: a hero layout in neon, so the editor screenshot
// shows a different cover than the two cover shots.
function editorScene(state) {
  state.layout = 'hero';
  state.grade = 'neon';
}

// Called once from main.js after the samples load: reads the query and
// reshapes the page for the shot, if one was asked for.
export function setupShotScene(state, redraw) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot === 'cover') {
    coverScene(state, params);
    redraw();
  } else if (shot === 'editor') {
    editorScene(state);
    redraw();
  }
}
