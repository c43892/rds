
// 实时的游戏地图，用于存放所有地图格和元素
class Map {
    public size = {w: 0, h: 0}; // 地图尺寸
    public grids : Grid[][]; // 所有地图格子
    public elems : Elem[][]; // 所有元素
    
    public constructor() {
        var w = GCfg.mapsize.w;
        var h = GCfg.mapsize.h;

        this.size = {w: w, h: h};
        this.grids = [];
        this.elems = [];

        for(var i = 0; i < this.size.w; i++) {
            var x = i;
            this.grids[x] = [];
            this.elems[x] = [];

            for (var j = 0; j < this.size.h; j++) {
                var y = j;

                // 创建地块
                var g = new Grid();
                g.pos = {x: x, y: y};
                g.map = this;
                g.status = GridStatus.Uncovered;
                this.grids[x].push(g);
                
                // 地图创建时，地块上没有元素，但是要把位置先占住
                this.elems[x].push(undefined);
            }
        }
    }

    // 检查边界，越界则报异常
    assertBound(x:number, y:number) {
        if (x < 0 || x >= this.size.w || y < 0 || y >= this.size.h)
            throw new Error("index out of bounds");
    }

    // 获取指定位置的元素
    public getElemAt(x: number, y: number) : Elem {
        this.assertBound(x, y);
        return this.elems[x][y];
    }

    // 获取指定位置的地块
    public getGridAt(x: number, y: number) : Grid {
        this.assertBound(x, y);
        return this.grids[x][y];
    }

    // 计算指定目标位置的 8 邻位置上，隐藏的有害元素个数，不计算目标位置自身
    public getCoveredHazardNum(cx: number, cy: number) : number {
        var num = 0;
        this.travel8Neighbours(cx, cy, (x, y, g:Grid) =>
        {
            var e = g.getElem();
            if (e && e.isHazard() && e.getGrid().isCovered()) {
                if (e.hideHazardNum())
                    num = -1;
                else
                    num++;
            }

            return num < 0;
        });

        return num;
    }

    // 对指定位置的 8 邻做过滤计算，不包括目标自身, f 是遍历函数，形如 function(x, y, g:Grid):boolean，
    // 返回值表示是否要中断遍历
    public travel8Neighbours(x:number, y:number, f) {
        var breakLoop = false;
        for (var i = x - 1; i <= x + 1 && !breakLoop; i++) {
            for (var j = y - 1; j <= y + 1 && !breakLoop; j++) {
                if (i < 0 || i >= this.size.w || j < 0 || j >= this.size.h)
                    continue; // 越界忽略
                else if (i == x && y == j) // 目标格子不计算在内，只计算八邻位置
                    continue;

                breakLoop = f(i, j, this.grids[i][j]);
            }
        }
    }

    // 对指定位置的 4 邻做过滤计算，不包括目标自身, f 是遍历函数，形如 function(x, y, g:Grid):boolean，
    // 返回值表示是否要中断遍历
    public travel4Neighbours(x:number, y:number, f) {
        var breakLoop = false;
        var neighbours = [{x:x-1, y:y}, {x:x+1, y:y}, {x:x, y:y-1}, {x:x, y:y+1}];
        for (var i = 0; i < neighbours.length; i++) {
            var n = neighbours[i];
            if (n.x < 0 || n.x >= this.size.w || n.y < 0 || n.y >= this.size.h)
                continue; // 越界忽略

            breakLoop = f(n.x, n.y, this.grids[n.x][n.y]);
        }
    }

    // 指定位置是否可用（不考虑特殊可用逻辑，比如全图可用等），如果有显形的有害怪物在附近，则不可用。
    // 不可用影响空地探索，也影响物品使用和生效
    public isGenerallyValid(x:number, y:number):boolean {        
        var g = this.getGridAt(x, y);
        var e = this.getElemAt(x, y);
        if (!g.isCovered()) { // 揭开的怪或空地始终可用
            if (!e || e instanceof Monster)
                return true;
        } else if (g.status == GridStatus.Marked && e instanceof Monster)
            return true; // 被标记的怪也可用

        var valid = true;
        this.travel8Neighbours(x, y, (x, y, g:Grid) => {
            var e = g.isCovered() ? undefined : g.getElem();
            valid = !e || !e.isHazard();
            return !valid;
        })

        return valid;
    }

    // 是否可以揭开（未揭开状态，四邻至少一个揭开，且没有怪物相邻）
    public isUncoverable(x:number, y:number):boolean {
        var g = this.grids[x][y];
        if (g.status == GridStatus.Uncovered || g.status == GridStatus.Blocked)
            return false;

        var uncoverable = false; // 检查 4 邻是否有揭开，且不阻挡
        this.travel4Neighbours(x, y, (x, y, g:Grid) => {
            var e = g.getElem();
            if (!g.isCovered() && (!e || !e.isBarrier()))
                uncoverable = true;
            return uncoverable;
        });

        // 检查 8 邻是否有怪
        if (uncoverable)
            uncoverable = this.isGenerallyValid(x, y);

        return uncoverable;
    }

    // 是否可行走
    public isWalkable(x:number, y:number):boolean {
        if (x < 0 || x >= this.size.w || y < 0 || y >= this.size.h)
            return false;

        if (this.elems[x][y] || this.grids[x][y].isCovered())
            return false;

        return true;
    }

    // 纵向优先依次序遍历地图中的所有格子, f 是遍历函数，形如 function(x:number, y:nubmer):boolean，
    // 返回值表示是否要继续遍历
    public travelAll(f) {
        var breakLoop = false;
        for (var i = 0; i < this.size.w && !breakLoop; i++) {
            for (var j = 0; j < this.size.h && !breakLoop; j++) {
                breakLoop = f(i, j);
            }
        }
    }

