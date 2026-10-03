#!/usr/bin/env node
// Meshy 批量生成 → assets/*.glb（贴图自动压到 512px）
//
//   node tools/meshy/generate.mjs                    生成所有缺失的资产
//   node tools/meshy/generate.mjs --only lamp,radio  只生成指定 key
//   node tools/meshy/generate.mjs --force            已存在也重新生成
//   node tools/meshy/generate.mjs --dry-run          只打印计划，不调用 API
//
// assets.json 里每条资产二选一：
//   "image": "refs/lamp.png"  → Image-to-3D（从概念图裁出来的参考图，造型和配色跟概念图一致）
//   "prompt": "…"             → Text-to-3D（preview + refine）
// 认证：云环境里由代理自动给 api.meshy.ai 加认证头（环境设置 → API credentials）；本地运行时设 MESHY_API_KEY。
// 任务 id 记在 tools/meshy/tasks.json，中断后重跑会接着轮询，不会重复扣费。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const API = 'https://api.meshy.ai/openapi';
const TASKS = path.join(HERE, 'tasks.json');
const CONCURRENCY = 4;
const GT = path.join(ROOT, 'node_modules/.bin/gltf-transform');

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const oi = args.indexOf('--only');
const only = oi >= 0 ? (args[oi + 1] || '').split(',').filter(Boolean) : [];
const DRY = flag('--dry-run'), FORCE = flag('--force');

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'assets.json'), 'utf8'));
const tasks = fs.existsSync(TASKS) ? JSON.parse(fs.readFileSync(TASKS, 'utf8')) : {};
const saveTasks = () => fs.writeFileSync(TASKS, JSON.stringify(tasks, null, 2) + '\n');
const KEY = process.env.MESHY_API_KEY; // 可选：没设时依赖代理注入

async function api(method, url, body) {
  const res = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', ...(KEY && { Authorization: `Bearer ${KEY}` }) },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  if (res.status === 401) throw new Error('401 未认证：检查 api.meshy.ai 的 API credentials，或设置 MESHY_API_KEY');
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${text}`);
  return JSON.parse(text);
}

async function poll(url, label) {
  for (;;) {
    const t = await api('GET', url);
    if (t.status === 'SUCCEEDED') return t;
    if (['FAILED', 'CANCELED', 'EXPIRED'].includes(t.status)) throw new Error(`${label} ${t.status}: ${t.task_error?.message || ''}`);
    await new Promise(r => setTimeout(r, 10000));
  }
}

async function generate(a) {
  const rec = tasks[a.key] ||= {};
  const poly = a.target_polycount ?? cfg.defaults.target_polycount;
  let done;
  if (a.image) {
    if (!rec.image) {
      const img = 'data:image/png;base64,' + fs.readFileSync(path.join(HERE, a.image)).toString('base64');
      rec.image = (await api('POST', `${API}/v1/image-to-3d`, {
        image_url: img, topology: 'triangle', target_polycount: poly, should_remesh: true, should_texture: true, enable_pbr: false,
      })).result;
      saveTasks();
    }
    done = await poll(`${API}/v1/image-to-3d/${rec.image}`, `${a.key}/image`);
  } else {
    const prompt = `${a.prompt}, ${cfg.style}`.slice(0, 600);
    if (!rec.preview) {
      rec.preview = (await api('POST', `${API}/v2/text-to-3d`, {
        mode: 'preview', prompt, art_style: 'realistic', topology: 'triangle', should_remesh: true, target_polycount: poly,
      })).result;
      saveTasks();
    }
    await poll(`${API}/v2/text-to-3d/${rec.preview}`, `${a.key}/preview`);
    if (!rec.refine) {
      rec.refine = (await api('POST', `${API}/v2/text-to-3d`, { mode: 'refine', preview_task_id: rec.preview, enable_pbr: false })).result;
      saveTasks();
    }
    done = await poll(`${API}/v2/text-to-3d/${rec.refine}`, `${a.key}/refine`);
  }
  const url = done.model_urls?.glb;
  if (!url) throw new Error(`${a.key}: 结果里没有 glb`);
  const raw = path.join(HERE, '.raw', `${a.key}.glb`), out = path.join(ROOT, 'assets', `${a.key}.glb`);
  fs.mkdirSync(path.dirname(raw), { recursive: true });
  fs.writeFileSync(raw, Buffer.from(await (await fetch(url)).arrayBuffer()));
  const size = String(a.texture ?? 512);
  execFileSync(GT, ['resize', raw, out, '--width', size, '--height', size], { stdio: 'ignore' });
  rec.done = true; saveTasks();
  console.log(`✓ ${a.key} → assets/${a.key}.glb (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
}

const todo = cfg.assets.filter(a => (!only.length || only.includes(a.key)) &&
  (FORCE || !fs.existsSync(path.join(ROOT, 'assets', `${a.key}.glb`))));
if (FORCE) for (const a of todo) delete tasks[a.key];
console.log(`${todo.length} 个资产待生成：${todo.map(a => a.key).join(', ')}`);
if (DRY || !todo.length) process.exit(0);

const failed = [];
const queue = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let a; (a = queue.shift());) {
    try { await generate(a); } catch (e) { failed.push(a.key); console.error(`✗ ${a.key}: ${e.message}`); }
  }
}));
console.log(`\n完成 ${todo.length - failed.length}，失败 ${failed.length}${failed.length ? '：' + failed.join(', ') : ''}`);
process.exit(failed.length ? 1 : 0);
