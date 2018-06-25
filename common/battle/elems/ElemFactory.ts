// 创建各种元素对象
class ElemFactory {
    static creators = [
        new ItemFactory(),
        new PropFactory(),
        new RelicFactory(),
        new MonsterFactory()
    ];

    // 创建指定类型元素
    private static $$idSeqNo = 1; // 给 $$id 计数
    public static create(type:string, attrs = undefined) {
        attrs = attrs ? attrs : {};
        for (var factory of ElemFactory.creators) {
            if(factory.creators[type]) {
                var e:Elem = factory.creators[type](ElemFactory.mergeAttrs(type, attrs));
                Utils.assert(!!e, "unknown elem type: " + type);
                e.type = type;
                e.attrs = attrs;
                e.btAttrs = BattleUtils.mergeBattleAttrs({}, attrs);
                e.$$id = type + ":" + (ElemFactory.$$idSeqNo++);

                if (attrs.dropItems) // 初始就可能携带掉落物品
                    for (var dpItem in attrs.dropItems) {
                        var dpe = ElemFactory.create(dpItem, attrs.dropItems[dpItem]);
                        e.addDropItem(dpe);
                    }

                return ElemFactory.doDropItemsOnDie(e);
            }
        }

        Utils.assert(!!e, "unknown elem type: " + type);
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

    // 为怪物在指定逻辑点添加一个行为，在隐藏时也生效
    public static addAIEvenCovered(logicPoint:string, act, e:Elem, condition = undefined):Elem {
        var doPrior = e[logicPoint];
        e[logicPoint] = async (ps) => {
            if (doPrior != undefined)
                await doPrior(ps);

            if (!condition || condition(ps))
                await act(ps);
        }
        
        return e;
    }

    // 为怪物在指定逻辑点添加一个行为，对于怪物和物品，只在显形的时候生效
    public static addAI(logicPoint:string, act, e:Elem, condition = undefined):Elem {
        return this.addAIEvenCovered(logicPoint, act, e, (ps) => {
            if (e instanceof Item || e instanceof Monster) {
                if (e.getGrid().isCovered())
                    return false;
                else
                    return !condition || condition(ps);
            } else
                return true;
        });
    }

    // 为物品死亡增加逻辑
    public static addDieAI(act, e:Elem):Elem {
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
        ElemFactory.addDieAI(async () => {
            var dropInPosition = true;
            for (var elem of e.dropItems) {
                var g:Grid; // 掉落位置，优先掉在原地
                if (dropInPosition) {
                    g = e.bt().level.map.getGridAt(e.pos.x, e.pos.y);
                    dropInPosition = false;
                } else
                    g = BattleUtils.findRandomEmptyGrid(e.bt());

                if (!g) return; // 没有空间了
                await e.bt().implAddElemAt(elem, g.pos.x, g.pos.y);
            }
        }, e);

        return e;
    }

    // 随机移动一次，dist 表示移动几格
    static doMove(logicPoint:string, dist:number, e:Elem):Elem {
        var dir = [[-1,0],[1,0],[0,-1],[0,1]];
        return <Elem>ElemFactory.addAI(logicPoint, async () => {
            if ((<Monster>e).isDead()) return;
            var path = [{x:e.pos.x, y:e.pos.y}];
            for (var i = 0; i < dist; i++) {
                var d = dir[e.bt().srand.nextInt(0, dir.length)];
                var lastPt = path[path.length - 1];
                var x = lastPt.x + d[0];
                var y = lastPt.y + d[1];
                if ((e.pos.x == x && e.pos.y == y) || e.bt().level.map.isWalkable(x, y))
                    path.push({x:x, y:y});
            }

            await e.bt().implElemMoving(e, path);
        }, e);
    }

    // 武器逻辑
    static weaponLogic() {
        return (e:Elem) => {
            e.cnt = e.attrs.cnt;
            e.canUse = () => false;
            e.canUseAt = (x, y) => true;
            e.useAt = async (x, y) => {
                await e.bt().implPlayerAttackAt(x, y, e);
                await e.bt().implRemovePlayerProp(e.type);
                return e.cnt > 0;
            };
        };
    }
}
