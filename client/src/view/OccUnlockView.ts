class OccUnlockView extends egret.DisplayObjectContainer {
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private occAvatar:egret.Bitmap;
    private occAvatarBg:egret.Bitmap;
    private occText:egret.TextField;
    private levelUp2:egret.TextField;
    private levelUpTitle:egret.TextField;
    private goOnBtn:ArrowButton;

    private infoContainers:egret.DisplayObjectContainer[] = [];

    private occ:string;
    private level:number;

    constructor(w, h){
        super();

        this.width = w;
        this.height = h;        
        this.name = "OccUnlockView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");        
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";        
        
        this.occAvatarBg = new egret.Bitmap();
        this.occAvatarBg.name = "occAvatarBg";

        this.occAvatar = new egret.Bitmap();
        this.occAvatar.name = "occAvatar";

        this.occText = ViewUtils.createTextField(35, 0x000000, false);
        this.occText.name = "occText";

        this.levelUp2 = ViewUtils.createTextField(25, 0x000000, false);
        this.levelUp2.name = "levelUp2";

        this.levelUpTitle = ViewUtils.createTextField(25, 0x000000, false);
        this.levelUpTitle.text = ViewUtils.getTipText("levelUpTitle");
        this.levelUpTitle.name = "levelUpTitle";

        this.goOnBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.onClicked = () => this.onGoOnBtn();

        var objs = [this.bg, this.bg1, this.occAvatarBg, this.occAvatar, this.occText, this.levelUp2, this.levelUpTitle, this.goOnBtn];
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));
    }

    async open(occ:string, level:number) {
        this.occ = occ;
        this.level = level == -1 ? (GCfg.getMiscConfig("occupationLevelCfg").length + 1) : level;
        this.refresh();
        return new Promise((resolve, reject) => this.doClose = resolve);
    }

    refresh() {
        // 重新设置格式
        var objs = [this.bg, this.bg1, this.occAvatarBg, this.occAvatar, this.occText, this.levelUp2, this.levelUpTitle, this.goOnBtn];
        ViewUtils.multiLang(this, ...objs);

        for (var c of this.infoContainers)
            this.removeChild(c)

        this.infoContainers = [];

        // 头像
        ViewUtils.setTexName(this.occAvatar, this.occ + "_png");

        // 职业名称
        var mlCfg = ViewUtils.languageCfg;
        this.occText.text = mlCfg.occupations[this.occ]["name"][mlCfg.currentLanguage];

        // 提升至xx级提示
        this.levelUp2.text = (this.level - 1).toString() + "级 → " + this.level + "级";

        // 所有的解锁信息
        this.refreshUnlockInfos();

        // 平移界面置中
        this.move2Center();
    }

    refreshUnlockInfos() {
        var infos = GCfg.getOccUnlockDesc(this.occ)[this.level - 2];
        // 先设置第一条解锁信息
        var firstInfo = infos[0];
        var firstInfoContainer = this.createSingleUnlockInfo(firstInfo);
        firstInfoContainer.name = "firstInfoContainer";
        ViewUtils.multiLang(this, firstInfoContainer);

        var currentY = firstInfoContainer.y + firstInfoContainer.height + 20;

        // 后续排列剩下的解锁信息
        for (var i = 1; i < infos.length; i++){
            var moreInfoContainer = this.createSingleUnlockInfo(infos[i]);
            moreInfoContainer.name = "moreInfoContainer";
            ViewUtils.multiLang(this, moreInfoContainer);
            moreInfoContainer.y = currentY;
            currentY = currentY + moreInfoContainer.height + 20;
        }

        this.infoContainers.forEach((ic, _) => this.addChild(ic));

        this.bg1.height = currentY - this.bg1.y + 105;
    }

    // 创建一个解锁信息
    createSingleUnlockInfo(info):egret.DisplayObjectContainer {
        var infoContainer = new egret.DisplayObjectContainer();
        this.infoContainers.push(infoContainer);

        var bgFrame = ViewUtils.createBitmapByName("bgFrame_png");
        bgFrame.name = "infoBgFrame";
        bgFrame.scale9Grid = new egret.Rectangle(45, 45, 225, 1);
        infoContainer.addChild(bgFrame);

        var title = ViewUtils.createTextField(25, 0X000000, false);
        title.text = info.title;
        title.name = "infoTitle";
        infoContainer.addChild(title);

        var icon = ViewUtils.createBitmapByName(info.icon + "_png");
        icon.name = "infoICon";
        infoContainer.addChild(icon);

        var desc = ViewUtils.createTextField(0, 0x000000, false);
        desc.name = "infoDesc";
        desc.textFlow = ViewUtils.fromHtml(info.desc);
        desc.lineSpacing = 8; 
        infoContainer.addChild(desc);

        ViewUtils.multiLang(this, bgFrame, title, icon, desc);

        infoContainer.height = bgFrame.height = Math.max(210, desc.y - bgFrame.y + desc.height + 50);
        
        return infoContainer;
    }

    // 平移界面置中
    move2Center() {
        var objs = [this.bg1, this.occAvatarBg, this.occAvatar, this.occText, this.levelUp2, this.levelUpTitle, ...this.infoContainers];
        var moveY = (this.height - this.bg1.height) / 2 - this.bg1.y;
        objs.forEach((obj, _) => obj.y += moveY);
    }

    doClose;
    onGoOnBtn() {
        this.doClose();
    }
}