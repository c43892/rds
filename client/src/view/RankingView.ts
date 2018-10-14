// 排行榜视图
class RankingView extends egret.DisplayObjectContainer {    

    public usrInfo;
    public weeklyRankInfo;
    public roleRankInfo;

    bg:egret.Bitmap;
    closeBtn:egret.Bitmap;
    title:egret.TextField;
    tabMenu:egret.TextField[]; // 顶端不同榜单切换
    rankViewContainer:egret.ScrollView; // 榜单区域
    wxRankImg; // 微信好友榜单
    menu = [];
    menuDisplayName = {"weeklyRank":"周榜", "roleRank":"角色榜", "friendRank":"好友榜"};

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;

        // 背景
        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        // 关闭按钮
        this.closeBtn = ViewUtils.createBitmapByName("goBack_png");
        this.closeBtn.x = 0;
        this.closeBtn.y = this.height - this.closeBtn.height;
        this.addChild(this.closeBtn);
        this.closeBtn.touchEnabled = true;
        this.closeBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCloseBtn, this);

        // 标题
        this.title = ViewUtils.createTextField(50, 0x0000ff);
        this.title.text = "排行榜";
        this.title.x = 0;
        this.title.y = 0;
        this.title.width = this.width;
        this.addChild(this.title);

        var y = this.title.y + this.title.height + 50;
        // 切换按钮
        this.menu = window.platform.platformType == "wx" ? ["friendRank"] : ["weeklyRank", "roleRank"];
        var x = 0;
        for (var m of this.menu) {
            var menuBtn = ViewUtils.createTextField(30, 0x0000ff);
            menuBtn.text = this.menuDisplayName[m];
            menuBtn.x = x;
            menuBtn.y = y;
            menuBtn.width = this.width / this.menu.length;
            x += menuBtn.width;
            menuBtn["rankType"] = m;
            this.addChild(menuBtn);
            menuBtn.touchEnabled = true;
            menuBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onMenuSel, this);
        }
        
        // 排名区域
        var top = y + 150;
        this.rankViewContainer = new egret.ScrollView();
        this.rankViewContainer.verticalScrollPolicy = "auto";
        this.rankViewContainer.horizontalScrollPolicy = "off";
        this.rankViewContainer.bounces = true;
        this.rankViewContainer.x = 0;
        this.rankViewContainer.y = top;
        this.rankViewContainer.width = this.width;
        this.rankViewContainer.height = this.height - top - 200;
        this.addChild(this.rankViewContainer);
    }

    onMenuSel(evt:egret.TouchEvent) {
        var rankType = evt.target["rankType"];
        this.openRank(rankType);
    }

    openRank(rankType) {
        if (rankType == "weeklyRank")
            this.openWeeklyRank();
        else if (rankType == "roleRank")
            this.openRoleRank();
        else if (rankType == "friendRank") {
            if (window.platform.platformType == "wx")
                this.openWxFriendRank();
        }
        else
            Utils.assert(false, "not supported rank type:" + rankType);
    }

    doClose;
    public open(rankType:string = undefined):Promise<void> {
        rankType = rankType ? rankType : this.menu[0];
        this.openRank(rankType);
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    rebuildRank(usrs, fromIndex:number, cnt:number) {
        this.rankViewContainer.removeChildren();
        if (!usrs) return;

        var y = 0;
        var h = 30;
        var wAvatar = h;
        var wName = (this.width - wAvatar) / 2;
        var wScore = (this.width - wAvatar) / 2;
        for (var i = fromIndex; i < (fromIndex + cnt) && i < usrs.length; i++) {
            var usr = usrs[i];
            if (!usr || !usr.uid || usr.uid == "" || usr.score == 0) // no more user
                return;

            var avatar = ViewUtils.createBitmapByName("avatar1_png");
            avatar.x = 0;
            avatar.y = y;
            avatar.width = wAvatar;
            avatar.height = h;
            this.rankViewContainer.addChild(avatar);

            var name = ViewUtils.createTextField(30, 0x0000ff);
            name.x = avatar.x + avatar.width;
            name.y = y;
            name.width = wName;
            name.height = h;
            name.text = usr.nickName;
            this.rankViewContainer.addChild(name);

            var score = ViewUtils.createTextField(30, 0x0000ff);
            score.x = name.x + name.width;
            score.y = y;
            score.width = wScore;
            score.height = h;
            score.text = usr.score.toString();
            this.rankViewContainer.addChild(score);
        }
    }

    currentPageIndex = 0;
    pageSize = 10;

    // 周榜单
    public openWeeklyRank() {
        this.rebuildRank(this.weeklyRankInfo, this.currentPageIndex * this.pageSize, this.pageSize);
    }

    // 角色榜单
    public openRoleRank() {
        this.rebuildRank(this.roleRankInfo, this.currentPageIndex * this.pageSize, this.pageSize);
    }

    MaxNumInRank = 100; // 最多显示多少条目
    PerItemHeight = 100; // 每条目占高度

    // 显示微信好友榜单
    public openWxFriendRank() {
        if (this.wxRankImg) this.rankViewContainer.removeChild(this.wxRankImg);

        var platform = window.platform;
        var bmp:egret.Bitmap = platform.openDataContext.createDisplayObject(null, 
            this.rankViewContainer.width, 
            this.MaxNumInRank * this.PerItemHeight);

        if (!bmp)
            return;

        window.platform.openDataContext.postMessage({"type":"refresh", pageIndex:0});
        this.loopChecker(bmp);
    }

    async loopChecker(bmp:egret.Bitmap) {
        this.rankViewContainer.verticalScrollPolicy = "off";

        while (!bmp.hitTestPoint(bmp.width / 2, this.PerItemHeight / 2, true))
            await AniUtils.delay(50);

        for (var i = this.PerItemHeight / 2; i < bmp.height; i += this.PerItemHeight) {
            if (!bmp.hitTestPoint(bmp.width / 2, i, true)) {
                this.rankViewContainer.setContent(bmp);
                bmp.height = i;
                break;
            }
        }

        bmp.fillMode = egret.BitmapFillMode.CLIP;
        this.rankViewContainer.verticalScrollPolicy = "auto";
    }
    
    public onCloseBtn(evt:egret.TouchEvent) {
        this.doClose();
    }
}
