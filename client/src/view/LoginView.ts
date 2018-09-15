// 登录界面
class LoginView extends egret.DisplayObjectContainer {
    public player:Player;

    title:egret.Bitmap;
    btnContinue:TextButtonWithBg;
    btnNewPlay:TextButtonWithBg;
    btnOpenRank:TextButtonWithBg;
    btnAchievement:TextButtonWithBg;
    ani:dragonBones.Armature;

    public constructor(w:number, h:number) {
        super();

        this.name = "login";
        this.width = w;
        this.height = h;

        var bg = ViewUtils.createBitmapByName("lgbg_png");
        this.addChild(bg);
        ViewUtils.asFullBg(bg);

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

        this.btnContinue.onClicked = () => this.close("continuePlay");
        this.btnNewPlay.onClicked = () => this.close("newPlay"); 
        this.btnOpenRank.onClicked = () => this.close("openRank");

        var objs = [this.title, this.btnContinue, this.btnNewPlay, this.btnOpenRank, this.btnAchievement];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    close(type) {
        this.ani.animation.stop("idle");
        this.onClose(type);
    }

    public onClose;
    public open() {
        this.ani.animation.play("idle", 1000);
        this.btnContinue.enabled = !!this.player;
        this.btnAchievement.enabled = false; // 暂时不可用        
    }
}
