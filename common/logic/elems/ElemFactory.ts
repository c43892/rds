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
                return !condition || condition(ps);
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
        ElemFactory.addDieAI(async () => { // 处理随机掉落

            // 随机掉落是在掉落瞬间才确定
            var randomDrops = [];
            if (e.attrs.rdp) {
                var rdp = GCfg.getRandomDropGroupCfg(e.attrs.rdp);
                var arr = Utils.randomSelectByWeightWithPlayerFilter(e.bt().player, rdp.elems, e.bt().srand, rdp.num[0], rdp.num[1], true, "Coins");
                for (var dpType of arr)
                    randomDrops.push(e.bt().level.createElem(dpType));
            }

            var dropInPosition = true;
            var drops = [...e.dropItems, ...randomDrops];
            for (var elem of drops) {
                var g:Grid; // 掉落位置，优先掉在原地
                var eInPlace = e.bt().level.map.getElemAt(e.pos.x, e.pos.y);
                if (dropInPosition && (eInPlace == undefined || eInPlace == e)) {
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

    static moveFunc(e:Elem, dist:number, getTargetPos) {
        return async () => {
            var targetPos = getTargetPos();
            if (!targetPos) return;
            
            var map = e.bt().level.map;
            map.makeSurePathFinderPrepared();
            var path = map.findPath(e.pos, targetPos, {closest:true});
            if (path.length == 0) return;

            var lastNode = path[path.length - 1];
            if (!e.bt().level.map.isWalkable(lastNode.x, lastNode.y)) // 目标点如果不可走，去掉目标点
                path.pop();

            if (path.length > dist) path = path.slice(0, dist);
            await e.bt().implElemMoving(e, path);
        };
    }

    // 向目标移动，使用 astar 寻路，dist 表示最多走几格
    static doMove2Target(logicPoint:string, e:Elem, dist:number, getTargetPos):Elem {
        return <Elem>ElemFactory.addAI(logicPoint, ElemFactory.moveFunc(e, dist, getTargetPos), e);
    }

    // 可多次直接使用的物品
    static elemCanUseManyTimes(cnt:number, useAct, getImgResFun = undefined) {
        return (e:Elem) => {
            e.cnt = cnt;         
            e.canUse = () => true;
            e.use = async () => {
                e.cnt--;
                if (useAct) await useAct(e);
                return e.cnt > 0;
            };

            e.getElemImgRes = getImgResFun ? () => getImgResFun(e) : () => e.type + e.cnt;
            return e;
        };
    }

    // 可多次对目标使用的物品
    static elemCanUseAtManyTimes(cnt:number, useAtAct, fixImgRes = false) {
        return (e:Elem) => {
            e.cnt = cnt;
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
    static weaponLogic(cnt:number, getImgResFun = undefined) {
        return ElemFactory.elemCanUseAtManyTimes(cnt, async (e, x, y) => await e.bt().implPlayerAttackAt(x, y, e), getImgResFun);
    }

    // 食物
    static foodLogic(cnt:number, dhp:number, getImgResFun = undefined) {
        return ElemFactory.elemCanUseManyTimes(cnt, async (e:Elem) => await e.bt().implAddPlayerHp(dhp), getImgResFun);
    }

    // cd 逻辑
    static triggerColdownLogic(e:Elem, onlyUncovered:boolean = true):Elem {
        e.cd = 0;
        e.checkCD = () => e.cd <= 0;
        e.resetCD = () => e.cd = e.attrs.cd;
        var priorIsValid = e.isValid;
        e.isValid = () => {
            if (priorIsValid && !priorIsValid()) return false;
            return e.checkCD();
        };
        return ElemFactory.addAI("onPlayerActed", async () => {
            if (!(e instanceof Prop) && !(e instanceof Relic) && onlyUncovered && e.getGrid().isCovered()) return;
            Utils.assert(!!e.bt(), "not added to battle yet! " + e.type);            
            e.cd--;
            await e.bt().implNotifyElemChanged("coldown", e);
        }, e, () => true, onlyUncovered);
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
           return ps.subType == "gridUncovered" && (e.pos.x == ps.x && e.pos.y == ps.y) || (Utils.indexOf(placeHolders, (hd) => hd.pos.x == ps.x && hd.pos.y == ps.y) >= 0);
       }, false);

       e.setBattle = (bt:Battle) => 
       {
           e.$$bt = bt;
           for (var hd of placeHolders)
            hd.setBattle(bt);
       };

       return e;
   }
}
