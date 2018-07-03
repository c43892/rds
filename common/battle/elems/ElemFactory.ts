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
                if (e.isBig()) e = ElemFactory.makeElemBigger(e, e.attrs.size);
                return e;
            }
        }

        Utils.assert(!!e, "unknown elem type: " + type);
    }

    static mergeAttrs(type, attrs) {
        var defaultAttrs = GCfg.getElemAttrsCfg(type);
        for (var k in defaultAttrs) {
            var v = defaultAttrs[k];
            if (!attrs[k])
                attrs[k] = v;
        }

        attrs.size = attrs.size ? attrs.size : {w:1, h:1};
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
    public static addAI(logicPoint:string, act, e:Elem, condition = undefined, onlyUncovered:boolean = true):Elem {
        return this.addAIEvenCovered(logicPoint, act, e, (ps) => {
            if (e instanceof Item || e instanceof Monster) {
                if (onlyUncovered && e.getGrid().isCovered())
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
            var drops = [...e.dropItems, ...e.randomDrops];
            for (var elem of drops) {
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

    // 可多次直接使用的物品
    static elemCanUseManyTimes(cnt:number, useAct, fixImgRes = false) {
        return (e:Elem) => {
            e.cnt = cnt;         
            e.canUse = () => true;
            e.use = async () => {
                e.cnt--;
                if (useAct) await useAct(e);
                return e.cnt > 0;
            };
            if (!fixImgRes) e.getElemImgRes = () => e.type + e.cnt;
            return e;
        };
    }

    // 可多次对目标使用的物品
    static elemCanUseAtManyTimes(cnt:number, useAtAct, fixImgRes = false) {
        return (e:Elem) => {
            e.cnt = e.attrs.cnt;
            e.canUse = () => false;
            e.useAt = async (x, y) => {
                e.cnt--;
                if (useAtAct) await useAtAct(e, x, y);
                return e.cnt > 0;
            };
            if (!fixImgRes) e.getElemImgRes = () => e.type + e.cnt;
            return e;
        };
    }

    // 武器逻辑
    static weaponLogic(cnt:number, fixImgRes = false) {
        return ElemFactory.elemCanUseAtManyTimes(cnt, async (e, x, y) => await e.bt().implPlayerAttackAt(x, y, e), fixImgRes);
    }

    // 食物
    static foodLogic(cnt:number, dhp:number, fixImgRes = false) {
        return ElemFactory.elemCanUseManyTimes(cnt, async (e:Elem) => await e.bt().implAddPlayerHp(dhp), fixImgRes);
    }

    // 被动触发
    static triggerColdownLogic(needUncovered:boolean = true) {
        return (e:Elem) => {
            e.cd = 0;            
            e.canTrigger = () => e.isValid() && (!needUncovered || !e.getGrid().isCovered()) && e.cd <= 0;
            e.resetTrigger = () => e.cd = e.attrs.cd;
            e["onPlayerActed"] = async () => {
                if (needUncovered && e.getGrid().isCovered()) return;
                e.cd--;
                await e.bt().implNotifyElemChanged("coldown", e);
            }
            return e;
        };
    }

    // 创建大尺寸元素
   static makeElemBigger(e:Elem, size):Elem {
       if (size.w == 1 && size.h == 1) return e;
       var placeHolders:Elem[] = [];
       e["placeHolders"] = () => [...placeHolders];

       // 带占位符
       for (var i = 0; i < size.w; i++) {
            for (var j = 0; j < size.h; j++) {
                if (i == 0 && j == 0) continue;
                var hd = ElemFactory.create("PlaceHolder");
                hd["linkTo"] = e;
                placeHolders.push(hd);

                hd.canUse = () => e.canUse();
                hd.use = () => e.use();
                hd.hazard = true;
                hd.barrier = true;
            }
        }

       // 翻开时一起翻开
       e = <Monster>ElemFactory.addAI("onGridChanged", async () => {
           var bt = e.bt();
           if (e.getGrid().isCovered()) await bt.implUncoverAt(e.pos.x, e.pos.y);
           for (var hd of placeHolders) {
               if (hd.getGrid().isCovered())
                   await bt.implUncoverAt(hd.pos.x, hd.pos.y);
           }
       }, e, (ps) => {
           return ps.subType == "gridUnconvered" && (e.pos.x == ps.x && e.pos.y == ps.y) || (Utils.indexOf(placeHolders, (hd) => hd.pos.x == ps.x && hd.pos.y == ps.y) >= 0);
       }, false);

    //    // 死亡时把占位物体带走
    //    e = <Monster>ElemFactory.addDieAI(async () => {
    //        for (var hd of placeHolders)
    //            await e.bt().implRemoveElemAt(hd.pos.x, hd.pos.y);
    //    }, e);

       e.setBattle = (bt:Battle) => 
       {
           e.$$bt = bt;
           for (var hd of placeHolders)
            hd.setBattle(bt);
       };

       return e;
   }
}
