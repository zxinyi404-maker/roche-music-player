// 网易云音乐播放器 - 雫 (shizuku) 主题版本
// 完全照抄 SullyOS 的美化设计：玻璃拟态、浮游粒子、星芒、柔光、梦幻渐变
(function () {
  'use strict';

  var BUILD_TIME = '2026-08-01-03:00-v2.2.0-playmode';

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
    currentView: 'main' // 'main' | 'login'
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
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
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
  function captchaSent(phone) { return neteaseCall('/captcha/sent', { phone }); }
  function loginCellphone(phone, captcha) { return neteaseCall('/login/cellphone', { phone, captcha }); }
  function neteaseSearch(keyword) { return neteaseCall('/search', { keyword, limit: 30, type: 1 }); }
  function neteaseSongUrl(id) { return neteaseCall('/song/url', { id, level: STATE.quality }); }

  // ==================== 登录功能 ====================

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

  // 登录成功回调
  function onLoggedIn(cookie) {
    console.log('[登录成功]', cookie);
    STATE.cookie = cookie;
    fetchUserInfo().then(function() {
      STATE.currentView = 'main';
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
    var loginState = {
      mode: 'qr', // 'qr' | 'phone' | 'manual'
      qrKey: '',
      qrImg: '',
      qrStatus: 'idle', // 'idle' | 'waiting' | 'scanned' | 'expired' | 'done'
      phone: '',
      captcha: '',
      cooldown: 0,
      manualCookie: ''
    };

    var container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;
      background:linear-gradient(180deg, #ffffff 0%, ${C.bg} 50%, ${C.bgDeep} 100%);
      display:flex;flex-direction:column;z-index:100;
    `;

    // 背景装饰
    var bokeh = document.createElement('div');
    bokeh.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
    bokeh.innerHTML = `
      <div style="position:absolute;top:8%;right:5%;width:128px;height:128px;border-radius:50%;
        background:radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%);
        animation:shizuku-float 8s ease-in-out infinite"></div>
    `;
    container.appendChild(bokeh);

    // 头部
    var header = document.createElement('div');
    header.className = 'shizuku-glass-strong';
    header.style.cssText = `
      padding:15px;display:flex;justify-content:space-between;align-items:center;
      border-bottom:1px solid rgba(255,255,255,0.3);position:relative;z-index:10;
    `;
    var backBtn = document.createElement('button');
    backBtn.style.cssText = `padding:8px;border:none;background:transparent;cursor:pointer;color:${C.primary}`;
    backBtn.appendChild(svg('x', 16, C.primary));
    backBtn.onclick = function() {
      if (STATE.qrPollTimer) {
        clearInterval(STATE.qrPollTimer);
        STATE.qrPollTimer = null;
      }
      STATE.currentView = 'main';
      createUI();
    };
    var title = document.createElement('div');
    title.textContent = '登录网易云';
    title.style.cssText = `font-size:15px;letter-spacing:0.15em;font-weight:300;color:${C.primary}`;
    header.appendChild(backBtn);
    header.appendChild(title);
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
        loginState.mode = m.k;
        createLoginPanel(); // 重新渲染
      };
      modeSwitcher.appendChild(btn);
    });
    container.appendChild(modeSwitcher);

    // 内容区域
    var content = document.createElement('div');
    content.className = 'shizuku-scrollbar';
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
    loginQrKey().then(function(keyRes) {
      var key = (keyRes.data && keyRes.data.unikey) || keyRes.unikey;
      if (!key) throw new Error('无法获取 key');
      loginState.qrKey = key;
      return loginQrCreate(key);
    }).then(function(createRes) {
      var img = (createRes.data && createRes.data.qrimg) || createRes.qrimg;
      if (!img) throw new Error('无法生成二维码');
      loginState.qrImg = img;

      // 更新二维码显示
      qrBox.innerHTML = '';
      var qrImg = document.createElement('img');
      qrImg.src = img;
      qrImg.style.cssText = 'width:192px;height:192px;border-radius:12px;display:block';
      qrBox.appendChild(qrImg);

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
            }
          }
        }).catch(function(e) {
          console.error('[轮询失败]', e);
        });
      }, 2500);
    }).catch(function(e) {
      console.error('[扫码失败]', e);
      loginState.qrStatus = 'idle';
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
    }
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

    // 根据当前视图决定渲染内容
    if (STATE.currentView === 'login') {
      createLoginPanel();
      return;
    }

    // 主界面
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

    // 右侧：登录按钮或用户信息
    var rightArea = document.createElement('div');
    rightArea.style.cssText = 'display:flex;align-items:center;gap:8px';

    if (STATE.cookie && STATE.userProfile) {
      // 已登录：显示用户头像
      var avatar = document.createElement('img');
      avatar.src = STATE.userProfile.avatarUrl || '';
      avatar.style.cssText = `
        width:28px;height:28px;border-radius:50%;cursor:pointer;
        border:1.5px solid ${C.sakura};
      `;
      avatar.onclick = logout; // 点击头像退出登录
      avatar.title = '点击退出登录';
      rightArea.appendChild(avatar);
    } else {
      // 未登录：显示登录按钮
      var loginBtn = document.createElement('button');
      loginBtn.textContent = '登录';
      loginBtn.style.cssText = `
        padding:6px 12px;border-radius:12px;border:none;cursor:pointer;
        font-size:11px;color:white;
        background:linear-gradient(135deg, ${C.primary}, ${C.accent});
      `;
      loginBtn.onclick = showLoginPanel;
      rightArea.appendChild(loginBtn);
    }

    header.appendChild(rightArea);

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

    // 播放模式和音量控制
    var subActions = document.createElement('div');
    subActions.style.cssText = 'display:flex;align-items:center;justify-content:space-around;gap:16px;margin-top:12px;padding:0 20px';

    // 播放模式按钮
    var playModeBtn = document.createElement('button');
    playModeBtn.style.cssText = `
      display:flex;flex-direction:column;align-items:center;gap:4px;
      border:none;background:transparent;cursor:pointer;opacity:0.6;transition:opacity 0.2s;
    `;
    playModeBtn.onmouseenter = function() { this.style.opacity = '1'; };
    playModeBtn.onmouseleave = function() { this.style.opacity = '0.6'; };
    playModeBtn.onclick = cyclePlayMode;

    var playModeLabel = document.createElement('span');
    playModeLabel.textContent = 'Loop';
    playModeLabel.style.cssText = `font-size:8px;color:${C.primary};text-transform:uppercase;letter-spacing:0.15em`;
    playModeBtn.appendChild(playModeLabel);

    // 音量控制
    var volumeBox = document.createElement('div');
    volumeBox.style.cssText = 'flex:1;display:flex;align-items:center;gap:8px;max-width:200px';

    var volumeIcon = document.createElement('span');
    volumeIcon.textContent = '🔊';
    volumeIcon.style.cssText = 'font-size:14px;opacity:0.6';

    var volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = String(STATE.volume * 100);
    volumeSlider.style.cssText = `
      flex:1;height:4px;border-radius:2px;outline:none;
      -webkit-appearance:none;
      background:linear-gradient(to right, ${C.primary} 0%, ${C.primary} ${STATE.volume * 100}%, ${C.faint}30 ${STATE.volume * 100}%, ${C.faint}30 100%);
    `;
    volumeSlider.oninput = function() {
      var vol = parseInt(this.value) / 100;
      setVolume(vol);
      this.style.background = `linear-gradient(to right, ${C.primary} 0%, ${C.primary} ${vol * 100}%, ${C.faint}30 ${vol * 100}%, ${C.faint}30 100%)`;
    };

    volumeBox.appendChild(volumeIcon);
    volumeBox.appendChild(volumeSlider);

    subActions.appendChild(playModeBtn);
    subActions.appendChild(volumeBox);

    playerSection.appendChild(nowPlayingBox);
    playerSection.appendChild(progressBox);
    playerSection.appendChild(controls);
    playerSection.appendChild(subActions);

    main.appendChild(header);
    main.appendChild(searchBox);
    main.appendChild(searchResults);
    main.appendChild(playerSection);
    STATE.appContainer.appendChild(main);

    // 保存引用
    STATE.appRefs = {
      searchInput, searchResults, playerSection, albumCover, songName, songArtist,
      progressBar, progressFill, currentTimeLabel, durationLabel, playBtn,
      playModeBtn, nowPlaying: songInfo
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
    window.RochePlugin.register({
      id: 'roche-music-player',
      name: '网易云音乐',
      version: '2.0.3',
      icon: '🎵',
      apps: [{
        id: 'netease-music',
        name: '网易云音乐',
        async mount(container, roche) {
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
        async unmount(container) {
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
