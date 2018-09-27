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
        var lvCfg = ResMgr.getRes("levelconfig_json");
        GCfg.mapsize = lvCfg.mapsize;
        GCfg.getLevelCfg = (lv:string) => {
            if(lvCfg[lv])
                return lvCfg[lv];
            else{
                var index = lv.indexOf("_");
                var level = lv.substring(index + 1, lv.length);
                var tarlv = "normal_" + level;
                Utils.assert(lvCfg[tarlv], "can not find lvCfg of " + lv);

                Utils.log("didn't find lvCfg of " + lv + ", turn to normal_" + level);
                return lvCfg[tarlv];
            }
        }
        var elemPosCfg = ResMgr.getRes("elemPosConfig_json");
        GCfg.getElemPosCfg = (cfg) => elemPosCfg[cfg];
        
        var levelLogics = ResMgr.getRes("levelLogicConfig_json");
        GCfg.getLevelLogicCfg = (btType) => {
            Utils.assert(levelLogics[btType], "can not find llCfg of " + btType);
            return levelLogics[btType];
        };

        var elemAttrsOfLevel = ResMgr.getRes("elemAttrsOfLevel_json");
        GCfg.getElemAttrsOfLevel = (elemType:string, lv:number) => {
            var index = elemAttrsOfLevel["index"][elemType] * 1000 + lv;
            return elemAttrsOfLevel["attrs"][index];
        }

        // 元素默认配置
        var elemAttrsCfg = ResMgr.getRes("elemattrsconfig_json");
        GCfg.getElemAttrsCfg = (e) => {
            Utils.assert(elemAttrsCfg[e], "can not find elem attrs: " + e);
            return elemAttrsCfg[e];
        };

        var elemDescCfg = ResMgr.getRes("elemdesc_json");
        GCfg.getElemDescCfg = () => elemDescCfg;

        // 角色相关
        var playerCfg = ResMgr.getRes("playerconfig_json");
        GCfg.playerCfg = playerCfg;

        // 职业相关
        var occupationCfg = ResMgr.getRes("occupationconfig_json");
        GCfg.getOccupationCfg = (occupation:string) => {
            Utils.assert(occupationCfg[occupation], "can not find occupationCfg of" + occupation);
            return occupationCfg[occupation];
        };

        // 随机掉落组
        var randomDropGroupCfg = ResMgr.getRes("randomdropconfig_json");
        GCfg.getRandomDropGroupCfg = (e) => {
            Utils.assert(randomDropGroupCfg[e], "can not find randomdropground: " + e);
            return randomDropGroupCfg[e];
        };

        // 世界地图
        var worldmapCfg = ResMgr.getRes("worldmap_json");
        GCfg.worldMapConnectionCfg = worldmapCfg.connections;
        GCfg.getWorldMapCfg = (world) => {
            Utils.assert(worldmapCfg[world], "can not find worldmap: " + world);
            return worldmapCfg[world];
        }

        // 商店
        var shopCfg = ResMgr.getRes("shopconfig_json");
        GCfg.getShopCfg = (shop) => {
            Utils.assert(shopCfg[shop], "can not find shop: " + shop);
            return shopCfg[shop];
        };

        // 抢劫
        var robCfg = ResMgr.getRes("robconfig_json");
        GCfg.getRobCfg = (rob) => {
            Utils.assert(robCfg[rob], "can not find rob: " + rob);
            return robCfg[rob];
        };

        // 世界地图事件
        var worldmapeventselsCfg = ResMgr.getRes("worldmapeventsels_json");
        GCfg.getWorldMapEventSelsDesc = (f) => {
            Utils.assert(worldmapeventselsCfg.desc[f], "can not find worldmap event sels desc: " + f);
            return worldmapeventselsCfg.desc[f];
        };
        GCfg.getWorldMapEventSelGroupsCfg = (g) => {
            Utils.assert(worldmapeventselsCfg.groups[g], "can not find worldmap event sels group: " + g);
            return worldmapeventselsCfg.groups[g];
        };

        // 多语言
        var multiLangCfg = ResMgr.getRes("multilanguage_json");
        GCfg.getMultiLanguageCfg = () => multiLangCfg;
    }

    // 加载指定资源组
    ldv = new LoadingUI(); // loading 界面    
    async loadResGroups(gs) {
        this.addChild(this.ldv);
        ViewUtils.asFullBg(this.ldv);
        await this.ldv.loadResGroups(gs);
        this.ldv.setProgress(1);
        this.ldv.parent.removeChild(this.ldv);
    }

    private mv:MainView;
    private async runGame() {
        this.calcArea(); // 计算屏幕适配

        await RES.loadConfig("resource/default.res.json", "resource/"); // 加载资源配置
        this.ldv = new LoadingUI(); // 准备加载界面
        await this.loadResGroups("loading"); // 加载加载界面资源
        this.ldv.refresh();

        await this.loadResGroups("preload"); // 加载初始资源
        Utils.log("preload finished");
        this.globalInit(); // 初始化全局配置
        Utils.log("global initialize finished");
        this.mv = this.createMainView(); // 创建主场景

        // 排行榜服务器通信用
        if (platform instanceof DebugPlatform)
            (<DebugPlatform>platform).wc = new WebClient("http://127.0.0.1:81");

        // 载入用户数据
        var savedData = Utils.loadPlayer();
        var p:Player = savedData.player;
        await this.mv.openStartup(p);
    }

    // 计算安全区域和主显示区域
    calcArea() {
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;        

        // 先计算 fullArea 把刘海空出来，比例是固定 2:1，也是所有全屏背景图的制作比例
        let fullArea = new egret.DisplayObjectContainer();
        this.addChild(fullArea);
        let ar = stageH / stageW;
        if (ar > 2) { // 支持最长屏幕比例，靠下对其，顶上留空
            fullArea.width = stageW;
            fullArea.height = stageW * 2;
            fullArea.x = 0;
            fullArea.y = stageH - fullArea.height;
        } else if (ar < 1.5) { // 支持最宽屏幕，左右留空
            fullArea.height = stageH;
            fullArea.width = stageH / 2;
            fullArea.x = (stageH - fullArea.width) / 2;
            fullArea.y = 0;
        }
        else {
            fullArea.width = stageW;
            fullArea.height = stageH;
            fullArea.x = 0;
            fullArea.y = 0;
        }

        // 计算主区域
        let mainArea = new egret.DisplayObjectContainer();
        mainArea.height = 1136;
        mainArea.width = 640;
        fullArea.addChild(mainArea);
        let standardAspectRatio = 1136/640; // 标准纵横比
        let r = fullArea.height / fullArea.width;
        if (r > standardAspectRatio) { // 长屏
            var scale = fullArea.width / mainArea.width;
            mainArea.scaleX = scale;
            mainArea.scaleY = scale;
            mainArea.x = 0;
            mainArea.y = (fullArea.height - fullArea.width * standardAspectRatio) / 2;
        } else { // 宽屏
            var scale = fullArea.height / mainArea.height;
            mainArea.scaleX = scale;
            mainArea.scaleY = scale;
            mainArea.x = (fullArea.width - mainArea.height / standardAspectRatio) / 2;
            mainArea.y = 0;            
        }

        ViewUtils.FullArea = fullArea;
        ViewUtils.MainArea = mainArea;
    }

    // 创建游戏场景主视图
    private createMainView():MainView {
        // 主视图
        var mainArea = ViewUtils.MainArea;
        let mv = new MainView(mainArea.width, mainArea.height);
        mv.x = 0;
        mv.y = 0;
        mainArea.addChild(mv);
        mainArea.addChild(mv.tcv); // 提示层在动画层之下，其它所有 MainView 层的上面
        mainArea.addChild(mv.gv); // 指引层
        mainArea.addChild(mv.av); // 动画层在所有 MainView 层的上面

        // 测试试图
        // var tv = new AniTestView(mainArea.width, mainArea.height);
        // tv.anchorOffsetX = 0;
        // tv.anchorOffsetY = 0;
        // tv.x = 0;
        // tv.y = 0;
        // this.addChild(tv);

        return mv;
    }
}
