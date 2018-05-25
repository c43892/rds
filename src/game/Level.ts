
// 关卡控制逻辑
class Level {
    public map:Map;
    private srand: SRandom;

    public Init(cfg, mapsize, randomSeed:number) {
        this.srand = new SRandom(randomSeed);
        this.InitMap(cfg.map, mapsize);
        this.InitElems(cfg.elems);
    }

    // 创建地图
    public InitMap(cfg, size) {
        this.map = new Map(size.w, size.h);
    }

    // 创建初始元素
    public InitElems(cfg) {
        var elems = [
            ElemFactory.create("EscapePort", this.map), // 逃跑出口
            ElemFactory.create("NextLevelPort", this.map) // 下一层入口 
        ];

        // 添加其它配置物品
        for (var e in cfg) {
            let num = cfg[e];
            for (var i = 0; i < num; i++)
                elems.push(ElemFactory.create(e, this.map));
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
                var targetX = this.srand.nextInt(0, this.map.size.w);
                var targetY = this.srand.nextInt(0, this.map.size.h);
                this.map.switchElems(x, y, targetX, targetY);
            }
        });
    }
}