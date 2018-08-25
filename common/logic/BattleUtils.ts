
// 战斗相关工具方法
class BattleUtils {

    // 寻找一个随机的满足条件的位置，f 是形如 function(g:Grid):boolean 的函数，最多 maxNum 个
    public static findRandomGrids(bt:Battle, f, maxNum:number = 1):Grid[] {
        var gs:Grid[] = [];
        var map = bt.level.map;
        map.travelAll((x, y) =>
        {
            var g = map.grids[x][y];
            if (f(g))
                gs.push(g);
        });

        var rs = [];
        while (gs.length > 0 && rs.length < maxNum && rs.length < gs.length) {
            var n = bt.srand.nextInt(0, gs.length - rs.length);
            var g = gs[n];
            gs[n] = gs[gs.length - 1];
            gs[gs.length - 1] = g;
            rs.push(g);
        }

        return rs;
    }

    // 寻找一个随机的空白位置
    public static findRandomEmptyGrid(bt:Battle, covered:boolean = false, size = {w:1, h:1}):Grid {
        return BattleUtils.findRandomGrids(bt, (g:Grid) => {
            if (g.pos.x + size.w > g.map.size.w || g.pos.y + size.h > g.map.size.h) return false;
            for (var i = 0; i < size.w; i++) {
                for (var j = 0; j < size.h; j++) {
                    var _g = g.map.getGridAt(g.pos.x + i, g.pos.y + j);
                    if (_g.isCovered() != covered || _g.getElem() != undefined)
                        return false;
                }
            }

            return true;
        })[0];
    }

    // 寻找一个离指定位置最近的满足条件的位置
    public static findNearestGrid(map:Map, pos, f) {
        // 确定最大搜索半径
        var w = map.size.w;
        var h = map.size.h;
        var dxl = pos.x;
        var dxr = w - pos.x;
        var dyt = pos.y;
        var dyb = h - pos.y;
        var maxDx = dxl > dxr ? dxl : dxr;
        var maxDy = dyt > dyb ? dyt : dyb;
        var maxd = maxDx > maxDy ? maxDx : maxDy;

        var x = 0;
        var y = 0;
        for (var d = 0; d < maxd; d++) {
            for (var i = -d; i <= d; i++) {
                var checkPos = [
                    {x:pos.x + i, y:pos.y - d},
                    {x:pos.x + i, y:pos.y + d},
                    {x:pos.x - d, y:pos.y + i},
                    {x:pos.x + d, y:pos.y + i},
                ];

                for (var pt of checkPos) {
                    if (Utils.isInArea(pt, {x:0, y:0}, map.size)) {
                        var g = map.getGridAt(pt.x, pt.y);
                        if(f(g)) return g;
                    }
                }
            }
        }
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
            critical:{a:0, b:0, c:0},
            damageAdd:{a:0, b:0, c:0},
            muiltAttack:0,

            targetFlags:[],
            shield:{a:0, b:0, c:0},
            dodge:{a:0, b:0, c:0},
            damageDec:{a:0, b:0, c:0},
            resist:{a:0, b:0, c:0},            
        };

        for (var k in ps) {
            var v = ps[k];
            if (Array.isArray(v))
                ps[k] = Utils.mergeSet(ps1 ? ps1[k] : undefined, ps2 ? ps2[k] : undefined); // 合并标记
            else if (v == 0)
                ps[k] = ps1[k] + ps2[k];
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
            critical:0,
            damageAdd:0,

            targetFlags:[],
            shield:0,
            dodge:0,
            damageDec:0,
            resist:0,
            muiltAttack:0,
            damageShared:0
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
        var lv = p.currentStoreyPos.lv;
        var n = p.currentStoreyPos.n;

        var selectableNodes = [];
        var currentNode = WorldMapNode.getNode(n, lv, p.worldmap.nodes);

        for(var i = 0; i < currentNode.routes.length; i++){//找到该点所有路线的目的地
            if(currentNode.routes[i]){
                selectableNodes.push({n:currentNode.routes[i].dstNode.x, lv:currentNode.routes[i].dstNode.y});
            }
        }

        return selectableNodes;
    }

