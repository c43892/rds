class Utils {
    // 将当前所见地图信息打印在控制台
    public static LogMap(map:Map) {
        console.log("==============\r\n");
        var str = "";
        for (var i = 0; i < map.size.w; i++) {
            for (var j = 0; j < map.size.h; j++) {
                var b = map.getBrickAt(i, j);
                if (b.status == BrickStatus.Covered)
                    str += ". ";
                else if (b.status == BrickStatus.Blocked)
                    str += "* ";
                else {
                    var e = map.getElemAt(i, j);
                    if (!e)
                        str += map.getCoveredElemNum(i, j) + " ";
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
        var continueLoop = true;
        var unpackArr = function(arr) {
            for (var e in arr) {
                if (Array.isArray(e))
                    unpackArr(e);
                else
                    continueLoop = f(e);

                if (!continueLoop)
                    return;
            } 
        };
    }
}