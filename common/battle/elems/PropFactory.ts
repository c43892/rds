
// 道具刚被创建时，是一个 item，其拾取操作，才生成一个道具到玩家身上
class PropFactory {

    // 创建一个道具在地图上的包装对象
    createProp(bt:Battle, attrs, mountLogic):Elem {
        var e = new Elem(bt);
        e.canUse = () => true;
        e.canBeMoved = true;
        e.use = async () => {
            e.canUse = false;
            e.use = undefined;
            e.cnt = e.attrs.cnt ? e.attrs.cnt : 1;
            mountLogic(e); // 这时候才生成道具的行为逻辑
            e.canBeMoved = false;
            await e.bt().implAddPlayerProp(e);
        };
        
        return e;
    }

    public creators = {
        // 红药水
        "HpPotion": (bt, attrs) => {
            return this.createProp(bt, attrs, (e:Elem) => {
                e.canUse = () => true;
                e.use = async () => {
                    // 搜集所有参数，过公式算一下最终值
                    var ps = e.bt().getCalcPs("forHpPotion");
                    var dhp = e.bt().bc.doCalc(attrs.dhp, ps);
                    await e.bt().implAddPlayerHp(dhp);
                    await e.bt().implRemovePlayerProp(e.type);
                }

                return e;
            });
        },

        // 枪
        "Gun": (bt, attrs) => {
            return this.createProp(bt, attrs, (e:Elem) => {
                e.cnt = attrs.cnt;
                e.canUseAt = (x, y) => {
                    var toe:Elem = e.bt().level.map.getElemAt(x, y);
                    return toe && toe.getGrid().isUncoveredOrMarked() && (toe instanceof Monster);
                };

                e.useAt = async (x, y) => {
                    var m = <Monster>e.bt().level.map.getElemAt(x, y);
                    await e.bt().implPlayerAttackMonster(m, e);
                    await e.bt().implRemovePlayerProp(e.type);
                    return e.cnt > 0;
                }
                return e;
            });
        },
    };
}
