const games = [...document.querySelectorAll('.game')];
const search = document.querySelector('#game-search');
const filters = [...document.querySelectorAll('[data-filter]')];
const results = document.querySelector('#results-count');
const emptyState = document.querySelector('.empty-state');
let category = 'all';

function updateGames() {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;

  for (const game of games) {
    const matchesCategory = category === 'all' || game.dataset.category === category;
    const matchesSearch = game.querySelector('h3').textContent.toLocaleLowerCase().includes(query);
    game.hidden = !(matchesCategory && matchesSearch);
    if (!game.hidden) count++;
  }

  for (const filter of filters) {
    filter.setAttribute('aria-pressed', String(filter.dataset.filter === category));
  }

  results.textContent = count === games.length
    ? `Showing all ${count} games`
    : `Showing ${count} of ${games.length} games`;
  emptyState.hidden = count !== 0;
}

search.addEventListener('input', updateGames);
for (const filter of filters) {
  filter.addEventListener('click', () => {
    category = filter.dataset.filter;
    updateGames();
  });
}

document.querySelector('#reset-filters').addEventListener('click', () => {
  search.value = '';
  category = 'all';
  updateGames();
  search.focus();
});

document.querySelector('.search-wrap').hidden = false;
document.querySelector('.library-toolbar').hidden = false;
updateGames();
