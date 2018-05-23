
// 关卡控制逻辑
class Level {
    srand: SRandom;
    map:Map;

    public Init(cfg, randomSeed:number) {
        this.srand = new SRandom(randomSeed);
        this.InitMap(cfg.map);
        this.InitElems(cfg.elems);
    }

    // 创建地图
    public InitMap(cfg) {
        this.map = new Map(cfg.w, cfg.h);
    }

    // 创建初始元素
    public InitElems(cfg) {
        var elems = [
            ElemFactory.Create("EscapePort", this.map), // 逃跑出口
            ElemFactory.Create("NextLevelPort", this.map) // 下一层入口 
        ];

        // 依次加入地图
        var i = 0;
        this.map.travelAllBricks((x, y) =>
        {
            this.map.addElemAt(elems[i++], x, y);
            return i >= elems.length;
        });

        // 乱序交换位置
        this.map.travelAllBricks((x, y) =>
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