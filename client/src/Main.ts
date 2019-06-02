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
            egret.log(e);
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
        GCfg.getLevelCfg = (lv: string) => {
            if (lvCfg[lv])
                return lvCfg[lv];
            else {
                var index = lv.indexOf("_");
                var type = lv.substring(0, index);
                var level = lv.substring(index + 1, lv.length);
                for (var i = Number(level) - 1; i > 0; i--) {
                    var tarlv = type + "_" + i;
                    if (lvCfg[tarlv]) {
                        Utils.log("didn't find lvCfg of " + lv + ", turn to " + tarlv);
                        return lvCfg[tarlv];
                    }
                }

                var tarlv = "normal_" + level;
                Utils.assert(lvCfg[tarlv], "didn't find normal lvCfg of " + tarlv);

                Utils.log("didn't find lvCfg of " + lv + ", turn to " + tarlv);
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
        GCfg.getElemAttrsOfLevel = (elemType: string, lv: number) => {
            var index = elemAttrsOfLevel["index"][elemType] * 1000 + lv;
            if (!!elemAttrsOfLevel["attrs"][index])
                return elemAttrsOfLevel["attrs"][index];
            else
                for (var i = 1; i < lv; i++)
                    if (!!elemAttrsOfLevel["attrs"][index - i])
                        return elemAttrsOfLevel["attrs"][index - i];

            Utils.assert(true, "can not find any attrs cfg for " + elemType + " at level " + lv);
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
            if (!!worldmapCfg[world])
                return worldmapCfg[world];
            else {
                var worldIndex = Number(world.substring(5, world.length));
                for (var i = worldIndex; i >= 0; i--) {
                    var tWorld = "world" + i;
                    if (!!worldmapCfg[tWorld]){
                        var cfg = Utils.clone(GCfg.getWorldMapCfg(tWorld));
                        cfg["name"] = world;
                        cfg["worldNum"] = worldIndex;
                        return cfg;
                    }
                }
            }
            Utils.assert(true, "can not find replace world cfg for " + world);
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
            // Utils.assert(worldmapeventselsCfg.groups[g], "can not find worldmap event sels group: " + g);
            return worldmapeventselsCfg.groups[g];
        };

        // 多语言
        var multiLangCfg = ResMgr.getRes("multilanguage_json");
        GCfg.getMultiLanguageCfg = () => multiLangCfg;

        // misc内配置
        var misc = ResMgr.getRes("misc_json");
        GCfg.getBattleViewElemTipTypes = () => misc["battleViewElemTipTypes"];
        GCfg.getBattleTypes = (type:string) => misc[type + "Types"];
        GCfg.getMiscConfig = (type:string) => {
            Utils.assert(misc[type], "config " + type + " do not exist.")
            return misc[type];
        };

        // 随机名字
        GCfg.getRandomNameCfg = () => ResMgr.getRes("randomName_json");

        // 不合规名字配置
        GCfg.getInvalidNameCfg = () => ResMgr.getRes("invalidName_json");

        // 成就配置
        GCfg.getAchvCfg = () => ResMgr.getRes("achvCfg_json");
        GCfg.getAchvAwardCfg = () => ResMgr.getRes("achvAwardCfg_json");
        GCfg.getAchvDescCfg = (achvType) => ResMgr.getRes("achvDesc_json")[achvType];

        // 难度配置
        GCfg.getDifficultyCfg = () => ResMgr.getRes("difficulty_json");

        // 职业解锁描述
        GCfg.getOccUnlockDesc = (occ:string) => ResMgr.getRes("occUnlockDesc_json")[occ];

        AchievementMgr.mgr = AchievementMgr.createAchvMgr();
    }

    // 加载指定资源组
    ldv:LoadingUI; // loading 界面
    async loadResGroups(gs) {
        this.addChild(this.ldv);
        this.ldv.scaleX = ViewUtils.stageSize.w / this.ldv.width;
        this.ldv.scaleY = ViewUtils.stageSize.h / this.ldv.height;
        if (this.ldv.scaleX < this.ldv.scaleY)
            this.ldv.scaleY = this.ldv.scaleX;
        else
            this.ldv.scaleX = this.ldv.scaleY;

        this.ldv.x = (ViewUtils.stageSize.w - this.ldv.width * this.ldv.scaleX) / 2;
        this.ldv.y = (ViewUtils.stageSize.h - this.ldv.height * this.ldv.scaleY) / 2;
        await this.ldv.loadResGroups(gs);
        this.ldv.setProgress(1);
        this.removeChild(this.ldv);
    }

    private mv:MainView;
    private async runGame() {
        egret.Logger.logLevel = egret.Logger.ALL;
        this.stage.orientation = egret.OrientationMode.PORTRAIT;

        await Utils.initPlatform();

        var launchTime = Utils.nowTimeStr();
        var launchDate = launchTime.substr(0, 10);

        Utils.st("LaunchDate", launchDate);
        Utils.log("platform: " + window.platform.platformType + " initialized");

        // 心跳统计在线时长
        egret.setInterval(() => {
            Utils.st("Heartbeat", launchDate);
        }, this, 60000);

        this.calcArea(); // 计算屏幕适配

        await RES.loadConfig("resource/default.res.json", "resource/"); // 加载资源配置
        await RES.loadGroup("loading");
        
        this.ldv = new LoadingUI();
        await this.loadResGroups("preload"); // 加载初始资源
        Utils.log("preload finished");
        // Utils.st("ResourceLoaded", launchDate);
        this.globalInit(); // 初始化全局配置
        Utils.log("global initialize finished");
        this.mv = this.createMainView(); // 创建主场景        
        AchievementMgr.mgr.mv = this.mv;

        Utils.log(DEBUG ? "DEBUG version" : "RELEASE version");

        // 载入用户数据
        var savedData = Utils.loadPlayer();
        var p:Player = savedData.player;
        this.mv.openStartup(p);
    }

    // 计算安全区域和主显示区域
    calcArea() {
        var canvas = window["canvas"];
        if (canvas) {
            var sw = canvas.width;
            var sh = canvas.height;
            this.stage.setContentSize(sw, sh);
        }
        
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;
        ViewUtils.stageSize = {w:stageW, h:stageH};

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
            fullArea.x = (stageW - fullArea.width) / 2;
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
