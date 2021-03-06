
// 关卡控制逻辑
class Level {
    public displayName:string;
    public map:Map;
    public bt:Battle; // 反向引用回所属 battle
    public keys:Elem[] = []; // 装着所有的关卡初始钥匙
    public levelType; // 关卡种类
    private cfg;
    private lv;

    public Init(bt:Battle, cfg) {
        this.displayName = cfg.displayName;
        this.bt = bt;
        this.cfg = cfg;
        this.lv = bt.player.currentTotalStorey();
        this.levelType = this.getLevelType();
        this.InitMap(cfg.map);
        this.InitElems(bt.btType, cfg.elems, cfg.constElems, cfg.randomGroups, 
            GCfg.mapsize.w * GCfg.mapsize.h + cfg.init_uncovered.w + cfg.init_uncovered.h, 
            cfg.init_uncovered, cfg.doorUnlock);
        if (cfg.levelLogics) {
            for (var levelLogic of cfg.levelLogics) {
                var ll = LevelLogicFactory.createLevelLogic(levelLogic.type, ...levelLogic.ps);
                this.addLevelLogic(ll);
            }
        }
    }

    // 创建地图
    public InitMap(cfg) {
        this.map = new Map();
    }

    // 创建指定元素，如果未明确指定配置属性，则默认参考本关卡配置
    private elemsCfgInLevel;
    public getElemCfg(type:string) {
        var attrs = GCfg.getElemAttrsOfLevel(type, this.lv);
        if (!attrs)
            attrs = GCfg.getElemAttrsCfg(type);

        while (attrs && attrs.type) {
            type = attrs.type;
            var tAttrs = GCfg.getElemAttrsOfLevel(type, this.lv);
            tAttrs = tAttrs ? tAttrs : GCfg.getElemAttrsCfg(type);
            if (tAttrs) {
                for (var k in attrs)
                    if (k != "type")
                        tAttrs[k] = attrs[k];

                attrs = tAttrs;
            } else
                break;
        }

        return {type:type, attrs:attrs};
    }

    public createElem(type:string, attrs = undefined, player:Player = undefined):Elem {
        if (!attrs) { // 如果指定配置属性，则不再参考本关卡配置
            var r = this.getElemCfg(type);
            type = r.type;
            attrs = r.attrs;
        }

        attrs = attrs ? attrs : {};
        var e = ElemFactory.create(type, attrs, player);

        // 根据难度对怪物的血量进行调整
        if (e instanceof Monster && e.isHazard() && e.hp)
            e.hp = Math.ceil(e.hp * GCfg.getDifficultyCfg()[this.bt.player.difficulty]["monsterHp"] / 100);

        // 处理携带物品
        if (attrs.dropItems) {
            for (var dpType of attrs.dropItems) {
                var dpe = this.createElem(dpType);
                e.addDropItem(dpe);
            }
        }

        e = ElemFactory.doDropItemsOnDie(e);
        
        // 部分元素的创建过程受到遗物的影响,此处只能触发同步逻辑点
        this.bt.triggerLogicPointSync("onLevelCreateElem", {e:e, type:type})

        return e;
    }

