# 资产清单（Meshy → GLB）

放到 `assets/`，在 `index.html` 的 `ASSETS` 填入文件名。

**约定**：模块宽度沿 X，正面朝 +Z，底面在 y=0。载入后会按 `size` 拉伸并把底面中心对齐到原点，所以 Meshy 导出的尺寸和原点不用很准。
**风格**：Low poly，哑光，低饱和；避免高细节贴图（代码会强制 roughness=1、去掉法线/金属度贴图）。

| key | 建议文件名 | 内容 | size (m) |
|---|---|---|---|
| wall | wall_segment.glb | 走廊墙段 | 2 × 3 × 0.2 |
| wallDoor | wall_door_closed.glb | 墙段＋门框（关） | 2 × 3 × 0.2 |
| wallWindow | wall_window.glb | 墙段＋窗框（中间是洞） | 2 × 3 × 0.2 |
| floor | floor_tile.glb | 地板块 | 2 × 0.1 × 2 |
| ceiling | ceiling_tile.glb | 天花板段 | 2 × 0.1 × 2 |
| stairs | stairs_flight.glb | 一整跑楼梯，向 -Z 上升 | 3.2 × 3 × 6 |
| railing | railing.glb | 扶手段 | 2 × 1 × 0.1 |
| trunk | tree_trunk.glb | 主干段 | 1 × 7 × 1 |
| rootMass | tree_root_mass.glb | 根团（堵门用） | 1.2 × 1.6 × 0.6 |
| moss | moss_patch.glb | 苔藓地面 | 1.2 × 0.03 × 1.2 |
| chair | chair_old.glb | 旧椅子 | 0.5 × 0.95 × 0.5 |
| cup | cup.glb | 杯子（倒扣摆放） | 0.12 × 0.1 × 0.1 |
| frame | photo_frame_empty.glb | 空相框 | 0.36 × 0.46 × 0.03 |
| letter | letter_folded.glb | 折叠的信 | 0.2 × 0.04 × 0.14 |
| key | key.glb | 钥匙 | 0.12 × 0.02 × 0.04 |
| pot | flower_pot_empty.glb | 空花盆 | 0.26 × 0.24 × 0.26 |
| lamp | pendant_lamp.glb | 吊灯（灯泡用 emissive 材质，代码控制亮灭） | 0.5 × 1 × 0.5 |
| curtain | curtain_torn.glb | 残破窗帘 | 0.7 × 1.4 × 0.02 |
| crack | floor_crack.glb | 地板裂缝 | 1.2 × 0.01 × 0.4 |

待补：树根段、树枝段、树冠块、门框（开）——二楼以后用。目前蔓延的细根是程序生成的锥形管，便于逐轮"生长"。

碰撞和行走面用的是不可见的代理几何体，不依赖 GLB 网格，所以 Meshy 模型形状不规整也不影响行走。
