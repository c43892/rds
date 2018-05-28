
// 一局战斗，包含当前关卡和当前角色数据，并控制整个战斗进程
class Battle extends egret.EventDispatcher {
    srand:SRandom; // 随机序列
    private lvCfg; // 当前关卡配置
    public level:Level; // 当前关卡
    public player:Player; // 角色数据
    private bc:BattleCalculator; // 战斗计算器

    constructor(randomseed:number) {
        super();
        this.srand = new SRandom(randomseed);
    }

    public static createNewBattle(player:Player):Battle {
        var bt = new Battle(0);
        bt.player = player;
        return bt;
    }

    // 载入指定关卡
    public loadCurrentLevel():Level {
        this.level = new Level();
        this.lvCfg = GBConfig.getLevelCfg(this.player.currentLevel);
        this.level.Init(this, this.lvCfg);
        this.bc = new BattleCalculator(0);
        return this.level;
    }

    // 载入下一关卡
    public loadNextLevel():Level {
        var nextLevelCfg = this.lvCfg.nextLevel;
        this.player.currentLevel = nextLevelCfg;
        return this.loadCurrentLevel();
    }

    // 揭开起始区域
    public uncoverStartupRegion() {
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
        this.triggerLogicPoint("onInitialUncovered");
    }

    // 计算一片指定大小的区域，该区域尽量以逃跑的出口位置为中心，
    // 结果格式为 {left:left, top:top} 指明该区域的左小坐标
    private getGetRegionWithEscapePort(w:number, h:number) {
        var map = this.level.map;
        var ep = map.findFirstElem((x, y, e) => e && e.type == "EscapePort");
        Utils.assert(!!ep, "there should be 1 EscapePort"); // 有且只有一个逃离出口
        return Utils.calculateBoundary(ep.pos.x, ep.pos.y, w, h, 0, 0, map.size.w, map.size.h);
    }

    // 揭开指定位置的地块
    public uncover(x:number, y:number) {
        var e = this.level.map.getBrickAt(x, y);
        e.status = BrickStatus.Uncovered;

        this.dispatchEvent(new BrickChangedEvent(x, y, "BrickUnconvered"));
        this.triggerLogicPoint("onUncovered", {eleme:e});
    }

    // 触发逻辑点，参数为逻辑点名称，该名称直接字面对应个各元素对逻辑点的处理函数，
    // 处理函数的返回值表示是否需要截获该事件，不再传递给其它元素
    public triggerLogicPoint(lpName:string, params = undefined) {
        // 地图上的元素响应之
        this.level.map.foreachUncoveredElems((e) => {
            var handler = e[lpName];
            return !handler ? false : handler(params);
        });
    }

    // 添加物品
    public addElemAt(e:Elem, x:number, y:number) {
        this.level.map.addElemAt(e, x, y);
        this.dispatchEvent(new BrickChangedEvent(x, y, "ElemAdded"));
        this.triggerLogicPoint("onElemAdded", {eleme:e});
    }

    // 移除物品
    public removeElem(e:Elem) {
        var x = e.pos.x;
        var y = e.pos.y;
        this.level.map.removeElemAt(x, y);
        this.dispatchEvent(new BrickChangedEvent(x, y, "ElemRemoved"));
        this.triggerLogicPoint("onElemRemoved", {eleme:e});
    }

    // try 开头的函数通常对应玩家操作行为

    // 尝试揭开指定位置
    public try2UncoverAt() {
        return (x:number, y:number) => {
            Utils.assert(x >= 0 && x < this.level.map.size.w 
                            && y >= 0 && y < this.level.map.size.h, 
                            "index out of bounds");

            let b = this.level.map.getBrickAt(x, y);
            if (b.status == BrickStatus.Uncovered || b.status == BrickStatus.Blocked)
                return;

            this.uncover(x, y);
            this.triggerLogicPoint("afterPlayerActed"); // 算一次角色行动
        };
    }

    // 尝试无目标使用元素
    public try2UseElem() {
        return (elem:Elem) => {
            let canUse = elem.canUse;
            if (!canUse)
                return;
            
            // 其它元素可能会阻止使用
            this.level.map.foreachUncoveredElems((e:Elem) => {
                if (e.canUseOther)
                    canUse = e.canUseOther(elem);

                return !canUse;
            });

            // 可以使用
            if (canUse) {
                var reserve = elem.use(); // 返回值决定是保留还是消耗掉
                this.triggerLogicPoint("onElemUsed", {elem:elem});
                if (!reserve)
                    this.removeElem(elem);

                this.triggerLogicPoint("afterPlayerActed"); // 算一次角色行动
            }
        };
    }

    // impl 开头的函数，通常对应具体的逻辑功能实现，提供给 Elem 使用

    // 修改角色 hp
    public implAddPlayerHp(dhp:number) {
        this.player.addHp(dhp);
        this.dispatchEvent(new PlayerChangedEvent("hp"));
        this.triggerLogicPoint("onPlayerChanged", {"subType": "hp"});
    }

    // 修改怪物 hp
    public implAddMonsterHp(m:Monster, dhp:number) {
        m.addHp(dhp);
        this.dispatchEvent(new MonsterChangedEvent("hp", m));
        this.triggerLogicPoint("onMonsterChanged", {"subType": "hp", "m":m});
    }

    // 角色尝试攻击指定怪物
    public implPlayerAttackMonster(e:Monster) {
        var r = this.bc.tryAttack(this.player, e);
        this.dispatchEvent(new AttackEvent("player2monster", r));

        switch (r.r) {
            case "attacked": // 攻击成功
                this.implAddMonsterHp(e, r.dhp);
                this.triggerLogicPoint("onMonsterDamanged", {"dhp": r.dhp});
            break;
            case "dodged": // 被闪避
                this.triggerLogicPoint("onMonsterDodged");
        }
    }

    // 指定怪物尝试攻击角色
    public implMonsterAttackPlayer(e:Monster) {
        var r = this.bc.tryAttack(e, this.player);
        this.dispatchEvent(new AttackEvent("monster2player", r));

        switch (r.r) {
            case "attacked": // 攻击成功
                this.implAddPlayerHp(r.dhp);
                this.triggerLogicPoint("onPlayerDamanged", {"dhp": r.dhp});
            break;
            case "dodged": // 被闪避
                this.triggerLogicPoint("onPlayerDodged");
            break;
        }
    }
}
