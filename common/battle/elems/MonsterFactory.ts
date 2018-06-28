class Monster extends Elem {constructor() { super();}
    public hp:number; // 血量
    public Shield:number; // 护盾

    public isDead = () => this.hp <= 0; // 是否已经死亡

    public getAttrsAsTarget() {
        return {
            owner:this,
            Shield:{a:0, b:this.Shield, c:0},
            dodge:{a:0, b:this.btAttrs.dodge, c:0},
            damageDec:{a:0, b:this.btAttrs.damageDec, c:0},
            resist:{a:0, b:0, c:this.btAttrs.resist},
            immuneFlags:this.btAttrs.immuneFlags
        };
    }

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
    }

    public addShield(ds:number) {
        this.Shield += ds;
        if (this.Shield < 0)
            this.Shield = 0;
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
        else if (buff.cnt)
            this.buffs[n].cnt += buff.cnt;
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
            m = <Monster>ElemFactory.addDieAI(async () => m.bt().implAddPlayerAttr("deathStep", 10), m);
            m = MonsterFactory.doAttack("onPlayerActed", m);
            m = <Monster>ElemFactory.doMove("onPlayerActed", 3, m);
            return m;
        },

        // "Bunny": (attrs) => this.createMonster(attrs) // 什么都不做
        // "Bunny": (attrs) => MonsterFactory.doAttack("onPlayerActed", this.createMonster(attrs)) // 每回合攻击玩家
        "Bunny": (attrs) => MonsterFactory.doAttackBack(this.createMonster(attrs)), // 被攻击时反击
        // "Bunny": (attrs) => MonsterFactory.doAttackBack(MonsterFactory.doSneakAttack(this.createMonster(attrs))) // 偷袭行为是攻击，被攻击时反击
        // "Bunny": (attrs) => MonsterFactory.doAttackBack(MonsterFactory.doSneakStealMoney(this.createMonster(attrs))) // 偷袭行为是偷钱，被攻击时反击
        // "Bunny": (attrs) => MonsterFactory.doSneakSuckBlood(this.createMonster(attrs)) // 偷袭行为是吸血
        // "Bunny": (attrs) => MonsterFactory.doSneakEatItems(this.createMonster(attrs), true) // 偷袭行为是拿走道具
        // "Bunny": (attrs) => MonsterFactory.doSneakSummon(this.createMonster(attrs)) // 偷袭行为是召唤
        // "Bunny": (attrs) => { // 死亡时放毒
        //     var m = this.createMonster(attrs);
        //     m = <Monster>ElemFactory.addDieAI(async () => m.bt().implAddBuff(m.bt().player, "BuffPoison", 3, 1), m);
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

        "NormalZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //普通僵尸
        "ThiefZombie": (attrs) => MonsterFactory.doSneakStealMoney(false, MonsterFactory.doAttackBack(this.createMonster(attrs))), //窃贼僵尸
        "HoundZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //猎犬僵尸
        "VampireZombie": (attrs) => MonsterFactory.doSneakSuckBlood(MonsterFactory.doAttackBack(this.createMonster(attrs))), //吸血鬼僵尸
        "DancerZombie": (attrs) => MonsterFactory.doSneakSummon(MonsterFactory.doAttackBack(this.createMonster(attrs))), //舞王僵尸
        "GluttonyZombie": (attrs) => MonsterFactory.doSneakEatItems(MonsterFactory.doAttackBack(this.createMonster(attrs)), false), //暴食僵尸
        "SniperZombie": (attrs) => MonsterFactory.doAttackOnPlayerLeave(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //狙击者僵尸
        "BombZombie": (attrs) => MonsterFactory.doSelfExplodeAfterNRound(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //炸弹僵尸
        "EyeDemonZombie": (attrs) => MonsterFactory.doUncoverGridOnDeath(2, MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //眼魔僵尸
        "RandomEggZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //彩蛋僵尸
        "LustZombie": (attrs) => MonsterFactory.doSneakReduseDeathStep(15, MonsterFactory.doAttackBack(this.createMonster(attrs))), //色欲僵尸
        "IronZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))) //钢铁侠僵尸

    };

    // 创建一个普通的怪物
    createMonster(attrs):Monster {
        var m = new Monster();
        m.canUse = () => true;
        m.hp = attrs.hp ? attrs.hp : 0;
        m.Shield = attrs.Shield ? attrs.Shield : 0;
        m.hazard = true;
        m.barrier = true;

        // 使用，即攻击怪物
        m.use = async () =>  {
            await m.bt().implPlayerAttackAt(m.pos.x, m.pos.y);
            return true;
        };

        return m;
    }

    // 设定偷袭逻辑
    static addSneakAI(act, m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onGridChanged", act, m, (ps) => ps.x == m.pos.x && ps.y == m.pos.y && ps.subType == "gridUnconvered" && ps.stateBeforeUncover != GridStatus.Marked);
    }

    // 偷袭：攻击
    static doSneakAttack(m:Monster):Monster {
        // 怪物偷袭，其实并没有 Sneak 标记，不影响战斗计算过程
        return MonsterFactory.addSneakAI(async () => m.bt().implMonsterAttackPlayer(m), m);
    }

    // 偷袭：偷钱
    static doSneakStealMoney(giveback:Boolean, m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            await m.bt().implAddMoney(m, - Math.floor(m.bt().player.money * m.attrs.steal.percent / 100) - m.attrs.steal.num);
            if(giveback)
                m.addDropItem(m.bt().level.createElem("Coins"));

        }, m);
    }

    // 偷袭：吸血
    static doSneakSuckBlood(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            await m.bt().implSuckPlayerBlood(m, Math.floor(m.bt().player.hp * m.attrs.suckBlood.percent / 100) + m.attrs.suckBlood.num);
        }, m);
    }

    // 偷袭：拿走道具
    static doSneakEatItems(m:Monster, dropOnDie:boolean):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var eatNum = m.attrs.eatNum ? m.attrs.eatNum : 1;
            var es = BattleUtils.findRandomElems(m.bt(), eatNum, (e:Elem) => !(e instanceof Monster) && !e.getGrid().isCovered());
            if(es)
                Utils.log("get");

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
                var sm = m.bt().level.createElem(ss[i]);
                await m.bt().implAddElemAt(sm, g.pos.x, g.pos.y);
            }
        }, m);
    }

    //偷袭：死神提前N回合到来
    static doSneakReduseDeathStep(n:number, m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            await m.bt().implAddPlayerAttr("deathStep", -n);
        }, m);
    }

    // 被攻击时反击一次
    static doAttackBack(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onAttack", async () => {
            await m.bt().implMonsterAttackPlayer(m);
        }, m, (ps) => !ps.weapon && ps.target == m && !m.isDead());
    }

    // 攻击玩家一次
    static doAttack(logicPoint:string, m:Monster):Monster {
        return <Monster>ElemFactory.addAI(logicPoint, async () => m.bt().implMonsterAttackPlayer(m), m);
    }

    // 玩家离开时，偷袭玩家
    static doAttackOnPlayerLeave(m:Monster):Monster{
        return <Monster>ElemFactory.addAIEvenCovered("beforeGoOutLevel1", async () => {
                var g = m.getGrid();
                if (g.isCovered()) // 先揭开，再攻击
                    await m.bt().implUncoverAt(g.pos.x, g.pos.y);

                await m.bt().implAddPlayerHp(-m.attrs.stealOnPlayerLeave);
            }, m);;
    }

    //死亡时翻开N个空地块
    static doUncoverGridOnDeath(n:number, m:Monster):Monster{
        return <Monster>ElemFactory.addDieAI(async () => {
            for(var i = 0; i < n; i++){
                var fg = BattleUtils.findRandomEmptyGrid(m.bt(), true);
                if(!fg)
                    return;

                var x = fg.pos.x, y = fg.pos.y;
                await m.bt().implUncoverAt(x, y);
            }
        }, m);
    }
   
   //N回合后自爆,对玩家造成攻击力的N倍伤害
   static doSelfExplodeAfterNRound(m:Monster):Monster{
        var cnt = 0;
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            cnt++;
            Utils.log("step", cnt);
            if(cnt > m.attrs.selfExplode.cnt)
            {
                m.btAttrs.power = m.btAttrs.power * m.attrs.selfExplode.mult;
                m.bt().implMonsterAttackPlayer(m, false, true);
            }
        },m);
   }
}

