// 一次性迁移：把纯中文配置包成顶层按语言分结构 { "CNS": <原内容> }。
// 逻辑/文本只留 CNS 一份;其它语言由读取处回退到 CNS，译员后续按需补译。
// 幂等：已是按语言分(顶层含 CNS/EN/CNT)则跳过。
import fs from 'fs';
import path from 'path';

const CFG = '../client/resource/config';
const FILES = ['occUnlockDesc.json', 'achvDesc.json', 'worldmapeventsels.json'];
const LANG_KEYS = ['CNS', 'CNT', 'EN'];

for (const f of FILES) {
    const p = path.join(CFG, f);
    const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
    const top = Object.keys(obj);
    const alreadyLangKeyed = top.length > 0 && top.every((k) => LANG_KEYS.includes(k));
    if (alreadyLangKeyed) { console.log(f, '-> 已是按语言分，跳过'); continue; }
    const wrapped = { CNS: obj };
    fs.writeFileSync(p, JSON.stringify(wrapped, null, '\t'));
    console.log(f, '-> 已包成 { CNS: ... }');
}
