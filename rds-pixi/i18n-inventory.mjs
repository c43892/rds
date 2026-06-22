// i18n 翻译清单 / 抽取工具
// 枚举所有“已走多语言”的配置里的可翻译字符串，按语言列出，标记缺失，
// 产出供译员填写的主表(CSV)+ 控制台覆盖率摘要。
//
// 用法:  node i18n-inventory.mjs            # 打印摘要 + 写 i18n-master.csv
//        node i18n-inventory.mjs --json     # 额外写 i18n-master.json
//
// 源文件以 client/resource/config 为准(游戏的源配置)。
import fs from 'fs';
import path from 'path';

const CFG = '../client/resource/config';
const read = (f) => JSON.parse(fs.readFileSync(path.join(CFG, f), 'utf8'));

// 目标语言(已有 EN/CNS/CNT;其余为本次要新增,届时填表即可)
const TARGET_LANGS = ['CNS', 'CNT', 'EN', 'JA', 'KO', 'ES', 'FR', 'DE', 'PT', 'RU'];
const SRC_LANG = 'CNS'; // 源语言(译员据此翻译)

const ml = read('multilanguage.json');
const elemdesc = read('elemdesc.json');

// entries: { domain, key, field, values:{lang:str} }
const entries = [];
const add = (domain, key, field, values) => entries.push({ domain, key, field, values: values || {} });

// 收集 {lang:val} 形状条目里的各语言值
const langVals = (entry) => {
    const v = {};
    if (entry && typeof entry === 'object')
        for (const l of TARGET_LANGS) if (typeof entry[l] === 'string') v[l] = entry[l];
    return v;
};

// 1) tips: key -> {lang:str}
for (const k in (ml.tips || {})) add('tips', k, '', langVals(ml.tips[k]));

// 2) views[v].text[name] -> {lang:str}
for (const v in (ml.views || {})) {
    const t = ml.views[v].text || {};
    for (const name in t) add('view', v, name, langVals(t[name]));
}

// 3) occupations[o].{name,desc} -> {lang:str}
for (const o in (ml.occupations || {})) {
    const oc = ml.occupations[o];
    for (const field of ['name', 'desc']) if (oc[field]) add('occupation', o, field, langVals(oc[field]));
}

// 4) elemdesc[lang][eType][field] -> 透视成 (eType,field) 一行多语言
//    先收集所有 eType 和字段
const elemLangs = Object.keys(elemdesc).filter((l) => TARGET_LANGS.includes(l));
const elemTypes = new Set();
const elemFields = {}; // eType -> Set(field)
for (const l of elemLangs)
    for (const et in elemdesc[l]) {
        elemTypes.add(et);
        elemFields[et] = elemFields[et] || new Set();
        const obj = elemdesc[l][et];
        if (obj && typeof obj === 'object') for (const f in obj) if (typeof obj[f] === 'string') elemFields[et].add(f);
    }
for (const et of elemTypes)
    for (const f of (elemFields[et] || [])) {
        const v = {};
        for (const l of elemLangs) { const o = elemdesc[l][et]; if (o && typeof o[f] === 'string') v[l] = o[f]; }
        add('elemdesc', et, f, v);
    }

// ---- 覆盖率摘要 ----
const present = Object.fromEntries(TARGET_LANGS.map((l) => [l, 0]));
let translatable = 0;
for (const e of entries) {
    if (e.values[SRC_LANG] == undefined) continue; // 没源文的跳过统计
    translatable++;
    for (const l of TARGET_LANGS) if (e.values[l] != undefined) present[l]++;
}

const byDomain = {};
for (const e of entries) byDomain[e.domain] = (byDomain[e.domain] || 0) + 1;

console.log('=== i18n 翻译清单 ===');
console.log('可翻译字符串总数(按源语 ' + SRC_LANG + ' 计):', translatable);
console.log('按域分布:', JSON.stringify(byDomain));
console.log('各语言覆盖率(present / ' + translatable + '):');
for (const l of TARGET_LANGS)
    console.log('  ' + l.padEnd(4), present[l] + '/' + translatable,
        '(' + Math.round((present[l] / translatable) * 100) + '%)' + (present[l] < translatable ? '  缺 ' + (translatable - present[l]) : '  ✓'));

console.log('\n注意: occUnlockDesc / worldmapeventsels / achvDesc 目前尚未走多语言结构(Phase 2 #5 会改造后纳入本清单)。');

// ---- 写 CSV 主表 ----
const esc = (s) => '"' + String(s == undefined ? '' : s).replace(/"/g, '""').replace(/\r?\n/g, '\\n') + '"';
const header = ['domain', 'key', 'field', ...TARGET_LANGS].map(esc).join(',');
const rows = entries
    .filter((e) => e.values[SRC_LANG] != undefined)
    .map((e) => [e.domain, e.key, e.field, ...TARGET_LANGS.map((l) => e.values[l])].map(esc).join(','));
fs.writeFileSync('i18n-master.csv', '﻿' + header + '\n' + rows.join('\n'));
console.log('\n已写出 i18n-master.csv (' + rows.length + ' 行;空白单元格=待翻译)。');

if (process.argv.includes('--json')) {
    fs.writeFileSync('i18n-master.json', JSON.stringify(entries.filter((e) => e.values[SRC_LANG] != undefined), null, 2));
    console.log('已写出 i18n-master.json。');
}
