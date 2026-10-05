#!/usr/bin/env node
// 打包成 Chrona 可上传的 ZIP：dist/root.zip
//   npm install && npm run pack
// ZIP 根目录：index.html + assets/ + vendor/three（本地化 Three.js，不依赖 CDN）
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THREE = path.join(ROOT, 'node_modules/three');
const OUT = path.join(ROOT, 'dist/root');
const ZIP = path.join(ROOT, 'dist/root.zip');

if (!fs.existsSync(THREE)) { console.error('先运行 npm install'); process.exit(1); }
const threeVer = JSON.parse(fs.readFileSync(path.join(THREE, 'package.json'), 'utf8')).version;

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const cdn = html.match(/cdn\.jsdelivr\.net\/npm\/three@([\d.]+)\//);
if (!cdn) { console.error('index.html 里找不到 three 的 CDN 地址'); process.exit(1); }
if (cdn[1] !== threeVer) console.warn(`⚠ index.html 用 three@${cdn[1]}，node_modules 是 ${threeVer}`);
html = html
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@[\d.]+\/build\/three\.module\.js/, './vendor/three/build/three.module.min.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@[\d.]+\/examples\/jsm\//, './vendor/three/examples/jsm/');

fs.rmSync(path.join(ROOT, 'dist'), { recursive: true, force: true });
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const f of ['build/three.module.min.js', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/utils/BufferGeometryUtils.js'])
  copy(path.join(THREE, f), path.join(OUT, 'vendor/three', f));
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true, filter: f => !path.basename(f).startsWith('.') });

execFileSync('zip', ['-qr', ZIP, '.'], { cwd: OUT });
console.log(`✓ ${path.relative(ROOT, ZIP)}  ${(fs.statSync(ZIP).size / 1024 / 1024).toFixed(2)} MiB`);
