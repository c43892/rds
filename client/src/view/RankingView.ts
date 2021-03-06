// 排行榜视图
class RankingView extends egret.DisplayObjectContainer {    

    public usrInfo;
    public weeklyRankInfo;
    public roleRankInfo;

    bg1:egret.Bitmap;
    bg2:egret.Bitmap;
    rankSelfBg:egret.Bitmap;
    rankSelfAvatar:egret.Bitmap;
    rankSelfText:egret.TextField;
    curSelMark:egret.Bitmap;
    closeBtn:ArrowButton;
    tabMenu:egret.TextField[]; // 顶端不同榜单切换
    rankViewScrollArea:egret.ScrollView; // 榜单滚动窗口区域
    rankViewContainer:egret.DisplayObjectContainer; // 榜单区域
    wxRankImg; // 微信好友榜单
    menu = [];
    menuDisplayName = {"weeklyRank":"周榜", "roleRank":"角色榜", "friendRank":"好友榜"};

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;

        // 背景
        this.bg1 = ViewUtils.createBitmapByName("rkBg1_png");
        this.bg1.x = 0;
        this.bg1.y = -30;
        this.bg1.width = this.width;
        this.bg1.fillMode = egret.BitmapFillMode.REPEAT;
        this.bg1.touchEnabled = true;
        this.addChild(this.bg1);

        this.bg2 = ViewUtils.createBitmapByName("rkBg2_png");
        this.bg2.x = 0;
        this.bg2.y = this.bg1.y + this.bg1.height;
        this.bg2.width = this.width;
        this.bg2.height = this.height - this.bg1.height - this.bg1.y;
        this.bg2.fillMode = egret.BitmapFillMode.REPEAT;
        this.bg2.touchEnabled = true;
        this.addChild(this.bg2);

