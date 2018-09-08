
// 一局战斗，包含当前关卡和当前角色数据，并控制整个战斗进程
class Battle {
    public id:string; // 每场战斗一个随机 id
    public displayName:string; // 战斗标题
    public btType:string; // 战斗配置类型
    public btRandomSeed:number; // 随机序列种子
    public srand:SRandom; // 随机序列
    public trueRandomSeed:number; // 随机序列2，这个随机序列相关的通常是允许玩家刷的东西，不会计入存档，但是会计入录像
    public trueRand:SRandom; // 随机序列2，这个随机序列相关的通常是允许玩家刷的东西，不会计入存档，但是会计入录像
    public level:Level; // 当前关卡
    public player:Player; // 角色数据
    public bc:BattleCalculator; // 战斗计算器
    private lvCfg; // 当前关卡配置

    public openShop; // 执行打开商店的操作
    public openRelicSel2Add; // 执行升级选择遗物逻辑

    constructor(randomseed:number, trueRandomSeed:number) {
        Utils.assert(randomseed != undefined, "the randomseed should be specified");
        this.btRandomSeed = randomseed;
        this.srand = new SRandom(randomseed);
        this.trueRandomSeed = trueRandomSeed;
        this.trueRand = new SRandom(trueRandomSeed);
    }

    public static createNewBattle(p:Player, btType:string, btRandomSeed:number, trueRandomSeed:number = undefined):Battle {
        if (trueRandomSeed == undefined)
            trueRandomSeed = (new Date()).getMilliseconds();

        var bt = new Battle(btRandomSeed, trueRandomSeed);
        bt.id = "bt_" + bt.btType + "_" + Math.random();
        bt.player = p;
        bt.btType = btType;
        p.setBattle(bt);
        return bt;
    }

    // 载入指定关卡
    public loadCurrentLevel(btType:string):Level {
        // 创建关卡地图和元素
        this.level = new Level();
        this.lvCfg = GCfg.getLevelCfg(btType);
        Utils.assert(!!this.lvCfg, "can not find level config: " + btType);
        while (this.lvCfg.redirect) {
            btType = this.lvCfg.redirect;
            this.lvCfg = GCfg.getLevelCfg(btType);
            Utils.assert(!!this.lvCfg, "can not find level config: " + btType);
        }

        this.displayName = this.lvCfg.displayName;
        this.level.Init(this, this.lvCfg);
        this.level.map.foreachElem((e) => e.setBattle(this));
        this.bc = new BattleCalculator(this.srand);
        return this.level;
    }

    prepared = false;
    public prepare() {
        if (this.prepared) return;        
        this.loadCurrentLevel(this.btType);
        BattleUtils.randomElemsPosInMap(this);
        this.prepared = true;
    }

    // 开始当前战斗
    public async start() {
        Utils.assert(this.prepared, "call battle.prepare() first");
        
        this.ended = false;
        this.level.RandomElemsPos(); // 先随机一下，免得看起来不好看
        await this.fireEvent("onLevelInited", {bt:this});
        await this.triggerLogicPoint("onLevelInited", {bt:this});
            
        this.level.RandomElemsPos(); // 随机元素位置
        await this.coverAllAtInit();
        await this.uncoverStartupRegion();
    }

    // 初始盖住所有格子
    public async coverAllAtInit() {
        this.level.map.travelAll((x, y) => this.level.map.getGridAt(x, y).status = GridStatus.Covered);
        await this.fireEvent("onAllCoveredAtInit", {bt:this});
        await this.triggerLogicPoint("onAllCoveredAtInit", {bt:this});
    }

    // 揭开起始区域
    public async uncoverStartupRegion() {

        // 移除逃离出口，目前不需要了
        var ep = this.level.map.findFirstElem((e) => e && e.type == "EscapePort");
        Utils.assert(!!ep, "no escape point in map");
        this.level.map.removeElemAt(ep.pos.x, ep.pos.y);

        // 揭开起始区域
        for(var i = 0; i < ep.attrs.size.w; i++) {
            var x = ep.pos.x + i;
            for (var j = 0; j < ep.attrs.size.h; j++) {
                var y = ep.pos.y + j;
                this.uncover(x, y, true, true);
            }
        }

        // 如果起始区域有东西，则换个别的位置
        var map = this.level.map;
        for(var i = 0; i < ep.attrs.size.w; i++) {
            var x = ep.pos.x + i;
            for (var j = 0; j < ep.attrs.size.h; j++) {
                var y = ep.pos.y + j;
                var e = this.level.map.getElemAt(x, y);
                if (!!e) {
                    if (e.type == "EscapePort")
                        this.level.map.removeElemAt(ep.pos.x, ep.pos.y);

                    var g = BattleUtils.findRandomEmptyGrid(this, true);
                    if (!!g) {
                        // 将元素移动到空地
                        map.removeElemAt(x, y);
                        map.addElemAt(e, g.pos.x, g.pos.y);

                        await this.fireEvent("onGridChanged", {x:x, y:y, e:e, subType:"uncoverStartupRegion"});
                        await this.triggerLogicPoint("onGridChanged", {x:g.pos.x, y:g.pos.y, e:e, subType:"uncoverStartupRegion"});
                    }
                }
            }
        }

        // 如果有商人，要移动到起始区域
        var shopNpc = BattleUtils.moveElem2Area(this, "ShopNpc", ep.pos, ep.attrs.size);
        if (shopNpc) {
            await this.fireEvent("onGridChanged", {x:shopNpc.pos.x, y:shopNpc.pos.y, e:shopNpc, subType:"moveShopNpc"});
            await this.triggerLogicPoint("onGridChanged", {x:shopNpc.pos.x, y:shopNpc.pos.y, e:shopNpc, subType:"moveShopNpc"});
        }

        // 将玩家从上一层带下来的元素置入
        for(var e of this.player.elems2NextLevel){
            var g = BattleUtils.findRandomEmptyGrid(this, false);
            if(!g)
                return;
            
            await this.implAddElemAt(e, g.pos.x, g.pos.y, ep.pos);
        }
        this.player.elems2NextLevel = [];

        await this.fireEvent("onStartupRegionUncovered");
        await this.triggerLogicPoint("onStartupRegionUncovered");
    }

