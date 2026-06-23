// 把剧情翻译应用到 3 个配置:读取所有 stories-tr-*.json(整句映射 CNS->{lang}),
// 对每个配置把 CNS 段深拷贝到各目标语言,按文本字段规则替换叶子;未翻译叶子保持中文。
import fs from 'fs';
const CFG='../client/resource/config/';
const TARGET=['EN','FR','DE','ES','RU','JA','KO'];

// 合并所有翻译表
const map={};
for(const f of fs.readdirSync('.')){
  if(/^stories-tr-.*\.json$/.test(f)){
    const m=JSON.parse(fs.readFileSync(f,'utf8'));
    for(const k in m) map[k]=m[k];
  }
}
const tr=(s,lang)=> (typeof s==='string' && map[s] && map[s][lang]!=undefined) ? map[s][lang] : s;

const clone=(o)=>JSON.parse(JSON.stringify(o));
// 通用:替换任意在翻译表里的字符串叶子(逻辑 ASCII 串不在表中,不受影响)
function repl(o,lang){
  if(Array.isArray(o)){ for(let i=0;i<o.length;i++){ if(typeof o[i]==='string') o[i]=tr(o[i],lang); else repl(o[i],lang); } return; }
  if(o && typeof o==='object'){ for(const k in o){ if(typeof o[k]==='string') o[k]=tr(o[k],lang); else repl(o[k],lang); } }
}
let stats={};
function doFile(file){
  const path=CFG+file;
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  for(const lang of TARGET){ const cp=clone(c.CNS); repl(cp,lang); c[lang]=cp; }
  fs.writeFileSync(path, JSON.stringify(c,null,'\t'));
  // 统计:含中文叶子中已译比例
  let total=0,done=0; const re=/[一-鿿]/;
  const count=(o)=>{ if(typeof o==='string'){ if(re.test(o)){total++; if(map[o])done++;} } else if(Array.isArray(o))o.forEach(count); else if(o&&typeof o==='object') for(const k in o) count(o[k]); };
  count(c.CNS);
  stats[file]=done+'/'+total;
}
doFile('occUnlockDesc.json');
doFile('achvDesc.json');
doFile('worldmapeventsels.json');
console.log('翻译表条目:',Object.keys(map).length,'| 各配置已译/总文本叶子:',JSON.stringify(stats));
