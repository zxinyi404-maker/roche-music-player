// 网易云音乐播放器 - 雫 (shizuku) 主题版本
// 完全照抄 SullyOS 的美化设计：玻璃拟态、浮游粒子、星芒、柔光、梦幻渐变
(function () {
  'use strict';

  var BUILD_TIME = '2026-08-02-02:40-v3.9.1-like-feature';

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
    playMode: 'loop', // 'loop' | 'single' | 'shuffle'
    currentTime: 0,
    duration: 0,
    appContainer: null,
    appRefs: {},
    searchResults: [],
    roche: null,
    // 登录状态
    qrPollTimer: null,
    currentView: 'profile', // 'profile' | 'search' | 'player' | 'playlist'
    // 歌词
    lyric: [],
    activeLyricIdx: -1,
    // 用户数据
    userPlaylists: [],
    currentPlaylistSongs: [],
    playRecord: [], // 播放记录
    cloudSongs: [], // 云盘歌曲
    likedSongs: [], // 喜欢的歌曲
    expandedPlaylistId: null,
    signedIn: false,
    currentTab: 'playlist', // 'playlist' | 'record' | 'cloud'
    // 登录面板状态（持久化）
    loginState: {
      mode: 'qr',
      qrKey: '',
      qrImg: '',
      qrStatus: 'idle',
      phone: '',
      captcha: '',
      cooldown: 0,
      sending: false,
      loggingIn: false,
      manualCookie: ''
    }
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

  // 解析歌词 - 完全照抄 SullyOS
  function parseLyric(txt) {
    if (!txt) return [];
    var out = [];
    var re = /\[(\d+):(\d+)(?:\.(\d+))?\](.*)/;
    var lines = txt.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var m = re.exec(lines[i]);
      if (!m) continue;
      var mm = parseInt(m[1], 10);
      var ss = parseInt(m[2], 10);
      var ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      var text = m[4].trim();
      if (!text) continue;
      out.push({ t: mm * 60 + ss + ms / 1000, text: text });
    }
    out.sort(function(a, b) { return a.t - b.t; });
    return out;
  }

  // ==================== CSS 注入 ====================
  function injectStyles() {
    if (document.getElementById('__shizuku_music')) return;
    var style = document.createElement('style');
    style.id = '__shizuku_music';
    style.textContent = `
@keyframes shizuku-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.08)}}
@keyframes shizuku-drift{0%{transform:translateX(0) translateY(0) rotate(0deg)}25%{transform:translateX(12px) translateY(-10px) rotate(5deg)}50%{transform:translateX(-6px) translateY(-20px) rotate(-3deg)}75%{transform:translateX(8px) translateY(-8px) rotate(4deg)}100%{transform:translateX(0) translateY(0) rotate(0deg)}}
@keyframes shizuku-twinkle{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:.9;transform:scale(1.2)}}
@keyframes shizuku-ripple{0%{transform:scale(0);opacity:.6}100%{transform:scale(4);opacity:0}}
@keyframes shizuku-glow{0%,100%{box-shadow:0 0 15px ${C.glow}30,0 0 40px ${C.glow}10}50%{box-shadow:0 0 25px ${C.glow}50,0 0 60px ${C.glow}20}}
@keyframes shizuku-vinyl{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes shizuku-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes shizuku-drop{0%{transform:translateY(-30px) scale(0);opacity:0}40%{opacity:.7}100%{transform:translateY(100vh) scale(1);opacity:0}}
@keyframes shizuku-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:.9}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes wave{0%,100%{height:8px}50%{height:16px}}
.shizuku-glass{background:rgba(255,255,255,0.22);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);border:1px solid rgba(255,255,255,0.35)}
.shizuku-glass-strong{background:rgba(255,255,255,0.45);backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);border:1px solid rgba(255,255,255,0.5)}
.shizuku-scrollbar::-webkit-scrollbar{width:3px}
.shizuku-scrollbar::-webkit-scrollbar-thumb{background:${C.faint}60;border-radius:3px}
.shizuku-scrollbar::-webkit-scrollbar-track{background:transparent}

/* iOS 安全区域适配 */
@supports (padding: max(0px)) {
  .ios-safe-top { padding-top: max(15px, env(safe-area-inset-top)); }
  .ios-safe-bottom { padding-bottom: max(20px, env(safe-area-inset-bottom)); }
  .ios-safe-left { padding-left: max(0px, env(safe-area-inset-left)); }
  .ios-safe-right { padding-right: max(0px, env(safe-area-inset-right)); }
}

/* iOS 触摸优化 */
* { -webkit-tap-highlight-color: transparent; }
button, input, textarea { -webkit-appearance: none; }
input, textarea { font-size: 16px !important; } /* 防止 iOS 放大 */

/* iOS 滚动优化 */
.shizuku-scrollbar { -webkit-overflow-scrolling: touch; }

/* 按钮悬停效果 */
.shizuku-btn-hover{transition:all 0.2s ease}
.shizuku-btn-hover:hover{transform:translateY(-1px);box-shadow:0 4px 20px ${C.glow}25}
.shizuku-btn-hover:active{transform:translateY(0)}
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
      x: 'M206,194a8,8,0,0,1-11,11L128,139,62,206a8,8,0,0,1-11-11L117,128,51,62A8,8,0,0,1,62,51L128,117l66-66a8,8,0,0,1,11,11L139,128Z',
      'chevron-left': 'M168,48a8,8,0,0,1,11,11L115,128l64,69a8,8,0,1,1-11,11L96,128Z',
      settings: 'M128,80a48,48,0,1,0,48,48A48,48,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A111.92,111.92,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.63a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21Zm-15,34.91-28.57,16.25a8,8,0,0,0-3,3c-.58,1-1.19,2.06-1.81,3.06a7.94,7.94,0,0,0-1.22,4.21l-.15,32.25a95.89,95.89,0,0,1-25.37,14.3L134,199.13a8,8,0,0,0-3.91-1h-.19c-1.21,0-2.43,0-3.64,0a8.08,8.08,0,0,0-4.1,1l-28.84,16.1A96,96,0,0,1,67.88,201l-.11-32.2a8,8,0,0,0-1.22-4.22c-.62-1-1.23-2-1.8-3.06a8.09,8.09,0,0,0-3-3.06l-28.6-16.29a90.49,90.49,0,0,1,0-28.26L61.67,97.63a8,8,0,0,0,3-3c.58-1,1.19-2.06,1.81-3.06a7.94,7.94,0,0,0,1.22-4.21l.15-32.25a95.89,95.89,0,0,1,25.37-14.3L122,56.87a8,8,0,0,0,4.1,1c1.21,0,2.43,0,3.64,0a8,8,0,0,0,4.1-1l28.84-16.1A96,96,0,0,1,188.12,55l.11,32.2a8,8,0,0,0,1.22,4.22c.62,1,1.23,2,1.8,3.06a8.09,8.09,0,0,0,3,3.06l28.6,16.29A90.49,90.49,0,0,1,222.9,142.12Z'
    };
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', paths[type] || '');
    s.appendChild(p);
    return s;
  }

  // 星芒装饰
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

  // 水滴装饰
  function waterDrop(size) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', size || 8);
    s.setAttribute('height', (size || 8) * 1.4);
    s.setAttribute('viewBox', '0 0 10 14');
    s.setAttribute('fill', C.glow);
    s.style.opacity = '0.4';
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M5 0 C5 0 0 7 0 9.5 C0 12 2.2 14 5 14 C7.8 14 10 12 10 9.5 C10 7 5 0 5 0Z');
    s.appendChild(p);
    return s;
  }

  // 创建背景装饰层（完全照抄 SullyOS 的 BokehBg）
  function createBokehBg() {
    var bokeh = document.createElement('div');
    bokeh.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0';

    // 主光球 - 右上角浮游
    var mainOrb = document.createElement('div');
    mainOrb.style.cssText = `
      position:absolute;top:8%;right:5%;width:128px;height:128px;border-radius:50%;
      background:radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%);
      animation:shizuku-float 8s ease-in-out infinite;
    `;
    bokeh.appendChild(mainOrb);

    // 次要光球 - 左下角
    var subOrb = document.createElement('div');
    subOrb.style.cssText = `
      position:absolute;bottom:15%;left:8%;width:96px;height:96px;border-radius:50%;
      background:radial-gradient(circle, ${C.lavender}50, transparent 65%);
      animation:shizuku-drift 12s ease-in-out infinite;
    `;
    bokeh.appendChild(subOrb);

    // 小星芒散落
    for (var i = 0; i < 6; i++) {
      var star = sparkle(6 + Math.random() * 4, i % 2 === 0 ? C.glow : C.sakura, Math.random() * 2);
      star.style.position = 'absolute';
      star.style.top = (10 + Math.random() * 70) + '%';
      star.style.left = (10 + Math.random() * 80) + '%';
      bokeh.appendChild(star);
    }

    return bokeh;
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
  function captchaSent(phone) { return neteaseCall('/captcha/sent', { phone }); }
  function loginCellphone(phone, captcha) { return neteaseCall('/login/cellphone', { phone, captcha }); }
  function neteaseSearch(keyword) { return neteaseCall('/search', { keyword, limit: 30, type: 1 }); }
  function neteaseSongUrl(id) { return neteaseCall('/song/url', { id, level: STATE.quality }); }
  function neteaseUserPlaylist(uid) { return neteaseCall('/user/playlist', { uid, limit: 100 }); }
  function neteasePlaylistDetail(id) { return neteaseCall('/playlist/detail', { id }); }
  function neteaseRecommendSongs() { return neteaseCall('/recommend/songs', {}); }
  function neteasePersonalFm() { return neteaseCall('/personal_fm', {}); }
  function neteaseDailySignin() { return neteaseCall('/daily_signin', { type: 1 }); }
  function neteaseRecordRecentSong(uid) { return neteaseCall('/record/recent/song', { uid }); }

  // ==================== 登录功能 ====================

  // 获取用户信息
  function fetchUserInfo() {
    if (!STATE.cookie) return Promise.resolve(null);
    return loginStatus().then(function(data) {
      console.log('[loginStatus 响应]', data);
      if (data && data.data && data.data.profile) {
        STATE.userProfile = data.data.profile;
        saveSettings();
        // 登录成功后自动加载歌单和喜欢列表
        loadUserPlaylists();
        loadLikedSongs();
        return data.data.profile;
      }
      return null;
    }).catch(function(e) {
      console.error('[获取用户信息失败]', e);
      return null;
    });
  }

  // 加载喜欢列表
  function loadLikedSongs() {
    if (!STATE.cookie) return;
    neteaseCall('/likelist', {}).then(function(data) {
      var ids = (data.ids || data.data && data.data.ids) || [];
      STATE.likedSongs = ids;
      console.log('[喜欢列表]', ids.length + ' 首');
    }).catch(function(e) {
      console.error('[获取喜欢列表失败]', e);
    });
  }

  // 切换喜欢状态
  function toggleLike(songId) {
    if (!STATE.cookie) {
      alert('请先登录');
      return Promise.reject(new Error('未登录'));
    }
    var isLiked = STATE.likedSongs.indexOf(songId) >= 0;
    var willLike = !isLiked;

    return neteaseCall('/like', { id: songId, like: willLike }).then(function(data) {
      if (willLike) {
        if (STATE.likedSongs.indexOf(songId) < 0) {
          STATE.likedSongs.push(songId);
        }
        console.log('[已喜欢]', songId);
      } else {
        STATE.likedSongs = STATE.likedSongs.filter(function(id) { return id !== songId; });
        console.log('[取消喜欢]', songId);
      }
      // 刷新播放器界面
      if (STATE.currentView === 'player') {
        createUI();
      }
      return willLike;
    }).catch(function(e) {
      console.error('[切换喜欢失败]', e);
      alert('操作失败：' + e.message);
      throw e;
    });
  }

  // 加载播放记录
  function loadPlayRecord() {
    if (!STATE.userProfile) {
      alert('请先登录');
      return;
    }
    console.log('[加载播放记录]');
    neteaseRecordRecentSong(STATE.userProfile.userId).then(function(data) {
      var records = (data.data && data.data.list) || [];
      var songs = records.map(function(r) {
        var s = r.data || r.song || {};
        return {
          id: s.id,
          name: s.name,
          artist: (s.ar || []).map(function(a) { return a.name; }).join(' / '),
          album: (s.al || {}).name || '',
          pic: toHttps((s.al || {}).picUrl || ''),
          duration: (s.dt || 0) / 1000
        };
      });
      if (songs.length === 0) {
        alert('暂无播放记录');
        return;
      }
      STATE.searchResults = songs;
      STATE.currentView = 'search';
      createUI();
    }).catch(function(e) {
      console.error('[加载播放记录失败]', e);
      alert('加载失败：' + e.message);
    });
  }

  // 签到功能
  function doSignIn() {
    console.log('[签到]');
    neteaseDailySignin().then(function(data) {
      if (data.code === 200) {
        STATE.signedIn = true;
        alert('签到成功 +' + (data.point || 5));
        createUI();
      } else if (data.code === -2 || (data.msg && data.msg.includes('重复'))) {
        STATE.signedIn = true;
        alert('今天已经签过了');
        createUI();
      } else {
        alert('签到失败：' + (data.msg || data.message || '未知错误'));
      }
    }).catch(function(e) {
      console.error('[签到失败]', e);
      if (String(e.message).includes('重复')) {
        STATE.signedIn = true;
        alert('今天已经签过了');
        createUI();
      } else {
        alert('签到失败：' + e.message);
      }
    });
  }

  // 加载私人FM
  function loadPersonalFm() {
    console.log('[加载私人FM]');
    neteasePersonalFm().then(function(data) {
      var songs = (data.data || []).map(function(s) {
        return {
          id: s.id,
          name: s.name,
          artist: (s.artists || s.ar || []).map(function(a) { return a.name; }).join(' / '),
          album: (s.album || s.al || {}).name || '',
          pic: toHttps((s.album || s.al || {}).picUrl || ''),
          duration: (s.duration || s.dt || 0) / 1000
        };
      });
      if (songs.length === 0) {
        alert('FM 暂无歌曲');
        return;
      }
      STATE.playlist = songs;
      STATE.currentIndex = 0;
      playSong(songs[0]);
      STATE.currentView = 'player';
      createUI();
    }).catch(function(e) {
      console.error('[加载私人FM失败]', e);
      alert('FM 失败：' + e.message);
    });
  }

  // 加载每日推荐
  function loadDailyRecommend() {
    console.log('[加载每日推荐]');
    neteaseRecommendSongs().then(function(data) {
      var songs = ((data.data && data.data.dailySongs) || data.dailySongs || []).map(function(s) {
        return {
          id: s.id,
          name: s.name,
          artist: (s.ar || []).map(function(a) { return a.name; }).join(' / '),
          album: (s.al || {}).name || '',
          pic: toHttps((s.al || {}).picUrl || ''),
          duration: (s.dt || 0) / 1000
        };
      });
      if (songs.length === 0) {
        alert('暂无推荐歌曲');
        return;
      }
      STATE.searchResults = songs;
      STATE.currentView = 'search';
      createUI();
    }).catch(function(e) {
      console.error('[加载每日推荐失败]', e);
      alert('加载失败：' + e.message);
    });
  }
  function loadUserPlaylists() {
    if (!STATE.userProfile) return;
    neteaseUserPlaylist(STATE.userProfile.userId).then(function(data) {
      var playlists = (data.playlist || []).map(function(p) {
        return {
          id: p.id,
          name: p.name,
          coverImgUrl: toHttps(p.coverImgUrl || ''),
          trackCount: p.trackCount || 0,
          creator: p.creator ? p.creator.nickname : ''
        };
      });
      STATE.userPlaylists = playlists;
      console.log('[用户歌单]', playlists.length + ' 个');
    }).catch(function(e) {
      console.error('[获取歌单失败]', e);
    });
  }

  // 显示歌单列表
  function showPlaylistView() {
    if (!STATE.cookie || !STATE.userProfile) {
      alert('请先登录');
      showLoginPanel();
      return;
    }
    STATE.currentView = 'playlist';
    createUI();
  }

  // 加载歌单详情
  function loadPlaylistDetail(playlistId) {
    STATE.expandedPlaylistId = playlistId;
    neteasePlaylistDetail(playlistId).then(function(data) {
      var tracks = ((data.playlist && data.playlist.tracks) || []).map(function(t) {
        return {
          id: t.id,
          name: t.name,
          artist: (t.ar || []).map(function(a) { return a.name; }).join(' / '),
          album: (t.al || {}).name || '',
          pic: toHttps((t.al || {}).picUrl || ''),
          duration: (t.dt || 0) / 1000
        };
      });
      STATE.currentPlaylistSongs = tracks;
      createUI(); // 重新渲染显示歌曲
    }).catch(function(e) {
      console.error('[加载歌单详情失败]', e);
    });
  }

  // 登录成功回调
  function onLoggedIn(cookie) {
    console.log('[登录成功]', cookie);
    STATE.cookie = cookie;
    saveSettings(); // 立即保存 cookie
    fetchUserInfo().then(function() {
      STATE.currentView = 'profile'; // 改为 profile
      createUI(); // 重新渲染界面
    });
  }

  // 显示登录界面
  function showLoginPanel() {
    STATE.currentView = 'login';
    createUI();
  }

  // 退出登录
  function logout() {
    STATE.cookie = '';
    STATE.userProfile = null;
    saveSettings();
    STATE.currentView = 'main';
    createUI();
  }

  // ==================== 登录面板 UI ====================
  function createLoginPanel() {
    console.log('[createLoginPanel] 开始渲染，当前模式:', STATE.loginState.mode);
    var loginState = STATE.loginState; // 使用全局持久化的状态

    var container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;
      background:linear-gradient(180deg, #ffffff 0%, ${C.bg} 50%, ${C.bgDeep} 100%);
      display:flex;flex-direction:column;z-index:100;
    `;

    // 背景装饰
    container.appendChild(createBokehBg());

    // 头部 - 带装饰
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong ios-safe-top';
    header.style.cssText = `
      padding-left:15px;padding-right:15px;padding-bottom:15px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);position:relative;z-index:10;
    `;
    var backBtn = document.createElement('button');
    backBtn.className = 'shizuku-btn-hover';
    backBtn.style.cssText = `padding:8px;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%`;
    backBtn.appendChild(svg('x', 16, C.primary));
    backBtn.onclick = function() {
      if (STATE.qrPollTimer) {
        clearInterval(STATE.qrPollTimer);
        STATE.qrPollTimer = null;
      }
      // 如果已经登录过，返回主界面；否则关闭应用
      if (STATE.cookie && STATE.userProfile) {
        STATE.currentView = 'main';
        createUI();
      } else {
        // 关闭 Roche 应用
        if (STATE.roche && STATE.roche.ui && STATE.roche.ui.closeApp) {
          STATE.roche.ui.closeApp();
        }
      }
    };

    var titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:6px';
    titleBox.appendChild(sparkle(7, C.glow, 0));

    var title = document.createElement('div');
    title.textContent = '登录网易云';
    title.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary};font-family:'Georgia',serif`;
    titleBox.appendChild(title);

    titleBox.appendChild(sparkle(7, C.sakura, 1.2));

    header.appendChild(backBtn);
    header.appendChild(titleBox);
    header.appendChild(document.createElement('div')); // placeholder
    container.appendChild(header);

    // 模式切换器
    var modeSwitcher = document.createElement('div');
    modeSwitcher.className = 'shizuku-glass';
    modeSwitcher.style.cssText = `
      margin:12px 16px;padding:4px;border-radius:20px;
      display:flex;gap:4px;position:relative;z-index:10;
    `;
    var modes = [
      { k: 'qr', label: '扫码' },
      { k: 'phone', label: '手机号' },
      { k: 'manual', label: 'Cookie' }
    ];
    modes.forEach(function(m) {
      var btn = document.createElement('button');
      btn.textContent = m.label;
      btn.style.cssText = `
        flex:1;padding:8px;border-radius:16px;border:none;cursor:pointer;
        font-size:11px;letter-spacing:0.1em;transition:all 0.2s;
        color:${loginState.mode === m.k ? 'white' : C.muted};
        background:${loginState.mode === m.k ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : 'transparent'};
      `;
      btn.onclick = function() {
        console.log('[标签切换] 从', loginState.mode, '切换到', m.k);
        loginState.mode = m.k;
        console.log('[标签切换] 新模式:', loginState.mode);
        createLoginPanel(); // 重新渲染
      };
      modeSwitcher.appendChild(btn);
    });
    container.appendChild(modeSwitcher);

    // 内容区域
    var content = document.createElement('div');
    content.className = 'shizuku-scrollbar ios-safe-bottom';
    content.style.cssText = 'flex:1;overflow-y:auto;padding:16px;position:relative;z-index:10';

    if (loginState.mode === 'qr') {
      content.appendChild(createQrLogin(loginState));
    } else if (loginState.mode === 'phone') {
      content.appendChild(createPhoneLogin(loginState));
    } else {
      content.appendChild(createManualLogin(loginState));
    }

    container.appendChild(content);
    STATE.appContainer.innerHTML = '';
    STATE.appContainer.appendChild(container);
  }

  // 扫码登录
  function createQrLogin(loginState) {
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center';

    var qrBox = document.createElement('div');
    qrBox.className = 'shizuku-glass-strong';
    qrBox.style.cssText = `
      position:relative;padding:16px;border-radius:24px;
      box-shadow:0 8px 40px ${C.glow}20;
    `;

    if (loginState.qrImg) {
      var img = document.createElement('img');
      img.src = loginState.qrImg;
      img.style.cssText = 'width:192px;height:192px;border-radius:12px;display:block';
      qrBox.appendChild(img);
    } else {
      var loading = document.createElement('div');
      loading.style.cssText = `
        width:192px;height:192px;border-radius:12px;display:flex;
        align-items:center;justify-content:center;background:${C.glass};
      `;
      var spinner = document.createElement('div');
      spinner.style.cssText = `
        width:20px;height:20px;border:2px solid ${C.faint}40;
        border-top-color:${C.primary};border-radius:50%;animation:spin 1s linear infinite;
      `;
      loading.appendChild(spinner);
      qrBox.appendChild(loading);

      // 自动开始扫码
      if (loginState.qrStatus === 'idle') {
        loginState.qrStatus = 'waiting';
        startQrLogin(loginState, qrBox);
      }
    }

    wrapper.appendChild(qrBox);

    var statusText = {
      idle: '准备中...',
      waiting: '请用网易云 App 扫描上方二维码',
      scanned: '已扫描，请在手机上确认',
      expired: '二维码已过期',
      done: '登录中...'
    };

    var status = document.createElement('div');
    status.textContent = statusText[loginState.qrStatus];
    status.style.cssText = `margin-top:16px;font-size:11px;color:${C.primary};text-align:center`;
    wrapper.appendChild(status);

    if (loginState.qrStatus === 'expired') {
      var refreshBtn = document.createElement('button');
      refreshBtn.textContent = '刷新二维码';
      refreshBtn.style.cssText = `
        margin-top:12px;padding:8px 16px;border-radius:20px;border:none;cursor:pointer;
        font-size:10px;color:white;
        background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      `;
      refreshBtn.onclick = function() {
        loginState.qrStatus = 'waiting';
        loginState.qrImg = '';
        createLoginPanel();
      };
      wrapper.appendChild(refreshBtn);
    }

    var tip = document.createElement('div');
    tip.textContent = '打开网易云 App → 我的 → 右上角扫一扫';
    tip.style.cssText = `margin-top:12px;font-size:9px;color:${C.faint};font-style:italic;text-align:center;max-width:220px`;
    wrapper.appendChild(tip);

    return wrapper;
  }

  // 开始扫码登录流程
  function startQrLogin(loginState, qrBox) {
    console.log('[开始获取二维码]');
    loginQrKey().then(function(keyRes) {
      console.log('[loginQrKey 响应]', keyRes);
      var key = (keyRes.data && keyRes.data.unikey) || keyRes.unikey;
      if (!key) {
        console.error('[无法获取 key]', keyRes);
        throw new Error('无法获取 key');
      }
      loginState.qrKey = key;
      console.log('[获取到 key]', key);
      return loginQrCreate(key);
    }).then(function(createRes) {
      console.log('[loginQrCreate 响应]', createRes);
      var img = (createRes.data && createRes.data.qrimg) || createRes.qrimg;
      if (!img) {
        console.error('[无法生成二维码]', createRes);
        throw new Error('无法生成二维码');
      }
      loginState.qrImg = img;
      console.log('[获取到二维码图片]', img);

      // 重新渲染登录面板以显示二维码
      createLoginPanel();

      // 开始轮询
      STATE.qrPollTimer = setInterval(function() {
        loginQrCheck(loginState.qrKey).then(function(r) {
          var code = r.code;
          if (code === 800) {
            loginState.qrStatus = 'expired';
            clearInterval(STATE.qrPollTimer);
            createLoginPanel();
          } else if (code === 801) {
            loginState.qrStatus = 'waiting';
          } else if (code === 802) {
            loginState.qrStatus = 'scanned';
            createLoginPanel();
          } else if (code === 803) {
            clearInterval(STATE.qrPollTimer);
            loginState.qrStatus = 'done';
            var cookie = r.cookie || '';
            var m = cookie.match(/MUSIC_U=([^;]+)/i);
            var musicU = m ? m[1] : '';
            if (musicU) {
              onLoggedIn('MUSIC_U=' + musicU);
            } else {
              console.error('[登录信息不完整]', r);
              alert('登录信息不完整，请重试');
            }
          }
        }).catch(function(e) {
          console.error('[轮询失败]', e);
        });
      }, 2500);
    }).catch(function(e) {
      console.error('[扫码失败]', e);
      alert('扫码失败：' + e.message);
      loginState.qrStatus = 'idle';
      createLoginPanel();
    });
  }

  // 手机号登录
  function createPhoneLogin(loginState) {
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'max-width:320px;margin:0 auto';

    var phoneBox = document.createElement('div');
    phoneBox.className = 'shizuku-glass';
    phoneBox.style.cssText = 'padding:12px;border-radius:16px;margin-bottom:12px';

    var phoneLabel = document.createElement('div');
    phoneLabel.textContent = '手机号 (仅中国)';
    phoneLabel.style.cssText = `font-size:10px;color:${C.muted};margin-bottom:8px;letter-spacing:0.1em`;
    phoneBox.appendChild(phoneLabel);

    var phoneInput = document.createElement('input');
    phoneInput.className = 'shizuku-glass';
    phoneInput.placeholder = '13800138000';
    phoneInput.value = loginState.phone;
    phoneInput.style.cssText = `
      width:100%;padding:10px 12px;border-radius:12px;border:none;outline:none;
      font-size:13px;color:${C.text};
    `;
    phoneInput.oninput = function() {
      loginState.phone = this.value.replace(/\D/g, '').slice(0, 11);
      this.value = loginState.phone;
    };
    phoneBox.appendChild(phoneInput);
    wrapper.appendChild(phoneBox);

    var captchaBox = document.createElement('div');
    captchaBox.className = 'shizuku-glass';
    captchaBox.style.cssText = 'padding:12px;border-radius:16px;margin-bottom:12px';

    var captchaHeader = document.createElement('div');
    captchaHeader.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:8px';
    var captchaLabel = document.createElement('span');
    captchaLabel.textContent = '验证码';
    captchaLabel.style.cssText = `font-size:10px;color:${C.muted};letter-spacing:0.1em`;

    var sendBtn = document.createElement('button');
    sendBtn.textContent = loginState.cooldown > 0 ? loginState.cooldown + 's 后重发' : '获取验证码';
    sendBtn.disabled = loginState.cooldown > 0;
    sendBtn.style.cssText = `
      font-size:10px;color:${C.accent};border:none;background:transparent;cursor:pointer;
      opacity:${loginState.cooldown > 0 ? '0.4' : '1'};
    `;
    sendBtn.onclick = function() {
      if (!/^\d{11}$/.test(loginState.phone)) {
        alert('请输入11位手机号');
        return;
      }
      captchaSent(loginState.phone).then(function(r) {
        if (r.code === 200 || r.data === true) {
          alert('验证码已发送');
          loginState.cooldown = 60;
          var countdown = setInterval(function() {
            loginState.cooldown--;
            sendBtn.textContent = loginState.cooldown + 's 后重发';
            if (loginState.cooldown <= 0) {
              clearInterval(countdown);
              sendBtn.textContent = '获取验证码';
              sendBtn.disabled = false;
            }
          }, 1000);
        } else {
          alert(r.message || '发送失败');
        }
      });
    };

    captchaHeader.appendChild(captchaLabel);
    captchaHeader.appendChild(sendBtn);
    captchaBox.appendChild(captchaHeader);

    var captchaInput = document.createElement('input');
    captchaInput.className = 'shizuku-glass';
    captchaInput.placeholder = '6 位验证码';
    captchaInput.value = loginState.captcha;
    captchaInput.style.cssText = `
      width:100%;padding:10px 12px;border-radius:12px;border:none;outline:none;
      font-size:13px;color:${C.text};letter-spacing:0.3em;
    `;
    captchaInput.oninput = function() {
      loginState.captcha = this.value.replace(/\D/g, '').slice(0, 6);
      this.value = loginState.captcha;
    };
    captchaBox.appendChild(captchaInput);
    wrapper.appendChild(captchaBox);

    var loginBtn = document.createElement('button');
    loginBtn.textContent = '登录';
    loginBtn.style.cssText = `
      width:100%;padding:12px;border-radius:16px;border:none;cursor:pointer;
      font-size:13px;color:white;letter-spacing:0.2em;
      background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      box-shadow:0 3px 18px ${C.glow}30;
    `;
    loginBtn.onclick = function() {
      if (!loginState.phone || !loginState.captcha) {
        alert('请填写手机号和验证码');
        return;
      }
      loginCellphone(loginState.phone, loginState.captcha).then(function(r) {
        if (r.code !== 200) {
          alert(r.message || r.msg || '登录失败');
          return;
        }
        var cookie = r.cookie || '';
        var m = cookie.match(/MUSIC_U=([^;]+)/i);
        var musicU = m ? m[1] : '';
        if (musicU) {
          onLoggedIn('MUSIC_U=' + musicU);
        } else {
          alert('登录信息不完整，请重试');
        }
      });
    };
    wrapper.appendChild(loginBtn);

    return wrapper;
  }

  // 手动 Cookie 登录
  function createManualLogin(loginState) {
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'max-width:320px;margin:0 auto';

    var cookieBox = document.createElement('div');
    cookieBox.className = 'shizuku-glass';
    cookieBox.style.cssText = 'padding:12px;border-radius:16px;margin-bottom:12px';

    var label = document.createElement('div');
    label.textContent = 'MUSIC_U Cookie';
    label.style.cssText = `font-size:10px;color:${C.muted};margin-bottom:8px;letter-spacing:0.1em`;
    cookieBox.appendChild(label);

    var textarea = document.createElement('textarea');
    textarea.className = 'shizuku-glass';
    textarea.placeholder = 'MUSIC_U=xxx... 或直接粘贴 cookie 值';
    textarea.value = loginState.manualCookie;
    textarea.rows = 4;
    textarea.style.cssText = `
      width:100%;padding:10px 12px;border-radius:12px;border:none;outline:none;resize:none;
      font-size:10px;color:${C.text};font-family:monospace;
    `;
    textarea.oninput = function() {
      loginState.manualCookie = this.value;
    };
    cookieBox.appendChild(textarea);

    var tip = document.createElement('div');
    tip.textContent = 'music.163.com 登录 → F12 → Application → Cookies → 复制 MUSIC_U';
    tip.style.cssText = `margin-top:8px;font-size:9px;color:${C.faint};font-style:italic`;
    cookieBox.appendChild(tip);
    wrapper.appendChild(cookieBox);

    var saveBtn = document.createElement('button');
    saveBtn.textContent = '保存并登录';
    saveBtn.style.cssText = `
      width:100%;padding:12px;border-radius:16px;border:none;cursor:pointer;
      font-size:13px;color:white;letter-spacing:0.2em;
      background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      box-shadow:0 3px 18px ${C.glow}30;
    `;
    saveBtn.onclick = function() {
      var v = loginState.manualCookie.trim();
      if (!v) {
        alert('请输入 Cookie');
        return;
      }
      var final = v.toUpperCase().startsWith('MUSIC_U=') ? v : 'MUSIC_U=' + v;
      onLoggedIn(final);
    };
    wrapper.appendChild(saveBtn);

    return wrapper;
  }
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
    STATE.audio.addEventListener('ended', function() {
      if (STATE.playMode === 'single') {
        STATE.audio.currentTime = 0;
        STATE.audio.play();
      } else {
        playNext();
      }
    });
  }

  function playSong(song) {
    console.log('[播放歌曲]', song.name, 'ID:', song.id);
    STATE.currentSong = song;
    STATE.lyric = [];
    STATE.activeLyricIdx = -1;

    // 跳转到播放器页面
    STATE.currentView = 'player';
    createUI();

    // 获取歌词
    neteaseLyric(song.id).then(function(data) {
      console.log('[歌词响应]', data);
      STATE.lyric = parseLyric((data.lrc && data.lrc.lyric) || '');
      console.log('[歌词]', STATE.lyric.length + ' 行');
      // 重新渲染播放器以显示歌词
      if (STATE.currentView === 'player') {
        createUI();
      }
    }).catch(function(e) {
      console.error('[获取歌词失败]', e);
    });

    // 获取播放地址
    console.log('[请求播放地址] ID:', song.id, 'Quality:', STATE.quality);
    neteaseSongUrl(song.id).then(function(data) {
      console.log('[播放地址响应]', data);

      // 解析 URL - 多种可能的数据格式
      var url = null;
      if (data.data && Array.isArray(data.data) && data.data[0]) {
        url = data.data[0].url;
      } else if (data.data && data.data.url) {
        url = data.data.url;
      } else if (data.url) {
        url = data.url;
      }

      console.log('[解析URL]', url);

      if (!url) {
        console.error('[无播放地址] 完整响应:', JSON.stringify(data));
        alert('无法获取播放地址，可能是VIP歌曲或版权限制');
        return;
      }

      url = toHttps(url);
      console.log('[最终URL]', url);

      STATE.audio.src = url;
      STATE.audio.play().then(function() {
        console.log('[播放成功]');
        STATE.isPlaying = true;
        // 重新渲染播放器以更新播放状态
        if (STATE.currentView === 'player') {
          createUI();
        }
      }).catch(function(e) {
        console.error('[播放失败]', e);
        alert('播放失败：' + e.message);
      });
    }).catch(function(e) {
      console.error('[获取播放地址失败]', e);
      alert('获取播放地址失败：' + e.message);
    });
  }

  function playNext() {
    if (STATE.playlist.length === 0) return;
    if (STATE.playMode === 'shuffle') {
      STATE.currentIndex = Math.floor(Math.random() * STATE.playlist.length);
    } else {
      STATE.currentIndex = (STATE.currentIndex + 1) % STATE.playlist.length;
    }
    playSong(STATE.playlist[STATE.currentIndex]);
  }

  function playPrev() {
    if (STATE.playlist.length === 0) return;
    if (STATE.playMode === 'shuffle') {
      STATE.currentIndex = Math.floor(Math.random() * STATE.playlist.length);
    } else {
      STATE.currentIndex = (STATE.currentIndex - 1 + STATE.playlist.length) % STATE.playlist.length;
    }
    playSong(STATE.playlist[STATE.currentIndex]);
  }

  function togglePlay() {
    if (STATE.isPlaying) STATE.audio.pause();
    else STATE.audio.play();
  }

  function cyclePlayMode() {
    var modes = ['loop', 'single', 'shuffle'];
    var idx = modes.indexOf(STATE.playMode);
    STATE.playMode = modes[(idx + 1) % modes.length];
    saveSettings();
    if (STATE.appRefs.playModeBtn) {
      updatePlayModeBtn();
    }
  }

  function setVolume(vol) {
    STATE.volume = Math.max(0, Math.min(1, vol));
    if (STATE.audio) STATE.audio.volume = STATE.volume;
    saveSettings();
  }

  // ==================== UI 更新 ====================
  function updateNowPlaying() {
    if (!STATE.appRefs.nowPlaying) return;
    if (STATE.currentSong) {
      STATE.appRefs.songName.textContent = STATE.currentSong.name;
      STATE.appRefs.songArtist.textContent = STATE.currentSong.artist;
      STATE.appRefs.albumCover.src = STATE.currentSong.pic;
      STATE.appRefs.playerSection.style.display = 'flex';
      renderLyrics();
    }
  }

  function renderLyrics() {
    if (!STATE.appRefs.lyricContainer) return;
    var container = STATE.appRefs.lyricContainer;
    container.innerHTML = '';

    if (STATE.lyric.length === 0) {
      var emptyMsg = document.createElement('div');
      emptyMsg.textContent = '暂无歌词';
      emptyMsg.style.cssText = `color:${C.faint};font-size:12px;padding:40px 0;font-style:italic`;
      container.appendChild(emptyMsg);
      return;
    }

    // 渲染所有歌词行
    STATE.lyric.forEach(function(line, idx) {
      var lyricLine = document.createElement('div');
      lyricLine.className = 'lyric-line';
      lyricLine.textContent = line.text;
      lyricLine.style.cssText = `
        padding:8px 12px;font-size:14px;line-height:1.6;
        transition:all 0.3s ease;color:${C.muted};
        cursor:pointer;
      `;
      // 点击歌词跳转到对应时间
      lyricLine.onclick = function() {
        if (STATE.audio) {
          STATE.audio.currentTime = line.t;
        }
      };
      container.appendChild(lyricLine);
    });
  }

  function updatePlayBtn() {
    if (!STATE.appRefs.playBtn) return;
    STATE.appRefs.playBtn.innerHTML = '';
    STATE.appRefs.playBtn.appendChild(svg(STATE.isPlaying ? 'pause' : 'play', 22, 'white'));
  }

  function updatePlayModeBtn() {
    if (!STATE.appRefs.playModeBtn) return;
    var btn = STATE.appRefs.playModeBtn;
    btn.innerHTML = '';

    // 根据模式创建对应图标
    var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('width', '18');
    iconSvg.setAttribute('height', '18');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', C.primary);
    iconSvg.setAttribute('stroke-width', '1.5');

    if (STATE.playMode === 'single') {
      // 单曲循环
      var path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M17 4l3 3-3 3');
      var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M20 7H8a4 4 0 0 0-4 4v0');
      var path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path3.setAttribute('d', 'M7 20l-3-3 3-3');
      var path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path4.setAttribute('d', 'M4 17h12a4 4 0 0 0 4-4v0');
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '12');
      text.setAttribute('y', '14.5');
      text.setAttribute('font-size', '7');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', C.primary);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = '1';
      iconSvg.appendChild(path1);
      iconSvg.appendChild(path2);
      iconSvg.appendChild(path3);
      iconSvg.appendChild(path4);
      iconSvg.appendChild(text);
      btn.title = '单曲循环';
    } else if (STATE.playMode === 'shuffle') {
      // 随机播放
      var path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M3 6h3l12 12h3');
      var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M18 6h3l-3-3');
      var path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path3.setAttribute('d', 'M3 18h3l12-12h3');
      var path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path4.setAttribute('d', 'M18 18h3l-3 3');
      iconSvg.appendChild(path1);
      iconSvg.appendChild(path2);
      iconSvg.appendChild(path3);
      iconSvg.appendChild(path4);
      btn.title = '随机播放';
    } else {
      // 列表循环
      var path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M17 4l3 3-3 3');
      var path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M20 7H8a4 4 0 0 0-4 4v0');
      var path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path3.setAttribute('d', 'M7 20l-3-3 3-3');
      var path4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path4.setAttribute('d', 'M4 17h12a4 4 0 0 0 4-4v0');
      iconSvg.appendChild(path1);
      iconSvg.appendChild(path2);
      iconSvg.appendChild(path3);
      iconSvg.appendChild(path4);
      btn.title = '列表循环';
    }

    btn.appendChild(iconSvg);
  }

  function updateProgress() {
    if (!STATE.appRefs.progressBar || !STATE.duration) return;
    var pct = (STATE.currentTime / STATE.duration) * 100;
    STATE.appRefs.progressFill.style.width = pct + '%';
    STATE.appRefs.currentTimeLabel.textContent = formatTime(STATE.currentTime);
    STATE.appRefs.durationLabel.textContent = formatTime(STATE.duration);

    // 更新当前歌词行
    if (STATE.lyric.length > 0) {
      var idx = -1;
      for (var k = 0; k < STATE.lyric.length; k++) {
        if (STATE.lyric[k].t <= STATE.currentTime) {
          idx = k;
        } else {
          break;
        }
      }
      if (idx !== STATE.activeLyricIdx) {
        STATE.activeLyricIdx = idx;
        updateLyricDisplay();
      }
    }
  }

  function updateLyricDisplay() {
    if (!STATE.appRefs.lyricContainer) return;
    var container = STATE.appRefs.lyricContainer;

    // 高亮当前行
    var lines = container.querySelectorAll('.lyric-line');
    for (var i = 0; i < lines.length; i++) {
      if (i === STATE.activeLyricIdx) {
        lines[i].style.color = C.primary;
        lines[i].style.fontWeight = '600';
        lines[i].style.transform = 'scale(1.05)';
        // 滚动到当前行
        lines[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        lines[i].style.color = C.muted;
        lines[i].style.fontWeight = '400';
        lines[i].style.transform = 'scale(1)';
      }
    }
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

  // ==================== 用户主页 UI ====================
  function createProfileView() {
    var container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;
      background:linear-gradient(180deg, #ffffff 0%, ${C.bg} 50%, ${C.bgDeep} 100%);
      display:flex;flex-direction:column;
    `;

    // 背景装饰 - 使用统一的 BokehBg
    container.appendChild(createBokehBg());

    // 头部 - 带装饰元素
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong ios-safe-top';
    header.style.cssText = `
      padding-left:15px;padding-right:15px;padding-bottom:15px;
      display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);position:relative;z-index:10;
    `;

    // 左侧返回按钮
    var backBtn = document.createElement('button');
    backBtn.className = 'shizuku-btn-hover';
    backBtn.style.cssText = `width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%;transition:all 0.2s`;
    backBtn.appendChild(svg('chevron-left', 16, C.primary));
    backBtn.onclick = function() {
      // 关闭应用或返回
      if (STATE.roche && STATE.roche.ui && STATE.roche.ui.closeApp) {
        STATE.roche.ui.closeApp();
      }
    };
    header.appendChild(backBtn);

    // 中间标题
    var titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:6px';
    titleBox.appendChild(sparkle(7, C.glow, 0));
    titleBox.appendChild(waterDrop(5));

    var title = document.createElement('div');
    title.textContent = 'My Cloud';
    title.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary};font-family:'Georgia',serif`;
    titleBox.appendChild(title);

    titleBox.appendChild(waterDrop(5));
    titleBox.appendChild(sparkle(7, C.sakura, 1.2));
    header.appendChild(titleBox);

    // 右侧按钮
    var rightBtns = document.createElement('div');
    rightBtns.style.cssText = 'display:flex;gap:4px';

    var searchBtn = document.createElement('button');
    searchBtn.className = 'shizuku-btn-hover';
    searchBtn.style.cssText = `width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%;transition:all 0.2s`;
    searchBtn.appendChild(svg('search', 16, C.primary));
    searchBtn.onclick = function() {
      STATE.currentView = 'search';
      createUI();
    };
    rightBtns.appendChild(searchBtn);

    var settingsBtn = document.createElement('button');
    settingsBtn.className = 'shizuku-btn-hover';
    settingsBtn.style.cssText = `width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%;transition:all 0.2s`;
    settingsBtn.appendChild(svg('settings', 16, C.primary));
    settingsBtn.onclick = function() {
      STATE.currentView = 'settings';
      createUI();
    };
    rightBtns.appendChild(settingsBtn);

    header.appendChild(rightBtns);
    container.appendChild(header);

    // 内容区
    var content = document.createElement('div');
    content.className = 'shizuku-scrollbar ios-safe-bottom';
    content.style.cssText = 'flex:1;overflow-y:auto;padding-bottom:100px;position:relative;z-index:10';

    // Banner 头图
    var banner = document.createElement('div');
    banner.style.cssText = 'position:relative;height:128px;overflow:hidden';

    if (STATE.userProfile.backgroundUrl) {
      var bgImg = document.createElement('img');
      bgImg.src = STATE.userProfile.backgroundUrl;
      bgImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
      banner.appendChild(bgImg);
    } else {
      var bgGradient = document.createElement('div');
      bgGradient.style.cssText = `position:absolute;inset:0;background:linear-gradient(135deg, ${C.accent}40, ${C.sakura}40, ${C.lavender}40)`;
      banner.appendChild(bgGradient);
    }

    var bannerOverlay = document.createElement('div');
    bannerOverlay.style.cssText = `position:absolute;inset:0;background:linear-gradient(180deg, transparent 0%, ${C.bg}CC 100%)`;
    banner.appendChild(bannerOverlay);
    content.appendChild(banner);

    // 用户卡片 - 照抄 SullyOS
    var userCard = document.createElement('div');
    userCard.className = 'shizuku-glass-strong';
    userCard.style.cssText = `
      margin:-48px 16px 0 16px;padding:16px;border-radius:24px;position:relative;z-index:10;
      box-shadow:0 10px 40px ${C.glow}15;
    `;

    var userTop = document.createElement('div');
    userTop.style.cssText = 'display:flex;align-items:center;gap:12px';

    var avatarBox = document.createElement('div');
    avatarBox.style.cssText = 'position:relative;flex-shrink:0';

    var avatar = document.createElement('img');
    avatar.src = STATE.userProfile.avatarUrl || 'https://p1.music.126.net/y19E5SadGUmSR8SZxkrNtw==/109951163965029180.jpg';
    avatar.style.cssText = `width:64px;height:64px;border-radius:16px;object-fit:cover;border:2px solid ${C.glow}60;box-shadow:0 4px 20px ${C.glow}30`;
    avatarBox.appendChild(avatar);

    var avatarSparkle = sparkle(10, C.sakura, 0.3);
    avatarSparkle.style.position = 'absolute';
    avatarSparkle.style.bottom = '-4px';
    avatarSparkle.style.right = '-4px';
    avatarBox.appendChild(avatarSparkle);

    userTop.appendChild(avatarBox);

    var userInfo = document.createElement('div');
    userInfo.style.cssText = 'flex:1;min-width:0';

    var userName = document.createElement('div');
    userName.textContent = STATE.userProfile.nickname || '用户';
    userName.style.cssText = `font-size:16px;font-weight:600;color:${C.text};font-family:'Noto Serif',serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
    userInfo.appendChild(userName);

    var userSig = document.createElement('div');
    userSig.textContent = STATE.userProfile.signature || '—';
    userSig.style.cssText = `font-size:10px;color:${C.muted};margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
    userInfo.appendChild(userSig);

    var userBadges = document.createElement('div');
    userBadges.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:6px';

    // VIP 标签 - 照抄 SullyOS
    if (STATE.userProfile.vipType) {
      var vipLabel = STATE.userProfile.vipType === 11 ? '黑胶 SVIP' : 'VIP';
      var vipBadge = document.createElement('span');
      vipBadge.textContent = vipLabel;
      vipBadge.style.cssText = `font-size:9px;padding:2px 8px;border-radius:20px;color:white;font-weight:600;background:linear-gradient(135deg, ${C.vip}, #e0b88a);letter-spacing:0.05em`;
      userBadges.appendChild(vipBadge);
    }

    var uidBadge = document.createElement('span');
    uidBadge.textContent = 'UID · ' + STATE.userProfile.userId;
    uidBadge.style.cssText = `font-size:9px;padding:2px 8px;border-radius:20px;color:${C.muted};border:1px solid ${C.faint}40`;
    userBadges.appendChild(uidBadge);

    userInfo.appendChild(userBadges);
    userTop.appendChild(userInfo);
    userCard.appendChild(userTop);

    // 统计行
    var stats = document.createElement('div');
    stats.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;text-align:center';

    function createStatCell(label, value) {
      var cell = document.createElement('div');
      cell.className = 'shizuku-glass';
      cell.style.cssText = 'padding:8px;border-radius:12px';
      cell.innerHTML = `
        <div style="font-size:16px;font-weight:600;color:${C.primary}">${value}</div>
        <div style="font-size:9px;color:${C.muted};margin-top:2px">${label}</div>
      `;
      return cell;
    }

    stats.appendChild(createStatCell('歌单', STATE.userPlaylists.length));
    stats.appendChild(createStatCell('关注', STATE.userProfile.follows || 0));
    stats.appendChild(createStatCell('粉丝', STATE.userProfile.followeds || 0));
    userCard.appendChild(stats);

    // 快捷按钮行 - 照抄 SullyOS（三个横排按钮）
    var quickBtns = document.createElement('div');
    quickBtns.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px';

    var signBtn = document.createElement('button');
    signBtn.textContent = STATE.signedIn ? '已签到 ✓' : '每日签到';
    signBtn.className = 'shizuku-glass shizuku-btn-hover';
    signBtn.style.cssText = `padding:8px;border-radius:12px;border:1px solid ${STATE.signedIn ? C.faint : C.primary}30;font-size:11px;color:${STATE.signedIn ? C.muted : C.primary};cursor:pointer;transition:all 0.2s;text-align:center`;
    signBtn.onclick = function() {
      if (!STATE.signedIn) doSignIn();
    };
    quickBtns.appendChild(signBtn);

    var dailyBtn = document.createElement('button');
    dailyBtn.textContent = '每日推荐';
    dailyBtn.style.cssText = `
      padding:8px;border-radius:12px;border:none;font-size:11px;color:white;cursor:pointer;
      background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      box-shadow:0 3px 15px ${C.primary}30;transition:all 0.2s;text-align:center;
    `;
    dailyBtn.onclick = loadDailyRecommend;
    quickBtns.appendChild(dailyBtn);

    var fmBtn = document.createElement('button');
    fmBtn.textContent = '私人 FM';
    fmBtn.className = 'shizuku-glass shizuku-btn-hover';
    fmBtn.style.cssText = `padding:8px;border-radius:12px;border:1px solid ${C.faint}30;font-size:11px;color:${C.primary};cursor:pointer;transition:all 0.2s;text-align:center`;
    fmBtn.onclick = loadPersonalFm;
    quickBtns.appendChild(fmBtn);

    userCard.appendChild(quickBtns);

    // 退出登录按钮 - 单独一行
    var logoutBtn = document.createElement('button');
    logoutBtn.textContent = '退出登录';
    logoutBtn.style.cssText = `
      width:100%;margin-top:12px;padding:6px;border:none;background:transparent;
      font-size:10px;color:${C.muted};cursor:pointer;transition:all 0.2s;text-align:center;
    `;
    logoutBtn.onclick = logout;
    userCard.appendChild(logoutBtn);

    content.appendChild(userCard);

    // Tab 切换 - 照抄 SullyOS
    var tabBar = document.createElement('div');
    tabBar.className = 'shizuku-glass';
    tabBar.style.cssText = 'margin:20px 16px 12px;display:flex;align-items:center;gap:4px;border-radius:20px;padding:4px';

    var tabs = [
      { key: 'playlist', label: '歌单' },
      { key: 'record', label: '最近' },
      { key: 'cloud', label: '云盘' }
    ];

    STATE.currentTab = STATE.currentTab || 'playlist';

    tabs.forEach(function(tab) {
      var tabBtn = document.createElement('button');
      tabBtn.textContent = tab.label;
      tabBtn.className = STATE.currentTab === tab.key ? '' : 'shizuku-btn-hover';
      tabBtn.style.cssText = `
        flex:1;padding:6px;border-radius:16px;border:none;
        font-size:11px;letter-spacing:0.1em;cursor:pointer;transition:all 0.2s;
        background:${STATE.currentTab === tab.key ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : 'transparent'};
        color:${STATE.currentTab === tab.key ? 'white' : C.muted};
      `;
      tabBtn.onclick = function() {
        STATE.currentTab = tab.key;
        createUI();
      };
      tabBar.appendChild(tabBtn);
    });

    content.appendChild(tabBar);

    // 歌单列表 - 照抄 SullyOS
    if (STATE.currentTab === 'playlist') {
      var playlistSection = document.createElement('div');
      playlistSection.style.cssText = 'margin:0 16px;position:relative;z-index:10';

      if (STATE.userPlaylists.length === 0) {
        var emptyHint = document.createElement('div');
        emptyHint.style.cssText = `text-align:center;padding:40px 20px;color:${C.faint};font-size:11px`;
        emptyHint.textContent = '还没有歌单';
        playlistSection.appendChild(emptyHint);
      } else {
        STATE.userPlaylists.forEach(function(playlist) {
          var plCard = document.createElement('div');
          plCard.className = 'shizuku-glass';
          plCard.style.cssText = 'padding:12px;border-radius:16px;margin-bottom:8px;cursor:pointer;transition:all 0.2s';
          plCard.onclick = function() {
            STATE.expandedPlaylistId = playlist.id;
            STATE.currentView = 'playlist';
            createUI();
          };

          var plTop = document.createElement('div');
          plTop.style.cssText = 'display:flex;align-items:center;gap:12px';

          var plCover = document.createElement('img');
          plCover.src = playlist.coverImgUrl || 'https://p1.music.126.net/y19E5SadGUmSR8SZxkrNtw==/109951163965029180.jpg';
          plCover.style.cssText = 'width:48px;height:48px;border-radius:12px;object-fit:cover;flex-shrink:0';
          plTop.appendChild(plCover);

          var plInfo = document.createElement('div');
          plInfo.style.cssText = 'flex:1;min-width:0';

          var plName = document.createElement('div');
          plName.textContent = playlist.name;
          plName.style.cssText = `font-size:13px;color:${C.text};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
          plInfo.appendChild(plName);

          var plMeta = document.createElement('div');
          plMeta.textContent = playlist.trackCount + ' 首' + (playlist.creator ? ' · ' + playlist.creator : '');
          plMeta.style.cssText = `font-size:10px;color:${C.muted};margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
          plInfo.appendChild(plMeta);

          plTop.appendChild(plInfo);

          var expandIcon = document.createElement('div');
          expandIcon.textContent = '→';
          expandIcon.style.cssText = `font-size:14px;color:${C.muted}`;
          plTop.appendChild(expandIcon);

          plCard.appendChild(plTop);
          playlistSection.appendChild(plCard);
        });
      }

      content.appendChild(playlistSection);
    } else if (STATE.currentTab === 'record') {
      // 播放记录
      var recordSection = document.createElement('div');
      recordSection.style.cssText = 'margin:0 16px;position:relative;z-index:10';

      // 加载播放记录
      if (!STATE.playRecord || STATE.playRecord.length === 0) {
        var loadingHint = document.createElement('div');
        loadingHint.style.cssText = `text-align:center;padding:40px 20px;color:${C.faint};font-size:11px`;
        loadingHint.textContent = '加载中...';
        recordSection.appendChild(loadingHint);

        // 调用 API 加载
        neteaseRecordRecentSong(STATE.userProfile.userId).then(function(data) {
          var records = (data.data && data.data.list) || [];
          STATE.playRecord = records.map(function(r) {
            var s = r.data || r.song || {};
            return {
              id: s.id,
              name: s.name,
              artist: (s.ar || []).map(function(a) { return a.name; }).join(' / '),
              artists: (s.ar || []).map(function(a) { return a.name; }).join(' / '),
              album: (s.al || {}).name || '',
              pic: toHttps((s.al || {}).picUrl || ''),
              albumPic: toHttps((s.al || {}).picUrl || ''),
              duration: (s.dt || 0) / 1000,
              fee: s.fee || 0
            };
          });
          createUI(); // 重新渲染
        }).catch(function(e) {
          console.error('[加载播放记录失败]', e);
        });
      } else {
        // 显示播放记录
        STATE.playRecord.forEach(function(song, idx) {
          var row = createSongRow(song, idx);
          row.onclick = function() {
            STATE.playlist = STATE.playRecord;
            STATE.currentIndex = idx;
            playSong(song);
          };
          recordSection.appendChild(row);
        });
      }

      content.appendChild(recordSection);
    } else if (STATE.currentTab === 'cloud') {
      // 云盘
      var cloudSection = document.createElement('div');
      cloudSection.style.cssText = 'margin:0 16px;position:relative;z-index:10';

      // 加载云盘
      if (!STATE.cloudSongs || STATE.cloudSongs.length === 0) {
        var loadingHint = document.createElement('div');
        loadingHint.style.cssText = `text-align:center;padding:40px 20px;color:${C.faint};font-size:11px`;
        loadingHint.textContent = '加载中...';
        cloudSection.appendChild(loadingHint);

        // 调用 API 加载云盘
        neteaseCall('/user/cloud', { limit: 200 }).then(function(data) {
          var cloudData = data.data || [];
          STATE.cloudSongs = cloudData.map(function(item) {
            var s = item.simpleSong || {};
            return {
              id: s.id,
              name: s.name,
              artist: (s.ar || []).map(function(a) { return a.name; }).join(' / '),
              artists: (s.ar || []).map(function(a) { return a.name; }).join(' / '),
              album: (s.al || {}).name || '',
              pic: toHttps((s.al || {}).picUrl || ''),
              albumPic: toHttps((s.al || {}).picUrl || ''),
              duration: (s.dt || 0) / 1000,
              fee: 0
            };
          });
          createUI(); // 重新渲染
        }).catch(function(e) {
          console.error('[加载云盘失败]', e);
        });
      } else {
        if (STATE.cloudSongs.length === 0) {
          var emptyHint = document.createElement('div');
          emptyHint.style.cssText = `text-align:center;padding:40px 20px;color:${C.faint};font-size:11px`;
          emptyHint.textContent = '云盘为空';
          cloudSection.appendChild(emptyHint);
        } else {
          // 显示云盘歌曲
          STATE.cloudSongs.forEach(function(song, idx) {
            var row = createSongRow(song, idx);
            row.onclick = function() {
              STATE.playlist = STATE.cloudSongs;
              STATE.currentIndex = idx;
              playSong(song);
            };
            cloudSection.appendChild(row);
          });
        }
      }

      content.appendChild(cloudSection);
    }

    container.appendChild(content);
    STATE.appContainer.innerHTML = '';
    STATE.appContainer.appendChild(container);
  }

  // ==================== 搜索页面 UI ====================
  function createSearchView() {
    var container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;
      background:linear-gradient(180deg, #ffffff 0%, ${C.bg} 50%, ${C.bgDeep} 100%);
      display:flex;flex-direction:column;
    `;

    // 背景装饰
    container.appendChild(createBokehBg());

    // 头部 - 带装饰
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong ios-safe-top';
    header.style.cssText = `
      padding-left:15px;padding-right:15px;padding-bottom:15px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);position:relative;z-index:10;
    `;

    // 左侧关闭按钮
    var closeBtn = document.createElement('button');
    closeBtn.className = 'shizuku-btn-hover';
    closeBtn.style.cssText = `width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%;transition:all 0.2s`;
    closeBtn.appendChild(svg('x', 16, C.primary));
    closeBtn.onclick = function() {
      if (STATE.roche && STATE.roche.ui && STATE.roche.ui.closeApp) {
        STATE.roche.ui.closeApp();
      }
    };
    header.appendChild(closeBtn);

    // 中间标题
    var titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:6px';
    titleBox.appendChild(sparkle(7, C.glow, 0));
    titleBox.appendChild(waterDrop(5));

    var title = document.createElement('div');
    title.textContent = '未来音楽';
    title.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary};font-family:'Georgia',serif`;
    titleBox.appendChild(title);

    titleBox.appendChild(waterDrop(5));
    titleBox.appendChild(sparkle(7, C.sakura, 1.2));
    header.appendChild(titleBox);

    // 右侧按钮
    var rightBtns = document.createElement('div');
    rightBtns.style.cssText = 'display:flex;gap:4px';

    var profileBtn = document.createElement('button');
    profileBtn.className = 'shizuku-btn-hover';
    profileBtn.style.cssText = `width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%;transition:all 0.2s`;
    profileBtn.appendChild(svg('chevron-left', 16, C.primary));
    profileBtn.onclick = function() {
      STATE.currentView = 'profile';
      createUI();
    };
    rightBtns.appendChild(profileBtn);

    header.appendChild(rightBtns);
    container.appendChild(header);

    // 搜索栏 - 水晶胶囊风格
    var searchBox = document.createElement('div');
    searchBox.style.cssText = 'padding:12px;position:relative;z-index:10';

    var searchInputWrap = document.createElement('div');
    searchInputWrap.className = 'shizuku-glass';
    searchInputWrap.style.cssText = `
      display:flex;align-items:center;gap:10px;
      padding:10px 14px;border-radius:16px;
      box-shadow:0 2px 20px ${C.glow}15,inset 0 1px 0 rgba(255,255,255,0.4);
    `;

    var searchIcon = svg('search', 15, C.muted);
    searchInputWrap.appendChild(searchIcon);

    var searchInput = document.createElement('input');
    searchInput.placeholder = '搜一首想听的歌...';
    searchInput.style.cssText = `
      flex:1;background:transparent;border:none;outline:none;
      font-size:13px;color:${C.text};
    `;
    searchInput.onkeydown = function(e) {
      if (e.key === 'Enter') {
        doSearch(this.value);
      }
    };

    // 添加星芒装饰
    var sparkleDecor = sparkle(6, C.sakura, 0.5);
    searchInputWrap.appendChild(searchInput);
    searchInputWrap.appendChild(sparkleDecor);

    var searchBtn = document.createElement('button');
    searchBtn.textContent = '搜索';
    searchBtn.className = 'shizuku-btn-hover';
    searchBtn.style.cssText = `
      margin-left:8px;padding:8px 14px;border-radius:16px;border:none;cursor:pointer;
      font-size:11px;color:white;position:relative;overflow:hidden;
      background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      box-shadow:0 3px 15px ${C.primary}30;
    `;
    // 扫光效果
    var shimmer = document.createElement('div');
    shimmer.style.cssText = `
      position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
      background-size:200% 100%;animation:shizuku-shimmer 3s ease-in-out infinite;
    `;
    searchBtn.appendChild(shimmer);
    var btnText = document.createElement('span');
    btnText.textContent = '搜索';
    btnText.style.position = 'relative';
    btnText.style.zIndex = '10';
    searchBtn.appendChild(btnText);
    searchBtn.onclick = function() {
      doSearch(searchInput.value);
    };

    searchBox.appendChild(searchInputWrap);
    searchBox.appendChild(searchBtn);
    container.appendChild(searchBox);

    // 用户状态标签 - 照抄 SullyOS
    if (STATE.userProfile) {
      var userStatus = document.createElement('div');
      userStatus.style.cssText = 'padding:0 20px;margin-top:-4px;margin-bottom:6px;position:relative;z-index:10';

      var statusBtn = document.createElement('button');
      statusBtn.className = 'shizuku-glass shizuku-btn-hover';
      statusBtn.style.cssText = `
        display:inline-flex;align-items:center;gap:8px;
        padding-left:2px;padding-right:12px;padding-top:2px;padding-bottom:2px;
        border-radius:20px;font-size:10px;color:${C.muted};cursor:pointer;border:none;
      `;
      statusBtn.onclick = function() {
        STATE.currentView = 'profile';
        createUI();
      };

      if (STATE.userProfile.avatarUrl) {
        var miniAvatar = document.createElement('img');
        miniAvatar.src = STATE.userProfile.avatarUrl;
        miniAvatar.style.cssText = 'width:20px;height:20px;border-radius:50%;object-fit:cover';
        statusBtn.appendChild(miniAvatar);
      } else {
        statusBtn.appendChild(sparkle(6, C.sakura, 0.3));
      }

      var statusText = document.createElement('span');
      statusText.textContent = STATE.userProfile.nickname + ' · ' + (STATE.quality || 'standard');
      statusBtn.appendChild(statusText);

      userStatus.appendChild(statusBtn);
      container.appendChild(userStatus);
    } else {
      var loginHint = document.createElement('div');
      loginHint.style.cssText = 'padding:0 20px;margin-top:-4px;margin-bottom:6px;position:relative;z-index:10';

      var loginBtn = document.createElement('button');
      loginBtn.style.cssText = `
        display:inline-flex;align-items:center;gap:4px;
        padding:2px 10px;border-radius:20px;font-size:10px;cursor:pointer;
        background:${C.vip}18;color:${C.vip};border:1px solid ${C.vip}30;
      `;
      loginBtn.textContent = '未登录 — 点击登录网易云';
      loginBtn.onclick = function() {
        STATE.currentView = 'profile';
        createUI();
      };

      loginHint.appendChild(loginBtn);
      container.appendChild(loginHint);
    }

    // 结果列表
    var resultsList = document.createElement('div');
    resultsList.className = 'shizuku-scrollbar ios-safe-bottom';
    resultsList.style.cssText = 'flex:1;overflow-y:auto;padding:0 8px;padding-bottom:100px;position:relative;z-index:10';

    if (STATE.searchResults.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = `text-align:center;padding:60px 20px;color:${C.faint}`;

      // 星芒装饰组
      var sparkleGroup = document.createElement('div');
      sparkleGroup.style.cssText = 'position:relative;display:inline-block;margin-bottom:16px';
      var mainSparkle = sparkle(24, C.glow, 0);
      mainSparkle.style.display = 'block';
      mainSparkle.style.margin = '0 auto';
      sparkleGroup.appendChild(mainSparkle);

      var topRightSparkle = sparkle(12, C.sakura, 0.8);
      topRightSparkle.style.position = 'absolute';
      topRightSparkle.style.top = '-4px';
      topRightSparkle.style.right = '-12px';
      sparkleGroup.appendChild(topRightSparkle);

      var bottomLeftSparkle = sparkle(8, C.lavender, 1.5);
      bottomLeftSparkle.style.position = 'absolute';
      bottomLeftSparkle.style.bottom = '-8px';
      bottomLeftSparkle.style.left = '-8px';
      sparkleGroup.appendChild(bottomLeftSparkle);

      empty.appendChild(sparkleGroup);

      var emptyText = document.createElement('div');
      emptyText.textContent = '搜一首想听的歌吧';
      emptyText.style.cssText = `font-size:12px;font-style:italic;font-family:'Georgia',serif`;
      empty.appendChild(emptyText);

      resultsList.appendChild(empty);
    } else {
      STATE.searchResults.forEach(function(song, idx) {
        var row = createSongRow(song, idx);
        resultsList.appendChild(row);
      });
    }

    container.appendChild(resultsList);

    // 迷你播放器
    if (STATE.currentSong) {
      container.appendChild(createMiniPlayer());
    }

    STATE.appContainer.innerHTML = '';
    STATE.appContainer.appendChild(container);
  }

  // 创建歌曲行
  function createSongRow(song, idx) {
    var isActive = STATE.currentSong && STATE.currentSong.id === song.id;
    var isVip = song.fee && song.fee === 1;

    var row = document.createElement('button');
    row.style.cssText = `
      width:100%;display:flex;align-items:center;gap:12px;
      padding:10px 12px;border-radius:16px;border:none;cursor:pointer;
      margin-bottom:6px;transition:all 0.3s ease;text-align:left;
      background:${isActive ? `linear-gradient(135deg, rgba(255,255,255,0.25), rgba(137,212,255,0.15))` : 'rgba(255,255,255,0.08)'};
      backdrop-filter:${isActive ? 'blur(12px) saturate(1.4)' : 'none'};
      -webkit-backdrop-filter:${isActive ? 'blur(12px) saturate(1.4)' : 'none'};
      border:${isActive ? `1.5px solid rgba(255,255,255,0.4)` : '1.5px solid transparent'};
      box-shadow:${isActive ? `0 2px 16px ${C.glow}15` : 'none'};
    `;

    row.onmouseenter = function() {
      if (!isActive) {
        row.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(137,212,255,0.1))';
        row.style.transform = 'translateX(4px)';
      }
    };
    row.onmouseleave = function() {
      if (!isActive) {
        row.style.background = 'rgba(255,255,255,0.08)';
        row.style.transform = 'translateX(0)';
      }
    };

    row.onclick = function() {
      STATE.playlist = STATE.searchResults;
      STATE.currentIndex = idx;
      playSong(song);
      createUI();
    };

    var coverBox = document.createElement('div');
    coverBox.style.cssText = 'position:relative;flex-shrink:0';

    var img = document.createElement('img');
    img.src = song.pic;
    img.style.cssText = `width:44px;height:44px;border-radius:12px;object-fit:cover;border:1.5px solid ${isActive ? C.accent + '60' : C.faint + '40'}`;
    coverBox.appendChild(img);

    if (isActive) {
      var sparkle = document.createElement('div');
      sparkle.style.cssText = 'position:absolute;top:-2px;right:-2px;width:8px;height:8px;opacity:0.7;animation:shizuku-twinkle 2.5s ease-in-out 0s infinite';
      sparkle.innerHTML = '<svg width="8" height="8" viewBox="0 0 20 20" fill="' + C.glow + '"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"/></svg>';
      coverBox.appendChild(sparkle);
    }

    row.appendChild(coverBox);

    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0';

    var titleBox = document.createElement('div');
    titleBox.style.cssText = `display:flex;align-items:center;gap:6px;font-size:14px;color:${C.text}`;

    if (isVip) {
      var vipBadge = document.createElement('span');
      vipBadge.textContent = 'VIP';
      vipBadge.style.cssText = `font-size:8px;padding:1px 6px;border-radius:10px;color:white;font-weight:600;background:linear-gradient(135deg, #daa855, #e0b88a);letter-spacing:0.05em;flex-shrink:0`;
      titleBox.appendChild(vipBadge);
    }

    var title = document.createElement('span');
    title.textContent = song.name;
    title.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:400';
    titleBox.appendChild(title);

    info.appendChild(titleBox);

    var subtitle = document.createElement('div');
    subtitle.textContent = song.artist;
    subtitle.style.cssText = `font-size:11px;color:${C.muted};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`;
    info.appendChild(subtitle);

    row.appendChild(info);

    var dur = document.createElement('div');
    dur.textContent = formatTime(song.duration);
    dur.style.cssText = `font-size:10px;color:${C.faint};font-family:monospace;flex-shrink:0`;
    row.appendChild(dur);

    return row;
  }

  // 搜索功能
  function doSearch(keyword) {
    if (!keyword || !keyword.trim()) return;
    console.log('[搜索]', keyword);
    neteaseSearch(keyword).then(function(resp) {
      var songs = (resp.result || resp).songs || [];
      if (songs.length === 0) {
        STATE.searchResults = [];
        createUI();
        return;
      }
      STATE.searchResults = songs.map(function(s) {
        return {
          id: s.id,
          name: s.name,
          artist: (s.ar || s.artists || []).map(function(a) { return a.name; }).join(' / '),
          album: (s.al || s.album || {}).name || '',
          pic: toHttps((s.al || s.album || {}).picUrl || ''),
          duration: (s.dt || s.duration || 0) / 1000
        };
      });
      createUI();
    }).catch(function(e) {
      console.error('[搜索失败]', e);
    });
  }

  // 灵动岛播放器
  function createMiniPlayer() {
    var island = document.createElement('div');
    island.style.cssText = `
      position:fixed;top:0;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);
      border-radius:32px;padding:8px 16px;
      display:flex;align-items:center;gap:12px;
      box-shadow:0 8px 32px rgba(0,0,0,0.3);
      z-index:1000;transition:all 0.3s ease;
      cursor:pointer;
      margin-top:max(12px, calc(env(safe-area-inset-top) + 8px));
    `;

    // hover 效果
    island.onmouseenter = function() {
      island.style.transform = 'translateX(-50%) scale(1.05)';
      island.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
    };
    island.onmouseleave = function() {
      island.style.transform = 'translateX(-50%) scale(1)';
      island.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
    };

    island.onclick = function() {
      STATE.currentView = 'player';
      createUI();
    };

    // 封面（圆形）
    var cover = document.createElement('img');
    cover.src = STATE.currentSong.pic;
    cover.style.cssText = `
      width:36px;height:36px;border-radius:50%;
      object-fit:cover;
    `;

    // 歌曲信息
    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0';
    info.innerHTML = `
      <div style="font-size:12px;color:white;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px">${STATE.currentSong.name}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px">${STATE.currentSong.artist}</div>
    `;

    // 波形动画（播放中）
    var waveform = document.createElement('div');
    waveform.style.cssText = 'display:flex;align-items:center;gap:2px;height:20px';
    if (STATE.isPlaying) {
      for (var i = 0; i < 3; i++) {
        var bar = document.createElement('div');
        bar.style.cssText = `
          width:3px;background:white;border-radius:2px;
          animation:wave 0.8s ease-in-out infinite;
          animation-delay:${i * 0.15}s;
        `;
        bar.style.height = ['8px', '14px', '10px'][i];
        waveform.appendChild(bar);
      }
    } else {
      // 暂停图标
      var pauseIcon = document.createElement('div');
      pauseIcon.style.cssText = 'color:white;font-size:16px';
      pauseIcon.textContent = '⏸';
      waveform.appendChild(pauseIcon);
    }

    // 控制按钮（小）
    var playBtn = document.createElement('button');
    playBtn.style.cssText = `
      width:28px;height:28px;border-radius:50%;border:none;
      background:rgba(255,255,255,0.2);cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:all 0.2s;
    `;
    playBtn.onmouseenter = function() {
      this.style.background = 'rgba(255,255,255,0.3)';
    };
    playBtn.onmouseleave = function() {
      this.style.background = 'rgba(255,255,255,0.2)';
    };
    playBtn.onclick = function(e) {
      e.stopPropagation();
      togglePlay();
      createUI();
    };
    playBtn.appendChild(svg(STATE.isPlaying ? 'pause' : 'play', 14, 'white'));

    island.appendChild(cover);
    island.appendChild(info);
    island.appendChild(waveform);
    island.appendChild(playBtn);

    return island;
  }

  // ==================== 播放器大页面 UI ====================
  function createPlayerView() {
    if (!STATE.currentSong) {
      STATE.currentView = 'profile';
      createUI();
      return;
    }

    var container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;
      background:linear-gradient(180deg, #ffffff 0%, ${C.bg} 60%, ${C.bgDeep} 100%);
      display:flex;flex-direction:column;
    `;

    // 背景装饰
    container.appendChild(createBokehBg());

    // 头部 - 带装饰
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong ios-safe-top';
    header.style.cssText = `
      padding-left:15px;padding-right:15px;padding-bottom:15px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);position:relative;z-index:10;
    `;

    var backBtn = document.createElement('button');
    backBtn.className = 'shizuku-btn-hover';
    backBtn.style.cssText = `padding:8px;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%`;
    backBtn.appendChild(svg('chevron-left', 20, C.primary));
    backBtn.onclick = function() {
      STATE.currentView = 'search';
      createUI();
    };

    var titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:6px';
    titleBox.appendChild(sparkle(7, C.glow, 0));

    var title = document.createElement('div');
    title.textContent = 'Now Playing';
    title.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary};font-family:'Georgia',serif`;
    titleBox.appendChild(title);

    titleBox.appendChild(sparkle(7, C.sakura, 1.2));

    header.appendChild(backBtn);
    header.appendChild(titleBox);
    header.appendChild(document.createElement('div')); // placeholder
    container.appendChild(header);

    // 主内容区
    var content = document.createElement('div');
    content.className = 'ios-safe-bottom';
    content.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;padding:20px;overflow:hidden;position:relative;z-index:10';

    // 唱片封面（带旋转动画）- 更精致的设计
    var vinylBox = document.createElement('div');
    vinylBox.style.cssText = 'position:relative;margin-top:20px';

    var vinyl = document.createElement('div');
    vinyl.style.cssText = `
      width:200px;height:200px;border-radius:50%;
      background:linear-gradient(135deg, ${C.bgDeep}, ${C.bg});
      box-shadow:0 8px 32px rgba(0,0,0,0.15),inset 0 0 0 8px rgba(255,255,255,0.1),
                 0 0 0 1px ${C.faint}30;
      display:flex;align-items:center;justify-content:center;
      animation:${STATE.isPlaying ? 'shizuku-vinyl 3s linear infinite' : 'none'};
      position:relative;
    `;

    // 内圈光晕
    var innerGlow = document.createElement('div');
    innerGlow.style.cssText = `
      position:absolute;inset:0;border-radius:50%;
      box-shadow:inset 0 0 30px ${C.glow}20;
      pointer-events:none;
    `;
    vinyl.appendChild(innerGlow);

    var albumCover = document.createElement('img');
    albumCover.src = STATE.currentSong.pic;
    albumCover.style.cssText = `
      width:160px;height:160px;border-radius:50%;
      object-fit:cover;position:relative;z-index:2;
      box-shadow:0 4px 16px rgba(0,0,0,0.2),0 0 0 2px rgba(255,255,255,0.3);
    `;

    vinyl.appendChild(albumCover);

    // Bitrate 标签 - 照抄 SullyOS
    if (STATE.currentSong.bitrate) {
      var bitrateLabel = document.createElement('div');
      bitrateLabel.className = 'shizuku-glass';
      bitrateLabel.style.cssText = `
        position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
        padding:2px 8px;border-radius:12px;font-size:9px;color:${C.primary};
        border:1px solid ${C.primary}30;font-weight:600;letter-spacing:0.05em;
        pointer-events:none;z-index:3;
      `;
      var bitrateMap = {
        'standard': '128 kbps',
        'higher': '192 kbps',
        'exhigh': '320 kbps',
        'lossless': '1411 kbps',
        'hires': '24bit · Hi-Res'
      };
      bitrateLabel.textContent = bitrateMap[STATE.quality] || STATE.quality || '128 kbps';
      vinyl.appendChild(bitrateLabel);
    }

    // 播放时的星芒装饰
    if (STATE.isPlaying) {
      var topSparkle = sparkle(10, C.glow, 0);
      topSparkle.style.position = 'absolute';
      topSparkle.style.top = '-8px';
      topSparkle.style.left = '50%';
      topSparkle.style.transform = 'translateX(-50%)';
      vinylBox.appendChild(topSparkle);

      var rightSparkle = sparkle(8, C.sakura, 0.8);
      rightSparkle.style.position = 'absolute';
      rightSparkle.style.top = '50%';
      rightSparkle.style.right = '-8px';
      rightSparkle.style.transform = 'translateY(-50%)';
      vinylBox.appendChild(rightSparkle);

      var leftSparkle = sparkle(8, C.lavender, 1.5);
      leftSparkle.style.position = 'absolute';
      leftSparkle.style.top = '50%';
      leftSparkle.style.left = '-8px';
      leftSparkle.style.transform = 'translateY(-50%)';
      vinylBox.appendChild(leftSparkle);
    }

    vinylBox.appendChild(vinyl);
    content.appendChild(vinylBox);

    // 歌曲信息
    var songInfo = document.createElement('div');
    songInfo.style.cssText = 'margin-top:24px;text-align:center;width:100%';
    songInfo.innerHTML = `
      <div style="font-size:18px;font-weight:600;color:${C.text};margin-bottom:8px">${STATE.currentSong.name}</div>
      <div style="font-size:13px;color:${C.muted}">${STATE.currentSong.artist}</div>
    `;
    content.appendChild(songInfo);

    // 进度条
    var progressBox = document.createElement('div');
    progressBox.style.cssText = 'width:100%;margin-top:24px';

    var progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width:100%;height:6px;border-radius:3px;
      background:${C.faint}30;position:relative;cursor:pointer;
    `;
    progressBar.onclick = function(e) {
      var rect = this.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      if (STATE.audio) STATE.audio.currentTime = pct * STATE.duration;
    };

    var progressFill = document.createElement('div');
    progressFill.style.cssText = `
      height:100%;border-radius:3px;
      background:linear-gradient(90deg, ${C.primary}, ${C.accent});
      width:0%;transition:width 0.1s;
    `;
    progressBar.appendChild(progressFill);

    var timeLabels = document.createElement('div');
    timeLabels.style.cssText = 'display:flex;justify-content:space-between;margin-top:8px';
    var currentTimeLabel = document.createElement('span');
    currentTimeLabel.textContent = '0:00';
    currentTimeLabel.style.cssText = `font-size:11px;color:${C.muted};font-family:monospace`;
    var durationLabel = document.createElement('span');
    durationLabel.textContent = '0:00';
    durationLabel.style.cssText = `font-size:11px;color:${C.muted};font-family:monospace`;
    timeLabels.appendChild(currentTimeLabel);
    timeLabels.appendChild(durationLabel);

    progressBox.appendChild(progressBar);
    progressBox.appendChild(timeLabels);
    content.appendChild(progressBox);

    // 控制按钮 - 更精致的设计
    var controls = document.createElement('div');
    controls.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:32px;margin-top:24px';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'shizuku-btn-hover';
    prevBtn.style.cssText = `
      padding:12px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);
      cursor:pointer;color:${C.muted};transition:all 0.2s;
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    `;
    prevBtn.appendChild(svg('skip-back', 28, C.muted));
    prevBtn.onclick = playPrev;
    prevBtn.onmouseenter = function() {
      this.style.background = 'rgba(255,255,255,0.25)';
      this.style.transform = 'scale(1.05)';
    };
    prevBtn.onmouseleave = function() {
      this.style.background = 'rgba(255,255,255,0.15)';
      this.style.transform = 'scale(1)';
    };

    var playBtn = document.createElement('button');
    playBtn.className = 'shizuku-btn-hover';
    playBtn.style.cssText = `
      width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;position:relative;
      background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      box-shadow:0 4px 20px ${C.glow}40;transition:all 0.2s;
    `;
    playBtn.onmousedown = function() { this.style.transform = 'scale(0.95)'; };
    playBtn.onmouseup = function() { this.style.transform = 'scale(1)'; };
    playBtn.appendChild(svg(STATE.isPlaying ? 'pause' : 'play', 28, 'white'));
    playBtn.onclick = togglePlay;

    // 播放按钮的光晕动画
    if (STATE.isPlaying) {
      playBtn.style.animation = 'shizuku-glow 2s ease-in-out infinite';
    }

    var nextBtn = document.createElement('button');
    nextBtn.className = 'shizuku-btn-hover';
    nextBtn.style.cssText = `
      padding:12px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);
      cursor:pointer;color:${C.muted};transition:all 0.2s;
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    `;
    nextBtn.appendChild(svg('skip-forward', 28, C.muted));
    nextBtn.onclick = playNext;
    nextBtn.onmouseenter = function() {
      this.style.background = 'rgba(255,255,255,0.25)';
      this.style.transform = 'scale(1.05)';
    };
    nextBtn.onmouseleave = function() {
      this.style.background = 'rgba(255,255,255,0.15)';
      this.style.transform = 'scale(1)';
    };

    controls.appendChild(prevBtn);
    controls.appendChild(playBtn);
    controls.appendChild(nextBtn);
    content.appendChild(controls);

    // 歌词显示（滚动）
    var lyricBox = document.createElement('div');
    lyricBox.className = 'shizuku-scrollbar';
    lyricBox.style.cssText = `
      flex:1;width:100%;margin-top:24px;overflow-y:auto;text-align:center;
      mask-image:linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
      -webkit-mask-image:linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
    `;

    if (STATE.lyric.length === 0) {
      var emptyLyric = document.createElement('div');
      emptyLyric.style.cssText = `padding:40px 0;color:${C.faint}`;

      // 星芒装饰
      var sparkleDecor = sparkle(24, C.glow, 0);
      sparkleDecor.style.display = 'block';
      sparkleDecor.style.margin = '0 auto 12px';
      emptyLyric.appendChild(sparkleDecor);

      var emptyText = document.createElement('div');
      emptyText.textContent = '暂无歌词';
      emptyText.style.cssText = `font-size:11px;font-style:italic;font-family:'Georgia',serif`;
      emptyLyric.appendChild(emptyText);

      lyricBox.appendChild(emptyLyric);
    } else {
      STATE.lyric.forEach(function(line, idx) {
        var lyricLine = document.createElement('div');
        lyricLine.className = 'lyric-line';
        lyricLine.textContent = line.text;
        var isActive = idx === STATE.activeLyricIdx;
        lyricLine.style.cssText = `
          padding:10px 12px;font-size:${isActive ? '16px' : '14px'};
          line-height:1.6;transition:all 0.3s ease;
          color:${isActive ? C.primary : C.muted};
          font-weight:${isActive ? '600' : '400'};
          cursor:pointer;position:relative;
        `;

        // 当前行添加星芒装饰
        if (isActive) {
          var leftStar = sparkle(6, C.sakura, 0);
          leftStar.style.position = 'absolute';
          leftStar.style.left = '8px';
          leftStar.style.top = '50%';
          leftStar.style.transform = 'translateY(-50%)';
          lyricLine.appendChild(leftStar);

          var rightStar = sparkle(6, C.sakura, 0.5);
          rightStar.style.position = 'absolute';
          rightStar.style.right = '8px';
          rightStar.style.top = '50%';
          rightStar.style.transform = 'translateY(-50%)';
          lyricLine.appendChild(rightStar);
        }

        lyricLine.onclick = function() {
          if (STATE.audio) STATE.audio.currentTime = line.t;
        };
        lyricBox.appendChild(lyricLine);
      });
    }

    content.appendChild(lyricBox);
    container.appendChild(content);

    // 保存引用以便更新
    STATE.appRefs.playerProgressBar = progressBar;
    STATE.appRefs.playerProgressFill = progressFill;
    STATE.appRefs.playerCurrentTime = currentTimeLabel;
    STATE.appRefs.playerDuration = durationLabel;
    STATE.appRefs.playerPlayBtn = playBtn;
    STATE.appRefs.playerLyricBox = lyricBox;

    STATE.appContainer.innerHTML = '';
    STATE.appContainer.appendChild(container);
  }

  // ==================== 歌单视图 UI ====================
  function createPlaylistView() {
    var container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;
      background:linear-gradient(180deg, ${C.bg} 0%, ${C.bgDeep} 100%);
      display:flex;flex-direction:column;z-index:100;
    `;

    // 背景装饰
    container.appendChild(createBokehBg());

    // 头部
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong ios-safe-top';
    header.style.cssText = `
      padding-left:15px;padding-right:15px;padding-bottom:15px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);position:relative;z-index:10;
    `;
    var backBtn = document.createElement('button');
    backBtn.style.cssText = `padding:8px;border:none;background:transparent;cursor:pointer;color:${C.primary}`;
    backBtn.appendChild(svg('x', 16, C.primary));
    backBtn.onclick = function() {
      STATE.currentView = 'main';
      STATE.expandedPlaylistId = null;
      STATE.currentPlaylistSongs = [];
      createUI();
    };
    var title = document.createElement('div');
    title.textContent = STATE.expandedPlaylistId ? '歌单详情' : '我的歌单';
    title.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary}`;
    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(document.createElement('div')); // placeholder
    container.appendChild(header);

    // 内容区
    var content = document.createElement('div');
    content.className = 'shizuku-scrollbar ios-safe-bottom';
    content.style.cssText = 'flex:1;overflow-y:auto;padding:16px;position:relative;z-index:10';

    if (STATE.expandedPlaylistId && STATE.currentPlaylistSongs.length > 0) {
      // 显示歌单歌曲
      STATE.currentPlaylistSongs.forEach(function(song, idx) {
        var row = document.createElement('div');
        row.style.cssText = `
          display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:6px;
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
          STATE.playlist = STATE.currentPlaylistSongs;
          STATE.currentIndex = idx;
          playSong(song);
          // 回到主界面
          STATE.currentView = 'main';
          createUI();
        };

        var img = document.createElement('img');
        img.src = song.pic;
        img.style.cssText = 'width:44px;height:44px;border-radius:12px;object-fit:cover;border:1.5px solid ' + C.faint + '40';

        var info = document.createElement('div');
        info.style.cssText = 'flex:1;min-width:0';
        info.innerHTML = `
          <div style="font-size:13px;color:${C.text};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${song.name}</div>
          <div style="font-size:11px;color:${C.muted};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${song.artist}</div>
        `;

        var dur = document.createElement('div');
        dur.textContent = formatTime(song.duration);
        dur.style.cssText = 'font-size:10px;color:' + C.faint;

        row.appendChild(img);
        row.appendChild(info);
        row.appendChild(dur);
        content.appendChild(row);
      });
    } else {
      // 显示歌单列表
      if (STATE.userPlaylists.length === 0) {
        var empty = document.createElement('div');
        empty.textContent = '加载中...';
        empty.style.cssText = `text-align:center;padding:40px;color:${C.muted}`;
        content.appendChild(empty);
      } else {
        STATE.userPlaylists.forEach(function(pl) {
          var card = document.createElement('div');
          card.className = 'shizuku-glass';
          card.style.cssText = `
            padding:12px;border-radius:16px;margin-bottom:12px;cursor:pointer;
            display:flex;align-items:center;gap:12px;transition:all 0.2s;
          `;
          card.onmouseenter = function() {
            card.style.background = C.glass;
            card.style.boxShadow = '0 4px 20px ' + C.glow + '20';
          };
          card.onmouseleave = function() {
            card.style.background = 'rgba(255,255,255,0.22)';
            card.style.boxShadow = 'none';
          };
          card.onclick = function() {
            loadPlaylistDetail(pl.id);
          };

          var cover = document.createElement('img');
          cover.src = pl.coverImgUrl;
          cover.style.cssText = `width:60px;height:60px;border-radius:12px;object-fit:cover;border:1.5px solid ${C.accent}40`;

          var plInfo = document.createElement('div');
          plInfo.style.cssText = 'flex:1;min-width:0';
          plInfo.innerHTML = `
            <div style="font-size:14px;color:${C.text};font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pl.name}</div>
            <div style="font-size:11px;color:${C.muted};margin-top:4px">${pl.trackCount} 首 · ${pl.creator}</div>
          `;

          card.appendChild(cover);
          card.appendChild(plInfo);
          content.appendChild(card);
        });
      }
    }

    container.appendChild(content);
    STATE.appContainer.innerHTML = '';
    STATE.appContainer.appendChild(container);
  }

  // 设置页面
  function createSettingsView() {
    var container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;
      background:linear-gradient(180deg, #ffffff 0%, ${C.bg} 50%, ${C.bgDeep} 100%);
      display:flex;flex-direction:column;
    `;

    // 背景装饰
    container.appendChild(createBokehBg());

    // Header
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong ios-safe-top';
    header.style.cssText = `
      padding-left:15px;padding-right:15px;padding-bottom:15px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);position:relative;z-index:10;
    `;

    // 返回按钮
    var backBtn = document.createElement('button');
    backBtn.className = 'shizuku-btn-hover';
    backBtn.style.cssText = `width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:${C.primary};border-radius:50%;transition:all 0.2s`;
    backBtn.appendChild(svg('chevron-left', 16, C.primary));
    backBtn.onclick = function() {
      STATE.currentView = 'profile';
      createUI();
    };
    header.appendChild(backBtn);

    // 标题
    var titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:6px';
    var title = document.createElement('div');
    title.textContent = '设置';
    title.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary};font-family:'Georgia',serif`;
    titleBox.appendChild(title);
    header.appendChild(titleBox);

    // 占位
    var placeholder = document.createElement('div');
    placeholder.style.cssText = 'width:32px;height:32px';
    header.appendChild(placeholder);

    container.appendChild(header);

    // 内容区
    var content = document.createElement('div');
    content.className = 'shizuku-scrollbar ios-safe-bottom';
    content.style.cssText = 'flex:1;overflow-y:auto;padding:20px 16px;position:relative;z-index:10';

    // 音质设置
    var qualitySection = document.createElement('div');
    qualitySection.className = 'shizuku-glass';
    qualitySection.style.cssText = 'padding:16px;border-radius:20px;margin-bottom:16px';

    var qualityTitle = document.createElement('div');
    qualityTitle.textContent = '音质选择';
    qualityTitle.style.cssText = `font-size:13px;font-weight:600;color:${C.text};margin-bottom:12px`;
    qualitySection.appendChild(qualityTitle);

    var qualities = [
      { value: 'standard', label: '标准' },
      { value: 'higher', label: '较高' },
      { value: 'exhigh', label: '极高' },
      { value: 'lossless', label: '无损' },
      { value: 'hires', label: 'Hi-Res' }
    ];

    qualities.forEach(function(q) {
      var qBtn = document.createElement('button');
      qBtn.textContent = q.label;
      qBtn.className = 'shizuku-btn-hover';
      qBtn.style.cssText = `
        display:block;width:100%;padding:10px;margin-bottom:8px;border-radius:12px;border:none;cursor:pointer;
        font-size:12px;text-align:left;transition:all 0.2s;
        background:${STATE.quality === q.value ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : 'rgba(255,255,255,0.4)'};
        color:${STATE.quality === q.value ? 'white' : C.text};
      `;
      qBtn.onclick = function() {
        STATE.quality = q.value;
        saveSettings();
        createUI();
      };
      qualitySection.appendChild(qBtn);
    });

    content.appendChild(qualitySection);

    // 账号信息
    var accountSection = document.createElement('div');
    accountSection.className = 'shizuku-glass';
    accountSection.style.cssText = 'padding:16px;border-radius:20px;margin-bottom:16px';

    var accountTitle = document.createElement('div');
    accountTitle.textContent = '账号';
    accountTitle.style.cssText = `font-size:13px;font-weight:600;color:${C.text};margin-bottom:12px`;
    accountSection.appendChild(accountTitle);

    var userInfo = document.createElement('div');
    userInfo.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:12px';

    var avatar = document.createElement('img');
    avatar.src = STATE.userProfile.avatarUrl;
    avatar.style.cssText = 'width:48px;height:48px;border-radius:50%;object-fit:cover';
    userInfo.appendChild(avatar);

    var userText = document.createElement('div');
    userText.innerHTML = `
      <div style="font-size:14px;color:${C.text};font-weight:500">${STATE.userProfile.nickname}</div>
      <div style="font-size:11px;color:${C.muted};margin-top:4px">UID: ${STATE.userProfile.userId}</div>
    `;
    userInfo.appendChild(userText);

    accountSection.appendChild(userInfo);

    var logoutBtn = document.createElement('button');
    logoutBtn.textContent = '退出登录';
    logoutBtn.className = 'shizuku-btn-hover';
    logoutBtn.style.cssText = `
      width:100%;padding:10px;border-radius:12px;border:1px solid ${C.faint}40;
      background:rgba(255,255,255,0.4);color:${C.muted};font-size:12px;cursor:pointer;
    `;
    logoutBtn.onclick = logout;
    accountSection.appendChild(logoutBtn);

    content.appendChild(accountSection);

    // 关于
    var aboutSection = document.createElement('div');
    aboutSection.className = 'shizuku-glass';
    aboutSection.style.cssText = 'padding:16px;border-radius:20px';

    var aboutTitle = document.createElement('div');
    aboutTitle.textContent = '关于';
    aboutTitle.style.cssText = `font-size:13px;font-weight:600;color:${C.text};margin-bottom:8px`;
    aboutSection.appendChild(aboutTitle);

    var aboutText = document.createElement('div');
    aboutText.innerHTML = `
      <div style="font-size:11px;color:${C.muted};line-height:1.6">
        网易云音乐播放器 Shizuku 主题<br>
        版本：v3.8.0<br>
        完全照抄 SullyOS 美化设计
      </div>
    `;
    aboutSection.appendChild(aboutText);

    content.appendChild(aboutSection);

    container.appendChild(content);
    STATE.appContainer.innerHTML = '';
    STATE.appContainer.appendChild(container);
  }

  // ==================== UI 构建 ====================
  function createUI() {
    injectStyles();

    // 未登录时直接显示登录界面
    if (!STATE.cookie || !STATE.userProfile) {
      createLoginPanel();
      return;
    }

    // 根据当前视图决定渲染内容
    if (STATE.currentView === 'profile') {
      createProfileView(); // 用户主页
      return;
    }

    if (STATE.currentView === 'search') {
      createSearchView(); // 搜索页面
      return;
    }

    if (STATE.currentView === 'playlist') {
      createPlaylistView(); // 歌单详情
      return;
    }

    if (STATE.currentView === 'player') {
      createPlayerView(); // 播放器大页面
      return;
    }

    if (STATE.currentView === 'settings') {
      createSettingsView(); // 设置页面
      return;
    }

    // 默认显示用户主页
    createProfileView();
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
    window.RochePlugin.register({
      id: 'roche-music-player',
      name: '网易云音乐',
      version: '3.9.1',
      icon: '🎵',
      apps: [{
        id: 'netease-music',
        name: '网易云音乐',
        mount: function(container, roche) {
          console.log('[网易云音乐播放器 Shizuku] 初始化', BUILD_TIME);
          STATE.roche = roche;
          STATE.appContainer = container;
          loadSettings();
          initAudio();
          createUI();
          // 初始化播放模式按钮
          if (STATE.appRefs.playModeBtn) {
            updatePlayModeBtn();
          }
        },
        unmount: function(container) {
          if (STATE.audio) {
            STATE.audio.pause();
            STATE.audio = null;
          }
          container.replaceChildren();
        }
      }]
    });
  }
})();