    // 计算一片指定大小的区域，该区域尽量以逃跑的出口位置为中心，
    // 结果格式为 {left:left, top:top} 指明该区域的左小坐标
    private getGetRegionWithEscapePort(w:number, h:number) {
        var map = this.level.map;
        var ep = map.findFirstElem((e) => e && e.type == "EscapePort");
        Utils.assert(!!ep, "there be 1 EscapePort"); // 有且只有一个逃离出口
        return Utils.calculateBoundary(ep.pos.x, ep.pos.y, w, h, 0, 0, map.size.w, map.size.h);
    }

    // 标记指定位置的地块
    public async mark(x:number, y:number) {
        var g = this.level.map.getGridAt(x, y);
        var e = g.getElem();
        Utils.assert(g.isCovered() && !g.isMarked() && !!e, "only covered element could be marked but got" + x + "," + y);

        g.status = GridStatus.Marked;
        await this.fireEvent("onGridChanged", {x:x, y:y, e:e, subType:"elemMarked"});
        await this.triggerLogicPoint("onMarked", {e:e});
    }

    // 揭开指定位置的地块（不再检查条件）
    public async uncover(x:number, y:number, suppressSneak = false, suppressLogicEvent = false) {
        var g = this.level.map.getGridAt(x, y);
        Utils.assert(g.isCovered(), "uncover action can only be implemented on a covered grid");
        var stateBeforeUncover = g.status;
        g.status = GridStatus.Uncovered;

        await this.fireEvent("onGridChanged", {x:x, y:y, subType:"gridUncovered", stateBeforeUncover:stateBeforeUncover, suppressSneak:suppressSneak});

        if (!suppressLogicEvent)
            await this.triggerLogicPoint("onGridChanged", {x:x, y:y, subType:"gridUncovered", stateBeforeUncover:stateBeforeUncover, suppressSneak:suppressSneak});

        // 对 8 邻格子进行标记逻辑计算
        var neighbours = [];
        this.level.map.travel8Neighbours(x, y, (px, py, g:Grid) => {
            if (g.isCovered())
                neighbours.push([px, py]);
        });

        for (var p of neighbours)
            await this.calcMarkPos(p[0], p[1]);

        return true;
    }

    // 盖上指定位置的地块（不再检查条件）
    public async cover(x:number, y:number, suppressLogicEvent = false) {
        var g = this.level.map.getGridAt(x, y);
        Utils.assert(!g.isCovered(), "cover action can only be implemented on a uncovered grid");
        var stateBeforeUncover = g.status;
        g.status = GridStatus.Covered;

        await this.fireEvent("onGridChanged", {x:x, y:y, subType:"gridCovered", stateBeforeUncover:stateBeforeUncover});

        if (!suppressLogicEvent)
            await this.triggerLogicPoint("onGridChanged", {x:x, y:y, subType:"gridCovered", stateBeforeUncover:stateBeforeUncover});

        // 对 8 邻格子进行标记逻辑计算
        var neighbours = [];
        this.level.map.travel8Neighbours(x, y, (px, py, g:Grid) => {
            if (g.isCovered())
                neighbours.push([px, py]);
        });

        for (var p of neighbours)
            await this.calcMarkPos(p[0], p[1]);

        return true;
    }

    // 计算标记
    public async calcMarkPos(x:number, y:number) {
        var markPos = MonsterMarker.CalcMonsterMarkSignAt(this.level.map, x, y);
        for (var p of markPos){
            if(!this.level.map.getGridAt(p[0], p[1]).isMarked())
                await this.mark(p[0], p[1]);
        }            
    }

    collectAllLogicHandler() {
        var hs = [];

        // 玩家 buff
        hs.push(...this.player.buffs);

        // 玩家遗物
        hs.push(...this.player.relics);

        // 地图上的元素
        var es = [];
        this.level.map.foreachElem((e) => { es.push(e); return false; });
        for (var e of es) {
            hs.push(e);

            // 怪物的 buff
            if (e instanceof Monster)
                hs.push(...e.buffs);
        }

        // 关卡逻辑
        hs.push(...this.level.levelLogics);

        return hs;
    }

    // 触发逻辑点，参数为逻辑点名称，该名称直接字面对应个各元素对逻辑点的处理函数，
    // 处理函数的返回值表示是否需要截获该事件，不再传递给其它元素
    public async triggerLogicPoint(lpName:string, ps = undefined) {
        var hs = this.collectAllLogicHandler();
        for (var h of hs) {
            if (h[lpName] && await h[lpName](ps))
                return;
        }
    }

    public triggerLogicPointSync(lpName:string, ps = undefined) {
        var hs = this.collectAllLogicHandler();
        for (var h of hs) {
            if (h[lpName] && h[lpName](ps))
                return;
        }
    }

    private eventHandlers = {}; // 事件处理函数

    // 注册事件响应函数，这些事件是一个个异步执行的函数，需要一个个 wait 顺序执行，这也是不直接使用 egret.EventDispatcher 的原因
    public registerEvent(eventType:string, h) {
        var handlers = this.eventHandlers[eventType];
        if (handlers == undefined) {
            handlers = [];
            this.eventHandlers[eventType] = handlers;
        }

        handlers.push(h);
    }

    // 触发事件，这些事件是一个个异步执行的函数，需要一个个 wait 顺序执行，这也是不直接使用 egret.EventDispatcher 的原因    
    public async fireEvent(eventType:string, ps = undefined) {
        var handlers = this.eventHandlers[eventType];
        if (handlers == undefined)
            return;

        for (var h of handlers)
            await h(ps);
    }

    // 同步触发事件，不会使用协程等待，典型的用途是录像
    public fireEventSync(eventType:string, ps = undefined) {
        var handlers = this.eventHandlers[eventType];
        if (handlers == undefined)
            return;

        for (var h of handlers)
            h(ps);
    }

    // 添加物品
    public addElemAt(e:Elem, x:number, y:number) {
        e.setBattle(this);
        this.level.map.addElemAt(e, x, y);
    }

    // 移除物品
    public removeElemAt(x:number, y:number):Elem {
        return this.level.map.removeElemAt(x, y);
    }

    // try 开头的函数通常对应玩家操作行为

