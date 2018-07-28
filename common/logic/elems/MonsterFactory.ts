class Monster extends Elem {constructor() { super();}
    public hp:number; // 血量
    public shield:number; // 护盾

    public isDead = () => this.hp <= 0; // 是否已经死亡
    public isBoss = false;
    public trapped = false;

    // 是否在射程范围内
    public inAttackRange(target) {
        if (target instanceof Player)
            return true;
        else if (this.attrs.rangedAttacker) // 远程攻击
            return true;
        else {
            var dx = Math.abs(this.pos.x - target.pos.x);
            var dy = Math.abs(this.pos.y - target.pos.y);
            return (dx + dy) == 1;
        }
    }

    public getAttrsAsTarget() {
        return {
            owner:this,
            shield:{a:0, b:this.shield, c:0},
            dodge:{a:0, b:this.btAttrs.dodge, c:0},
            damageDec:{a:0, b:this.btAttrs.damageDec, c:0},
            resist:{a:0, b:0, c:this.btAttrs.resist},
            immuneFlags:[...this.btAttrs.immuneFlags]
        };
    }

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
    }

    public addShield(ds:number) {
        this.shield += ds;
        if (this.shield < 0)
            this.shield = 0;
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
            m = MonsterFactory.doAttack("onPlayerActed", m, () => m.bt().player);
            m = MonsterFactory.doRandomFly("onPlayerActed", m);
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

        "NormalZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(MonsterFactory.doMove2FoodAndEatIt("onPlayerActed", this.createMonster(attrs), attrs.moveRange))), //普通僵尸
        "GoblinThief": (attrs) => MonsterFactory.doSneakStealMoney(false, MonsterFactory.doAttackBack(this.createMonster(attrs))), //哥布林窃贼
        "HoundZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //猎犬僵尸
        "Vampire": (attrs) => MonsterFactory.doSneakSuckBlood(MonsterFactory.doAttackBack(this.createMonster(attrs))), //吸血鬼
        "DancerZombie": (attrs) => MonsterFactory.doSneakSummon(MonsterFactory.doAttackBack(this.createMonster(attrs))), //舞王僵尸
        "GluttonyZombie": (attrs) => MonsterFactory.doSneakEatItems(MonsterFactory.doAttackBack(this.createMonster(attrs)), false), //暴食僵尸
        "Gengar": (attrs) => MonsterFactory.doAttackOnPlayerLeave(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //耿鬼
        "BombAbomination": (attrs) => MonsterFactory.doSelfExplodeAfterNRound(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //自爆憎恶
        "EyeDemon": (attrs) => MonsterFactory.doUncoverGridOnDeath(2, MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //眼魔
        "RandomEggZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //彩蛋僵尸
        "LustZombie": (attrs) => MonsterFactory.doSneakReduseDeathStep(15, MonsterFactory.doAttackBack(this.createMonster(attrs))), //色欲僵尸
        "IronZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //钢铁侠僵尸
        "CommanderZombie": (attrs) => MonsterFactory.doEnhanceAura(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //指挥官僵尸
        "RageZombie": (attrs) => MonsterFactory.doAddPowerOnHurt(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //狂暴僵尸
        "HideZombie": (attrs) => MonsterFactory.doHideAfterUncovered(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //隐匿僵尸
        "GuardZombie": (attrs) => MonsterFactory.doProtectMonsterAround(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //护卫僵尸
        "ReviveZombie": (attrs) => MonsterFactory.doReviveOndie(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //复生僵尸
        "CowardZombie": (attrs) => MonsterFactory.doHideOnOtherMonsterDie(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //胆怯僵尸
        "MarkZombie":  (attrs) => MonsterFactory.doMarkMonsterOnHurt(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //标记僵尸
        "ConfusionZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //疑惑僵尸
        "GreedyZombie": (attrs) => MonsterFactory.doTakeItemsAround(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //贪婪僵尸
        "Mummy": (attrs) => MonsterFactory.doCoverGridAround(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //木乃伊
        "PoisonJellyfish": (attrs) => MonsterFactory.doMakeCoveredGridsPoison(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //毒性水母
        "SkeletonKing": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //骷髅王僵尸
        "SwatheZombie": (attrs) => MonsterFactory.doSwatheItemsOnSneak(MonsterFactory.doAttackBack(this.createMonster(attrs))), //缠绕僵尸
        "BoxMonster": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //宝箱怪
        "Ghost": (attrs) => MonsterFactory.doChaseToNextLevel(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //幽灵

        "ShopNpc": (attrs) => MonsterFactory.makeShopNPC(this.createMonster(attrs)),

        "BossBunny": (attrs) => {
            var m = this.createMonster(attrs);
            m.getElemImgRes = () => "Bunny";
            MonsterFactory.makeBoss(
                MonsterFactory.doSneakAttack(
                    MonsterFactory.doAttackBack(
                        MonsterFactory.doAttack("onPlayerActed", m, () => m.bt().player, attrs.attackInterval, () => !m.trapped), 
                    () => !m.trapped)));
            return m;
        }, 

        "PlaceHolder": (attrs) => this.createMonster(attrs)
    };

    // 创建一个普通的怪物
    createMonster(attrs):Monster {
        var m = new Monster();
        m.canUse = () => true;
        m.hp = attrs.hp ? attrs.hp : 0;
        m.shield = attrs.shield ? attrs.shield : 0;
        m.hazard = true;
        m.barrier = true;

        // 使用，即攻击怪物
        m.use = async () =>  {
            await m.bt().implPlayerAttackAt(m.pos.x, m.pos.y);
            return true;
        };

        return m;
    }

    // 随机移动一次，dist 表示移动几格
    static doRandomMove(logicPoint:string, dist:number, m:Monster):Monster {
        var dir = [[-1,0],[1,0],[0,-1],[0,1]];
        return <Monster>ElemFactory.addAI(logicPoint, async () => {
            if (m.isDead()) return;
            var path = [];
            for (var i = 0; i < dist; i++) {
                var d = dir[m.bt().srand.nextInt(0, dir.length)];
                var lastPt = path[path.length - 1];
                var x = lastPt.x + d[0];
                var y = lastPt.y + d[1];
                if ((m.pos.x == x && m.pos.y == y) || m.bt().level.map.isWalkable(x, y))
                    path.push({x:x, y:y});
            }

            await m.bt().implElemMoving(m, path);
        }, m);
    }

    // 随机飞行一次
    static doRandomFly(logicPoint:string, m:Monster):Monster {
        return <Monster>ElemFactory.addAI(logicPoint, async () => {
            var bt = m.bt();
            if (m.isDead()) return;
            var targetPos = BattleUtils.findRandomEmptyGrid(bt);
            if (!targetPos) return;
            await bt.implElemFly(m, targetPos.pos);
        }, m);
    }

    // 设定偷袭逻辑
    static addSneakAI(act, m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onGridChanged", 
            async () => await m.bt().implMonsterSneak(act),
        m, (ps) => ps.x == m.pos.x && ps.y == m.pos.y && ps.subType == "gridUncovered" && ps.stateBeforeUncover != GridStatus.Marked);
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
            var es = BattleUtils.findRandomElems(m.bt(), eatNum, (e:Elem) => !(e instanceof Monster) && !e.getGrid().isCovered() && e.type != "Door");
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
    static doAttackBack(m:Monster, condition = () => true):Monster {
        return <Monster>ElemFactory.addAI("onAttack", async (ps) => {
            var addFlags = [];
            if (Utils.contains(ps.attackerAttrs.attackFlags, "Sneak"))
                addFlags.push("back2sneak");

            await m.bt().implMonsterAttackPlayer(m, false, addFlags);
        }, m, (ps) => !ps.weapon && ps.target == m && !m.isDead() && condition());
    }

    // 攻击一次
    static doAttack(logicPoint:string, m:Monster, findTarget, attackInterval:number = 0, condition = () => true):Monster {
        attackInterval = attackInterval ? attackInterval : 0;
        var interval = 0; // 攻击行为的间隔回合数
        return <Monster>ElemFactory.addAI(logicPoint, async () => {
            if (interval < attackInterval)
                interval++;
            else if (condition()) {
                var target = findTarget();
                if (!target) return;

                // 判断射程
                if (!m.inAttackRange(target)) return;

                interval = 0;
                if (target instanceof Player)
                    await m.bt().implMonsterAttackPlayer(m);
                else if (target instanceof Monster)
                    await m.bt().implMonsterAttackMonster(m, target);
            }
        }, m);
    }

    // 玩家离开时，偷袭玩家
    static doAttackOnPlayerLeave(m:Monster):Monster{
        return <Monster>ElemFactory.addAIEvenCovered("beforeGoOutLevel1", async () => {
                var g = m.getGrid();
                if (g.isCovered()){ // 先揭开，再攻击
                    var stateBeforeUncover = m.getGrid().status;
                    m.getGrid().status = GridStatus.Uncovered;
                    await m.bt().fireEvent("onGridChanged", {x:m.pos.x, y:m.pos.y, subType:"gridUncovered", stateBeforeUncover:stateBeforeUncover});
                }

                await m.bt().implAddPlayerHp(-m.attrs.stealOnPlayerLeave);
            }, m);
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

    // N 回合后自爆,对玩家造成攻击力的 N 倍伤害
    static doSelfExplodeAfterNRound(m:Monster):Monster {
        var cnt = 0;
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            cnt++;
            if(cnt > m.attrs.selfExplode.cnt)
            {
                m.btAttrs.power = m.btAttrs.power * m.attrs.selfExplode.mult;
                await m.bt().implMonsterAttackPlayer(m, true);
            }
        }, m);
    }

    // 每回合增加生命值
    static doAddHpPerRound(n:number, m:Monster):Monster{
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            if(m.hp > 0)
                await m.bt().implAddMonsterHp(m, 1);

        }, m);
    }

    // 受伤害时增加攻击力
    static doAddPowerOnHurt(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onMonsterHurt", async (ps) => {
            m.btAttrs.power -= ps.dhp;
            await m.bt().fireEvent("onElemChanged", {subType:"power", e:m});
        }, m, (ps) => ps.m == m);
    }

    // 被翻开时act
    static addAIOnUncovered(act, m:Monster, condition = undefined):Monster {
        return <Monster>ElemFactory.addAI("onGridChanged", act, m, (ps) => {
                if(ps.x == m.pos.x && ps.y == m.pos.y && ps.subType == "gridUncovered")
                    return condition?condition():true;
                else 
                    return false;
                })
    }

    // 被盖上时act
    static addAIOnCovered(act, m:Monster, condition = undefined):Monster {
        return <Monster>ElemFactory.addAI("onGridChanged", act, m, (ps) => {
            if(ps.x == m.pos.x && ps.y == m.pos.y && ps.subType == "gridCovered" )
                return (condition?condition():true);
            else 
                return false;
        })
    }

    // 有新的怪物加入战场时act
    static addAIOnNewMonsterJoin(act, m:Monster, condition = undefined):Monster{
        return <Monster>ElemFactory.addAI("onGridChanged", act, m, (ps) => ps.subType == "elemAdded" && (condition?condition():true));
    }

    // 指挥官僵尸逻辑
    static doEnhanceAura(m:Monster):Monster {
        return MonsterFactory.doEnhanceOtherNewMonster(MonsterFactory.doRemoveEnhanceOnDie(MonsterFactory.doEnhanceOtherMonster(m)));
    }

    // 在场时其他怪血量攻击翻倍
    static doEnhanceOtherMonster(m:Monster):Monster {
        m["canActOnNewAdd"] = false; //此时还不能触发增强新加入的怪物的效果
        
        return MonsterFactory.addAIOnUncovered(async (ps) => {
                var n = m.map().findAllElems((e:Elem) => e.type == "CommanderZombie" && !e.getGrid().isCovered() && e != m).length;                
                if(n == 0){
                    var ms:Elem[]= [];
                    ms = m.map().findAllElems((e:Elem) => e instanceof Monster && e != m && e.type != "CommanderZombie");
                    for(var i = 0; i < ms.length; i++){
                        var theMonster = <Monster>ms[i];
                        theMonster.hp *= 2;
                        await m.bt().fireEvent("onElemChanged", {subType:"hp", e:theMonster});
                        theMonster.btAttrs.power *= 2;
                        await m.bt().fireEvent("onElemChanged", {subType:"power", e:theMonster});
                    }
                    m["canActOnNewAdd"] = true;
                }
        }, m);
    }

    // 指挥官僵尸将新加入的怪血量攻击翻倍
    static doEnhanceOtherNewMonster(m:Monster):Monster{
        return MonsterFactory.addAIOnNewMonsterJoin(async (ps) => {
            if(ps.e instanceof Monster){
                if(!ps.commandZombieActed){
                    var theMonster = ps.e;
                    theMonster.hp *= 2;
                    await m.bt().fireEvent("onElemChanged", {subType:"hp", e:theMonster});
                    theMonster.btAttrs.power *= 2;
                    await m.bt().fireEvent("onElemChanged", {subType:"power", e:theMonster});
                    ps.commandZombieActed = true; //给"onElemChanged"事件加上标记,表示该elem已经被一个指挥官僵尸增强过
                }
            }
        }, m, m["canActOnNewAdd"]);
    }

    // 移除血量翻倍效果
    static async doRemoveEnhance(m:Monster){
            var n = m.map().findAllElems((e:Elem) => e.type == "CommanderZombie" && !e.getGrid().isCovered() && e != m).length;
            if(n == 0){
                var ms:Elem[]= [];
                ms = m.map().findAllElems((e:Elem) => e instanceof Monster && e != m && e.type != "CommanderZombie");
                for(var i = 0; i < ms.length; i++){
                    var theMonster = <Monster>ms[i];
                    theMonster.hp = Math.round(theMonster.hp * 0.5);
                    await m.bt().fireEvent("onElemChanged", {subType:"hp", e:theMonster});
                    theMonster.btAttrs.power =Math.round(theMonster.btAttrs.power * 0.5);
                    await m.bt().fireEvent("onElemChanged", {subType:"power", e:theMonster});
                }
            }
            m["canActOnNewAdd"] = false;
    }

    // 死亡时移除其他怪血量攻击翻倍效果
    static doRemoveEnhanceOnDie(m:Monster):Monster {
        return <Monster>ElemFactory.addDieAI(async () => await MonsterFactory.doRemoveEnhance(m), m);
    }

    // 指挥官僵尸被盖住时也移除其他怪血量攻击翻倍效果
    static doRemoveEnhanceOnCovered(m:Monster):Monster {
        return MonsterFactory.addAIOnCovered(async () => await MonsterFactory.doRemoveEnhance(m), m);
    }

    // 出现后随机隐藏到其他空位，如果没有空位则不会隐藏
    static doHideAfterUncovered(m:Monster):Monster {
        return MonsterFactory.addAIOnUncovered(async () => {
            var g = BattleUtils.findRandomGrid(m.bt(), (g:Grid) => g.getElem() == undefined && g.isCovered());
            if(g)
                await m.bt().implElemFly(m, g.pos);

        }, m);
    }

    // 援护逻辑
    static doProtectMonsterAround(m:Monster):Monster {
        return <Monster>ElemFactory.addAIEvenCovered("preAttack", async (ps) => {
            if(m.getGrid().isCovered()){ //如果护卫所在地块还没被揭开,要揭开它但不要触发偷袭逻辑
                var stateBeforeUncover = m.getGrid().status;
                m.getGrid().status = GridStatus.Uncovered;
                await m.bt().fireEvent("onGridChanged", {x:m.pos.x, y:m.pos.y, subType:"gridUncovered", stateBeforeUncover:stateBeforeUncover});
            }
            ps.target = m;
            ps.x = m.pos.x;
            ps.y = m.pos.y;
        }, m, (ps) => 
            (ps.subType == "player2monster" || ps.subType == "monster2monster") && ps.target.type != "GuardZombie" 
            && ps.target.isHazard() && BattleUtils.isAround(m.map().getGridAt(ps.x, ps.y), m.getGrid())
        );
    }

    // 其他怪物死亡时逃进阴影
    static doHideOnOtherMonsterDie(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onElemChanged", async () => {
            var g = BattleUtils.findRandomGrid(m.bt(), (g:Grid) => g.getElem() == undefined && g.isCovered());
            if(g)
                await m.bt().implElemFly(m, g.pos);

        }, m, (ps) => ps.subType == "die" && ps.e instanceof Monster);
    }

    // 死亡时在其他地点复活一次
    static doReviveOndie(m:Monster):Monster {
        return <Monster>ElemFactory.addDieAI(async () => {
            m.cnt = m.attrs.cnt;
            if(m.cnt > 0){
                var newM = m.bt().level.createElem(m.type, {"hp":m.attrs.hp, "power":m.attrs.power ,cnt: m.attrs.cnt - 1});
                var g = BattleUtils.findRandomEmptyGrid(m.bt(), false);
                await m.bt().implAddElemAt(newM, g.pos.x, g.pos.y);
            }
        } ,m);
    }

    // 每次受到伤害，都会标记一个随机怪物
    static doMarkMonsterOnHurt(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onMonsterHurt", async () => {
            var markTarget = <Monster>BattleUtils.findRandomElems(m.bt(), 1, (m:Monster) => m.getGrid().isCovered())[0];
            var g = BattleUtils.findRandomGrid(m.bt(), (g:Grid) => g.isCovered() && g.getElem() instanceof Monster);
            await m.bt().implMark(g.pos.x, g.pos.y);
        }, m, (ps) => ps.m == m);
    }

    // 拾取周围的道具和金钱
    static doTakeItemsAround(m:Monster):Monster {
        var itemTook = false;
        var targetElems:Elem[]
        var findTarget = () => { //遍历周围8格寻找目标物品
                m.map().travel8Neighbours(m.pos.x, m.pos.y, (x, y, g:Grid)=>{
                    var e = g.getElem();
                    if(e && !e.getGrid().isCovered() && isTargetType(e)){
                        targetElems.push(e);
                    }
                });
            };

        var takeTarget = async () => { //在周围8格中随机拿走一个物品
                var targetElem = targetElems[m.bt().srand.nextInt(0, targetElems.length)];
                await m.bt().implMonsterTakeElems(m, [targetElem]);
                m.addDropItem(targetElem);
                await m.bt().fireEvent("onElemChanged", {subType:"takeItem", e:m});
                if(targetElem.type != "Coins"){
                    itemTook = true;
                }
            };

        var isTargetType = (e:Elem) => { //判断elem是否是当前可用的目标
                if(!itemTook){
                    if((e instanceof Prop || e instanceof Item || e instanceof Relic) && e.type != "Door")
                        return true;
                } else if(e.type == "Coins"){
                    return true;
                } else
                    return false;
            };

        // 在当前位置周围8格找目标,没有则在地图上找,找到后移动,移动结束在周围找目标拿走,未移动到目标则行动结束
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            targetElems = [];
            findTarget();
            if(targetElems.length > 0){
                await takeTarget();
            } else {
                var moveToTarget = ElemFactory.moveFunc(m, m.attrs.moveRange, () => {
                    var g = BattleUtils.findNearestGrid(m.map(), m.pos, 
                        (g:Grid) => !g.isCovered() && g.getElem() && isTargetType(g.getElem()));
                    return g ? g.pos : undefined;
                });
                await moveToTarget();

                findTarget();
                if(targetElems.length > 0){
                    await takeTarget();
                }
            }
        }, m);
    }

    // 在自己身边最多8个位置制造迷雾,都为迷雾则盖住自己
    static doCoverGridAround(m:Monster):Monster {
        var uncoveredGrids:Grid[];
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            uncoveredGrids = [];
            m.map().travel8Neighbours(m.pos.x, m.pos.y, (x, y, g:Grid) => {
                if(!g.isCovered()){
                    uncoveredGrids.push(g);
                }
            });
            if(uncoveredGrids.length > 0){
                var targetGrid = uncoveredGrids[m.bt().srand.nextInt(0, uncoveredGrids.length)];
                await m.bt().implCoverAt(targetGrid.pos.x, targetGrid.pos.y);
            } else {
                await m.bt().implCoverAt(m.pos.x, m.pos.y);
            }
        }, m);
    }

    // 死亡时使所有未揭开的方块带毒,持续n回合
    static doMakeCoveredGridsPoison(m:Monster):Monster {
        return <Monster>ElemFactory.addDieAI(async () => {
            var grids = m.map().findAllGrid((x, y, g:Grid) => g.isCovered());
            if(grids.length != 0){
                await m.bt().implAddBuff(m.bt().player, "BuffPoisonOnGrids", grids, m.attrs.buffCnt, m.attrs.poisonPs);
                for(var i = 0; i < grids.length; i++)
                    await m.bt().fireEvent("onGridChanged", {x:grids[i].pos.x, y:grids[i].pos.y, e:grids[i].getElem(), subType:"miasma"});
            }
        }, m);
    }

    // 偷袭时将3个物品用茧包住
    static doSwatheItemsOnSneak(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var items:Elem[] = BattleUtils.findRandomElems(m.bt(), 3, (e:Elem) => {
                return !(e instanceof Monster) && !e.getGrid().isCovered() && (Utils.indexOf(m.attrs.invalid, (ie) => e.type == ie) < 0);
            });
            var bt = m.bt();
            for(var i = 0; i < items.length; i++){
                var grid = items[i].getGrid();
                await bt.implRemoveElemAt(grid.pos.x, grid.pos.y);
                var cocoon = bt.level.createElem("Cocoon");
                cocoon.addDropItem(items[i]);
                await bt.implAddElemAt(cocoon, grid.pos.x, grid.pos.y);
                cocoon["swathedBy"] = m;
            }
        }, m);
    }

    // 会追着玩家进入下一层
    static doChaseToNextLevel(m:Monster):Monster {        
        return <Monster>ElemFactory.addAI("beforeGoOutLevel1", async () => m.bt().player.elems2NextLevel.push(m), m);
    }

    // boss 特殊逻辑
    static makeBoss(m:Monster):Monster {
        var frozenRound = 0;
        m.isBoss = true;
        m.isHazard = () => frozenRound == 0;
        m["makeFrozen"] = async (frozenAttrs) => {
            frozenRound += frozenAttrs.rounds;
            m.trapped = frozenRound > 0;
        };
        ElemFactory.addAI("onPlayerActed", async () => {
            if (frozenRound > 0) {
                frozenRound--;
                if (frozenRound == 0) // 取消冻结
                    await m.bt().fireEvent("onGridChanged", {x:m.pos.x, y:m.pos.y, e:m, subType:"unfrozen"});

                m.trapped = frozenRound > 0;
            }
        }, m);
        var priorGetElemImgRes = m.getElemImgRes;
        m.getElemImgRes = () => {
            return frozenRound > 0 ? "IceBlock" : priorGetElemImgRes();
        }
        return m;
    }

    // 商店 npc 逻辑
    static makeShopNPC(m:Monster):Monster {
        m.isHazard = () => false;
        m.canUse = () => true;
        m.canBeDragDrop = true;
        var onBuy = async (elem:Elem) => {
            var g = BattleUtils.findNearestGrid(m.bt().level.map, m.pos, (g:Grid) => !g.isCovered() && !g.getElem());
            if (g) await m.bt().implAddElemAt(elem, g.pos.x, g.pos.y);
        };

        var shopItemAndPrice;
        m.use = async () => {
            if (!shopItemAndPrice)
                shopItemAndPrice = Utils.genRandomShopItems(m.bt().player, m.attrs.shopCfg, m.bt().srand, 6);
            await m.bt().try2openShop(m, shopItemAndPrice.items, shopItemAndPrice.prices, onBuy);
            return true; // npc 不保留
        };

        return m;
    }

    // 向商人移动并攻击之
    static doMove2ShopNpcAndAttackIt(logicPoint:string, e:Elem, dist:number):Monster {
        var findShopNpc = () => e.bt().level.map.findFirstElem((elem) => elem.type == "ShopNpc");
        return MonsterFactory.doAttack(logicPoint, <Monster>ElemFactory.doMove2Target(logicPoint, e, dist, () => {
            var shopNpc = findShopNpc();
            return shopNpc ? shopNpc.pos : undefined;
        }), findShopNpc);
    }

    // 向食物移动并吃一口
    static doMove2FoodAndEatIt(logicPoint:string, e:Elem, dist:number):Monster {
        var findFood = () => {
            var map = e.bt().level.map;
            var g = BattleUtils.findNearestGrid(map, e.pos, (g:Grid) => {
                return !g.isCovered() && g.getElem() && Utils.contains(g.getElem().attrs.tags, "food");
            });

            return g ? g.getElem() : undefined;
        };

        e = ElemFactory.doMove2Target(logicPoint, e, dist, () => {
            var target = findFood();
            return target ? target.pos : undefined;
        });

        return <Monster>ElemFactory.addAI(logicPoint, async () => {
            // 找到食物
            var food = findFood();
            if (!food) return;

            // 判断距离
            var dx = Math.abs(e.pos.x - food.pos.x);
            var dy = Math.abs(e.pos.y - food.pos.y);
            if (dx + dy > 1) return;

            // 吃一口
            food.cnt--;
            if (food.cnt <= 0)
                await food.bt().implRemoveElemAt(food.pos.x, food.pos.y);
            else
                await food.bt().implNotifyElemChanged("cnt", food);    
        }, e);
    }
}
