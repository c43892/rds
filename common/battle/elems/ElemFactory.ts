// 创建各种元素对象
class ElemFactory {
    static creators = [
        new ItemFactory(),
        new MonsterFactory()
    ];

    // 创建指定类型元素
    private static $$idSeqNo = 1; // 给 $$id 计数
    public static create(type:string, bt:Battle, attrs = {}) {
        for (var factory of ElemFactory.creators) {
            if(factory.creators[type]) {
                var e:Elem = factory.creators[type](bt, ElemFactory.mergeAttrs(type, attrs));
                e.type = type;
                e.attrs = attrs;
                e.$$id = type + ":" + (ElemFactory.$$idSeqNo++);
                return ElemFactory.doDropItemsOnDie(e);
            }
        }
    }

    static mergeAttrs(e, attrs) {
        var defaultAttrs = GCfg.getElemAttrsCfg(e);
        for (var k in defaultAttrs) {
            var v = defaultAttrs[k];
            if (!attrs[k])
                attrs[k] = v;
        }

        return attrs;
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
            for (var elem of e.dropItems) {
                var g:Grid; // 掉落位置，优先掉在原地
                if (dropInPosition) {
                    g = bt.level.map.getGridAt(e.pos.x, e.pos.y);
                    dropInPosition = false;
                } else
                    g = BattleUtils.findRandomEmptyGrid(bt, false);

                if (!g) return; // 没有空间了
                await bt.implAddElemAt(elem, g.pos.x, g.pos.y);
            }
        });

        return e;
    }
}