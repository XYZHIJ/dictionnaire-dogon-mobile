// script.js – Interactive search, filters, and favorites for Dogon‑French dictionary
// Assumes DICTIONARY_DATA is defined in data.js (array of objects)

// ---- DOM references ----
const searchInput = document.getElementById('search');
const typeSelect = document.getElementById('typeFilter');
const letterContainer = document.getElementById('letterFilter');
const favToggle = document.getElementById('favToggle');
const resultsContainer = document.getElementById('results');

// ---- State ----
let activeLetter = '';
let showFavoritesOnly = false;
let favorites = JSON.parse(localStorage.getItem('dogon_favorites') || '[]');

// ---- Helpers ----
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function isFav(word) { return favorites.includes(word); }
function toggleFav(word) {
  if (isFav(word)) {
    favorites = favorites.filter(w => w !== word);
  } else {
    favorites.push(word);
  }
  localStorage.setItem('dogon_favorites', JSON.stringify(favorites));
}

// ---- Populate Type filter ----
function populateTypeFilter() {
  const types = new Set();
  DICTIONARY_DATA.forEach(e => { if (e.type) types.add(e.type); });
  const fragment = document.createDocumentFragment();
  Array.from(types).sort().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    fragment.appendChild(opt);
  });
  typeSelect.appendChild(fragment);
}

// ---- Populate Letter filter (A‑Z) ----
function populateLetterFilter() {
  const letters = new Set();
  DICTIONARY_DATA.forEach(e => {
    const first = e.word.charAt(0).toUpperCase();
    if (first.match(/[A-Z]/)) letters.add(first);
  });
  const fragment = document.createDocumentFragment();
  Array.from(letters).sort().forEach(l => {
    const btn = document.createElement('button');
    btn.textContent = l;
    btn.dataset.letter = l;
    btn.addEventListener('click', () => {
      activeLetter = l;
      letterContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
    fragment.appendChild(btn);
  });
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.dataset.letter = '';
  allBtn.classList.add('active');
  allBtn.addEventListener('click', () => {
    activeLetter = '';
    letterContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    render();
  });
  letterContainer.appendChild(allBtn);
  letterContainer.appendChild(fragment);
}

// ---- Filtering logic ----
function filterEntries(query) {
  const lowered = query.toLowerCase();
  return DICTIONARY_DATA.filter(e => {
    const matchesQuery = !query || e.word.toLowerCase().includes(lowered) || (e.definition && e.definition.toLowerCase().includes(lowered));
    const matchesType = !typeSelect.value || e.type === typeSelect.value;
    const matchesLetter = !activeLetter || e.word.charAt(0).toUpperCase() === activeLetter;
    const matchesFav = !showFavoritesOnly || isFav(e.word);
    return matchesQuery && matchesType && matchesLetter && matchesFav;
  });
}

// ---- Rendering ----
function clearResults() { resultsContainer.innerHTML = ''; }

function render() {
  clearResults();
  const query = searchInput.value.trim();
  const filtered = filterEntries(query);
  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'Aucun résultat.';
    empty.style.color = '#ffb6b6';
    empty.style.padding = '2rem';
    resultsContainer.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  filtered.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'card';
    let html = `<h2>${esc(entry.word)}</h2>`;
    if (entry.type) html += `<div class="type">${esc(entry.type)}</div>`;
    if (entry.definition) html += `<div class="def">${esc(entry.definition)}</div>`;
    if (entry.examples) html += `<div class="ex">${esc(entry.examples)}</div>`;
    if (entry.page) html += `<div style="margin-top:0.4rem;font-size:0.8rem;color:#8fa1c2;">Page ${esc(entry.page)}</div>`;
    card.innerHTML = html;
    const fav = document.createElement('span');
    fav.className = 'fav' + (isFav(entry.word) ? ' active' : '');
    fav.textContent = '❤';
    fav.title = isFav(entry.word) ? 'Retirer des favoris' : 'Ajouter aux favoris';
    fav.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFav(entry.word);
      render();
    });
    card.appendChild(fav);
    fragment.appendChild(card);
  });
  resultsContainer.appendChild(fragment);
}

// ---- Event handlers ----
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const handleSearch = debounce(() => {
  render();
}, 250);
searchInput.addEventListener('input', handleSearch);

typeSelect.addEventListener('change', render);

favToggle.addEventListener('click', () => {
  showFavoritesOnly = !showFavoritesOnly;
  favToggle.classList.toggle('active', showFavoritesOnly);
  render();
});

// ---- Init ----
populateTypeFilter();
populateLetterFilter();
render();
