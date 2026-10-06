#!/usr/bin/env python3
# 远景立牌：把远景建筑概念图（tools/meshy/refs/city*.png）抠掉灰底、在水线处截断，存成 assets/tex/bb_*.png
import sys, os
from collections import deque
import numpy as np
from PIL import Image, ImageFilter
H0 = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(H0))
for n in ['cityRow', 'cityFlat', 'cityChurch', 'cityWarehouse', 'cityTower', 'cityBridge']:
    im = Image.open(f'{ROOT}/tools/meshy/refs/{n}.png').convert('RGB'); a = np.asarray(im).astype(int); H, W, _ = a.shape
    bg = np.median(np.concatenate([a[:8].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)]), axis=0)
    near = np.abs(a - bg).sum(2) < 36
    mask = np.zeros((H, W), bool); q = deque([(y, x) for x in range(W) for y in (0, H - 1)] + [(y, x) for y in range(H) for x in (0, W - 1)])
    while q:   # 从四边泛洪：和背景色接近、且和边缘连通的才算背景
        y, x = q.popleft()
        if mask[y, x] or not near[y, x]: continue
        mask[y, x] = True
        q.extend(p for p in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)) if 0 <= p[0] < H and 0 <= p[1] < W)
    water = (a[:, :, 2] > a[:, :, 0] + 15) & (a[:, :, 1] > a[:, :, 0] + 5) & ~mask
    cols = (~mask).sum(1); wl = H
    for y in range(int(H * 0.5), H):   # 水线：下半部分里偏蓝绿的水占满一行的最高那一行
        if cols[y] > 20 and water[y].sum() > 0.55 * cols[y]: wl = y; break
    alpha = np.where(mask, 0, 255).astype(np.uint8); alpha[wl + 4:] = 0
    A = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.0))
    out = im.convert('RGBA'); out.putalpha(A); out = out.crop(Image.fromarray((np.asarray(A) > 8).astype(np.uint8) * 255).getbbox())
    s = 512 / max(out.size); out = out.resize((round(out.width * s), round(out.height * s)), Image.LANCZOS)
    out.save(f'{ROOT}/assets/tex/bb_{n}.png', optimize=True); print(n, 'waterline', wl, out.size)
