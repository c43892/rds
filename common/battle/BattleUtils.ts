
// 战斗相关工具方法
class BattleUtils {

    // 寻找一个随机的满足条件的位置，f 是形如 function(g:Grid):boolean 的函数
    public static findRandomGrid(bt:Battle, f) {
        var gs:Grid[] = [];
        var map = bt.level.map;
        map.travelAll((x, y) =>
        {
            var g = map.grids[x][y];
            if (f(g))
                gs.push(g);
        });

        return  gs.length == 0 ? undefined : gs[bt.trueRand.nextInt(0, gs.length)];
    }

    // 寻找一个随机的空白位置
    public static findRandomEmptyGrid(bt:Battle, covered:boolean) {
        return BattleUtils.findRandomGrid(bt, (g:Grid) => (g.isCovered() == covered) && g.getElem() == undefined);
    }
}
