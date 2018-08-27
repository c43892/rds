// 道具
class Prop extends Elem {
    constructor() { super(); }
    public toProp; // 从地上的道具物品，变成真正的物品，这时才具备物品逻辑
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
            e.use = undefined;
            e.canBeDragDrop = false;
            e.cnt = e.attrs.cnt ? e.attrs.cnt : 1;
            e.useWithTarget = () => attrs.useWithTarget;
            mountLogic(e);
            return e;
        };

        e.use = async () => await e.bt().implAddPlayerProp(e);
        
        return e;
    }

    public creators = {
        // 医疗药剂
        "HpCapsule": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    var bt = e.bt();
                    await bt.implAddBuff(bt.player, "BuffAddHp", e.attrs.rounds, e.attrs.heal);
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
                        ElemFactory.elemCanUseAtManyTimes(attrs.cnt, async (e, x, y) => 
                            await e.bt().implFrozeAt(x, y, e), true)),

        // 超能药水
        "SuperPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    e.cnt --;
                    await e.bt().implAddBuff(e.bt().player, "BuffSuperPotion", attrs.immunizeCnt);
                    return e.cnt > 0;
                };
                return e;
            });
        },

        // 力量药水
        "StrangthPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    e.cnt --;
                    await e.bt().implAddBuff(e.bt().player, "BuffStrangthPotion", attrs.enhanceCnt);
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
                    return (!tog.isCovered() || tog.isMarked()) && toe && toe instanceof Monster && !toe.isBig() && toe.type != "PlaceHolder" 
                            && e.bt().player.money >= toe.hp * 3;
                }
                e.useAt = async (x:number, y:number) => {
                    e.cnt --;
                    var map = e.bt().level.map;
                    var m = <Monster>map.getElemAt(x, y);
                    await e.bt().implAddMoney(- m.hp * 3, e);
                    await e.bt().implDestoryAt(x, y, e);
                    return e.cnt > 0;
                }
                return e;
            })
        }
    };
}
