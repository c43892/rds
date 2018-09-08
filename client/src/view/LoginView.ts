// 登录界面
class LoginView extends egret.DisplayObjectContainer {
    public player:Player;

    bg:egret.Bitmap;
    btnContinue:TextButtonWithBg;
    btnNewPlay:TextButtonWithBg;
    btnOpenRank:TextButtonWithBg;
    btnAchievement:TextButtonWithBg;

    public constructor(w:number, h:number) {
        super();

        this.name = "login";
        this.width = w;
        this.height = h;

        // 背景
        this.bg = ViewUtils.createBitmapByName("lgbg_png");
        this.bg.touchEnabled = true;
        this.addChild(this.bg);
        ViewUtils.asFullBg(this.bg);

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

        this.btnContinue.onClicked = () => this.onClose("continuePlay");
        this.btnNewPlay.onClicked = () => this.onClose("newPlay"); 
        this.btnOpenRank.onClicked = () => this.onClose("openRank");

        var objs = [this.btnContinue, this.btnNewPlay, this.btnOpenRank, this.btnAchievement];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

        // var ani = ViewUtils.createSkeletonAni("genggui_shenti");
        // var disp:egret.DisplayObject = ani.getDisplay();
        // disp.x = this.width / 2;
        // disp.y = this.height / 2;
        // this.addChild(disp);
        // ani.animation.play("start", 0);
        // dragonBones.WorldClock.clock.add(ani);
        
        // egret.Ticker.getInstance().register((frameTime:number) => {
        //     dragonBones.WorldClock.clock.advanceTime(frameTime/1000);
        // }, this);

        // var psw = ViewUtils.createParticleSystemWrapper("newParticle");        
        // this.addChild(psw);
        // this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, async (evt:egret.TouchEvent) => {
        //     psw.start();
        //     await AniUtils.createExpTrack(psw, {x:evt.stageX, y:evt.stageY}, {x:this.width/2, y:this.height/2}, 1000);
        //     psw.stop(); 
        // }, this);
    }

    public onClose;
    public refresh() {
        this.btnContinue.enabled = !!this.player;
        this.btnAchievement.enabled = false; // 暂时不可用        
    }
}
