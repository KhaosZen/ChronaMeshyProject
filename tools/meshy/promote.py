#!/usr/bin/env python3
# 把候选模型（如 lampHQ）转正为正式 key（lamp）：复制 glb、改 assets.json 的生成参数、移交 tasks.json 的任务 id
#   python3 tools/meshy/promote.py lampHQ:lamp photoHQ:photo …
import json, shutil, os, sys
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(H))
cfgp, tp = os.path.join(H, 'assets.json'), os.path.join(H, 'tasks.json')
c = json.load(open(cfgp)); t = json.load(open(tp)); by = {a['key']: a for a in c['assets']}
GEN = ('image', 'prompt', 'target_polycount', 'ai_model', 'texture', 'remesh', 'simplify', 'simplifyError')
for pair in sys.argv[1:]:
    cand, main = pair.split(':')
    cd = by[cand]; m = by.get(main)
    if m is None: m = {'key': main, 'note': cd.get('note', '')}; c['assets'].append(m)
    for k in GEN: m.pop(k, None)
    for k in GEN:
        if k in cd: m[k] = cd[k]
    shutil.copy(f'{ROOT}/assets/{cand}.glb', f'{ROOT}/assets/{main}.glb'); os.remove(f'{ROOT}/assets/{cand}.glb')
    if os.path.exists(f'{H}/.raw/{cand}.glb'): shutil.move(f'{H}/.raw/{cand}.glb', f'{H}/.raw/{main}.glb')
    if cand in t: t[main] = t.pop(cand)
    c['assets'] = [a for a in c['assets'] if a['key'] != cand]
    print('✓', cand, '→', main)
json.dump(c, open(cfgp, 'w'), ensure_ascii=False, indent=2)
open(tp, 'w').write(json.dumps(t, indent=2) + '\n')
