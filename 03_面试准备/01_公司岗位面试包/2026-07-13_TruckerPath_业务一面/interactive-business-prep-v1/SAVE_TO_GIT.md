# Trucker Path 业务一面互动练习器：保存到 Git 的使用方式

## 正确启动方式

在本目录运行：

```powershell
node server.js
```

然后打开：

```text
http://127.0.0.1:8787/
```

不要再用 `python -m http.server` 启动。静态服务器只能让网页打开，不能把浏览器里的修改写回仓库文件。

## 保存会写入哪些文件

点击「保存本题修改」或等待自动保存后，会同时更新：

- `saved-edits.json`：机器可读，页面启动时会自动加载。
- `saved-edits.md`：人可读，方便检查 Git diff。

这两个文件都在当前目录，可以随 Git 一起提交和推送到 GitHub。换电脑后，拉取仓库并用 `node server.js` 启动，页面会从 `saved-edits.json` 读取保存过的修改。


## 手机复习版

电脑关闭后，`http://127.0.0.1:8787/` 不能继续访问。需要先把仓库推送到 GitHub，并用 GitHub Pages 发布静态页面。

推荐手机入口：

```text
https://peixuanl.github.io/Resume/docs/面试/TruckerPath_业务一面准备_2026-07-13/interactive-business-prep-v1/
```

如果 GitHub Pages 选择的是仓库根目录发布，也可以使用：

```text
https://peixuanl.github.io/Resume/docs/面试/TruckerPath_业务一面准备_2026-07-13/interactive-business-prep-v1/
```

手机复习版适合看题、背句式、集中复习；它不能直接把修改写回仓库文件。需要保存修改时，仍然回到电脑端用 `node server.js` 启动后编辑，保存到 `saved-edits.json` / `saved-edits.md`，再 commit 和 push。
## 推送前检查

```powershell
git status --short -- docs/面试/TruckerPath_业务一面准备_2026-07-13/interactive-business-prep-v1
```

至少确认这些文件被跟踪或已修改：

```text
saved-edits.json
saved-edits.md
```
