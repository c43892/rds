
// 关卡控制逻辑
class Level {
    public displayName:string;
    public map:Map;
    private bt:Battle; // 反向引用回所属 battle

    public Init(bt:Battle, cfg) {
        this.displayName = cfg.displayName;
        this.bt = bt;
        this.InitMap(cfg.map);
        this.InitElems(cfg.elems, cfg.constElems, cfg.randomGroups, 
            GCfg.mapsize.w * GCfg.mapsize.h + cfg.init_uncovered.w + cfg.init_uncovered.h, 
            cfg.init_uncovered);
    }

    // 创建地图
    public InitMap(cfg) {
        this.map = new Map();
    }

    // 创建指定元素，如果未明确指定配置属性，则默认参考本关卡配置
    private elemsCfgInLevel;
    public createElem(type:string, attrs = undefined):Elem {
        if (!attrs) { // 如果指定配置属性，则不再参考本关卡配置
            attrs = this.elemsCfgInLevel[type];
            while (attrs && attrs.type) {
                type = attrs.type;
                var tAttrs = this.elemsCfgInLevel[type];
                if (tAttrs) {
                    for (var k in attrs)
                        if (k != "type")
                            tAttrs[k] = attrs[k];

                    attrs = tAttrs;
                } else
                    break;
            }
        }

        var attrs =  attrs ? attrs : {};
        var e = ElemFactory.create(type, attrs);

        // 处理携带物品
        if (attrs.dropItems) {
            for (var dpType of attrs.dropItems) {
                var dpe = this.createElem(dpType);
                e.addDropItem(dpe);
            }
        }

        // 处理随机掉落
        if (attrs.rdp) {
            var rdp = GCfg.getRandomDropGroupCfg(attrs.rdp);
            var arr = Utils.randomSelectByWeight(rdp.elems, this.bt.srand, rdp.num[0], rdp.num[1]);
            for (var dpType of arr)
                e.randomDrops.push(this.createElem(dpType));
        }

        return ElemFactory.doDropItemsOnDie(e);
    }

    // 创建初始元素
    public InitElems(elemsCfg, constElemsCfg, randomGroupsCfg, elemNumLimit, init_uncovered_size) {
        this.elemsCfgInLevel = elemsCfg;
        var maxNumLimit = 0; // 做最大可能数量的检查
        var elems = [
            ElemFactory.create("EscapePort", {size: init_uncovered_size}), // 逃跑出口
            ElemFactory.create("Door") // 下一层入口的门
        ];

        // 添加固定元素
        for (var e in constElemsCfg) {
            let num = constElemsCfg[e];
            for (var i = 0; i < num; i++)
                elems.push(this.createElem(e));
        }

        // 添加随机元素
        for (var group of randomGroupsCfg) {
            
            // 累计数量上限检查
            maxNumLimit += group.num[1] - 1;
            Utils.assert(maxNumLimit <= elemNumLimit, "elem overflow in map: " + this.displayName);

            var arr = Utils.randomSelectByWeight(group.elems, this.bt.srand, group.num[0], group.num[1]);
            for (var et of arr) {
                var elem = this.createElem(et)
                if (group.drops) {
                    for (var dp of group.drops) {
                        var dpe = this.createElem(dp);
                        elem.addDropItem(dpe);
                    }
                }
                elems.push(elem);
            }
        }

        // 依次加入地图
        var x = 0;
        var y = 0;
        for (var elem of elems) {
            this.map.addElemAt(elem, x, y);
            var cnt = elem.isBig() ? elem.attrs.size.w * elem.attrs.size.h : 1;
            for (var i = 0; i < cnt; i++) {
                x++;
                if (x >= this.map.size.w) { y++; x = 0; }
            }
        }
    }

    // 乱序所有元素
    public RandomElemsPos() {

        var biggerElems = [];
        var normalElems = [];

        // 先分开大尺寸元素和普通元素
        this.map.travelAll((x, y) => {
            var e = this.map.getElemAt(x, y);
            if (!e) return;

             if (e.type == "PlaceHolder")
                return;

            if (e.isBig())
                biggerElems.push(e);
            else
                normalElems.push(e);

            this.map.removeElemAt(e.pos.x, e.pos.y);
        });

        // 先给大尺寸元素找到随机位置
        for (var e of biggerElems) {
            var esize = e.attrs.size;
            var g = BattleUtils.findRandomEmptyGrid(this.bt, false, esize);
            Utils.assert(!!g, "can not place big " + e.type + " with size of " + esize);
            this.map.addElemAt(e, g.pos.x, g.pos.y);
            var hds:Elem[] = e["placeHolders"]();
            Utils.assert(hds.length == esize.w * esize.h - 1, "big elem size mismatch the number of it's placeholders");
            for (var i = 0; i < esize.w; i++) {
                for (var j = 0; j < esize.h; j++) {
                    if (i == 0 && j == 0) continue;
                    var hd = hds.shift();
                    this.map.switchElems(hd.pos.x, hd.pos.y, e.pos.x + i, e.pos.y + j);
                }
            }
            Utils.assert(hds.length == 0, "more placehodlers need to be placed");
        }

        // 再放置普通元素
        for (var e of normalElems) {
            Utils.assert(e.type != "PlaceHolder", "place holders should be placed already");
            var g = BattleUtils.findRandomEmptyGrid(this.bt, false);
            Utils.assert(!!g, "no more place for elem");
            this.map.addElemAt(e, g.pos.x, g.pos.y);
        }
    }
}