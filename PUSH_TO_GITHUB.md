# 推送到 GitHub 的步骤

## 1. 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 仓库名称建议：`roche-music-player` 或 `roche-music-player-fork`
3. 描述：Roche 音乐播放器 - 支持网易云音乐的灵动岛播放器插件
4. 选择 Public（公开）或 Private（私有）
5. **不要**勾选 "Add a README file"（我们已经有了）
6. **不要**选择 .gitignore 和 License（我们已经创建了）
7. 点击 "Create repository"

## 2. 推送本地仓库到 GitHub

在你的终端执行以下命令（将 YOUR_USERNAME 替换为你的 GitHub 用户名）：

```bash
cd ~/roche-music-player-fork

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/roche-music-player.git

# 推送到 GitHub
git push -u origin master
```

## 3. 创建版本标签（可选但推荐）

```bash
# 创建标签
git tag v1.16.10

# 推送标签
git push origin v1.16.10
```

## 4. 使用 jsDelivr CDN

推送后，你的插件可以通过 jsDelivr CDN 访问：

```
https://cdn.jsdelivr.net/gh/YOUR_USERNAME/roche-music-player@v1.16.10/music-player.js
```

然后更新 `manifest.json` 中的 `entry` 字段为上面的 URL。

## 5. 后续修改流程

```bash
# 修改文件后
git add .
git commit -m "描述你的修改"

# 如果要发布新版本
git tag v1.16.11
git push origin master
git push origin v1.16.11

# 更新 manifest.json 中的 version 和 entry URL
```

## 注意事项

- jsDelivr CDN 有缓存，新版本可能需要几分钟才能生效
- 使用 `@latest` 可以自动获取最新版本（但有缓存延迟）
- 使用具体版本号（如 `@v1.16.10`）可以确保稳定性

## 当前仓库位置

本地仓库位置：`C:\Users\32832\roche-music-player-fork`
