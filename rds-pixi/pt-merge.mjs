import fs from 'fs';
const src=JSON.parse(fs.readFileSync('pt-src.json','utf8'));
const dict={};
for(let i=0;i<12;i++){
  const f='pt-tr/chunk'+i+'.json';
  if(!fs.existsSync(f)){ console.error('MISSING',f); continue; }
  const c=JSON.parse(fs.readFileSync(f,'utf8'));
  for(const k in c) dict[k]=c[k];
}
const missing=src.filter(s=>dict[s]==null);
fs.writeFileSync('pt-dict.json', JSON.stringify(dict,null,0));
console.log('dict entries:',Object.keys(dict).length,'/ src',src.length,'| missing:',missing.length);
if(missing.length) missing.slice(0,20).forEach(s=>console.log('  MISS:',JSON.stringify(s.slice(0,60))));
