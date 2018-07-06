
// 遗物刚被创建时，是一个 item，其拾取操作，才生成一个遗物到玩家身上
class RelicFactory {

    // 创建一个遗物在地图上的包装对象
    createRelic(attrs, ...funcs):Relic {
        var e = new Relic();
        e.canUse = () => true;
        e.canBeMoved = true;
        var cd = 0;
        Utils.assert(funcs.length == 1 || funcs.length == 6, "invalid relic functors number: " + funcs.length);
        e.funcs = funcs;
        e.toRelic = (p:Player) => {
            e.player = p;
            e.use = undefined;
            funcs[0](e, true);
            e.enabledFuncs.push(0);
            return e;
        };
        e.use = async () => { 
            var bt = e.bt();
            var p = bt.player;
            await bt.implAddPlayerRelic(e);
        };
        if (attrs.reinforceLv) // 初始强化等级
            e.setReinfoceLv(attrs.reinforceLv);
        
        return e;
    }

    public creators = {
        // 医疗箱过关回血
        "MedicineBox": (attrs) => {
            return this.createRelic(attrs, (r:Relic, enable:boolean) => {
                if (enable)
                    ElemFactory.addAI("beforeGoOutLevel2", async () => r.bt().implAddPlayerHp(r.attrs.dhp), r)
            });
        },

        // 鹰眼，每关开始前标注一个带钥匙的怪物
        "Hawkeye": (attrs) => {
            return this.createRelic(attrs, (r:Relic, enable:boolean) => {
                if (enable) {
                    ElemFactory.addAI("onStartupRegionUncovered", async () => {
                        var ms = BattleUtils.findRandomElems(r.bt(), 1, (m) => {
                            if (!(m instanceof Monster)) return false;
                            if (!m.getGrid().isCovered()) return false;
                            return Utils.indexOf(m.dropItems, (dpi) => dpi.type == "Key") >= 0;
                        });

                        if (ms.length == 0) return;
                        var m = ms[0];
                        await r.bt().implMark(m.pos.x, m.pos.y);
                    }, r);
                }
            });
        }, 

        // 时光机
        "TimeMachine": (attrs) => {
            return this.createRelic(attrs, (r:Relic, enable:boolean) => {
                if (enable) {
                    ElemFactory.addAI("beforeGoOutLevel2", async () => {
                        await r.bt().implAddPlayerAttr("deathStep", 5);
                    }, r);
                }
            });
        },

        // 耐力
        "Endurance": (attrs) => {
            return this.createRelic(attrs, async (r:Relic, enable:boolean) => {
                r.player.addMaxHp(enable ? attrs.dMaxHp : -attrs.dMaxHp);
            });
        },
        
        "":{}
    };
}