    async checkPlayerLevelUpAndDie() {
        // 检查等级提升
        if (this.player.checkLevelUp()) {
            await this.fireEvent("onPlayerLevelUp", {bt:this});
            await this.triggerLogicPoint("onPlayerLevelUp", {bt:this});

            var relicChoices = Utils.randomSelectByWeightWithPlayerFilter(this.player, GCfg.playerCfg.levelUpChoices, this.srand, 3, 4, true);
            await this.try2SelRelics(relicChoices);

            await this.fireEvent("onPlayerChanged", {subType:"lvUp", bt:this});
            await this.triggerLogicPoint("onPlayerChanged", {subType: "lvUp", bt:this});
        }

        // 检查死亡
        if (this.player.isDead()) {
            await this.fireEvent("onPlayerDying");
            var diePs = {reborn:false};
            await this.triggerLogicPoint("onPlayerDying", diePs);

            if (diePs.reborn) {
                await this.fireEvent("onPlayerReborn");
                await this.triggerLogicPoint("onPlayerReborn");
            } else {
                await this.fireEvent("onPlayerDead");
            }
        }
    }

    // 尝试揭开指定位置
    public try2UncoverAt() {
        return async (x:number, y:number) => {
            Utils.assert(x >= 0 && x < this.level.map.size.w 
                            && y >= 0 && y < this.level.map.size.h, 
                            "index out of bounds");

            let b = this.level.map.getGridAt(x, y);
            if (!this.level.map.isUncoverable(x, y))
                return;

            // 操作录像
            this.fireEventSync("onPlayerOp", {op:"try2UncoverAt", ps:{x:x, y:y}});

            var stateBeforeUncover = this.level.map.grids[x][y].status;
            await this.uncover(x, y);
            await this.fireEvent("onPlayerActed", {subType:"uncoverAt", num:-1});
            await this.triggerLogicPoint("onPlayerActed", {subType:"uncoverAt", num:-1}); // 算一次角色行动
            
            await this.checkPlayerLevelUpAndDie();
        };
    }

    public ended = false; // 战斗结束标记

    // 尝试无目标使用元素
    public try2UseElem() {
        return async (e:Elem) => {
            var canUse = e.canUse() && e.isValid();
            if (!canUse) return;

            // 操作录像
            this.fireEventSync("onPlayerOp", {op:"try2UseElem", ps:{x:e.pos.x, y:e.pos.y}});

            await this.fireEvent("onUseElem", {e:e});

            var r = await e.use(); // 返回值决定是保留还是消耗掉;
            var reserve = r instanceof Object ? r.reserve : r;
            var consumeDeathStep = r instanceof Object ? r.consumeDeathStep : true;

            if (!reserve) await this.implOnElemDie(e);

            await this.fireEvent("onElemChanged", {subType:"useElem", e:e});
            await this.triggerLogicPoint("onElemChanged", {subType:"useElem", e:e});

            // 算一次角色行动
            if (consumeDeathStep) {
                await this.fireEvent("onPlayerActed", {subType:"useElem", e:e, num:-1});
                await this.triggerLogicPoint("onPlayerActed", {subType:"useElem", e:e, num:-1});
            }

            await this.checkPlayerLevelUpAndDie();

            if (this.ended) {
                this.player.setBattle(undefined);
                this.player = undefined;
                await this.fireEvent("onBattleEnded", {bt:this});
            }
        };
    }

    // 尝试无目标使用道具
    public try2UseProp() {
        return async (e:Elem) => {
            let canUse = e.canUse();
            if (!canUse) return;

            // 可以使用
            if (canUse) {
                // 操作录像
                this.fireEventSync("onPlayerOp", {op:"try2UseProp", ps:{type:e.type, n:Utils.indexOf(this.player.props, (p) => p == e)}});

                var reserve = await e.use();
                if (!reserve)
                    await this.implRemovePlayerProp(e.type);
                else {
                    await this.fireEvent("onPropChanged", {subType:"useProp", type:e.type});
                    await this.triggerLogicPoint("onPropChanged", {subType:"useProp", type:e.type});
                }
            }

            await this.fireEvent("onPlayerActed", {subType:"useProp", e:e, num:-1});
            await this.triggerLogicPoint("onPlayerActed", {subType:"useProp", e:e, num:-1}); // 算一次角色行动
        };
    }

    // 移动一个元素到指定空位
    public try2ReposElemTo() {
        return async (e:Elem, x:number, y:number) => {
            var map = this.level.map;
            var fx = e.pos.x;
            var fy = e.pos.y;
            if (e.getGrid().isCovered() || !e.canBeDragDrop || !map.isGenerallyValid(e.pos.x, e.pos.y)) return;
            var b = map.getGridAt(x, y);
            if (b.status != GridStatus.Uncovered || b.getElem()) { // 无法拖过去
                await this.fireEvent("onGridChanged", {x:fx, y:fy, e:e, subType:"elemSwitchFrom"});
                return;
            }
            
            // 操作录像
            this.fireEventSync("onPlayerOp", {op:"reposElemTo", ps:{x:e.pos.x, y:e.pos.y, tox:x, toy:y}});

            // 将元素移动到空地
            map.removeElemAt(fx, fy);
            map.addElemAt(e, x, y);
            await this.fireEvent("onGridChanged", {x:fx, y:fy, e:e, subType:"elemSwitchFrom"});
            await this.fireEvent("onGridChanged", {x:x, y:y, e:e, subType:"elemSwitchTo"});
            await this.triggerLogicPoint("onGridChanged", {x:fx, y:fy, e:e, subType:"elemSwitchFrom"});
            await this.triggerLogicPoint("onGridChanged", {x:x, y:y, e:e, subType:"elemSwitchTo"});
        };
    }

    // 尝试使用一个元素，将一个坐标设定为目标
    public try2UseElemAt() {
        return async (e:Elem, x:number, y:number) => {
            var map = this.level.map;
            var fx = e.pos.x;
            var fy = e.pos.y;
            var canUse = e.isValid() && e.canUseAt(x, y);
            if (!canUse) return;

            // 操作录像
            this.fireEventSync("onPlayerOp", {op:"try2UseElemAt", ps:{x:e.pos.x, y:e.pos.y, tox:x, toy:y}});

            await this.impl2UseElemAt(e, x, y);
        };
    }