    // 指定节点是否当前可选
    public static isStoreyPosSelectable(p:Player, sp) {
        var sps = BattleUtils.getSelectableStoreyPos(p);
        return Utils.indexOf(sps, (p) => p.lv == sp.lv && p.n == sp.n) >= 0;
    }

    // 将指定元素移动到指定区域
    public static moveElem2Area(bt:Battle, elemType:string, areaLeftCorner, areaSize):Elem {
        var e = bt.level.map.findFirstElem((elem:Elem) => elem.type == elemType);
        if (!e) return e; // 没找到指定元素

        var grid = BattleUtils.findRandomGrids(bt, (g:Grid) => Utils.isInArea(g.pos, areaLeftCorner, areaSize) && !g.getElem())[0];
        if (!grid) return; // 没找到空位置

        bt.level.map.switchElems(e.pos.x, e.pos.y, grid.pos.x, grid.pos.y);
        return e;
    }

    // 判断GridA是否在GridB的周围,取八格
    public static isAround(gridA:Grid, gridB:Grid){
        var isAroundPos = (posA, posB) => {
            if(Math.abs(posA.x - posB.x) <= 1 && Math.abs(posA.y - posB.y) <= 1 && !(posA.x == posB.x && posA.y == posB.y))
                return true;
            else 
                return false;
        }

        var isAroundForBig = (e:Elem, posB) => {
            if(isAroundPos(e.getGrid().pos, gridB.pos)){ // 检查bigElem
                return true;
            } else 
                var placeHolders = e["placeHolders"]();
                for(var i = 0; i < placeHolders.length; i++){ // 检查所有占位符位置
                    if(isAroundPos(placeHolders[i].pos, gridB.pos))
                        return true;
                }
        }

        var e = gridA.getElem();
        if(e == undefined){
            return isAroundPos(gridA.pos, gridB.pos);
        } else if(e["linkTo"]) { // 是占位符，检查同属一个e的所有占位符以及e
            e = e["linkTo"];
            return isAroundForBig(e, gridB.pos);
        } else if(e.isBig()){
            return isAroundForBig(e, gridB.pos);
        } else (e)
        return isAroundPos(gridA.pos, gridB.pos);
    }

    // 乱序地图上所有元素
    public static randomElemsPosInMap(bt:Battle) {

        var biggerElems = [];
        var normalElems = [];
        var map = bt.level.map;

        // 先分开大尺寸元素和普通元素
        map.travelAll((x, y) => {
            var e = map.getElemAt(x, y);
            if (!e || e.type == "PlaceHolder") return;

            if (e.isBig())
                biggerElems.push(e);
            else
                normalElems.push(e);

            map.removeElemAt(e.pos.x, e.pos.y);
        });

        // 先给大尺寸元素找到随机位置
        for (var e of biggerElems) {
            var esize = e.attrs.size;
            var g = BattleUtils.findRandomEmptyGrid(bt, false, esize);
            Utils.assert(!!g, "can not place big " + e.type + " with size of " + esize);
            map.addElemAt(e, g.pos.x, g.pos.y);
            var hds:Elem[] = e["placeHolders"]();
            Utils.assert(hds.length == esize.w * esize.h - 1, "big elem size mismatch the number of it's placeholders");
            for (var i = 0; i < esize.w; i++) {
                for (var j = 0; j < esize.h; j++) {
                    if (i == 0 && j == 0) continue;
                    var hd = hds.shift();
                    map.switchElems(hd.pos.x, hd.pos.y, e.pos.x + i, e.pos.y + j);
                }
            }
            Utils.assert(hds.length == 0, "more placehodlers need to be placed");
        }

        // 再放置普通元素
        for (var e of normalElems) {
            Utils.assert(e.type != "PlaceHolder", "place holders should be placed already");
            var g = BattleUtils.findRandomEmptyGrid(bt, false);
            Utils.assert(!!g, "no more place for elem");
            map.addElemAt(e, g.pos.x, g.pos.y);
        }
    }
}
