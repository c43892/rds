
// 关卡控制逻辑
class Level {
    public map:Map;
    private bt:Battle; // 反向引用回所属 battle

    public Init(bt:Battle, cfg) {
        this.bt = bt;
        this.InitMap(cfg.map);
        this.InitElems(cfg.elems);
    }

    // 创建地图
    public InitMap(cfg) {
        this.map = new Map();
    }

    // 创建初始元素
    public InitElems(cfg) {
        var elems = [
            ElemFactory.create("EscapePort", this.bt, cfg), // 逃跑出口
            ElemFactory.create("NextLevelPort", this.bt, cfg) // 下一层入口 
        ];

        // 添加其它配置物品
        for (var e in cfg) {
            let eCfg = cfg[e];
            let num = eCfg.num;
            for (var i = 0; i < num; i++)
                elems.push(ElemFactory.create(e, this.bt, eCfg));
        }

        // 依次加入地图
        var i = 0;
        this.map.travelAll((x, y) =>
        {
            this.map.addElemAt(elems[i++], x, y);
            return i >= elems.length;
        });

        // 乱序交换位置
        this.map.travelAll((x, y) =>
        {
            var e = this.map.getElemAt(x, y);
            if (e) {
                var targetX = this.bt.srand.nextInt(0, this.map.size.w);
                var targetY = this.bt.srand.nextInt(0, this.map.size.h);
                this.map.switchElems(x, y, targetX, targetY);
            }
        });
    }
}