    // 对指定位置使用物品
    public async impl2UseElemAt(e:Elem, x:number, y:number) {
        var map = this.level.map;
        var fx = e.pos.x;
        var fy = e.pos.y;
        var canUse = e.isValid() && e.canUseAt(x, y);
        if (!canUse) return;

        await this.fireEvent("onUseElemAt", {e:e, toPos:{x:x, y:y}});

        var reserve = await e.useAt(x, y); // 返回值决定是保留还是消耗掉        
        if (!reserve) await this.implOnElemDie(e);

        await this.fireEvent("onElemChanged", {subType:"useElemAt", e:e, toPos:{x:x, y:y}});
        await this.triggerLogicPoint("onElemChanged", {subType:"useElemAt", e:e, toPos:{x:x, y:y}});

        await this.fireEvent("onPlayerActed", {subType:"useElemAt", e:e, num:-1});
        await this.triggerLogicPoint("onPlayerActed", {subType:"useElemAt", e:e, num:-1}); // 算一次角色行动

        this.checkPlayerLevelUpAndDie();
    }

    // 尝试使用一个道具，将一个坐标设定为目标
    public try2UsePropAt() {
        return async (e:Elem, x:number, y:number) => {
            var map = this.level.map;
            if (e.canUseAt(x, y)) {
                // 对指定目标位置使用
                var canUse = true;
                
                // 操作录像
                this.fireEventSync("onPlayerOp", {op:"try2UsePropAt", ps:{type:e.type, n:Utils.indexOf(this.player.props, (p) => p == e), tox:x, toy:y}});

                var toe = this.level.map.getElemAt(x, y);
                var reserve = await e.useAt(x, y);
                if (!reserve)
                    await this.implRemovePlayerProp(e.type);
                else {
                    await this.fireEvent("onPropChanged", {type:e.type});
                    await this.triggerLogicPoint("onPropChanged", {type:e.type});
                }

                await this.fireEvent("onPlayerActed", {subType:"usePropAt", e:e, num:-1});
                await this.triggerLogicPoint("onPlayerActed", {subType:"usePropAt", e:e, num:-1}); // 算一次角色行动
            }
        };
    }

    // 尝试设置/取消一个危险标记，该操作不算角色行动
    public try2BlockGrid() {
        return async (x:number, y:number, mark:boolean) => {
            var g = this.level.map.getGridAt(x, y);
                
            // 操作录像
            this.fireEventSync("onPlayerOp", {op:"try2BlockGrid", ps:{x:x, y:y, mark:mark}});

            if (mark) {
                if (!g.isUncoverable()) return;
                Utils.assert(g.status == GridStatus.Covered, "only covered grid can be blocked");
                g.status = GridStatus.Blocked;
                await this.fireEvent("onGridChanged", {x:x, y:y, subType:"gridBlocked"});
            }
            else {
                Utils.assert(g.status == GridStatus.Blocked, "only blocked grid can be unblocked");
                g.status = GridStatus.Covered;
                await this.fireEvent("onGridChanged", {x:x, y:y, subType:"gridUnblocked"});
            }
        };
    }

    // 尝试启动商店逻辑
    public async try2OpenShop(npc:Monster, items, prices, onBuy, onRob) {
        var elem;
        var price;

        // 处理打折
        var onOpenShopPs = {discount:0};
        this.triggerLogicPointSync("onOpenShop", onOpenShopPs);
        if(onOpenShopPs.discount != 0) {            
            var discounted = [];
            for (var item of items){
                if(Utils.indexOf(discounted, (i) => i == item) < 0){
                    prices[item] = Math.ceil(prices[item] * (1 - onOpenShopPs.discount / 100));
                    discounted.push(item);
                }
            }
        }

        var reserveNpc = await this.openShop(items, prices, async (e:Elem, p:number) => {
            this.fireEventSync("onPlayerOp", {op:"tryBoughtFromShop", ps:{e:e.type, x:npc.pos.x, y:npc.pos.y}});
            elem = e;
            price = p;
            return true;
        }, onRob);

        if (elem)
            await onBuy(elem, price);

        return reserveNpc;
    }

    // 尝试启动选择遗物逻辑
    public async try2SelRelics(choices) {
        await this.openRelicSel2Add(choices, async (relicType) => {
            this.fireEventSync("onPlayerOp", {op:"try2SelRelics", ps:{relicType:relicType}});
            var r = ElemFactory.create(relicType);
            r.setBattle(this);
            await this.implSelRelic(r);
        });
    }

    // impl 开头的函数，通常对应具体的逻辑功能实现，提供给 Elem 使用

    // 标记指定位置的地块
    public async implMark(x:number, y:number) {
        if (this.level.map.getGridAt(x, y).isMarked())
            return;

        await this.mark(x, y);
    }

    // 揭开指定位置
    public async implUncoverAt(x:number, y:number, type:string = undefined) {
        await this.uncover(x, y);
    }

    // 盖上指定位置
    public async implCoverAt(x:number, y:number) {
        await this.cover(x, y);
    }

    // 进入下一关卡
    public async implGo2NextLevel() {
        await this.triggerLogicPoint("beforeGoOutLevel1");
        await this.triggerLogicPoint("beforeGoOutLevel2");
        await this.fireEvent("onGoOutLevel", {bt:this});
    }

    // 替换一个元素
    public async implReplaceElemAt(e:Elem, newE:Elem) {
        var x = e.pos.x;
        var y = e.pos.y;
        this.removeElemAt(x, y);
        this.addElemAt(newE, x, y);
        await this.fireEvent("onGridChanged", {x:x, y:y, e:e, subType:"elemReplaced"});
        await this.fireEvent("onGridChanged", {x:x, y:y, e:e, subType:"elemReplaced"});
    }

    // 向地图添加 Elem
    public async implAddElemAt(e:Elem, x:number, y:number, fromPos = undefined) {
        this.addElemAt(e, x, y);
        await this.fireEvent("onGridChanged", {x:x, y:y, e:e, fromPos:fromPos, subType:"elemAdded"});
        await this.triggerLogicPoint("onGridChanged", {e:e, subType:"elemAdded"});
    }

    // 通知一批物品掉落
    public async notifyElemsDropped(es:Elem[], fromPos) {
        await this.fireEvent("onNotifyElemsDropped", {es:es, fromPos:fromPos});
        for (var i = 0; i < es.length; i++)
            await this.triggerLogicPoint("onGridChanged", {e:es[i], subType:"elemAdded"});
    }

    // 从地图移除 Elem
    public async implRemoveElemAt(x:number, y:number) {
        var e = this.removeElemAt(x, y);
        await this.fireEvent("onGridChanged", {x:x, y:y, e:e, subType:"elemRemoved"});
        await this.triggerLogicPoint("onGridChanged", {x:x, y:y, e:e, subType:"elemRemoved"});
    }

