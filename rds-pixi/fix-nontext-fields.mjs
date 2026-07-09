import fs from 'fs';
const CFG='../client/resource/config/';
const MIR='public/resource/config/';
const LANGS=['CNT','EN','FR','DE','ES','RU','JA','KO','PT'];
let fixed=0;
function fix(cns, en, tgt){
  if(cns && typeof cns==='object'){
    for(const k in cns){
      if(tgt==null || typeof tgt!=='object' || !(k in tgt)) continue;
      const c=cns[k], e=en&&en[k], t=tgt[k];
      if(typeof c==='string'){ if(c===e && t!==c){ tgt[k]=c; fixed++; } }
      else if(c && typeof c==='object'){ fix(c, e, t); }
    }
  }
}
for(const f of ['elemdesc.json','occUnlockDesc.json','achvDesc.json','worldmapeventsels.json']){
  const j=JSON.parse(fs.readFileSync(CFG+f,'utf8'));
  const cns=j.CNS, en=j.EN;
  if(!cns||!en){ console.log(f,'skip'); continue; }
  const before=fixed;
  for(const L of LANGS){ if(j[L]) fix(cns, en, j[L]); }
  const n=fixed-before;
  if(n>0){ const out=JSON.stringify(j,null,'\t'); fs.writeFileSync(CFG+f,out); fs.writeFileSync(MIR+f,out); }
  console.log(f.padEnd(24),'还原:',n);
}
console.log('总计还原:',fixed);
