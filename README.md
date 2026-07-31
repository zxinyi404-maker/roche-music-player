# Roche 音乐播放器

一个功能丰富的音乐播放器插件，支持网易云音乐。

## 功能特性

- 🎵 **网易云音乐支持** - 搜索、播放网易云音乐
- 🔐 **扫码登录** - 支持网易云扫码登录和 Cookie 登录
- 📱 **灵动岛设计** - 仿 iOS 灵动岛的播放控制界面
- 🎨 **精美 UI** - 现代化的界面设计
- 📝 **歌词显示** - 实时滚动歌词，支持翻译歌词
- 🎚️ **播放控制** - 支持列表循环、单曲循环、随机播放
- 💾 **本地存储** - 自动保存播放列表和用户设置

## 安装使用

1. 将此仓库克隆到本地
2. 在 Roche 插件管理器中加载 `manifest.json`
3. 插件会自动加载并显示灵动岛界面

## 文件说明

- `manifest.json` - 插件配置文件
- `music-player.js` - 主要逻辑文件

## 技术架构

### 扫码登录实现

使用网易云音乐开放平台 API：

```javascript
// 1. 获取二维码
GET /login/start
→ 返回 qr_url

// 2. 生成二维码图片
使用 https://api.qrserver.com/v1/create-qr-code/ 生成

// 3. 轮询检查登录状态
GET /login/check (每 2 秒)
→ code: 800 (过期) / 802 (已扫描) / 登录成功
```

### 后端服务

- **主后端**: `https://456.chajianreader.cc.cd` - Cloudflare Worker，音乐搜索和播放
- **MCP 后端**: `https://ncm.chajianreader.cc.cd` - 腾讯云，扫码登录和开放平台 API

## 开发说明

### 修改插件

1. 编辑 `music-player.js` 修改功能
2. 更新 `manifest.json` 中的版本号
3. 如果使用 CDN 分发，推送到 GitHub 后通过 jsDelivr 访问

### 版本发布

```bash
# 创建新版本标签
git tag v1.x.x
git push origin v1.x.x

# jsDelivr CDN 会自动缓存：
# https://cdn.jsdelivr.net/gh/你的用户名/roche-music-player@v1.x.x/music-player.js
```

## 原始来源

本项目基于 [luyi90720-sys/roche-music-player](https://github.com/luyi90720-sys/roche-music-player) v1.16.10

## 许可证

请查看原仓库的许可证信息。
