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
    private currentDiffFlag:egret.Bitmap; // 当前难度图标
    private currentDiffTitle:egret.TextField; // 难度
    private commonRelicsBg:egret.Bitmap; // 通用技能背景
    private commonRelicsArea:egret.DisplayObjectContainer; // 通用技能区域
    private commonRelics:egret.DisplayObjectContainer[]; // 通用技能
    private switchesArea:egret.DisplayObjectContainer; // 开关区域
    private switchBtnBg:egret.Bitmap; // 开关背景
    private initAddElemAniAniSwitchBtn:TextButtonWithBg; // 创建关卡时的动画开关
    private coinAniSwitchBtn:TextButtonWithBg; // 金币获取动画开关
    private volumeSwitchBtn:TextButtonWithBg; // 游戏音乐开关
    private forbidIcons:egret.DisplayObjectContainer; // 禁止标志
    private goBackBtn:ArrowButton; // 返回按钮

    public onPlayerDead;
    public confirmOkYesNo;
    public showElemDesc;
    
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
        
        this.commonRelicsArea = new egret.DisplayObjectContainer();
        this.commonRelicsArea.name = "commonRelicsArea";

        this.commonRelicsBg = ViewUtils.createBitmapByName("commonRelicsBg_png");
        this.commonRelicsBg.name = "commonRelicsBg";
        this.commonRelicsArea.addChild(this.commonRelicsBg);

        this.switchesArea = new egret.DisplayObjectContainer();
        this.switchesArea.name = "switchesArea";

        this.switchBtnBg = ViewUtils.createBitmapByName("switchBtnBg_png");
        this.switchBtnBg.name = "switchBtnBg";
        ViewUtils.multiLang(this, this.switchBtnBg);
        this.switchesArea.addChild(this.switchBtnBg);

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

        this.currentDiffFlag = new egret.Bitmap();
        this.currentDiffFlag.name = "currentDiffFlag";
        this.currentDiffTitle = ViewUtils.createTextField(25, 0x000000);
        this.currentDiffTitle.name = "currentDiffTitle";
        this.currentDiffTitle.text = ViewUtils.getTipText("difficulty");

        this.volumeSwitchBtn = new TextButtonWithBg("volumeSwitchBtn_png");
        this.volumeSwitchBtn.name = "volumeSwitchBtn";
        this.volumeSwitchBtn["switchType"] = "volume";
        this.volumeSwitchBtn.onClicked = () => this.onSwitch(this.volumeSwitchBtn);
        ViewUtils.multiLang(this, this.volumeSwitchBtn);
        this.switchesArea.addChild(this.volumeSwitchBtn);
        
        this.initAddElemAniAniSwitchBtn = new TextButtonWithBg("initAddElemAniAniSwitchBtn_png");
        this.initAddElemAniAniSwitchBtn.name = "initAddElemAniAniSwitchBtn";
        this.initAddElemAniAniSwitchBtn["switchType"] = "initAddElemAni";
        this.initAddElemAniAniSwitchBtn.onClicked = () => this.onSwitch(this.initAddElemAniAniSwitchBtn);
        ViewUtils.multiLang(this, this.initAddElemAniAniSwitchBtn);
        this.switchesArea.addChild(this.initAddElemAniAniSwitchBtn);

        this.coinAniSwitchBtn = new TextButtonWithBg("coinAniSwitchBtn_png");
        this.coinAniSwitchBtn.name = "coinAniSwitchBtn";
        this.coinAniSwitchBtn["switchType"] = "coinAni";
        this.coinAniSwitchBtn.onClicked = () => this.onSwitch(this.coinAniSwitchBtn);
        ViewUtils.multiLang(this, this.coinAniSwitchBtn);
        this.switchesArea.addChild(this.coinAniSwitchBtn);

        this.forbidIcons = new egret.DisplayObjectContainer();
        this.forbidIcons.name = "forbidIcons";
        var switches = [this.volumeSwitchBtn, this.initAddElemAniAniSwitchBtn, this.coinAniSwitchBtn];
        for (var i = 0; i < 3; i++){
            var forbidIcon = ViewUtils.createBitmapByName("switchBtnOff_png");
            forbidIcon.name = switches[i].name + "ForbidIcon";
            this.forbidIcons[switches[i].name] = forbidIcon;
            this.forbidIcons.addChild(forbidIcon);
            ViewUtils.multiLang(this, forbidIcon);
        }
        ViewUtils.multiLang(this, this.forbidIcons);
        this.switchesArea.addChild(this.forbidIcons);

        this.goBackBtn = new ArrowButton(false, "goBack_png", 30);
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.onClicked = () => this.goBack();
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");

        var objs = [
            this.bg, this.switchesArea, this.commonRelicsArea, this.attrsBg, this.avatar, this.avatarBg, this.occupationName, this.expBar, this.level, this.exp,
            this.expBarMask, this.power, this.hp, this.dodge, this.coins, this.currentStorey, this.currentDiffFlag, this.currentDiffTitle,
            this.goBackBtn, this.exitBtn
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
        // 第一次打开时有掉下来的动画
        if(!Utils.loadLocalData("openedCharacterView")){
            var switchesAreaPos = {y:this.switchesArea.y};
            var relicAreaPos = {x:this.commonRelicsArea.x, y:this.commonRelicsArea.y, rotation:this.commonRelicsArea.rotation};
            
            var sa = egret.Tween.get(this.switchesArea);
            var ra = egret.Tween.get(this.commonRelicsArea);
            this.switchesArea.y = 25;
            this.commonRelicsArea.x = 25;
            this.commonRelicsArea.y = 25;
            this.commonRelicsArea.rotation = 0;
            this.setChildIndex(this.switchesArea, 1);
            this.setChildIndex(this.commonRelicsArea, 2);
            sa.to(switchesAreaPos, 500);
            ra.to(relicAreaPos, 500).call(() => this.setChildIndex(this.commonRelicsArea, -1));
            
            Utils.saveLocalData("openedCharacterView", true);
        }
        else this.setChildIndex(this.commonRelicsArea, -1);
        return new Promise((resolve, reject) => this.doClose = resolve);
    }

    refresh(){
        this.refreshExpBar();
        this.refreshAttrs();
        this.refreshAvatar();
        this.refreshSwitchStatus();
        this.refreshCommonRelicsArea();
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

        var diff = +this.player.difficulty.replace("level", "");
        ViewUtils.setTexName(this.currentDiffFlag, "diffSel" + (diff + 1) + "_png", true);
    }

    // 刷新开关状态
    refreshSwitchStatus(btns:TextButtonWithBg[] = undefined){
        var switches = btns ? btns : [this.volumeSwitchBtn, this.initAddElemAniAniSwitchBtn, this.coinAniSwitchBtn];
        for (var i = 0; i < switches.length; i++){
            var s = switches[i];
            if(Switch[s["switchType"]]()){
                s.setTexName(s.name + "_png");
                this.forbidIcons[s.name].alpha = 0;
            }
            else {
                s.setTexName(s.name + "Gray_png");
                this.forbidIcons[s.name].alpha = 1;
            }
        }
    }

    // 点击某个开关
    onSwitch(btn:TextButtonWithBg){
        Switch.onSwitch(btn["switchType"]);
        this.refreshSwitchStatus([btn]);
    }

    xGap = 114;
    yGap = 98;
    xNum = 4;

    // 刷新通用技能显示
    refreshCommonRelicsArea(){
        this.commonRelicsArea.removeChildren();
        this.commonRelicsArea.addChild(this.commonRelicsBg);

        var commonRelics = this.player.commonRelicTypes;

        // 设置8个通用技能
        var x = 72;
        var y = 130;
        var j = 0;
        for (var i = 0; i < 8; i++) {
            var relicType = commonRelics[i];
            if (relicType){
                var index = Utils.indexOf(this.player.allRelics, (r:Relic) => r.type == relicType);
                if (index > -1){
                    var relic = this.player.allRelics[index];
                    var relicImg = ViewUtils.createBitmapByName(relic.getElemImgRes() + "_png");
                    relicImg.x = x;
                    relicImg.y = y;
                    this.commonRelicsArea.addChild(relicImg);
                    var stars = ViewUtils.createRelicLevelStars(relic, relicImg);
                    stars.forEach((star, _) => this.commonRelicsArea.addChild(star));
                    relicImg["relic"] = relic;
                    relicImg.touchEnabled = true;
                    relicImg.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt) => this.onClickRelic(evt), this);
                }
                // 玩家不带有此技能时,做一个假的用于显示的技能
                else {
                    var relic = <Relic>ElemFactory.create(relicType);
                    var relicImg = ViewUtils.createBitmapByName(relic.getElemImgRes() + "_png");
                    relicImg.x = x;
                    relicImg.y = y;
                    this.commonRelicsArea.addChild(relicImg);
                    var stars = ViewUtils.createRelicLevelStars(relic, relicImg, true);
                    stars.forEach((star, _) => this.commonRelicsArea.addChild(star));
                    relicImg.touchEnabled = true;
                    relicImg.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onClickFakeRelic(), this);
                }
            }
            else {
                var relicImg = ViewUtils.createBitmapByName("lockedCommonRelick_png");
                relicImg.x = x;
                relicImg.y = y;
                this.commonRelicsArea.addChild(relicImg);
                relicImg.touchEnabled = true;
                relicImg.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onClickLock(), this);
            }

            x += this.xGap;
            j ++;
            if (j >= 4){
                j = 0;
                x = 72;
                y = y + this.yGap;
            }
        }    
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

    // 点击玩家有的技能
    async onClickRelic(evt:egret.TouchEvent){
        var relic = evt.target["relic"];
        await this.showElemDesc(relic);
    }

    // 点击玩家没有的技能
    async onClickFakeRelic(){
        await AniUtils.tipAt(ViewUtils.getTipText("noThisRelic"), {x:this.width/2, y:this.height/2});
    }

    // 点击禁用的图标
    async onClickLock(){
        await AniUtils.tipAt(ViewUtils.getTipText("thisIsLocked"), {x:this.width/2, y:this.height/2});
    }
}