    // Elem 在地图上复活
    public async implReviveElemAt(type:string, attrs = undefined, x:number, y:number, actBeforeRevive = undefined){
        var revivePs = {x:x, y:y, type:type, achieve:true};
        await this.triggerLogicPoint("onElemRevive", revivePs);

        if(!revivePs.achieve) return;

        if(actBeforeRevive) actBeforeRevive();

        var revivedE = this.level.createElem(type, attrs);
        await this.implAddElemAt(revivedE, x, y);

        return revivedE;
    }

    // 角色+hp
    public async implAddPlayerHp(dhp:number, source:any = undefined) {
        if (dhp == 0) return;
        
        //玩家被治疗时受到的加成
        if (dhp > 0){
            var onPlayerHealingPs = {dhp:dhp, source:source, dhpPs:{a:0, b:0, c:0}}
            await this.triggerLogicPoint("onPlayerHealing", onPlayerHealingPs);
            dhp = (dhp + onPlayerHealingPs.dhpPs.b) * (1 + onPlayerHealingPs.dhpPs.a) + onPlayerHealingPs.dhpPs.c;
        }

        this.player.addHp(dhp);
        await this.fireEvent("onPlayerChanged", {subType:"hp", source:source});
        await this.triggerLogicPoint("onPlayerChanged", {"subType": "hp", source:source});
    }

    // 角色+maxhp
    public async implAddPlayerMaxHp(dhp:number, source:any = undefined) {
        this.player.addMaxHp(dhp);
        await this.fireEvent("onPlayerChanged", {subType:"maxHp", source:source});
        await this.triggerLogicPoint("onPlayerChanged", {"subType": "maxHp", source:source});

        await this.implAddPlayerHp(dhp, source);
    }

    // 角色+shield
    public async implAddPlayerShield(ds:number) {
        if (ds == 0) return;
        this.player.addShield(ds);
        await this.fireEvent("onPlayerChanged", {subType:"shield"});
        await this.triggerLogicPoint("onPlayerChanged", {"subType": "shield"});
    }

    // 怪物+hp
    public async implAddMonsterHp(m:Monster, dhp:number) {
        if (dhp == 0) return;
        m.addHp(dhp);
        if (dhp < 0) {
            await this.fireEvent("onMonsterHurt", {dhp:dhp, m:m});
            await this.triggerLogicPoint("onMonsterHurt", {dhp:dhp, m:m});
        }
        
        if (m.isDead())
            await this.implOnElemDie(m);
        else {
            await this.fireEvent("onElemChanged", {subType:"monsterHp", e:m, dhp:dhp});
            await this.triggerLogicPoint("onElemChanged", {"subType": "monsterHp", e:m, dhp:dhp});
        }
    }

    // 怪物+shield
    public async implAddMonsterShield(m:Monster, ds:number) {
        if (ds == 0) return;
        m.addShield(ds);
        await this.fireEvent("onElemChanged", {subType:"shield", e:m});
        await this.triggerLogicPoint("onElemChanged", {"subType": "shield", e:m});
    }

    // +buff
    public async implAddBuff(target, buffType:string, ...ps:any[]) {
        var buff = BuffFactory.create(buffType, ...ps);
        target.addBuff(buff);
        await this.fireEvent("onBuffAdded", {buff:buff, target:target});
        await this.triggerLogicPoint("onBuffAdded", {buff:buff, target:target});
    }

    // -buff
    public async implRemoveBuff(target, type:string) {
        var buff = target.removeBuff(type);
        if (buff) {
            await this.fireEvent("onBuffRemoved", {buff:buff});
            await this.triggerLogicPoint("onBuffAdded", {buff:buff});
        }
    }

    // 执行元素死亡逻辑
    public async implOnElemDie(e:Elem) {
        this.removeElemAt(e.pos.x, e.pos.y);
        await this.fireEvent("onElemChanged", {subType:"die", e:e});
        await this.triggerLogicPoint("onElemChanged", {"subType": "preDie", e:e});

        if (e.onDie) await e.onDie();
        await this.triggerLogicPoint("onElemChanged", {"subType": "die", e:e});
    }

    // 进行一次攻击计算
    public async calcAttack(subType:string, attackerAttrs, targetAttrs, weapon:Elem = undefined) {
        this.triggerLogicPointSync("onCalcAttacking", {subType:subType, attackerAttrs:attackerAttrs, targetAttrs:targetAttrs, weapon:weapon});
        var r = this.bc.doAttackCalc(attackerAttrs, targetAttrs); // 可能有免疫或者盾牌需要替换掉这个结果
        await this.triggerLogicPoint("onCalcAttackResult", {subType:subType, attackerAttrs:attackerAttrs, targetAttrs:targetAttrs, r:r}); // 提供盾牌使用
        return r;
    }

    // 尝试冰冻目标
    public async implFrozeAt(x:number, y:number, weapon:Elem = undefined) {
        var g = this.level.map.getGridAt(x, y);
        var e = g.getElem();
        if (g.isCovered())
            await this.uncover(x, y, true); // 攻击行为自动揭开地块

        if (!e || !(e instanceof Monster)) { // 如果打空，则不需要战斗计算过程，有个表现就可以了
            await this.fireEvent("onAttacking", {subType:"player2monster", x:x, y:y, weapon:weapon});
            return;
        }

        if (e["linkTo"]) { // 是 boss 占位符，更换目标
            e = e["linkTo"];
            x = e.pos.x;
            y = e.pos.y;
        }

        var m = <Monster>e;
        var targetAttrs = m.getAttrsAsTarget();
        var attackerAttrs = weapon.getAttrsAsAttacker();

        await this.fireEvent("onAttacking", {subType:"player2monster", x:x, y:y, targets:[m], weapon:weapon});
        await this.triggerLogicPoint("onAttacking", {subType:"player2monster", x:x, y:y, targets:[m], weapon:weapon});
        
        // 不受援护逻辑影响

        // 检查免疫
        if (Utils.contains(targetAttrs.targetFlags, "Frozen"))
            return;

        // 计算冻结参数
        var frozenAttrs = weapon.attrs.frozenAttrs;
        if (m.isBoss) { // boss 冰冻限制行动
            await m["makeFrozen"](frozenAttrs);
        } else { // 普通怪物生成冰块，转移掉落物品
            var ice = this.level.createElem("IceBlock");
            for (var dp of m.dropItems)
                ice.addDropItem(dp);

            ice["getElemImgResInIce"] = () => m.getElemImgRes();
            m.dropItems = [];
            await this.implOnElemDie(m);
            await this.implAddElemAt(ice, m.pos.x, m.pos.y);
        }
        
        // 被冻结
        await this.fireEvent("onGridChanged", {x:e.pos.x, y:e.pos.y, e:e, subType:"frozen"}); 
    }

