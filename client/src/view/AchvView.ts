class AchvView extends egret.DisplayObjectContainer {
    private awardCfg; // 成就奖励配置
    private onAchvList:boolean; // 处于成就列表页签的状态
    private currentScrollView; // 当前显示的滚动区域
    
    private bg:egret.Bitmap; // 压暗的背景
    private bg1:egret.Bitmap; // 成就列表背景
    private achvListBtn:egret.Bitmap; // 成就列表页签
    private achvAwardBtn:egret.Bitmap; // 成就奖励页签
    private achvListScrollArea:egret.ScrollView; // 显示成就列表的滚动区域
    private achvAwardScrollArea:egret.ScrollView; // 显示成就奖励的滚动区域
    private achvListContent:egret.DisplayObjectContainer; // 成就列表滚动区域内的显示内容
    private achvAwardContent:egret.DisplayObjectContainer; // 成就奖励滚动区域的显示内容
    private redPoint:egret.Bitmap; // 红点提示
    private achvPointTip:egret.TextField; // 总成就点
    private goBackBtn:ArrowButton; // 返回按钮


    public receiveAchvAward;
    public openAchvDescView;

    constructor(w, h) {
        super();
        this.width = w;
        this.height = h;
        this.name = "achvView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;

        this.bg1 = ViewUtils.createBitmapByName("achvViewBg1_png");
        this.bg1.name = "bg1";

        this.achvListBtn = ViewUtils.createBitmapByName("achvListBtn_png");
        this.achvListBtn.touchEnabled = true;
        this.achvListBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSelAchvList(), this);
        this.achvListBtn.name = "achvListBtn";

        this.achvAwardBtn = ViewUtils.createBitmapByName("achvAwardBtn_png");
        this.achvAwardBtn.touchEnabled = true;
        this.achvAwardBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSelAchvAward(), this);
        this.achvAwardBtn.name = "achvAwardBtn";
        
        this.achvListScrollArea = new egret.ScrollView();
        this.achvListScrollArea.name = "achvListScrollArea";
        this.achvListScrollArea.verticalScrollPolicy = "auto";
        this.achvListScrollArea.horizontalScrollPolicy = "off";
        this.achvListScrollArea.bounces = true;

        this.achvAwardScrollArea = new egret.ScrollView();
        this.achvAwardScrollArea.name = "achvAwardScrollArea";
        this.achvAwardScrollArea.verticalScrollPolicy = "auto";
        this.achvAwardScrollArea.horizontalScrollPolicy = "off";
        this.achvAwardScrollArea.bounces = true;
        
        this.achvListContent = new egret.DisplayObjectContainer();
        this.achvListContent.name = "achvListContent";
        this.achvListScrollArea.setContent(this.achvListContent);

        this.achvAwardContent = new egret.DisplayObjectContainer();
        this.achvAwardContent.name = "achvAwardContent";
        this.achvAwardScrollArea.setContent(this.achvAwardContent);

        this.redPoint = ViewUtils.createBitmapByName("redPoint_png");
        this.redPoint.name = "redPoint";
        this.redPoint.anchorOffsetX = this.redPoint.width / 2;
        this.redPoint.anchorOffsetY = this.redPoint.height / 2;

        
        this.achvPointTip = ViewUtils.createTextField(30, 0x000000);
        this.achvPointTip.name = "achvPointTip";
        
        this.goBackBtn = new ArrowButton(false, "goBack_png");
        this.goBackBtn.onClicked = () => this.onGoBack();
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");
        this.goBackBtn.name = "goBackBtn";

        var objs = [this.bg, this.bg1, this.achvListBtn, this.achvAwardBtn, this.redPoint, this.achvPointTip, this.goBackBtn];
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));

        ViewUtils.multiLang(this, this.achvListScrollArea, this.achvAwardScrollArea);
    }

    doClose;

    // 打开界面
    public async open() {
        this.onAchvList = true;
        this.awardCfg = GCfg.getAchvAwardCfg();
        this.refresh();
        return new Promise((resolve, reject) => this.doClose = resolve);
    }

    // 刷新界面信息
    refresh(){        
        this.achvPointTip.text = ViewUtils.getTipText("currentAchvPoint") + " " + AchievementMgr.mgr.getTotalAchvPoint();
        this.refreshAchvListAndAward();
        this.refreshTabBtns();
        this.refreshRedPoint();
    }

    // 刷新成就列表信息和成就奖励信息
    refreshAchvListAndAward() {
        // 刷新成就列表信息
        this.achvListContent.removeChildren();
        var listBg = new egret.Bitmap();
        listBg.touchEnabled = true;
        this.achvListContent.addChild(listBg);
        var i = 0;
        for (var achv of AchievementMgr.mgr.allAchvs){
            var achvContainer = this.createSingleAchvInfoByCfg(achv);
            achvContainer.x = 10;
            achvContainer.y = 10 + i * 120;
            this.achvListContent.addChild(achvContainer);
            i++;
        }
        this.achvListContent.width = listBg.width = this.achvListScrollArea.width;
        this.achvListContent.height = listBg.height = 10 + i * 120;

        // 刷新成就奖励信息
        this.achvAwardContent.removeChildren();
        var awardBg = new egret.Bitmap();
        awardBg.touchEnabled = true;
        this.achvAwardContent.addChild(awardBg);

        // 每项成就奖励
        var j = 0;
        var x = 9;
        var y = 0;
        for (var award in this.awardCfg){
            var awardInfo = this.awardCfg[award];
            var awardContainer = this.createSingleAwardInfoByCfg(award, awardInfo);
            awardContainer.x = j * 184 + x;
            awardContainer.y = y;
            this.achvAwardContent.addChild(awardContainer);
            j++;
            if (j >= 3){
                j = 0;
                y += 240;
            }
        }
        this.achvAwardContent.width = awardBg.width = this.achvAwardScrollArea.width;
        this.achvAwardContent.height = awardBg.height = y;        
    }

    // 根据所处界面刷新页签和滚动区域内的显示
    refreshTabBtns() {
        if (this.currentScrollView)
            this.removeChild(this.currentScrollView);
            
        if (this.onAchvList) {
            ViewUtils.setTexName(this.achvListBtn, "achvListBtn_png");
            ViewUtils.setTexName(this.achvAwardBtn, "achvAwardBtnGray_png");
            this.currentScrollView = this.achvListScrollArea;
            this.achvPointTip.alpha = 0;
        }
        else {
            ViewUtils.setTexName(this.achvListBtn, "achvListBtnGray_png");
            ViewUtils.setTexName(this.achvAwardBtn, "achvAwardBtn_png");
            this.currentScrollView = this.achvAwardScrollArea;
            this.achvPointTip.alpha = 1;
        }
        this.addChild(this.currentScrollView);
    }

    // 刷新小红点提示
    refreshRedPoint() {
        this.redPoint.alpha = 0;
        for (var award in this.awardCfg)
            if (AchievementMgr.getAchvAwardStatus(award) == "wait4Receive") {
                this.redPoint.alpha = 1;
                break;
            }
    }

    // 根据配置生成单条成就信息
    private createSingleAchvInfoByCfg(achv:Achievement):egret.DisplayObjectContainer {
        var achvContainer = new egret.DisplayObjectContainer();
        var cfg = GCfg.getAchvDescCfg(achv.type);
        // 背景
        var bgName = achv.isFinished() ? "achvFinished_png" : "achvUnfinished_png";
        var bg = ViewUtils.createBitmapByName(bgName);
        bg.touchEnabled = true;
        bg["achv"] = achv;
        bg.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt:egret.TouchEvent) => this.onClickAchv(evt), this);

        // 图标
        var icon = ViewUtils.createBitmapByName(cfg.icon + "_png");
        icon.name = "achvIcon";

        // 标题
        var title = ViewUtils.createTextField(40, 0x000000);
        title.textAlign = egret.HorizontalAlign.LEFT;
        title.name = "title";
        title.text = cfg.title;

        // 描述
        var shortDesc = ViewUtils.createTextField(20, 0x000000);
        shortDesc.textAlign = egret.HorizontalAlign.LEFT;
        shortDesc.name = "shortDesc";
        shortDesc.text = cfg.shortDesc;

        var objs = [bg, icon, title, shortDesc];
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => achvContainer.addChild(obj));

        // 完成进度用的星星或已完成标志
        if (achv.isFinished()) {
            var finishedSign = ViewUtils.createBitmapByName("achvFinishedSign_png");
            finishedSign.name = "finishedSign";
            ViewUtils.multiLang(this, finishedSign);
            achvContainer.addChild(finishedSign);
        }
        else {
            var stars = new egret.DisplayObjectContainer();
            stars.name = "stars";
            stars.anchorOffsetX = stars.width / 2;
            if (achv.stages()){
                var achvStarNum = achv.stages();
                var grayStarNum = achv.stages() - achv.finishedStage();
            } else {
                var achvStarNum = 1;
                var grayStarNum = 1;
            }
                        
            for (var i = 0; i < achvStarNum; i++) {
                var starTextName = (achvStarNum - i > grayStarNum) ? "achvStar_png" : "achvStarGray_png"
                var star = ViewUtils.createBitmapByName(starTextName);
                star.anchorOffsetX = star.width / 2;
                star.x = 62 + (i - achvStarNum / 2) * star.width;
                stars.addChild(star);
            }
            ViewUtils.multiLang(this, stars);
            achvContainer.addChild(stars);
        }
        
        return achvContainer;
    }

    // 根据配置生成单条成就奖励信息
    private createSingleAwardInfoByCfg(awardName, info) {
        var awardContainer = new egret.DisplayObjectContainer();
        var status = AchievementMgr.getAchvAwardStatus(awardName);
        
        var bgName = undefined;
        if (status == "unfinished") {
            // 背景
            bgName = "achvAwardCardGray_png";
            var cardBg = ViewUtils.createBitmapByName(bgName);
            awardContainer.addChild(cardBg);

            // 提示内容
            var tip = ViewUtils.createTextField(18, 0x000000);
            tip.name = "unlockTip";
            tip.text = "解锁于成就"
            awardContainer.addChild(tip);

            // 描述
            var desc = ViewUtils.createTextField(20, 0x000000);
            desc.name = "unlockDesc";
            desc.text = info.desc;
            awardContainer.addChild(desc);
            
            ViewUtils.multiLang(this, tip, desc);
            tip.textAlign = egret.HorizontalAlign.CENTER;
            tip.anchorOffsetX = tip.width / 2;
            desc.textAlign = egret.HorizontalAlign.CENTER;
            desc.anchorOffsetX = desc.width / 2;
        }
        else {
            // 背景
            bgName = "achvAwardCard_png";
            var cardBg = ViewUtils.createBitmapByName(bgName);
            awardContainer.addChild(cardBg);

            // 奖励图标
            var icon = ViewUtils.createBitmapByName(info.icon + "_png");
            icon.anchorOffsetX = icon.width / 2;
            icon.anchorOffsetY = icon.height / 2;
            icon.name = "awardIcon";
            ViewUtils.multiLang(this, icon);
            icon.scaleX = icon.scaleY = 1.2;
            awardContainer.addChild(icon);

            // 领取按钮
            var awardReceiveBtn = new TextButtonWithBg("achvAwardReceiveBtn_png", 30);
            awardReceiveBtn.name = "awardReceiveBtn";
            ViewUtils.multiLang(this, awardReceiveBtn);
            awardContainer.addChild(awardReceiveBtn);
            if (status == "received"){
                awardReceiveBtn.text = "已领取";
                awardReceiveBtn.enabled = false;
            }
            else {
                awardReceiveBtn.text = "领取";
                awardReceiveBtn.enabled = true;
                awardReceiveBtn["awardName"] = awardName;
                awardReceiveBtn.onClicked = () => this.onReceiveBtn(awardReceiveBtn);
            }
        }
        return awardContainer;
    }

    // 查看成就详情
    async onClickAchv(evt:egret.TouchEvent){
        var bg = evt.target;
        await this.openAchvDescView(bg["achv"]);
    }

    // 领取成就奖励
    onReceiveBtn(btn:TextButtonWithBg){
        var awardName = btn["awardName"];
        AchievementMgr.receiveAchvAward(awardName);
        btn.enabled = false;
        btn.text = "已领取";
        this.refreshRedPoint();
    }

    // 选择成就列表
    onSelAchvList(){
        this.onAchvList = true;
        this.refresh();
    }

    // 选择成就奖励
    onSelAchvAward(){
        this.onAchvList = false;
        this.refresh();
    }

    // 返回
    onGoBack(){
        this.doClose();
    }
}