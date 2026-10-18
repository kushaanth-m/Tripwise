/* ==========================================================================
   TRIPWISE APPLICATION LOGIC + LIVE APIS (REST Countries, Wiki, Open-Meteo)
   ========================================================================== */
const FIELDS = 'name,cca3,capital,continents,population,flags,languages,currencies,capitalInfo,altSpellings';
const KEY = 'tripwise.itinerary.v1', CACHE = 'tripwise.countries.v2';
const $ = s => document.querySelector(s);

const BIZ = { name: 'TripWise Student Builder', email: 'student@vitchennai.ac.in', place: 'Chennai, Tamil Nadu, India', city: 'Chennai', host: 'GitHub Pages' };
document.querySelectorAll('[data-biz]').forEach(e => { const v = BIZ[e.dataset.biz]; e.textContent = v; if (e.dataset.biz === 'email' && v.includes('@')) e.href = 'mailto:' + v; });

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nz = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);
const size = d => d.pop ? 'Population ' + fmt(d.pop) : d.area ? 'Area ' + fmt(d.area) + ' km²' : '—';
const val = o => Object.values(o || {});
const cont = d => d.continents && d.continents.length ? d.continents : [d.subregion === 'South America' ? 'South America' : d.region === 'Americas' ? 'North America' : d.region === 'Antarctic' ? 'Antarctica' : d.region || 'Other'];
const num = v => { const m = String(v).trim().replace(/,/g, '').match(/^(\d*\.?\d+)\s*([kmb])?$/i); return m ? +m[1] * ({ k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase()] || 1) : null; };

const mapRest = d => ({
  id: d.cca3,
  name: d.name.common,
  official: d.name.official || d.name.common,
  capital: (d.capital || [])[0] || '',
  region: cont(d)[0],
  conts: cont(d),
  pop: d.population || 0,
  area: d.area || 0,
  flag: (d.flags && d.flags.png) || ('https://flagcdn.com/w320/' + String(d.cca2 || '').toLowerCase() + '.png'),
  langs: val(d.languages),
  curr: val(d.currencies).map(c => (typeof c === 'object' && c ? c.name : String(c))).filter(Boolean),
  ll: (d.capitalInfo && d.capitalInfo.latlng && d.capitalInfo.latlng.length) ? d.capitalInfo.latlng : d.latlng,
  alt: (d.altSpellings || []).concat(d.cca2 || [])
});

const URLS = [
  'https://restcountries.com/v3.1/all?fields=' + FIELDS,
  'https://restcountries.com/v3.1/independent?status=true&fields=' + FIELDS,
  'https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json',
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json'
];

