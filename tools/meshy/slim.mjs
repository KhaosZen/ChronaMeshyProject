// 去掉法线贴图（远景看不出来），底色贴图转成 JPEG
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { prune } from '@gltf-transform/functions'; import sharp from 'sharp';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  for (const m of doc.getRoot().listMaterials()) { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); }
  await doc.transform(prune());
  for (const t of doc.getRoot().listTextures()) { const jpg = await sharp(Buffer.from(t.getImage())).jpeg({ quality: 82 }).toBuffer(); t.setImage(new Uint8Array(jpg)).setMimeType('image/jpeg'); }
  await io.write(f, doc); console.log(f);
}
