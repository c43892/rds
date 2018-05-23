
// 实时的游戏地图，用于存放所有地图格和元素
class Map {
    
    public size = {w: 0, h: 0}; // 地图尺寸
    public bricks : Brick[][]; // 所有地图格子
    public elems : Elem[][]; // 所有元素

    public constructor(w: number, h: number) {
        this.size = {w: w, h: h};

        for(var i = 0; i < this.size.w; i++) {
            var x = i;
            this.bricks[x] = [];
            this.elems[x] = [];

            for (var j = 0; j < this.size.h; j++) {
                var y = j;

                // 创建地块
                var b = new Brick();
                b.pos = {x: x, y: y};
                b.getElem = () => this.getElemAt(x, y);
                b.getCoveredElemNum = () => this.getCoveredElemNum(x, y);
                this.bricks[x].push(b);
                
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
    public getBrickAt(x: number, y: number) : Brick {
        this.assertBound(x, y);
        return this.bricks[x][y];
    }

    // 计算指定目标位置的 8 邻位置上，隐藏的元素个数，不计算目标位置自身
    public getCoveredElemNum(x: number, y: number) : number {
        var num = 0;
        this.travel8Neighbour(x, y, (e, status) =>
        {
            if (e && status == BrickStatus.Covered)
                num++;
        });

        return num;
    }

    // 对指定位置的 8 邻做过滤计算，不包括目标自身, f 是遍历函数，形如 function(e:Elem, status:BrickStatus):boolean，
    // 返回值表示是否要继续遍历
    public travel8Neighbour(x:number, y:number, f) {
        var l = x <= 0 ? 0 : x - 1;
        var r = x >= this.size.w - 1 ? this.size.w - 1 : x + 1;
        var t = y <= 0 ? 0 : y - 1;
        var b = y >= this.size.h - 1 ? this.size.h - 1 : y = 1;

        var continueLoop = true;
        for (var i = l; i <= r && continueLoop; i++) {
            for (var j = t; j <= b && continueLoop; j++) {
                if (i == x && y == j) // 目标格子不计算在内，只计算八邻位置
                    continue;

                continueLoop = f(this.elems[i][j], this.bricks[i][j].status);
            }
        }
    }

    // 纵向优先依次序遍历地图中的所有格子, f 是遍历函数，形如 function(x:number, y:nubmer):boolean，
    // 返回值表示是否要继续遍历
    public travelAllBricks(f) {
        var continueLoop = true;
        for (var i = 0; i <= this.size.w && continueLoop; i++) {
            for (var j = 0; j <= this.size.h && continueLoop; j++) {
                continueLoop = f(i, j);
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
        this.elems[x1][y1], this.elems[x2][y2] = this.elems[x2][y2], this.elems[x1][y1];
    }
}