    // 尝试消灭目标,只能对某个怪使用
    public async implDestoryAt(x:number, y:number, weapon:Elem = undefined){
        var g = this.level.map.getGridAt(x, y);
        var m = <Monster>g.getElem();
        Utils.assert(!!m, "there is no monster at pos" + x + "," + y);
        if (g.isCovered())
            await this.uncover(x, y, true); // 攻击行为自动揭开地块
        
        var targetAttrs = m.getAttrsAsTarget();
        var attackerAttrs = weapon.getAttrsAsAttacker();

        var targets = [m];
        await this.fireEvent("onAttacking",  {subType:"player2monster", x:m.pos.x, y:m.pos.y, r:{r:"destroyed"}, targets:targets, weapon:weapon});
        await this.triggerLogicPoint("onAttacking", {subType:"player2monster", x:m.pos.x, y:m.pos.y, r:{r:"destroyed"}, targets:targets, weapon:weapon});

        // 要受援护逻辑影响！!
        m = targets[0];

        // 直接死掉
        await this.implOnElemDie(m);
    }

    // 计算当前角色受一切地图元素影响所得到的攻击属性
    public calcPlayerAttackerAttrs() {
        return BattleUtils.calcPlayerAttackerAttrs(this.player);
    }

    // 计算当前角色受一切地图元素影响所得到的防御属性
    public calcPlayerTargetAttrs() {
        return BattleUtils.calcPlayerTargetAttrs(this.player);
    }

    // 计算某个怪物受一切地图元素影响所得到的攻击属性
    public calcMonsterAttackerAttrs(m:Monster){        
        return BattleUtils.calcMonsterAttackerAttrs(m, this.player);
    }

     // 计算某个怪物受一切地图元素影响所得到的防御属性
    public calcMonsterTargetAttrs(m:Monster){
        return BattleUtils.calcMonsterTargetAttrs(m, this.player);
    }

    // 计算某个怪物受一切地图元素影响所得到的攻击间隔
    public calcMonsterAttackInterval(m:Monster){
        var attackInterval = m.attrs.attackInterval;
        var attackIntervalPs = {subType:"setAttackInterval", m:m, dattackInterval:{a:0, b:0, c:0}};
        m.bt().triggerLogicPointSync("onCalcAttackInterval", attackIntervalPs);
        var caledAttackInterval = (attackInterval + attackIntervalPs.dattackInterval.b) * (1 + attackIntervalPs.dattackInterval.a) + attackIntervalPs.dattackInterval.c;        
        caledAttackInterval = caledAttackInterval < 0 ? 0 : caledAttackInterval;
        return caledAttackInterval;
    }

    // 怪物进行偷袭
    public async implMonsterSneak(sneakAct) {
        var sneakPs = {immunized:false}; // 可能被免疫
        await this.triggerLogicPoint("onSneaking", sneakPs);
        if (!sneakPs.immunized) {
            await sneakAct();
            await this.triggerLogicPoint("onSneaked", sneakPs);
        }
    }

    // 角色尝试攻击指定位置
    public async implPlayerAttackAt(x:number, y:number, weapon:Elem = undefined) {
        var map = this.level.map;
        var mapsize = map.size;

        var poses = [{x:x, y:y}];
        if (weapon && weapon.attrs.aoe) { // aoe 需要计算覆盖区域
            var aoe = weapon.attrs.aoe;
            // aoe 区域尺寸只能是基数
            Utils.assert(aoe.w%2 == 1 && aoe.h%2 == 1, "do not support aoe size for: " + aoe.w + ", " + aoe.h);
            poses = [];
            for (var i = -(aoe.w-1)/2; i < aoe.w/2; i++) {
                for (var j = -(aoe.w-1)/2; j < aoe.h/2; j++) {
                    var pt = {x:x + i, y:y + j};
                    if (pt.x >= 0 && pt.x < mapsize.w && pt.y >= 0 && pt.y < mapsize.h)
                        poses.push(pt);
                }
            }
        }

        // 至此，poses 就是攻击区域了，同时 x, y 是玩家选择的原始目标位置

        // 统计被攻击的怪物
        var tars:Monster[] = [];
        for (var i = 0; i < poses.length; i++) {
            var pos = poses[i];
            var g = map.getGridAt(pos.x, pos.y);
            var e = g.getElem();
            if (e && e instanceof Monster) {
                if (e["linkTo"]) // 如果是 boss 占位符，更换目标
                    e = e["linkTo"];

                // 需要考虑大体积怪物的去重问题
                if (!Utils.contains(tars, e))
                    tars.push(<Monster>e);
            }
        }

        // 攻击行为启动
        await this.fireEvent("onAttacking", {subType:"player2monster", x:x, y:y, weapon:weapon, targets:tars});

        // 攻击行为自动揭开地块
        var marked = [];
        for (var i = 0; i < poses.length; i++) {
            var pos = poses[i];
            var g = map.getGridAt(pos.x, pos.y);
            if (g.isCovered()){
                if (g.isMarked())
                    marked.push(map.getElemAt(pos.x, pos.y));

                await this.uncover(pos.x, pos.y, weapon != undefined);
            }
                
        };

        await this.triggerLogicPoint("onAttacking", {subType:"player2monster", x:x, y:y, weapon:weapon, targets:tars});

        // tars 可能在这里发生变化了，比如援护，就会更改攻击目标

        // 如果打空，则不需要战斗计算过程，有个表现就可以了
        if (tars.length == 0)
            return;

        // 攻击属性只需要计算一次
        var attackerAttrs = !weapon ? this.player.getAttrsAsAttacker(0) :
                BattleUtils.mergeBattleAttrsPS(this.player.getAttrsAsAttacker(1), weapon.getAttrsAsAttacker());

        // 这里开始循环处理每一个目标的相关逻辑，至此，targets 分散成为单个 target 处理
        for (var i = 0; i < tars.length; i++) {
            var tar = tars[i];

            // 目标属性
            var targetAttrs = tar.getAttrsAsTarget();
            if (Utils.indexOf(marked, (t) => t == tar) > -1 && !weapon)
                (<string[]>targetAttrs.targetFlags).push("Sneaked"); // 突袭标记

            for (var j = 0; j < attackerAttrs.muiltAttack && !tar.isDead(); j++) {
                var r = await this.calcAttack("player2monster", attackerAttrs, targetAttrs, weapon);
                if (r.r == "attacked") {
                    await this.implAddMonsterHp(tar, r.dhp);
                    await this.implAddMonsterShield(tar, r.dShield)
                }

                // 这里可能是各种攻击结果，成功，闪避，无敌等
                await this.fireEvent("onAttacked", {subType:"player2monster", attackerAttrs:attackerAttrs, targetAttrs:targetAttrs, weapon:weapon, r:r});                

                // 处理附加 buff
                for (var b of r.addBuffs)
                    await this.implAddBuff(tar, "Buff" + b.type, ...b.ps);
            }
            await this.triggerLogicPoint("onAttacked", {subType:"player2monster", attackerAttrs:attackerAttrs, targetAttrs:targetAttrs, weapon:weapon, r:r});
        }
    }

