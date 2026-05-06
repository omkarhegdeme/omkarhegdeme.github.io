/*
 * Generic hero rotator.
 *
 * Picks up videos from a per-page subfolder via a JSON manifest:
 *   assets/<page>/video/manifest.json
 *
 * <page> is auto-derived from the current URL filename
 *   (index.html -> "index", yoga.html -> "yoga", "/" -> "index").
 * Override by adding data-manifest="path/to/manifest.json" to the
 * script tag.
 *
 * Manifest format: a plain JSON array of filenames, e.g.
 *   ["DNA condensates.mp4", "piv-flowfield.mp4"]
 *
 * Display names are derived from filenames automatically.
 *
 * The script:
 *   1. Removes any hard-coded .hero__video elements.
 *   2. Injects <video> elements based on the manifest.
 *   3. Builds dot indicators.
 *   4. Runs an 8-second crossfade rotator.
 *   5. Updates #hero-video-name with the active filename.
 */

(async () => {
  const INTERVAL = 8000;

  const scriptEl =
    document.currentScript ||
    document.querySelector('script[src*="hero-rotator"]');

  // Determine page name
  let page = location.pathname.split('/').pop().replace(/\.html?$/, '');
  if (!page) page = 'index';

  const manifestUrl =
    (scriptEl && scriptEl.dataset.manifest) ||
    `assets/${page}/video/manifest.json`;

  // Fetch manifest
  let files;
  try {
    const resp = await fetch(manifestUrl, { cache: 'no-cache' });
    if (!resp.ok) throw new Error(resp.status);
    const data = await resp.json();
    files = Array.isArray(data) ? data : data.videos;
  } catch (e) {
    console.warn('[hero-rotator] manifest not found:', manifestUrl, e);
    return;
  }
  if (!files || !files.length) return;

  const wrap = document.querySelector('.hero__video-wrap');
  if (!wrap) {
    console.warn('[hero-rotator] .hero__video-wrap missing');
    return;
  }

  const baseDir = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
  const indicators = document.querySelector('.hero__video-indicators');
  const npDots = document.getElementById('hero-np-dots');
  const nameEl = document.getElementById('hero-video-name');

  function deriveName(file) {
    const f = file.split('/').pop().replace(/\.[^.]+$/, '');
    return f
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // Remove any hard-coded .hero__video elements
  wrap.querySelectorAll('.hero__video').forEach(el => el.remove());

  // Build video elements
  const videos = files.map((entry, i) => {
    const fileName = typeof entry === 'string' ? entry : entry.file;
    const v = document.createElement('video');
    v.className = 'hero__video' + (i === 0 ? ' active' : '');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    if (i === 0) v.autoplay = true;
    const source = document.createElement('source');
    source.src = encodeURI(baseDir + fileName);
    source.type = 'video/mp4';
    v.appendChild(source);
    v.dataset.name = deriveName(fileName);
    return v;
  });

  // Insert before indicators (or at end if not present)
  videos.forEach(v => {
    if (indicators) wrap.insertBefore(v, indicators);
    else wrap.appendChild(v);
  });

  // Build dots in a container
  function buildDots(container, dotClass) {
    if (!container) return;
    container.innerHTML = '';
    files.forEach((_, i) => {
      const d = document.createElement('span');
      d.className = dotClass + (i === 0 ? ' active' : '');
      container.appendChild(d);
    });
  }
  buildDots(indicators, 'hero__video-dot');
  buildDots(npDots, 'hero__np-dot');

  function setName(idx) {
    if (nameEl) nameEl.textContent = videos[idx].dataset.name;
  }
  setName(0);

  // Try to start first video
  videos[0].play && videos[0].play().catch(() => {});

  // Rotator
  let current = 0;
  function activate(idx) {
    videos.forEach((v, i) => {
      const on = i === idx;
      v.classList.toggle('active', on);
      if (on) {
        try { v.currentTime = 0; } catch (_) {}
        v.play && v.play().catch(() => {});
      } else {
        v.pause && v.pause();
      }
    });
    [indicators, npDots].forEach(c => {
      if (!c) return;
      Array.from(c.children).forEach((d, i) =>
        d.classList.toggle('active', i === idx)
      );
    });
    setName(idx);
    current = idx;
  }

  setInterval(() => activate((current + 1) % videos.length), INTERVAL);
})();
