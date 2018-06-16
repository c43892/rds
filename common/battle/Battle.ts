
// 一局战斗，包含当前关卡和当前角色数据，并控制整个战斗进程
class Battle {
    public id:string; // 每场战斗一个随机 id
    public srand:SRandom; // 随机序列
    public trueRandomSeed:number; // 随机序列2，这个随机序列相关的通常是允许玩家刷的东西，不会计入存档，但是会计入录像
    public trueRand:SRandom; // 随机序列2，这个随机序列相关的通常是允许玩家刷的东西，不会计入存档，但是会计入录像
    public level:Level; // 当前关卡
    public player:Player; // 角色数据
    public bc:BattleCalculator; // 战斗计算器
    public $$srandSeed; // 测试用，获取战斗随机数种子
    private lvCfg; // 当前关卡配置

    constructor(randomseed:number, trueRandomSeed:number) {
        Utils.assert(randomseed != undefined, "the randomseed should be specified");
        this.srand = new SRandom(randomseed);
        this.trueRandomSeed = trueRandomSeed;
        this.trueRand = new SRandom(trueRandomSeed);
        this.$$srandSeed = () => [randomseed, trueRandomSeed];
    }

    public static createNewBattle(player:Player, trueRandomSeed:number = undefined):Battle {
        if (trueRandomSeed == undefined)
            trueRandomSeed = (new Date()).getMilliseconds();

        var bt = new Battle(player.battleRandomSeed, trueRandomSeed);
        bt.id = "bt_" + Math.random();
        bt.player = Occupation.makeOccupation(player);
        player.getBattle = () => bt;
        return bt;
    }

    // 载入指定关卡
    public loadCurrentLevel():Level {
        // 创建关卡地图和元素
        this.level = new Level();
        this.lvCfg = GBConfig.getLevelCfg(this.player.currentLevel);        
        this.level.Init(this, this.lvCfg);
        this.bc = new BattleCalculator(this.srand);
        return this.level;
    }

    // 载入下一关卡
    public loadNextLevel():Level {
        var nextLevelCfg = this.lvCfg.nextLevel;
        this.player.currentLevel = nextLevelCfg;
        return this.loadCurrentLevel();
    }

    // 开始当前战斗
    public async Start() {
        this.loadCurrentLevel();
        this.level.RandomElemsPos(); // 先随机一下，免得看起来不好看

        await this.fireEvent("onLevel", {subType:"levelInited", bt:this});
        await this.triggerLogicPoint("onLevelInited");

        await this.coverAllAtInit();
        this.level.RandomElemsPos(); // 随机元素位置
        await this.uncoverStartupRegion();
    }

    // 初始盖住所有格子
    public async coverAllAtInit() {
        this.level.map.travelAll((x, y) => this.level.map.getGridAt(x, y).status = GridStatus.Covered);
        await this.fireEvent("onAllCoveredAtInit");
        await this.triggerLogicPoint("onAllCoveredAtInit");
    }

    // 揭开起始区域
    public async uncoverStartupRegion() {
        var init_uncovered = this.lvCfg.init_uncovered;
        var w = init_uncovered.w;
        var h = init_uncovered.h;
        var lt = this.getGetRegionWithEscapePort(w, h);
        for(var i = 0; i < w; i++) {
            for (var j = 0; j < h; j++) {
                this.uncover(i + lt.left, j + lt.top);
            }
        }

        // 移除逃离出口，目前不需要了
        var ep = this.level.map.findFirstElem((x, y, e) => e && e.type == "EscapePort");
        this.level.map.removeElemAt(ep.pos.x, ep.pos.y);
        await this.fireEvent("onStartupRegionUncovered");
        await this.triggerLogicPoint("onStartupRegionUncovered");
    }

