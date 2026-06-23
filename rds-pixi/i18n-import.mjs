// 翻译回填工具：把某语言的翻译合并进 multilanguage.json(tips/views/occupations)
// 和 elemdesc.json。与 i18n-inventory.mjs 的导出对应，完成 导出->翻译->导入 闭环。
//
// 用法:  node i18n-import.mjs <lang> <translations.json>
//   translations.json 形如:
//   {
//     "tips":     { "key": "译文", ... },
//     "views":    { "viewName.fieldName": "译文", ... },
//     "occupations": { "occKey.name": "译文", "occKey.desc": "译文", ... },
//     "elemdesc": { "eType.field": "译文", ... }
//   }
// 仅写入目标语言；保留占位符 {0}/{name} 与 <font> 富文本(原样写入，由译文负责正确)。
// 只在目标字段为空/缺失时填入，除非加 --overwrite。
import fs from 'fs';
import path from 'path';

const [, , lang, file] = process.argv;
if (!lang || !file) { console.error('用法: node i18n-import.mjs <lang> <translations.json>'); process.exit(1); }
const overwrite = process.argv.includes('--overwrite');

const CFG = '../client/resource/config';
const mlPath = path.join(CFG, 'multilanguage.json');
const edPath = path.join(CFG, 'elemdesc.json');
const ml = JSON.parse(fs.readFileSync(mlPath, 'utf8'));
const ed = JSON.parse(fs.readFileSync(edPath, 'utf8'));
const tr = JSON.parse(fs.readFileSync(file, 'utf8'));

let applied = 0, skipped = 0, missTarget = 0;
const setLang = (entry, val) => {
    if (!entry || typeof entry !== 'object') return false;
    if (!overwrite && entry[lang] != undefined && entry[lang] !== '') { skipped++; return false; }
    entry[lang] = val; applied++; return true;
};

// tips
for (const k in (tr.tips || {})) {
    if (!ml.tips[k]) { console.warn('tips 无此键:', k); missTarget++; continue; }
    setLang(ml.tips[k], tr.tips[k]);
}
// views: "view.field"
for (const kk in (tr.views || {})) {
    const i = kk.indexOf('.'); const v = kk.slice(0, i), n = kk.slice(i + 1);
    const t = ml.views[v] && ml.views[v].text;
    if (!t || !t[n]) { console.warn('view.text 无此项:', kk); missTarget++; continue; }
    setLang(t[n], tr.views[kk]);
}
// occupations: "occ.field"
for (const kk in (tr.occupations || {})) {
    const i = kk.indexOf('.'); const o = kk.slice(0, i), f = kk.slice(i + 1);
    const oc = ml.occupations && ml.occupations[o];
    if (!oc || !oc[f]) { console.warn('occupation 无此项:', kk); missTarget++; continue; }
    setLang(oc[f], tr.occupations[kk]);
}
// elemdesc: "eType.field" -> ed[lang][eType][field]
if (tr.elemdesc && Object.keys(tr.elemdesc).length) {
    ed[lang] = ed[lang] || {};
    for (const kk in tr.elemdesc) {
        const i = kk.indexOf('.'); const et = kk.slice(0, i), f = kk.slice(i + 1);
        ed[lang][et] = ed[lang][et] || {};
        if (!overwrite && ed[lang][et][f] != undefined && ed[lang][et][f] !== '') { skipped++; continue; }
        ed[lang][et][f] = tr.elemdesc[kk]; applied++;
    }
}

JSON.parse(JSON.stringify(ml)); JSON.parse(JSON.stringify(ed)); // sanity
fs.writeFileSync(mlPath, JSON.stringify(ml, null, '\t'));
fs.writeFileSync(edPath, JSON.stringify(ed, null, '\t'));
console.log(`[${lang}] 应用:${applied} 跳过(已有):${skipped} 目标缺失:${missTarget}`);
console.log('注意: multilanguage.json / elemdesc.json 已重排;记得 cp 到 public/resource 并 build。');
