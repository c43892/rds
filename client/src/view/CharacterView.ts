// 战斗中用于显示角色详情
class CharacterView extends egret.DisplayObjectContainer {
    public player:Player;
    private bg:egret.Bitmap; // 压灰部分
    private attrsBg:egret.Bitmap; // 属性背景
    private exitBtn:TextButtonWithBg; // 退出本局按钮
    private avatar:egret.Bitmap; // 职业头像
    private avatarBg:egret.Bitmap; // 头像框
    private occupationName:egret.TextField; // 职业名
    private level:egret.TextField; // 当前角色等级
    private exp:egret.TextField; // 经验值
    private expBar:egret.Bitmap; // 经验条
    private expBarMask:egret.Bitmap;  // 经验条遮罩
    private power:egret.TextField; // 攻击
    private hp:egret.TextField; // 血量
    private dodge:egret.TextField; // 闪避
    private coins:egret.TextField; // 金币
    private currentStorey:egret.TextField; // 当前游戏所在层数
    private commonRelicsBg:egret.Bitmap; // 通用技能背景
    private commonRelicsArea:egret.DisplayObjectContainer; // 通用技能区域
    private switchBtnBg:egret.Bitmap; // 开关背景
    private initAniSwitchBtn:TextButtonWithBg; // 创建关卡时的动画开关
    private coinAniSwitchBtn:TextButtonWithBg; // 金币获取动画开关
    private volumeSwitchBtn:TextButtonWithBg; // 游戏音乐开关
    private goBackBtn:ArrowButton; // 返回按钮

    public onPlayerDead;
    public confirmOkYesNo;

    constructor(w, h){
        super();

        this.name = "characterView";
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;

        this.attrsBg = ViewUtils.createBitmapByName("attrsBg_png");
        this.attrsBg.name = "attrsBg";
        
        this.commonRelicsBg = ViewUtils.createBitmapByName("commonRelicsBg_png");
        this.commonRelicsBg.name = "commonRelicsBg";

        this.switchBtnBg = ViewUtils.createBitmapByName("switchBtnBg_png");
        this.switchBtnBg.name = "switchBtnBg";

        this.avatar = new egret.Bitmap();
        this.avatar.name = "avatar";

        this.avatarBg = ViewUtils.createBitmapByName("occAvatarFrame_png");
        this.avatarBg.name = "avatarBg";

        this.occupationName = new egret.TextField();
        this.occupationName.name = "occupationName";

        this.exitBtn = new TextButtonWithBg("stExit_png");
        this.exitBtn.name = "exitBtn";
        this.exitBtn.onClicked = () => this.exitThisGame();
        
        this.expBar = ViewUtils.createBitmapByName("characterExpBar_png");
        this.expBar.name = "expBar";

        this.expBarMask = ViewUtils.createBitmapByName("translucent_png");
        this.expBarMask.name = "expBarMask";
        this.expBar.mask = this.expBarMask;

        this.level = new egret.TextField();
        this.level.name = "level";

        this.exp = new egret.TextField();
        this.exp.name = "exp";

        this.power = new egret.TextField();
        this.power.name = "power";

        this.hp = new egret.TextField();
        this.hp.name = "hp";

        this.dodge = new egret.TextField();
        this.dodge.name = "dogde";

        this.coins = new egret.TextField();
        this.coins.name = "coins";

        this.currentStorey = new egret.TextField();
        this.currentStorey.name = "currentStorey";

        this.goBackBtn = new ArrowButton(false, "goBack_png", 30);
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.onClicked = () => this.goBack();
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");

        var objs = [
            this.bg, this.attrsBg, this.switchBtnBg, this.commonRelicsBg, this.avatar, this.avatarBg, this.occupationName, this.expBar, this.level, this.exp,
            this.power, this.hp, this.dodge, this.coins, this.currentStorey, this.expBarMask, this.goBackBtn, this.exitBtn
        ];
        ViewUtils.multiLang(this, ...objs);

        objs.forEach((obj, _) => this.addChild(obj));

        // 文字类显示内容格式设定
        var textObjs = [this.level, this.exp, this.power, this.hp, this.dodge, this.coins, this.currentStorey, this.occupationName];
        textObjs.forEach((textObj, _) => {
            textObj.anchorOffsetX = textObj.width / 2;
            textObj.anchorOffsetY = textObj.height / 2;
            textObj.textAlign = egret.HorizontalAlign.CENTER;
        })
    }

    public async open() {
        this.refresh();
        return new Promise((resolve, reject) => this.doClose = resolve);
    }

    refresh(){
        this.refreshExpBar();
        this.refreshAttrs();
        this.refreshAvatar();
    }

    // 刷新头像和职业名称
    refreshAvatar(){
        var occupation = this.player.occupation;
        ViewUtils.setTexName(this.avatar, occupation + "_png");

        var mlCfg = ViewUtils.languageCfg;
        var curCfg = mlCfg.occupations;
        var name = curCfg[occupation]["name"][mlCfg.currentLanguage];
        this.occupationName.text = name;
    }

    // 刷新经验条,等级和经验值
    refreshExpBar(){
        this.expBarMask.x = this.expBar.x;
        this.expBarMask.y = this.expBar.y;
        this.expBarMask.width = this.expBar.width * this.player.lvUpProgress();
        this.expBarMask.height = this.expBar.height;

        this.level.text = (this.player.lv + 1).toString();

        var exp2Lv = GCfg.playerCfg.exp2Lv;
        var expTextLast = exp2Lv[this.player.lv] ? exp2Lv[this.player.lv] : exp2Lv[exp2Lv.length];
        this.exp.text = this.player.exp.toString() + " / " + expTextLast;
    }

    // 刷新角色属性
    refreshAttrs(){
        var attackerAttrs = this.player.bt().calcPlayerAttackerAttrs();
        var power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
        this.power.text = power.toString();

        this.hp.text = this.player.hp.toString();

        var targetAttrs = this.player.bt().calcPlayerTargetAttrs();
        var dodge = targetAttrs.dodge.b * (1 + targetAttrs.dodge.a) + targetAttrs.dodge.c;
        this.dodge.text = this.player.dodge + "%";

        this.coins.text = this.player.money.toString();

        this.currentStorey.text = this.player.currentTotalStorey().toString();
    }

    doClose;

    goBack(r = undefined){
        this.doClose(undefined);
    }

    // 退出本局
    async exitThisGame(){
        var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureExitThisGame"));
        var ok = await this.confirmOkYesNo(undefined, content, true);
        if (ok)
            this.goBack("giveUpGame");
        
    }
}