        // 切换按钮
        var menu = window.platform.platformType == "wx" ? ["friendRank"] : ["weeklyRank"/*, "roleRank"*/];
        var x = 80;
        var y = this.bg1.height / 2 + this.bg1.y;
        for (var m of menu) {
            let menuBtn = ViewUtils.createBitmapByName(menu + "Btn_png");
            menuBtn.x = x;
            menuBtn.y = y;
            x += menuBtn.width + 30;
            menuBtn["rankType"] = m;
            this.menu.push(menuBtn);
            this.addChild(menuBtn);
            menuBtn.touchEnabled = true;
            menuBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onMenuSel, this);
        }
        
        // 排名区域
        var top = y + 80;
        this.rankViewScrollArea = new egret.ScrollView();
        this.rankViewScrollArea.verticalScrollPolicy = "auto";
        this.rankViewScrollArea.horizontalScrollPolicy = "off";
        this.rankViewScrollArea.bounces = true;
        this.rankViewScrollArea.x = 0;
        this.rankViewScrollArea.y = top;
        this.rankViewScrollArea.width = this.width;
        this.rankViewScrollArea.height = this.height - top - 30;
        this.addChild(this.rankViewScrollArea);

        this.rankViewContainer = new egret.DisplayObjectContainer();

        // 自己名次部分
        this.rankSelfBg = ViewUtils.createBitmapByName("rankSelfBg_png");
        this.rankSelfBg.anchorOffsetY = this.rankSelfBg.height / 2;
        this.rankSelfBg.x = 0;
        this.rankSelfBg.y = this.height - 200;
        this.addChild(this.rankSelfBg);

        var selfPosY = this.rankSelfBg.y - this.rankSelfBg.anchorOffsetY;
        this.rankSelfAvatar = new egret.Bitmap();
        this.rankSelfAvatar.x = 30;        
        this.rankSelfAvatar.width = this.rankSelfAvatar.height = 120;
        this.rankSelfAvatar.y = selfPosY + 15;
        this.addChild(this.rankSelfAvatar);

        this.rankSelfText = new egret.TextField();
        this.rankSelfText.textAlign = egret.HorizontalAlign.LEFT;
        this.rankSelfText.verticalAlign = egret.VerticalAlign.MIDDLE;
        this.rankSelfText.x = 180;
        this.rankSelfText.y = selfPosY;
        this.rankSelfText.height = this.rankSelfBg.height;
        this.rankSelfText.width = this.rankSelfBg.width - this.rankSelfText.x;
        this.addChild(this.rankSelfText);

        // 关闭按钮
        this.closeBtn = new ArrowButton(false, "goBack_png", 30);
        this.closeBtn.text = ViewUtils.getTipText("goBackBtn");
        this.closeBtn.x = 10;
        this.closeBtn.y = 980;
        this.addChild(this.closeBtn);
        this.closeBtn.onClicked = () => this.onCloseBtn();

        // 红圈圈
        this.curSelMark = ViewUtils.createBitmapByName("rkCurSel_png");
        this.curSelMark.anchorOffsetX = this.curSelMark.width / 2;
        this.curSelMark.anchorOffsetY = this.curSelMark.height / 2;
        this.addChild(this.curSelMark);
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
        rankType = rankType ? rankType : this.menu[0]["rankType"];
        this.menu.forEach((btn, _) => {
            if (btn["rankType"] == rankType) {
                btn.alpha = 1;
                this.curSelMark.x = btn.x + btn.width / 2;
                this.curSelMark.y = btn.y + btn.height / 2;
            } else 
                btn.alpha = 0.5;
            
        });
        this.openRank(rankType);
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    rebuildRank(usrs, meInfo, occupations) { // , fromIndex:number, cnt:number) {
        this.rankViewContainer.removeChildren();
        if (!usrs) return;

        var h = 80;
        var wN = 60;
        var wAvatar = h;
        var wScore = 100;
        var wName = this.width - wAvatar - wN - wScore - 50;
        this.rankViewContainer.height = 20;
        var usrSelf = undefined; // 自己在排行榜中的信息
        var usrSelfRanking = -1; // 自己在排行榜中的位置

        for (var i = 0; i < usrs.length; i++) {
            var usr = usrs[i];
            if (!usr || !usr.uid || usr.uid == "") // no more user
                break;

            if (!usrSelf && usr.uid == window.platform.getUserID()) {
                usrSelf = usr;
                usrSelfRanking = i;
            }

            var y = this.rankViewContainer.height;

            // 名次
            var n = ViewUtils.createTextField(30, 0x000000);
            n.x = 30;
            n.y = y;
            n.width = wN;
            n.height = h;
            n.text = (i+1).toString();
            this.rankViewContainer.addChild(n);

            // 职业头像
            var occ = occupations[i];
            var avatar = ViewUtils.createBitmapByName(occ ? occ + "_png" : undefined);
            avatar.x = n.x + n.width + 10;
            avatar.y = y;
            avatar.width = wAvatar;
            avatar.height = h;
            this.rankViewContainer.addChild(avatar);

            // 名字
            var name = ViewUtils.createTextField(30, 0x000000, false);
            name.x = avatar.x + avatar.width + 10;
            name.y = y;
            name.width = wName;
            name.height = h;
            name.text = usr.name.length >= 2 ? usr.name.substring(1, usr.name.length - 1) : "";
            this.rankViewContainer.addChild(name);

            // 分数
            var score = ViewUtils.createTextField(30, 0x000000);
            score.x = name.x + name.width + 10;
            score.y = y;
            score.width = wScore;
            score.height = h;
            score.text = usr.score.toString();
            this.rankViewContainer.addChild(score);

            // 间隔线
            var ln = ViewUtils.createBitmapByName("rankLine1_png");
            ln.x = 0;
            ln.y = y - 15;
            ln.width = this.rankViewContainer.width;
            ln.height = h + 10;
            this.rankViewContainer.addChild(ln);

            // 皇冠
            if (i < 3) {
                var crown = ViewUtils.createBitmapByName("rankUsr" + (i+1) + "_png");
                crown.x = n.x;
                crown.y = n.y;
                this.rankViewContainer.addChild(crown);
            }

            this.rankViewContainer.height = score.y + score.height + 10;
        }

        var ln = ViewUtils.createBitmapByName("rankLine2_png");
        ln.x = 0;
        ln.y = y + h - 15;
        ln.width = this.rankViewContainer.width;
        this.rankViewContainer.addChild(ln);

        this.rankViewContainer.height += 200;
        this.rankViewScrollArea.touchEnabled = true;
        this.rankViewScrollArea.scrollTop = 0;
        this.rankViewScrollArea.setContent(this.rankViewContainer);

        // 自己的名次
        if (usrSelf) {
            ViewUtils.setTexName(this.rankSelfAvatar, occupations[usrSelfRanking] + "_png", false);
            var txt = ViewUtils.getTipText("scoreInRank").replace("{score}", usrSelf.score).replace("{ranking}", usrSelfRanking + 1);
            this.rankSelfText.textFlow = ViewUtils.fromHtml(txt);
        } else {
            ViewUtils.setTexName(this.rankSelfAvatar, undefined, false);
            var txt = ViewUtils.getTipText("notInRank").replace("{score}", meInfo && meInfo.score ? meInfo.score : 0);
            this.rankSelfText.textFlow = ViewUtils.fromHtml(txt);
        }
    }

    // 周榜单
    public openWeeklyRank() {
        this.rebuildRank(this.weeklyRankInfo.usrs, this.weeklyRankInfo.usr, this.weeklyRankInfo.occupations);
    }

    // 角色榜单
    public openRoleRank() {
        this.rebuildRank(this.roleRankInfo.usrs, this.weeklyRankInfo.usr, this.weeklyRankInfo.occupations);
    }

    MaxNumInRank = 100; // 最多显示多少条目
    PerItemHeight = 100; // 每条目占高度

    // 显示微信好友榜单
    public openWxFriendRank() {
        if (this.wxRankImg) this.rankViewScrollArea.removeChild(this.wxRankImg);

        var platform = window.platform;
        var bmp:egret.Bitmap = platform.openDataContext.createDisplayObject(null, 
            this.rankViewScrollArea.width, 
            this.MaxNumInRank * this.PerItemHeight);

        if (!bmp)
            return;

        window.platform.openDataContext.postMessage({"type":"refresh", pageIndex:0});
        this.loopChecker(bmp);
    }

    async loopChecker(bmp:egret.Bitmap) {
        this.rankViewScrollArea.verticalScrollPolicy = "off";

        while (!bmp.hitTestPoint(50, this.PerItemHeight / 2, true))
            await AniUtils.delay(50);

        for (var i = this.PerItemHeight / 2; i < bmp.height; i += this.PerItemHeight) {
            if (!bmp.hitTestPoint(50, i, true)) {
                this.rankViewScrollArea.setContent(bmp);
                bmp.height = i;
                break;
            }
        }

        bmp.fillMode = egret.BitmapFillMode.CLIP;
        this.rankViewScrollArea.verticalScrollPolicy = "auto";
    }
    
    public onCloseBtn() {
        this.doClose();
    }
}
