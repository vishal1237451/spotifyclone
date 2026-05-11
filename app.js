/* ========================================================
   Spotify Clone — JioSaavn Integration
   ======================================================== */
(() => {
  'use strict';

  // ——— Config ———
  const API_BASE = 'http://localhost:3000/api';
  const AUDIO_QUALITY = '160kbps'; // 12, 48, 96, 160, 320

  const VALID_USERS = [
    { username: 'vishal', password: '12345' },
    { username: 'user',  password: 'password' },
  ];

  // ——— Default tracks (shown on home before searching) ———
  const DEFAULT_QUERIES = ['arijit singh hits', 'bollywood latest', 'ap dhillon', 'romantic hindi songs'];

  // ——— State ———
  let isAuthenticated = false;
  let currentTrack = null;
  let isPlaying = false;
  let volume = 0.7;
  let savedVolume = 0.7;
  let isMuted = false;
  let isSeeking = false;
  let homeTracks = [];     // tracks loaded on home
  let searchTrackCache = []; // tracks from search

  // ——— DOM refs ———
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const loginScreen   = $('#login-screen');
  const appScreen     = $('#app-screen');
  const loginForm     = $('#login-form');
  const usernameInput = $('#username');
  const passwordInput = $('#password');
  const errorMsg      = $('#error-message');
  const loginBtn      = $('#login-button');
  const btnText       = loginBtn.querySelector('.btn-text');
  const btnLoader     = loginBtn.querySelector('.btn-loader');
  const togglePwdBtn  = $('#toggle-password');
  const eyeOpen       = $('#eye-open');
  const eyeClosed     = $('#eye-closed');
  const logoutBtn     = $('#logout-button');
  const userNameEl    = $('#user-name');
  const userAvatarEl  = $('#user-avatar');
  const heroGreeting  = $('#hero-greeting');

  const audio = $('#audio-player');

  const nowPlayingTitle  = $('#now-playing-title');
  const nowPlayingArtist = $('#now-playing-artist');
  const nowPlayingImg    = $('#now-playing-img');
  const playPauseBtn     = $('#play-pause-btn');
  const iconPlay         = $('#icon-play');
  const iconPause        = $('#icon-pause');
  const progressFill     = $('#progress-fill');
  const progressThumb    = $('#progress-thumb');
  const progressBar      = $('#progress-bar');
  const currentTimeEl    = $('#current-time');
  const totalTimeEl      = $('#total-time');
  const shuffleBtn       = $('#shuffle-btn');
  const repeatBtn        = $('#repeat-btn');
  const prevBtn          = $('#prev-btn');
  const nextBtn          = $('#next-btn');

  const volumeBtn   = $('#volume-btn');
  const volIconHigh = $('#vol-icon-high');
  const volIconLow  = $('#vol-icon-low');
  const volIconMute = $('#vol-icon-mute');
  const volumeBar   = $('#volume-bar');
  const volumeFill  = $('#volume-fill');
  const volumeThumb = $('#volume-thumb');

  const searchInput   = $('#search-input');
  const searchClear   = $('#search-clear');
  const searchResults = $('#search-results');

  // ——————————————————————————————————————————————
  //  JIOSAAVN API HELPERS
  // ——————————————————————————————————————————————

  async function apiSearchSongs(query, limit = 20) {
    try {
      const res = await fetch(`${API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
      const json = await res.json();
      if (json.success && json.data?.results) return json.data.results;
    } catch (e) { console.error('API search error:', e); }
    return [];
  }

  /** Normalize an API song into a flat track object */
  function normalizeTrack(song) {
    const artistNames = (song.artists?.primary || []).map(a => a.name).join(', ') || 'Unknown';
    const image = song.image?.find(i => i.quality === '500x500')?.url
               || song.image?.find(i => i.quality === '150x150')?.url
               || '';
    const audioUrl = song.downloadUrl?.find(d => d.quality === AUDIO_QUALITY)?.url
                  || song.downloadUrl?.find(d => d.quality === '96kbps')?.url
                  || song.downloadUrl?.[0]?.url || '';
    return {
      id: song.id,
      title: song.name?.replace(/&quot;/g, '"').replace(/&amp;/g, '&') || 'Unknown',
      artist: artistNames,
      image,
      src: audioUrl,
      duration: song.duration || 0,
      album: song.album?.name || '',
    };
  }

  // ——————————————————————————————————————————————
  //  AUTHENTICATION
  // ——————————————————————————————————————————————

  function checkSession() {
    const session = sessionStorage.getItem('spotify_session');
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.authenticated && data.username) {
          isAuthenticated = true;
          showApp(data.username);
          return;
        }
      } catch (_) {}
    }
    showLogin();
  }

  function showLogin() {
    isAuthenticated = false;
    loginScreen.classList.add('active');
    appScreen.classList.remove('active');
    sessionStorage.removeItem('spotify_session');
    usernameInput.value = '';
    passwordInput.value = '';
    hideError();
    usernameInput.focus();
  }

  function showApp(username) {
    isAuthenticated = true;
    loginScreen.classList.remove('active');
    appScreen.classList.add('active');
    userNameEl.textContent = username;
    userAvatarEl.textContent = username.charAt(0).toUpperCase();
    setGreeting();
    sessionStorage.setItem('spotify_session', JSON.stringify({ authenticated: true, username, timestamp: Date.now() }));
    loadHomeTracks();
  }

  function authenticate(u, p) {
    return VALID_USERS.some(v => v.username.toLowerCase() === u.toLowerCase() && v.password === p);
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');
    const pw = $('#input-group-password');
    pw.classList.add('shake');
    setTimeout(() => pw.classList.remove('shake'), 500);
  }

  function hideError() { errorMsg.classList.remove('visible'); }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) { showError('Please fill in all fields.'); return; }
    loginBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    await sleep(800);
    if (authenticate(username, password)) {
      loginBtn.style.background = '#1ed760';
      await sleep(300);
      showApp(username);
      loginBtn.style.background = '';
    } else {
      showError('Invalid username or password. Please try again.');
    }
    loginBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  });

  togglePwdBtn.addEventListener('click', () => {
    const isP = passwordInput.type === 'password';
    passwordInput.type = isP ? 'text' : 'password';
    eyeOpen.classList.toggle('hidden', !isP);
    eyeClosed.classList.toggle('hidden', isP);
  });

  logoutBtn.addEventListener('click', () => { stopPlayback(); showLogin(); });
  usernameInput.addEventListener('input', hideError);
  passwordInput.addEventListener('input', hideError);

  function setGreeting() {
    const h = new Date().getHours();
    heroGreeting.textContent = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  }

  // ——————————————————————————————————————————————
  //  HOME PAGE — Load Trending Tracks
  // ——————————————————————————————————————————————

  async function loadHomeTracks() {
    const cardRow1 = $('#card-row-1');
    const cardRow2 = $('#card-row-2');
    cardRow1.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Loading songs...</p>';
    cardRow2.innerHTML = '';

    try {
      const [set1, set2] = await Promise.all([
        apiSearchSongs(DEFAULT_QUERIES[0], 5),
        apiSearchSongs(DEFAULT_QUERIES[1], 5),
      ]);

      homeTracks = [...set1, ...set2].map(normalizeTrack);

      cardRow1.innerHTML = '';
      set1.map(normalizeTrack).forEach((t, i) => cardRow1.appendChild(createMusicCard(t, i)));

      cardRow2.innerHTML = '';
      set2.map(normalizeTrack).forEach((t, i) => cardRow2.appendChild(createMusicCard(t, set1.length + i)));

      // Also populate quick-play cards
      populateQuickCards(homeTracks.slice(0, 6));
    } catch (err) {
      cardRow1.innerHTML = '<p style="color:#ff4d4d;padding:20px;">Failed to load songs. Make sure the JioSaavn API is running on localhost:3000</p>';
      console.error(err);
    }
  }

  function createMusicCard(track, indexInHome) {
    const card = document.createElement('div');
    card.className = 'music-card';
    card.innerHTML = `
      <div class="card-img-wrapper">
        <div class="card-img" style="background-image:url('${track.image}');background-size:cover;background-position:center;${!track.image ? 'background:linear-gradient(135deg,#667eea,#764ba2)' : ''}"></div>
        <button class="play-fab" aria-label="Play ${track.title}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <p class="card-title">${track.title}</p>
      <p class="card-desc">${track.artist}</p>
    `;
    card.addEventListener('click', () => playFromList(homeTracks, indexInHome));
    return card;
  }

  function populateQuickCards(tracks) {
    const cards = $$('.quick-card');
    cards.forEach((card, i) => {
      if (tracks[i]) {
        const t = tracks[i];
        const imgDiv = card.querySelector('.quick-img');
        if (t.image) {
          imgDiv.style.backgroundImage = `url('${t.image}')`;
          imgDiv.style.backgroundSize = 'cover';
          imgDiv.style.backgroundPosition = 'center';
          imgDiv.querySelector('svg').style.display = 'none';
        }
        card.querySelector('span').textContent = t.title;
        card.onclick = () => playFromList(homeTracks, i);
      }
    });
  }

  // ——————————————————————————————————————————————
  //  AUDIO PLAYER
  // ——————————————————————————————————————————————

  let currentPlaylist = [];
  let currentPlaylistIndex = -1;

  function formatTime(s) {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }

  function updateProgress(pct) {
    const p = Math.min(Math.max(pct, 0), 1) * 100;
    progressFill.style.width = `${p}%`;
    progressThumb.style.left = `${p}%`;
  }

  function playFromList(list, index) {
    currentPlaylist = list;
    currentPlaylistIndex = index;
    playTrack(list[index]);
  }

  function playTrack(track) {
    if (!track || !track.src) return;
    currentTrack = track;
    nowPlayingTitle.textContent = track.title;
    nowPlayingArtist.textContent = track.artist;
    if (track.image) {
      nowPlayingImg.style.backgroundImage = `url('${track.image}')`;
      nowPlayingImg.style.backgroundSize = 'cover';
      nowPlayingImg.style.backgroundPosition = 'center';
      nowPlayingImg.style.background = '';
      nowPlayingImg.style.cssText = `background-image:url('${track.image}');background-size:cover;background-position:center;`;
    }
    audio.src = track.src;
    audio.volume = volume;
    audio.play().catch(() => pausePlayback());
    isPlaying = true;
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    closeSearch();
    document.title = `${track.title} — Spotify Clone`;
  }

  function startPlayback() {
    if (!currentTrack) return;
    audio.play().catch(() => {});
    isPlaying = true;
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  }

  function pausePlayback() {
    audio.pause();
    isPlaying = false;
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  }

  function stopPlayback() {
    audio.pause();
    audio.src = '';
    isPlaying = false;
    currentTrack = null;
    currentPlaylistIndex = -1;
    updateProgress(0);
    nowPlayingTitle.textContent = 'Select a song';
    nowPlayingArtist.textContent = '—';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    document.title = 'Spotify First Copy';
  }

  audio.addEventListener('timeupdate', () => {
    if (isSeeking || isNaN(audio.duration)) return;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    updateProgress(audio.currentTime / audio.duration);
  });

  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    if (repeatBtn.classList.contains('active')) { audio.currentTime = 0; audio.play(); return; }
    if (currentPlaylist.length === 0) return;
    let nextIdx;
    if (shuffleBtn.classList.contains('active')) {
      do { nextIdx = Math.floor(Math.random() * currentPlaylist.length); }
      while (nextIdx === currentPlaylistIndex && currentPlaylist.length > 1);
    } else {
      nextIdx = (currentPlaylistIndex + 1) % currentPlaylist.length;
    }
    playFromList(currentPlaylist, nextIdx);
  });

  playPauseBtn.addEventListener('click', () => {
    if (!currentTrack) { if (homeTracks.length) playFromList(homeTracks, 0); return; }
    isPlaying ? pausePlayback() : startPlayback();
  });

  prevBtn.addEventListener('click', () => {
    if (!currentTrack || currentPlaylist.length === 0) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    const idx = (currentPlaylistIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playFromList(currentPlaylist, idx);
  });

  nextBtn.addEventListener('click', () => {
    if (!currentTrack || currentPlaylist.length === 0) return;
    let idx;
    if (shuffleBtn.classList.contains('active')) {
      do { idx = Math.floor(Math.random() * currentPlaylist.length); }
      while (idx === currentPlaylistIndex && currentPlaylist.length > 1);
    } else {
      idx = (currentPlaylistIndex + 1) % currentPlaylist.length;
    }
    playFromList(currentPlaylist, idx);
  });

  shuffleBtn.addEventListener('click', () => shuffleBtn.classList.toggle('active'));
  repeatBtn.addEventListener('click', () => repeatBtn.classList.toggle('active'));

  // Progress seek
  progressBar.addEventListener('mousedown', (e) => {
    isSeeking = true;
    seekFromEvent(e);
    const onMove = (ev) => seekFromEvent(ev);
    const onUp = () => { isSeeking = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  progressBar.addEventListener('click', (e) => seekFromEvent(e));

  function seekFromEvent(e) {
    if (!currentTrack || isNaN(audio.duration)) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = pct * audio.duration;
    updateProgress(pct);
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }

  // ——————————————————————————————————————————————
  //  VOLUME CONTROL
  // ——————————————————————————————————————————————

  function updateVolumeIcon() {
    volIconHigh.classList.add('hidden');
    volIconLow.classList.add('hidden');
    volIconMute.classList.add('hidden');
    if (isMuted || volume === 0) volIconMute.classList.remove('hidden');
    else if (volume < 0.5) volIconLow.classList.remove('hidden');
    else volIconHigh.classList.remove('hidden');
  }

  function setVolume(val) {
    volume = Math.min(Math.max(val, 0), 1);
    audio.volume = volume;
    isMuted = volume === 0;
    volumeFill.style.width = `${volume * 100}%`;
    volumeThumb.style.left = `${volume * 100}%`;
    updateVolumeIcon();
  }

  volumeBar.addEventListener('mousedown', (e) => {
    setVolumeFromEvent(e);
    const onMove = (ev) => setVolumeFromEvent(ev);
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  volumeBar.addEventListener('click', (e) => setVolumeFromEvent(e));

  function setVolumeFromEvent(e) {
    const rect = volumeBar.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    savedVolume = pct > 0 ? pct : savedVolume;
    setVolume(pct);
  }

  volumeBtn.addEventListener('click', () => {
    if (isMuted) { setVolume(savedVolume > 0 ? savedVolume : 0.7); isMuted = false; }
    else { savedVolume = volume; setVolume(0); isMuted = true; }
    updateVolumeIcon();
  });

  audio.volume = volume;
  updateVolumeIcon();

  // ——————————————————————————————————————————————
  //  SEARCH (Live JioSaavn Search)
  // ——————————————————————————————————————————————

  function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function highlightMatch(text, query) {
    if (!query) return text;
    return text.replace(new RegExp(`(${escapeRegex(query)})`, 'gi'), '<span class="highlight">$1</span>');
  }

  function renderSearchResults(tracks, query) {
    if (tracks.length === 0) {
      searchResults.innerHTML = `<div class="search-no-results">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <p>No results for "<strong>${escapeHtml(query)}</strong>"</p></div>`;
      searchResults.classList.add('visible');
      return;
    }

    searchTrackCache = tracks;
    let html = `<div class="search-results-header">Songs — ${tracks.length} results</div>`;
    tracks.forEach((t, i) => {
      html += buildResultItemHTML(t, i, query);
    });

    searchResults.innerHTML = html;
    searchResults.classList.add('visible');
    attachResultClickHandlers(searchTrackCache);
  }

  /** Build HTML for a single search result row */
  function buildResultItemHTML(t, i, query) {
    return `<div class="search-result-item" data-idx="${i}">
      <div class="search-result-img" style="background-image:url('${t.image}');background-size:cover;background-position:center;${!t.image ? 'background:linear-gradient(135deg,#667eea,#764ba2)' : ''}">
        ${!t.image ? '<svg viewBox="0 0 24 24" fill="white"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/></svg>' : ''}
      </div>
      <div class="search-result-info">
        <div class="search-result-title">${query ? highlightMatch(escapeHtml(t.title), query) : escapeHtml(t.title)}</div>
        <div class="search-result-artist">${query ? highlightMatch(escapeHtml(t.artist), query) : escapeHtml(t.artist)}</div>
      </div>
      <div class="search-result-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
    </div>`;
  }

  /** Attach click handlers to all result items */
  function attachResultClickHandlers(trackList) {
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.idx, 10);
        const track = trackList[idx];
        if (track) saveToRecentSearches(track);
        playFromList(trackList, idx);
      });
    });
  }

  // ——————————————————————————————————————————————
  //  RECENT SEARCHES (localStorage)
  // ——————————————————————————————————————————————

  const RECENT_KEY = 'spotify_recent_searches';
  const MAX_RECENT = 10;

  function getRecentSearches() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch { return []; }
  }

  function saveToRecentSearches(track) {
    let recent = getRecentSearches();
    // Remove duplicate by id or title+artist
    recent = recent.filter(r => r.id !== track.id);
    // Add to front
    recent.unshift({ id: track.id, title: track.title, artist: track.artist, image: track.image, src: track.src, duration: track.duration, album: track.album || '' });
    // Limit
    if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  function clearRecentSearches() {
    localStorage.removeItem(RECENT_KEY);
    closeSearch();
  }

  function renderRecentSearches() {
    const recent = getRecentSearches();
    if (recent.length === 0) return;

    let html = `<div class="search-results-header" style="display:flex;justify-content:space-between;align-items:center;">
      <span>Recent searches</span>
      <button id="clear-recent-btn" style="background:none;border:none;color:var(--text-muted);font-size:.75rem;cursor:pointer;padding:2px 8px;border-radius:4px;transition:color .2s,background .2s;">Clear all</button>
    </div>`;

    searchTrackCache = recent;
    recent.forEach((t, i) => {
      html += `<div class="search-result-item" data-idx="${i}">
        <div class="search-result-img" style="background-image:url('${t.image}');background-size:cover;background-position:center;${!t.image ? 'background:linear-gradient(135deg,#667eea,#764ba2)' : ''}">
          ${!t.image ? '<svg viewBox="0 0 24 24" fill="white"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/></svg>' : ''}
        </div>
        <div class="search-result-info">
          <div class="search-result-title">${escapeHtml(t.title)}</div>
          <div class="search-result-artist">${escapeHtml(t.artist)}</div>
        </div>
        <div class="search-result-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
      </div>`;
    });

    searchResults.innerHTML = html;
    searchResults.classList.add('visible');
    attachResultClickHandlers(recent);

    const clearBtn = document.getElementById('clear-recent-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearRecentSearches(); });
      clearBtn.addEventListener('mouseenter', () => { clearBtn.style.color = '#fff'; clearBtn.style.background = 'rgba(255,255,255,.1)'; });
      clearBtn.addEventListener('mouseleave', () => { clearBtn.style.color = ''; clearBtn.style.background = ''; });
    }
  }

  function closeSearch() { searchResults.classList.remove('visible'); searchResults.innerHTML = ''; }

  let searchDebounce;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    searchClear.classList.toggle('hidden', q.length === 0);
    clearTimeout(searchDebounce);
    if (!q) { closeSearch(); renderRecentSearches(); return; }

    searchDebounce = setTimeout(async () => {
      searchResults.innerHTML = '<div class="search-results-header" style="text-align:center;padding:20px;">Searching...</div>';
      searchResults.classList.add('visible');
      const results = await apiSearchSongs(q, 15);
      const tracks = results.map(normalizeTrack);
      renderSearchResults(tracks, q);
    }, 400);
  });

  searchClear.addEventListener('click', () => { searchInput.value = ''; searchClear.classList.add('hidden'); closeSearch(); searchInput.focus(); });
  document.addEventListener('click', (e) => { if (!e.target.closest('#search-container')) closeSearch(); });
  searchInput.addEventListener('focus', () => {
    const q = searchInput.value.trim();
    if (q && searchTrackCache.length) { renderSearchResults(searchTrackCache, q); }
    else if (!q) { renderRecentSearches(); }
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSearch(); searchInput.blur(); }
    if (e.key === 'Enter') { const f = searchResults.querySelector('.search-result-item'); if (f) f.click(); }
  });

  // ——— Keyboard shortcuts ———
  document.addEventListener('keydown', (e) => {
    if (!isAuthenticated) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); playPauseBtn.click(); }
    if ((e.ctrlKey && e.key === 'k') || e.key === '/') { e.preventDefault(); searchInput.focus(); }
  });

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ——————————————————————————————————————————————
  //  MOUSE-TRACKING GLOW EFFECT ON MUSIC CARDS
  // ——————————————————————————————————————————————

  function initMouseGlow() {
    document.addEventListener('mousemove', (e) => {
      const cards = document.querySelectorAll('.music-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const inside = x >= -40 && x <= rect.width + 40 && y >= -40 && y <= rect.height + 40;
        card.style.setProperty('--glow-x', `${x}px`);
        card.style.setProperty('--glow-y', `${y}px`);
        card.style.setProperty('--glow-opacity', inside ? '1' : '0');
      });
    });
  }

  // ——————————————————————————————————————————————
  //  PLAYER BAR — PLAYING STATE
  // ——————————————————————————————————————————————

  const playerBar = $('#player-bar');

  audio.addEventListener('play',  () => playerBar.classList.add('is-playing'));
  audio.addEventListener('pause', () => playerBar.classList.remove('is-playing'));
  audio.addEventListener('ended', () => playerBar.classList.remove('is-playing'));

  // ——————————————————————————————————————————————
  //  STAGGERED ENTRANCE ANIMATION FOR CARDS
  // ——————————————————————————————————————————————

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${i * 60}ms`;
        entry.target.classList.add('card-visible');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Re-observe cards whenever new ones are added (MutationObserver)
  const cardRowObserver = new MutationObserver(() => {
    document.querySelectorAll('.music-card:not(.card-visible)').forEach(c => {
      c.classList.add('card-entrance');
      cardObserver.observe(c);
    });
  });
  document.querySelectorAll('.card-row').forEach(row => {
    cardRowObserver.observe(row, { childList: true });
  });

  // ——————————————————————————————————————————————
  //  CLICK STAR BURST EFFECT
  // ——————————————————————————————————————————————

  function initClickStars() {
    const symbols = ['✦', '✧', '★', '⋆', '✵', '✸'];
    const colors  = ['#1DB954', '#ffd700', '#fff', '#ff6ec7', '#00e5ff', '#b388ff'];

    document.addEventListener('click', (e) => {
      const count = 6 + Math.floor(Math.random() * 5); // 6-10 stars
      for (let i = 0; i < count; i++) {
        const star = document.createElement('span');
        star.className = 'click-star';
        star.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        // Random scatter direction
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
        const dist = 30 + Math.random() * 60;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const rot = (Math.random() - 0.5) * 720;
        const size = 8 + Math.random() * 14;

        star.style.left = `${e.clientX}px`;
        star.style.top = `${e.clientY}px`;
        star.style.fontSize = `${size}px`;
        star.style.color = colors[Math.floor(Math.random() * colors.length)];
        star.style.setProperty('--dx', '0px');
        star.style.setProperty('--dy', '0px');
        star.style.setProperty('--tx', `${tx}px`);
        star.style.setProperty('--ty', `${ty}px`);
        star.style.setProperty('--rot', `${rot}deg`);
        star.style.animationDelay = `${i * 25}ms`;

        document.body.appendChild(star);
        star.addEventListener('animationend', () => star.remove());
      }
    });
  }

  // ——— Init ———
  initMouseGlow();
  initClickStars();
  checkSession();
})();
