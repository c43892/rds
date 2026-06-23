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

        // 标题
        this.title = ViewUtils.createBitmapByName("lgTitle_png");
        this.title.name = "title";
        this.addChild(this.title);

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

        // 语言切换：右上角国旗 chip(矢量 SVG)。点击循环 validLanguages，持久化后重载，
        // 让所有界面以新语言从头重建（登录界面无进行中对局，安全）。
        this.btnLang = ViewUtils.createFlagBitmap(ViewUtils.getLanguage(), 1.5); // 放大 50%
        this.btnLang.name = "langBtn";
        this.btnLang.x = 18;                  // 左侧，与第三排按钮(y=1000)同高
        this.btnLang.y = 1000;
        this.btnLang.touchEnabled = true;
        this.btnLang.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSwitchLanguage(), this);
        this.addChild(this.btnLang);
    }

    private onSwitchLanguage() {
        AudioFactory.play("btn1");
        var next = ViewUtils.nextLanguage();
        ViewUtils.setLanguage(next);
        // 重载使所有已构建的界面以新语言重建（语言只在启动时读取并铺到各界面）
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
        this.btnAchievement.enabled = true; // 暂时不可用
        this.btnOpenRank.enabled = true;
    }
}
