
// 关卡控制逻辑
class Level {
    public displayName:string;
    public map:Map;
    private bt:Battle; // 反向引用回所属 battle

    public Init(bt:Battle, cfg) {
        this.displayName = cfg.displayName;
        this.bt = bt;
        this.InitMap(cfg.map);
        this.InitElems(cfg.elems, cfg.constElems, cfg.randomGroups, 
            GCfg.mapsize.w * GCfg.mapsize.h + cfg.init_uncovered.w + cfg.init_uncovered.h);
    }

    // 创建地图
    public InitMap(cfg) {
        this.map = new Map();
    }

    // 创建指定元素，如果未明确指定配置属性，则默认参考本关卡配置
    private elemsCfgInLevel;
    public createElem(type:string, attrs = undefined):Elem {
        if (!attrs) { // 如果指定配置属性，则不再参考本关卡配置
            attrs = this.elemsCfgInLevel[type];
            while (attrs && attrs.type) {
                type = attrs.type;
                var tAttrs = this.elemsCfgInLevel[type];
                if (tAttrs) {
                    for (var k in attrs)
                        if (k != "type")
                            tAttrs[k] = attrs[k];

                    attrs = tAttrs;
                } else
                    break;
            }
        }

        var attrs =  attrs ? attrs : {};
        var e = ElemFactory.create(type, attrs);

        // 处理携带物品
        if (attrs.dropItems) {
            for (var dpType of attrs.dropItems) {
                var dpe = this.createElem(dpType);
                e.addDropItem(dpe);
            }
        }

        // 处理随机掉落
        if (attrs.rdp) {
            var rdp = GCfg.getRandomDropGroupCfg(attrs.rdp);
            var arr = Utils.randomSelectByWeight(rdp.elems, this.bt.srand, rdp.num[0], rdp.num[1]);
            for (var dpType of arr)
                e.randomDrops.push(this.createElem(dpType));
        }

        return ElemFactory.doDropItemsOnDie(e);
    }

    // 创建初始元素
    public InitElems(elemsCfg, constElemsCfg, randomGroupsCfg, elemNumLimit) {
        this.elemsCfgInLevel = elemsCfg;
        var maxNumLimit = 0; // 做最大可能数量的检查
        var elems = [
            ElemFactory.create("EscapePort"), // 逃跑出口
            ElemFactory.create("Door") // 下一层入口的门
        ];

        // 添加固定元素
        for (var e in constElemsCfg) {
            let num = constElemsCfg[e];
            for (var i = 0; i < num; i++)
                elems.push(ElemFactory.create(e, elemsCfg[e]));
        }

        // 添加随机元素
        for (var group of randomGroupsCfg) {
            
            // 累计数量上限检查
            maxNumLimit += group.num[1] - 1;
            Utils.assert(maxNumLimit <= elemNumLimit, "elem overflow in map: " + this.displayName);

            var arr = Utils.randomSelectByWeight(group.elems, this.bt.srand, group.num[0], group.num[1]);
            for (var et of arr)
                elems.push(this.createElem(et));
        }

        // 依次加入地图
        var i = 0;
        this.map.travelAll((x, y) =>
        {
            this.map.addElemAt(elems[i++], x, y);
            return i >= elems.length;
        });
    }

    // 乱序所有元素
    public RandomElemsPos() {
        // 乱序交换位置
        this.map.travelAll((x, y) =>
        {
            var e = this.map.getElemAt(x, y);
            if (e) {
                // 乱序的随机性，是独立于主随机序列的，不参与存档，但参与录像，所以玩家是可以刷的
                var targetX = this.bt.trueRand.nextInt(0, this.map.size.w);
                var targetY = this.bt.trueRand.nextInt(0, this.map.size.h);
                this.map.switchElems(x, y, targetX, targetY);
            }
        });
    }
}