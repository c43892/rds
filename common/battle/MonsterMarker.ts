// 用于计算怪物的 mark 逻辑
class MonsterMarker {

    // 从指定位置开始计算，看是否有怪物群应该被标记，
    // 被标记的条件是：
    // 1、包含指定位置的，一片互相连接且未解开的块，且和其它未揭开的块孤立
    // 2、这一片孤立的未揭开的块里面，全部是怪物，没有空地或者其它道具
    // 返回值表示要被标记的坐标序列，格式为 [[x1,y1], [x2,y2], ...]，无结果则返回 []
    public static CalcMonsterMarkSignAt(map:Map, x:number, y:number):number[][] {
        var forCheck = [[x, y]]; 
        var markPos = [];
        while (forCheck.length > 0) {
            var pos = forCheck.shift();
            var cx = pos[0];
            var cy = pos[1];
            var g = map.getGridAt(cx, cy);
            if (!g.isCovered()) // 被揭开了的不管
                continue;
            else {
                var e = map.getElemAt(cx, cy);
                if (!e || !e.hazard()) // 如果有未揭开的非怪物，则直接返回结果
                    return [];
            }

            // 剩下的情况，应该就是未揭开的怪物了
            Utils.assert(g.isCovered() && e && e.hazard(), "should be covered hazared element here!");

            // 这个块本自身入标记组，并开始检查其周围的相邻块
            markPos.push([cx, cy]);
            map.travel8Neighbours(cx, cy, (px, py, g) => {
                if (Utils.indexOf(markPos, (pt) => px == pt[0] && py == pt[1]) < 0
                    && Utils.indexOf(forCheck, (pt) => px == pt[0] && py == pt[1]) < 0) {
                    forCheck.push([px, py]);
                }
            });
        }

        return markPos;
    }
}