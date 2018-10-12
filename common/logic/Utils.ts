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

    // 等待条件
    public static async waitUtil(f) {
        while (!f())
            await Utils.delay(1);
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

    // 合并多个字典，生成新的字典，相同项后面的覆盖前面的
    public static merge(...ss) {
        var r = {};
        for (var s of ss) {
            for (var k in s)
                r[k] = s[k];
        }

        return r;
    }

    // 测试期间用，本地存储部分数据
    public static $$saveItem(key:string, value:string) {
        egret.localStorage.setItem(key, value);
    }

    // 测试期间用，本地存储数据清除
    public static $$removeItem(key:string) {
        egret.localStorage.removeItem(key);
    }

    // 测试期间用，从本地存储读取数据
    public static $$loadItem(key:string):string {
        return egret.localStorage.getItem(key);
    }

    // 保存角色数据
    public static savePlayer(p:Player) {
        if (p) {
            Utils.$$saveItem("Version", Version.currentVersion.toString());
            Utils.$$saveItem("Player", p.toString());
        } else {
            Utils.$$removeItem("Player");
            Utils.$$removeItem("Version");
        }
    }

    // 载入角色数据
    public static loadPlayer() {
        var oldVer = +Utils.$$loadItem("Version");
        if (Version.isCompatible(oldVer))
            return {ver:oldVer, player:Player.fromString(Utils.$$loadItem("Player"))};
        else
            return {ver:oldVer, player:undefined};
    }

    // 载入指定数据
    public static loadLocalData(key:string) {
        var data = Utils.$$loadItem(key);
        return data ? JSON.parse(data) : undefined;
    }

    // 保存指定数据
    public static saveLocalData(key:string, data) {
        if (data)
            Utils.$$saveItem(key, JSON.stringify(data));
    }

    // 根据指定权重，随机选取若干目标，集合格式为 {type:weight, type:weight, ...}
    public static randomSelectByWeight(elemsWithWeight, srand:SRandom, numMin:number, numMax:number, noDuplicated:boolean = false) {
        var r = [];

        // 一会要修改这个权重表，所以复制一份，防止修改到外面的对象
        var elems = noDuplicated ? Utils.clone(elemsWithWeight) : elemsWithWeight;

        // 汇总该组权重
        var tw = 0; // 总权重
        var w2e = []; // 权重段
        var reweight = () => {
            tw = 0;
            w2e = [];
            for (var e in elems) {
                var w = elems[e];
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
                        delete elems[e];
                        reweight();
                    }
                    break;
                }
            }
        }

        return r;
    }

    // 判断物品和角色的职业兼容性
    public static occupationCompatible(occupation, type, customGetConfigFun = undefined) {
        // coin 兼容任何职业，这里必须特殊处理，及避开 CoinsTiny 之类的特殊类型造成的障碍
        if (Utils.checkCatalogues(type, "coin"))
            return true;

        var eCfg = customGetConfigFun ? customGetConfigFun(type) : GCfg.getElemAttrsCfg(type);
        return !eCfg.occupations || Utils.contains(eCfg.occupations, occupation);
    }

    // 在 randomSelectByWeight 之前，从掉落列表中，过滤掉玩家有携带遗物并且已经到达顶级强化等级的遗物，如果
    // 过滤后列表为空，则填入一个指定的替代品
    public static randomSelectByWeightWithPlayerFilter(p:Player, elemsWithWeight, srand:SRandom, 
                                numMin:number, numMax:number, noDuplicated:boolean, 
                                defaultRelicType:string = undefined, 
                                customGetConfigFun = undefined) {
        var cnt = 0;
        var elems = {};

        // 移除掉不应该再出现的遗物(玩家持有并且已经到达强化等级上限，或者职业冲突)
        for (var e in elemsWithWeight) {

            // 检查职业冲突
            if (!Utils.occupationCompatible(p.occupation, e, customGetConfigFun))
                continue;

            // 检查遗物强化等级
            var allRelics = p.allRelics;
            var n = Utils.indexOf(allRelics, (r) => r.type == e);
            if (n >= 0) {
                var r:Relic = allRelics[n];
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

    // 执行商店抢劫逻辑计算
    public static doRobInShop(items, cfg, srand:SRandom) {
        // 先确定抢几个东西
        var num = parseInt(Utils.randomSelectByWeight(cfg.robNum, srand, 1, 1)[0]) + 1;

        // 构造好权重表，然后随机 num 个
        var itemsWithWeights = {};
        items.forEach((it, i) => {
            if (it && cfg.robItems[i])
                itemsWithWeights[i] = cfg.robItems[i];
        });
        var sels = Utils.randomSelectByWeight(itemsWithWeights, srand, num, num, true);
        sels = Utils.map(sels, (i) => items[i]);
        return sels;
    }

    // 执行大地图事件抢劫逻辑
    public static doRobEvent(p, cfg, srand:SRandom) {
        var drop2 = srand.next100() < cfg.drop2Weight;
        var dps = drop2 ? cfg.drop2 : cfg.drop1;
        var dpCfg = GCfg.getRandomDropGroupCfg(dps);
        var sels = Utils.randomSelectByWeightWithPlayerFilter(p, dpCfg.elems, srand, dpCfg.num[0], dpCfg.num[1], true);
        return sels;
    }

    // 给定坐标是否在指定范围内
    public static isInArea(pt, areaLeftCorner, areaSize) {
        return pt.x >= areaLeftCorner.x && pt.x < areaLeftCorner.x + areaSize.w
                && pt.y >= areaLeftCorner.y && pt.y < areaLeftCorner.y + areaSize.h;
    }

    // 浅克隆一个对象
    public static clone(obj) {
        var r = {};
        for (var k in obj)
            r[k] = obj[k];

        return r;
    }

    // 商店根据配置随机出现商品的逻辑
    public static genRandomShopItems(player:Player, shop, rand, maxNum:number) {
        var defaultPrice = GCfg.getShopCfg("price");
        var cfg = GCfg.getShopCfg(shop);
        var shopPrices = cfg.price;
        var items = cfg.items;
        var dropItems = [];
        var prices = {};
        for(var i = 0; i < maxNum; i++) {
            var iw = Utils.clone(items[i]);
            // 去掉已经生成的，保证商店内容不重复
            dropItems.forEach((dpe, _) => {
                if (iw[dpe])
                    delete iw[dpe];
            });

            var e = Utils.randomSelectByWeightWithPlayerFilter(player, iw, rand, 1, 2, false)[0];
            dropItems.push(e);
            prices[e] = shopPrices[e] != undefined ? shopPrices[e] : defaultPrice[e];
        }

        return {items:dropItems, prices:prices}
    }

    // 计算从 from 指向 to 的角度
    public static getRotationFromTo(from, to) {
        var dx = to.x - from.x;
        var dy = to.y - from.y;
        if (Math.abs(dx) < 0.001)
            return dy >= 0 ? 90 : 270;
        else {
            var atan = Math.atan(Math.abs(dy / dx));
            if (dx > 0 && dy > 0)
                return atan * 180 / Math.PI;
            else if (dx <= 0 && dy > 0)
                return 180 - atan * 180 / Math.PI;
            else if (dx <= 0 && dy <= 0)
                return 180 + atan * 180 / Math.PI;
            else
                return 360 - atan * 180 / Math.PI;
        }
    }

    // 计算两点距离
    public static getDist(p1, p2) {
        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    // 插值数组
    public static arrInterpolate(arr1, arr2, p) {
        Utils.assert(arr1.length == arr2.length, "can not interpolate two arraies with different length");
        var arr = [];
        for (var i = 0; i < arr1.length; i++) {
            var v = arr1[i] + (arr2[i] - arr1[i]) * p;
            arr[i] = v;
        }

        return arr;
    }

    // 判断是否是指定类型
    public static checkCatalogues(type, ...catalogues):boolean {
        var catalogueDict = {
            food : ["Apple", "Steak"],
            book : ["EconomyMagazine", "Magazine"],
            coin : ["CoinsTiny", "CoinsSmall", "Coins", "CoinsBig", "CoinsHuge"],
            gun : ["RayGun", "IceGun"]
        };

        for (var i = 0; i < catalogues.length; i++) {
            if (catalogueDict[catalogues[i]] && Utils.contains(catalogueDict[catalogues[i]], type))
                return true;
        }

        return false;
    }

    // 判断是否是处于新手期
    public static checkRookiePlay():boolean {
        return true;
        // return !Utils.loadLocalData("rookiePlay") || Utils.loadLocalData("rookiePlay") != "finished";
    }

    // 根据btType找到该关卡对应的levelLogics
    public static getLevelLogics(btType:string) {
        var levelLogics;
        var index = btType.indexOf("_");
        var type = btType.substring(0 , index);
        type = type.length > 0 ? type : btType;
        levelLogics = GCfg.getLevelLogicCfg(type);
        return levelLogics;
    }

    // 判断是否是该职业的初始物品类型
    public static checkInitItems(occupation:string, itemType:string){
        var cfg = GCfg.getOccupationCfg(occupation);
        return Utils.indexOf(cfg.initItems, (t:string) => t == itemType) > -1;
    }

    // 得到player完成的总层数
    public static playerFinishedStorey(p:Player){
        var storey = p.currentStoreyPos.lv;
        for(var world of p.finishedWorldMap)
            storey += GCfg.getWorldMapCfg(world).totalLevels;
        
        return storey;
    }

    // 获取战斗实际所使用的地图范围
    public static getActualMapRange(bt:Battle){
        var actualMapRange = bt.lvCfg.actualMapRange;
        actualMapRange = actualMapRange ? actualMapRange : {"minX":0, "maxX":6, "minY":0, "maxY":8};
        return actualMapRange;
    }; 
}
