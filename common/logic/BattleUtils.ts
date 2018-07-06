
// 战斗相关工具方法
class BattleUtils {

    // 寻找一个随机的满足条件的位置，f 是形如 function(g:Grid):boolean 的函数
    public static findRandomGrid(bt:Battle, f):Grid {
        var gs:Grid[] = [];
        var map = bt.level.map;
        map.travelAll((x, y) =>
        {
            var g = map.grids[x][y];
            if (f(g))
                gs.push(g);
        });

        return  gs.length == 0 ? undefined : gs[bt.srand.nextInt(0, gs.length)];
    }

    // 寻找一个随机的空白位置
    public static findRandomEmptyGrid(bt:Battle, covered:boolean = false, size = {w:1, h:1}):Grid {
        return BattleUtils.findRandomGrid(bt, (g:Grid) => {
            if (g.pos.x + size.w > g.map.size.w || g.pos.y + size.h > g.map.size.h) return false;
            for (var i = 0; i < size.w; i++) {
                for (var j = 0; j < size.h; j++) {
                    var _g = g.map.getGridAt(g.pos.x + i, g.pos.y + j);
                    if (_g.isCovered() != covered || _g.getElem() != undefined)
                        return false;
                }
            }

            return true;
        });
    }

    // 寻找最多几个随机的满足条件的元素，f 是过滤条件，形如 function(e:Elem):boolean
    public static findRandomElems(bt:Battle, maxNum:number, f):Elem[] {
        var es:Elem[] = [];
        var map = bt.level.map;
        map.travelAll((x, y) =>
        {
            var e = map.elems[x][y];
            if (e && f(e))
                es.push(e);
        });

        if (es.length > maxNum) {
            for (var i = 0; i < maxNum; i++) {
                var n = bt.srand.nextInt(0, es.length);
                var tmp = es[i];
                es[i] = es[n];
                es[n] = tmp;
            }

            return es.slice(0, maxNum);
        }
        else
            return es;
    }

    // 合并计算公式参数
    public static mergeBattleAttrsPS(ps1, ps2) {
        var ps = {
            attackFlags:[],
            power:{a:0, b:0, c:0},
            accuracy:{a:0, b:0, c:0},
            critial:{a:0, b:0, c:0},
            damageAdd:{a:0, b:0, c:0},

            immuneFlags:[],
            shield:{a:0, b:0, c:0},
            dodge:{a:0, b:0, c:0},
            damageDec:{a:0, b:0, c:0},
            resist:{a:0, b:0, c:0},
        };

        for (var k in ps) {
            var v = ps[k];
            if (Array.isArray(v))
                ps[k] = Utils.mergeSet(ps1 ? ps1[k] : undefined, ps2 ? ps2[k] : undefined); // 合并标记
            else { // 合并 a, b, c 参数
                var v1 = ps1 ? ps1[k] : undefined;
                var v2 = ps2 ? ps2[k] : undefined;
                for (var p of ["a", "b", "c"])
                    v[p] = (v1 && v2 && v1[p] && v2[p]) ? (v1[p] + v2[p]) 
                                : (v1 && v1[p] ? v1[p] : 
                                    (v2 && v2[p] ? v2[p] : v[p]));
            }
        }

        ps["addBuffs"] = [];
        if (ps1 && ps1.addBuffs) ps["addBuffs"].push(...ps1.addBuffs);
        if (ps2 && ps2.addBuffs) ps["addBuffs"].push(...ps2.addBuffs);
        ps["owner"] = ps2.owner ? ps2.owner : ps1.owner;

        return ps;
    }

    // 合并战斗属性
    public static mergeBattleAttrs(attrs1, attrs2) {
        var attrs = {
            attackFlags:[],
            power:0,
            accuracy:0,
            critial:0,
            damageAdd:0,

            immuneFlags:[],
            shield:0,
            dodge:0,
            damageDec:0,
            resist:0,
        };

        for (var k in attrs) {
            var v = attrs[k];
            if (Array.isArray(v))
                attrs[k] = Utils.mergeSet(attrs1[k], attrs2[k]); // 合并标记
            else { // 合并 a, b, c 参数
                var v1 = attrs1[k];
                var v2 = attrs2[k];
                attrs[k] = (v1 && v2 ? v1 + v2 : (v1 ? v1 : (v2 ? v2 : 0)));
            }
        }

        attrs["addBuffs"] = [];
        if (attrs1.addBuffs) attrs["addBuffs"].push(...attrs1.addBuffs);
        if (attrs2.addBuffs) attrs["addBuffs"].push(...attrs2.addBuffs);

        return attrs;
    }

    // 获取玩家在世界地图上可以选择的节点
    public static getSelectableStoreyPos(p:Player) {
        if (p.currentStoreyPos.status == "in")
            return [];
        
        Utils.assert(p.currentStoreyPos.status == "finished", "player current storey status ruined");
        var lv = p.currentStoreyPos.lv;
        var n = p.currentStoreyPos.n;
        return Utils.map(p.worldmap.conns[lv][n], (cn) => { return {lv:lv+1, n:cn}; });
    }

    // 指定节点是否当前可选
    public static isStoreyPosSelectable(p:Player, sp) {
        var sps = BattleUtils.getSelectableStoreyPos(p);
        return Utils.indexOf(sps, (p) => p.lv == sp.lv && p.n == sp.n) >= 0;
    }
}