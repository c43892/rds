class Relic extends Elem {
    constructor() {super();}
    public toRelic; // 从地上的遗物物品，变成真正的遗物，这时才具备遗物逻辑
}

// 遗物刚被创建时，是一个 item，其拾取操作，才生成一个遗物到玩家身上
class RelicFactory {

    // 创建一个遗物在地图上的包装对象
    createRelic(attrs, mountLogic):Elem {
        var e = new Relic();
        e.canUse = () => true;
        e.canBeMoved = true;
        e.toRelic = () => { e.use = undefined; mountLogic(e); return e; };
        e.use = async () => await e.bt().implAddPlayerRelic(e.toRelic());
        
        return e;
    }

    public creators = {
        // 医疗箱过关回血
        "MedicineBox": (attrs) => {
            return this.createRelic(attrs, (e) => 
                ElemFactory.addAI("beforeGoOutLevel2", async () => e.bt().implAddPlayerHp(e.attrs.dhp), e),
            );
        },

        // 鹰眼，每关开始前标注一个带钥匙的怪物
        "Hawkeye": (attrs) => {
            return this.createRelic(attrs, (e) => {
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