    // 计算一片指定大小的区域，该区域尽量以逃跑的出口位置为中心，
    // 结果格式为 {left:left, top:top} 指明该区域的左小坐标
    private getGetRegionWithEscapePort(w:number, h:number) {
        var map = this.level.map;
        var ep = map.findFirstElem((x, y, e) => e && e.type == "EscapePort");
        Utils.assert(!!ep, "there should be 1 EscapePort"); // 有且只有一个逃离出口
        return Utils.calculateBoundary(ep.pos.x, ep.pos.y, w, h, 0, 0, map.size.w, map.size.h);
    }

    // 标记指定位置的地块
    public async mark(x:number, y:number) {
        var g = this.level.map.getGridAt(x, y);
        var e = g.getElem();
        Utils.assert(g.isCovered() && e && e.hazard, "only covered hazared element could be marked");

        g.status = GridStatus.Marked;
        await this.fireEvent("onGridChanged", {x:x, y:y, subType:"ElemMarked"});
        await this.triggerLogicPoint("onMarked", {eleme:e});
    }

    // 揭开指定位置的地块（不再检查条件）
    public async uncover(x:number, y:number) {
        var e = this.level.map.getGridAt(x, y);
        Utils.assert(e.isCovered(), "uncover action can only be implemented on a covered grid");
        e.status = GridStatus.Uncovered;

        await this.fireEvent("onGridChanged", {x:x, y:y, subType:"GridUnconvered"});
        await this.triggerLogicPoint("onUncovered", {eleme:e});

        // 对 8 邻格子进行标记逻辑计算
        var neighbours = [];
        this.level.map.travel8Neighbours(x, y, (px, py, e, g:Grid) => {
            if (g.isCovered())
                neighbours.push([px, py]);
        });

        for (var p of neighbours)
            await this.tryCalcMarkPos(p[0], p[1]);

        return true;
    }

    // 计算标记
    public async tryCalcMarkPos(x:number, y:number) {
        var markPos = MonsterMarker.CalcMonsterMarkSignAt(this.level.map, x, y);
        for (var p of markPos)
            this.mark(p[0], p[1]);
    }

    // 搜集所有计算参数，返回值形如 {a:[...], b:[...], c:[...]}
    public getCalcPs(type:string) {
        var ps = {a:[], b:[], c:[]};
        BattleUtils.mergeCalcPs(ps, this.player[type]);
        this.level.map.foreachUncoveredElems((e) => BattleUtils.mergeCalcPs(ps, e[type]));
        return ps;
    }

