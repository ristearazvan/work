// Promo footer — shown at the bottom of every public /book/* page.
// One shared block for all accounts: edit the config below and redeploy.
(function () {
  // ---------------------------------------------------------------------------
  // CONFIG — the only part meant to be edited.
  // ---------------------------------------------------------------------------
  // Number as visitors see it, and the same number digits-only for the wa.me
  // link (international format, no +, spaces or dashes).
  // Leave WHATSAPP_NUMBER empty to hide the footer everywhere.
  const PHONE_DISPLAY   = '+40 730 855 510';
  const WHATSAPP_NUMBER = '40730855510';

  // {phone} is replaced with PHONE_DISPLAY, linked to WhatsApp.
  const TEXT = 'Pentru propriul tau profil scrie la {phone}, detalii si preturi pe whatsapp';
  const CTA  = 'Scrie pe WhatsApp';

  // Message pre-filled in WhatsApp when the visitor taps through.
  // {url} is replaced with the page they came from.
  const PREFILL = 'Salut! Am vazut pagina {url} si vreau si eu un profil.';
  // ---------------------------------------------------------------------------

  if (!WHATSAPP_NUMBER) return;

  const CSS = `
  .pf-wrap { margin-top: 44px; padding-top: 22px; border-top: 1px solid var(--hair); }
  .pf-text { font-size: 13px; color: var(--muted); line-height: 1.65; margin: 0; }
  .pf-phone { color: var(--accent); font-weight: 600; text-decoration: none; white-space: nowrap; }
  .pf-phone:hover { text-decoration: underline; }
  .pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px;
            margin-top: 14px; padding: 12px 18px; border-radius: 3px;
            background: var(--accent); color: #fff; text-decoration: none;
            font-family: var(--ui); font-size: 14px; font-weight: 600; letter-spacing: 0.1px; }
  .pf-btn:hover { filter: brightness(1.08); }
  .pf-btn:active { transform: scale(0.995); }
  .pf-btn svg { flex: 0 0 auto; width: 17px; height: 17px; fill: currentColor; }
  @media (max-width: 380px) { .pf-btn { width: 100%; } }
  /* Background-image pages (body.has-bg): white copy over the photo, with a
     dark shadow so it still reads against light areas of the image. Pages
     without a photo keep the dark text above — white would vanish on cream. */
  body.has-bg .pf-wrap { border-top-color: rgba(255,255,255,0.5); }
  body.has-bg .pf-text,
  body.has-bg .pf-phone { color: #fff; font-weight: 500;
    text-shadow: 0 0 3px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.9),
                 0 0 10px rgba(0,0,0,0.6); }
  body.has-bg .pf-phone { font-weight: 700; }
  body.has-bg .pf-btn { color: #fff; text-shadow: none; }
  `;

  // WhatsApp glyph, inlined so the footer has no external dependencies.
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.3h-.02a9.2 9.2 0 0 1-4.7-1.29l-.34-.2-3.5.92.93-3.41-.22-.35a9.19 9.19 0 0 1-1.41-4.9c0-5.08 4.14-9.21 9.23-9.21a9.16 9.16 0 0 1 6.52 2.7 9.13 9.13 0 0 1 2.7 6.52c-.01 5.08-4.15 9.22-9.21 9.22zM19.9 4.35A11.07 11.07 0 0 0 12.04 1C5.9 1 .91 5.99.9 12.12c0 1.95.51 3.86 1.48 5.54L.81 23.2l5.68-1.49a11.1 11.1 0 0 0 5.55 1.42h.01c6.13 0 11.12-4.99 11.13-11.12a11.06 11.06 0 0 0-3.27-7.87z"/></svg>';

  function waHref() {
    return 'https://wa.me/' + WHATSAPP_NUMBER
      + '?text=' + encodeURIComponent(PREFILL.replace('{url}', location.href));
  }

  // Builds the sentence as nodes so the copy can hold any character safely and
  // {phone} becomes a real link rather than injected markup.
  function buildText(href) {
    const p = document.createElement('p');
    p.className = 'pf-text';
    const parts = TEXT.split('{phone}');
    parts.forEach((chunk, i) => {
      if (i > 0) {
        const a = document.createElement('a');
        a.className = 'pf-phone';
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = PHONE_DISPLAY;
        p.appendChild(a);
      }
      if (chunk) p.appendChild(document.createTextNode(chunk));
    });
    return p;
  }

  function mount() {
    const app = document.getElementById('app');
    if (!app || document.querySelector('.pf-wrap')) return;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const href = waHref();
    const wrap = document.createElement('div');
    wrap.className = 'pf-wrap';
    wrap.appendChild(buildText(href));

    const btn = document.createElement('a');
    btn.className = 'pf-btn';
    btn.href = href;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.innerHTML = ICON + '<span></span>';
    btn.querySelector('span').textContent = CTA;
    wrap.appendChild(btn);

    app.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
