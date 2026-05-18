const HISTORY_KEY = 'ckv_history';
const USER_ID_KEY = 'ckv_user_id';
const FAVORITES_KEY = 'ckv_favorites';

function getUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
}

function getFavorites() {
    try {
        const userId = getUserId();
        return JSON.parse(localStorage.getItem(FAVORITES_KEY + '_' + userId) || '[]');
    } catch {
        return [];
    }
}

function isFavorite(href) {
    return getFavorites().some(game => game.href === href);
}

function toggleFavorite(href, title, img, alt) {
    const userId = getUserId();
    const key = FAVORITES_KEY + '_' + userId;
    const favs = getFavorites();
    const index = favs.findIndex(game => game.href === href);

    if (index !== -1) {
        favs.splice(index, 1);
    } else {
        favs.unshift({ href, title, img, alt });
    }

    try {
        localStorage.setItem(key, JSON.stringify(favs));
    } catch {}

    return index === -1;
}

const tagKeywords = {
    action:     ['shoot', 'gun', 'battle', 'war', 'combat', 'fight', 'doom', 'kill', 'ultrakill', 'hotline', 'buckshot', 'counter', 'sniper', 'fps', 'rampage', 'assault'],
    puzzle:     ['puzzle', '2048', 'tetris', 'match', 'merge', 'logic', 'block', 'rope', 'escape', 'brain', 'color', 'colour'],
    racing:     ['car', 'race', 'drift', 'drive', 'truck', 'moto', 'rider', 'speed', 'stunt', 'rally', 'kart'],
    sports:     ['soccer', 'football', 'basketball', 'tennis', 'baseball', 'golf', 'bowling', 'pool', 'volleyball', 'cricket', 'rugby', 'ping pong', 'archery'],
    io:         ['.io', 'agar', 'slither', 'krunker', 'shellshock', 'ev.io', 'paper.io'],
    horror:     ['fnaf', 'freddy', 'backroom', 'nightmare', 'scary', 'amanda', 'baldi', 'horror', 'abandoned', 'arthurs', "arthur's"],
    idle:       ['clicker', 'idle', 'capitalist', 'cookie', 'tycoon', 'incremental', 'miner', 'factory'],
    platformer: ['dash', 'geometry', 'mario', 'platform', 'sonic', 'celeste', 'climb', 'jump king', 'getting over'],
    rpg:        ['rpg', 'quest', 'adventure', 'tale', 'crossing', 'pokemon', 'zelda', 'dungeon', 'academytale'],
    sandbox:    ['minecraft', 'terraria', 'build', 'craft', 'playground', 'people'],
    multiplayer:['2 player', '1v1', 'among us', 'battle royale', '1 on 1', 'duo', 'tag'],
};

function getTagsForTitle(title) {
    const lower = title.toLowerCase();
    return Object.entries(tagKeywords).reduce((tags, [tag, keywords]) => {
        if (keywords.some(kw => lower.includes(kw))) tags.push(tag);
        return tags;
    }, []);
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
        return [];
    }
}

function recordPlay(href, title) {
    const history = getHistory();
    const index = history.findIndex(entry => entry.href === href);
    if (index !== -1) history.splice(index, 1);
    history.unshift({ href, title });
    if (history.length > 60) history.length = 60;
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
}

function parseGames() {
    const container = document.createElement('div');
    container.innerHTML = games;
    return Array.from(container.querySelectorAll('.game-link')).map(a => ({
        href: a.getAttribute('href') || '',
        title: a.querySelector('div')?.textContent?.trim() || '',
        img: a.querySelector('img')?.getAttribute('src') || '',
        alt: a.querySelector('img')?.getAttribute('alt') || '',
    }));
}

function verifyGameAvailability(card, game) {
    if (game.isRandom || !game.href || !window.fetch) return;
    fetch(game.href, { method: 'HEAD', cache: 'no-store' })
        .then(response => {
            if (!response.ok) card.remove();
        })
        .catch(() => card.remove());
}