const FALLBACK = [
  ["IND","in","India","Republic of India","New Delhi","Asia",1428627663,["Hindi","English"],["Indian rupee"],[28.6,77.2]],
  ["JPN","jp","Japan","Japan","Tokyo","Asia",123294513,["Japanese"],["Japanese yen"],[35.68,139.75]],
  ["USA","us","United States","United States of America","Washington, D.C.","North America",339996563,["English"],["United States dollar"],[38.89,-77.05]],
  ["BRA","br","Brazil","Federative Republic of Brazil","Brasília","South America",216422446,["Portuguese"],["Brazilian real"],[-15.79,-47.88]],
  ["KEN","ke","Kenya","Republic of Kenya","Nairobi","Africa",55100586,["English","Swahili"],["Kenyan shilling"],[-1.29,36.82]],
  ["NOR","no","Norway","Kingdom of Norway","Oslo","Europe",5474360,["Norwegian"],["Norwegian krone"],[59.91,10.75]],
  ["PER","pe","Peru","Republic of Peru","Lima","South America",34352719,["Spanish"],["Peruvian sol"],[-12.05,-77.05]],
  ["MAR","ma","Morocco","Kingdom of Morocco","Rabat","Africa",37840044,["Arabic","Berber"],["Moroccan dirham"],[34.02,-6.82]],
  ["FRA","fr","France","French Republic","Paris","Europe",64756584,["French"],["Euro"],[48.87,2.33]],
  ["DEU","de","Germany","Federal Republic of Germany","Berlin","Europe",83294633,["German"],["Euro"],[52.52,13.4]],
  ["GBR","gb","United Kingdom","United Kingdom of Great Britain and Northern Ireland","London","Europe",67736802,["English"],["British pound"],[51.5,-0.08]],
  ["ITA","it","Italy","Italian Republic","Rome","Europe",58870762,["Italian"],["Euro"],[41.9,12.48]],
  ["ESP","es","Spain","Kingdom of Spain","Madrid","Europe",47519628,["Spanish"],["Euro"],[40.4,-3.68]],
  ["CAN","ca","Canada","Canada","Ottawa","North America",40097761,["English","French"],["Canadian dollar"],[45.42,-75.7]],
  ["AUS","au","Australia","Commonwealth of Australia","Canberra","Oceania",26439111,["English"],["Australian dollar"],[-35.27,149.13]],
  ["NZL","nz","New Zealand","New Zealand","Wellington","Oceania",5228100,["English","Māori"],["New Zealand dollar"],[-41.3,174.78]],
  ["KOR","kr","South Korea","Republic of Korea","Seoul","Asia",51784059,["Korean"],["South Korean won"],[37.55,126.98]],
  ["SGP","sg","Singapore","Republic of Singapore","Singapore","Asia",5917648,["English","Malay","Tamil","Mandarin"],["Singapore dollar"],[1.28,103.85]],
  ["THA","th","Thailand","Kingdom of Thailand","Bangkok","Asia",71801279,["Thai"],["Thai baht"],[13.75,100.52]],
  ["EGY","eg","Egypt","Arab Republic of Egypt","Cairo","Africa",112716598,["Arabic"],["Egyptian pound"],[30.05,31.25]],
  ["ZAF","za","South Africa","Republic of South Africa","Pretoria","Africa",60414495,["English","Zulu","Xhosa"],["South African rand"],[-25.7,28.22]],
  ["MEX","mx","Mexico","United Mexican States","Mexico City","North America",128455567,["Spanish"],["Mexican peso"],[19.43,-99.13]],
  ["CHE","ch","Switzerland","Swiss Confederation","Bern","Europe",8796669,["German","French","Italian"],["Swiss franc"],[46.92,7.47]],
  ["GRC","gr","Greece","Hellenic Republic","Athens","Europe",10341277,["Greek"],["Euro"],[37.98,23.73]]
].map(([id, cca2, name, official, capital, region, pop, langs, curr, ll]) => ({
  id, name, official, capital, region, conts: [region], pop, area: 0,
  flag: `https://flagcdn.com/w320/${cca2}.png`, langs, curr, ll, alt: [cca2]
}));

const S = {
  all: [],
  filteredList: [],
  activeCountry: null,
  isExpanded: false,
  status: 'loading',
  view: 'home',
  q: '',
  cont: '',
  from: '',
  to: '',
  sort: 'name',
  note: '',
  liveCache: new Map(),
  trip: (() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } })()
};

let galleryInstance = null;

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S.trip)); } catch {} $('#cnt').textContent = S.trip.length; };
const inTrip = id => S.trip.some(t => t.id === id);
const wx = c => c === 0 ? 'Clear sky' : c <= 3 ? 'Partly cloudy' : c <= 48 ? 'Fog' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : 'Thunderstorm';

async function fetchWithTimeout(url, ms = 4500) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    return r;
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function getData() {
  for (const url of URLS) {
    try {
      const r = await fetchWithTimeout(url, 4500);
      if (!r || !r.ok) continue;
      const j = await r.json();
      if (!Array.isArray(j) || j.length < 50) continue;
      const out = j.map(mapRest);
      try { localStorage.setItem(CACHE, JSON.stringify(out)); } catch {}
      return out;
    } catch {}
  }
  try {
    const c = JSON.parse(localStorage.getItem(CACHE));
    if (c && c.length) { S.note = '(cached copy)'; return c; }
  } catch {}
  S.note = '(offline dataset)';
  return FALLBACK;
}

function filtered() {
  const q = nz(S.q.trim()), toks = q.split(/\s+/).filter(Boolean);
  const lo = num(S.from), hi = num(S.to);
  const l = S.all.filter(d => toks.every(t => d.key.includes(t)) && (!S.cont || d.conts.includes(S.cont)) && (lo == null || d.pop >= lo) && (hi == null || d.pop <= hi));
  const k = d => d.pop || d.area;
  const by = {
    name: (a, b) => (q ? (nz(a.name).startsWith(q) ? 0 : 1) - (nz(b.name).startsWith(q) ? 0 : 1) : 0) || a.name.localeCompare(b.name),
    big: (a, b) => k(b) - k(a),
    small: (a, b) => k(a) - k(b)
  };
  return l.sort(by[S.sort]);
}