    // 怪物尝试攻击指定目标
    public async implMonsterAttackTargets(m:Monster, targets, extraPowerABC = {a:0, b:0, c:0}, selfExplode = false, addFlags:string[] = []) {
        var map = this.level.map;
        var mapsize = map.size;

        // 至此，poses 就是攻击区域了，同时 x, y 是玩家选择的原始目标位置

        // 统计被攻击的目标
        var tars = [];
        for (var i = 0; i < targets.length; i++) {
            var e = targets[i];
            if (e && e instanceof Monster) {
                if (e["linkTo"]) // 如果是 boss 占位符，更换目标
                    e = e["linkTo"];

                // 需要考虑大体积怪物的去重问题
                if (!Utils.contains(tars, e))
                    tars.push(<Monster>e);
            } else {
                Utils.assert(e instanceof Player, "the targets should be monsters or the player");
                tars.push(e);
            }
        }

        // 攻击行为启动
        await this.fireEvent("onAttacking", {subType:"monstar2targets", m:m, targets:tars, addFlags:addFlags});
        await this.triggerLogicPoint("onAttacking", {subType:"monstar2targets", targets:tars, addFlags:addFlags});

        // tars 可能在这里发生变化了，比如援护，就会更改攻击目标

        // 如果打空，则不需要战斗计算过程，有个表现就可以了
        if (tars.length != 0) {

            // 攻击属性需要特别处理，攻击力要计算两次
            var attackerAttrs = m.getAttrsAsAttacker();
            var powerValue = this.bc.doCalc(attackerAttrs, "power");
            attackerAttrs.power = {a:extraPowerABC.a, b:extraPowerABC.b + powerValue, c:extraPowerABC.c};

            for (var af of addFlags)
                if (!Utils.contains(attackerAttrs.attackFlags, af))
                    attackerAttrs.attackFlags.push(af);

            // 这里开始循环处理每一个目标的相关逻辑，至此，targets 分散成为单个 target 处理
            for (var i = 0; i < tars.length; i++) {
                var tar = tars[i];

                // 目标属性
                var targetAttrs = tar.getAttrsAsTarget();
                for (var j = 0; j < attackerAttrs.muiltAttack && !tar.isDead(); j++) {
                    var r = await this.calcAttack("monster2targets", attackerAttrs, targetAttrs);
                    if (r.r == "attacked") {
                        if (tar instanceof Player) {
                            await this.implAddPlayerHp(r.dhp, m);
                            await this.implAddPlayerShield(r.dShield);
                            if (r.dShared != 0) { // 处理伤害被分担的情况
                                var dSharedMonster = targetAttrs.damageSharedMonster;
                                Utils.assert(dSharedMonster instanceof Monster, "damage should be shared by monster but got" + dSharedMonster.type);
                                await this.implAddMonsterHp(dSharedMonster, r.dShared);
                            }
                        } else {
                            Utils.assert(tar instanceof Monster, "the target should monster, but got " + tar.type);
                            await this.implAddMonsterHp(tar, r.dhp);
                            await this.implAddMonsterShield(tar, r.dShield);
                        }
                    }

                    // 这里可能是各种攻击结果，成功，闪避，无敌等
                    await this.fireEvent("onAttacked", {subType:"monster2targets", attackerAttrs:attackerAttrs, targetAttrs:targetAttrs, r:r});

                    // 处理附加 buff
                    for (var b of r.addBuffs)
                        await this.implAddBuff(tar, "Buff" + b.type, ...b.ps);
                }
                await this.triggerLogicPoint("onAttacked", {subType:"monster2targets", attackerAttrs:attackerAttrs, targetAttrs:targetAttrs, r:r});
            }
        }
        if (selfExplode && !m.isDead()) // 自爆还要走死亡逻辑
            await this.implOnElemDie(m);
    }

    public async implMonsterAttackPoses(m:Monster, poses, extraPowerABC = {a:0, b:0, c:0}, selfExplode = false, addFlags:string[] = [], attackPlayer = false){
        var targets = [];
        for(var pos of poses){
            if(m.map().getGridAt(pos.x, pos.y).isCovered())
                await m.bt().uncover(pos.x, pos.y, true);

            var e = m.map().getElemAt(pos.x, pos.y);
            if (e instanceof Monster)
            targets.push(e);
        }
        if (attackPlayer) targets.push(m.bt().player);

        await m.bt().implMonsterAttackTargets(m, targets, extraPowerABC, selfExplode, addFlags);
    }

    public async implMonsterDoSelfExplode(m:Monster, extraPowerABC, attackPlayer = false){
        var mapsize = m.map().size;
        var aoe = m.attrs.selfExplode.aoe;
        Utils.assert(aoe.w%2 == 1 && aoe.h%2 == 1, "do not support aoe size for: " + aoe.w + ", " + aoe.h);
        var poses = [];
        var x = m.pos.x;
        var y = m.pos.y;
        for (var i = - (aoe.w - 1) / 2; i < aoe.w / 2; i++) {
            for (var j = - (aoe.w - 1) / 2; j < aoe.h / 2; j++) {
                var pt = {x:x + i, y:y + j};
                if (pt.x >= 0 && pt.x < mapsize.w && pt.y >= 0 && pt.y < mapsize.h && !(pt.x ==x && pt.y == y))
                    poses.push(pt);
            }
        }
        extraPowerABC = extraPowerABC ? extraPowerABC : {a:0, b:0, c:0};
        await m.bt().implMonsterAttackPoses(m, poses, extraPowerABC, true, ["immuneAttackBack"], attackPlayer);
    }