function buildCard(game) {
    if (game.isRandom) {
        const div = document.createElement('div');
        div.className = 'game-link random-game';
        div.id = 'random-btn';

        const img = document.createElement('img');
        img.id = 'random-preview';
        img.src = game.img;
        img.alt = game.alt;

        const label = document.createElement('div');
        label.textContent = game.title;

        div.appendChild(img);
        div.appendChild(label);

        div.addEventListener('click', () => {
            const random = allGames[Math.floor(Math.random() * (allGames.length - 1)) + 1];
            if (random && random.href) window.location.href = random.href;
        });

        return div;
    }

    const container = document.createElement('div');
    container.className = 'game-card-container';

    const link = document.createElement('a');
    link.className = 'game-link';
    link.href = game.href;
    link.setAttribute('aria-label', `Open ${game.title}`);

    const img = document.createElement('img');
    img.src = game.img;
    img.alt = game.alt;
    img.loading = 'lazy';

    img.addEventListener('error', () => container.remove());

    const titleLabel = document.createElement('div');
    titleLabel.textContent = game.title;

    link.appendChild(img);
    link.appendChild(titleLabel);
    link.addEventListener('click', () => recordPlay(game.href, game.title));

    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn';
    favBtn.setAttribute('aria-label', `Toggle favorite for ${game.title}`);
    favBtn.textContent = isFavorite(game.href) ? '❤' : '🤍';
    if (isFavorite(game.href)) favBtn.classList.add('favorited');

    favBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(game.href, game.title, game.img, game.alt);
        favBtn.textContent = isFavorite(game.href) ? '❤' : '🤍';
        favBtn.classList.toggle('favorited');
        renderFavorites();
    });

    container.appendChild(link);
    container.appendChild(favBtn);
    return container;
}


const allGames = parseGames();
const randomGame = {
    href: '#',
    title: 'Random Game',
    img: allGames[0]?.img || 'favicon.png',
    alt: 'Random Game Cover',
    isRandom: true,
};
allGames.unshift(randomGame);
allGames.sort((a, b) => {
    if (a.isRandom) return -1;
    if (b.isRandom) return 1;
    return a.title.localeCompare(b.title, undefined, { numeric: true });
});

