class Utils {
    // 将当前所见地图信息打印在控制台
    public static LogMap(map:Map) {
        for (var i = 0; i < map.size.w; i++) {
            for (var j = 0; j < map.size.h; j++) {
                var b = map.getBrickAt(i, j);
                if (b.status == BrickStatus.Covered)
                    console.log(".");
                else if (b.status == BrickStatus.Blocked)
                    console.log("*");
                else {
                    var e = map.getElemAt(i, j);
                    if (!e)
                        console.log(map.getCoveredElemNum(i, j));
                    else
                        console.log(e.type.charAt(0));
                }
            }
        }
    }
}