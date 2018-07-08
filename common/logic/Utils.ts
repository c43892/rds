class Utils {

    // 将当前所见地图信息打印在控制台
    public static logMap(map:Map) {
        console.log("==============\r\n");
        var str = "";
        for (var j = 0; j < map.size.h; j++) {
            for (var i = 0; i < map.size.w; i++) {
                var b = map.getGridAt(i, j);
                if (b.status == GridStatus.Covered)
                    str += ". ";
                else if (b.status == GridStatus.Blocked)
                    str += "* ";
                else {
                    var e = map.getElemAt(i, j);
                    if (!e)
                        str += map.getCoveredHazardNum(i, j) + " ";
                    else
                        str += e.type.charAt(0) + " ";
                }
            }
            str += "\r\n";
        }
        console.log(str);
    }

    // 条件断言
    public static assert(condition: boolean, msg:string) {
        if (!condition)
            throw new Error(msg);
    }

    // 在包含指定的中心位置的情况下，计算一个指定大小的区域，保证不超过给定边界，
    // 边界左闭右开，cx,cy 是中心位置，rw,rh 是结果区域的尺寸，
    // minx, miny, maxx, maxy 是限定边界。
    // 计算结果是一个 {left:left, top:top} 表示结果区域的的最小坐标的边角
    public static calculateBoundary(cx:number, cy:number, rw:number, rh:number, 
            minx:number, miny:number, maxx:number, maxy:number):any {

        // 所期望的结果区域，尺寸不能大于限定区域
        Utils.assert(rw > 0 && rw <= maxx - minx && rh > 0 && rh <= maxy - miny, 
            "the region size should in ((0, 0), (maxx - minx, maxy - miny)]");
        
        // 计算四边界，从中心位置，向左右两边扩展，然后向上下两边扩展
        var l = cx, r = cx, t = cy, b = cy;

        // 计算横向区域范围
        for (var w = 1; w < rw; w++) {
            // 往左有空间的情况下，(要么右边顶住了 || 要么扩展区域偏右了)，此时向左扩展
            if (l > minx && (r >= maxx - 1 || cx - l < r - cx))
                l--;
            else  // 只要没有向左扩展，就向右扩展
                r++;
        }

        // 计算纵向区域范围
        for (var h = 1; h < rh; h++) {
            // 往上有空间的情况下，(要么下边顶住了 || 要么扩展区域偏下了)，此时向上扩展
            if (t > miny && (b >= maxy - 1 || cy - t < b - cy))
                t--;
            else  // 只要没有向上扩展，就向下扩展
                b++;
        }

        return {left:l, top:t};
    }

    // 遍历一个数组，无论这个数组是几维的，都逐维遍历其中元素
    public static NDimentionArrayForeach(nArr, f) {
        var breakLoop = false;
        var unpackArr = function(arr) {
            for (var e of arr) {
                if (Array.isArray(e))
                    unpackArr(e);
                else
                    breakLoop = f(e);

                if (breakLoop)
                    return;
            } 
        };

        unpackArr(nArr);
    }

    // 根据给定的多维坐标序列，生成一个连续插值迭代的函数，pts 是一个 number[][]，每一个 number[] 表示一个节点坐标，
    // 返回值形如 function(deltaDistance:nubmer):number[]，参数表示距离变化，这个值是每次调用累计增加的（只能为正数），
    // 返回值表示是本次插值结果，如果是 undefined 则表示迭代结束，
    // 距离使用欧式定义，作为节点的每个 number[] 必须有同样维度
    public static createInterpolater(pts:number[][]) {
        var len = pts.length;

        // 0，1 个节点特别处理一下，1 个节点的时候，只跑一帧
        if (pts.length == 0)
            return (dd:number) => undefined;
        else if (pts.length == 1) {
            var moved = false;
            return (dd:number) => {
                if (!moved) {
                    moved = true;
                    return pts[0];
                }
                else
                    return undefined;
            }
        }

        // 多节点累计插值结算
        var lastPt = pts[0];
        var n = 1;
        var iter = (dd:number) => {
            Utils.assert(dd >= 0, "deltaDistance must be positive number");
            if (n >= pts.length)
                return undefined;
            
            var a = lastPt;
            var b = pts[n];
            var d2 = 0;
            for (var i in a) { d2 += Math.abs(b[i] - a[i]); }
            var d = Math.sqrt(d2);
            if (dd >= d) { // 越过下一节点
                lastPt = b;
                n++;
                dd -= d;
            }
            else { // 两节点间插值
                var p = a.slice();
                for (var i in a) {
                    p[i] += (b[i] - a[i]) * dd / d;
                }

                lastPt = p;
            }

            return lastPt;
        };

        return iter;
    }

    // 将一维坐标序列包装成 createInterpolaterN 的参数格式
    public static createInterpolater1(pts:number[]) {
        return Utils.createInterpolater(Utils.map(pts, (n) => [n]));
    }

    // 将一个数组映射为一个新的数组
    public static map(srcArr:any[], mapFunc):any[] {
        var dstArr = [];
        for (var s of srcArr)
            dstArr.push(mapFunc(s));

        return dstArr;
    }

    // 延时等待
    public static delay(ms: number):Promise<void> {
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }

    // log 多个参数
    public static log(...params:any[]) { console.log(Utils.logStr(...params)); }
    static logStr(...params:any[]):string {
        var str = "";
        for (var p of params) {
            if (Array.isArray(p))
                str += "[" + Utils.logStr(...p) + "],";
            else if (p == undefined)
                str += "$$undefined" + ",";
            else
                str += p + ",";
        }

        return str;
    }

    public static logObjs(...objs:Object[]) {
        var str = "";
        for (var o of objs) {
            str += "{";
            for (var k in o)
                str += k + ":" + o[k] + ",";
            str += "}";
        }

        console.log(str);
    }

    // 寻找第一个满足条件的元素，f 表示判断条件, fromIndex 表示开始搜索的位置，
    // 返回值是满足条件的元素的索引，未找到是 -1
    public static indexOf<T>(arr:T[], f, fromIndex:number = 0):number {
        if (arr == undefined || arr.length == 0)
            return -1;

        for (var i = fromIndex; i < arr.length; i++) {
            var e = arr[i];
            if (f(e))
                return i;
        }

        return -1;
    }

    // 统计数量
    public static Count<T>(arr:T[], f, fromIndex:number = 0):number {
        if (arr == undefined || arr.length == 0)
            return 0;
        
        var cnt = 0;
        for (var i = fromIndex; i < arr.length; i++) {
            var e = arr[i];
            if (f(e))
                cnt++;
        }

        return cnt;
    }

    // 指定数组是否包含某一指定值
    public static contains<T>(arr:T[], v:T, fromIndex:number = 0):boolean {
        return Utils.indexOf(arr, (e) => v == undefined ? e == undefined : e == v, fromIndex) >= 0;
    }

    // 移除数组中指定位置的元素，结果作为一个新数组返回
    public static removeAt(arr, n) {
        if (n < 0 || n >= arr.length)
            return arr;

        return [...arr.slice(0, n), ...arr.slice(n + 1)];
    }

    // 过滤出数组中满足条件的元素，结果作为一个新数组返回
    public static filter(arr, f) {
        if (!f)
            return [...arr];

        var narr = [];
        for (var i = 0; i < arr.length; i++) {
            var e = arr[i];
            if (f(e)) narr.push(e);
        }

        return narr;
    }

    // 移除数组中的指定元素
    public static remove(arr, e) {
        return Utils.removeFirstWhen(arr, (_e) => _e == e);
    }

    // 移除数组中满足条件的第一个元素，结果作为一个新数组返回
    public static removeFirstWhen(arr, f) {
        for (var i = 0; i < arr.length; i++) {
            if (f(arr[i]))
                return Utils.removeAt(arr, i);
        }

        return arr;
    }

    // 按照名称对应规则进行事件处理的批量映射
    public static registerEventHandlers(eventDispatcher, events:string[], getHandler) {
        for (var e of events) {
            var h = getHandler(e);
            eventDispatcher.registerEvent(e, h);
        }
    }

    // 合并多个数组，并去除相同项目
    public static mergeSet(...ss:string[][]):string[] {
        var map = {};
        for (var s of ss) {
            if (!s) continue;
            for (var k of s) {
                map[k] = 0;
            }
        }

        var r = [];
        for (var k in map)
            r.push(k);

        return r;
    }

    // 测试期间用，本地存储部分数据
    public static $$saveItem(key:string, value:string) {
        egret.localStorage.setItem(key, value);
    }

    // 测试期间用，从本地存储读取数据
    public static $$loadItem(key:string):string {
        return egret.localStorage.getItem(key);
    }

    // 根据指定权重，随机选取若干目标，集合格式为 {type:weight, type:weight, ...}
    public static randomSelectByWeight(elemsWithWeight, srand:SRandom, numMin:number, numMax:number, noDuplicated:boolean) {
        var r = [];

        // 汇总该组权重
        var tw = 0; // 总权重
        var w2e = []; // 权重段
        var reweight = () => {
            tw = 0;
            w2e = [];
            for (var e in elemsWithWeight) {
                var w = elemsWithWeight[e];
                if (w > 0) {
                    w2e.push({w:tw, e:e});
                    tw += w;
                }
            }
        };

        reweight();

        // 执行随机添加过程
        var num = srand.nextInt(numMin, numMax);
        for (var i = 0; i < num && w2e.length > 0; i++) {
            var rw = srand.nextInt(0, tw);
            for (var j = w2e.length - 1; j >= 0 ; j--) {
                if (rw >= w2e[j].w) {
                    var e =w2e[j].e;
                    r.push(e);
                    if (noDuplicated) { // 移除已选中的，并重新计算权重
                        elemsWithWeight[e] = 0;
                        reweight();
                    }
                    break;
                }
            }
        }

        return r;
    }

    // 在 randomSelectByWeight 之前，从掉落列表中，过滤掉玩家有携带遗物并且已经到达顶级强化等级的遗物，如果
    // 过滤后列表为空，则填入一个指定的替代品
    public static randomSelectByWeightWithPlayerFilter(p:Player, elemsWithWeight, srand:SRandom, numMin:number, numMax:number, noDuplicated:boolean, defaultRelicType:string = undefined) {
        var cnt = 0;
        var elems = {};

        // 移除掉不应该再出现的遗物(玩家持有并且已经到达强化等级上限，或者职业冲突)
        for (var e in elemsWithWeight) {

            // 检查职业冲突
            var eCfg = GCfg.getElemAttrsCfg(e);
            if (eCfg.occupations && !Utils.contains(eCfg.occupations, e))
                continue;

            // 检查遗物强化等级
            var n = Utils.indexOf(p.relics, (r) => r.type == e);
            if (n >= 0) {
                var r:Relic = <Relic>p.relics[n];
                if (!r.canReinfoce())
                    continue;
            }

            elems[e] = elemsWithWeight[e];
            cnt++;
        }

        // 如果列表为空，且有指定默认替代遗物类型，则添加一个保底
        if (cnt == 0 && defaultRelicType)
            elems[defaultRelicType] = 1;

        return Utils.randomSelectByWeight(elems, srand, numMin, numMax, noDuplicated);
    }
}