    // 创建初始元素
    public InitElems(btType:string, elemsCfg, constElemsCfg, randomGroupsCfg, elemNumLimit, init_uncovered_size, doorUnlock) {
        this.elemsCfgInLevel = elemsCfg;
        var maxNumLimit = 0; // 做最大可能数量的检查
        var elems = [
            this.createElem("Door", {cnt:doorUnlock}) // 下一层入口的门            
        ];

        // 逃跑出口,继承关卡不需要
        if (this.levelType != "awardInherited")
            elems.push(this.createElem("EscapePort", {size: init_uncovered_size}))

        // 钥匙存在关卡身上,等待统一安排
        for(var i = 0; i < doorUnlock; i++){
            this.keys.push(this.createElem("Key"));
        }
        
        // 添加固定元素
        for (var e in constElemsCfg) {
            let num = constElemsCfg[e];
            for (var i = 0; i < num; i++)
                elems.push(this.createElem(e));
        }

        // 添加职业物品
        elems = this.addOccupationInitItems(elems);

        // 添加随机元素
        if (randomGroupsCfg) {
            for (var group of randomGroupsCfg) {

                // 累计数量上限检查
                maxNumLimit += group.num[1] - 1;
                Utils.assert(maxNumLimit <= elemNumLimit, "elem overflow in map: " + this.displayName);

                var arr = Utils.randomSelectByWeightWithPlayerFilter(this.bt.player, group.elems, this.bt.srand, group.num[0], group.num[1], false, undefined, (type) => this.getElemCfg(type));
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
        }

        this.bt.triggerLogicPointSync("onLevelInitElems", {bt:this.bt, elems:elems});

        // 依次加入地图
        var x = 0;
        var y = 0;
        for (var elem of elems) {
            if(!elem.isBig()){
                this.map.addElemAt(elem, x, y);
                var cnt = 1;
                for (var i = 0; i < cnt; i++) {
                    x++;
                    if (x >= this.map.size.w) { y++; x = 0; }
                }
            }
        }
        for (var elem of elems) {
            if(elem.isBig()){
                var esize = elem.attrs.size;
                var g = BattleUtils.findRandomEmptyGrid(this.bt, false, esize);
                this.map.addElemAt(elem, g.pos.x, g.pos.y);
            }
        }
    }

    // 根据配置将部分元素放置在固定位置,其余元素随机
    public setElemPosByCfg(cfg, covered:boolean = true){
        var biggerElems:Elem[] = [];
        var normalElems:Elem[] = [];

        // 先分开大尺寸元素和普通元素
        this.map.travelAll((x, y) => {
            var e = this.map.getElemAt(x, y);
            if (!e) return;

            if (e.type == "PlaceHolder")
                return;

            else if (e.isBig())
                biggerElems.push(e);
            else
                normalElems.push(e);

            this.map.removeElemAt(e.pos.x, e.pos.y);
        });

        if(cfg){
            // 先给大尺寸元素找到指定位置
            var posCfg = GCfg.getElemPosCfg(cfg);
            Utils.assert(posCfg, "can not find ElemPosCfg for " + this.bt.btType);
            for(var e of biggerElems){
                if(posCfg[e.type]){
                    for(var i = 0; i < posCfg[e.type].length; i++){
                        var pos = posCfg[e.type][i];
                        if(!this.map.getElemAt(pos.x, pos.y)){
                            this.map.addElemAt(e, pos.x, pos.y);
                            biggerElems = Utils.remove(biggerElems, e);
                            break;
                        }
                    }
                }
            }
            // 给普通元素找到指定位置
            for(var e of normalElems){
                if(posCfg[e.type]){
                    for(var i = 0; i < posCfg[e.type].length; i++){
                        var pos = posCfg[e.type][i];
                        if(!this.map.getElemAt(pos.x, pos.y)){
                            this.map.addElemAt(e, pos.x, pos.y);
                            normalElems = Utils.remove(normalElems, e);
                            break;
                        }
                    }
                }
            }
        }
        
        // 其余元素随机放置
        // 先给大尺寸元素找到随机位置
        for (var e of biggerElems) {
            var esize = e.attrs.size;
            var g = BattleUtils.findRandomEmptyGrid(this.bt, covered, esize);
            Utils.assert(!!g, "can not place big " + e.type + " with size of " + esize);
            this.map.addElemAt(e, g.pos.x, g.pos.y);
            var hds:Elem[] = e["placeHolders"]();
            Utils.assert(hds.length == esize.w * esize.h - 1, "big elem size mismatch the number of it's placeholders");
        }

        // 再放置普通元素
        for (var e of normalElems) {
            Utils.assert(e.type != "PlaceHolder", "place holders should be placed already");
            var g = BattleUtils.findRandomEmptyGrid(this.bt, covered);
            Utils.assert(!!g, "no more place for elem");
            this.map.addElemAt(e, g.pos.x, g.pos.y);
        }
    }

    // 添加职业物品
    public addOccupationInitItems(items:Elem[]){
        // 继承用的关卡不需要添加职业物品
        if(this.levelType == "awardInherited")
            return items;
        var cfg = GCfg.getOccupationCfg(this.bt.player.occupation);
        for(var constItem in cfg.constItems){
            for(var i = 0; i < cfg.constItems[constItem]; i++){
                var e = this.createElem(constItem);
                e["occupationInitItem"] = true; // 提供给遗物判断是否是此时添加的职业物品
                items.push(e)
            }
        }
        var es = Utils.randomSelectByWeight(cfg.randomItems.elems, this.bt.srand, cfg.randomItems.num[0], cfg.randomItems.num[1], true);
        for(var randomItem of es){
            var e = this.createElem(randomItem);
            e["occupationInitItem"] = true; // 提供给遗物判断是否是此时添加的职业物品
            items.push(e);
        }
        return items;
    }

    // 关卡逻辑
    public levelLogics:LevelLogic[] = []; // 当前层具有的逻辑

    public addLevelLogic(levelLogic:LevelLogic){
        levelLogic.level = this;
        this.levelLogics.push(levelLogic);
    }

    public removeLevelLogic(type:string){
        var n = Utils.indexOf(this.levelLogics, (l:LevelLogic) => l.type == type);
        var levelLogic;
        if (n >= 0) {
            levelLogic = this.levelLogics[n];
            this.levelLogics = Utils.removeAt(this.levelLogics, n);
        }
    }

    private getLevelType() {
        var index = this.bt.btType.indexOf("_");
        var levelType = this.bt.btType.substring(0 , index);
        return levelType;
    }
}