function toGalleryItem(d) {
  return {
    image: d.flag,
    text: d.name,
    code: d.id,
    description: `${d.capital || 'No capital'} · ${d.region} · ${size(d)} · Currency: ${d.curr.join(', ') || '—'}`,
    alt: `Flag of ${d.name}`,
    country: d
  };
}

async function loadLiveCountryExtras(d) {
  if (!d) return;
  if (S.liveCache.has(d.id)) {
    applyLiveExtras(d, S.liveCache.get(d.id));
    return;
  }
  const data = { about: 'Loading Wikipedia summary…', wx: 'Loading live weather…' };
  applyLiveExtras(d, data);

  const [wikiRes, wxRes] = await Promise.all([
    fetchWithTimeout('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(d.name.replace(/ /g, '_')), 4500),
    d.ll ? fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${d.ll[0]}&longitude=${d.ll[1]}&current=temperature_2m,weather_code,wind_speed_10m`, 4500) : Promise.resolve(null)
  ]);

  try {
    if (wikiRes && wikiRes.ok) {
      const j = await wikiRes.json();
      data.about = j.extract || `${d.name} (${d.official}) is located in ${d.region}.`;
    } else {
      data.about = `${d.name} (${d.official}) is a destination in ${d.region} with its capital at ${d.capital || 'N/A'}.`;
    }
  } catch {
    data.about = `${d.name} (${d.official}) is a destination in ${d.region}.`;
  }

  try {
    if (wxRes && wxRes.ok) {
      const c = (await wxRes.json()).current;
      data.wx = `${Math.round(c.temperature_2m)}°C, ${wx(c.weather_code)}, wind ${Math.round(c.wind_speed_10m)} km/h`;
    } else {
      data.wx = 'Weather unavailable for this location.';
    }
  } catch {
    data.wx = 'Weather unavailable for this location.';
  }

  S.liveCache.set(d.id, data);
  if (S.activeCountry && S.activeCountry.id === d.id) {
    applyLiveExtras(d, data);
  }
}

function applyLiveExtras(d, data) {
  const aboutEl = $('#dockAbout');
  const wxEl = $('#dockWx');
  if (aboutEl) aboutEl.textContent = data.about;
  if (wxEl) wxEl.textContent = data.wx;
  if (galleryInstance && S.activeCountry && S.activeCountry.id === d.id) {
    galleryInstance.updateCaptionText(`${d.capital || 'No capital'} · ${d.region} · ${data.wx}`);
  }
}

function renderActiveDock() {
  const dock = $('#activeCountryDock');
  const d = S.activeCountry;
  if (!dock || !d) return;
  const added = inTrip(d.id);
  const cached = S.liveCache.get(d.id);
  dock.setAttribute('data-expanded', String(S.isExpanded));
  dock.innerHTML = `
    <div class="dock-head">
      <div class="dock-title">
        <img referrerpolicy="no-referrer" src="${esc(d.flag)}" alt="Flag of ${esc(d.name)}">
        <div>
          <h2>${esc(d.name)}</h2>
          <p class="meta">${esc(d.official)} · ${esc(d.id)}</p>
        </div>
      </div>
      <div class="dock-actions">
        <button class="btn ${added ? 'ghost' : ''}" data-toggle="${d.id}">
          ${added ? 'Remove from trip' : 'Add to trip'}
        </button>
        <button class="btn ghost" id="dockExpandBtn">
          ${S.isExpanded ? 'Collapse card' : 'Expand in gallery'}
        </button>
        <a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name)}" target="_blank" rel="noopener noreferrer">
          Open in Google Maps
        </a>
      </div>
    </div>
    <div class="dock-facts">
      <div><b>Capital</b>${esc(d.capital || '—')}</div>
      <div><b>Continent</b>${esc(d.region)}</div>
      <div><b>${d.pop ? 'Population' : 'Area'}</b>${d.pop ? d.pop.toLocaleString() : d.area ? d.area.toLocaleString() + ' km²' : '—'}</div>
      <div><b>Currency</b>${esc(d.curr.join(', ') || '—')}</div>
      <div><b>Languages</b>${esc(d.langs.slice(0, 4).join(', ') || '—')}</div>
    </div>
    <div class="dock-live">
      <div>
        <h3>About ${esc(d.name)}</h3>
        <p class="meta" id="dockAbout">${esc(cached ? cached.about : 'Click card or wait a moment to load summary…')}</p>
      </div>
      <div>
        <h3>Live Weather in ${esc(d.capital || d.name)}</h3>
        <p class="meta" id="dockWx">${esc(cached ? cached.wx : 'Loading live weather…')}</p>
        <p class="meta" style="font-size:.78rem;margin-top:6px">Open-Meteo.com · Wikipedia (CC BY-SA 4.0)</p>
      </div>
    </div>`;
  loadLiveCountryExtras(d);
}

function ensureGallery() {
  if (galleryInstance) return galleryInstance;
  galleryInstance = createCircularGallery($('#circularGalleryMount'), {
    bend: 3,
    textColor: '#ffffff',
    borderRadius: 0.05,
    scrollEase: 0.05,
    grayscale: true,
    onActiveChange: (index, item) => {
      if (!item || !item.country) return;
      S.activeCountry = item.country;
      renderActiveDock();
    },
    onOpenChange: (isOpen) => {
      S.isExpanded = isOpen;
      renderActiveDock();
    },
    onItemClick: (item) => {
      if (item && item.country) {
        S.activeCountry = item.country;
        loadLiveCountryExtras(item.country);
      }
    }
  });
  return galleryInstance;
}

function updateExploreView() {
  const stateBox = $('#expState');
  const wrapBox = $('#galleryWrap');
  $('#rand').disabled = S.status !== 'ok';

  if (S.status === 'loading') {
    wrapBox.hidden = true;
    stateBox.hidden = false;
    stateBox.innerHTML = `<p class="status">Loading destinations into 3D gallery…</p><div class="skel"></div>`;
    return;
  }
  if (S.status === 'error') {
    wrapBox.hidden = true;
    stateBox.hidden = false;
    stateBox.innerHTML = `<div class="msg" role="alert"><h3>Couldn’t load destinations</h3><p>${esc(S.err)}. Check your connection and try again.</p><button class="btn" id="retry">Retry</button></div>`;
    return;
  }

  const l = filtered();
  S.filteredList = l;
  if (!l.length) {
    wrapBox.hidden = true;
    stateBox.hidden = false;
    stateBox.innerHTML = `<div class="msg"><h3>No destinations match${S.q ? ' “' + esc(S.q) + '”' : ''}</h3><p>Check the spelling or clear the filters.</p><button class="btn ghost" id="clear">Clear search and filters</button></div>`;
    return;
  }

  stateBox.hidden = true;
  wrapBox.hidden = false;
  $('#galStatus').textContent = `${l.length} of ${S.all.length} destinations in circular gallery ${S.note}`;

  S.activeCountry = l[0];
  S.isExpanded = false;
  const gal = ensureGallery();
  if (gal) {
    gal.setItems(l.map(toGalleryItem));
  }
  renderActiveDock();
}

function tripView() {
  if (!S.trip.length) return `<div class="msg" style="margin-top:32px"><h3>Your trip is empty</h3><p>Add destinations from the Circular Gallery in Explore. They stay saved here even after you close the tab.</p><a class="btn" href="#/explore" data-route="explore">Find a country</a></div>`;
  return `<div class="top"><div><h1>My Trip</h1><p class="meta">${S.trip.length} stop${S.trip.length > 1 ? 's' : ''} across ${new Set(S.trip.map(t => t.region)).size} continent(s)</p></div>
    <button class="btn ghost" id="wipe">Remove all stops</button></div>` +
    S.trip.map((t, i) => `<div class="pass"><img class="flag" referrerpolicy="no-referrer" src="${esc(t.flag)}" alt="Flag of ${esc(t.name)}">
      <div><span class="no">Stop ${i + 1}</span><h3>${esc(t.name)}</h3><p class="meta">${esc(t.capital || '—')} · ${esc(t.region)}</p></div>
      <div class="row"><button class="btn ghost" data-jump="${t.id}">View in Gallery</button><button class="btn ghost" data-rm="${t.id}" aria-label="Remove ${esc(t.name)}">Remove</button></div></div>`).join('');
}

function render() {
  $('#cnt').textContent = S.trip.length;
  if (S.view === 'explore') updateExploreView();
  if (S.view === 'trip') $('#vTrip').innerHTML = tripView();
}

async function load() {
  S.status = 'loading'; S.note = ''; render();
  try {
    S.all = (await getData()).map(d => ({ ...d, key: nz([d.name, d.official, d.capital, d.id, ...(d.alt || [])].join(' ')) }));
    S.status = 'ok';
    const cs = [...new Set(S.all.flatMap(d => d.conts))].sort();
    $('#cont').innerHTML = '<option value="">All continents</option>' + cs.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    const hasPop = S.all.some(d => d.pop);
    $('#from').hidden = $('#to').hidden = !hasPop;
  } catch (e) { S.status = 'error'; S.err = e.message; }
  render();
}

function toggle(id) {
  const d = S.all.find(x => x.id === id);
  if (inTrip(id)) S.trip = S.trip.filter(t => t.id !== id);
  else if (d) S.trip.push({ id, name: d.name, capital: d.capital, region: d.region, flag: d.flag });
  save();
  if (S.view === 'explore') renderActiveDock();
  else render();
}

function randomCountry() {
  const pool = S.filteredList.length ? S.filteredList : S.all;
  if (!pool.length || !galleryInstance) return;
  const idx = Math.floor(Math.random() * pool.length);
  galleryInstance.openIndex(idx);
}

const VIEWS = { '': 'vHome', explore: 'vExp', trip: 'vTrip', privacy: 'vPrivacy', terms: 'vTerms', cookies: 'vCookies' };
const TITLES = { '': 'Home', explore: 'Find a country', trip: 'My Trip', privacy: 'Privacy Policy', terms: 'Terms and Conditions', cookies: 'Cookie Policy' };

function route(first, explicitKey) {
  let k = explicitKey !== undefined ? explicitKey : location.hash.replace(/^#\/?/, '');
  if (!(k in VIEWS)) k = '';
  S.view = k || 'home';
  for (const [key, id] of Object.entries(VIEWS)) $('#' + id).hidden = key !== k;
  document.querySelectorAll('nav a[data-nav]').forEach(a => a.dataset.nav === k ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  document.title = (k ? TITLES[k] + ' – ' : '') + 'TripWise';
  render();
  if (S.view === 'explore' && galleryInstance) {
    setTimeout(() => galleryInstance.resize(), 20);
  }
  if (!first) { scrollTo(0, 0); $('#main').focus({ preventScroll: true }); }
}

addEventListener('hashchange', () => route());

document.addEventListener('click', e => {
  const navLink = e.target.closest('[data-route]');
  if (navLink) {
    const targetKey = navLink.getAttribute('data-route');
    const targetHash = '#/' + targetKey;
    if (location.hash !== targetHash) location.hash = targetHash;
    route(false, targetKey);
    return;
  }
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.toggle) toggle(t.dataset.toggle);
  else if (t.id === 'dockExpandBtn' && galleryInstance) galleryInstance.toggleOpenCurrent();
  else if (t.dataset.jump) {
    const id = t.dataset.jump;
    Object.assign(S, { q: '', cont: '', from: '', to: '' });
    $('#q').value = $('#cont').value = $('#from').value = $('#to').value = '';
    location.hash = '#/explore';
    route(false, 'explore');
    const idx = S.filteredList.findIndex(x => x.id === id);
    if (idx >= 0 && galleryInstance) setTimeout(() => galleryInstance.openIndex(idx), 60);
  }
  else if (t.dataset.rm) { S.trip = S.trip.filter(x => x.id !== t.dataset.rm); save(); render(); }
  else if (t.id === 'rand') randomCountry();
  else if (t.id === 'retry') load();
  else if (t.id === 'clear') { Object.assign(S, { q: '', cont: '', from: '', to: '' }); $('#q').value = $('#cont').value = $('#from').value = $('#to').value = ''; updateExploreView(); }
  else if (t.id === 'wipe' && confirm('Remove all destinations from your trip?')) { S.trip = []; save(); render(); }
});

$('#q').addEventListener('input', e => { S.q = e.target.value; updateExploreView(); });
for (const [id, ev] of [['cont', 'change'], ['from', 'input'], ['to', 'input'], ['sort', 'change']]) {
  $('#' + id).addEventListener(ev, e => { S[id] = e.target.value; updateExploreView(); });
}
$('#skip').addEventListener('click', e => { e.preventDefault(); $('#main').focus(); });

$('#hf').addEventListener('submit', e => {
  e.preventDefault();
  S.q = $('#hq').value;
  $('#q').value = S.q;
  location.hash = '#/explore';
  route(false, 'explore');
});

route(true);
load();