    // 在指定位置添加一个元素，如果位置已经被占用，则会报错
    public addElemAt(e:Elem, x:number, y:number) {
        this.assertBound(x, y);
        if (this.elems[x][y]) {
            var str = "it's not empty at [" + x + "][" + y + "] for " + e.type + " over " + this.elems[x][y].type;
            throw new Error(str);
        }

        e.pos = {x: x, y: y};
        this.elems[x][y] = e;

        if (e.isBig()) {
            this.assertBound(x + e.attrs.size.w - 1, y + e.attrs.size.h - 1);
            var hds = e["placeHolders"]();
            var index = 0;
            for (var i = 0; i < e.attrs.size.w; i++) {
                for (var j = 0; j < e.attrs.size.h; j++) {
                    if (i == 0 && j == 0) continue;
                    this.addElemAt(hds[index], x + i, y + j);
                    index ++;
                }
            }
        }
    }
    
    // 移除一个指定位置的元素
    public removeElemAt(x:number, y:number):Elem {
        this.assertBound(x, y);
        var e = this.getElemAt(x, y);
        if (!e)
            throw new Error("no element at [" + x + "][" + y + "]");

        this.elems[x][y] = undefined;

        if (e.isBig()) {
            var hds = e["placeHolders"]();
            for (var hd of hds)
                this.removeElemAt(hd.pos.x, hd.pos.y);
        }

        return e;
    }

    // 交换两个元素位置
    public switchElems(x1: number, y1: number, x2:number, y2:number) {
        this.assertBound(x1, y1);
        this.assertBound(x2, y2);
        var e1 = this.elems[x1][y1];
        var e2 = this.elems[x2][y2];
        this.elems[x1][y1] = e2;
        this.elems[x2][y2] = e1;
        if (this.elems[x1][y1])
            this.elems[x1][y1].pos = {x: x1, y: y1};
        if (this.elems[x2][y2])
            this.elems[x2][y2].pos = {x: x2, y: y2};
    }

    // 寻找满足条件的第一个 Grid
    public findFirstGrid(f):Grid {
        var g:Grid;
        this.travelAll((x, y) =>
        {
            if (f(x, y, this.grids[x][y])) {
                g = this.grids[x][y];
                return true; //　找到第一个就停止遍历
            }
        });

        return g;
    }

    // 寻找满足条件的所有 Grid
    public findAllGrid(f):Grid[] {
        var grids:Grid[] = [];
        this.travelAll((x, y) =>
        {
            if (f(x, y, this.grids[x][y])) {
                grids.push(this.grids[x][y]);
            }
        });
        return grids;
    }

    // 寻找满足条件的第一个 Elem
    public findFirstElem(f):Elem {
        var e:Elem;
        this.travelAll((x, y) =>
        {
            var elem = this.elems[x][y];
            if (elem && f(elem)) {
                e = elem;
                return true; //　找到第一个就停止遍历
            }
        });

        return e;
    }

    // 寻找满足条件的第一个揭开了的 Elem
    public findFirstUncoveredElem(f):Elem {
        return this.findFirstElem((e) => e && !this.grids[e.pos.x][e.pos.y].isCovered() && f(e));
    }

    // 寻找所有满足条件的 Elem, f 是一个函数表示过滤条件，形如 function(e:elem):boolean
    public findAllElems(f = undefined):Elem[] {
        var es = [];
        this.travelAll((x, y) =>
        {
            var e = this.elems[x][y];
        if (e && (!f || f(e)))
                es.push(e);
        });

        return es;
    }

    // 迭代每一个元素
    public foreachElem(f, condition = undefined) {
        var es = [];
        Utils.NDimentionArrayForeach(this.elems, (e:Elem) => {
            if (e && (!condition || condition(e)))
                es.push(e);
        });

        for (var e of es) {
            if (f(e))
                break;
        }
    }

    // 迭代每一个活动元素, f 是一个形如 funciton(e:Elem):boolean 的函数，返回值表示是否要中断迭代
    public foreachUncoveredElems(f) {
        this.foreachElem(f, (e:Elem) => !e.getGrid().isCovered());
    }

    // astar 寻路相关

    private startPos;
    private endPos;
    private pathGraph:astar.Graph;

    // 确保寻路器准备继续
    public makeSurePathFinderPrepared() {
        if (!this.pathGraph)
            this.preparePathFinder();
    }

    // 准备寻路器
    public preparePathFinder():boolean {
        Utils.assert(!this.pathGraph, "path graph is already prepared");

        var wf = (x, y) => {
            return (x == this.startPos.x && y == this.startPos.y)
                || (x == this.endPos.x && y == this.endPos.y)
                || this.isWalkable(x, y);
        };

        this.pathGraph = new astar.Graph(this.size.w, this.size.h, wf);
        return this.pathGraph != undefined;
    }

    // 执行寻路操作
    public findPath (start, end, options) {
        Utils.assert(!!this.pathGraph, "path graph is not prepared yet");
        Utils.assert(Utils.isInArea(start, {x:0, y:0}, this.size) && Utils.isInArea(end, {x:0, y:0}, this.size), 
            "start & end position should be in map area: " + start.x + ", " + start.y + " - " + end.x + ", " + end.y);

        this.startPos = start;
        this.endPos = end;
        var path = this.pathGraph.search(start.x, start.y, end.x, end.y, true);
        this.startPos = undefined;
        this.endPos = undefined;
        return path;
    }
}
