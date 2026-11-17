/* Page transitions: a black panel swipes up over the page when you follow a link to another page,
   and the next page opens by swiping that black panel up and away.
   Load this in <head> (not deferred). On the home page add data-enter="no": its own opening curtain does the "enter" part. */
(() => {
  const me = document.currentScript;
  const enter = !(me && me.dataset.enter === 'no');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.77,0,.18,1)', T = 650;

  const st = document.createElement('style');
  st.textContent = `.pt{position:fixed;inset:0;z-index:9999;background:#111;pointer-events:none;transform:translateY(100%);transition:transform ${T}ms ${EASE}}
.pt.cover{transform:none;pointer-events:auto}.pt.up{transform:translateY(-100%)}`;
  document.head.appendChild(st);

  const pt = document.createElement('div');
  pt.className = 'pt' + (enter && !calm ? ' cover' : '');
  pt.setAttribute('aria-hidden', 'true');
  document.documentElement.appendChild(pt);

  // park the panel below the screen, ready for the next "leave"
  const park = () => { pt.style.transition = 'none'; pt.className = 'pt'; pt.getBoundingClientRect(); pt.style.transition = ''; };

  if (enter && !calm) {
    let done = false;
    const reveal = () => {
      if (done) return; done = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        pt.classList.remove('cover'); pt.classList.add('up');          // swipe up and away
        setTimeout(park, T + 60);
      }));
    };
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', reveal); else reveal();
    setTimeout(reveal, 2500);                                          // never get stuck behind the panel
  }

  // leaving: swipe the black panel up over the page, then go
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return;
    const same = u.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
    if (same) return;                                                  // links within the same page scroll as before
    if (calm) return;
    e.preventDefault();
    park();
    requestAnimationFrame(() => { pt.classList.add('cover'); setTimeout(() => { location.href = u.href; }, T); });
  });

  // coming back with the browser's Back button: don't stay covered
  addEventListener('pageshow', ev => { if (ev.persisted) park(); });
})();