    public async implElemFollow2NextLevel(e:Elem) {
        this.removeElemAt(e.pos.x, e.pos.y);
        this.player.elems2NextLevel.push(e);
        await this.fireEvent("onElem2NextLevel", {e:e});
        await this.triggerLogicPoint("onElem2NextLevel", {e:e});
    }

    // 魅惑怪物
    public async implCharmMonster(m:Monster, dattrs = undefined){
        Utils.assert(m.isHazard() && !m.isBoss, "only hazard monster can be charmed");
        var pos = m.pos;
        if(m.getGrid().isCovered())
            this.uncover(pos.x, pos.y, true);
        
        var cm = await MonsterFactory.createCharmedMonster(m, dattrs);
        
        this.removeElemAt(pos.x, pos.y);
        await this.fireEvent("onMonsterCharmed", {m:m, cm:cm});
        await this.implAddElemAt(cm, pos.x, pos.y);
    }

    // 角色+经验
    public async implAddPlayerExp(dExp:number) {
        this.player.addExp(dExp);
        await this.fireEvent("onPlayerChanged", {subType:"exp"});
        await this.triggerLogicPoint("onPlayerChanged", {subType:"exp"});
    }

    // 角色+属性，除了hp
    public async implAddDeathGodStep(d:number, e:Elem = undefined, subType:string = undefined) {
        var v = this.player.deathStep;
        if (d + v > this.player.maxDeathStep)
            d = this.player.maxDeathStep - v;
        else if (d + v < 0)
            d = -v;
        
        this.player.deathStep += d;
        await this.fireEvent("onAddDeathGodStep", {d:d, e:e, subType:subType});
        await this.triggerLogicPoint("onAddDeathGodStep", {d:d, e:e, subType:subType});
    }

    // 角色+遗物
    public async implSelRelic(e:Elem) {
        this.player.addRelic(<Relic>e);
        await this.fireEvent("onRelicChanged", {subType:"addRelicBySel", e:e});
        await this.triggerLogicPoint("onRelicChanged", {subType:"addRelic", e:e});
    }

    public async implPickupRelic(e:Elem) {
        this.player.addRelic(<Relic>e);
        await this.fireEvent("onRelicChanged", {subType:"addRelicByPickup", e:e});
        await this.triggerLogicPoint("onRelicChanged", {subType:"addRelic", e:e});
    }

    // 角色-遗物
    public async implRemovePlayerRelic(type:string) {
        var e = this.player.removeRelic(type);
        await this.fireEvent("onPlayerChanged", {subType:"removeRelic", e:e});
        await this.triggerLogicPoint("onPlayerChanged", {subType:"removeRelic", e:e});
    }

    // 角色+道具
    public async implAddPlayerProp(e:Elem) {
        this.player.addProp(<Prop>e);
        await this.fireEvent("onPropChanged", {subType:"addProp", e:e});
        await this.triggerLogicPoint("onPropChanged", {subType:"addProp", e:e});
    }

    // 角色-道具
    public async implRemovePlayerProp(type:string) {
        this.player.removeProp(type);
        await this.fireEvent("onPropChanged", {subType:"removeProp", type:type});
        await this.triggerLogicPoint("onPropChanged", {subType:"removeProp", type:type});
    }

    // 元素飞行到指定位置
    public async implElemFly(e:Elem, toPos) {
        var fromPos = {x:e.pos.x, y:e.pos.y};
        this.level.map.switchElems(e.pos.x, e.pos.y, toPos.x, toPos.y);
        await this.fireEvent("onElemFlying", {e:e, fromPos:fromPos, toPos:toPos});
    }

    // 元素进行移动，path 是一组 {x:x, y:y} 的数组
    public async implElemMoving(e:Elem, path) {
        if (path.length == 0)
            return;

        // 第一个路径点必须是相邻格子
        Utils.assert(Math.abs(e.pos.x - path[0].x) + Math.abs(e.pos.y - path[0].y) == 1, 
            "first step should be around:" + e.pos.x + ", " + e.pos.y + " - " + path[0].x + ", " + path[0].y);
        
        // 检查路径上的格子是不是都可以走
        for (var n of path) {
            var x = n.x;
            var y = n.y;
            if (!(e.pos.x == x && e.pos.y == y) && !this.level.map.isWalkable(x, y))
                return;
        }

        // 直接移动到指定位置，逻辑上是没有连续移动过程的
        var fromPos = {x:e.pos.x, y:e.pos.y};
        this.level.map.switchElems(e.pos.x, e.pos.y, path[path.length-1].x, path[path.length-1].y);
        await this.fireEvent("onElemMoving", {e:e, path:[fromPos, ...path]});
    }

    // 给角色加钱/减钱, e 是相关元素，比如偷钱的怪物，或者是地上的钱币
    public async implAddMoney(dm:number, e:Elem = undefined) {
        this.player.addMoney(dm);
        if(e)
            await this.fireEvent("onPlayerChanged", {subType:"money", e:e, d:dm});
            
        await this.triggerLogicPoint("onPlayerChanged", {"subType": "money", e:e, d:dm});
    }

    // 吸血，e 是相关元素
    public async implSuckPlayerBlood(m:Monster, suckBlood:number) {
        var dhp = suckBlood; // 吸血能力
        this.player.addHp(-dhp);
        m.addHp(dhp);

        await this.triggerLogicPoint("onSuckPlayerBlood", {m:m});
        await this.fireEvent("onSuckPlayerBlood", {m:m});
    }

    // 怪物拿走一批元素
    public async implMonsterTakeElems(m:Monster, es:Elem[], toDropList:boolean) {
        for (var e of es) {
            this.removeElemAt(e.pos.x, e.pos.y);
            if (toDropList) 
                m.addDropItem(e);
        }

        await this.fireEvent("onMonsterTakeElem", {m:m, es:es, toDropList:toDropList})
    }
}
