// 一次性脚本：把 #6 抽离出来的硬编码 UI 文案作为新 tips 键，最小化插入到
// multilanguage.json 的 "tips": { 之后（不重排整个文件）。已存在的键跳过。
import fs from 'fs';
const FILE = '../client/resource/config/multilanguage.json';

// key -> {EN,CNS,CNT}
const NEW = {
    currentProgress:     { EN: "Progress",                       CNS: "当前进度",        CNT: "當前進度" },
    currentProgressWith: { EN: "Progress {0}",                   CNS: "当前进度 {0}",    CNT: "當前進度 {0}" },
    achvPointLabel:      { EN: "Achievement points: {0}",        CNS: "成就点: {0}",     CNT: "成就點: {0}" },
    unlockedByAchv:      { EN: "Unlocked by achievement",        CNS: "解锁于成就",      CNT: "解鎖於成就" },
    unlockedByAchvPoint: { EN: "Unlocked by achievement points", CNS: "解锁于成就点",    CNT: "解鎖於成就點" },
    received:            { EN: "Received",                       CNS: "已领取",          CNT: "已領取" },
    receive:             { EN: "Receive",                        CNS: "领取",            CNT: "領取" },
    completed:           { EN: "Completed",                      CNS: "已完成",          CNT: "已完成" },
    hospitalHealTitle:   { EN: "Heal?",                          CNS: "确定治疗",        CNT: "確定治療" },
    hospitalHealContent: { EN: "Restore up to 30% HP",           CNS: "回复最多 30% 生命", CNT: "回復最多 30% 生命" },
    hospitalExpelTitle:  { EN: "Expel Death?",                   CNS: "确定驱逐死神",    CNT: "確定驅逐死神" },
    hospitalExpelContent:{ EN: "Death retreats 50 steps",        CNS: "死神回退 50 步",  CNT: "死神回退 50 步" },
    gameOverTitle:       { EN: "You died",                       CNS: "不幸死亡",        CNT: "不幸死亡" },
    gameOverContent:     { EN: "Game over",                      CNS: "游戏结束",        CNT: "遊戲結束" },
    clickToInputName:    { EN: "Tap to enter name",              CNS: "点击输入名字",    CNT: "點擊輸入名字" },
    occLevelUpArrow:     { EN: "Lv {0} → Lv {1}",           CNS: "{0}级 → {1}级", CNT: "{0}級 → {1}級" },
    purchasing:          { EN: "Purchasing, please wait!",       CNS: "购买请求中，请稍候！", CNT: "購買請求中，請稍候！" },
    aNewPlayer:          { EN: "A new player",                   CNS: "一个新玩家",      CNT: "一個新玩家" },
    rankWeekly:          { EN: "Weekly",                         CNS: "周榜",            CNT: "週榜" },
    rankRole:            { EN: "Roles",                          CNS: "角色榜",          CNT: "角色榜" },
    rankFriend:          { EN: "Friends",                        CNS: "好友榜",          CNT: "好友榜" },
    // 登录界面按钮文案(英文版用花体原图,其它语言用这些文字现生成按钮)
    loginNewGame:        { EN: "New Game",                       CNS: "新游戏",          CNT: "新遊戲" },
    loginContinue:       { EN: "Continue",                       CNS: "继续游戏",        CNT: "繼續遊戲" },
    loginRank:           { EN: "Heroes",                         CNS: "排行榜",          CNT: "排行榜" },
    loginAchievement:    { EN: "Achievements",                   CNS: "成就",            CNT: "成就" },
    // 世界地图图例
    legend:              { EN: "Legend",        CNS: "图例",     CNT: "圖例",     JA: "凡例",         KO: "범례",       FR: "Légende",        DE: "Legende",        ES: "Leyenda",        RU: "Легенда" },
    legendBoss:          { EN: "Boss Battle",   CNS: "BOSS战斗", CNT: "BOSS戰鬥", JA: "ボス戦",       KO: "보스 전투",  FR: "Combat de boss", DE: "Boss-Kampf",     ES: "Combate de jefe",RU: "Бой с боссом" },
    legendCamp:          { EN: "Safe House",    CNS: "安全屋",   CNT: "安全屋",   JA: "隠れ家",       KO: "은신처",     FR: "Refuge",         DE: "Unterschlupf",   ES: "Refugio",        RU: "Убежище" },
    legendBox:           { EN: "Treasure",      CNS: "宝箱",     CNT: "寶箱",     JA: "宝箱",         KO: "보물상자",   FR: "Coffre",         DE: "Schatztruhe",    ES: "Cofre",          RU: "Сундук" },
    legendSenior:        { EN: "Special Battle",CNS: "特殊战斗", CNT: "特殊戰鬥", JA: "特殊戦",       KO: "특수 전투",  FR: "Combat spécial", DE: "Spezialkampf",   ES: "Combate especial",RU: "Особый бой" },
    legendNormal:        { EN: "Normal Battle", CNS: "普通战斗", CNT: "普通戰鬥", JA: "通常戦",       KO: "일반 전투",  FR: "Combat normal",  DE: "Normaler Kampf", ES: "Combate normal", RU: "Обычный бой" },
    legendEvent:         { EN: "Random Event",  CNS: "随机事件", CNT: "隨機事件", JA: "ランダムイベント", KO: "무작위 이벤트", FR: "Événement",   DE: "Zufallsereignis",ES: "Evento aleatorio",RU: "Случайное событие" },
    legendShop:          { EN: "Merchant",      CNS: "商人",     CNT: "商人",     JA: "商人",         KO: "상인",       FR: "Marchand",       DE: "Händler",        ES: "Mercader",       RU: "Торговец" },
};

let txt = fs.readFileSync(FILE, 'utf8');
const cfg = JSON.parse(txt); // 校验 + 查重
const eol = txt.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
// 容错匹配 "tips" : {  （含可能的 \r），在其行尾后插入
const m = txt.match(/"tips"\s*:\s*\{[ \t]*\r?\n/);
if (!m) { console.error('找不到 tips 锚点'); process.exit(1); }
const anchor = m[0];

const lines = [];
let added = 0, skipped = 0;
for (const k in NEW) {
    if (cfg.tips[k] != undefined) { skipped++; continue; }
    const v = NEW[k];
    const parts = Object.keys(v).map(lng => '"' + lng + '": ' + JSON.stringify(v[lng]));
    lines.push('\t\t"' + k + '": { ' + parts.join(', ') + ' },');
    added++;
}
if (added > 0) {
    txt = txt.replace(anchor, anchor + lines.join(eol) + eol);
    JSON.parse(txt); // 再次校验插入后仍是合法 JSON
    fs.writeFileSync(FILE, txt);
}
console.log('tips 新增:', added, '跳过(已存在):', skipped);
