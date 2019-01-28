// 结算界面
class ScoreView extends egret.DisplayObjectContainer{
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private avatarBg:egret.Bitmap;
    private avatar:egret.Bitmap;
    private finalScore:egret.TextField;
    private playerName:egret.TextField;
    private exp:egret.TextField;
    private expBar:egret.Bitmap;
    private level:egret.TextField;
    // private shareBtn:ArrowButton;
    private goOnBtn:ArrowButton;

    private scrollContent:egret.DisplayObjectContainer;
    private scrollArea:egret.ScrollView;
    private infoContainers:egret.DisplayObjectContainer[];
    
    private scoreInfos;
    private scoreNum;
    private currentLevel;
    private currentExp;    
    private newLevel;
    private newExp;
    private totalWidth;
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
        this.playerName.name = "playerName";
        this.playerName.textColor = 0X000000;
        this.playerName.verticalAlign = egret.VerticalAlign.MIDDLE;
        this.playerName.textAlign = egret.HorizontalAlign.CENTER;

        this.finalScore = new egret.TextField();
        this.finalScore.name = "finalScore";
        this.finalScore.textColor = 0X000000;
        this.finalScore.textAlign = egret.HorizontalAlign.CENTER;

        this.exp = new egret.TextField();
        this.exp.name = "exp";
        this.exp.textColor = 0X000000;
        this.exp.verticalAlign = egret.VerticalAlign.MIDDLE;

        this.expBar = new egret.Bitmap();
        ViewUtils.setTexName(this.expBar, "scoreViewExp_png");
        this.expBar.name = "expBar";        
        this.expBar.fillMode = egret.BitmapFillMode.REPEAT;

        this.level = new egret.TextField();
        this.level.name = "level";
        this.level.textColor = 0X000000;
        this.level.verticalAlign = egret.VerticalAlign.MIDDLE;

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

        // this.shareBtn = new ArrowButton(false, "goShare_png", 30);
        // this.shareBtn.text = ViewUtils.getTipText("shareBtn");
        // this.shareBtn.name = "shareBtn";
        // this.shareBtn.onClicked = () => this.doShare();

        this.goOnBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.onClicked = () => this.onGoOn();

        var objs = [this.bg, this.bg1, this.avatarBg, this.avatar, this.playerName, this.finalScore, this.exp, this.expBar, 
        this.level, this.scrollArea, /*this.shareBtn, */this.goOnBtn];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

