// 登录界面
class LoginView extends egret.DisplayObjectContainer {
    public player:Player;
    public acFact:AudioFactory;
    public confirmOkYesNo;
    public openAchvView;

    bg:egret.Bitmap;
    title:egret.Bitmap;
    btnContinue:TextButtonWithBg;
    btnNewPlay:TextButtonWithBg;
    btnOpenRank:TextButtonWithBg;
    btnAchievement:TextButtonWithBg;
    btnLang:egret.Bitmap;
    langMenuItems:egret.DisplayObject[];
    ani:dragonBones.Armature;

    public constructor(w:number, h:number) {
        super();

        this.name = "login";
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("lgbg_png");
        this.addChild(this.bg);

        // 背景动画
        this.ani = ViewUtils.createSkeletonAni("denglu");
        var d = this.ani.display;
        this.addChild(d);
        d.x = this.width / 2;
        d.y = this.height / 2;

        // 标题(CNS/CNT 用原图"魔塔扫雷";其它语言换用对应的本地化木牌图)
        this.title = ViewUtils.createBitmapByName("lgTitle_png");
        this.title.name = "title";
        this.addChild(this.title);
        ViewUtils.localizeImage(this.title, "resource/assets/ui/login/", "lgTitle.png");

        // 继续游戏按钮
        this.btnContinue = new TextButtonWithBg("ContinueNormal_png", 0);
        this.btnContinue.name = "continueBtn";
        this.btnContinue.setDisableBg("ContinueDisabled_png");
        this.btnContinue.setDownBg("ContinueDown_png");

        // 开始新游戏按钮
        this.btnNewPlay = new TextButtonWithBg("NewGameNormal_png", 0);
        this.btnNewPlay.name = "newPlayBtn";
        this.btnNewPlay.setDownBg("NewGameDown_png");

        // 排行榜按钮
        this.btnOpenRank = new TextButtonWithBg("HerosNormal_png", 0);
        this.btnOpenRank.name = "rankBtn";
        this.btnOpenRank.setDownBg("HerosDown_png");

        // 成就按钮
        this.btnAchievement = new TextButtonWithBg("AchievementNormal_png", 0);
        this.btnAchievement.name = "achievementBtn";
        this.btnAchievement.setDisableBg("AchievementDisabled_png");
        this.btnAchievement.setDownBg("AchievementDown_png");
        this.btnAchievement.onClicked = () => this.openAchvView();

        this.btnContinue.onClicked = () => this.close("continuePlay");
        this.btnNewPlay.onClicked = () => {
            if (!!this.player) {
                this.confirmOkYesNo(ViewUtils.getTipText("newPlayConfirmTitle"), 
                    ViewUtils.getTipText("newPlayConfirmContent"), true).then((ok) => {
                        if (ok)
                            this.close("newPlay");
                    });
            } else
                this.close("newPlay");
        }
        this.btnOpenRank.onClicked = () => this.close("openRank");

        var btnSound = () => AudioFactory.play("btn1");
        this.btnContinue.onDown.push(btnSound);
        this.btnNewPlay.onDown.push(btnSound);
        this.btnOpenRank.onDown.push(btnSound);

        var objs = [this.title, this.btnContinue, this.btnNewPlay, this.btnOpenRank, this.btnAchievement];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

        // 非英文:用现生成的本地化按钮图替换花体英文图(英文版保留原图)
        if (ViewUtils.getLanguage() !== "EN") {
            ViewUtils.localizeButton(this.btnNewPlay, "NewGame", ViewUtils.getTipText("loginNewGame"));
            ViewUtils.localizeButton(this.btnContinue, "Continue", ViewUtils.getTipText("loginContinue"));
            ViewUtils.localizeButton(this.btnOpenRank, "Heros", ViewUtils.getTipText("loginRank"));
            ViewUtils.localizeButton(this.btnAchievement, "Achievement", ViewUtils.getTipText("loginAchievement"));
        }

        // 排行榜功能未实现:永久置灰 + 禁用点击(enabled=false 会置 touchEnabled=false 并 makeGray)
        this.btnOpenRank.enabled = false;

        // 语言切换："旗杆挂旗"图标(用户美术),贴左侧、在 title 图(y=-30..258)下方。
        this.btnLang = ViewUtils.createFlagImageBitmap(ViewUtils.getLanguage(), 104, (bmp) => {
            bmp.x = 12;
        });
        this.btnLang.name = "langBtn";
        this.btnLang.x = 12;
        this.btnLang.y = 268;
        this.btnLang.touchEnabled = true;
        this.btnLang.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.toggleLangMenu(), this);
        this.addChild(this.btnLang);

