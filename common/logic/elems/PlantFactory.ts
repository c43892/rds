class Plant extends Monster {
    constructor() { super(); this.canBeDragDrop = true; }
}

class PlantFactory {
    public creators = {
        "NutWall1": (player:Player) => { // 坚果墙
            var level = player.bt().level;
            var attrs = level.getElemCfg("NutWall").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p = MonsterFactory.doShareDamageOnPlayerHurt(attrs.level1Share, p);
            p.getElemImgRes = () => "NutWall";
            p.canNotUseReason = () => "nutWallUseDesc";
            return p;
        },

        "NutWall2": (player:Player) => { // 坚果墙 生命值+X
            var level = player.bt().level;
            var attrs = level.getElemCfg("NutWall").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "hp", attrs.level2AddHp);
            var p = this.createPlant(attrs);
            p = MonsterFactory.doShareDamageOnPlayerHurt(attrs.level1Share, p);
            p.getElemImgRes = () => "NutWall";
            p.canNotUseReason = () => "nutWallUseDesc";
            return p;
        },

        "NutWall3": (player:Player) => { // 坚果墙3 承担伤害提升
            var level = player.bt().level;
            var attrs = level.getElemCfg("NutWall").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "hp", attrs.level2AddHp);
            var p = this.createPlant(attrs);
            p = MonsterFactory.doShareDamageOnPlayerHurt(attrs.level1Share + attrs.level3Share, p);
            p.getElemImgRes = () => "NutWall";
            p.canNotUseReason = () => "nutWallUseDesc";
            return p;
        },

        "NutWall4": (player:Player) => { // 坚果墙4 坚果墙 生命值+X
            var level = player.bt().level;
            var attrs = level.getElemCfg("NutWall").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "hp", attrs.level2AddHp);
            attrs = this.addNumberTypeAttr(attrs, "hp", attrs.level4AddHp);
            var p = this.createPlant(attrs);
            p = MonsterFactory.doShareDamageOnPlayerHurt(attrs.level1Share + attrs.level3Share, p);
            p.getElemImgRes = () => "NutWall";
            p.canNotUseReason = () => "nutWallUseDesc";
            return p;
        },

        "NutWall5": (player:Player) => { // 坚果墙5 承担伤害提升
            var level = player.bt().level;
            var attrs = level.getElemCfg("NutWall").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "hp", attrs.level2AddHp);
            attrs = this.addNumberTypeAttr(attrs, "hp", attrs.level4AddHp);
            var p = this.createPlant(attrs);
            p = MonsterFactory.doShareDamageOnPlayerHurt(attrs.level1Share + attrs.level3Share + attrs.level5Share, p);
            p.getElemImgRes = () => "NutWall";
            p.canNotUseReason = () => "nutWallUseDesc";
            return p;
        },

        "Peashooter1": (player:Player) => { // 豌豆射手
            var level = player.bt().level;
            var attrs = level.getElemCfg("Peashooter").attrs;
            attrs = Utils.clone(attrs);
            var p = MonsterFactory.doAttackBack(this.createPlant(attrs));
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    return e instanceof Monster && !e.getGrid().isCovered() && (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            }, attrs.attackInterval);
            p.getElemImgRes = () => "Peashooter";
            p.canNotUseReason = () => "peashooterUseDesc";
            return p;
        },

        "Peashooter2": (player:Player) => { // 豌豆射手2 攻击+X
            var level = player.bt().level;
            var attrs = level.getElemCfg("Peashooter").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2Power);
            var p = MonsterFactory.doAttackBack(this.createPlant(attrs));
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    return e instanceof Monster && !e.getGrid().isCovered() && (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            }, attrs.attackInterval);
            p.getElemImgRes = () => "Peashooter";
            p.canNotUseReason = () => "peashooterUseDesc";
            return p;
        },

        "Peashooter3": (player:Player) => { // 豌豆射手3 暴击+X%
            var level = player.bt().level;
            var attrs = level.getElemCfg("Peashooter").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2Power);
            attrs = this.addNumberTypeAttr(attrs, "critical", attrs.level3Critical);
            var p = MonsterFactory.doAttackBack(this.createPlant(attrs));
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    return e instanceof Monster && !e.getGrid().isCovered() && (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            }, attrs.attackInterval);
            p.getElemImgRes = () => "Peashooter";
            p.canNotUseReason = () => "peashooterUseDesc";
            return p;
        },

        "Peashooter4": (player:Player) => { // 豌豆射手3 减少一回合攻击冷却
            var level = player.bt().level;
            var attrs = level.getElemCfg("Peashooter").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2Power);
            attrs = this.addNumberTypeAttr(attrs, "critical", attrs.level3Critical);
            attrs = this.addNumberTypeAttr(attrs, "attackInterval", - attrs.level4MinusInterval);
            var p = MonsterFactory.doAttackBack(this.createPlant(attrs));
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    return e instanceof Monster && !e.getGrid().isCovered() && (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            }, attrs.attackInterval);
            p.getElemImgRes = () => "Peashooter";
            p.canNotUseReason = () => "peashooterUseDesc";
            return p;
        },

        "Peashooter5": (player:Player) => { // 豌豆射手5 增加连击能力
            var level = player.bt().level;
            var attrs = level.getElemCfg("Peashooter").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2Power);
            attrs = this.addNumberTypeAttr(attrs, "critical", attrs.level3Critical);
            attrs = this.addNumberTypeAttr(attrs, "attackInterval", - attrs.level4MinusInterval);
            attrs["muiltAttack"] = 2;
            var p = MonsterFactory.doAttackBack(this.createPlant(attrs));
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    if(e instanceof Monster && !e.getGrid().isCovered())
                        return (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            }, attrs.attackInterval);
            p.getElemImgRes = () => "Peashooter";
            p.canNotUseReason = () => "peashooterUseDesc";
            return p;
        },

        "CherryBomb1": (player:Player) => { // 樱桃炸弹
            var level = player.bt().level;
            var attrs = level.getElemCfg("CherryBomb").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implMonsterDoSelfExplode(p, undefined, false); 
                return true;
            }
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    if(e instanceof Monster && !e.getGrid().isCovered())
                        return (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            });
            p.getElemImgRes = () => "CherryBomb";
            return p;
        },

        "CherryBomb2": (player:Player) => { // 樱桃炸弹2 攻击+X
            var level = player.bt().level;
            var attrs = level.getElemCfg("CherryBomb").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2Power);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implMonsterDoSelfExplode(p, undefined, false); 
                return true;
            }
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    if(e instanceof Monster && !e.getGrid().isCovered())
                        return (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            });
            p.getElemImgRes = () => "CherryBomb";
            return p;
        },

        "CherryBomb3": (player:Player) => { // 樱桃炸弹3 暴击+X
            var level = player.bt().level;
            var attrs = level.getElemCfg("CherryBomb").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2power);
            attrs = this.addNumberTypeAttr(attrs, "critical", attrs.level3Critical);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implMonsterDoSelfExplode(p, undefined, false); 
                return true;
            }
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    if(e instanceof Monster && !e.getGrid().isCovered())
                        return (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            });
            p.getElemImgRes = () => "CherryBomb";
            return p;
        },

        "CherryBomb4": (player:Player) => { // 樱桃炸弹4 爆炸伤害增加X%
            var level = player.bt().level;
            var attrs = level.getElemCfg("CherryBomb").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2power);
            attrs = this.addNumberTypeAttr(attrs, "critical", attrs.level3Critical);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implMonsterDoSelfExplode(p, {a:attrs.level4BoomDamage / 100, b:0, c:0}, false); 
                return true;
            }
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    if(e instanceof Monster && !e.getGrid().isCovered())
                        return (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            });
            p.getElemImgRes = () => "CherryBomb";
            return p;
        },

        "CherryBomb5": (player:Player) => { // 樱桃炸弹5 伤害无视护甲
            var level = player.bt().level;
            var attrs = level.getElemCfg("CherryBomb").attrs;
            attrs = Utils.clone(attrs);
            attrs = this.addNumberTypeAttr(attrs, "power", attrs.level2power);
            attrs = this.addNumberTypeAttr(attrs, "critical", attrs.level3Critical);
            attrs = this.addArrTypeAttr(attrs, "attackFlags", "Pierce");
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implMonsterDoSelfExplode(p, {a:attrs.level4BoomDamage, b:0, c:0}, false); 
                return true;
            }
            p = MonsterFactory.doAttack("onPlayerActed", p, () => {
                var ms = p.map().findAllElems((e:Elem) => {
                    if(e instanceof Monster && !e.getGrid().isCovered())
                        return (e.isHazard() || e["linkTo"] && e["linkTo"].isHazard()) && p.inAttackRange(e)
                });
                if (ms.length == 0) return undefined;

                return ms[p.bt().srand.nextInt(0, ms.length)];
            });
            p.getElemImgRes = () => "CherryBomb";
            return p;
        },

        "Sunflower1": (player:Player) => { // 太阳花
            var level = player.bt().level;
            var attrs = level.getElemCfg("Sunflower").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implAddPlayerHp(Math.floor(p.bt().player.maxHp * attrs.dhpPercent / 100), p);
                return false;
            }
            p.getElemImgRes = () => "Sunflower";
            return p;
        },

        "Sunflower2": (player:Player) => { // 太阳花2 额外恢复X点生命值
            var level = player.bt().level;
            var attrs = level.getElemCfg("Sunflower").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implAddPlayerHp(Math.floor(p.bt().player.maxHp * attrs.dhpPercent / 100 + attrs.level2AddHp), p);
                return false;
            }
            p.getElemImgRes = () => "Sunflower";
            return p;
        },

        "Sunflower3": (player:Player) => { // 太阳花3 额外获得当前等级X%经验
            var level = player.bt().level;
            var attrs = level.getElemCfg("Sunflower").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);            
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implAddPlayerHp(Math.floor(p.bt().player.maxHp * attrs.dhpPercent / 100 + attrs.level2AddHp), p);
                var currentExp = GCfg.playerCfg.exp2Lv[player.lv];
                await p.bt().implAddPlayerExp(Math.floor(currentExp * attrs.level3AddExpPercent / 100), p.pos);
                return false;
            }
            p.getElemImgRes = () => "Sunflower";
            return p;
        },

        "Sunflower4": (player:Player) => { // 太阳花4 额外获得X金钱
            var level = player.bt().level;
            var attrs = level.getElemCfg("Sunflower").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implAddPlayerHp(Math.floor(p.bt().player.maxHp * attrs.dhpPercent / 100 + attrs.level2AddHp), p);
                var currentExp = GCfg.playerCfg.exp2Lv[player.lv];
                await p.bt().implAddPlayerExp(Math.floor(currentExp * attrs.level3AddExpPercent / 100), p.pos);
                await p.bt().implAddMoney(attrs.level4AddMoney, p);
                return false;
            }
            p.getElemImgRes = () => "Sunflower";
            return p;
        },

        "Sunflower5": (player:Player) => { // 太阳花5 额外增加X点生命上限
            var level = player.bt().level;
            var attrs = level.getElemCfg("Sunflower").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUse = () => true;
            p.use = async () => { 
                await p.bt().implAddPlayerHp(Math.floor(p.bt().player.maxHp * attrs.dhpPercent / 100 + attrs.level2AddHp), p);
                var currentExp = GCfg.playerCfg.exp2Lv[player.lv];
                await p.bt().implAddPlayerExp(Math.floor(currentExp * attrs.level3AddExpPercent / 100), p.pos);
                await p.bt().implAddMoney(attrs.level4AddMoney, p);
                await p.bt().implAddPlayerMaxHp(attrs.level5AddMaxHp, p);
                return false;
            }
            p.getElemImgRes = () => "Sunflower";
            return p;
        },

        "CharmingMushroom1": (player:Player) => { // 魅惑菇
            var level = player.bt().level;
            var attrs = level.getElemCfg("CharmingMushroom").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUseAt = (x:number, y:number) => {
                var e = p.map().getElemAt(x, y);
                var g = p.map().getGridAt(x, y);
                return (!g.isCovered() || g.isMarked()) && e && e instanceof Monster && e.isHazard() && !e.isBoss && e.type != "PlaceHolder";
            };
            
            p.useAt = async (x:number, y:number) => { 
                var tarm = <Monster>p.map().getElemAt(x, y);
                await p.bt().implCharmMonster(tarm);
                return false;
            }
            p.getElemImgRes = () => "CharmingMushroom";
            return p;
        },

        "CharmingMushroom2": (player:Player) => { // 魅惑菇2 攻击力+X
            var level = player.bt().level;
            var attrs = level.getElemCfg("CharmingMushroom").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUseAt = (x:number, y:number) => {
                var e = p.map().getElemAt(x, y);
                var g = p.map().getGridAt(x, y);
                return (!g.isCovered() || g.isMarked()) && e && e instanceof Monster && e.isHazard() && !e.isBoss && e.type != "PlaceHolder";
            };
            
            p.useAt = async (x:number, y:number) => { 
                var tarm = <Monster>p.map().getElemAt(x, y);
                var dattrs = [{type:"power", num:attrs.level2AddPower}]
                await p.bt().implCharmMonster(tarm, dattrs);
                return false;
            }
            p.getElemImgRes = () => "CharmingMushroom";
            return p;
        },

        "CharmingMushroom3": (player:Player) => { // 魅惑菇3 生命值+X
            var level = player.bt().level;
            var attrs = level.getElemCfg("CharmingMushroom").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUseAt = (x:number, y:number) => {
                var e = p.map().getElemAt(x, y);
                var g = p.map().getGridAt(x, y);
                return (!g.isCovered() || g.isMarked()) && e && e instanceof Monster && e.isHazard() && !e.isBoss && e.type != "PlaceHolder";
            };
            
            p.useAt = async (x:number, y:number) => { 
                var tarm = <Monster>p.map().getElemAt(x, y);
                var dattrs = [{type:"power", num:attrs.level2AddPower}, {type:"hp", num:attrs.level3AddHp}]
                await p.bt().implCharmMonster(tarm, dattrs);
                return false;
            }
            p.getElemImgRes = () => "CharmingMushroom";
            return p;
        },

        "CharmingMushroom4": (player:Player) => { // 魅惑菇4 暴击+X%
            var level = player.bt().level;
            var attrs = level.getElemCfg("CharmingMushroom").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUseAt = (x:number, y:number) => {
                var e = p.map().getElemAt(x, y);
                var g = p.map().getGridAt(x, y);
                return (!g.isCovered() || g.isMarked()) && e && e instanceof Monster && e.isHazard() && !e.isBoss && e.type != "PlaceHolder";
            };
            
            p.useAt = async (x:number, y:number) => { 
                var tarm = <Monster>p.map().getElemAt(x, y);
                var dattrs = [{type:"power", num:attrs.level2AddPower}, {type:"hp", num:attrs.level3AddHp}, {type:"critical", num:attrs.level4AddCritical}]
                await p.bt().implCharmMonster(tarm, dattrs);
                return false;
            }
            p.getElemImgRes = () => "CharmingMushroom";
            return p;
        },

        "CharmingMushroom5": (player:Player) => { // 魅惑菇5 闪避+X%
            var level = player.bt().level;
            var attrs = level.getElemCfg("CharmingMushroom").attrs;
            attrs = Utils.clone(attrs);
            var p = this.createPlant(attrs);
            p.canUseAt = (x:number, y:number) => {
                var e = p.map().getElemAt(x, y);
                var g = p.map().getGridAt(x, y);
                return (!g.isCovered() || g.isMarked()) && e && e instanceof Monster && e.isHazard() && !e.isBoss && e.type != "PlaceHolder";
            };
            
            p.useAt = async (x:number, y:number) => { 
                var tarm = <Monster>p.map().getElemAt(x, y);
                var dattrs = [
                    {type:"power", num:attrs.level2AddPower}, {type:"hp", num:attrs.level3AddHp}, {type:"critical", num:attrs.level4AddCritical}, 
                    {type:"dodge", num:attrs.level5AddDodge}
                    ]
                await p.bt().implCharmMonster(tarm, dattrs);
                return false;
            }
            p.getElemImgRes = () => "CharmingMushroom";
            return p;
        },
    }

    // 创建一个植物
    createPlant(attrs):Plant{
        var p = new Plant;

        p.hp = attrs.hp ? attrs.hp : 0;
        p.shield = attrs.shield ? attrs.shield : 0;
        p.hazard = false;
        p.barrier = false;
        attrs.size = attrs.size ? attrs.size : {w:1, h:1};
        p.attrs = attrs;
        return p;
    }

    // 根据园艺大师遗物等级强化植物
    static enhancePlantByHorticultureMaster(bt:Battle, plantType, attrs){
        var relicsEquipped = bt.player.relicsEquipped;
        var r = relicsEquipped[Utils.indexOf(relicsEquipped, (tar:Relic) => tar.type == "HorticultureMaster")];
        Utils.assert(!!r, "player don't have the relic:HorticultureMaster"); // 植物来源为园艺大师遗物

        var level = r.reinforceLv;
        var enhances = GCfg.getOccupationCfg(bt.player.occupation).relics.HorticultureMaster[plantType]; // 获取该植物的增强配置

        // 用于判断增强方式
        var abcTypes = ["power", "accuracy", "critical", "damageAdd", "dodge"];
        var valueType = ["hp", "shield", "attackInterval"]
        var enhanceType = (type:string) => {
            if (Utils.contains(abcTypes, type)) return "abcTypes";
            else if (Utils.contains(valueType, type)) return "valueType";
            else return "special";
        }

        for (var i = 0; i < level; i++){
            var enhance = enhances[i].enhance;
            var type = enhance.type;
            if(enhanceType(type) == "abcTypes"){
                if(!attrs[type]) attrs[type] = 0;
                attrs[type] = (attrs[type] + enhance.b) * (1 + enhance.a) + enhance.c;
            }
            else if(enhanceType(type) == "valueType"){
                if(!attrs[type]) attrs[type] = 0;
                attrs[type] += enhance;
            }
            else
                Utils.log("can not enhance this typr:" + type);
        }
        
        return attrs;
    }

    // 为植物增强数值属性,校验是否具有该属性,避免出现NaN
    addNumberTypeAttr(attrs, type:string, num:number){
        if(!attrs[type])
            attrs[type] = 0;
        
        attrs[type] += num;
        return attrs;
    }

    // 为植物增加数组属性,校验是否具有该属性,避免出现NaN
    addArrTypeAttr(attrs, type:string, flag:string){
        if(!attrs[type])
            attrs[type] = [];
        
        attrs[type].push(flag);
        return attrs;
    }
}