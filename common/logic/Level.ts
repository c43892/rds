
// 关卡控制逻辑
class Level {
    public displayName:string;
    public map:Map;
    private bt:Battle; // 反向引用回所属 battle
    private cfg;

    public Init(bt:Battle, cfg) {
        this.displayName = cfg.displayName;
        this.bt = bt;
        this.cfg = cfg;
        this.InitMap(cfg.map);
        this.addLevelLogic(new LevelLogicBasic());
        this.InitElems(bt.btType, cfg.elems, cfg.constElems, cfg.randomGroups, 
            GCfg.mapsize.w * GCfg.mapsize.h + cfg.init_uncovered.w + cfg.init_uncovered.h, 
            cfg.init_uncovered, cfg.doorUnlock, cfg.extraTreasureBox, cfg.treasureBoxNum, cfg.monsterBox);
    }

    // 创建地图
    public InitMap(cfg) {
        this.map = new Map();
    }

    // 创建指定元素，如果未明确指定配置属性，则默认参考本关卡配置
    private elemsCfgInLevel;
    public getElemCfg(type:string) {
        var attrs = this.elemsCfgInLevel[type];
        if (!attrs)
            attrs = GCfg.getElemAttrsCfg(type);

        while (attrs && attrs.type) {
            type = attrs.type;
            var tAttrs = this.elemsCfgInLevel[type];
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

        // 处理携带物品
        if (attrs.dropItems) {
            for (var dpType of attrs.dropItems) {
                var dpe = this.createElem(dpType);
                e.addDropItem(dpe);
            }
        }

        return ElemFactory.doDropItemsOnDie(e);
    }

    // 创建初始元素
    public InitElems(btType:string, elemsCfg, constElemsCfg, randomGroupsCfg, elemNumLimit, init_uncovered_size, doorUnlock, extraTreasureBox, treasureBoxNum, monsterBox) {
        this.elemsCfgInLevel = elemsCfg;
        var maxNumLimit = 0; // 做最大可能数量的检查
        var elems = [
            this.createElem("Door", {cnt:doorUnlock}), // 下一层入口的门
            this.createElem("EscapePort", {size: init_uncovered_size}), // 逃跑出口
        ];

        // 处理钥匙和宝箱
        elems = this.addKeyAndTreasureBox(btType, elems, doorUnlock, extraTreasureBox, treasureBoxNum, monsterBox);       
        
        // 添加固定元素
        for (var e in constElemsCfg) {
            let num = constElemsCfg[e];
            for (var i = 0; i < num; i++)
                elems.push(this.createElem(e));
        }

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
        }

        // 再放置普通元素
        for (var e of normalElems) {
            Utils.assert(e.type != "PlaceHolder", "place holders should be placed already");
            var g = BattleUtils.findRandomEmptyGrid(this.bt, false);
            Utils.assert(!!g, "no more place for elem");
            this.map.addElemAt(e, g.pos.x, g.pos.y);
        }
    }

    // 根据配置将部分元素放置在固定位置,其余元素随机
    public setElemPos(){
        var biggerElems:Elem[] = [];
        var normalElems:Elem[] = [];
        var placeHolders:Elem[] = [];

        // 先分开大尺寸元素和普通元素
        this.map.travelAll((x, y) => {
            var e = this.map.getElemAt(x, y);
            if (!e) return;

            if (e.type == "PlaceHolder")
                placeHolders.push(e);

            else if (e.isBig())
                biggerElems.push(e);
            else
                normalElems.push(e);

            this.map.removeElemAt(e.pos.x, e.pos.y);
        });

        var addBigElemAtPos = (e:Elem, bt:Battle, pos = undefined) => {
            var esize = e.attrs.size;
            var gs:Grid[] = [];
            var isEmpty = () => {
                for (var i = 0; i < esize.w; i++) {
                    for (var j = 0; j < esize.h; j++) {
                        var elem = bt.level.map.getElemAt(pos.x, pos.y);
                        if(elem)
                            return false;
                    }
                }
                return true;
            }
            Utils.assert(isEmpty(), "can not place big " + e.type + " with size of " + esize);
            bt.level.map.addElemAt(e, pos.x, pos.y);
        }

        if(this.cfg.elemPosConfig){
            // 先给大尺寸元素找到指定位置
            var posCfg = GCfg.getElemPosCfg(this.cfg.elemPosConfig);
            for(var e of biggerElems){
                if(posCfg[e.type]){
                    for(var i = 0; i < posCfg[e.type].length; i++){
                        var pos = posCfg[e.type][i];
                        if(!this.map.getElemAt(pos.x, pos.y)){
                            addBigElemAtPos(e, this.bt, pos);
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
            var g = BattleUtils.findRandomEmptyGrid(this.bt, false, esize);
            Utils.assert(!!g, "can not place big " + e.type + " with size of " + esize);
            this.map.addElemAt(e, g.pos.x, g.pos.y);
            var hds:Elem[] = e["placeHolders"]();
            Utils.assert(hds.length == esize.w * esize.h - 1, "big elem size mismatch the number of it's placeholders");
        }

        // 再放置普通元素
        for (var e of normalElems) {
            Utils.assert(e.type != "PlaceHolder", "place holders should be placed already");
            var g = BattleUtils.findRandomEmptyGrid(this.bt, false);
            Utils.assert(!!g, "no more place for elem");
            this.map.addElemAt(e, g.pos.x, g.pos.y);
        }
    }

    // 添加本关卡的钥匙和宝箱
    public addKeyAndTreasureBox(btType:string, elems:Elem[], doorUnlock, extraTreasureBox, treasureBoxNum, monsterBox){
        // 开门用的钥匙,根据关卡配置确定
        for(var i = 0; i < doorUnlock; i++){
            elems.push(this.createElem("Key"));
        }
       
        // 开宝箱用的钥匙和宝箱,根据战斗类型确定
        var index = btType.indexOf("_");
        var type = btType.substring(0 , index);

        switch(type){
            case "normal":{
                var tb1 = this.createElem("TreasureBox1");
                var changeToMonsterBox = this.bt.srand.next100();
                if(changeToMonsterBox < monsterBox) // 是否变成怪物宝箱
                    elems.push(this.createElem("TreasureBox", {"rdp":"MonsterBox"}));
                else
                    elems.push(tb1);

                elems.push(this.createElem("Key"));

                var tn = this.bt.srand.next100();
                if(tn < extraTreasureBox){
                    elems.push(this.createElem("TreasureBox2"));
                    elems.push(this.createElem("Key"));
                }
                break;
            }
            case "senior":{
                for(var i = 0; i < treasureBoxNum; i++){
                    elems.push(this.createElem("TreasureBox" + (i + 1)));
                    elems.push(this.createElem("Key"));
                }
                break;
            }
            case "boss":{
                for(var i = 0; i < treasureBoxNum; i++){
                    elems.push(this.createElem("TreasureBox" + (i + 1)));
                    elems.push(this.createElem("Key"));
                }
                break;
            }
        }
        return elems;
    }

    // 关卡逻辑
    public levelLogics:LevelLogic[] = []; // 当前层具有的逻辑

    public addLevelLogic(levelLogic:LevelLogic){
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
}