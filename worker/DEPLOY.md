# 部署网易云 API Worker

## 方法一：使用 Cloudflare Dashboard（推荐，最简单）

### 步骤：

1. **登录 Cloudflare**
   - 访问 https://dash.cloudflare.com/
   - 登录你的账号

2. **创建 Worker**
   - 左侧菜单选择 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Create Worker"
   - 名称填写：`roche-netease-api`（或其他你喜欢的名称）

3. **粘贴代码**
   - 点击 "Quick edit"
   - 删除默认代码
   - 复制 `worker/netease-proxy.js` 的全部内容
   - 粘贴到编辑器
   - 点击 "Save and Deploy"

4. **获取 Worker URL**
   - 部署成功后会显示类似：`https://roche-netease-api.你的账号.workers.dev`
   - 复制这个 URL

5. **更新插件配置**
   - 在插件设置中，将 `backend` 改为你的 Worker URL
   - 或者修改 `music-player.js` 第 42 行的 `STATE.backend`

---

## 方法二：使用 Wrangler CLI（高级用户）

### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 wrangler.toml

```toml
name = "roche-netease-api"
main = "worker/netease-proxy.js"
compatibility_date = "2024-01-01"

[env.production]
workers_dev = true
```

### 4. 部署

```bash
cd ~/roche-music-player-fork
wrangler deploy
```

---

## 测试 Worker

部署成功后，测试一下：

```bash
# 测试获取二维码 key
curl -X POST "https://你的worker地址.workers.dev/netease/login/qr/key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

应该返回类似：
```json
{
  "code": 200,
  "data": {
    "code": 200,
    "unikey": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

---

## 更新插件配置

### 方法 A：在代码中修改（推荐）

编辑 `music-player.js` 第 42 行：

```javascript
backend: 'https://你的worker地址.workers.dev',
```

### 方法 B：在插件设置中修改

1. 打开 Roche 插件
2. 进入"设置"
3. 找到"后端地址"
4. 填入你的 Worker URL
5. 保存

---

## 常见问题

### Q: Worker 部署失败？
A: 检查是否登录了 Cloudflare 账号，确保账号已验证邮箱

### Q: Worker 调用返回 403？
A: Cloudflare 可能限制了网易云 API 访问，尝试添加更多请求头

### Q: 扫码后无响应？
A: 打开浏览器控制台（F12），查看 Network 标签的请求详情

### Q: Worker 有访问限制吗？
A: 免费账号每天 100,000 次请求，对个人使用完全够用

---

## 下一步

部署完成后，回到插件测试扫码登录功能！