    // 触发逻辑点，参数为逻辑点名称，该名称直接字面对应个各元素对逻辑点的处理函数，
    // 处理函数的返回值表示是否需要截获该事件，不再传递给其它元素
    public async triggerLogicPoint(lpName:string, ps = undefined) {
        // 玩家响应之
        var hs = this.player[lpName];
        if (hs)
            for (var h of hs)
                await h(ps);

        // 地图上的元素响应之
        var es = [];
        this.level.map.foreachUncoveredElems((e) => { es.push(e); return false; });
        for (var e of es) {
            var handler = e[lpName];
            if (handler && await handler(ps))
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
        this.level.map.addElemAt(e, x, y);
    }

    // 移除物品
    public removeElem(e:Elem) {
        var x = e.pos.x;
        var y = e.pos.y;
        this.level.map.removeElemAt(x, y);
    }

    // try 开头的函数通常对应玩家操作行为

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
            this.uncover(x, y);
            await this.triggerLogicPoint("onGridUncovered", {x:x, y:y, stateBeforeUncover:stateBeforeUncover});
            await this.triggerLogicPoint("onPlayerActed"); // 算一次角色行动
        };
    }

    // 尝试无目标使用元素
    public try2UseElem() {
        return async (e:Elem) => {
            let canUse = e.canUse();
            if (!canUse)
                return;

            // 其它元素可能会阻止使用
            this.level.map.foreachUncoveredElems((e:Elem) => {
                if (e.canUseOther)
                    canUse = e.canUseOther(e);

                return !canUse;
            });

            // 可以使用
            if (canUse) {

                // 操作录像
                this.fireEventSync("onPlayerOp", {op:"try2UseElem", ps:{x:e.pos.x, y:e.pos.y}});

                var reserve = await e.use(); // 返回值决定是保留还是消耗掉
                if (!reserve) {
                    this.removeElem(e);
                    if (e.onDie)
                        await e.onDie();
                }

                await this.fireEvent("onGridChanged", {x:e.pos.x, y:e.pos.y, subType:"ElemDie"});
                await this.triggerLogicPoint("onElemUsed", {x:e.pos.x, y:e.pos.y, e:e});
                await this.triggerLogicPoint("onPlayerActed"); // 算一次角色行动
            }
        };
    }

    // 尝试使用一个元素，将一个坐标设定为目标
    public try2UseElemAt() {
        return async (e:Elem, x:number, y:number) => {
            var map = this.level.map;
            var fx = e.pos.x;
            var fy = e.pos.y;
            var b = map.getGridAt(x, y);
            if (b.status == GridStatus.Uncovered && !b.getElem()) {
                // 将元素移动到空地
                map.removeElemAt(fx, fy);
                map.addElemAt(e, x, y);
                await this.fireEvent("onGridChanged", {x:fx, y:fy, subType:"ElemSwitchFrom"});
                await this.fireEvent("onGridChanged", {x:x, y:y, subType:"ElemSwitchTo"});
            }
            else if (e.canUseAt(x, y)) {
                // 对指定目标位置使用
                var canUse = true;
                // 其它元素可能会阻止使用
                this.level.map.foreachUncoveredElems((e:Elem) => {
                    if (e.canUseOther)
                        canUse = e.canUseOtherAt(e, x, y);

                    return !canUse;
                });

                // 操作录像
                this.fireEventSync("onPlayerOp", {op:"try2UseElemAt", ps:{x:e.pos.x, y:e.pos.y, tox:x, toy:y}});

                var toe = this.level.map.getElemAt(x, y);
                var reserve = await e.useAt(x, y); // 返回值决定是保留还是消耗掉
                if (!reserve) {
                    this.removeElem(e);
                    if (e.onDie)
                        await e.onDie();
                }

                await this.fireEvent("onGridChanged", {x:e.pos.x, y:e.pos.y, subType:"UseElem"});
                await this.triggerLogicPoint("onUseElemAt", {x:e.pos.x, y:e.pos.y, e:e, tox:x, toy:y, toe:toe});
            }
        };
    }

    // 尝试设置/取消一个危险标记，该操作不算角色行动
    public try2BlockGrid() {
        return async (x:number, y:number, mark:boolean) => {
            // 操作录像
            this.fireEventSync("onPlayerOp", {op:"try2BlockGrid", ps:{x:x, y:y, mark:mark}});

            var b = this.level.map.getGridAt(x, y);
            if (mark) {
                Utils.assert(b.status == GridStatus.Covered, "only covered grid can be blocked");
                b.status = GridStatus.Blocked;
                await this.fireEvent("onGridChanged", {x:x, y:y, subType:"GridBlocked"});
            }
            else {
                Utils.assert(b.status == GridStatus.Blocked, "only blocked grid can be unblocked");
                b.status = GridStatus.Covered;
                await this.fireEvent("onGridChanged", {x:x, y:y, subType:"GridUnblocked"});
            }
        };
    }

    // impl 开头的函数，通常对应具体的逻辑功能实现，提供给 Elem 使用

    // 进入下一关卡
    public static startNewBattle;
    public async implGo2NextLevel() {
        await this.triggerLogicPoint("beforeGoOutLevel");
        await this.fireEvent("onLevel", {subType:"goOutLevel", bt:this});
        Battle.startNewBattle(this.player);
    }

    // 向地图添加物品
    public async implAddElemAt(e:Elem, x:number, y:number) {
        this.addElemAt(e, x, y);
        await this.fireEvent("onGridChanged", {x:x, y:y, subType:"ElemAdded"});
        await this.triggerLogicPoint("onElemAdded", {eleme:e});
    }

    // 从地图移除物品
    public async implRemoveElem(e:Elem) {
        var x = e.pos.x;
        var y = e.pos.y;
        this.removeElem(e);
        await this.fireEvent("onGridChanged", {x:x, y:y, subType:"ElemRemoved"});
        await this.triggerLogicPoint("onElemRemoved", {eleme:e});
    }

    // 角色+hp
    public async implAddPlayerHp(dhp:number) {
        this.player.addHp(dhp);
        await this.fireEvent("onPlayerChanged", {subtype:"hp"});
        await this.triggerLogicPoint("onPlayerChanged", {"subType": "hp"});
    }

    // 怪物+hp
    public async implAddMonsterHp(m:Monster, dhp:number) {
        m.addHp(dhp);
        await this.fireEvent("onMonsterChanged", {subType:"hp", m:m});
        await this.triggerLogicPoint("onMonsterChanged", {"subType": "hp", "m":m});
    }

    // 角色尝试攻击指定怪物
    public async implPlayerAttackMonster(m:Monster, weapon:Elem = undefined) {
        var r = this.bc.tryAttack(this.player, m, weapon);
        await this.fireEvent("onAttack", {subtype:"player2monster", r:r, m:m, weapon:weapon});

        switch (r.r) {
            case "attacked": // 攻击成功
                this.implAddMonsterHp(m, -r.dhp);
                await this.triggerLogicPoint("onMonsterHurt", {"dhp": r.dhp, m:m});
                if (m.hp <= 0) { // 打死了
                    this.removeElem(m);
                    if (m.onDie)
                        await m.onDie();
                }
                await this.fireEvent("onGridChanged", {x:m.pos.x, y:m.pos.y, subType:"onMonsterDamanged"});
            break;
            case "dodged": // 被闪避
                await this.triggerLogicPoint("onMonsterDodged");
        }
    }

    // 指定怪物尝试攻击角色
    public async implMonsterAttackPlayer(m:Monster) {
        var r = this.bc.tryAttack(m, this.player);
        await this.fireEvent("onAttack", {subtype:"monster2player", r:r, m:m});

        switch (r.r) {
            case "attacked": // 攻击成功
                this.implAddPlayerHp(-r.dhp);
                await this.triggerLogicPoint("onPlayerDamanged", {"dhp": r.dhp});
            break;
            case "dodged": // 被闪避
                await this.triggerLogicPoint("onPlayerDodged");
            break;
        }
    }

    // 怪物进行移动，path 是一组 {x:x, y:y} 的数组
    public async implMonsterMoving(m:Monster, path) {
        if (path.length == 0)
            return;

        // 第一个路径点必须是相邻格子
        if (Math.abs(m.pos.x - path[0].x) + Math.abs(m.pos.y - path[0].y) > 1)
            return;
        
        // 检查路径上的格子是不是都可以走
        for (var n of path) {
            var x = n.x;
            var y = n.y;
            if (!(m.pos.x == x && m.pos.y == y) && !this.level.map.isWalkable(x, y))
                return;
        }


        // 直接移动到指定位置，逻辑上是没有连续移动过程的
        this.level.map.switchElems(m.pos.x, m.pos.y, path[path.length-1].x, path[path.length-1].y);
        await this.fireEvent("onElemMoving", {subType:"MonsterMoving", m:m, path:path});
    }

    // 给角色加钱/减钱, e 是相关元素，比如偷钱的怪物，或者是地上的钱币
    public async implAddMoney(e:Elem, dm:number) {
        this.player.addMoney(dm);
        
        await this.fireEvent("onPlayerChanged", {subtype:"money", e:e});
        await this.triggerLogicPoint("onPlayerChanged", {"subType": "money", e:e});
    }

    // 吸血，e 是相关元素
    public async implSuckPlayerBlood(m:Monster) {
        var dhp = m.spower; // 吸血能力
        this.player.addHp(-dhp);
        m.addHp(dhp);

        await this.triggerLogicPoint("onSuckPlayerBlood", {m:m});
        await this.fireEvent("onSuckPlayerBlood", {m:m});
    }
}
