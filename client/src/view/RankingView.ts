// 排行榜视图
class RankingView extends egret.DisplayObjectContainer {    

    bg:egret.Bitmap;
    closeBtn:egret.Bitmap;
    title:egret.TextField;
    tabMenu:egret.TextField[]; // 顶端不同榜单切换
    rankViewContainer; // 榜单区域
    wxRankImg; // 微信好友榜单
    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;

        // 背景
        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
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
        var menu = ["weeklyRank", "roleRank", "friendRank"];
        var menuDisplayName = {"weeklyRank":"周榜", "roleRank":"角色榜", "friendRank":"好友榜"};
        var x = 0;
        for (var m of menu) {
            var menuBtn = ViewUtils.createTextField(30, 0x0000ff);
            menuBtn.text = menuDisplayName[m];
            menuBtn.x = x;
            menuBtn.y = y;
            menuBtn.width = this.width / menu.length;
            x += menuBtn.width;
            menuBtn["rankType"] = m;
            this.addChild(menuBtn);
            menuBtn.touchEnabled = true;
            menuBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onMenuSel, this);
        }
        
        // 排名区域
        var top = y + 150;
        this.rankViewContainer = new egret.DisplayObjectContainer();
        this.rankViewContainer.x = 0;
        this.rankViewContainer.y = top;
        this.rankViewContainer.width = this.width;
        this.rankViewContainer.height = this.height - top;
        this.addChild(this.rankViewContainer);
    }

    onMenuSel(evt:egret.TouchEvent) {
        var rankType = evt.target["rankType"];
        this.openRank(rankType);
    }

    openRank(rankType) {
        Utils.log("open rank:" + rankType);
        if (rankType == "weeklyRank")
            this.openWeeklyRank();
        else if (rankType == "roleRank")
            this.openRoleRank();
        else if (rankType == "friendRank")
            this.openWxFriendRank();
        else
            Utils.assert(false, "not supported rank type:" + rankType);
    }

    doClose;
    public open(rankType:string = "weeklyRank"):Promise<void> {
        this.openRank(rankType);
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    // 周榜单
    public openWeeklyRank() {
    }

    // 角色榜单
    public openRoleRank() {
    }

    // 显示微信好友榜单
    public openWxFriendRank() {
        if (this.wxRankImg) this.rankViewContainer.removeChild(this.wxRankImg);
        var platform = window.platform;
        var bmp = platform.openDataContext.createDisplayObject(null,this.stage.stageWidth, this.stage.stageHeight);
        this.wxRankImg = bmp;
        if (!bmp) return;
        
        this.rankViewContainer.addChild(this.wxRankImg);
        this.wxRankImg.width = this.width;
        this.wxRankImg.height = this.height;
        window.platform.openDataContext.postMessage({"type":"refresh"});
    }
    
    public onCloseBtn(evt:egret.TouchEvent) {
        this.doClose();
    }
}