        this.scrollContent.width = this.scrollArea.width;
        var bar = ViewUtils.createBitmapByName("scoreViewExp_png");
        this.totalWidth = bar.width;
    }

    onUsing; // 是否处于使用该界面的状态,决定是否检测滚动区域内信息的变化

    async open() {
        this.onUsing = true;
        this.goOnBtn["func"] = "getExp";
        this.currentLevel = Utils.getOccupationLevelAndExp(this.player.occupation).level;
        this.currentExp = Utils.getOccupationLevelAndExp(this.player.occupation).exp;
        this.scoreInfos = BattleStatistics.getScoreInfos(this.player.st);
        this.refresh();
        await this.flyIn();
        
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    doClose;

    async onGoOn() {        
        if (this.goOnBtn["func"] == "getExp") {
            this.goOnBtn.touchEnabled = false;
            // 未满级则获得经验
            if (Utils.getOccupationLevelAndExp(this.player.occupation).level != -1) {
                var getExp = Utils.score2Exp(BattleStatistics.getFinalScore(this.scoreInfos));      
                Utils.addOccupationExp(this.player.occupation, getExp);                

                // 是否有升级
                this.newLevel = Utils.getOccupationLevelAndExp(this.player.occupation).level;
                this.newExp = Utils.getOccupationLevelAndExp(this.player.occupation).exp;
                
                await this.expBarAni(this.newExp, this.newLevel, this.newLevel > this.currentLevel);

                this.refreshExpBar(this.newExp, this.newLevel);
                this.setExpTip();
                await Utils.delay(500);

                this.onUsing = false;
                this.goOnBtn.touchEnabled = true;
                if (this.newLevel > this.currentLevel || this.newLevel == -1) {
                    this.goOnBtn["func"] = "unlock";
                    this.goOnBtn.text = ViewUtils.getTipText("unlockBtn");
                } 
                else{
                    this.goOnBtn["func"] = "close";
                    this.goOnBtn.text = ViewUtils.getTipText("close");
                    }
            } else {
                this.onUsing = false;
                this.goOnBtn.touchEnabled = true;
                this.doClose();
            }
        } else {
            if (this.goOnBtn["func"] == "close") {
                this.goOnBtn["func"] = "getExp";
                this.doClose();
            }
            else if (this.goOnBtn["func"] == "unlock") {
                this.goOnBtn["func"] = "getExp";
                this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
                this.doClose({ occ: this.player.occupation, level: this.newLevel });
            }
        }
    }

    doShare(){
        this.refresh();
    }

    readonly yGap = 50;
    readonly xGap = 0;
    readonly xShort = 195;
    readonly yLimit = 335;

    refresh() {
        // 设置头像
        ViewUtils.setTexName(this.avatar, "avatar" + this.player.occupation + "_png", true);

        // 设置玩家名
        var name = Utils.getPlayerName() ? Utils.getPlayerName() : "一个新玩家";
        this.playerName.text = name;

        // 设置经验条
        this.setExpTip();

        // 设置总得分
        this.finalScore.text = BattleStatistics.getFinalScore(this.scoreInfos).toString();        

        this.refreshInfoContainers();

        this.refreshExpBar(this.currentExp, this.currentLevel);

        if (Utils.getOccupationLevelAndExp(this.player.occupation).level == -1)
            this.goOnBtn.text = ViewUtils.getTipText("close");
        else 
            this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
    }

    // 设置每项得分的内容
    refreshInfoContainers() {
        this.scrollContent.removeChildren();
        this.infoContainers = [];
        var y = 5;
        var index = 0
        for (var title in this.scoreInfos) {
            var infoContainer = this.createSingleStoreInfo(title, this.scoreInfos[title]);
            if (index > 6)
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
        title.text = t.indexOf("test") > -1 ? t : ViewUtils.getTipText(t);
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

    // 滚动时调整得分信息的显示方式
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

    // 设置经验显示
    setExpTip(){
        var info = Utils.getOccupationLevelAndExp(this.player.occupation);
        if (info.level == -1){
            this.exp.alpha = 0;
            // this.level.alpha = 0;
            this.level.text = "max"
        }
        else {
            this.exp.alpha = 1;
            this.exp.text = "[" + info.exp + "/" + GCfg.getMiscConfig("occupationLevelCfg")[info.level - 1] + "]";
            this.level.alpha = 1;
            this.level.text = (info.level + 1).toString();
        }
    }

    // 得分信息飞入动画
    async flyIn() {
        this.exp.alpha = 0;
        this.level.alpha = 0;
        this.finalScore.alpha = 0;
        var infoContainers = [];
        for(var i = 0; i <= 6; i++){
            if(this.infoContainers[i]){
                infoContainers.push(this.infoContainers[i]);
                this.infoContainers[i]["toX"] = this.infoContainers[i].x;
                this.infoContainers[i].x = 700;
            }
        }
        for(var i = 0; i < infoContainers.length; i++){
            var c = infoContainers[i];
            var toX = c["toX"]
            var rr = egret.Tween.get(c, {loop:false});
            rr.to({x:toX}, 500, egret.Ease.quintIn);
            await Utils.delay(500);
        }
        this.exp.alpha = 1;
        this.level.alpha = 1;
        this.finalScore.alpha = 1;
    }

    // 刷新经验条长度
    refreshExpBar(toExp:number, level:number) {
        var currentTotalExp = GCfg.getMiscConfig("occupationLevelCfg")[level - 1];
        var w = this.totalWidth * toExp / currentTotalExp;
        this.expBar.width = w;
    }

    // 经验条动画
    async expBarAni(toExp:number, level:number, levelUp:boolean) {
        var currentTotalExp = GCfg.getMiscConfig("occupationLevelCfg")[level - 1];
        var toWidth = this.totalWidth * toExp / currentTotalExp;
        if (!levelUp){
            var rr = egret.Tween.get(this.expBar, {loop:false});
            rr.to({width:toWidth}, 2000, egret.Ease.quintInOut);
            await Utils.delay(2000);
        } else {
            var rr = egret.Tween.get(this.expBar, {loop:false});
            rr.to({width:this.totalWidth}, 1000, egret.Ease.quintInOut);
            await Utils.delay(1500);
            this.expBar.width = 0;
            rr.to({width:toWidth}, 1000, egret.Ease.quintInOut);
            await Utils.delay(1000);
        }
    }
}