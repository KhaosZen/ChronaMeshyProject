# ROOT（工作名）— Meshy × Chrona 3D 世界创作赛参赛作品

一栋被树占据的楼，玩家在里面循环。每层楼要解开谜题才能上楼，否则永远留在同一层；每上一层，楼有细微变化，树又长了一点。碎片散落各处，永远拼不出完整答案。爬到树顶，循环停止。

- **截止**：2026-10-09 07:59（北京时间）
- **平台**：[Chrona.world](https://chrona.world)，上传单个 HTML 文件
- **参考**：P.T.（碎片、压迫感、不解释）＋ 8号出口（重复中的异常）＋ 长进楼里的树
- **风格**：Low poly，哑光，muted colors，无高细节贴图
- **技术**：Three.js（CDN）＋ 外链 GLB（Meshy API 生成）＋ 单 HTML

## 运行

```bash
python3 -m http.server 8000   # GLB 外链需要 http 访问，不能直接双击打开
# http://localhost:8000/        正常模式
# http://localhost:8000/?debug  调试：显示楼层/坐标/门状态，数字键 1-5 跳楼层
```

## 打包上传 Chrona

```bash
npm install
npm run pack        # → dist/root.zip（index.html + assets + 本地化的 three，不依赖 CDN）
```

Chrona 接受 HTML 或 ZIP，上限 200 MiB；发布的世界是公开的。

## 结构

```
index.html               全部游戏逻辑（按编号分节：配置 / 平台适配层 / 占位几何体 / 资产加载 / 物理 / 关卡 / 楼层系统 / 控制 / 交互）
assets/                  GLB 资产
tools/meshy/             Meshy API 批量生成脚本 + 提示词清单
tools/pack.mjs           打包 dist/root.zip
docs/assets.md           资产清单、尺寸、朝向约定
docs/chrona-checklist.md Chrona 平台待确认项与对应代码位置
```

## 楼层与循环

每一层都复用同一段"走廊＋楼梯间"（8号出口式），按楼层切换状态：

- **解开本层谜题**：楼梯顶的门打开，走进去就到下一层。
- **没解开**：走到楼梯顶就黑场，回到本层起点，并随机出现一处细微异常（椅子转向、窗帘换位、多出一条根）。
- **楼层号**：楼梯口左墙有号牌。

| 楼层 | 状态（原"循环 1-5"） | 树的融合 | 谜题 |
|---|---|---|---|
| 1 | 灯亮，路线畅通，道具散落 | 树根刚冒出来 | ✅ 倒扣的杯子下面藏着钥匙 → 用钥匙开门 |
| 2 | 一盏灯灭，一扇门被根堵住，字迹第 1 行 | 根缠绕扶手 | ✅ 把空花盆放进窗下的光斑 → 门开 |
| 3 | 窗外光傍晚→正午，捡过的道具原位长出新根，字迹第 2 行 | 树枝穿窗 | ⬜ 待设计（目前门直接能开） |
| 4 | 布局微变，灯全灭只剩窗外光，字迹第 3 行 | 同上＋更粗 | ⬜ 待设计（目前门直接能开） |
| 顶层 | 树冠穿透，爬主干到树顶，循环停止；捡过钥匙则树顶细节不同 | 半户外 | ⬜ 占位：走到楼梯顶直接结束 |

待定：墙上字迹文案、3/4 楼谜题、顶层场景、结局道具（暂定钥匙；目前一楼必须捡钥匙，所以结局分支总是成立，体验后再调）。

## Meshy 资产生成

```bash
node tools/meshy/generate.mjs --dry-run      # 看计划
node tools/meshy/generate.mjs --only chair    # 先试一个
node tools/meshy/generate.mjs                 # 生成全部缺失的
```

认证：云环境里在环境设置的 API credentials 为 `api.meshy.ai` 配 Bearer token，由代理自动加认证头；本地运行时设 `MESHY_API_KEY` 环境变量。

提示词在 `tools/meshy/assets.json`。GLB 下载到 `assets/`，并自动填进 `index.html` 的 `ASSETS`。任务 id 存在 `tools/meshy/tasks.json`，中断后重跑不会重复扣费。`--no-texture` 只生成无贴图的 preview，更省 credits。

## 进度

- [x] Day 1 基础场景：走廊＋楼梯＋第一人称移动
- [x] 楼层推进＋同层重复＋随机异常；1、2 楼简单谜题（拾取 / 使用道具 / 放置道具三种交互）
- [x] Meshy 批量生成脚本（未实跑，等 API key 和网络）
- [x] Chrona 上传方式：ZIP ≤ 200 MiB；打包脚本 `npm run pack`
- [ ] 上传测试版，确认 iframe / Pointer Lock、交互 API 等（见 `docs/chrona-checklist.md`）
- [ ] 按 Chrona API 调整平台适配层
- [ ] Meshy 生成资产并替换占位体
- [ ] 3、4 楼谜题，顶层树冠区，结局
- [ ] 墙上字迹文案
- [ ] 声音、性能优化（合批）
