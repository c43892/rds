class ScoreView extends egret.DisplayObjectContainer{
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private avatarBg:egret.Bitmap;
    private avatar:egret.Bitmap;
    private finalScore:egret.TextField;
    private playerName:egret.TextField;
    private exp:egret.TextField;
    private level:egret.TextField;
    private shareBtn:TextButtonWithBg;
    private goOnBtn:TextButtonWithBg;

    private scrollContent:egret.DisplayObjectContainer;
    private scrollArea:egret.ScrollView;
    private infoContainers:egret.DisplayObjectContainer[];
    
    private scoreInfos;
    private scoreNum;
    public player:Player;

    constructor(w, h){
        super();
        this.width = w;
        this.height = h;
        this.name = "scoreView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.bg.name = "bg";

        this.bg1 = ViewUtils.createBitmapByName("scoreViewBg_png");
        this.bg1.name ="bg1";

        this.avatarBg = ViewUtils.createBitmapByName("scoreViewAvatarBg_png");
        this.avatarBg.name = "avatarBg";

        this.avatar = new egret.Bitmap();
        this.avatar.name = "avatar";

        this.playerName = new egret.TextField();
        this.playerName.name ="playerName";

        this.finalScore = new egret.TextField();
        this.finalScore.name = "finalScore";

        // 滚动区域中的内容
        this.scrollContent = new egret.DisplayObjectContainer();
        this.scrollContent.name = "scrollContent";
        this.scrollArea = new egret.ScrollView();
        this.scrollArea.name = "scrollArea";
        this.scrollArea.setContent(this.scrollContent);
        this.scrollArea.verticalScrollPolicy = "auto";
        this.scrollArea.horizontalScrollPolicy = "off";
        this.scrollArea.bounces = true;
        this.scrollArea.addEventListener(egret.Event.CHANGE, () => this.setInfoContainers(), this);

        this.shareBtn = new TextButtonWithBg("goBack_png", 30);
        this.shareBtn.text = ViewUtils.getTipText("shareBtn");
        this.shareBtn.name = "shareBtn";
        this.shareBtn.onClicked = () => this.doShare();

        this.goOnBtn = new TextButtonWithBg("goForward_png", 30);
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.onClicked = () => this.doClose();

        var objs = [this.bg, this.bg1, this.avatarBg, this.avatar, this.playerName, this.finalScore, this.scrollArea, this.shareBtn, this.goOnBtn];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

        this.scrollContent.width = this.scrollArea.width;
    }

    onUsing;

    open(scoreInfos = []){
        this.onUsing = true;
        this.scoreInfos = BattleStatistics.getScoreInfos(this.player.st);
        this.refresh();
        
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    doClose;

    onGoOn() {
        // 获得经验

        this.onUsing = false;
        this.doClose();
    }

    doShare(){
        this.refresh();
    }

    readonly yGap = 60;
    readonly xGap = 50;
    readonly xShort = 180;
    readonly yLimit = 335;

    refresh() {
        // 设置头像
        ViewUtils.setTexName(this.avatar, "avatar" + this.player.occupation + "_png", true);

        // 设置经验条

        // 设置总得分
        this.finalScore.text = BattleStatistics.getFinalScore(this.scoreInfos).toString();        

        this.refreshInfoContainers();
    }

    // 设置每项得分的内容
    refreshInfoContainers() {
        this.scrollContent.removeChildren();
        this.infoContainers = [];
        var y = 20;
        var index = 0
        for (var title in this.scoreInfos) {
            var infoContainer = this.createSingleStoreInfo(title, this.scoreInfos[title]);
            if (index > 5)
                this.setShortInfo(infoContainer);
            else 
                this.setLongInfo(infoContainer);

            infoContainer.x = this.xGap;
            infoContainer.y = y;
            this.infoContainers.push(infoContainer);
            this.scrollContent.addChild(infoContainer);
            y += this.yGap;
            index ++;
        }

        this.scrollContent.height = y;
        var touchBg = new egret.Bitmap();
        touchBg.height = this.scrollContent.height;
        touchBg.width = this.scrollContent.width;
        touchBg.touchEnabled = true;
        this.scrollContent.addChild(touchBg);

        this.scrollArea.scrollTop = 0;
    }

    // 创建单条得分信息,其中包括标题,得分以及横线
    createSingleStoreInfo(t:string, s:number) {
        var title = ViewUtils.createTextField(30, 0x000000);
        title.text = ViewUtils.getTipText(t);
        title.name = "title";
        var score = ViewUtils.createTextField(30, 0x000000);
        score.text = t == "difficulty" ? ("× " + s.toString()) : s.toString();
        score.name = "score";
        score.anchorOffsetX = score.width;
        var line = ViewUtils.createBitmapByName("scoreViewLine_png");
        line.name = "line";

        // 将内容装在一起
        var container = new egret.DisplayObjectContainer();
        container.addChild(title);
        container["title"] = title;
        container.addChild(score);
        container["score"] = score;
        container.addChild(line);
        container["line"] = line;

        return container;
    }

    setInfoContainers(){
        if (!this.onUsing) return;
        for (var c of this.infoContainers) {
            if (c.y - this.scrollArea.scrollTop > this.yLimit)
                this.setShortInfo(c);
            else this.setLongInfo(c);
        }
    }

    // 将一条得分信息设置为长格式
    setLongInfo(c:egret.DisplayObjectContainer){
        if (c["status"] == "long") return;

        ViewUtils.multiLang(this, c["title"], c["score"], c["line"]);
        c["line"].scaleX = 1;
        c["status"] = "long";
    }

    // 将一条得分信息设置为短格式
    setShortInfo(c:egret.DisplayObjectContainer){
        if (c["status"] == "short") return;

        ViewUtils.multiLang(this, c["title"], c["score"], c["line"]);
        c["title"].x = c["line"].x  = this.xShort;
        c["line"].scaleX = 0.6;
        c["status"] = "short";
    }
}