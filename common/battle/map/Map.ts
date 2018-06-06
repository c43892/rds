
// 实时的游戏地图，用于存放所有地图格和元素
class Map {
    public size = {w: 0, h: 0}; // 地图尺寸
    public grids : Grid[][]; // 所有地图格子
    public elems : Elem[][]; // 所有元素
    
    public constructor() {
        var w = GBConfig.mapsize.w;
        var h = GBConfig.mapsize.h;

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
                var b = new Grid();
                b.pos = {x: x, y: y};
                b.map = this;
                this.grids[x].push(b);
                
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
        this.travel8Neighbours(cx, cy, (x, y, e) =>
        {
            if (e && e.hazard && e.getGrid().isCovered())
                num++;
        });

        return num;
    }

    // 对指定位置的 8 邻做过滤计算，不包括目标自身, f 是遍历函数，形如 function(x, y, e:Elem, g:Grid):boolean，
    // 返回值表示是否要中断遍历
    public travel8Neighbours(x:number, y:number, f) {
        var breakLoop = false;
        for (var i = x - 1; i <= x + 1 && !breakLoop; i++) {
            for (var j = y - 1; j <= y + 1 && !breakLoop; j++) {
                if (i < 0 || i >= this.size.w || j < 0 || j >= this.size.h)
                    continue; // 越界忽略
                else if (i == x && y == j) // 目标格子不计算在内，只计算八邻位置
                    continue;

                breakLoop = f(i, j, this.elems[i][j], this.grids[i][j]);
            }
        }
    }

    // 对指定位置的 4 邻做过滤计算，不包括目标自身, f 是遍历函数，形如 function(x, y, e:Elem, g:Grid):boolean，
    // 返回值表示是否要中断遍历
    public travel4Neighbours(x:number, y:number, f) {
        var breakLoop = false;
        var neighbours = [{x:x-1, y:y}, {x:x+1, y:y}, {x:x, y:y-1}, {x:x, y:y+1}];
        for (var i = 0; i < neighbours.length; i++) {
            var n = neighbours[i];
            if (n.x < 0 || n.x >= this.size.w || n.y < 0 || n.y >= this.size.h)
                continue; // 越界忽略

            breakLoop = f(n.x, n.y, this.elems[n.x][n.y], this.grids[n.x][n.y]);
        }
    }

    // 是否可以揭开（四邻至少一个揭开，且没有怪物相邻）
    public isUncoverable(x:number, y:number):boolean {
        var uncoverable = false;
        this.travel4Neighbours(x, y, (x, y, e:Elem, g:Grid) => {
            if (g.isCovered() || (e != undefined && e.blockUncover))
                return; // 忽略

            uncoverable = true;
            return uncoverable;
        });

        return uncoverable;
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
        if (this.elems[x][y])
            throw new Error("it's not empty at [" + x + "][" + y + "]");

        e.pos = {x: x, y: y};
        this.elems[x][y] = e;
    }
    
    // 移除一个指定位置的元素
    public removeElemAt(x:number, y:number):Elem {
        this.assertBound(x, y);
        if (!this.elems[x][y])
            throw new Error("no element at [" + x + "][" + y + "]");

        var e = this.elems[x][y];
        this.elems[x][y] = undefined;
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

    // 寻找满足条件的第一个 Elem
    public findFirstElem(f):Elem {
        var e:Elem;
        this.travelAll((x, y) =>
        {
            if (f(x, y, this.elems[x][y])) {
                e = this.elems[x][y];
                return true; //　找到第一个就停止遍历
            }
        });

        return e;
    }

    // 寻找所有满足条件的 Elem, f 是一个函数表示过滤条件，形如 function(x:number, y:number, e:elem):boolean
    public findAllElems(f):Elem[] {
        var es = [];
        this.travelAll((x, y) =>
        {
            if (!f || f(x, y, this.elems[x][y]))
                es.push(this.elems[x][y]);
        });

        return es;
    }

    // 迭代每一个活动元素, f 是一个形如 funciton(e:Elem):boolean 的函数，返回值表示是否要中断迭代
    public foreachUncoveredElems(f) {
        Utils.NDimentionArrayForeach(this.elems, (e:Elem) => {
            if (e && !this.getGridAt(e.pos.x, e.pos.y).isCovered())
                return f(e);
        });
    }
}
