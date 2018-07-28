// 道具
class Prop extends Elem {
    constructor() { super(); }
    public toProp; // 从地上的道具物品，变成真正的遗物，这时才具备遗物逻辑
}

// 道具刚被创建时，是一个 item，其拾取操作，才生成一个道具到玩家身上
class PropFactory {

    // 创建一个道具在地图上的包装对象
    createProp(attrs, mountLogic):Prop {
        var e = new Prop();
        e.canUse = () => true;
        e.canBeDragDrop = true;
        e.toProp = () => {
            e.use = undefined;
            e.canBeDragDrop = false;
            e.cnt = e.attrs.cnt ? e.attrs.cnt : 1;
            mountLogic(e);
            return e;
        };

        e.use = async () => await e.bt().implAddPlayerProp(e);
        
        return e;
    }

    public creators = {
        // 红药水
        "HpPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    // 搜集所有参数，过公式算一下最终值
                    e.cnt--;
                    await e.bt().implAddPlayerHp(attrs.dhp);
                    return e.cnt > 0;
                }

                return e;
            });
        },

        // 火焰射线
        "RayGun": (attrs) => this.createProp(attrs, ElemFactory.weaponLogic(attrs.cnt, true)),

        // 冰冻射线
        "IceGun": (attrs) => this.createProp(attrs, 
                        ElemFactory.elemCanUseAtManyTimes(attrs.cnt, async (e, x, y) => 
                            await e.bt().implFrozeAt(x, y, e), true))
    };
}
