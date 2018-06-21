class Relic extends Elem {
    constructor(bt) {
        super(bt);
    }
}

// 遗物刚被创建时，是一个 item，其拾取操作，才生成一个遗物到玩家身上
class RelicFactory {

    // 创建一个遗物在地图上的包装对象
    createRelic(bt:Battle, attrs, mountLogic):Elem {
        var e = new Relic(bt);
        e.canUse = () => true;
        e.canBeMoved = true;
        e.use = async () => {
            e.use = undefined;
            mountLogic(e); // 这时候才生成遗物的行为逻辑

            await e.bt().implAddPlayerRelic(e);
        };
        
        return e;
    }

    public creators = {
        // 医疗箱过关回血
        "MedicineBox": (bt:Battle, attrs) => {
            return this.createRelic(bt, attrs, (e) => 
                ElemFactory.addAI("beforeGoOutLevel2", async () => e.bt().implAddPlayerHp(e.attrs.dhp), e),
            );
        },

        // 鹰眼，每关开始前标注一个带钥匙的怪物
        "Hawkeye": (bt:Battle, attrs) => {
            return this.createRelic(bt, attrs, (e) => {
                ElemFactory.addAI("onStartupRegionUncovered", async () => {
                    var ms = BattleUtils.findRandomElems(e.bt(), 1, (m) => {
                        if (!(m instanceof Monster)) return false;
                        if (!m.getGrid().isCovered()) return false;
                        return Utils.indexOf(m.dropItems, (dpi) => dpi.type == "Key") >= 0;
                    });

                    if (ms.length == 0) return;
                    var m = ms[0];
                    await e.bt().implMark(m.pos.x, m.pos.y);
                }, e);
            });
        }
    };
}
