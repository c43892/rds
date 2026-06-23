// 用 desc-lines-tr.json(短语->7语言)按行重建 elemdesc.json 各语言的 desc 富文本。
// 规则:对 CNS 每条 desc,按 \n 切行;每行折叠成单个 well-formed <font color=原色 size=20>译文</font>,
// {占位符} 内联保留(运行时 replaceByProperties 再替换)。CNS/CNT 原样不动。
import fs from 'fs';
const F = '../client/resource/config/elemdesc.json';
const MIRROR = 'public/resource/config/elemdesc.json';
const TR = JSON.parse(fs.readFileSync('desc-lines-tr.json', 'utf8'));
const LANGS = ['EN','FR','DE','ES','RU','JA','KO'];

const d = JSON.parse(fs.readFileSync(F, 'utf8'));
const cns = d.CNS;

function plain(line){ return line.replace(/<\/?font[^>]*>/g,'').replace(/\s+/g,' ').trim(); }
function lineColor(line){ const m=line.match(/<font[^>]*color=(#[0-9a-fA-F]{6})/); return m?m[1]:'#000000'; }

let missTr = new Set(), rebuilt = 0;
for (const L of LANGS) {
    if (!d[L]) d[L] = {};
    for (const key in cns) {
        const v = cns[key];
        if (!(v && Array.isArray(v.desc) && v.desc.length)) continue;
        // 确保 entry 存在(保留已译 name/shortDesc;缺失则从 CNS 兜底)
        if (d[L][key] == undefined) d[L][key] = {};
        const e = d[L][key];
        if (e.name == undefined) e.name = (d.EN[key] && d.EN[key].name) || v.name;
        if (e.shortDesc == undefined) e.shortDesc = (d.EN[key] && d.EN[key].shortDesc) || v.shortDesc;
        // 重建 desc
        e.desc = v.desc.map(entry => entry.split(/\n/).map(line => {
            const p = plain(line);
            if (!p) return line; // 空行原样
            const color = lineColor(line);
            const noPh = p.replace(/\{[^}]*\}/g,'').replace(/\s+/g,'');
            let txt;
            if (!noPh) txt = p; // 纯占位符行,不翻译
            else if (TR[p] && TR[p][L]) txt = TR[p][L];
            else { txt = (TR[p] && TR[p].EN) || p; missTr.add(L+' | '+p); }
            return '<font color=' + color + ' size=20>' + txt + '</font>';
        }).join('\n'));
        rebuilt++;
    }
}

fs.writeFileSync(F, JSON.stringify(d, null, '\t'));
fs.writeFileSync(MIRROR, JSON.stringify(d, null, '\t'));
console.log('rebuilt desc entries:', rebuilt, '(', LANGS.length, 'langs )');
if (missTr.size) { console.log('MISSING translations:', missTr.size); [...missTr].slice(0,40).forEach(s=>console.log('  ',s)); }
else console.log('all phrases translated for all langs ✓');