        // 仅开发状态:右上角"重置存档"按钮(上架/正式环境永不出现,见 ViewUtils.isDevMode)
        if (ViewUtils.isDevMode())
            this.addDevResetButton();
    }

    // DEV ONLY —— 清空所有存档、恢复到全新装机(新手)状态
    private addDevResetButton() {
        var w = 168, h = 48, m = 12;
        var panel = ViewUtils.createColorBitmap(w, h, "#b32424", 0.9);
        panel.x = this.width - w - m; panel.y = m;
        panel.touchEnabled = true;
        panel.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onDevReset(), this);
        this.addChild(panel);

        var lbl = ViewUtils.createTextField(24, 0xffffff);
        lbl.text = "重置存档 (DEV)";
        lbl.width = w; lbl.height = h;
        lbl.x = panel.x; lbl.y = panel.y;
        lbl.touchEnabled = false;
        this.addChild(lbl);
    }

    private onDevReset() {
        AudioFactory.play("btn1");
        this.confirmOkYesNo("重置所有数据 (DEV)", "确定清空全部存档、恢复到新手(全新装机)状态？此操作不可撤销。", true)
            .then((ok) => {
                if (!ok) return;
                var lang = undefined;
                try { lang = Utils.loadLocalItem("language"); } catch (e) {} // 保留当前语言,重载不跳回默认
                Utils.localStorageData = {};
                if (lang) Utils.localStorageData["language"] = lang;
                window.platform.setUserLocalStorage(Utils.localStorageData);
                try { window.location.reload(); } catch (e) {}
            });
    }

    // 点击国旗 -> 弹出语言列表(在按钮上方展开),点某一项即选定该语言。
    // 各元素直接加到 LoginView(不用中间容器:PIXI v7 对"无 hitArea 的中间容器"
    // 不下钻命中,而 LoginView 的直接子项命中正常,与现有按钮一致)。
    private toggleLangMenu() {
        AudioFactory.play("btn1");
        if (this.langMenuItems) { this.closeLangMenu(); return; }
        var items:egret.DisplayObject[] = [];
        var add = (o:egret.DisplayObject) => { items.push(o); this.addChild(o); };

        var langs = ViewUtils.getValidLanguages();
        var rowH = 60, rowW = 232, pad = 12, flagW = 60, flagH = 40;
        var panelW = rowW + pad * 2;
        var panelH = langs.length * rowH + pad * 2;
        // 旗子在左上角 -> 菜单在其下方、左对齐展开;超出屏幕则向上收
        var panelX = 12;
        var panelY = this.btnLang.y + this.btnLang.height + 8;
        if (panelY + panelH > this.height - 20) panelY = this.height - 20 - panelH;
        if (panelY < 20) panelY = 20;
        if (panelY < 40) panelY = 40;

        // 点击空白处关闭(全屏点击层,无贴图+显式尺寸 => 按矩形命中)
        var scrim = new egret.Bitmap();
        scrim.width = this.width; scrim.height = this.height;
        scrim.x = 0; scrim.y = 0; scrim.touchEnabled = true;
        scrim.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.closeLangMenu(), this);
        add(scrim);

        // 底板
        var panel = ViewUtils.createPanelBitmap(panelW, panelH);
        panel.x = panelX; panel.y = panelY;
        add(panel);

        var cur = ViewUtils.getLanguage();
        langs.forEach((lang, i) => {
            var rx = panelX + pad, ry = panelY + pad + i * rowH;

            if (lang === cur) {
                var hl = ViewUtils.createHighlightBitmap(rowW, rowH - 6);
                hl.x = rx; hl.y = ry + 3;
                add(hl);
            }

            // 整行透明点击区
            var hit = new egret.Bitmap();
            hit.width = rowW; hit.height = rowH; hit.x = rx; hit.y = ry;
            hit.touchEnabled = true;
            hit.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.selectLanguage(lang), this);
            add(hit);

            // 国旗(旗杆挂旗图标,竖版;在 flagW 宽的格子里水平居中、行内垂直居中)
            let frx = rx;
            var flag = ViewUtils.createFlagImageBitmap(lang, rowH - 8, (bmp) => {
                bmp.x = frx + 6 + Math.max(0, (flagW - 12 - bmp.width) / 2);
            });
            flag.x = rx + 6; flag.y = ry + 4;
            flag.touchEnabled = false;
            add(flag);

            // 语言自称
            var name = ViewUtils.createTextField(30, lang === cur ? 0xffd34d : 0xffffff);
            name.fontFamily = ViewUtils.getUIFontFamily(lang); // 用该语言字体,谚文/西里尔不出豆腐块
            name.text = ViewUtils.langNativeName(lang);
            name.width = rowW - (flagW + 24); name.height = rowH;
            name.verticalAlign = egret.VerticalAlign.MIDDLE;
            name.x = rx + flagW + 18; name.y = ry;
            name.touchEnabled = false;
            add(name);
        });

        this.langMenuItems = items;
    }

    private closeLangMenu() {
        if (!this.langMenuItems) return;
        this.langMenuItems.forEach((o) => { if (this.contains(o)) this.removeChild(o); });
        this.langMenuItems = undefined;
    }

    // 选定某个语言:与当前不同则持久化并重载(全量以新语言重建);相同则只关闭
    private selectLanguage(lang:string) {
        if (lang === ViewUtils.getLanguage()) { this.closeLangMenu(); return; }
        AudioFactory.play("btn1");
        ViewUtils.setLanguage(lang);
        try {
            if (typeof window !== "undefined" && window.location && window.location.reload)
                window.location.reload();
        } catch (e) {}
    }

    close(type) {
        this.ani.animation.stop("idle");
        this.onClose(type);
    }

    public onClose;
    public open() {
        ViewUtils.asFullBg(this.bg);
        this.ani.animation.play("idle", 0);
        this.btnContinue.enabled = !!this.player;
        this.btnAchievement.enabled = true;
        this.btnOpenRank.enabled = false; // 排行榜功能未实现:置灰 + 禁用点击
    }
}
