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
        this.globalConfigInit();
    }

    // 全局配置初始化
    private globalConfigInit() {
        // 关卡
        var lvCfg = RES.getRes("levelconfig_json");
        GCfg.mapsize = lvCfg.mapsize;
        GCfg.getLevelCfg = (lv) => {
            Utils.assert(lvCfg[lv], "can not find level: " + lv);
            return lvCfg[lv];
        }

        // 元素默认配置
        var elemAttrsCfg = RES.getRes("elemattrsconfig_json");
        GCfg.getElemAttrsCfg = (e) => {
            Utils.assert(elemAttrsCfg[e], "can not find elem attrs: " + e);
            return elemAttrsCfg[e];
        };

        var elemDescCfg = RES.getRes("elemdesc_json");
        GCfg.getElemDescCfg = () => elemDescCfg;

        // 角色相关
        var playerCfg = RES.getRes("playerconfig_json");
        GCfg.playerCfg = playerCfg;

        // 随机掉落组
        var randomDropGroupCfg = RES.getRes("randomdropconfig_json");
        GCfg.getRandomDropGroupCfg = (e) => {
            Utils.assert(randomDropGroupCfg[e], "can not find randomdropground: " + e);
            return randomDropGroupCfg[e];
        };

        // 世界地图
        var worldmapCfg = RES.getRes("worldmap_json");
        GCfg.worldMapConnectionCfg = worldmapCfg.connections;
        GCfg.getWorldMapCfg = (world) => {
            Utils.assert(worldmapCfg[world], "can not find worldmap: " + world);
            return worldmapCfg[world];
        }

        // 商店
        var shopCfg = RES.getRes("shopconfig_json");
        GCfg.getShopCfg = (shop) => {
            Utils.assert(shopCfg[shop], "can not find shop: " + shop);
            return shopCfg[shop];
        };

        // 世界地图事件
        var worldmapeventselsCfg = RES.getRes("worldmapeventsels_json");
        GCfg.getWorldMapEventSelsDesc = (f) => {
            Utils.assert(worldmapeventselsCfg.desc[f], "can not find worldmap event sels desc: " + f);
            return worldmapeventselsCfg.desc[f];
        };
        GCfg.getWorldMapEventSelGroupsCfg = (g) => {
            Utils.assert(worldmapeventselsCfg.groups[g], "can not find worldmap event sels group: " + g);
            return worldmapeventselsCfg.groups[g];
        };

        // 多语言
        var multiLangCfg = RES.getRes("multilanguage_json");
        GCfg.getMultiLanguageCfg = () => multiLangCfg;
    }

    private mv:MainView;

    private async runGame() {
        // var c = new WSClient();
        // c.connect2srv("localhost", 80)
        // .onError(() => console.log("net error"))
        // .onConnected(() => c.request({"msg":"echo", "content":"hello"}, (r) => console.log("echo: " + r["content"])));

        await this.loadResource() // 加载初始资源
        this.globalInit(); // 全局基础功能初始化

        // 创建场景
        this.createGameScene();

        if (platform instanceof DebugPlatform)
            (<DebugPlatform>platform).wc = new WebClient("http://127.0.0.1:81");

        // 载入用户数据
        var savedData = Utils.loadPlayer();
        var p:Player = savedData.player;
        this.mv.openStartup(p);
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
        this.mv = new MainView(stageW, stageH);
        this.mv.anchorOffsetX = 0;
        this.mv.anchorOffsetY = 0;
        this.mv.x = 0;
        this.mv.y = 0;
        this.addChild(this.mv);
        this.addChild(this.mv.av); // 动画层在所有 MainView 层的上面

        // 测试试图
        // var tv = new AniTestView(stageW, stageH);
        // tv.anchorOffsetX = 0;
        // tv.anchorOffsetY = 0;
        // tv.x = 0;
        // tv.y = 0;
        // this.addChild(tv);
    }
}
