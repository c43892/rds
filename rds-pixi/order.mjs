import { globSync } from 'glob';
import path from 'path';

const files = [
  ...globSync('../common/logic/**/*.ts'),
  ...globSync('../client/src/**/*.ts'),
].map(f => f.split(path.sep).join('/'))
 .filter(f => !/AniTestView\.ts$/.test(f));

function prio(f) {
  const b = path.basename(f);
  const p = f;
  const m = {
    'SRandom.ts': 0, 'Utils.ts': 1, 'Switch.ts': 1, 'Version.ts': 1, 'GCfg.ts': 1,
    'Buff.ts': 5, 'Elem.ts': 5, 'LevelLogic.ts': 5,
    'Monster.ts': 6, 'Item.ts': 6, 'Prop.ts': 6, 'Relic.ts': 6,
    'Plant.ts': 7,
    'ItemFactory.ts': 8, 'PropFactory.ts': 8, 'RelicFactory.ts': 8, 'MonsterFactory.ts': 8,
    'PlantFactory.ts': 8, 'BuffFactory.ts': 8, 'AchievementFactory.ts': 8, 'LevelLogicFactory.ts': 8,
    'ElemFactory.ts': 9,
  };
  if (m[b] !== undefined) return m[b];
  if (p.includes('/common/logic/')) return 12;
  if (b === 'Platform.ts' || b === 'WebClient.ts' || b === 'ResMgr.ts') return 20;
  if (p.includes('/audio/') || p.includes('/effects/')) return 21;
  if (p.includes('/animation/')) return 22;
  if (b === 'ViewUtils.ts') return 24;
  if (b === 'TextButtonWithBg.ts') return 25;
  if (b === 'MainView.ts') return 40;
  if (b === 'LoadingUI.ts') return 45;
  if (b === 'Main.ts') return 50;
  if (p.includes('/view/')) return 30;
  return 26;
}

files.sort((a, b) => {
  const pa = prio(a), pb = prio(b);
  if (pa !== pb) return pa - pb;
  return a.localeCompare(b);
});

const list = ['src/game-globals.d.ts', ...files];
console.log(JSON.stringify(list, null, 4));
