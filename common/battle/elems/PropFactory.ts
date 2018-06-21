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
        e.canBeMoved = true;
        e.toProp = () => {
            e.use = undefined;
            e.canBeMoved = false;
            e.cnt = e.attrs.cnt ? e.attrs.cnt : 1;
            mountLogic(e);
            return e;
        };

        e.use = async () => await e.bt().implAddPlayerProp(e.toProp());
        
        return e;
    }

    public creators = {
        // 红药水
        "HpPotion": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    // 搜集所有参数，过公式算一下最终值
                    await e.bt().implAddPlayerHp(attrs.dhp);
                    await e.bt().implRemovePlayerProp(e.type);
                }

                return e;
            });
        },

        // 枪
        "Gun": (attrs) => {
            return this.createProp(attrs, (e:Elem) => {
                e.cnt = attrs.cnt;
                e.canUse = () => false;
                e.canUseAt = (x, y) => {
                    var tog:Grid = e.bt().level.map.getGridAt(x, y);
                    if (tog.isUncoverable()) // 对未揭开区域可以使用
                        return true;

                    var toe:Elem = e.bt().level.map.getElemAt(x, y);
                    if (toe && toe instanceof Monster) // 对揭开的怪可以使用
                        return true;
                    
                    return false; // 其它情况不可以使用
                };

                e.useAt = async (x, y) => {
                    await e.bt().implPlayerAttackAt(x, y, e);
                    await e.bt().implRemovePlayerProp(e.type);
                    return e.cnt > 0;
                }
                return e;
            });
        },
    };
}
