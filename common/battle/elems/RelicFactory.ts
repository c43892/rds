class Relic extends Elem {}

// 遗物刚被创建时，是一个 item，其拾取操作，才生成一个遗物到玩家身上
class RelicFactory {

    // 创建一个遗物在地图上的包装对象
    createRelic(bt:Battle, attrs, mountLogic):Elem {
        var e = new Relic(bt);
        e.canUse = () => true;
        e.canBeMoved = true;
        e.use = async () => {
            e.canUse = false;
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
        }
    };
}
