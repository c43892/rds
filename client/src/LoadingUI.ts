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

class LoadingUI extends egret.DisplayObjectContainer implements RES.PromiseTaskReporter {

    // 进度条左起坐标和全宽
    sx = 72;
    sy = 1039;
    fw = 615;

    // 设计满尺寸
    w = 758;
    h = 1280;

    // 刷新界面显示
    bg:egret.Bitmap;
    loadingBar:egret.Bitmap;
    ghost:egret.Bitmap;
    warning:egret.TextField;

    createBitmapByName(name):egret.Bitmap {
        var bmp = new egret.Bitmap();
        var tex = RES.getRes(name);
        ViewUtils.setTex(bmp, tex, true);
        return bmp;
    }

    public constructor() {
        super();
        this.width = this.w;
        this.height = this.h;

        // 背景
        this.bg = this.createBitmapByName("LoadingBg_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.addChild(this.bg);

        // 进度条
        this.loadingBar = this.createBitmapByName("LoadingBar_png");
        this.loadingBar.x = this.sx;
        this.loadingBar.y = this.sy;
        this.loadingBar.width = 0;
        this.addChild(this.loadingBar);

        // 进度条上的幽灵
        this.ghost = this.createBitmapByName("LoadingGhost_png");
        this.ghost.anchorOffsetX = this.ghost.width / 2;
        this.ghost.anchorOffsetY = this.ghost.height / 2;
        this.ghost.x = this.sx;
        this.ghost.y = this.sy;
        this.addChild(this.ghost);

        // 八字箴言(健康游戏忠告)。LoadingUI 在多语言配置加载之前就构造,
        // 不能用 getTipText;改为按"已保存语言/浏览器 locale"自包含选择文案。
        this.warning = ViewUtils.createTextField(20, 0x765721);
        this.warning.text = this.localizedWarning();
        this.warning.x = (this.width - this.warning.measuredWidth) / 2;
        this.warning.y = this.height - this.warning.measuredHeight - 50;
        this.addChild(this.warning);
    }

    // 自包含的语言检测(此刻 multilanguage 配置尚未加载):优先已保存偏好,
    // 否则按浏览器 locale 经 ViewUtils.localeMap(静态表,无需配置)映射,默认 CNS。
    private localizedWarning():string {
        var lang = "CNS";
        try {
            var saved = Utils.loadLocalItem("language");
            if (saved) lang = saved;
            else {
                var nav:any = (typeof navigator !== "undefined") ? navigator : null;
                var locales = nav ? (nav.languages && nav.languages.length ? nav.languages : [nav.language || ""]) : [];
                for (var loc of locales) {
                    var l = (loc || "").toLowerCase();
                    var m = ViewUtils.localeMap[l] || ViewUtils.localeMap[l.split("-")[0]];
                    if (m) { lang = m; break; }
                }
            }
        } catch (e) {}

        var W = {
            CNS: "抵制不良游戏, 拒绝盗版游戏。 注意自我保护, 谨防受骗上当。\r适度游戏益脑, 沉迷游戏伤身。 合理安排时间, 享受健康生活。",
            CNT: "抵制不良遊戲，拒絕盜版遊戲。注意自我保護，謹防受騙上當。\r適度遊戲益腦，沉迷遊戲傷身。合理安排時間，享受健康生活。",
            EN: "Reject harmful games, refuse pirated games. Protect yourself, beware of fraud.\rGaming in moderation sharpens the mind; addiction harms the body. Manage your time, enjoy a healthy life.",
            JA: "不良ゲームに抵抗し、海賊版を拒否しよう。自己防衛に気をつけ、詐欺に注意しよう。\r適度なゲームは脳に良く、のめり込みは体に悪い。時間を上手に管理し、健康な生活を楽しもう。",
            KO: "불량 게임에 저항하고 불법 복제 게임을 거부하세요. 자신을 보호하고 사기를 조심하세요.\r적당한 게임은 두뇌에 좋지만 중독은 몸을 해칩니다. 시간을 잘 관리하고 건강한 생활을 즐기세요.",
            FR: "Rejette les mauvais jeux, refuse le piratage. Protège-toi, méfie-toi des arnaques.\rJouer avec modération aiguise l'esprit ; l'excès nuit au corps. Gère ton temps, profite d'une vie saine.",
            DE: "Lehne schädliche Spiele ab, verweigere Raubkopien. Schütze dich, hüte dich vor Betrug.\rMaßvolles Spielen schärft den Geist; Sucht schadet dem Körper. Teile deine Zeit ein, genieße ein gesundes Leben.",
            ES: "Rechaza los juegos dañinos y la piratería. Protégete y cuídate de los fraudes.\rJugar con moderación agudiza la mente; el exceso daña el cuerpo. Organiza tu tiempo y disfruta de una vida sana.",
            RU: "Откажитесь от вредных и пиратских игр. Берегите себя и остерегайтесь мошенничества.\rУмеренная игра развивает ум, а зависимость вредит здоровью. Распределяйте время и наслаждайтесь здоровой жизнью."
        };
        return W[lang] || W["EN"] || W["CNS"];
    }

    onProgress(current: number, total: number): void {
        Utils.log("loading " + current + ":" + total);
        this.setProgress(current / total);
    }

    // 加载指定资源组
    public async loadResGroups(gs) {
        await ResMgr.loadResGroup(gs, this);
    }

    // 手动设置为 100% 
    public setProgress(p) {
        let w = this.fw * p;
        if (this.loadingBar) {
            this.loadingBar.width = w;
            this.ghost.x = this.loadingBar.x + this.loadingBar.width;
        }
    }
}
