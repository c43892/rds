//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class Main extends egret.DisplayObjectContainer {

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }

    private onAddToStage(event: egret.Event) {

        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin

            context.onUpdate = () => {

            }
        })

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        }

        this.runGame().catch(e => {
            console.log(e);
        })
    }

    // 基础功能装配
    private globalInit() {
        var lvCfg = RES.getRes("levelconfig_json");
        GCfg.mapsize = lvCfg.mapsize;
        GCfg.getLevelCfg = (lv) => lvCfg[lv];
        var elemAttrsCfg = RES.getRes("elemattrsconfig_json");
        GCfg.getElemAttrsCfg = (e) => elemAttrsCfg[e];
    }

    private mv: MainView; // 地图显示

    private async runGame() {

        // var c = new WSClient();
        // c.connect2srv("localhost", 80)
        // .onError(() => console.log("net error"))
        // .onConnected(() => c.request({"msg":"echo", "content":"hello"}, (r) => console.log("echo: " + r["content"])));

        await this.loadResource() // 加载初始资源
        this.globalInit(); // 全局基础功能初始化

        // 创建场景
        this.createGameScene();

        // 登录
        const result = await RES.getResAsync("description_json")
        await platform.login();
        const userInfo = await platform.getUserInfo();

        // 录像机如何启动新的录像战斗
        BattleRecorder.startNewBattleImpl = (p:Player, trueRandomSeed:number) => {
            this.startNewBattle(Battle.createNewBattle(p, trueRandomSeed));
        };

        // 如何启动下一关战斗
        Battle.startNewBattle = (p:Player) => {
            p.currentLevel = GCfg.getLevelCfg(p.currentLevel).nextLevel;
            this.startNewBattleWithRecorder(Battle.createNewBattle(p));
        }

        // test map
        var bt = Battle.createNewBattle(Player.createTestPlayer());
        this.startNewBattleWithRecorder(bt);
    }

    // 开始一场新的战斗
    public startNewBattleWithRecorder(bt:Battle) { this.startNewBattle(bt); BattleRecorder.startNew(bt.id, bt.player, bt.trueRandomSeed); }
    public startNewBattle(bt:Battle) {
        Utils.log("start a new battle with ", bt.$$srandSeed());

        ElemView.try2UseElem = bt.try2UseElem();
        ElemView.try2UseElemAt = bt.try2UseElemAt();
        ElemView.reposElemTo = bt.reposElemTo();
        ElemView.selectGrid = (f, cb) => this.mv.selectGrid(f).then(cb);
        ElemView.select1InN = (title, choices, f, cb) => this.mv.select1inN(title, choices, f).then(cb);
        ElemView.try2UncoverAt = bt.try2UncoverAt();
        ElemView.try2BlockGrid = bt.try2BlockGrid();
        PropView.try2UseProp = bt.try2UseProp();
        PropView.selectGrid = (f, cb) => this.mv.selectGrid(f).then(cb);
        PropView.select1InN = (title, choices, f, cb) => this.mv.select1inN(title, choices, f).then(cb);
        PropView.try2UsePropAt = bt.try2UsePropAt();

        bt.registerEvent("onPlayerOp", (ps) => BattleRecorder.onPlayerOp(ps.op, ps.ps));
        bt.registerEvent("onLevel", (ps) => this.mv.onLevel(ps));
        Utils.registerEventHandlers(bt, [
            "onGridChanged", "onPlayerChanged", "onAttack", "onMonsterChanged",
            "onElemMoving", "onAllCoveredAtInit", "onSuckPlayerBlood", "onMonsterTakeElem",
        ], (e) => (ps) => this.mv.aniView[e](ps));

        BattleRecorder.registerReplayIndicatorHandlers(bt);
        bt.Start();
    }

    private async loadResource() {
        try {
            const loadingView = new LoadingUI();
            this.stage.addChild(loadingView);
            await RES.loadConfig("resource/default.res.json", "resource/");
            await RES.loadGroup("preload", 0, loadingView);
            this.stage.removeChild(loadingView);
        }
        catch (e) {
            console.error(e);
        }
    }

    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene() {
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;

        // 背景图
        let bg = ViewUtils.createBitmapByName("bg_png");
        bg.width = stageW;
        bg.height = stageH;
        bg.x = 0;
        bg.y = 0;
        this.addChild(bg);

        // 主视图
        this.mv = new MainView(1, 1);
        this.mv.width = stageW;
        this.mv.height = stageH;
        this.mv.anchorOffsetX = 0;
        this.mv.anchorOffsetY = 0;
        this.mv.x = 0;
        this.mv.y = 0;
        this.addChild(this.mv);
    }
}