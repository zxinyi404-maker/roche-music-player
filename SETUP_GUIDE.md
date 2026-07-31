# 🎵 Roche 音乐播放器 - 扫码登录完整指南

## 📌 快速开始（3 步完成）

### ✅ 第 1 步：部署 Cloudflare Worker

**访问：** https://dash.cloudflare.com/

1. 左侧菜单 → "Workers & Pages"
2. "Create application" → "Create Worker"
3. 名称：`roche-netease-api`
4. "Deploy" → "Quick edit"
5. 复制粘贴 `worker/netease-proxy.js` 的全部代码
6. "Save and Deploy"
7. **复制你的 Worker URL**（例如：`https://roche-netease-api.你的账号.workers.dev`）

### ✅ 第 2 步：配置插件

**编辑 `music-player.js` 第 42 行：**

```javascript
backend: 'https://你的worker地址.workers.dev',
```

替换为你刚才复制的 Worker URL

### ✅ 第 3 步：发布新版本

```bash
cd ~/roche-music-player-fork

# 更新版本号
# 编辑 manifest.json，将 version 改为 1.17.1
# 编辑 manifest.json，将 entry URL 改为 v1.17.1

# 提交并推送
git add .
git commit -m "配置自己的 Worker backend"
git push origin master
git tag v1.17.1
git push origin v1.17.1
```

### ✅ 第 4 步：测试扫码登录

等待 1-2 分钟 CDN 生效后：

1. 在 Roche 中加载插件：
   ```
   https://cdn.jsdelivr.net/gh/zxinyi404-maker/roche-music-player@v1.17.1/manifest.json
   ```

2. 打开音乐播放器
3. 点击"扫码登录"
4. 用网易云 APP 扫码

---

## 🔍 测试 Worker 是否正常

部署完成后，在浏览器控制台测试：

```javascript
// 测试获取二维码 key
fetch('https://你的worker地址.workers.dev/netease/login/qr/key', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}'
})
.then(r => r.json())
.then(data => console.log('✅ Worker 正常:', data))
.catch(err => console.error('❌ Worker 错误:', err));
```

**预期结果：**
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

## 🐛 常见问题

### Q1: Worker 部署后 404？
**A:** 等待 1-2 分钟让 Cloudflare 完全部署

### Q2: 扫码后没反应？
**A:** 
1. 打开浏览器控制台（F12）查看错误
2. 检查 Network 标签，看请求是否发送到你的 Worker
3. 确认 `music-player.js` 第 42 行的 backend 已更新

### Q3: Worker 返回 CORS 错误？
**A:** 检查 Worker 代码中的 CORS_HEADERS 是否正确

### Q4: 二维码显示失败？
**A:** 
- 检查 Worker 日志（Cloudflare Dashboard → Workers → 你的 Worker → Logs）
- 确认网易云 API 是否可访问

### Q5: 想在插件设置中配置 Worker？
**A:** 插件已支持在设置界面修改 backend，无需修改代码

---

## 📊 完整实现对比

| 功能 | 原版 Roche | SullyOS | 你的版本 |
|------|-----------|---------|---------|
| 扫码登录 | ❌ MCP 服务器 | ✅ 标准 API | ✅ 标准 API |
| 二维码 | 第三方生成 | base64 直出 | base64 直出 |
| 依赖 | 第三方服务 | 自己的 Worker | ✅ 自己的 Worker |
| Cookie | access_token | MUSIC_U | ✅ MUSIC_U |
| 稳定性 | 依赖外部 | ✅ 完全控制 | ✅ 完全控制 |

---

## 🎉 完成后的功能

- ✅ 扫码登录（标准网易云 API）
- ✅ base64 二维码直接显示
- ✅ 实时状态提示（等待扫码、已扫描、登录成功）
- ✅ 自动提取 MUSIC_U Cookie
- ✅ 完全不依赖第三方服务
- ✅ 与 SullyOS 实现一致

---

## 🚀 下一步优化

完成基础登录后，可以继续添加：
- 刷新二维码按钮
- 倒计时显示
- 用户信息显示
- 退出登录功能
- 同步用户歌单

需要帮忙实现吗？告诉我！
