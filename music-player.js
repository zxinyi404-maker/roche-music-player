// 网易云音乐播放器 - 雫 (shizuku) 主题版本
// 完全照抄 SullyOS 的美化设计：玻璃拟态、浮游粒子、星芒、柔光、梦幻渐变
(function () {
  'use strict';

  var BUILD_TIME = '2026-08-01-01:30-v2.0.1-shizuku';

  // ==================== 色板 — 水滴 × 星空 ====================
  var C = {
    bg: '#fbfbff',
    bgDeep: '#f3f1fa',
    primary: '#807c9d',
    accent: '#b3a8ce',
    glow: '#cdc6e9',
    sakura: '#f4c2cf',
    lavender: '#cfc3e8',
    text: '#22232a',
    muted: '#7c779a',
    faint: '#bcb8cc',
    vip: '#d4a06a'
  };

  // ==================== 全局状态 ====================
  var STATE = {
    backend: 'https://sullymeow.ccwu.cc',
    cookie: '',
    userProfile: null,
    audio: null,
    currentSong: null,
    playlist: [],
    currentIndex: 0,
    isPlaying: false,
    volume: 0.8,
    quality: 'standard',
    currentTime: 0,
    duration: 0,
    appContainer: null,
    appRefs: {},
    searchResults: [],
    roche: null
  };

  // ==================== 工具函数 ====================
  function toHttps(url) {
    return url ? url.replace(/^http:\/\//i, 'https://') : url;
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  // ==================== CSS 注入 ====================
  function injectStyles() {
    if (document.getElementById('__shizuku_music')) return;
    var style = document.createElement('style');
    style.id = '__shizuku_music';
    style.textContent = `
@keyframes shizuku-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
@keyframes shizuku-twinkle{0%,100%{opacity:.3}50%{opacity:.9}}
@keyframes shizuku-glow{0%,100%{box-shadow:0 0 15px ${C.glow}40}50%{box-shadow:0 0 25px ${C.glow}80}}
@keyframes shizuku-vinyl{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes shizuku-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.shizuku-glass{background:rgba(255,255,255,0.22);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.35)}
.shizuku-glass-strong{background:rgba(255,255,255,0.45);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.5)}
.shizuku-scrollbar::-webkit-scrollbar{width:3px}
.shizuku-scrollbar::-webkit-scrollbar-thumb{background:${C.faint}60;border-radius:3px}
`;
    document.head.appendChild(style);
  }

  // ==================== SVG 工具 ====================
  function svg(type, size, color) {
    size = size || 20;
    color = color || C.primary;
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', size);
    s.setAttribute('height', size);
    s.setAttribute('viewBox', '0 0 256 256');
    s.setAttribute('fill', color);
    var paths = {
      play: 'M232,114.5,88,26.5A8,8,0,0,0,76,33V223a8,8,0,0,0,12,6.5l144-88a8,8,0,0,0,0-13Z',
      pause: 'M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z',
      'skip-back': 'M224,114,96,34A8,8,0,0,0,84,40V216a8,8,0,0,0,13,6l128-80a8,8,0,0,0,0-14ZM40,40V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0Z',
      'skip-forward': 'M200,32a8,8,0,0,0-8,8V216a8,8,0,0,0,16,0V40A8,8,0,0,0,200,32Zm-36,86-128-80A8,8,0,0,0,24,46v165a8,8,0,0,0,13,6l128-80a8,8,0,0,0,0-14Z',
      search: 'M230,218l-43-43a92,92,0,1,0-11,11l43,43a8,8,0,0,0,11-11ZM40,112a72,72,0,1,1,72,72A72,72,0,0,1,40,112Z',
      x: 'M206,194a8,8,0,0,1-11,11L128,139,62,206a8,8,0,0,1-11-11L117,128,51,62A8,8,0,0,1,62,51L128,117l66-66a8,8,0,0,1,11,11L139,128Z'
    };
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', paths[type] || '');
    s.appendChild(p);
    return s;
  }

  function sparkle(size, color, delay) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', size || 10);
    s.setAttribute('height', size || 10);
    s.setAttribute('viewBox', '0 0 20 20');
    s.setAttribute('fill', color || C.accent);
    s.style.opacity = '0.7';
    s.style.animation = `shizuku-twinkle 2.5s ease-in-out ${delay || 0}s infinite`;
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z');
    s.appendChild(p);
    return s;
  }

  // ==================== 存储管理 ====================
  function loadSettings() {
    try {
      var data = JSON.parse(localStorage.getItem('rmp-netease-settings') || '{}');
      STATE.cookie = data.cookie || '';
      STATE.userProfile = data.userProfile || null;
      STATE.volume = data.volume || 0.8;
      STATE.quality = data.quality || 'standard';
    } catch (e) {}
  }

  function saveSettings() {
    localStorage.setItem('rmp-netease-settings', JSON.stringify({
      cookie: STATE.cookie,
      userProfile: STATE.userProfile,
      volume: STATE.volume,
      quality: STATE.quality
    }));
  }

  // ==================== 网易云 API ====================
  function neteaseCall(path, body) {
    return fetch(STATE.backend + '/netease' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Netease-Cookie': STATE.cookie || ''
      },
      body: JSON.stringify(body || {})
    }).then(r => r.json());
  }

  function loginQrKey() { return neteaseCall('/login/qr/key', {}); }
  function loginQrCreate(key) { return neteaseCall('/login/qr/create', { key, qrimg: true }); }
  function loginQrCheck(key) { return neteaseCall('/login/qr/check', { key }); }
  function loginStatus() { return neteaseCall('/login/status', {}); }
  function neteaseSearch(keyword) { return neteaseCall('/search', { keyword, limit: 30, type: 1 }); }
  function neteaseSongUrl(id) { return neteaseCall('/song/url', { id, level: STATE.quality }); }

  // ==================== 播放器核心 ====================
  function initAudio() {
    STATE.audio = new Audio();
    STATE.audio.volume = STATE.volume;
    STATE.audio.addEventListener('play', () => { STATE.isPlaying = true; updatePlayBtn(); });
    STATE.audio.addEventListener('pause', () => { STATE.isPlaying = false; updatePlayBtn(); });
    STATE.audio.addEventListener('timeupdate', () => {
      STATE.currentTime = STATE.audio.currentTime;
      STATE.duration = STATE.audio.duration;
      updateProgress();
    });
    STATE.audio.addEventListener('ended', playNext);
  }

  function playSong(song) {
    console.log('[播放]', song.name);
    STATE.currentSong = song;
    neteaseSongUrl(song.id).then(data => {
      var url = toHttps((data.data && data.data[0] || data).url);
      if (!url) return console.error('[无播放地址]');
      STATE.audio.src = url;
      STATE.audio.play();
      updateNowPlaying();
    });
  }

  function playNext() {
    if (STATE.playlist.length === 0) return;
    STATE.currentIndex = (STATE.currentIndex + 1) % STATE.playlist.length;
    playSong(STATE.playlist[STATE.currentIndex]);
  }

  function playPrev() {
    if (STATE.playlist.length === 0) return;
    STATE.currentIndex = (STATE.currentIndex - 1 + STATE.playlist.length) % STATE.playlist.length;
    playSong(STATE.playlist[STATE.currentIndex]);
  }

  function togglePlay() {
    if (STATE.isPlaying) STATE.audio.pause();
    else STATE.audio.play();
  }

  // ==================== UI 更新 ====================
  function updateNowPlaying() {
    if (!STATE.appRefs.nowPlaying) return;
    if (STATE.currentSong) {
      STATE.appRefs.songName.textContent = STATE.currentSong.name;
      STATE.appRefs.songArtist.textContent = STATE.currentSong.artist;
      STATE.appRefs.albumCover.src = STATE.currentSong.pic;
      STATE.appRefs.playerSection.style.display = 'flex';
    }
  }

  function updatePlayBtn() {
    if (!STATE.appRefs.playBtn) return;
    STATE.appRefs.playBtn.innerHTML = '';
    STATE.appRefs.playBtn.appendChild(svg(STATE.isPlaying ? 'pause' : 'play', 22, 'white'));
  }

  function updateProgress() {
    if (!STATE.appRefs.progressBar || !STATE.duration) return;
    var pct = (STATE.currentTime / STATE.duration) * 100;
    STATE.appRefs.progressFill.style.width = pct + '%';
    STATE.appRefs.currentTimeLabel.textContent = formatTime(STATE.currentTime);
    STATE.appRefs.durationLabel.textContent = formatTime(STATE.duration);
  }

  // ==================== 搜索功能 ====================
  function doSearch() {
    var keyword = STATE.appRefs.searchInput.value.trim();
    if (!keyword) return;
    STATE.appRefs.searchResults.innerHTML = '<div style="text-align:center;padding:40px;color:' + C.muted + '">搜索中...</div>';
    neteaseSearch(keyword).then(resp => {
      var songs = (resp.result || resp).songs || [];
      if (songs.length === 0) {
        STATE.appRefs.searchResults.innerHTML = '<div style="text-align:center;padding:40px;color:' + C.muted + '">没有找到歌曲</div>';
        return;
      }
      STATE.searchResults = songs.map(s => ({
        id: s.id,
        name: s.name,
        artist: (s.ar || s.artists || []).map(a => a.name).join(' / '),
        album: (s.al || s.album || {}).name || '',
        pic: toHttps((s.al || s.album || {}).picUrl || ''),
        duration: s.dt || s.duration || 0
      }));
      renderSearchResults();
    });
  }

  function renderSearchResults() {
    STATE.appRefs.searchResults.innerHTML = '';
    STATE.searchResults.forEach((song, idx) => {
      var row = document.createElement('div');
      row.style.cssText = `
        display:flex;align-items:center;gap:12px;padding:10px 12px;margin:0 8px 6px;
        border-radius:16px;cursor:pointer;transition:all 0.2s;
        background:rgba(255,255,255,0.08);
      `;
      row.onmouseenter = function() {
        row.style.background = 'linear-gradient(135deg, ' + C.glass + ', rgba(137,212,255,0.15))';
        row.style.boxShadow = '0 2px 16px ' + C.glow + '15';
      };
      row.onmouseleave = function() {
        row.style.background = 'rgba(255,255,255,0.08)';
        row.style.boxShadow = 'none';
      };
      row.onclick = function() {
        STATE.playlist = STATE.searchResults;
        STATE.currentIndex = idx;
        playSong(song);
      };

      var img = document.createElement('img');
      img.src = song.pic;
      img.style.cssText = 'width:44px;height:44px;border-radius:12px;object-fit:cover;border:1.5px solid ' + C.faint + '40';

      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0';
      info.innerHTML = `
        <div style="font-size:13px;color:${C.text};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${song.name}</div>
        <div style="font-size:11px;color:${C.muted};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${song.artist} · ${song.album}</div>
      `;

      var dur = document.createElement('div');
      dur.textContent = formatTime(song.duration / 1000);
      dur.style.cssText = 'font-size:10px;color:' + C.faint + ';font-variant-numeric:tabular-nums';

      row.appendChild(img);
      row.appendChild(info);
      row.appendChild(dur);
      STATE.appRefs.searchResults.appendChild(row);
    });
  }

  // ==================== UI 构建 ====================
  function createUI() {
    injectStyles();
    STATE.appContainer.style.cssText = `
      width:100%;height:100%;
      background:linear-gradient(180deg, ${C.bg} 0%, ${C.bgDeep} 100%);
      color:${C.text};display:flex;flex-direction:column;
      position:relative;overflow:hidden;
    `;

    // 背景装饰
    var bokeh = document.createElement('div');
    bokeh.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden';
    bokeh.innerHTML = `
      <div style="position:absolute;top:8%;right:5%;width:128px;height:128px;border-radius:50%;
        background:radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%);
        animation:shizuku-float 8s ease-in-out infinite"></div>
      <div style="position:absolute;bottom:25%;left:0;width:192px;height:192px;border-radius:50%;
        background:radial-gradient(circle, rgba(255,255,255,0.75), transparent 70%);
        animation:shizuku-float 10s ease-in-out 2s infinite"></div>
    `;
    for (var i = 0; i < 3; i++) {
      var sp = sparkle(8 + i * 2, [C.glow, C.sakura, C.lavender][i], i * 0.8);
      sp.style.cssText = `position:absolute;${['top:12%;left:15%', 'top:55%;right:20%', 'bottom:35%;left:45%'][i]}`;
      bokeh.appendChild(sp);
    }
    STATE.appContainer.appendChild(bokeh);

    // 主容器
    var main = document.createElement('div');
    main.style.cssText = 'position:relative;z-index:1;flex:1;display:flex;flex-direction:column;overflow:hidden';

    // 头部
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong';
    header.style.cssText = `
      padding:15px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);
    `;
    var title = document.createElement('div');
    title.style.cssText = 'display:flex;align-items:center;gap:8px';
    title.appendChild(sparkle(7, C.glow, 0));
    var titleText = document.createElement('span');
    titleText.textContent = '网易云音乐';
    titleText.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary}`;
    title.appendChild(titleText);
    title.appendChild(sparkle(7, C.sakura, 1.2));
    header.appendChild(title);
    var ver = document.createElement('div');
    ver.textContent = 'v2.0.1';
    ver.style.cssText = 'font-size:10px;color:' + C.faint;
    header.appendChild(ver);

    // 搜索栏
    var searchBox = document.createElement('div');
    searchBox.style.cssText = 'padding:12px;position:relative;z-index:10';
    var searchWrap = document.createElement('div');
    searchWrap.style.cssText = 'display:flex;gap:8px';

    var searchInputWrap = document.createElement('div');
    searchInputWrap.className = 'shizuku-glass';
    searchInputWrap.style.cssText = `
      flex:1;display:flex;align-items:center;gap:10px;
      padding:10px 14px;border-radius:16px;
      box-shadow:0 2px 20px ${C.glow}15,inset 0 1px 0 rgba(255,255,255,0.4);
    `;
    searchInputWrap.appendChild(svg('search', 15, C.muted));
    var searchInput = document.createElement('input');
    searchInput.placeholder = '搜一首想听的歌...';
    searchInput.style.cssText = `
      flex:1;background:transparent;border:none;outline:none;
      font-size:13px;color:${C.text};
    `;
    searchInput.onkeydown = e => { if (e.key === 'Enter') doSearch(); };
    searchInputWrap.appendChild(searchInput);
    searchInputWrap.appendChild(sparkle(6, C.sakura, 0.5));

    var searchBtn = document.createElement('button');
    searchBtn.textContent = '搜索';
    searchBtn.style.cssText = `
      padding:10px 18px;border-radius:16px;border:none;cursor:pointer;
      font-size:12px;color:white;font-weight:500;
      background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      box-shadow:0 3px 15px ${C.primary}30;transition:transform 0.2s;
    `;
    searchBtn.onclick = doSearch;
    searchBtn.onmousedown = function() { this.style.transform = 'scale(0.95)'; };
    searchBtn.onmouseup = function() { this.style.transform = 'scale(1)'; };

    searchWrap.appendChild(searchInputWrap);
    searchWrap.appendChild(searchBtn);
    searchBox.appendChild(searchWrap);

    // 搜索结果
    var searchResults = document.createElement('div');
    searchResults.className = 'shizuku-scrollbar';
    searchResults.style.cssText = 'flex:1;overflow-y:auto;padding:8px 0';

    // 播放器区域
    var playerSection = document.createElement('div');
    playerSection.className = 'shizuku-glass-strong';
    playerSection.style.cssText = `
      padding:20px;border-top:1px solid rgba(255,255,255,0.3);
      display:none;flex-direction:column;gap:16px;
    `;

    // 专辑封面 + 信息
    var nowPlayingBox = document.createElement('div');
    nowPlayingBox.style.cssText = 'display:flex;align-items:center;gap:16px';

    var albumCoverWrap = document.createElement('div');
    albumCoverWrap.style.cssText = 'position:relative;width:64px;height:64px';
    var albumCover = document.createElement('img');
    albumCover.style.cssText = `
      width:100%;height:100%;border-radius:12px;object-fit:cover;
      border:1.5px solid ${C.accent}40;
      animation:shizuku-vinyl 18s linear infinite;
    `;
    albumCoverWrap.appendChild(albumCover);

    var songInfo = document.createElement('div');
    songInfo.style.cssText = 'flex:1;min-width:0';
    var songName = document.createElement('div');
    songName.style.cssText = `font-size:14px;font-weight:600;color:${C.text};overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
    var songArtist = document.createElement('div');
    songArtist.style.cssText = `font-size:11px;color:${C.muted};margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
    songInfo.appendChild(songName);
    songInfo.appendChild(songArtist);

    nowPlayingBox.appendChild(albumCoverWrap);
    nowPlayingBox.appendChild(songInfo);

    // 进度条
    var progressBox = document.createElement('div');
    progressBox.style.cssText = 'width:100%';
    var progressBar = document.createElement('div');
    progressBar.className = 'shizuku-glass';
    progressBar.style.cssText = `
      height:6px;border-radius:3px;position:relative;cursor:pointer;
      box-shadow:inset 0 1px 3px rgba(0,0,0,0.06);
    `;
    progressBar.onclick = function(e) {
      var rect = progressBar.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      STATE.audio.currentTime = STATE.duration * pct;
    };
    var progressFill = document.createElement('div');
    progressFill.style.cssText = `
      position:absolute;top:0;left:0;height:100%;width:0;border-radius:3px;
      background:linear-gradient(90deg, ${C.primary}, ${C.glow});
      box-shadow:0 0 10px ${C.glow}40;transition:width 0.15s;
    `;
    progressBar.appendChild(progressFill);

    var timeLabels = document.createElement('div');
    timeLabels.style.cssText = 'display:flex;justify-content:space-between;margin-top:6px;padding:0 4px';
    var currentTimeLabel = document.createElement('span');
    currentTimeLabel.textContent = '0:00';
    currentTimeLabel.style.cssText = `font-size:9px;color:${C.muted};font-variant-numeric:tabular-nums`;
    var durationLabel = document.createElement('span');
    durationLabel.textContent = '0:00';
    durationLabel.style.cssText = `font-size:9px;color:${C.muted};font-variant-numeric:tabular-nums`;
    timeLabels.appendChild(currentTimeLabel);
    timeLabels.appendChild(durationLabel);
    progressBox.appendChild(progressBar);
    progressBox.appendChild(timeLabels);

    // 控制按钮
    var controls = document.createElement('div');
    controls.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:32px';

    var prevBtn = document.createElement('button');
    prevBtn.style.cssText = `padding:8px;border-radius:50%;border:none;background:transparent;cursor:pointer;color:${C.muted};transition:transform 0.2s`;
    prevBtn.appendChild(svg('skip-back', 22, C.muted));
    prevBtn.onclick = playPrev;

    var playBtn = document.createElement('button');
    playBtn.style.cssText = `
      width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;
      background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      box-shadow:0 4px 24px ${C.glow}40;transition:transform 0.2s;
      animation:shizuku-glow 3s ease-in-out infinite;
    `;
    playBtn.appendChild(svg('play', 22, 'white'));
    playBtn.onclick = togglePlay;
    playBtn.onmousedown = function() { this.style.transform = 'scale(0.95)'; };
    playBtn.onmouseup = function() { this.style.transform = 'scale(1)'; };

    var nextBtn = document.createElement('button');
    nextBtn.style.cssText = `padding:8px;border-radius:50%;border:none;background:transparent;cursor:pointer;color:${C.muted};transition:transform 0.2s`;
    nextBtn.appendChild(svg('skip-forward', 22, C.muted));
    nextBtn.onclick = playNext;

    controls.appendChild(prevBtn);
    controls.appendChild(playBtn);
    controls.appendChild(nextBtn);

    playerSection.appendChild(nowPlayingBox);
    playerSection.appendChild(progressBox);
    playerSection.appendChild(controls);

    main.appendChild(header);
    main.appendChild(searchBox);
    main.appendChild(searchResults);
    main.appendChild(playerSection);
    STATE.appContainer.appendChild(main);

    // 保存引用
    STATE.appRefs = {
      searchInput, searchResults, playerSection, albumCover, songName, songArtist,
      progressBar, progressFill, currentTimeLabel, durationLabel, playBtn, nowPlaying: songInfo
    };
  }

  // ==================== 入口 ====================
  function init(roche, container) {
    console.log('[网易云音乐播放器 Shizuku] 初始化', BUILD_TIME);
    STATE.roche = roche;
    STATE.appContainer = container;
    loadSettings();
    initAudio();
    createUI();
  }

  // ==================== 导出 ====================
  if (typeof window !== 'undefined') {
    window.RocheMusicPlayer = { init, version: BUILD_TIME };
  }
})();