const grid = document.getElementById('game-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const favoritesSection = document.getElementById('favorites-section');
const searchEl = document.getElementById('search');
const tagFiltersEl = document.getElementById('tag-filters');
const noResults = document.getElementById('no-results');
const viewAllBtn = document.getElementById('view-all-btn');
const viewFavoritesBtn = document.getElementById('view-favorites-btn');

let activeTag = 'all';
let searchQuery = '';
let currentView = 'all';

searchEl.placeholder = `search ${allGames.length - 1} games...`;

function renderTagFilters() {
    tagFiltersEl.innerHTML = '';

    const allFilter = document.createElement('button');
    allFilter.className = `tag-btn${activeTag === 'all' ? ' active' : ''}`;
    allFilter.textContent = 'All';
    allFilter.addEventListener('click', () => {
        activeTag = 'all';
        renderTagFilters();
        refreshContent();
    });
    tagFiltersEl.appendChild(allFilter);

    Object.keys(tagKeywords).forEach(tag => {
        const button = document.createElement('button');
        button.className = `tag-btn${activeTag === tag ? ' active' : ''}`;
        button.textContent = tag;
        button.addEventListener('click', () => {
            activeTag = tag;
            renderTagFilters();
            refreshContent();
        });
        tagFiltersEl.appendChild(button);
    });
}

function getFilteredGames() {
    const query = searchQuery.trim().toLowerCase();
    const favorites = new Set(getFavorites().map(game => game.href));

    return allGames.filter(game => {
        if (game.isRandom && currentView === 'favorites') return false;
        if (currentView === 'favorites' && !favorites.has(game.href)) return false;
        if (activeTag !== 'all' && !game.isRandom && !getTagsForTitle(game.title).includes(activeTag)) return false;
        if (!query) return true;

        return game.title.toLowerCase().includes(query)
            || game.alt.toLowerCase().includes(query)
            || game.href.toLowerCase().includes(query);
    });
}

function renderGrid(games) {
    grid.innerHTML = '';

    if (games.length === 0) {
        noResults.style.display = 'block';
        grid.style.display = 'none';
        return;
    }

    noResults.style.display = 'none';
    grid.style.display = 'grid';

    const fragment = document.createDocumentFragment();
    games.forEach(game => {
        const card = buildCard(game);
        fragment.appendChild(card);
        verifyGameAvailability(card, game);
    });
    grid.appendChild(fragment);
}

function updateViewButtons() {
    viewAllBtn.classList.toggle('active', currentView === 'all');
    viewFavoritesBtn.classList.toggle('active', currentView === 'favorites');
}

function toggleView(view) {
    currentView = view;
    updateViewButtons();
    refreshContent();
}

function renderFavorites() {
    const favorites = getFavorites();
    favoritesGrid.innerHTML = '';
    viewAllBtn.style.display = 'inline-block';
    viewFavoritesBtn.style.display = 'inline-block';
    viewFavoritesBtn.textContent = `❤ Favorites (${favorites.length})`;

    if (favorites.length === 0) {
        favoritesSection.style.display = 'none';
        return;
    }

    favoritesSection.style.display = 'block';
    const fragment = document.createDocumentFragment();
    favorites.forEach(fav => {
        const card = buildCard(fav);
        fragment.appendChild(card);
    });
    favoritesGrid.appendChild(fragment);
}

function refreshContent() {
    renderFavorites();
    renderGrid(getFilteredGames());
}

searchEl.addEventListener('input', event => {
    searchQuery = event.target.value;
    refreshContent();
});

viewAllBtn.addEventListener('click', () => toggleView('all'));
viewFavoritesBtn.addEventListener('click', () => toggleView('favorites'));

renderTagFilters();
refreshContent();

const randomImg = document.getElementById('random-preview');
const gameImages = [...allGames.slice(1)]
    .map(game => game.img)
    .filter(Boolean)
    .sort(() => Math.random() - 0.5);
let imgIndex = 0;
setInterval(() => {
    if (!randomImg || gameImages.length === 0) return;
    imgIndex = (imgIndex + 1) % gameImages.length;
    randomImg.src = gameImages[imgIndex];
}, 200);

function filterGames() {
    const q = searchQuery.trim().toLowerCase();
    let visible = 0;
    
    if (currentView === 'all') {
        grid.querySelectorAll('.game-link:not(.random-game)').forEach(a => {
            const container = a.closest('.game-card-container') || a;
            const title = (a.querySelector('div')?.textContent || '').toLowerCase();
            const titleOk = !q || title.includes(q);
            const tagOk   = activeTag === 'all' || getTagsForTitle(a.querySelector('div')?.textContent || '').includes(activeTag);
            const show    = titleOk && tagOk;
            container.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        noResults.style.display = visible === 0 ? 'block' : 'none';
    } else {
        favoritesGrid.querySelectorAll('.game-link:not(.random-game)').forEach(a => {
            const container = a.closest('.game-card-container') || a;
            const title = (a.querySelector('div')?.textContent || '').toLowerCase();
            const titleOk = !q || title.includes(q);
            const tagOk   = activeTag === 'all' || getTagsForTitle(a.querySelector('div')?.textContent || '').includes(activeTag);
            const show    = titleOk && tagOk;
            container.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        noFavorites.style.display = visible === 0 ? 'block' : 'none';
    }
}


searchEl.addEventListener('input', () => {
    searchQuery = searchEl.value;
    filterGames();
    const q = searchEl.value.trim().toLowerCase();
    if (q === 'end') window.open('https://youtu.be/eVTXPUF4Oz4?si=fJegVrBYO1yf0I80');
    if (q === 'chicken') document.querySelector('.wordmark img').classList.add('spinning');
    if (q === 'ckv') {
        const msg = document.createElement('div');
        msg.textContent = 'hey';
        msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:96px;font-weight:900;color:var(--accent);pointer-events:none;z-index:9999;animation:fadepop 1.4s forwards';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 1400);
    }
});

searchEl.addEventListener('keydown', e => {
    if (e.key === 'Escape') { searchEl.value = ''; searchQuery = ''; filterGames(); }
});

// View toggle buttons
viewAllBtn.addEventListener('click', () => {
    currentView = 'all';
    viewAllBtn.classList.add('active');
    viewFavoritesBtn.classList.remove('active');
    favoritesSection.style.display = 'none';
    grid.style.display = 'grid';
    noResults.style.display = 'none';
    filterGames();
});

viewFavoritesBtn.addEventListener('click', () => {
    currentView = 'favorites';
    viewFavoritesBtn.classList.add('active');
    viewAllBtn.classList.remove('active');
    favoritesSection.style.display = 'block';
    grid.style.display = 'none';
    filterGames();
});

if (tagFiltersEl) {
    tagFiltersEl.addEventListener('click', e => {
        const btn = e.target.closest('.tag-btn');
        if (!btn) return;
        document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTag = btn.dataset.tag;
        filterGames();
    });
}


const suggestions = getSuggestions(allGames);
if (suggestions.length >= 3 && forYouSection && suggestionsRow) {
    suggestions.forEach(g => suggestionsRow.appendChild(buildCard(g)));
    forYouSection.style.display = 'block';
}

const randomBtnLabels = ['random game', 'another one?', 'still looking?', 'just pick already', 'fine, here'];
let randomBtnIdx = 0;
let randomBtnReset = null;

document.getElementById('random-btn').addEventListener('click', () => {
    const visible = allGames.filter(g => {
        const tagOk   = activeTag === 'all' || getTagsForTitle(g.title).includes(activeTag);
        const titleOk = !searchQuery || g.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
        return tagOk && titleOk;
    });
    if (!visible.length) return;
    const pick = visible[Math.floor(Math.random() * visible.length)];
    const preview = document.getElementById('random-preview');
    preview.innerHTML = '';
    preview.appendChild(buildCard(pick));

    clearTimeout(randomBtnReset);
    randomBtnIdx = Math.min(randomBtnIdx + 1, randomBtnLabels.length - 1);
    document.getElementById('random-btn').textContent = randomBtnLabels[randomBtnIdx];
    randomBtnReset = setTimeout(() => {
        randomBtnIdx = 0;
        document.getElementById('random-btn').textContent = randomBtnLabels[0];
    }, 8000);
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}

(function quirks() {
    const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiPos = 0;
    document.addEventListener('keydown', e => {
        konamiPos = e.key === konamiSeq[konamiPos] ? konamiPos + 1 : (e.key === konamiSeq[0] ? 1 : 0);
        if (konamiPos === konamiSeq.length) {
            konamiPos = 0;
            grid.classList.add('rainbow-mode');
            setTimeout(() => grid.classList.remove('rainbow-mode'), 5000);
        }
    });

    const logoImg = document.querySelector('.wordmark img');
    let logoTaps = [];
    logoImg.addEventListener('click', e => {
        e.preventDefault();
        const now = Date.now();
        logoTaps = logoTaps.filter(t => now - t < 700);
        logoTaps.push(now);
        if (logoTaps.length >= 3) {
            logoTaps = [];
            logoImg.classList.add('spinning');
            logoImg.addEventListener('animationend', () => logoImg.classList.remove('spinning'), { once: true });
        }
    });

    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 4) {
        document.querySelector('.wordmark').setAttribute('title', 'go to sleep');
    }

    const played = getHistory().length;
    if (played > 0) {
        const fp = document.querySelector('.site-footer p');
        if (fp) {
            const badge = document.createElement('span');
            badge.style.color = 'var(--text-muted)';
            badge.textContent = ` — ${played} game${played !== 1 ? 's' : ''} played`;
            fp.appendChild(badge);
        }
    }
}());
