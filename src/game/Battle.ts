
// 一局战斗，包含当前关卡和当前角色数据，并控制整个战斗进程
class Battle {
    public static getLevelCfg; // 关卡配置，一个形如 function(lv:string):any 的函数
    public static mapsize; // 地图尺寸，全局唯一
    
    private lvCfg; // 当前关卡配置
    public level:Level; // 当前关卡
    public player:Player; // 角色数据

    // 重新创建角色
    public createNewPlayer() {
        this.player = new Player();
        this.player.currentLevel = "testLevel";
    }

    // 载入指定关卡
    public loadCurrentLevel() {
        this.level = new Level();
        this.lvCfg = Battle.getLevelCfg(this.player.currentLevel);
        this.level.Init(this.lvCfg, Battle.mapsize, 0);
    }

    // 载入下一关卡
    public loadNextLevel() {
        var nextLevelCfg = this.lvCfg.nextLevel;
        this.player.currentLevel = nextLevelCfg;
        this.loadCurrentLevel();
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
        this.triggerLogicPoint("onInitialUncovered", undefined);
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
        this.triggerLogicPoint("onUncovered", {e:e});
    }

    // 触发逻辑点，参数为逻辑点名称，该名称直接字面对应个各元素对逻辑点的处理函数，
    // 处理函数的返回值表示是否需要继续传递该逻辑点事件给其它元素
    public triggerLogicPoint(lpName:string, params) {
        // 地图上的元素响应之
        this.level.map.foreachElems((e) => {
            var handler = e[lpName];
            return !handler ? true : handler(params);
        });
    }
}
