/* -------------------------------------------------------------------
   FERDINAND — interactions & i18n
   ------------------------------------------------------------------- */

/* -----  Intersection-based reveal  ------------------------------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* -----  Header scroll state  ------------------------------------- */
const header = document.querySelector('.site-header');
if (header) {
  const handle = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', handle, { passive: true });
  handle();
}

/* -----  i18n  ---------------------------------------------------- */
const LANGS = ['de', 'en', 'sq', 'bs', 'tr', 'it'];
const HTML_LANG = { de: 'de-AT', en: 'en', sq: 'sq', bs: 'bs', tr: 'tr', it: 'it' };

// Walk a dot.path.key into a nested dictionary.
function getPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
}

function currentLang() {
  try {
    const saved = localStorage.getItem('ferd-lang');
    if (saved && LANGS.includes(saved)) return saved;
  } catch (e) {}
  const url = new URL(location.href);
  const q = url.searchParams.get('lang');
  if (q && LANGS.includes(q)) return q;
  return 'de';
}

function applyLang(lang) {
  if (!LANGS.includes(lang)) lang = 'de';
  const dict = (window.I18N || {})[lang];
  if (!dict) return;

  document.documentElement.lang = HTML_LANG[lang] || lang;

  // Every [data-i18n] node gets its path-resolved value as innerHTML.
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = getPath(dict, key);
    if (val === undefined || val === null) return;
    if (typeof val === 'string') {
      const attr = el.getAttribute('data-i18n-attr');
      if (attr) el.setAttribute(attr, val.replace(/<[^>]+>/g, ''));
      else el.innerHTML = val;
    }
  });

  // <title>
  const page = document.body.getAttribute('data-page');
  if (page) {
    const t = getPath(dict, 'meta.' + page);
    if (t) document.title = t;
  }

  // Language switcher state
  document.querySelectorAll('.lang-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.lang === lang);
  });

  try { localStorage.setItem('ferd-lang', lang); } catch (e) {}
  document.body.setAttribute('data-lang', lang);

  renderDynamic(lang, dict);
}

/* ----- render dish list / team / awards from dictionary --------- */
function renderDynamic(lang, dict) {
  // Menu page — dish rows
  const menuMount = document.querySelector('[data-menu-mount]');
  if (menuMount) {
    const dishes   = getPath(dict, 'karte.d')  || [];
    const specials = getPath(dict, 'karte.sp') || [];
    let html = '';

    // Menüs — complete plates
    const menTitle = getPath(dict, 'karte.s_menue') || '';
    const menIntro = getPath(dict, 'karte.m_intro');
    html += `<div class="menu-section"><div class="menu-section-head"><h3>${menTitle}</h3></div>`;
    if (menIntro) html += `<p class="menu-intro">${menIntro}</p>`;
    dishes.forEach(d => {
      if (!d) return;
      html += `<div class="menu-row"><h4>${d.n}</h4><span class="price">€ ${d.p}</span><p>${d.d}</p></div>`;
    });
    html += `</div>`;

    // Weekend special
    if (specials.length) {
      const spTitle = getPath(dict, 'karte.s_special') || '';
      const spIntro = getPath(dict, 'karte.sp_intro');
      html += `<div class="menu-section"><div class="menu-section-head"><h3>${spTitle}</h3></div>`;
      if (spIntro) html += `<p class="menu-intro">${spIntro}</p>`;
      specials.forEach(d => {
        if (!d) return;
        html += `<div class="menu-row menu-fix"><h4>${d.n}</h4><span class="price">€ ${d.p}</span><p>${d.d}</p></div>`;
      });
      html += `</div>`;
    }

    menuMount.innerHTML = html;
  }

  // Team mount (haus page)
  const teamMount = document.querySelector('[data-team-mount]');
  if (teamMount) {
    const team = getPath(dict, 'haus.t') || [];
    const faces = [
      'img/owner.jpg',
      'img/grill.jpg'
    ];
    teamMount.innerHTML = team.map((m, i) =>
      `<div class="team-card reveal">
         <div class="img-wrap"><div style="background-image:url('${faces[i] || faces[0]}')"></div></div>
         <h4>${m.n}</h4>
         <div class="role">${m.r}</div>
       </div>`
    ).join('');
    teamMount.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  // Awards mount (haus page)
  const awardsMount = document.querySelector('[data-awards-mount]');
  if (awardsMount) {
    const awards = getPath(dict, 'haus.a') || [];
    awardsMount.innerHTML = awards.map(a =>
      `<div class="award-row">
         <span class="yr">${a.y}</span>
         <span class="wk">${a.w}</span>
         <span class="pr">${a.p}</span>
         <span class="ct">${a.c}</span>
       </div>`
    ).join('');
  }
}

// Wire lang pills
document.querySelectorAll('.lang-pill').forEach(pill => {
  pill.addEventListener('click', (e) => {
    e.preventDefault();
    applyLang(pill.dataset.lang);
  });
});

// Initial apply
applyLang(currentLang());

/* -----  Reservation form (demo, no submit)  ---------------------- */
const form = document.querySelector('form.contact');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const dict = (window.I18N || {})[document.body.getAttribute('data-lang') || 'de'];
    const sentText = getPath(dict, 'res.f_sent') || 'Sent — Thank you';
    const original = btn.textContent;
    btn.textContent = sentText;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; form.reset(); }, 3200);
  });
}
