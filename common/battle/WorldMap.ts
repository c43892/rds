// 世界地图数据
class WorldMap {
    public stories; // 所有层
    public conns; // 层间连接关系
    public xpos; // 每一层节点的水平位置的值，虽然只是显示用，但要存下来
    public player:Player;

    constructor() {
        this.stories = [];
        this.conns = [];
        this.xpos = [];
    }

    // 从指定配置数据生成一个大地图
    public static buildFromConfig(world):WorldMap {
        var rand:SRandom = new SRandom(undefined);
        var w = new WorldMap();
        var cfg = GCfg.getWorldMapCfg(world);

        // 建立节点库和每一类节点出现的层级约束
        var candidates = [];
        var validLevels = {};
        for (var spec in cfg.specs) {
            validLevels[spec] = cfg.specs[spec].levels;
            for (var i = 0; i < cfg.specs[spec].num; i++)
                candidates.push(spec);
        }
        
        // 确定每层关卡数，第 0 层是起点，最高层确定是 boss

        w.stories.push(["worldmapstart"]);
        w.xpos.push([0.5]);

        var validPos = [];
        var l = cfg.totalLevels;
        for (var i = 1; i < l; i++) {
            var num = rand.nextInt(2, 5);
            var s = [];
            var xpos = [];
            var lp = []
            var x = 0;
            for (var j = 0; j < num; j++) {
                s.push("normal");
                x = rand.nextInt(0, 10);
                xpos.push(x);

                if (i > 0) // 第一层固定普通战斗，后续参与位置随机
                    validPos.push({lv:i, n:j});
            }

            w.stories.push(s);
            xpos.sort();

            // 确保位置不重叠
            for (var j = 0; j < xpos.length - 1; j++)
                if (xpos[j + 1] <= xpos[j])
                    xpos[j + 1] += 1;

            w.xpos.push(Utils.map(xpos, (p) => p / 10));
        }
        w.stories.push(["boss"]);
        w.xpos.push([0.5]);

        // 确定层间连接关系

        w.conns.push([[]]); 
        for (var i = 0; i < w.stories[1].length; i++)
            w.conns[0][0].push(i);

        for (var i = 1; i < l - 1; i++) {
            var n1 = w.stories[i].length;
            var n2 = w.stories[i + 1].length;
            var nk = n1 + "_" + n2;
            var conns = GCfg.worldMapConnectionCfg[nk];
            var lv = rand.nextInt(0, conns.length);
            w.conns.push(conns[lv]);
        }

        w.conns.push([]); 
        for (var i = 0; i < w.stories[l - 1].length; i++)
            w.conns[l - 1].push([0]);

        // 先分配固定配置点
        for (var fixStorey in cfg.fixedSpecs) {
            var lv = parseInt(fixStorey);
            for (var i = 0; i < w.stories[lv].length; i++) {
                var type = cfg.fixedSpecs[fixStorey];
                w.stories[lv][i] = type
                Utils.assert(type != "normal", "normal battle can not be in fixSpecs");
                candidates = Utils.removeFirstWhen(candidates, (c) => c == type);
                validPos = Utils.removeFirstWhen(validPos, (pt) => pt.lv == lv && pt.n == i);
            }
        }

        // 确定随机配置点
        for (var c of candidates) {
            var n = rand.nextInt(0, validPos.length);
            var nlv = validPos[n].lv;
            var nn = validPos[n].n;
            // var checkN = n;
            // while (WorldMap.connectionConflict(w, c, validLevels[c], nlv, nn)) {
            //     n = (n + 1) % lps.length;
            //     Utils.assert(n != checkN, "can not find position for " + c + " in world " + world);
            //     nlv = lps[n].lv;
            //     nn = lps[n].n;
            // }

            w.stories[nlv][nn] = c;
            validPos = Utils.removeAt(validPos, n);
        }

        return w;
    }

    // static connectionConflict(w, type, validLevels, lv, n):boolean {
    //     if (lv < validLevels[0] || lv > validLevels[1])
    //         return true;

    //     if (type != "shop" && type != "camp") // 这两种不检查直连冲突
    //         return false;

    //     var connPrior = lv > 1 ? w.conns[lv - 1] : [];
    //     var connNext = lv < w.conns.length ? w.conns[lv] : [];

    //     for (var ncp = 0; ncp < connPrior.length; ncp++) {
    //         var cp = connPrior[ncp];
            
    //         if (Utils.indexOf(cp, (p) => p == n) >= 0) {
    //             if (w.stories[lv - 1][ncp] == type)
    //                 return true;
    //                 // Utils.log(lv - 1, ncp, w.stories[lv - 1][ncp], " vs ", lv, n, type);
    //         }
    //     }

    //     for (var ncn = 0; ncn < connNext[n].length; ncn++) {
    //         if (w.stories[lv + 1][connNext[n][ncn]] == type)
    //             return true;
    //             // Utils.log(lv, n, type, " vs ", lv + 1, connNext[n][ncn], w.stories[lv + 1][connNext[n][ncn]]);
    //     }

    //     return false;
    // }

    public toString() {
        return "";
    }

    public static fromString(str):WorldMap {
        return undefined;
    }
}