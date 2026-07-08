import fs from 'fs';
const ml=JSON.parse(fs.readFileSync('../client/resource/config/multilanguage.json','utf8'));
const dict=JSON.parse(fs.readFileSync('pt-dict.json','utf8'));
const reps=[
  ["Initial grids:","Grades iniciais:"],["Monster stats:","Atributos dos monstros:"],
  ["Coins gained:","Moedas obtidas:"],["Initial HP:","HP inicial:"],
  ["Death’s steps:","Passos da Morte:"],["Death's steps:","Passos da Morte:"],
  ["Difficulty factor:","Fator de dificuldade:"],["Endless mode","Modo infinito"],
  [" worlds"," mundos"],[" world"," mundo"],
  [">Easy<",">Fácil<"],[">Hard<",">Difícil<"],[">Nightmare<",">Pesadelo<"],[">Hell<",">Inferno<"]
];
const en=ml.tips.levelDifficultyDesc.EN; // array of 5 strings
let filled=0;
for(const s of en){ if(typeof s!=='string'||dict[s]!=null) continue;
  let t=s; for(const [a,b] of reps) t=t.split(a).join(b);
  dict[s]=t; filled++;
}
fs.writeFileSync('pt-dict.json', JSON.stringify(dict,null,0));
console.log('difficulty PT filled:',filled,'| sample:', JSON.stringify(dict[en[0]].replace(/\r\n/g,' ').slice(0,80)));
