# Chrona 平台待确认项（Day 1 晚）

上传测试版（`npm install && npm run pack` 生成的 `dist/root.zip`）后逐项确认，结果填在"结论"一栏。

平台上传说明原文：HTML 或 ZIP（含 index.html 和 assets），≤ 200 MiB；npm 项目需要 package-lock.json 和输出到 dist/ 的 build 脚本；**发布的世界是公开的**。

| # | 问题 | 结论 | 影响的代码 |
|---|---|---|---|
| 1 | GLB 怎么加载：外链 URL、平台资产库，还是必须 base64 内嵌？ | ✅ 上传 ZIP（index.html + assets），相对路径外链 | `ASSET_BASE`、`loadAssets()` |
| 2 | 单文件大小上限？GLB 总量上限？ | ✅ 整个上传 ≤ 200 MiB | 决定是否内嵌、模型面数预算 |
| 3 | 是否允许加载外部脚本（jsdelivr CDN）？ | 已绕开：`npm run pack` 把 three 打进 ZIP | 顶部 `importmap`；不允许就把 three 打包进 HTML |
| 4 | 页面是否跑在 iframe 里？是否允许 Pointer Lock？ | | 已做兜底：不允许时改为按住鼠标拖拽转视角 |
| 5 | 平台是否自带第一人称控制器？要不要用它的？ | | 第 9 节"第一人称控制" |
| 6 | 拾取 / 触发 / 对话 / 交给 NPC 的接口写法 | | 第 2 节 `Platform` 适配层 |
| 7 | 是否支持移动端？需要虚拟摇杆吗？ | | 目前只有键鼠 |
| 8 | 是否能存档（跨会话记住循环数和拾取过的道具）？ | | `state` |

## 当前的接入方式

所有平台相关的调用都走 `Platform.emit(evt, detail)`。目前只派发 `window` 事件 `root:<evt>`，`?debug` 下同时打印到控制台：

| 事件 | detail | 含义 |
|---|---|---|
| `ready` | — | 场景搭好 |
| `start` | `{ floor }` | 玩家点击进入 |
| `puzzles` | `{ floor, list }` | 本次循环抽到的谜题模板 |
| `pickup` | `{ id, floor }` | 拿到一把「钥匙」 |
| `wrong` | `{ floor }` | 交互错了（真假题拿了假的） |
| `room` | `{ floor, result }` | 进入过渡房间，result = success / hint / confused |
| `floor` | `{ floor }` | 上到新一层（5 = 天台） |
| `repeat` | `{ floor, repeat }` | 回到本层起点 |
| `end` | `{ seconds, puzzles, solved }` | 走进传送门 |

确认 Chrona API 后只需要改 `Platform` 对象；台词如果要走平台的对话接口，改 `say()`。
