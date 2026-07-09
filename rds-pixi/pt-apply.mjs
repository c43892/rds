import fs from 'fs';
const CFG='../client/resource/config/';
const MIR='public/resource/config/';
const dict=JSON.parse(fs.readFileSync('pt-dict.json','utf8'));

// 补全 5 条难度详情面板(按固定子短语替换 EN -> PT,保留 <font> 标签/数字/换行)
function diffPT(s){
  const rep=[
    [/<font color=#7d0403 size=25>Easy<\/font>/,'<font color=#7d0403 size=25>Fácil</font>'],
    [/<font color=#7d0403 size=25>Normal<\/font>/,'<font color=#7d0403 size=25>Normal</font>'],
    [/<font color=#7d0403 size=25>Hard<\/font>/,'<font color=#7d0403 size=25>Difícil</font>'],
    [/<font color=#7d0403 size=25>Nightmare<\/font>/,'<font color=#7d0403 size=25>Pesadelo</font>'],
    [/<font color=#7d0403 size=25>Hell<\/font>/,'<font color=#7d0403 size=25>Inferno</font>'],
    [/Initial grids:/g,'Casas iniciais:'],
    [/Monster stats:/g,'Atributos dos monstros:'],
    [/Coins gained:/g,'Moedas ganhas:'],
    [/Initial HP:/g,'HP inicial:'],
    [/Death’s steps:/g,'Passos da Morte:'],
    [/Difficulty factor:/g,'Fator de dificuldade:'],
    [/Endless mode/g,'Modo infinito'],
    [/(\d+) worlds/g,'$1 mundos'],
    [/(\d+) world\b/g,'$1 mundo'],
  ];
  let r=s; for(const [a,b] of rep) r=r.replace(a,b); return r;
}
const T=s=> dict[s]!==undefined ? dict[s] : s;

// deep-clone EN 段并按字典替换每个字符串叶
function cloneTr(o){ if(typeof o==='string') return T(o);
  if(Array.isArray(o)) return o.map(cloneTr);
  if(o&&typeof o==='object'){ const r={}; for(const k in o) r[k]=cloneTr(o[k]); return r; } return o; }

let miss=new Set();
const T2=s=>{ if(typeof s==='string'&&dict[s]===undefined&&/[A-Za-z]/.test(s)) miss.add(s); return T(s); };
function cloneTr2(o){ if(typeof o==='string') return T2(o); if(Array.isArray(o)) return o.map(cloneTr2); if(o&&typeof o==='object'){const r={};for(const k in o)r[k]=cloneTr2(o[k]);return r;} return o; }

function rw(name, fn){ const j=JSON.parse(fs.readFileSync(CFG+name,'utf8')); fn(j); const out=JSON.stringify(j,null,'\t'); fs.writeFileSync(CFG+name,out); fs.writeFileSync(MIR+name,out); }

// 1) elemdesc + 3 故事配置:PT = 克隆 EN 段翻译
for(const f of ['elemdesc.json','occUnlockDesc.json','achvDesc.json','worldmapeventsels.json']){
  rw(f, j=>{ if(!j.EN){console.log('NO EN in',f);return;} j.PT=cloneTr2(j.EN); });
}
// 2) multilanguage: validLanguages + tips/occupations/views/levelDifficultyDesc PT
rw('multilanguage.json', ml=>{
  if(ml.validLanguages.indexOf('PT')<0) ml.validLanguages.push('PT');
  for(const k in ml.tips){ const v=ml.tips[k]; if(v&&v.EN!=null&&v.PT===undefined) v.PT=T2(v.EN); }
  for(const o in (ml.occupations||{})){ const oc=ml.occupations[o]; ['name','desc'].forEach(fld=>{ if(oc[fld]&&oc[fld].EN!=null&&oc[fld].PT===undefined) oc[fld].PT=T2(oc[fld].EN); }); }
  for(const vn in (ml.views||{})){ const v=ml.views[vn]; if(v&&v.text) for(const t in v.text){ const e=v.text[t]; if(e&&e.EN!=null&&e.PT===undefined) e.PT=T2(e.EN); } }
  if(ml.levelDifficultyDesc&&ml.levelDifficultyDesc.EN&&!ml.levelDifficultyDesc.PT)
    ml.levelDifficultyDesc.PT = ml.levelDifficultyDesc.EN.map(diffPT);
});
// 3) achvAwardCfg desc PT
rw('achvAwardCfg.json', j=>{ for(const k in j){ const d=j[k].desc; if(d&&typeof d==='object'&&d.EN&&d.PT===undefined) d.PT=T2(d.EN); } });

console.log('PT applied. untranslated leaves fell back to EN:', miss.size);
[...miss].slice(0,15).forEach(s=>console.log('  fb:',JSON.stringify(s.slice(0,60))));
