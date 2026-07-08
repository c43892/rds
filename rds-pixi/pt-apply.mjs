import fs from 'fs';
const CFG='../client/resource/config/';
const MIR='public/resource/config/';
const dict=JSON.parse(fs.readFileSync('pt-dict.json','utf8'));
const map=s=> (typeof s==='string' && dict[s]!=null) ? dict[s] : s;
function cloneMap(o){ if(typeof o==='string') return map(o); if(Array.isArray(o)) return o.map(cloneMap); if(o&&typeof o==='object'){ const r={}; for(const k in o) r[k]=cloneMap(o[k]); return r; } return o; }
function writeBoth(name,obj){ const txt=JSON.stringify(obj,null,'\t'); fs.writeFileSync(CFG+name,txt); fs.writeFileSync(MIR+name,txt); }

// 1) elemdesc + story configs: PT = mapped clone of EN
for(const f of ['elemdesc','occUnlockDesc','achvDesc','worldmapeventsels']){
  const j=JSON.parse(fs.readFileSync(CFG+f+'.json','utf8'));
  j.PT=cloneMap(j.EN||{});
  writeBoth(f+'.json', j);
}
// 2) multilanguage: tips/occupations/views/levelDifficultyDesc + validLanguages
const ml=JSON.parse(fs.readFileSync(CFG+'multilanguage.json','utf8'));
for(const k in ml.tips){ const v=ml.tips[k]; if(v&&v.EN!=null) v.PT = Array.isArray(v.EN) ? v.EN.map(map) : map(v.EN); }
for(const o in (ml.occupations||{})){ const oc=ml.occupations[o]; ['name','desc'].forEach(fld=>{ if(oc[fld]&&oc[fld].EN!=null) oc[fld].PT=map(oc[fld].EN); }); }
for(const vn in (ml.views||{})){ const v=ml.views[vn]; if(v&&v.text) for(const t in v.text){ const e=v.text[t]; if(e&&e.EN!=null) e.PT=map(e.EN); } }
if(ml.levelDifficultyDesc&&ml.levelDifficultyDesc.EN) ml.levelDifficultyDesc.PT=ml.levelDifficultyDesc.EN.map(map);
if(ml.validLanguages && ml.validLanguages.indexOf('PT')<0) ml.validLanguages.push('PT');
writeBoth('multilanguage.json', ml);
// 3) achvAwardCfg desc.PT
const aw=JSON.parse(fs.readFileSync(CFG+'achvAwardCfg.json','utf8'));
for(const k in aw){ const d=aw[k].desc; if(d&&typeof d==='object'&&d.EN) d.PT=map(d.EN); }
writeBoth('achvAwardCfg.json', aw);
console.log('applied PT to elemdesc/occUnlockDesc/achvDesc/worldmapeventsels/multilanguage/achvAwardCfg; validLanguages ->', ml.validLanguages.join(','));
