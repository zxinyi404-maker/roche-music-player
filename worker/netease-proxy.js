/**
 * Cloudflare Worker - 网易云音乐 API 代理
 * 基于 SullyOS 的实现，支持扫码登录和音乐播放
 */

// 网易云 API 基础 URL
const NETEASE_API_BASE = 'https://music.163.com';

// CORS 头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Netease-Cookie',
};

/**
 * 处理请求
 */
async function handleRequest(request) {
  const url = new URL(request.url);

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // 解析路径
  const path = url.pathname;

  // 网易云 API 代理
  if (path.startsWith('/netease/')) {
    return handleNeteaseProxy(request, path.replace('/netease', ''));
  }

  return new Response('Roche Music Player API Worker', {
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' },
  });
}

/**
 * 代理网易云 API
 */
async function handleNeteaseProxy(request, apiPath) {
  try {
    // 解析请求体
    let body = {};
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      }
    }

    // 获取 Cookie
    const cookie = request.headers.get('X-Netease-Cookie') || '';

    // 调用网易云 API
    const result = await callNeteaseApi(apiPath, body, cookie);

    return new Response(JSON.stringify(result), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || '请求失败',
      code: 500,
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * 调用网易云 API
 */
async function callNeteaseApi(path, params, cookie) {
  const url = `${NETEASE_API_BASE}${path}`;

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://music.163.com/',
  };

  if (cookie) {
    headers['Cookie'] = cookie;
  }

  // 构建表单数据
  const formData = new URLSearchParams();
  Object.keys(params).forEach(key => {
    formData.append(key, params[key]);
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: formData.toString(),
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { error: '解析响应失败', raw: text };
  }
}

// 监听请求
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
