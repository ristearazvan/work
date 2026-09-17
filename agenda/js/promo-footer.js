// Promo footer — shown on every public /book/* page. The WhatsApp button sits
// high on the page (right under the album cards); the promo sentence stays at
// the bottom.
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
  const TEXT = 'Pentru propriul tau profil scrie la {phone}. Detalii si preturi pe WhatsApp.';
  const CTA  = 'Scrie-mi pe WhatsApp';

  // Per-profile button numbers, keyed by the slug in /book/<slug>. `display` is
  // what the button shows, `wa` the same digits in international format for the
  // wa.me link. A profile listed here gets its own number on the button; every
  // other profile falls back to WHATSAPP_NUMBER above.
  const PROFILE_NUMBERS = {
    amalia: { display: '0756 127 565', wa: '40756127565' },
  };

  // Message pre-filled in WhatsApp when the visitor taps through.
  // {url} is replaced with the page they came from.
  const PREFILL = 'Salut! Am vazut pagina {url} si vreau si eu un profil.';
  // Same, for a button that writes to the profile's own number.
  const PROFILE_PREFILL = 'Salut! Am vazut pagina {url}.';
  // ---------------------------------------------------------------------------

  if (!WHATSAPP_NUMBER) return;

  const CSS = `
  .pf-wrap { margin-top: 44px; padding-top: 22px; border-top: 1px solid var(--hair); }
  .pf-text { font-size: 13px; color: var(--muted); line-height: 1.65; margin: 0; }
  .pf-phone { color: var(--accent); font-weight: 600; text-decoration: none; white-space: nowrap; }
  .pf-phone:hover { text-decoration: underline; }
  /* Full width, and the same 16px gap the album cards use, so the button reads
     as one more card in that stack rather than a stray inline link. */
  .pf-btn { display: flex; align-items: center; justify-content: center; gap: 9px;
            flex-wrap: wrap; width: 100%; margin-top: 16px; padding: 14px 18px;
            border-radius: 3px;
            background: var(--accent); color: #fff; text-decoration: none;
            font-family: var(--ui); font-size: 15px; font-weight: 600; letter-spacing: 0.1px; }
  .pf-btn:hover { filter: brightness(1.08); }
  .pf-btn:active { transform: scale(0.995); }
  .pf-btn svg { flex: 0 0 auto; width: 17px; height: 17px; fill: currentColor; }
  .pf-btn-dot { opacity: 0.55; }
  .pf-btn-num { font-variant-numeric: tabular-nums; white-space: nowrap; letter-spacing: 0.3px; }
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

  function waHref(number, template) {
    return 'https://wa.me/' + number
      + '?text=' + encodeURIComponent(template.replace('{url}', location.href));
  }

  // Slug in /book/<slug>, or '' on any other path.
  function currentSlug() {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts[0] === 'book' ? (parts[1] || '') : '';
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

  // `profile` is the PROFILE_NUMBERS entry for this page, or null — when set,
  // the button shows that number next to the label.
  function buildButton(href, profile) {
    const btn = document.createElement('a');
    btn.className = 'pf-btn';
    btn.href = href;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';

    btn.innerHTML = ICON;
    const label = document.createElement('span');
    label.textContent = CTA;
    btn.appendChild(label);

    if (profile) {
      const dot = document.createElement('span');
      dot.className = 'pf-btn-dot';
      dot.textContent = '·';
      btn.appendChild(dot);
      const num = document.createElement('span');
      num.className = 'pf-btn-num';
      num.textContent = profile.display;
      btn.appendChild(num);
    }
    return btn;
  }

  // Where the button goes: on the booking page, straight after the album /
  // extra-page cards (they are in the markup even while hidden, so the slot is
  // stable before the API answers); on the other public pages, above the
  // content block, under the heading. Null means the page shape is unknown and
  // the button stays with the text at the bottom.
  function buttonSlot() {
    const cards = document.querySelectorAll('.album-cta');
    if (cards.length) return { node: cards[cards.length - 1], where: 'afterend' };
    const content = document.getElementById('content') || document.getElementById('body');
    if (content) return { node: content, where: 'beforebegin' };
    return null;
  }

  function mount() {
    const app = document.getElementById('app');
    if (!app || document.querySelector('.pf-wrap')) return;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const promoHref = waHref(WHATSAPP_NUMBER, PREFILL);

    const wrap = document.createElement('div');
    wrap.className = 'pf-wrap';
    wrap.appendChild(buildText(promoHref));
    app.appendChild(wrap);

    const profile = PROFILE_NUMBERS[currentSlug()] || null;
    const btn = buildButton(
      profile ? waHref(profile.wa, PROFILE_PREFILL) : promoHref,
      profile
    );
    const slot = buttonSlot();
    if (slot) slot.node.insertAdjacentElement(slot.where, btn);
    else wrap.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
