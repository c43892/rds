// 创建各种元素对象
class ElemFactory {
    static creators = [
        new ItemFactory(),
        new MonsterFactory()
    ];

    // 创建指定类型元素
    private static $$idSeqNo = 1; // 给 $$id 计数
    public static create(type:string, bt:Battle, attrs = undefined) {
        for (var factory of ElemFactory.creators) {
            if(factory.creators[type]) {
                var e:Elem = factory.creators[type](bt, attrs);
                e.type = type;
                e.$$id = type + ":" + (ElemFactory.$$idSeqNo++);
                return ElemFactory.doDropItemsOnDie(e);
            }
        }
    }

    // 为怪物在指定逻辑点添加一个行为
    public static addAI(e:Elem, logicPoint:string, act, condition = undefined):Elem {
        var doPrior = e[logicPoint];
        e[logicPoint] = async (ps) => {
            if (doPrior != undefined)
                await doPrior(ps);

            if (!condition || condition(ps))
                await act(ps);
        }
        
        return e;
    }

    // 为物品死亡增加逻辑
    public static addDieAI(e:Elem, act):Elem {
        var bt = e.bt;
        var prior = e.onDie;
        e.onDie = async (ps) => {
            if (prior)
                await prior(ps);

            await act(ps);
        };

        return e;
    }

    // 死亡时掉落物品
    public static doDropItemsOnDie(e:Elem):Elem {
        var bt = e.bt;
        ElemFactory.addDieAI(e, async () => {
            var dropInPosition = true;
            for (var dpe in e.dropItems) {
                var num = e.dropItems[dpe].num;
                for (var i = 0; i < num; i++) {
                    var g:Grid; // 掉落位置，优先掉在原地
                    if (dropInPosition) {
                        g = bt.level.map.getGridAt(e.pos.x, e.pos.y);
                        dropInPosition = false;
                    } else
                        g = BattleUtils.findRandomEmptyGrid(bt, false);

                    if (!g) return; // 没有空间了

                    var attrs = e.dropItems[dpe].attrs;
                    var elem = ElemFactory.create(dpe, bt, attrs);
                    await bt.implAddElemAt(elem, g.pos.x, g.pos.y);
                }
            }
        });

        return e;
    }
}