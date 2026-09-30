#!/usr/bin/env node
// Meshy Text-to-3D 批量生成 → assets/*.glb，并把文件名写回 index.html 的 ASSETS。
//
//   node tools/meshy/generate.mjs                                生成所有缺失的资产
//   node tools/meshy/generate.mjs --only chair,cup               只生成指定 key
//   node tools/meshy/generate.mjs --force                        已存在也重新生成
//   node tools/meshy/generate.mjs --no-texture                   只做 preview（无贴图，省 credits）
//   node tools/meshy/generate.mjs --dry-run                      只打印计划，不调用 API
//
// 认证：云环境里由代理自动给 api.meshy.ai 加认证头（环境设置 → API credentials）；
// 本地运行时设 MESHY_API_KEY 环境变量即可。
// 任务 id 记在 tools/meshy/tasks.json，中断后重跑会接着轮询，不会重复扣费。
// API 参考：https://docs.meshy.ai/en/api/text-to-3d
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Node 的 fetch 默认不走 HTTPS_PROXY，代理注入的认证头就拿不到：带上 NODE_USE_ENV_PROXY 重启自己
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], {
    stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(r.status ?? 1);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const API = 'https://api.meshy.ai/openapi/v2/text-to-3d';
const TASKS = path.join(HERE, 'tasks.json');
const CONCURRENCY = 3;

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const oi = args.indexOf('--only');
const only = oi >= 0 ? (args[oi + 1] || '').split(',').filter(Boolean) : [];
const DRY = flag('--dry-run'), FORCE = flag('--force'), TEXTURE = !flag('--no-texture');

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
  if (res.status === 401) throw new Error('401 未认证：检查环境设置里 api.meshy.ai 的 API credentials（需新会话生效），或设置 MESHY_API_KEY');
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${text}`);
  return JSON.parse(text);
}

async function poll(id, label) {
  for (;;) {
    const t = await api('GET', `${API}/${id}`);
    if (t.status === 'SUCCEEDED') return t;
    if (t.status === 'FAILED' || t.status === 'CANCELED' || t.status === 'EXPIRED')
      throw new Error(`${label} ${t.status}: ${t.task_error?.message || ''}`);
    process.stdout.write(`  ${label} ${t.status} ${t.progress ?? 0}%\r`);
    await new Promise(r => setTimeout(r, 8000));
  }
}

async function generate(a) {
  const rec = tasks[a.key] ||= {};
  const prompt = `${a.prompt}, ${cfg.style}`.slice(0, 600);
  if (!rec.preview) {
    rec.preview = (await api('POST', API, {
      mode: 'preview', prompt, art_style: 'realistic', topology: 'triangle', should_remesh: true,
      target_polycount: a.target_polycount ?? cfg.defaults.target_polycount,
    })).result;
    saveTasks();
  }
  let done = await poll(rec.preview, `${a.key}/preview`);
  if (TEXTURE) {
    if (!rec.refine) {
      rec.refine = (await api('POST', API, { mode: 'refine', preview_task_id: rec.preview, enable_pbr: false })).result;
      saveTasks();
    }
    done = await poll(rec.refine, `${a.key}/refine`);
  }
  const url = done.model_urls?.glb;
  if (!url) throw new Error(`${a.key}: 结果里没有 glb`);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(path.join(ROOT, 'assets', a.file), buf);
  rec.done = true; saveTasks();
  console.log(`✓ ${a.key} → assets/${a.file} (${(buf.length / 1024).toFixed(0)} KB)`);
  return a;
}

// 把生成好的文件名填进 index.html 的 ASSETS
function patchHtml(done) {
  const p = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(p, 'utf8');
  for (const a of done) html = html.replace(new RegExp(`(\\n\\s*${a.key}:\\s*\\{ file: )(null|'[^']*')`), `$1'${a.file}'`);
  fs.writeFileSync(p, html);
}

const todo = cfg.assets.filter(a => (!only.length || only.includes(a.key)) &&
  (FORCE || !fs.existsSync(path.join(ROOT, 'assets', a.file))));
if (FORCE) for (const a of todo) delete tasks[a.key];
console.log(`${todo.length} 个资产待生成（${TEXTURE ? 'preview + refine 贴图' : '仅 preview'}）：${todo.map(a => a.key).join(', ')}`);
if (DRY || !todo.length) process.exit(0);

const done = [], failed = [];
const queue = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let a; (a = queue.shift());) {
    try { done.push(await generate(a)); } catch (e) { failed.push(a.key); console.error(`✗ ${a.key}: ${e.message}`); }
  }
}));
patchHtml(done);
console.log(`\n完成 ${done.length}，失败 ${failed.length}${failed.length ? '：' + failed.join(', ') : ''}`);
process.exit(failed.length ? 1 : 0);
