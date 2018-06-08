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
        GBConfig.mapsize = lvCfg.mapsize;
        GBConfig.getLevelCfg = (lv) => lvCfg[lv];
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
        // console.log(userInfo);

        // test map
        console.log("create test battle");
        var bt = Battle.createNewBattle(Player.createTestPlayer());

        bt.loadCurrentLevel();
        bt.uncoverStartupRegion();

        // refresh view
        this.mv.setMap(bt.level.map);
        this.mv.setPlayer(bt.player);
        this.mv.refresh();

        ElemView.try2UncoverAt = bt.try2UncoverAt();
        ElemView.try2UseElem = bt.try2UseElem();
        ElemView.try2BlockGrid = bt.try2BlockGrid();
        ElemView.try2UseAt = bt.try2UseAt();
        bt.registerEvent(GridChangedEvent.type, (evt) => this.mv.onGridChanged(evt));
        bt.registerEvent(PlayerChangedEvent.type, (evt) => this.mv.onPlayerChanged(evt));
        bt.registerEvent(AttackEvent.type, (evt) => this.mv.onAttacked(evt));
        bt.registerEvent(MonsterChangedEvent.type, (evt) => this.mv.onMonsterChanged(evt));
        bt.registerEvent(ElemMovingEvent.type, (evt) => this.mv.onElemMoving(evt));
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