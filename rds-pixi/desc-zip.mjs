// 把按顺序提供的译文数组(desc-tr-A.json + desc-tr-B.json)与 desc-lines.json 的中文短语
// 按下标对齐,生成 desc-lines-tr.json(短语 -> {EN..KO})。
import fs from 'fs';
const lines = JSON.parse(fs.readFileSync('desc-lines.json','utf8')); // [{t,c}]
const A = JSON.parse(fs.readFileSync('desc-tr-A.json','utf8'));
const B = JSON.parse(fs.readFileSync('desc-tr-B.json','utf8'));
const vals = A.concat(B);
if (vals.length !== lines.length) {
    console.error('LENGTH MISMATCH: lines=' + lines.length + ' vals=' + vals.length + ' (A=' + A.length + ' B=' + B.length + ')');
    process.exit(1);
}
const out = {};
const LANGS = ['EN','FR','DE','ES','RU','JA','KO'];
let bad = 0;
lines.forEach((ln, i) => {
    const v = vals[i];
    for (const L of LANGS) if (v[L] == undefined) { console.error('missing ' + L + ' at idx ' + i + ' (' + ln.t + ')'); bad++; }
    out[ln.t] = v;
});
fs.writeFileSync('desc-lines-tr.json', JSON.stringify(out, null, 0));
console.log('wrote desc-lines-tr.json:', Object.keys(out).length, 'phrases', bad ? ('(' + bad + ' missing fields!)') : 'OK');
