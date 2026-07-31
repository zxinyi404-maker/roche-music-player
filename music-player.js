// 网易云音乐播放器 - 完全照抄 SullyOS 实现
// 只保留网易云功能，删除所有第三方音源
(function () {
  'use strict';

  var BUILD_TIME = '2026-08-01-00:15-v2.0.0';

  // ==================== 全局状态 ====================
  var STATE = {
    // 网易云配置
    backend: 'https://sullymeow.ccwu.cc', // SullyOS 的 Worker
    cookie: '',                             // 网易云 Cookie (MUSIC_U=xxx)
    userProfile: null,                      // 用户信息

    // 播放器状态
    audio: null,
    currentSong: null,
    isPlaying: false,
    volume: 0.8,
    quality: 'standard', // standard | higher | exhigh | lossless

    // UI 状态
    appContainer: null,
    appRefs: {},
    qrPollTimer: null,

    // Roche 集成
    roche: null
  };

  // ==================== 工具函数 ====================
  function toHttps(url) {
    if (!url) return url;
    return url.replace(/^http:\/\//i, 'https://');
  }

  // ==================== 存储管理 ====================
  function loadSettings() {
    try {
      var stored = localStorage.getItem('rmp-netease-settings');
      if (stored) {
        var data = JSON.parse(stored);
        STATE.cookie = data.cookie || '';
        STATE.userProfile = data.userProfile || null;
        STATE.volume = data.volume || 0.8;
        STATE.quality = data.quality || 'standard';
      }
    } catch (e) {
      console.error('[loadSettings 失败]', e);
    }
  }

  function saveSettings() {
    try {
      var data = {
        cookie: STATE.cookie,
        userProfile: STATE.userProfile,
        volume: STATE.volume,
        quality: STATE.quality
      };
      localStorage.setItem('rmp-netease-settings', JSON.stringify(data));
    } catch (e) {
      console.error('[saveSettings 失败]', e);
    }
  }

  // ==================== 网易云 API（完全照抄 SullyOS）====================

  // 通用 API 调用
  function neteaseCall(path, body) {
    var url = STATE.backend.replace(/\/+$/, '') + '/netease' + path;
    var headers = { 'Content-Type': 'application/json' };
    if (STATE.cookie) {
      headers['X-Netease-Cookie'] = STATE.cookie;
    }
    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body || {})
    }).then(function(res) {
      return res.json();
    });
  }

  // 登录相关
  function loginQrKey() {
    return neteaseCall('/login/qr/key', {});
  }

  function loginQrCreate(key) {
    return neteaseCall('/login/qr/create', { key: key, qrimg: true });
  }

  function loginQrCheck(key) {
    return neteaseCall('/login/qr/check', { key: key });
  }

  function loginStatus() {
    return neteaseCall('/login/status', {});
  }

  // 搜索和歌曲
  function neteaseSearch(keyword, limit, offset) {
    return neteaseCall('/search', {
      keyword: keyword,
      limit: limit || 30,
      offset: offset || 0,
      type: 1
    });
  }

  function neteaseSongUrl(id) {
    return neteaseCall('/song/url', {
      id: id,
      level: STATE.quality || 'standard'
    });
  }

  function neteaseLyric(id) {
    return neteaseCall('/lyric', { id: id });
  }

  // 用户相关
  function neteaseUserPlaylist(uid) {
    return neteaseCall('/user/playlist', { uid: uid, limit: 60 });
  }

  function neteaseRecommendSongs() {
    return neteaseCall('/recommend/songs', {});
  }

  function neteasePlaylistDetail(id) {
    return neteaseCall('/playlist/detail', { id: id });
  }

  // ==================== 播放器核心 ====================

  // 初始化音频播放器
  function initAudio() {
    STATE.audio = new Audio();
    STATE.audio.volume = STATE.volume;
    STATE.audio.addEventListener('play', function() {
      STATE.isPlaying = true;
      updatePlayButton();
    });
    STATE.audio.addEventListener('pause', function() {
      STATE.isPlaying = false;
      updatePlayButton();
    });
  }

  // 播放歌曲
  function playSong(song) {
    console.log('[播放歌曲]', song.name, song.id);
    STATE.currentSong = song;

    neteaseSongUrl(song.id).then(function(data) {
      var songData = (data.data && data.data[0]) || data;
      var url = songData.url || '';
      if (!url) {
        console.error('[获取播放地址失败]', data);
        return;
      }
      url = toHttps(url);
      console.log('[播放地址]', url);
      STATE.audio.src = url;
      STATE.audio.play();
      updateNowPlaying();
    }).catch(function(e) {
      console.error('[播放失败]', e);
    });
  }

  // 更新正在播放显示
  function updateNowPlaying() {
    var el = STATE.appRefs.nowPlaying;
    if (!el) return;
    if (STATE.currentSong) {
      el.textContent = '正在播放: ' + STATE.currentSong.name + ' - ' + STATE.currentSong.artist;
    } else {
      el.textContent = '暂无播放';
    }
  }

  // 更新播放按钮
  function updatePlayButton() {
    var btn = STATE.appRefs.playBtn;
    if (!btn) return;
    btn.textContent = STATE.isPlaying ? '暂停' : '播放';
  }

  // ==================== 用户登录 ====================

  // 获取用户信息
  function fetchUserInfo() {
    if (!STATE.cookie) return Promise.resolve(null);
    return loginStatus().then(function(data) {
      console.log('[loginStatus 响应]', data);
      if (data && data.data && data.data.profile) {
        STATE.userProfile = data.data.profile;
        saveSettings();
        return data.data.profile;
      }
      return null;
    }).catch(function(e) {
      console.error('[获取用户信息失败]', e);
      return null;
    });
  }

  // 更新登录 UI
  function updateLoginUI() {
    var refs = STATE.appRefs;
    console.log('[updateLoginUI] cookie:', STATE.cookie, 'userProfile:', STATE.userProfile);

    if (STATE.cookie && STATE.userProfile) {
      // 已登录
      refs.loginArea.style.display = 'none';
      refs.userArea.style.display = 'block';
      refs.userName.textContent = STATE.userProfile.nickname || '用户';
      refs.userAvatar.src = STATE.userProfile.avatarUrl || '';
    } else {
      // 未登录
      refs.loginArea.style.display = 'block';
      refs.userArea.style.display = 'none';
    }
  }

  // 扫码登录
  function showQrLogin() {
    console.log('[扫码登录] 开始');

    // TODO: 实现扫码登录弹窗
    alert('扫码登录功能开发中...');
  }

  // ==================== 搜索功能 ====================

  function doSearch() {
    var keyword = STATE.appRefs.searchInput.value.trim();
    if (!keyword) {
      alert('请输入搜索关键词');
      return;
    }

    console.log('[搜索]', keyword);
    STATE.appRefs.searchResults.innerHTML = '<div style="text-align:center;padding:20px;">搜索中...</div>';

    neteaseSearch(keyword, 30, 0).then(function(resp) {
      console.log('[搜索结果]', resp);
      var result = resp.result || resp;
      var songs = result.songs || [];

      if (songs.length === 0) {
        STATE.appRefs.searchResults.innerHTML = '<div style="text-align:center;padding:20px;">没有找到歌曲</div>';
        return;
      }

      renderSearchResults(songs);
    }).catch(function(e) {
      console.error('[搜索失败]', e);
      STATE.appRefs.searchResults.innerHTML = '<div style="text-align:center;padding:20px;">搜索失败</div>';
    });
  }

  function renderSearchResults(songs) {
    var html = '<div style="padding:10px;">';
    for (var i = 0; i < songs.length; i++) {
      var s = songs[i];
      var ar = s.artists || s.ar || [];
      var artist = ar.map(function(a) { return a.name; }).join(' / ');
      html += '<div style="padding:8px;border-bottom:1px solid #333;cursor:pointer;" data-idx="' + i + '">';
      html += '<div style="font-weight:bold;">' + (s.name || '') + '</div>';
      html += '<div style="font-size:12px;color:#999;">' + artist + '</div>';
      html += '</div>';
    }
    html += '</div>';
    STATE.appRefs.searchResults.innerHTML = html;

    // 绑定点击事件
    STATE.appRefs.searchResults.querySelectorAll('[data-idx]').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(el.getAttribute('data-idx'));
        var s = songs[idx];
        var ar = s.artists || s.ar || [];
        var artist = ar.map(function(a) { return a.name; }).join(' / ');
        playSong({
          id: s.id,
          name: s.name,
          artist: artist
        });
      });
    });
  }

  // ==================== UI 构建 ====================

  function createUI() {
    var html = '\
<div style="width:100%;height:100%;background:#1a1a1a;color:#fff;display:flex;flex-direction:column;">\
  <!-- 头部 -->\
  <div style="padding:15px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;">\
    <div style="font-size:18px;font-weight:bold;">网易云音乐</div>\
    <div style="font-size:12px;color:#666;">' + BUILD_TIME + '</div>\
  </div>\
  \
  <!-- 用户区域 -->\
  <div style="padding:15px;border-bottom:1px solid #333;">\
    <div class="login-area" style="display:block;">\
      <button class="qr-login-btn" style="padding:8px 16px;background:#c20c0c;color:#fff;border:none;border-radius:4px;cursor:pointer;">扫码登录</button>\
    </div>\
    <div class="user-area" style="display:none;display:flex;align-items:center;">\
      <img class="user-avatar" src="" style="width:40px;height:40px;border-radius:50%;margin-right:10px;" />\
      <div class="user-name" style="font-size:14px;"></div>\
    </div>\
  </div>\
  \
  <!-- 搜索区域 -->\
  <div style="padding:15px;border-bottom:1px solid #333;">\
    <div style="display:flex;gap:10px;">\
      <input class="search-input" type="text" placeholder="搜索歌曲..." style="flex:1;padding:8px;background:#2a2a2a;border:1px solid #444;border-radius:4px;color:#fff;" />\
      <button class="search-btn" style="padding:8px 16px;background:#31c27c;color:#fff;border:none;border-radius:4px;cursor:pointer;">搜索</button>\
    </div>\
  </div>\
  \
  <!-- 搜索结果 -->\
  <div class="search-results" style="flex:1;overflow-y:auto;"></div>\
  \
  <!-- 播放控制 -->\
  <div style="padding:15px;border-top:1px solid #333;background:#0a0a0a;">\
    <div class="now-playing" style="font-size:12px;color:#999;margin-bottom:8px;">暂无播放</div>\
    <div style="display:flex;gap:10px;">\
      <button class="play-btn" style="padding:8px 16px;background:#31c27c;color:#fff;border:none;border-radius:4px;cursor:pointer;">播放</button>\
    </div>\
  </div>\
</div>\
    ';

    STATE.appContainer.innerHTML = html;

    // 保存引用
    STATE.appRefs = {
      loginArea: STATE.appContainer.querySelector('.login-area'),
      userArea: STATE.appContainer.querySelector('.user-area'),
      userName: STATE.appContainer.querySelector('.user-name'),
      userAvatar: STATE.appContainer.querySelector('.user-avatar'),
      qrLoginBtn: STATE.appContainer.querySelector('.qr-login-btn'),
      searchInput: STATE.appContainer.querySelector('.search-input'),
      searchBtn: STATE.appContainer.querySelector('.search-btn'),
      searchResults: STATE.appContainer.querySelector('.search-results'),
      nowPlaying: STATE.appContainer.querySelector('.now-playing'),
      playBtn: STATE.appContainer.querySelector('.play-btn')
    };

    // 绑定事件
    STATE.appRefs.qrLoginBtn.addEventListener('click', showQrLogin);
    STATE.appRefs.searchBtn.addEventListener('click', doSearch);
    STATE.appRefs.searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') doSearch();
    });
    STATE.appRefs.playBtn.addEventListener('click', function() {
      if (STATE.isPlaying) {
        STATE.audio.pause();
      } else {
        STATE.audio.play();
      }
    });
  }

  // ==================== 入口函数 ====================

  function init(roche, container) {
    console.log('[网易云音乐播放器] 初始化 v' + BUILD_TIME);

    STATE.roche = roche;
    STATE.appContainer = container;

    loadSettings();
    initAudio();
    createUI();

    // 如果已登录，获取用户信息
    if (STATE.cookie) {
      fetchUserInfo().then(function() {
        updateLoginUI();
      });
    } else {
      updateLoginUI();
    }
  }

  // ==================== 导出 ====================

  if (typeof window !== 'undefined') {
    window.RocheMusicPlayer = {
      init: init,
      version: BUILD_TIME
    };
  }

})();
