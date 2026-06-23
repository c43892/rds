// 从 3 个剧情配置的 CNS 段提取所有可翻译文本(去重),供翻译。
// 文本键：title/desc/shortDesc/longDesc;数组：progressInfos/progressInfoFinished;
// worldmapeventsels.desc 的所有值。
import fs from 'fs';
const CFG='../client/resource/config/';
const found=new Set();
const add=(s)=>{ if(typeof s==='string' && s.trim()!=='' && /[一-鿿]/.test(s)) found.add(s); };
// 通用:抓取任意含中文的字符串叶子(逻辑标识是 ASCII,不会被收录)
function walk(o){
  if(typeof o==='string'){ add(o); return; }
  if(Array.isArray(o)){ o.forEach(walk); return; }
  if(o && typeof o==='object') for(const k in o) walk(o[k]);
}
walk(JSON.parse(fs.readFileSync(CFG+'occUnlockDesc.json','utf8')).CNS);
walk(JSON.parse(fs.readFileSync(CFG+'achvDesc.json','utf8')).CNS);
walk(JSON.parse(fs.readFileSync(CFG+'worldmapeventsels.json','utf8')).CNS);

const list=[...found];
fs.writeFileSync('stories-cns.json', JSON.stringify(list,null,1));
console.log('唯一可翻译中文串:', list.length);
list.slice(0,40).forEach((s,i)=>console.log(i+': '+s.replace(/<[^>]+>/g,'').replace(/\r?\n/g,' ').slice(0,70)));
