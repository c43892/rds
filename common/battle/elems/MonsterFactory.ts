class Monster extends Elem {constructor() { super();}

    public hp:number; // 血量
    public power:number; // 攻击力
    public defence:number; // 防御
    public dodge:number; // 闪避%

    public dead = () => this.hp <= 0; // 是否还活着

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
    }

    // buff 相关

    public buffs:Buff[] = []; // 所有 buff
    
    public addBuff(buff:Buff) {
        // 如果有相同的 buff，就合并
        var n = Utils.indexOf(this.buffs, (b) => b.type == buff.type);
        if (n < 0) {
            buff.getOwner = () => this;
            this.buffs.push(buff);
        }
        else if (buff.cd)
            this.buffs[n].cd += buff.cd;
    }

    public removeBuff(type:string):Buff {
        var n = Utils.indexOf(this.buffs, (b) => b.type == type);
        var buff;
        if (n >= 0) {
            buff = this.buffs[n];
            this.buffs = Utils.removeAt(this.buffs, n);
        }

        return buff;
    }
}

// 怪物
class MonsterFactory {
    public creators = {
        // 死神每回合攻击玩家，并随机移动，死亡时给玩家 +10 死神时间
        "DeathGod": (attrs) => {
            var m = this.createMonster(attrs);
            var bt = m.bt();
            m = <Monster>ElemFactory.addDieAI(async () => bt.implAddPlayerAttr("deathStep", 10), m);
            m = MonsterFactory.doAttack("onPlayerActed", m);
            m = <Monster>ElemFactory.doMove("onPlayerActed", 3, m);
            return m;
        },

        // "Bunny": (attrs) => MonsterFactory.doAttack("onPlayerActed", this.createMonster(attrs)) // 每回合攻击玩家
        "Bunny": (attrs) => MonsterFactory.doAttackBack(this.createMonster(attrs)) // 被攻击时反击
        // "Bunny": (attrs) => MonsterFactory.doAttackBack(MonsterFactory.doSneakAttack(this.createMonster(attrs))) // 偷袭行为是攻击，被攻击时反击
        // "Bunny": (attrs) => MonsterFactory.doAttackBack(MonsterFactory.doSneakStealMoney(this.createMonster(attrs))) // 偷袭行为是偷钱，被攻击时反击
        // "Bunny": (attrs) => MonsterFactory.doSneakSuckBlood(this.createMonster(attrs)) // 偷袭行为是吸血
        // "Bunny": (attrs) => MonsterFactory.doSneakEatItems(this.createMonster(attrs), true) // 偷袭行为是拿走道具
        // "Bunny": (attrs) => MonsterFactory.doSneakSummon(this.createMonster(attrs)) // 偷袭行为是召唤
        // "Bunny": (attrs) => { // 死亡时放毒
        //     var m = this.createMonster(attrs);
        //     m = <Monster>ElemFactory.addDieAI(async () => m.bt().implAddBuff(m.bt().player, "BuffPoison", 3), m);
        //     return m;
        // }
        // "Bunny": (attrs) => { // 玩家离开时，偷袭玩家
        //     var m = this.createMonster(attrs);
        //     m = <Monster>ElemFactory.addAIEvenCovered("beforeGoOutLevel1", async () => {
        //         var g = m.getGrid();
        //         if (g.isCovered()) // 先揭开，再攻击
        //             await m.bt().implUncoverAt(g.pos.x, g.pos.y);

        //         await m.bt().implMonsterAttackPlayer(m);
        //     }, m);
        //     return m;
        // }
        // "Bunny": (attrs) => {
        //     var m = this.createMonster(attrs);
        //     m = <Monster>ElemFactory.addDieAI(async () => m.bt().implMonsterAttackPlayer(m, true), m);
        //     return m;
        // }
    };

    // 创建一个普通的怪物
    createMonster(attrs):Monster {
        var m = new Monster();
        m.canUse = () => true;
        m.hp = attrs.hp ? attrs.hp : 0;
        m.power = attrs.power ? attrs.power : 0;
        m.defence = attrs.defence ? attrs.defence : 0;
        m.dodge = attrs.dodge ? attrs.dodge : 0;

        attrs.hazard = true;
        attrs.barrier = true;

        // 使用，即攻击怪物
        m.use = async () =>  {
            await m.bt().implPlayerAttackAt(m.pos.x, m.pos.y);
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
        return MonsterFactory.addSneakAI(async () => m.bt().implMonsterAttackPlayer(m), m);
    }

    // 偷袭：偷钱
    static doSneakStealMoney(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var dm = 10;
            await m.bt().implAddMoney(m, -dm);
            m.addDropItem(ElemFactory.create("Coins", {"cnt":dm}));
        }, m);
    }

    // 偷袭：吸血
    static doSneakSuckBlood(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            await m.bt().implSuckPlayerBlood(m, m.attrs.suckBlood);
        }, m);
    }

    // 偷袭：拿走道具
    static doSneakEatItems(m:Monster, dropOnDie:boolean):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var eatNum = m.attrs.eatNum ? m.attrs.eatNum : 1;
            var es = BattleUtils.findRandomElems(m.bt(), eatNum, (e:Elem) => !(e instanceof Monster) && !e.getGrid().isCovered());
            await m.bt().implMonsterTakeElems(m, es);
            if (dropOnDie) {
                for(var e of es)
                    m.addDropItem(e);
            }
        }, m);
    }

    // 偷袭：召唤
    static doSneakSummon(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var ss = m.attrs.summons ? m.attrs.summons : [];
            for (var i = 0; i < ss.length; i++) {
                var g:Grid; // 掉落位置，优先掉在原地
                g = BattleUtils.findRandomEmptyGrid(m.bt());
                if (!g) return; // 没有空间了
                var type = ss[i].type;
                var attrs = ss[i].attrs;
                var sm = ElemFactory.create(type, attrs);
                await m.bt().implAddElemAt(sm, g.pos.x, g.pos.y);
            }
        }, m);
    }

    // 被攻击时反击一次
    static doAttackBack(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onMonsterHurt", async () => {
            await m.bt().implMonsterAttackPlayer(m);
        }, m, (ps) => ps.m == m && !m.dead());
    }

    // 攻击玩家一次
    static doAttack(logicPoint:string, m:Monster):Monster {
        return <Monster>ElemFactory.addAI(logicPoint, async () => m.bt().implMonsterAttackPlayer(m), m);
    }

    // 给玩家加一个 buff
    static doAddBuff(logicPoint:string, buffCreator, m:Monster):Monster {
        return <Monster>ElemFactory.addAI(logicPoint, async () => {
            var bt = m.bt();
            bt.implAddBuff(bt.player, buffCreator(m))
        }, m);
    }
}
