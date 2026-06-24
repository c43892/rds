// 把 tips-fix.json(key -> {lang:text}) 合并进 multilanguage.json 的 tips(只覆盖提供的语言键),
// 同步镜像。用于补齐 EN 占位垃圾 + JA/KO/FR/DE/ES/RU,并新增精英提示 tips。
import fs from 'fs';
const F='../client/resource/config/multilanguage.json';
const MIRROR='public/resource/config/multilanguage.json';
const fix=JSON.parse(fs.readFileSync('tips-fix.json','utf8'));
const cfg=JSON.parse(fs.readFileSync(F,'utf8'));
let added=0, patched=0;
for(const k in fix){
  if(cfg.tips[k]==undefined){ cfg.tips[k]={}; added++; }
  else patched++;
  for(const L in fix[k]) cfg.tips[k][L]=fix[k][L];
}
fs.writeFileSync(F, JSON.stringify(cfg,null,'\t'));
fs.writeFileSync(MIRROR, JSON.stringify(cfg,null,'\t'));
console.log('tips patched:',patched,'added:',added);
