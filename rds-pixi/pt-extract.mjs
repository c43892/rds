import fs from 'fs';
const CFG='../client/resource/config/';
const set=new Set();
function addLeaves(o){ if(typeof o==='string'){ if(o.trim()) set.add(o); } else if(o&&typeof o==='object'){ for(const k in o) addLeaves(o[k]); } }
// elemdesc + story configs: whole EN section
for(const f of ['elemdesc','occUnlockDesc','achvDesc','worldmapeventsels']){
  const j=JSON.parse(fs.readFileSync(CFG+f+'.json','utf8'));
  addLeaves(j.EN||{});
}
// multilanguage: tips.EN, occupations.*.name/desc.EN, views.*.text.*.EN, levelDifficultyDesc.EN
const ml=JSON.parse(fs.readFileSync(CFG+'multilanguage.json','utf8'));
for(const k in ml.tips){ const v=ml.tips[k]; if(v&&v.EN!=null) set.add(v.EN); }
for(const o in (ml.occupations||{})){ const oc=ml.occupations[o]; ['name','desc'].forEach(fld=>{ if(oc[fld]&&oc[fld].EN!=null) set.add(oc[fld].EN); }); }
for(const vn in (ml.views||{})){ const v=ml.views[vn]; if(v&&v.text) for(const t in v.text){ const e=v.text[t]; if(e&&e.EN!=null) set.add(e.EN); } }
if(ml.levelDifficultyDesc&&ml.levelDifficultyDesc.EN) (ml.levelDifficultyDesc.EN||[]).forEach(s=>{ if(s&&s.trim()) set.add(s); });
// achvAwardCfg desc.EN
const aw=JSON.parse(fs.readFileSync(CFG+'achvAwardCfg.json','utf8'));
for(const k in aw){ const d=aw[k].desc; if(d&&typeof d==='object'&&d.EN) set.add(d.EN); }
const arr=[...set].filter(s=>/[A-Za-z]/.test(s)); // must contain latin letters (skip pure-number/placeholder/symbol)
arr.sort((a,b)=> b.length-a.length || (a<b?-1:1));
fs.writeFileSync('pt-src.json', JSON.stringify(arr,null,0));
console.log('unique EN strings needing PT:', arr.length, ' (skipped', set.size-arr.length,'pure-symbol/number)');
// chunk sizes
const N=12, per=Math.ceil(arr.length/N);
console.log('chunks of', per, ':', N);
