// 道具
class Prop extends Elem {
    constructor() { super(); }
    public toProp; // 从地上的道具物品，变成真正的物品，这时才具备物品逻辑
    public isPicked = false; // 是否是真正的处于道具栏中的道具
}

// 道具刚被创建时，是一个 item，其拾取操作，才生成一个道具到玩家身上
class PropFactory {

    // 创建一个道具在地图上的包装对象
    createProp(attrs, mountLogic):Prop {
        var e = new Prop();
        e.canUse = () => true;
        e.canBeDragDrop = true;
        e.useWithTarget = () => false;        
        e.toProp = () => {
            e.isPicked = true;
            e.use = undefined;
            e.canBeDragDrop = false;
            e.cnt = e.attrs.cnt ? e.attrs.cnt : 1;
            e.isValid = undefined;
            e = <Prop>ElemFactory.triggerColddownLogic(e);
            e["beginCD"] = true;
            e.useWithTarget = () => attrs.useWithTarget;            
            mountLogic(e);
            return e;
        };

        e.use = async () => await e.bt().implAddPlayerProp(e);
        
        return e;
    }

    public creators = {
        // 医疗药剂
        "HpPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    e.resetCD();
                    e.cnt--;
                    var bt = e.bt();
                    await bt.implAddPlayerHp(e.attrs.heal, e);
                    return e.cnt > 0;
                };
                return e;
            });
        },

        // 解毒药剂
        "DePoison": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    e.cnt--;
                    await e.bt().implRemoveBuff(e.bt().player, "BuffPoison");
                    return e.cnt > 0;
                };
                
                return e;
            });
        },

        // 火箭筒
        "Bazooka": (attrs) => this.createProp(attrs, ElemFactory.weaponLogic(attrs.cnt, true)),

        // 火焰射线
        "RayGun": (attrs) => this.createProp(attrs, ElemFactory.weaponLogic(attrs.cnt, true)),

        // 冰冻射线
        "IceGun": (attrs) => this.createProp(attrs, 
                        ElemFactory.elemCanUseAtManyTimes(attrs.cnt, async (e, x, y) => {
                            e.resetCD();
                            await e.bt().implFrozeAt(x, y, e);
                        }, true)),

        // 超能药水
        "SuperPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    e.resetCD();
                    e.cnt --;
                    await e.bt().implAddBuff(e.bt().player, "BuffSuper", attrs.immunizeCnt);
                    return e.cnt > 0;
                };
                return e;
            });
        },

        // 力量药水
        "StrengthPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    e.resetCD();
                    e.cnt --;
                    await e.bt().implAddBuff(e.bt().player, "BuffStrangth", attrs.enhanceCnt);
                    await e.bt().fireEvent("onPlayerChanged", {"subType": "power", source:e});
                    return e.cnt > 0;
                };
                return e;
            });
        },

        // 糖果炮弹
        "CandyCannon":(attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => false;
                e.canUseAt = (x:number, y:number) => {
                    var map = e.bt().level.map;
                    var tog:Grid = map.getGridAt(x, y);
                    var toe:Elem = map.getElemAt(x, y);
                    return (!tog.isCovered() || tog.isMarked()) && toe && toe instanceof Monster && !toe.isBig() && !toe.isElite && toe.type != "PlaceHolder" 
                            && e.bt().player.money >= toe.hp * 3;
                };
                e.useAt = async (x:number, y:number) => {
                    e.resetCD();
                    e.cnt --;
                    var map = e.bt().level.map;
                    var m = <Monster>map.getElemAt(x, y);
                    var dm = - m.hp * 3;
                    await e.bt().implAddMoney(dm);
                    await e.bt().fireEvent("onCandyCannon", {e:e, tar:m, dm:dm})
                    await e.bt().implDestoryAt(x, y, e);
                    return e.cnt > 0;
                };
                return e;
            })
        },

        // 剧毒药水
        "PoisonPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => false;
                e.useAt = async (x:number, y:number) => {
                    e.resetCD();
                    e.cnt --;
                    var map = e.bt().level.map;
                    var m = <Monster>map.getElemAt(x, y);
                    var index = Utils.indexOf(m.buffs, (b:Buff) => b.type == "BuffPoison");
                    if (index == -1)
                        await e.bt().implAddBuff(m, "BuffPoison", [3, 1]);
                     else {
                        var buff = m.buffs[index];
                        await e.bt().implAddBuff(m, "BuffPoison", [buff.cnt, 1]);
                    }
                    return e.cnt > 0;
                };
                return e;
            })
        }
    };
}
