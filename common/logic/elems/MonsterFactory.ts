class Monster extends Elem {constructor() { super();}
    public hp:number; // 血量
    public shield:number; // 护盾
    public damageShared; // 伤害被分担

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
            damageShared:{a:0, b:this.btAttrs.damageShared, c:0},
            targetFlags:[...this.btAttrs.targetFlags]
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
        else 
            this.buffs[n].overBuff(buff);
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
            m = <Monster>ElemFactory.addDieAI(async () => m.bt().implAddDeathGodStep(m.attrs.deathStep, m), m);
            m = <Monster>ElemFactory.addAI("beforeGoOutLevel1", () => m.clearAIAtLogicPoint("onPlayerActed"), m);
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

        // "NormalZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(MonsterFactory.doMove2FoodAndEatIt("onPlayerActed", this.createMonster(attrs), attrs.moveRange))), //普通僵尸
        "NormalZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(MonsterFactory.doMove2ShopNpcAndAttackIt("onPlayerActed", this.createMonster(attrs), attrs.moveRange))), //普通僵尸
        "GoblinThief": (attrs) => MonsterFactory.doSneakStealMoney(false, MonsterFactory.doAttackBack(this.createMonster(attrs))), //哥布林窃贼
        "HoundZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //猎犬僵尸
        "Vampire": (attrs) => MonsterFactory.doSneakSuckBlood(MonsterFactory.doAttackBack(this.createMonster(attrs))), //吸血鬼
        "DancerZombie": (attrs) => MonsterFactory.doSneakSummon(MonsterFactory.doAttackBack(this.createMonster(attrs))), //舞王僵尸
        "GluttonyZombie": (attrs) => MonsterFactory.doSneakTakeItems(MonsterFactory.doAttackBack(this.createMonster(attrs)), false), //暴食僵尸
        "Gengar": (attrs) => MonsterFactory.doAttackOnPlayerLeave(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //耿鬼
        "BombAbomination": (attrs) => MonsterFactory.doSelfExplodeAfterNRound(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //自爆憎恶
        "EyeDemon": (attrs) => MonsterFactory.doUncoverGridOnDie(2, MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //眼魔
        "RandomEggZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //彩蛋僵尸
        "LustZombie": (attrs) => MonsterFactory.doSneakReduseDeathStep(15, MonsterFactory.doAttackBack(this.createMonster(attrs))), //色欲僵尸
        "CommanderZombie": (attrs) => MonsterFactory.doEnhanceAura(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //指挥官僵尸
        "RageZombie": (attrs) => MonsterFactory.doAddPowerOnHurt(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //狂暴僵尸
        "HideZombie": (attrs) => MonsterFactory.doHideAfterUncovered(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //隐匿僵尸
        "BallShito": (attrs) => MonsterFactory.doProtectMonsterAround(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //圆球使徒
        "ReviveZombie": (attrs) => MonsterFactory.doRecoverSanOnDie(MonsterFactory.doReviveOndie(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))))), //复生僵尸
        "CowardZombie": (attrs) => MonsterFactory.doHideOnOtherMonsterDie(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //胆怯僵尸
        "MarkZombie":  (attrs) => MonsterFactory.doMarkMonsterOnHurt(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //标记僵尸
        "ConfusionZombie": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //疑惑僵尸
        "GreedyZombie": (attrs) => MonsterFactory.doTakeItemsAround(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //贪婪僵尸
        "Mummy": (attrs) => MonsterFactory.doCoverGridAround(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //木乃伊
        "PoisonJellyfish": (attrs) => MonsterFactory.doMakeCoveredGridsPoison(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //毒性水母
        "SkeletonKing": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //骷髅王僵尸
        "SwatheZombie": (attrs) => MonsterFactory.doSwatheItemsOnSneak(MonsterFactory.doAttackBack(this.createMonster(attrs))), //缠绕僵尸
        "BoxMonster": (attrs) => MonsterFactory.addRandomOnDie(2, MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //宝箱怪
        "Ghost": (attrs) => MonsterFactory.doChaseToNextLevel(MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //幽灵
        "RedSlime": (attrs) => MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs))), //红色史莱姆
        "GreenSlime": (attrs) => MonsterFactory.doAddHpPerRound(Math.floor(attrs.hp * 0.2) > 1 ? Math.floor(attrs.hp * 0.2) : 1, MonsterFactory.doSneakAttack(MonsterFactory.doAttackBack(this.createMonster(attrs)))), //绿色史莱姆
        "ShopNpc": (attrs) => MonsterFactory.makeShopNPC(this.createMonster(attrs)),
        "Gardener": (attrs) => this.createMonster(attrs), // 测试用园艺师

        "SlimeKing": (attrs) => {
            var m = this.createMonster(attrs);
            MonsterFactory.makeBoss(
                MonsterFactory.doSneakAttack(
                    MonsterFactory.doAttackBack(
                        MonsterFactory.doAttack("onPlayerActed", m, () => m.bt().player, attrs.attackInterval, () => !m.trapped, {a:3, b:0, c:0}), 
                    () => !m.trapped)));
            m = MonsterFactory.doSummonSlimesOnHalfHp(m);
            m = MonsterFactory.doAddHpPerRound(Math.floor(attrs.hp * 0.05) > 1 ? Math.floor(attrs.hp * 0.05) : 1, m);
            m["halfHp"] = m.hp / 2;
            return m;
        },

        "BrainOfCthulhu": (attrs) => {
            var m = this.createMonster(attrs);
            MonsterFactory.makeBoss(
                MonsterFactory.doSneakAttack(
                    MonsterFactory.doAttackBack(
                        MonsterFactory.doAttack("onPlayerActed", m, () => m.bt().player, attrs.attackInterval, () => !m.trapped, {a:2, b:0, c:0}), 
                    () => !m.trapped)));
            m = MonsterFactory.doEnhanceAura(m);
            m = MonsterFactory.doMinusSanPerRound(m);
            m = MonsterFactory.doHideMonsterAttrsOnView(m);
            m = MonsterFactory.doHideHazardNumberOnView(m);
            m = MonsterFactory.doChangeMonsterImg(m);
            m = MonsterFactory.doAttackRandomGrid(m);
            m = MonsterFactory.doRemoveSanEffectAfterDie(m);
            return m;
        },

        "CharmedMonster": (attrs) => this.createMonster(attrs),
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

    // 获取怪物的当前attrs
    static async getCurrentAttrs(m:Monster) {
        var attrs;
        var cm:Monster;
        attrs = m.attrs;
        attrs["hp"] = m.hp;
        attrs["shield"] = m.shield;

        var attackerAttrs = await m.bt().calcMonsterAttackerAttrs(m);
        var power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
        attrs["power"] = power;
        return attrs;
    }

    // 创建被魅惑的怪物
    static async createCharmedMonster(m:Monster, dattrs) {
        var attrs = await this.getCurrentAttrs(m);
        if(dattrs)
            for (var dattr of dattrs)
                attrs[dattr.type] += dattr.num;
                
        var cm = <Monster>m.bt().level.createElem("CharmedMonster", attrs);
        cm.type = m.type + "Charmed";
        cm["Charmed"] = "normal";
        cm.getElemImgRes = m.getElemImgRes;
        cm.dropItems = m.dropItems;
        cm.canUse = () => false;
        cm.hazard = false;
        cm.barrier = false;
        cm.use = () => false;
        cm.canBeDragDrop = true;
        cm = MonsterFactory.doAttackBack(cm);// 能反击
        cm = MonsterFactory.doAttack("onPlayerActed", cm, () => {
            var ms = cm.map().findAllElems((e:Elem) => 
                 e instanceof Monster && !e.getGrid().isCovered() && (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && cm.inAttackRange(e)
            );
            if (ms.length == 0) return undefined;

            return ms[cm.bt().srand.nextInt(0, ms.length)];
        });
        if (m.attrs.specialCharmed){
            cm["Charmed"] = "special";
            switch(m.type){
                case "BombAbomination":{                    
                    cm = MonsterFactory.doSelfExplodeAfterNRound(cm);
                    cm["cnt"] = m["cnt"];
                    break;
                }
                case "EyeDemon":{
                    cm = MonsterFactory.doUncoverGridOnDie(2, cm);
                    break;
                }
            }

        }
        return cm;
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
    static addSneakAI(act, m:Monster, isNormalAttack:boolean = false):Monster {
        return <Monster>ElemFactory.addAI("onGridChanged", 
            async () => await m.bt().implMonsterSneak(m, act, isNormalAttack), m,
                (ps) => !ps.suppressSneak && ps.x == m.pos.x && ps.y == m.pos.y && ps.subType == "gridUncovered" && ps.stateBeforeUncover != GridStatus.Marked);
    }

    // 偷袭：攻击
    static doSneakAttack(m:Monster):Monster {
        // 怪物偷袭，其实并没有 Sneak 标记，不影响战斗计算过程
        return MonsterFactory.addSneakAI(async () => m.bt().implMonsterAttackTargets(m, [m.bt().player]), m, true);
    }

    // 偷袭：偷钱
    static doSneakStealMoney(giveback:Boolean, m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            await m.bt().implAddMoney(-Math.floor(m.bt().player.money * m.attrs.steal.percent / 100) - m.attrs.steal.num, m);
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
    static doSneakTakeItems(m:Monster, dropOnDie:boolean):Monster {
        return MonsterFactory.addSneakAI(async () => {
            // 当怪物身上有非金币的掉落物时,不要再能拿走东西.出现的话需要修改该怪物配置以避免这种情况.
            var canTake = () => {
                if (!dropOnDie)
                    return true;
                else
                    for (var d of m.dropItems)
                        if (d.type != "Coins")
                            return false;

                return true;
            };
            Utils.assert(canTake(), m.type + "has a dropItem that isn't Coins, cannot take any Item.");
            var eatNum = m.attrs.eatNum ? m.attrs.eatNum : 1;
            // 一些相对有较为固定的感觉的物品不要被拿走了,比如后续可能出现的祭坛等.
            var fobiddenItems = ["Key", "Door", "Cocoon", "TreasureBox", "Hole", "Rock"];
            var fobiddenItemsDropOnDie = ["Door", "Cocoon", "TreasureBox", "Hole", "Rock"];
            var es = BattleUtils.findRandomElems(m.bt(), eatNum, (e:Elem) => {
                if(dropOnDie)
                    return !(e instanceof Monster) && !e.getGrid().isCovered() && (Utils.indexOf(fobiddenItemsDropOnDie, (s:string) => e.type == s) < 0);
                else
                    return !(e instanceof Monster) && !e.getGrid().isCovered() && (Utils.indexOf(fobiddenItems, (s:string) => e.type == s) < 0);
            });            
            if(es.length == 0) return;

            await m.bt().implMonsterTakeElems(m, es, dropOnDie);
        }, m);
    }

    // 偷袭：召唤
    static doSneakSummon(m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            var ss = m.attrs.summons ? m.attrs.summons : [];
            var ms = [];
            var gs = BattleUtils.findRandomGrids(m.bt(), (g:Grid) => !g.isCovered() && !g.getElem(), ss.length);
            gs.forEach((g, index) => {
                var sm = m.bt().level.createElem(ss[index]);
                ms.push(sm);
            })
            await m.bt().fireEvent("summonByDancer", {m:m, ms:ms, gs:gs});
            for (var i = 0; i < ms.length; i++)
                await m.bt().implAddElemAt(ms[i], gs[i].pos.x, gs[i].pos.y);
        }, m);
    }

    //偷袭：死神提前N回合到来
    static doSneakReduseDeathStep(n:number, m:Monster):Monster {
        return MonsterFactory.addSneakAI(async () => {
            await m.bt().implAddDeathGodStep(-n, m);
        }, m);
    }

    // 被攻击时反击一次
    static doAttackBack(m:Monster, condition = () => true):Monster {
        return <Monster>ElemFactory.addAI("onAttacked", async (ps) => {
            if (Utils.contains(ps.attackerAttrs.attackFlags, "immuneAttackBack")) return;
            if (Utils.contains(ps.attackerAttrs.attackFlags, "attackBack")) return;

            var addFlags = ["attackBack"];
            if (Utils.contains(ps.targetAttrs.targetFlags, "Sneaked"))
                addFlags.push("back2sneak");

            await m.bt().implMonsterAttackTargets(m, [ps.attackerAttrs.owner], undefined, false, addFlags);
        }, m, (ps) => {
            return !ps.weapon && ps.targetAttrs.owner == m && !m.isDead() && condition()
        });
    }

    // 攻击一次
    static doAttack(logicPoint:string, m:Monster, findTarget, attackInterval:number = 0, condition = () => true, extraPowerABC = {a:0, b:0, c:0}):Monster {
        attackInterval = attackInterval ? attackInterval : 0;
        var interval = 0; // 攻击行为的间隔回合记数
        return <Monster>ElemFactory.addAI(logicPoint, async () => {
            // 计算攻击间隔
            var attackIntervalPs = {subType:"setAttackInterval", m:m, dattackInterval:{a:0, b:0, c:0}};
            m.bt().triggerLogicPointSync("onCalcAttackInterval", attackIntervalPs);
            var caledAttackInterval = (attackInterval + attackIntervalPs.dattackInterval.b) * (1 + attackIntervalPs.dattackInterval.a) + attackIntervalPs.dattackInterval.c;        
            caledAttackInterval = caledAttackInterval < 0 ? 0 : caledAttackInterval;            

            if (interval < caledAttackInterval){
                interval++;
                m["attackInterval"] = caledAttackInterval - interval + 1;
                await m.bt().fireEvent("onElemChanged", {subType:"attackInterval", e:m});
            }
            else{
                interval = interval - caledAttackInterval + 1;
                m["attackInterval"] = caledAttackInterval - interval + 1;
                await m.bt().fireEvent("onElemChanged", {subType:"attackInterval", e:m});
                if (condition()) {
                    var target = findTarget();
                    if (!target) return;

                    // 如果是打怪，需要判断射程
                    if (target instanceof Monster && !m.inAttackRange(target)) return;
                    
                    await m.bt().implMonsterAttackTargets(m, [target], extraPowerABC, false, ["roundedAttacking"]);
                }
            }
        }, m);
    }

    // 玩家离开时，偷袭玩家
    static doAttackOnPlayerLeave(m:Monster):Monster{
        return <Monster>ElemFactory.addAIEvenCovered("beforeGoOutLevel1", async () => {
                var player = m.bt().player;
                if (player.isDead())
                    return;

                var g = m.getGrid();
                if (g.isCovered()){ // 先揭开，再攻击
                    var stateBeforeUncover = m.getGrid().status;
                    m.getGrid().status = GridStatus.Uncovered;
                    await m.bt().fireEvent("onGridChanged", {x:m.pos.x, y:m.pos.y, subType:"gridUncovered", stateBeforeUncover:stateBeforeUncover});
                }

                await m.bt().implMonsterAttackTargets(m, [player], undefined, false, ["attackOnPlayerLeave"]);
            }, m);
    }

    //死亡时翻开N个空地块
    static doUncoverGridOnDie(n:number, m:Monster):Monster{
        return <Monster>ElemFactory.addDieAI(async () => {
            var gs = BattleUtils.findRandomGrids(m.bt(), (g:Grid) => g.isCovered() && !g.getElem(), n);
            var pts = Utils.map(gs, (g:Grid) => g.pos);

            await m.bt().fireEvent("onEyeDemonUncoverGrids", {m:m, pts:pts});
            for (var pt of pts)
                await m.bt().uncover(pt.x, pt.y, true, true);
        }, m);
    }

    // N 回合后自爆,一个区域内造成攻击力的 N 倍伤害
    static doSelfExplodeAfterNRound(m:Monster):Monster {
        m["cnt"] = 0;
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            m["cnt"]++;
            m["attackInterval"] = m.attrs.selfExplode.cnt - m["cnt"] + 1; 
            await m.bt().fireEvent("onElemChanged", {subType:"attackInterval", e:m})
            if(m["cnt"] > m.attrs.selfExplode.cnt)
                await m.bt().implMonsterDoSelfExplode(m, {a:m.attrs.selfExplode.mult - 1, b:0, c:0}, false);            
        }, m);
    }

    // 每回合增加生命值
    static doAddHpPerRound(n:number, m:Monster):Monster{
        m["canAct"] = false;
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            if(m.hp > 0 && m["canAct"])
                await m.bt().implAddMonsterHp(m, 1);

            m["canAct"] = true;
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
                return condition ? condition() : true;
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

    // 有新的元素加入战场时act
    static addAIOnNewElemsJoin(act, m:Monster, condition = undefined):Monster{
        return <Monster>ElemFactory.addAIEvenCovered("onGridChanged", act, m, (ps) => ps.subType == "elemAdded" && (condition?condition():true));
    }

    // 增强光环逻辑
    static doEnhanceAura(m:Monster):Monster {
        return MonsterFactory.doEnhanceOtherNewMonster(MonsterFactory.doRemoveEnhanceOnDie(MonsterFactory.doEnhanceOtherMonster(m)));
    }

    // 在场时其他怪血量攻击翻倍
    static doEnhanceOtherMonster(m:Monster):Monster {
        m["canActOnNewAdd"] = false; //此时还不能触发增强新加入的怪物的效果
        
        return MonsterFactory.addAIOnUncovered(async (ps) => {
                var n = m.map().findAllElems((e:Elem) => e.type == m.type && !e.getGrid().isCovered() && e != m).length;                
                if(n == 0){
                    var ms:Elem[]= [];
                    ms = m.map().findAllElems((e:Elem) => e instanceof Monster && e != m && e.isHazard() && e.type != m.type);
                    for(var theMonster of <Monster[]>ms){
                        theMonster.hp *= 2;
                        await m.bt().fireEvent("onElemChanged", {subType:"hp", e:theMonster});
                        theMonster.btAttrs.power *= 2;
                        await m.bt().fireEvent("onElemChanged", {subType:"power", e:theMonster});
                    }
                    m["canActOnNewAdd"] = true;
                }
        }, m);
    }

    // 将新加入的怪血量攻击翻倍
    static doEnhanceOtherNewMonster(m:Monster):Monster{
        return MonsterFactory.addAIOnNewElemsJoin(async (ps) => {
            if(ps.e instanceof Monster && ps.e.isHazard()){
                if(!ps.enhancedByAura){
                    var theMonster = ps.e;
                    theMonster.hp *= 2;
                    await m.bt().fireEvent("onElemChanged", {subType:"hp", e:theMonster});
                    theMonster.btAttrs.power *= 2;
                    await m.bt().fireEvent("onElemChanged", {subType:"power", e:theMonster});
                    ps.enhancedByAura = true; //给"onElemChanged"事件加上标记,表示该elem已经被增强过
                }
            }
        }, m, () => m["canActOnNewAdd"] && !m.getGrid().isCovered());
    }

    // 移除血量翻倍效果
    static async doRemoveEnhance(m:Monster){
            var n = m.map().findAllElems((e:Elem) => e.type == m.type && !e.getGrid().isCovered() && e != m).length;
            if(n == 0){
                var ms:Elem[]= [];
                ms = m.map().findAllElems((e:Elem) => e instanceof Monster && e.isHazard() && e != m && e.type != m.type);
                for(var theMonster of <Monster[]>ms){
                    theMonster.hp = Math.ceil(theMonster.hp * 0.5);
                    await m.bt().fireEvent("onElemChanged", {subType:"hp", e:theMonster});
                    theMonster.btAttrs.power = Math.ceil(theMonster.btAttrs.power * 0.5);
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
            var g = BattleUtils.findRandomGrids(m.bt(), (g:Grid) => g.getElem() == undefined && g.isCovered())[0];
            if(g)
                await m.bt().implElemFly(m, g.pos);

        }, m);
    }

    // 援护逻辑
    static doProtectMonsterAround(m:Monster):Monster {
        var filter = (tar) => {            
            return !(tar instanceof Player) 
                && tar.type != "BallShito"
                && tar.isHazard() && BattleUtils.isAround(m.map().getGridAt(tar.pos.x, tar.pos.y), m.getGrid());}

        return <Monster>ElemFactory.addAIEvenCovered("onAttacking", async (ps) => {
            var tarN = Utils.indexOf(ps.targets, filter);
            Utils.assert(tarN >= 0, "can not find the protect aim");

            if(m.getGrid().isCovered()) //如果护卫所在地块还没被揭开,要揭开它但不要触发偷袭逻辑
                await m.bt().uncover(m.pos.x, m.pos.y, true);
            
            ps.targets[tarN] = m; // 变更目标
        }, m, (ps) => Utils.filter(ps.targets, filter).length > 0);
    }

    // 其他怪物死亡时逃进阴影
    static doHideOnOtherMonsterDie(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onElemChanged", async () => {
            var g = BattleUtils.findRandomGrids(m.bt(), (g:Grid) => g.getElem() == undefined && g.isCovered())[0];
            if(g)
                await m.bt().implElemFly(m, g.pos);

        }, m, (ps) => ps.subType == "die" && ps.e instanceof Monster);
    }

    // 死亡时在其他地点复活一次
    static doReviveOndie(m:Monster):Monster {
        return <Monster>ElemFactory.addDieAI(async () => {
            if(m["reviveCnt"] > 0 || m["reviveCnt"] == undefined){
                var g = BattleUtils.findRandomEmptyGrid(m.bt(), false);
                var newM = await m.bt().implReviveElemAt(m.type, undefined, g.pos.x, g.pos.y);
                if(newM)
                newM["reviveCnt"] = m["reviveCnt"] ? m["reviveCnt"] - 1 : m.attrs.reviveCnt - 1;
            }
        } ,m);
    }

    // 每次受到伤害，都会标记一个随机怪物
    static doMarkMonsterOnHurt(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onMonsterHurt", async () => {
            var markTarget = <Monster>BattleUtils.findRandomElems(m.bt(), 1, (m:Monster) => m.getGrid().isCovered())[0];
            var g = BattleUtils.findRandomGrids(m.bt(), (g:Grid) => g.isCovered() && !g.isMarked() && g.getElem() instanceof Monster)[0];
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
                await m.bt().implMonsterTakeElems(m, [targetElem], true);
                await m.bt().fireEvent("onElemChanged", {subType:"takeItem", e:m});
                if(targetElem.type != "Coins"){
                    itemTook = true;
                }
            };

        var isTargetType = (e:Elem) => { //判断elem是否是当前可用的目标
                if(!itemTook){
                    if((e instanceof Prop || e instanceof Item || e instanceof Relic) && e.type != "Door" && e.type != "TreasureBox" && e.type != "Cocoon" )
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
                var e = g.getElem();
                if(!g.isCovered() &&  (!e || (!e.isBig() && !e["linkTo"] && (!(e instanceof Monster) || e.isHazard())))){
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
            if(grids.length != 0) {
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
                var e = items[i];
                var grid = e.getGrid();
                var cocoon = bt.level.createElem("Cocoon");
                cocoon.addDropItem(items[i]);
                await bt.fireEvent("onSwatheItemWithCocoon", {m:m, e:e});
                await bt.implRemoveElemAt(grid.pos.x, grid.pos.y);
                await bt.implAddElemAt(cocoon, grid.pos.x, grid.pos.y);
                cocoon["swathedBy"] = m;
            }
        }, m);
    }

    // 会追着玩家进入下一层
    static doChaseToNextLevel(m:Monster):Monster {        
        return <Monster>ElemFactory.addAI("beforeGoOutLevel1", async () => m.bt().implElemFollow2NextLevel(m), m);
    }

    // 宝箱怪死亡时添加随机掉落
    static addRandomOnDie(n:number, m:Monster):Monster {
        return <Monster>ElemFactory.addDieAI(async () => {
            var rdpsOnDie = m.attrs.rdpsOnDie;
            if(rdpsOnDie.length > n){
                var dnum = rdpsOnDie.length - n
                for(var i = 0; i < dnum; i++){
                    var rdpsOnDie = Utils.removeAt(rdpsOnDie, m.bt().srand.nextInt(0, rdpsOnDie.length));
                }
            }
            for (var rdpOnDie of rdpsOnDie){
                var dropItems = [];
                var rdpOnDie = GCfg.getRandomDropGroupCfg(rdpOnDie);
                var dropItems = Utils.randomSelectByWeightWithPlayerFilter(m.bt().player, rdpOnDie.elems, m.bt().srand, rdpOnDie.num[0], rdpOnDie.num[1], true, undefined);
                for(var dpType of dropItems){
                    if(!dpType) return;

                    var g = BattleUtils.findRandomEmptyGrid(m.bt(), false);
                    if(!g) return;

                    var dropItem = m.bt().level.createElem(dpType);
                    await m.bt().implAddElemAt(dropItem, g.pos.x, g.pos.y);
                }
            }
        }, m);
    }

    // 为玩家分摊伤害
    static doShareDamageOnPlayerHurt(damageShared:number, m:Monster):Monster {
        m.isHazard = () => false;
        m = <Monster>ElemFactory.addAI("onCalcAttacking", (ps) => {
            ps.targetAttrs.damageShared.a += damageShared;
            ps["damageShared"] = true;
            ps.targetAttrs["damageSharedMonster"] = m;
        }, m, (ps) => {
            return ps.subType == "monster2targets" && ps.targetAttrs.owner instanceof Player && !ps["damageShared"]}, true, true);
        return m;
    }

    // 受攻击时有x%的几率免疫伤害
    static doImmunizeDamageProb(n:number, m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onCalcAttacking", (ps) => {
            if(m.bt().srand.next100() < n)
                ps.targetAttrs.targetFlags.push("cancelAttack");
        }, m, (ps) => ps.targetAttrs.owner == m, true, true);
    }

    // // 史莱姆之王死前将钥匙清空,准备分配给小史莱姆
    // static doClearKeys(m:Monster):Monster {
    //     m = <Monster>ElemFactory.addBeforeDieAI(() => {
    //         m["keys"] = Utils.filter(m.dropItems, (e:Elem) => e.type == "Key");
    //         m.dropItems = [];
    //     }, m);
    //     return m;
    // }

    // // 史莱姆之王死亡时召唤四个特殊史莱姆
    // static doSummonSlimesOnDie(m:Monster):Monster {
    //     m = <Monster>ElemFactory.addAfterDieAI(async () => {
    //         Utils.assert(m.type == "SlimeKing", "this can only effect on SlimeKing");
    //         var bt = m.bt();
    //         var poses = [];
    //         for(var i = 0; i < 2; i++){
    //             for(var j = 0; j < 2; j++){
    //                 var newPos = {x:0, y:0};
    //                 newPos.x = m.pos.x + i;
    //                 newPos.y = m.pos.y + j;
    //                 poses.push(newPos);
    //             }
    //         }
    //         var slimeTypes = ["RedSlime", "GreenSlime", "GreenSlime", "RedSlime"];
    //         for(var i = 0; i < 4; i++){
    //             var slime = <Monster>bt.level.createElem(slimeTypes[i]);
    //             slime = MonsterFactory.doSummonSlimeKing(slime);
    //             if (m["keys"][i])
    //                 slime.dropItems = [m["keys"][i]];
    //             slime["lockDoor"] = true;
    //             await bt.implAddElemAt(slime, poses[i].x, poses[i].y);
    //         }
    //     }, m)
    //     return m;
    // }

    // 史莱姆之王半血时分裂为4个小史莱姆
    static doSummonSlimesOnHalfHp(m:Monster):Monster{
        m = <Monster>ElemFactory.addAI("onMonsterHurt", async () => {
            if(m.hp >= m["halfHp"]) return;

            var bt = m.bt();
            var poses = [];
            var kingPos = m.pos;
            for(var i = 0; i < 2; i++){
                for(var j = 0; j < 2; j++){
                    var newPos = {x:0, y:0};
                    newPos.x = m.pos.x + i;
                    newPos.y = m.pos.y + j;
                    poses.push(newPos);
                }
            }
            m["keys"] = Utils.filter(m.dropItems, (e:Elem) => e.type == "Key");
            m.dropItems = [];
            await bt.implRemoveElemAt(m.pos.x, m.pos.y);
            var slimeTypes = ["RedSlime", "GreenSlime", "GreenSlime", "RedSlime"];
            for(var i = 0; i < 4; i++){
                var slime = <Monster>bt.level.createElem(slimeTypes[i]);
                slime.hp = Math.ceil(m.hp / 4);
                slime = MonsterFactory.doSummonSlimeKing(slime);
                if (m["keys"][i])
                    slime.dropItems = [m["keys"][i]];
                slime["lockDoor"] = true;
                slime["kingPos"] = kingPos;
                await bt.implAddElemAt(slime, poses[i].x, poses[i].y);
            }
        }, m, (ps) => ps.m == m)
        return m;
    }

    // 小史莱姆合成新史莱姆之王
    static doSummonSlimeKing(m:Monster):Monster {
        m = <Monster>ElemFactory.addAIEvenCovered("onPlayerActed", async () => {
            if (!m.isInMap()) return;

            if(!m["summonKing"])
                m["summonKing"] = 0;

            m["summonKing"] ++;

            // 4回合后合成史莱姆之王
            if(m["summonKing"] > 4){
                // 获取新史莱姆之王所应拿走的钥匙和覆盖的位置
                var bt = m.bt();
                var poses = [];
                var keys = [];
                var slimes = bt.level.map.findAllElems((e:Elem) => e["summonKing"] && (e.type == "GreenSlime" || e.type == "RedSlime"));
                var kingPos = m["kingPos"];
                var posOffsets = [{x:0, y:0}, {x:1, y:0}, {x:0, y:1}, {x:1, y:1}];                
                posOffsets.forEach((posOffset, index) => {
                    var pos = {x:0, y:0};
                    pos.x = kingPos.x + posOffset.x;
                    pos.y = kingPos.y + posOffset.y;
                    poses.push(pos);
                    var elem = bt.level.map.getElemAt(pos.x, pos.y);                    
                    if (!!elem && elem.type == "Key")
                        keys.push(elem);
                    else if (!!elem && elem["summonKing"]){
                        var key = Utils.filter(elem.dropItems, (k:Elem) => k.type == "Key")[0];
                        if(key)
                            keys.push(key);
                    }
                });

                // 移除这些位置上的元素
                for(var p of poses) {
                    if (bt.level.map.getElemAt(p.x, p.y)) {
                        await bt.implRemoveElemAt(p.x, p.y);
                        if (bt.level.map.getGridAt(p.x, p.y).isCovered())
                            await bt.uncover(p.x, p.y, true);
                    }
                }

                // 创建新的史莱姆之王,hp为剩余的之前召唤的小史莱姆之和
                var king = <Monster>bt.level.createElem("SlimeKing");
                var hp = 0;
                for (var slime of <Monster[]>slimes)
                    hp += slime.hp;

                king.hp = hp;
                king["halfHp"] = king.hp / 2;
                for(var key of keys)
                    king.addDropItem(key);
                
                await bt.implAddElemAt(king, kingPos.x, kingPos.y);
            }
        }, m);
        return m;
    }

    // 赋予玩家san值概念，未现身的时候san值就会一直降低，san值初始为100，每回合降低，低于100时开始显示迷惑头像
    static doMinusSanPerRound(m:Monster):Monster {
        return <Monster>ElemFactory.addAIEvenCovered("onPlayerActed", async () => {
            if(!m.bt().player["san"])
                m.bt().player["san"] = 100;
            
            m.bt().player["san"] = (m.bt().player["san"] - 1) > 0 ? (m.bt().player["san"] - 1) : 0;
            
            await m.bt().fireEvent("onPlayerChanged", {"subType":"san"});
            await m.bt().triggerLogicPoint("onPlayerChanged", {"subType":"san"});
        }, m);
    }

    // san值低于70：本层的所有地图数字都会显示为问号
    static doHideHazardNumberOnView(m: Monster): Monster {
        m = <Monster>ElemFactory.addAIEvenCovered("onPlayerChanged", async () => {
            if (!m.bt().player["san"]) return;
            else if (m.bt().player["san"] < 70 && m["hideHazardStatus"] != "hide") {
                var ms = m.bt().level.map.findAllElems((e: Elem) => e instanceof Monster && e.type != "PlaceHolder" && !e.isBoss && e.isHazard());
                for (var monster of ms)
                    monster["hideHazardNumber"] = true;

                m["hideHazardStatus"] = "hide";
                m.bt().fireEvent("refreshMap");
            }
            else if (m.bt().player["san"] >= 70 && m["hideHazardStatus"] != "show") {
                var ms = m.bt().level.map.findAllElems((e: Elem) => e instanceof Monster && e.type != "PlaceHolder" && !e.isBoss && e.isHazard());
                for (var monster of ms)
                    monster["hideHazardNumber"] = false;

                m["hideHazardStatus"] = "show";
                m.bt().fireEventSync("refreshMap");
            }
        }, m, (ps) => ps.subType == "san");
        m = MonsterFactory.doHideHazardNumberOnNewMonsterAdded(m);
        return m;
    }

    // 新加入的怪也要使地图数字隐藏
    static doHideHazardNumberOnNewMonsterAdded(m:Monster):Monster {
        return MonsterFactory.addAIOnNewElemsJoin(async (ps) => {
            if (!m.bt().player["san"]) return;
            if (ps.e instanceof Monster && !ps.e.isBoss && ps.e.type != "PlaceHolder" && ps.e.isHazard()) {
                var newMonster = ps.e;
                if (m.bt().player["san"] < 70)
                    newMonster["hideHazardNumber"] = true;
            }
        }, m)
    }

    // san值低于35：怪物的所有属性都显示成问号
    static doHideMonsterAttrsOnView(m:Monster):Monster {
        m = <Monster>ElemFactory.addAIEvenCovered("onPlayerChanged", async () => {
            if (!m.bt().player["san"]) return;
            else if (m.bt().player["san"] < 35 && m["hideAttrsStatus"] != "hide"){
                var ms = m.bt().level.map.findAllElems((e:Elem) => e instanceof Monster && !e.isBoss && e.type != "PlaceHolder" && e.isHazard());
                for (var monster of ms)
                    monster["hideMonsterAttrs"] = true;

                m["hideAttrsStatus"] = "hide";
            }
            else if(m.bt().player["san"] >= 35 && m["hideAttrsStatus"] != "show") {
                var ms = m.bt().level.map.findAllElems((e:Elem) => e instanceof Monster && !e.isBoss && e.type != "PlaceHolder" && e.isHazard());
                for (var monster of ms)
                    monster["hideMonsterAttrs"] = false;
                
                m["hideAttrsStatus"] = "show";
            }
        }, m, (ps) => ps.subType == "san");
        m = MonsterFactory.doHideMonsterAttrsOnNewMonsterAdded(m);
        return m;
    }

    // 新加入的怪的属性也要显示为问号
    static doHideMonsterAttrsOnNewMonsterAdded(m:Monster):Monster {
        return MonsterFactory.addAIOnNewElemsJoin(async (ps) => {
            if (!m.bt().player["san"]) return;
            if (ps.e instanceof Monster && !ps.e.isBoss && ps.e.type != "PlaceHolder" && ps.e.isHazard()) {
                var newMonster = ps.e;
                if (m.bt().player["san"] < 35)
                    newMonster["hideMonsterAttrs"] = true;
            }
        }, m)
    }

    // san值为0：你的攻击将随机点击可点击的地方
    static doAttackRandomGrid(m:Monster):Monster {
        return <Monster>ElemFactory.addAIEvenCovered("onPlayerTry2AttackAt", async (ps) => {
            if (!m.bt().player["san"]) return;
            else if (m.bt().player["san"] <= 0){
                var gs = m.bt().level.map.findAllGrid((x, y, g:Grid) => {
                    var e = g.getElem();
                    return g.isUncoveredOrMarked() && !!e && e instanceof Monster && e.isHazard();
                })
                if(gs.length > 0){
                    var g = gs[m.bt().srand.nextInt(0, gs.length)];
                    ps.x = g.pos.x;
                    ps.y = g.pos.y;
                }
            }
        }, m, (ps) => !ps.weapon);
    }

    // boss被翻开后本关的所有普通怪物都显示为克苏鲁的触手
    static doChangeMonsterImg(m:Monster):Monster {
        m = <Monster>ElemFactory.addAIEvenCovered("onGridChanged", async () => {
            var ms = m.bt().level.map.findAllElems((e:Elem) => e instanceof Monster && !e.isBoss && e.type != "PlaceHolder" && e.isHazard());
            var tentacle = m.bt().level.createElem("ReviveZombie");
            for (var monster of ms){
                monster["origGetElemImgRes"] = monster.getElemImgRes;
                monster.getElemImgRes = tentacle.getElemImgRes;
                await m.bt().fireEvent("onElemChanged", {subType:"elemImgChanged", e:monster});
            }
        }, m, (ps) => ps.x == m.pos.x && ps.y == m.pos.y && ps.subType == "gridUncovered");
        m = MonsterFactory.doChangeNewMonsterImg(m);
        return m;
    }

    // 新加入的怪显示为克苏鲁的触手
    static doChangeNewMonsterImg(m:Monster):Monster {
        return MonsterFactory.addAIOnNewElemsJoin(async (ps) => {
            if (m.getGrid().isCovered()) return;
            if (ps.e instanceof Monster && !ps.e.isBoss && ps.e.type != "PlaceHolder" && ps.e.isHazard()) {
                var newMonster = ps.e;
                var tentacle = m.bt().level.createElem("ReviveZombie");
                newMonster["origGetElemImgRes"] = newMonster.getElemImgRes;
                newMonster.getElemImgRes = tentacle.getElemImgRes;
                await m.bt().fireEvent("onElemChanged", { subType: "elemImgChanged", e: newMonster });
            }
        }, m);
    }

    // 克苏鲁之脑每5个回合在随机位置召唤一只克苏鲁的触手
    static doSummonTentaclePer5Rounds(m:Monster):Monster {
        return <Monster>ElemFactory.addAI("onPlayerActed", async () => {
            if(!m["summonCD"])
                m["summonCD"] = 0;
            
            m["summonCD"] += 1;
            if(m["summonCD"] >= 5){
                var g = BattleUtils.findRandomEmptyGrid(m.bt());
                if(g){
                    var tentacle = m.bt().level.createElem("ReviveZombie");
                    await m.bt().implAddElemAt(tentacle, g.pos.x, g.pos.y);
                }
                m["summonCD"] = 0;
            }
        }, m);
    }

    // 你每杀死一次克苏鲁的触手，恢复10点san值
    static doRecoverSanOnDie(m:Monster):Monster {
        return <Monster>ElemFactory.addDieAI(async () => {
            if(m.bt().player["san"]){
                m.bt().player["san"] += 10;
                m.bt().player["san"] = m.bt().player["san"] > 100 ? 100 : m.bt().player["san"];
                await m.bt().fireEvent("onPlayerChanged", { "subType": "san" });
                await m.bt().triggerLogicPoint("onPlayerChanged", { "subType": "san" });
            }
        }, m)
    }

    // boss死后san值相关变化恢复正常
    // 恢复怪物属性显示, 恢复地块上的数字显示, 恢复怪物图标
    static doRemoveSanEffectAfterDie(m:Monster):Monster {
        m = <Monster>ElemFactory.addAfterDieAI(async () => {
            m.bt().player["san"] = undefined;
            var ms = m.bt().level.map.findAllElems((e:Elem) => e instanceof Monster && !e.isBoss && e.type != "PlaceHolder"  && e.isHazard());
                for (var monster of ms){
                    monster["hideMonsterAttrs"] = false;
                    monster["hideHazardNumber"] = false;
                    if(monster["origGetElemImgRes"])
                        monster.getElemImgRes = monster["origGetElemImgRes"];
                    await m.bt().fireEvent("onElemChanged", {subType:"elemImgChanged", e:monster});
                }
        }, m);
        return m;
    }

    // boss 特殊逻辑
    static makeBoss(m:Monster):Monster {
        var frozenRound = 0;
        m.isBoss = true;
        m["lockDoor"] = true;
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
            return frozenRound > 0 ? "IceBlock2" : priorGetElemImgRes();
        };
        m["getElemImgResInIce"] = () => {
            return frozenRound > 0 ? priorGetElemImgRes() : undefined;
        }
        return m;
    }

    // 商店 npc 逻辑
    static makeShopNPC(m:Monster):Monster {
        m.isHazard = () => false;
        m.canUse = () => true;
        m.canBeDragDrop = true;
        m.barrier = false;

        // 购买
        m["bought"] = false;
        var onBuy = async (elem:Elem, price:number) => {
            var n = Utils.indexOf(shopItemAndPrice.items, (it) => it == elem.type);
            Utils.assert(n >= 0, "no such item in shop:" + elem.type);
            Utils.assert(shopItemAndPrice.prices[elem.type] == price, "incorrect price for item in shop:" + elem.type + ", " + price + ", " + shopItemAndPrice.prices[n]);
            await m.bt().implAddMoney(-price, m);
            if (elem.attrs.autoUse) { // 购买后直接使用
                await elem["autoUseInBattle"](m.bt());
            } else {
                var g = BattleUtils.findNearestGrid(m.bt().level.map, m.pos, (g:Grid) => !g.isCovered() && !g.getElem());
                if (g) await m.bt().implAddElemAt(elem, g.pos.x, g.pos.y, m.pos);
            }
            m["bought"] = true;
            m.dropItems = [];
        };

        // 抢劫
        m["robbed"] = false;
        var onRob = async (elems) => {
            Utils.assert(!m["robbed"], "can not be robbed one time");
            m["robbed"] = true;
            var shopCfg = GCfg.getShopCfg(m.bt().lvCfg["shopCfg"]);
            var robCfg = GCfg.getRobCfg(shopCfg.rob);
            var es = Utils.doRobInShop(elems, robCfg, m.bt().srand);
            var droppedElems = [];
            for (var i = 0; i < es.length; i++) {
                var e:Elem = es[i];
                if (e.attrs.autoUse) { // 购买后直接使用
                    await e["autoUseInBattle"](m.bt());
                } else {
                    var g = BattleUtils.findNearestGrid(m.bt().level.map, m.pos, (g:Grid) => !g.isCovered() && !g.getElem());
                    if (g) {
                        m.bt().addElemAt(e, g.pos.x, g.pos.y);
                        droppedElems.push(e);
                    }
                }
            };

            if (droppedElems.length > 0)
                await m.bt().notifyElemsDropped(droppedElems, m.pos);

            return droppedElems;
        };

        var shopItemAndPrice;
        m.use = async () => {
            if (!shopItemAndPrice)
                shopItemAndPrice = Utils.genRandomShopItems(m.bt().player, m.bt().lvCfg["shopCfg"], m.bt().srand, 6);
            await m.bt().try2OpenShop(m, shopItemAndPrice.items, shopItemAndPrice.prices, onBuy, undefined /*, m["robbed"] ? undefined :onRob*/);
            // 成功购买后，NPC不再保留，才消耗死神步数
            return {reserve: !m["bought"], consumeDeathStep: !!m["bought"]};
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
                await food.bt().fireEvent("onMonsterEatFood", {m:e, food:food});
        }, e);
    }
}
