// 重建 elemdesc 各语言的 useDescArr(消耗品"使用说明"),并补全孤儿键 Hawkeye。
// 行级重建:每行折叠为单个 <font color=原色 size=原size>译文</font>,占位符内联保留。CNS/CNT 不动。
import fs from 'fs';
const F='../client/resource/config/elemdesc.json';
const MIRROR='public/resource/config/elemdesc.json';
const LANGS=['EN','FR','DE','ES','RU','JA','KO'];

const d=JSON.parse(fs.readFileSync(F,'utf8'));
const cns=d.CNS;
// 文本 -> {lang:译文}  来源:已译 desc 行 + 新 uda 行
const TR=JSON.parse(fs.readFileSync('desc-lines-tr.json','utf8'));
const udaNew=JSON.parse(fs.readFileSync('uda-new.json','utf8'));
const udaNewTr=JSON.parse(fs.readFileSync('uda-new-tr.json','utf8'));
udaNew.forEach((t,i)=>{ TR[t]=udaNewTr[i]; });

function plain(line){ return line.replace(/<\/?font[^>]*>/g,'').replace(/\s+/g,' ').trim(); }
function lineColor(line){ const m=line.match(/<font[^>]*color=(#[0-9a-fA-F]{6})/); return m?m[1]:'#e4d5a5'; }
function lineSize(line){ const m=line.match(/<font[^>]*size=(\d+)/); return m?m[1]:'25'; }

const udaKeys=Object.keys(cns).filter(k=>Array.isArray(cns[k].useDescArr)&&cns[k].useDescArr.length);
let miss=new Set(), rebuilt=0;
for(const L of LANGS){
  for(const k of udaKeys){
    if(d[L][k]==undefined) d[L][k]={};
    const src=cns[k].useDescArr;
    d[L][k].useDescArr = src.map(entry=>entry.split(/\n/).map(line=>{
      const p=plain(line); if(!p) return line;
      const color=lineColor(line), size=lineSize(line);
      const noPh=p.replace(/\{[^}]*\}/g,'').replace(/\s+/g,'');
      let txt;
      if(!noPh) txt=p;
      else if(TR[p]&&TR[p][L]) txt=TR[p][L];
      else { txt=(TR[p]&&TR[p].EN)||p; miss.add(L+' | '+p); }
      return '<font color='+color+' size='+size+'>'+txt+'</font>';
    }).join('\n'));
    rebuilt++;
  }
}

// ---- Hawkeye 孤儿键:补进全部语言(name + shortDesc + desc) ----
const HEADER=TR['强化属性']; // {lang:...}
const hawk={
  name:{CNS:'鹰眼',CNT:'鷹眼',EN:'Hawkeye',FR:'Œil de faucon',DE:'Falkenauge',ES:'Ojo de halcón',RU:'Соколиный глаз',JA:'ホークアイ',KO:'호크아이'},
  body:{CNS:'每关开始时标记一个带钥匙的怪物',CNT:'每關開始時標記一個帶鑰匙的怪物',EN:'Mark a key-holding monster at the start of each level',FR:'Repère un monstre porteur de clé au début de chaque niveau',DE:'Markiert zu Beginn jeder Ebene ein schlüsseltragendes Monster',ES:'Marca un monstruo con llave al inicio de cada nivel',RU:'Отмечает монстра с ключом в начале каждого уровня',JA:'各レベル開始時に鍵を持つ魔物を1体表示する',KO:'각 레벨 시작 시 열쇠를 가진 몬스터를 표시한다'},
};
const HEADER_CN={CNS:'强化属性',CNT:'強化屬性'};
for(const L of ['CNS','CNT',...LANGS]){
  const header=(L==='CNS'||L==='CNT')?HEADER_CN[L]:(HEADER&&HEADER[L])||'Enhancement';
  d[L].Hawkeye={ name:hawk.name[L], shortDesc:hawk.body[L],
    desc:['<font color=#3333cc size=20>'+header+'</font>\n<font color=#000000 size=20>'+hawk.body[L]+'</font>'] };
}

fs.writeFileSync(F, JSON.stringify(d,null,'\t'));
fs.writeFileSync(MIRROR, JSON.stringify(d,null,'\t'));
console.log('useDescArr rebuilt:',rebuilt,'(',LANGS.length,'langs x',udaKeys.length,'keys ) + Hawkeye added (9 langs)');
if(miss.size){ console.log('MISSING uda translations:',miss.size); [...miss].slice(0,30).forEach(s=>console.log('  ',s)); }
else console.log('all uda lines translated ✓');
