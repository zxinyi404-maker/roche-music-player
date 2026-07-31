/**
 * Cloudflare Worker - 网易云音乐 API 代理（修复版）
 * 使用网易云开放接口，避免被墙
 */

// 网易云开放 API
const NETEASE_API_BASE = 'https://music.163.com/api';

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

  return new Response('Roche Music Player API Worker v2', {
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
      path: apiPath,
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
 * 调用网易云 API - 使用官方接口
 */
async function callNeteaseApi(path, params, cookie) {
  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `${NETEASE_API_BASE}${path}`;

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://music.163.com/',
      'Origin': 'https://music.163.com',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        code: response.status,
        error: `HTTP ${response.status}`,
        message: '网易云 API 请求失败',
      };
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        error: '解析响应失败',
        raw: text.substring(0, 500),
        code: 500,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return {
        code: 408,
        error: '请求超时',
        message: '网易云 API 响应超时（8秒）',
      };
    }

    return {
      code: 500,
      error: error.message,
      message: '网络请求失败',
    };
  }
}

// 监听请求
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
