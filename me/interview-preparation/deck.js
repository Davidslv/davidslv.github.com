/* deck.js — a minimal, self-contained slide engine. No dependencies, no build step.
 *
 * Markup: each slide is a <section class="slide">. The last visible slide on load is #1,
 * or whatever the URL hash points to (#7 jumps to slide 7).
 *
 * Controls:
 *   → / Space / PageDown   next        ← / PageUp   previous
 *   click right 3/4        next        click left 1/4   previous   (links & the cast player are never hijacked)
 *   N                      toggle presenter notes (read from each slide's data-notes)
 *   D                      toggle every <details> on the current slide (e.g. a follow-ups panel)
 *   F                      fullscreen
 *   Home / End             first / last slide
 *
 * Optional chrome (add these elements once, anywhere): #deck-counter, #deck-progress, #deck-notes.
 * Optional audio cue: give a slide data-cue and add a single <audio id="cue" src="…"> to the page;
 *   the cue plays when that slide opens, and a child element with class "pulse" gets a one-shot "beat".
 *
 * After init, window.deck = { show(n0), next(), prev(), index() } for programmatic control.
 */
(function () {
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  if (!slides.length) return;
  var i = 0;
  var counter  = document.getElementById('deck-counter');
  var progress = document.getElementById('deck-progress');
  var notes    = document.getElementById('deck-notes');
  var cue      = document.getElementById('cue');

  function show(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, k) { s.classList.toggle('active', k === i); });
    if (counter)  counter.textContent = (i + 1) + ' / ' + slides.length;
    if (progress) progress.style.width = ((i + 1) / slides.length * 100) + '%';
    if (notes)    notes.innerHTML = '<b>Slide ' + (i + 1) + '</b> — ' + (slides[i].getAttribute('data-notes') || '');
    if (location.hash !== '#' + (i + 1)) { try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { location.hash = i + 1; } }
    var s = slides[i];
    if (s.hasAttribute('data-cue') && cue) {
      try { cue.currentTime = 0; cue.play().catch(function () {}); } catch (e) {}
      var p = s.querySelector('.pulse');
      if (p) { p.classList.remove('beat'); void p.offsetWidth; p.classList.add('beat'); }
    }
  }
  function next() { show(i + 1); }
  function prev() { show(i - 1); }
  // optional drill helpers: C -> the [data-toc] slide; R -> a random [data-drill] slide
  var tocIdx   = slides.findIndex(function (s) { return s.hasAttribute('data-toc'); });
  var movesIdx = slides.findIndex(function (s) { return s.hasAttribute('data-moves'); });
  var drill    = slides.map(function (s, k) { return s.hasAttribute('data-drill') ? k : -1; }).filter(function (k) { return k >= 0; });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { next(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { prev(); }
    else if (e.key === 'n' || e.key === 'N') { if (notes) notes.classList.toggle('show'); }
    else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    else if (e.key === 'c' || e.key === 'C') { show(tocIdx >= 0 ? tocIdx : 0); }
    else if ((e.key === 'm' || e.key === 'M') && movesIdx >= 0) { show(movesIdx); }
    else if ((e.key === 'r' || e.key === 'R') && drill.length) { show(drill[(Math.random() * drill.length) | 0]); }
    else if (e.key === 'd' || e.key === 'D') { // toggle every <details> on the current slide
      var ds = slides[i].querySelectorAll('details');
      if (ds.length) { var op = [].some.call(ds, function (x) { return !x.open; }); [].forEach.call(ds, function (x) { x.open = op; }); }
    }
    else if (e.key === 'Home') { show(0); }
    else if (e.key === 'End') { show(slides.length - 1); }
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('a, button, summary, [data-cast]')) return; // never hijack links, a <details> reveal, or the cast player
    if (e.clientX < innerWidth * 0.25) prev(); else next();
  });
  window.addEventListener('hashchange', function () {
    var n = parseInt(location.hash.replace('#', ''), 10);
    if (n > 0 && n - 1 !== i) show(n - 1);
  });
  // when printing, expand every <details> (e.g. follow-ups) so it lands on paper; restore after
  window.addEventListener('beforeprint', function () {
    [].forEach.call(document.querySelectorAll('details'), function (d) { d.dataset.wasOpen = d.open ? '1' : '0'; d.open = true; });
  });
  window.addEventListener('afterprint', function () {
    [].forEach.call(document.querySelectorAll('details'), function (d) { d.open = d.dataset.wasOpen === '1'; });
  });

  var h = parseInt(location.hash.replace('#', ''), 10);
  show(h > 0 ? h - 1 : 0);
  window.deck = { show: show, next: next, prev: prev, index: function () { return i; } };
})();
