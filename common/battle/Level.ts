
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

    // 创建初始元素
    public InitElems(elemsCfg, constElemsCfg, randomGroupsCfg, elemNumLimit) {
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
            var numRange = group.num;
            var elemsCfgInGroup = group.elems;

            // 汇总该组权重
            var tw = 0; // 总权重
            var w2e = []; // 权重段
            for (var e in elemsCfgInGroup) {
                var w = elemsCfgInGroup[e];
                w2e.push({w:tw, e:e});
                tw += w;
            }

            // 累计数量上限检查
            maxNumLimit += numRange[1] - 1;
            Utils.assert(maxNumLimit <= elemNumLimit, "elem overflow in map: " + this.displayName);

            // 执行随机添加过程
            var num = this.bt.srand.nextInt(numRange[0], numRange[1]);
            for (var i = 0; i < num; i++) {
                var rw = this.bt.srand.nextInt(0, tw);
                for (var j = w2e.length - 1; j >= 0 ; j--) {
                    if (rw >= w2e[j].w) {
                        elems.push(ElemFactory.create(w2e[j].e, elemsCfg[w2e[j].e]));
                        break;
                    }
                }
            }
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