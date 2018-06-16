class Monster extends Elem {

    constructor(bt:Battle) {
        super(bt);
    }

    public hp:number; // 血量
    public power:number; // 攻击力
    public defence:number; // 防御
    public dodge:number; // 闪避%

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
    }
}

// 怪物
class MonsterFactory {
    public creators = {
        // 死神每回合攻击玩家，并随机移动，死亡时给玩家 +10 死神时间
        "DeathGod": (bt:Battle, attrs) => 
                    ElemFactory.addDieAI(async () => bt.implAddPlayerAttr("deathStep", 10),
                    MonsterFactory.doAttack("onPlayerActed", 
                    MonsterFactory.doMove("onPlayerActed", 3,
                    this.createMonster(bt, attrs),
                ))),

        // "Bunny": (bt, attrs) => MonsterFactory.doAttack("onPlayerActed", this.createMonster(bt, attrs)) // 每回合攻击玩家
        // "Bunny": (bt, attrs) => MonsterFactory.doAttackBack(MonsterFactory.createMonster(bt, attrs)) // 被攻击时反击
        // "Bunny": (bt, attrs) => MonsterFactory.doAttackBack(MonsterFactory.doSneakAttack(this.createMonster(bt, attrs))) // 偷袭行为是攻击，被攻击时反击
        // "Bunny": (bt, attrs) => MonsterFactory.doAttackBack(MonsterFactory.doSneakStealMoney(this.createMonster(bt, attrs))) // 偷袭行为是偷钱，被攻击时反击
        // "Bunny": (bt, attrs) => MonsterFactory.doSneakSuckBlood(this.createMonster(bt, attrs)) // 偷袭行为是吸血
        // "Bunny": (bt, attrs) => MonsterFactory.doSneakEatItems(this.createMonster(bt, attrs), true) // 偷袭行为是拿走道具
        "Bunny": (bt:Battle, attrs) => MonsterFactory.doSneakSummon(this.createMonster(bt, attrs)) // 偷袭行为是召唤
    };

    // 创建一个普通的怪物
    createMonster(bt:Battle, attrs):Monster {
        var m = new Monster(bt);
        m.canUse = () => true;
        m.hp = attrs.hp ? attrs.hp : 0;
        m.power = attrs.power ? attrs.power : 0;
        m.defence = attrs.defence ? attrs.defence : 0;
        m.dodge = attrs.dodge ? attrs.dodge : 0;
        m.hazard = true;
        m.blockUncover = true;

        // 使用，即攻击怪物
        m.use = async () =>  {
            await m.bt.implPlayerAttackMonster(m);
            return true;
        };

        return m;
    }

    // 设定偷袭逻辑
    static addSneakAI(act, m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onGridUncovered", act, m, (ps) => ps.x == m.pos.x && ps.y == m.pos.y 
                                                        && ps.stateBeforeUncover != GridStatus.Marked);
    }

    // 偷袭：攻击
    static doSneakAttack(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => m.bt.implMonsterAttackPlayer(m), m);
    }

    // 偷袭：偷钱
    static doSneakStealMoney(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var dm = 10;
            await m.bt.implAddMoney(m, -dm);
            m.addDropItem(ElemFactory.create("Coins", m.bt, {"cnt":dm}));
        }, m);
    }

    // 偷袭：吸血
    static doSneakSuckBlood(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            await m.bt.implSuckPlayerBlood(m, m.attrs.suckBlood);
        }, m);
    }

    // 偷袭：拿走道具
    static doSneakEatItems(m:Monster, dropOnDie:boolean):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var eatNum = m.attrs.eatNum ? m.attrs.eatNum : 1;
            var es = BattleUtils.findRandomElems(m.bt, eatNum, (e:Elem) => !(e instanceof Monster) && !e.getGrid().isCovered());
            await m.bt.implMonsterTakeElems(m, es);
            if (dropOnDie) {
                for(var e of es)
                    m.addDropItem(e);
            }
        }, m);
    }

    // 偷袭：召唤
    static doSneakSummon(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var bt = m.bt;
            var ss = m.attrs.summons;
            for (var i = 0; i < ss.length; i++) {
                var g:Grid; // 掉落位置，优先掉在原地
                g = BattleUtils.findRandomEmptyGrid(bt);
                if (!g) return; // 没有空间了
                var type = ss[i].type;
                var attrs = ss[i].attrs;
                var sm = ElemFactory.create(type, bt, attrs);
                await bt.implAddElemAt(sm, g.pos.x, g.pos.y);
            }
        }, m);
    }

    // 被攻击时反击一次
    static doAttackBack(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onMonsterHurt", async () => m.bt.implMonsterAttackPlayer(m), m, (ps) => ps.m == m);
    }

    // 攻击玩家一次
    static doAttack(logicPoint:string, m:Monster):Monster {
        return <Monster>ElemFactory.addAI(logicPoint, async () => m.bt.implMonsterAttackPlayer(m), m);
    }

    // 随机移动一次，dist 表示移动几格
    static doMove(logicPoint:string, dist:number, m:Monster):Monster {
        var dir = [[-1,0],[1,0],[0,-1],[0,1]];
        return <Monster>ElemFactory.addAI(logicPoint, async () => {
            var path = [{x:m.pos.x, y:m.pos.y}];
            for (var i = 0; i < dist; i++) {
                var d = dir[m.bt.srand.nextInt(0, dir.length)];
                var lastPt = path[path.length - 1];
                var x = lastPt.x + d[0];
                var y = lastPt.y + d[1];
                if ((m.pos.x == x && m.pos.y == y) || m.bt.level.map.isWalkable(x, y))
                    path.push({x:x, y:y});
            }

            await m.bt.implMonsterMoving(m, path);
        }, m);
    }
}
