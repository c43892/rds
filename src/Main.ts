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
        // Utils.LogMap(bt.level.map);

        // refresh view
        this.mv.setMap(bt.level.map);
        this.mv.setPlayer(bt.player);
        this.mv.refresh();

        GridView.try2UncoverAt = bt.try2UncoverAt();
        GridView.try2UseElem = bt.try2UseElem();
        GridView.try2BlockGrid = bt.try2BlockGrid();
        bt.addEventListener(GridChangedEvent.type, this.mv.onGridChanged, this.mv);
        bt.addEventListener(PlayerChangedEvent.type, this.mv.onPlayerChanged, this.mv);
        bt.addEventListener(AttackEvent.type, this.mv.onAttacked, this.mv);
        bt.addEventListener(MonsterChangedEvent.type, this.mv.onMonsterChanged, this.mv);
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

        // 地图区域
        this.mv = new MainView(1, 1);
        this.mv.width = stageW;
        this.mv.height = stageH;
        this.mv.anchorOffsetX = 0;
        this.mv.anchorOffsetY = 0;
        this.mv.x = 0;
        this.mv.y = 0;
        this.addChild(this.mv);

        // let sky = ViewUtils.createBitmapByName("bg_jpg");
        // this.addChild(sky);
        // sky.width = stageW;
        // sky.height = stageH;

        // let topMask = new egret.Shape();
        // topMask.graphics.beginFill(0x000000, 0.5);
        // topMask.graphics.drawRect(0, 0, stageW, 172);
        // topMask.graphics.endFill();
        // topMask.y = 33;
        // this.addChild(topMask);

        // let icon = this.createBitmapByName("egret_icon_png");
        // this.addChild(icon);
        // icon.x = 26;
        // icon.y = 33;

        // let line = new egret.Shape();
        // line.graphics.lineStyle(2, 0xffffff);
        // line.graphics.moveTo(0, 0);
        // line.graphics.lineTo(0, 117);
        // line.graphics.endFill();
        // line.x = 172;
        // line.y = 61;
        // this.addChild(line);

        // let colorLabel = new egret.TextField();
        // colorLabel.textColor = 0xffffff;
        // colorLabel.width = stageW - 172;
        // colorLabel.textAlign = "center";
        // colorLabel.text = "Hello Egret";
        // colorLabel.size = 24;
        // colorLabel.x = 172;
        // colorLabel.y = 80;
        // this.addChild(colorLabel);

        // let textfield = new egret.TextField();
        // this.addChild(textfield);
        // textfield.alpha = 0;
        // textfield.width = stageW - 172;
        // textfield.textAlign = egret.HorizontalAlign.CENTER;
        // textfield.size = 24;
        // textfield.textColor = 0xffffff;
        // textfield.x = 172;
        // textfield.y = 135;
        // this.textfield = textfield;
    }
}