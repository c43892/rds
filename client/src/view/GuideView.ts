// 指引视图
class GuideView extends egret.DisplayObjectContainer {
    wmv:WorldMapView;
    bv:BattleView;
    
    bg:egret.Bitmap;
    public constructor(w, h, wmv, bv) {
        super();
        this.name = "guide";
        this.width = w;
        this.height = h;
        this.wmv = wmv;
        this.bv = bv;

        // 背景响应点击
        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickBg, this);

        this.buildDialog();
        this.buildTap();
    }

    onBgClicked;
    onClickBg(evt:egret.TouchEvent) {
        if (this.onBgClicked) {
            this.onBgClicked(evt);
            this.onBgClicked = undefined;
        }
    }

    onTapped;
    touchTap(evt:egret.TouchEvent) {
        if (this.onTapped) {
            this.onTapped(evt);
            this.onTapped = undefined;
        }
    }

    onLongPressed;
    touchBegin(evt:egret.TouchEvent) {
        if (this.forGuideType != "press") return;
        egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_BEGIN,
            evt.bubbles, evt.cancelable,
            evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
    }

    touchMove(evt:egret.TouchEvent) {
        if (this.forGuideType != "press") return;
        egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_MOVE,
            evt.bubbles, evt.cancelable,
            evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
    }

    touchEnd(evt:egret.TouchEvent) {
        if (this.forGuideType != "press") return;
        egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_END,
            evt.bubbles, evt.cancelable,
            evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
    }

    // 注册所有可能触发指引的事件
    public registerEvents(bt:Battle) {
        bt.registerEvent("onLevelInited", async (ps) => {
            var bt = ps.bt;
            if (bt.btType == "rookiePlay")
                await this.rookiePlay1(ps.bt)
        });

        bt.registerEvent("onStartupRegionUncovered", async (ps) => {
            var bt = ps.bt;
            if (bt.btType == "rookiePlay")
                await this.rookiePlay2(ps.bt)
        });
    }

    // 点击指引

    tapBg:egret.Bitmap;
    tapTarget:egret.DisplayObject;
    tapFrameAni:egret.MovieClip;
    tapArea:egret.Bitmap;
    hand:egret.Bitmap;
    buildTap() {
        this.tapBg = new egret.Bitmap();
        this.tapBg.touchEnabled = true;
        this.tapFrameAni = ViewUtils.createFrameAni("effGuideTap");
        this.tapFrameAni.play(-1);
        
        this.tapArea = ViewUtils.createBitmapByName("guideTapArea_png");
        this.tapArea.anchorOffsetX = this.tapArea.width / 2;
        this.tapArea.anchorOffsetY = this.tapArea.height / 2;
        this.tapArea.touchEnabled = true;
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_TAP, this.touchTap, this);
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchMove, this);
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);

        this.hand = ViewUtils.createBitmapByName("guideHand_png");
    }

    rt = new egret.RenderTexture();
    tapOrPressPrepare(target:egret.DisplayObject, offset = {x:0, y:0}) {
        this.tapTarget = target;
        var targetPos = target.localToGlobal();

        this.tapArea.x = targetPos.x + offset.x;
        this.tapArea.y = targetPos.y + offset.y;

        var maskContainer = new egret.DisplayObjectContainer();
        this.tapArea.alpha = 1;
        this.tapArea.blendMode = egret.BlendMode.ERASE;
        this.tapArea.scaleX = this.tapArea.scaleY = 1.5;
        this.bg.alpha = 0.5;        
        maskContainer.addChild(this.bg);
        maskContainer.addChild(this.tapArea);

        this.rt.drawToTexture(maskContainer);
        ViewUtils.setTex(this.tapBg, this.rt);

        this.tapArea.alpha = 0;
        this.tapArea.blendMode = egret.BlendMode.NORMAL;
        this.addChild(this.tapBg);
        this.addChild(this.tapFrameAni);
        this.addChild(this.tapArea);
        this.tapFrameAni.x = targetPos.x + offset.x;
        this.tapFrameAni.y = targetPos.y + offset.y;

        this.addChild(this.hand);
        this.hand.x = this.tapFrameAni.x;
        this.hand.y = this.tapFrameAni.y;
        this.hand.scaleX = this.hand.scaleY = 1;
        egret.Tween.removeTweens(this.hand);
        egret.Tween.get(this.hand, {loop:true})
            .to({"scaleX":1.2, "scaleY":1.2}, 500, egret.Ease.cubicOut)
            .to({"scaleX":1, "scaleY":1}, 500, egret.Ease.cubicIn);

        return () => {
            this.removeChild(this.tapBg);
            this.removeChild(this.tapFrameAni);
            this.removeChild(this.tapArea);
            this.removeChild(this.hand);
            this.bg.parent.removeChild(this.bg);
        };
    }

    forGuideType = undefined; // "tap", "press"

    // 指引点击
    public async tap(target:egret.DisplayObject, offset = {x:0, y:0}) {
        this.forGuideType = "tap";
        var rev = this.tapOrPressPrepare(target, offset);
        return new Promise<void>((r, _) => {
            this.onTapped = (evt:egret.TouchEvent) => {
                if (this.forGuideType != "tap" || !this.tapTarget.hitTestPoint(evt.stageX, evt.stageY)) return;
                rev();
                egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_TAP,
                    evt.bubbles, evt.cancelable,
                    evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
                r();
                this.onTapped = undefined; 
            };
        });
    }

    // 指引长按
    public async press(target, offset = {x:0, y:0}) {
        this.forGuideType = "press";
        var rev = this.tapOrPressPrepare(target, offset);
        return new Promise<void>((r, _) => {
            target.notifyLongPressed = (targetResetOp) => {
                rev();
                r();
                target.notifyLongPressed = undefined;
                if (targetResetOp)
                    targetResetOp();
            };
        });
    }

    // 指引点击地图格子
    public async tapGrid(gx:number, gy:number) {
        var g = this.bv.mapView.getGridViewAt(gx, gy);
        await this.tap(g, {x:g.width/2, y:g.height/2});
    }

    // 指引点击地图上的目标选择格子
    public async tapSelGrid(gx:number, gy:number) {
        var g = this.bv.selView.getGridByPos(gx, gy);
        await this.tap(g, {x:g.width/2, y:g.height/2});
    }

    // 指引点击格子物品
    public async tapProp(n:number) {
        var g = this.bv.propsView.getPropViewByIndex(n);
        await this.tap(g, {x:g.width/2, y:g.height/2});
    }

    // 指引长按地图格子
    public async pressGrid(gx:number, gy:number) {
        var g = this.bv.mapView.getGridViewAt(gx, gy);
        await this.press(g, {x:g.width/2, y:g.height/2});
    }

    // 剧情对话
    dlgFrame:egret.DisplayObjectContainer;
    buildDialog() {
        this.dlgFrame = new egret.DisplayObjectContainer();
        this.dlgFrame.name = "guideDlgFrame";

        var bg = ViewUtils.createBitmapByName("confirmBg_png");
        bg.name = "bg";

        var avatarImg1 = new egret.Bitmap();
        avatarImg1.name = "avatarImg1";
        avatarImg1.anchorOffsetX = avatarImg1.width / 2;
        var avatarName1 = ViewUtils.createTextField(30, 0xffffff);
        avatarName1.name = "avatarName1";
        avatarName1.textAlign = egret.HorizontalAlign.LEFT;
        avatarName1.verticalAlign = egret.VerticalAlign.MIDDLE;

        var avatarImg2 = new egret.Bitmap();
        avatarImg2.name = "avatarImg2";
        avatarImg2.anchorOffsetX = avatarImg2.width / 2;
        var avatarName2 = ViewUtils.createTextField(30, 0xffffff);
        avatarName2.name = "avatarName2";
        avatarName2.textAlign = egret.HorizontalAlign.RIGHT;
        avatarName2.verticalAlign = egret.VerticalAlign.MIDDLE;

        var content = ViewUtils.createTextField(30, 0xffffff);
        content.name = "content";
        content.textAlign = egret.HorizontalAlign.LEFT;
        content.verticalAlign = egret.VerticalAlign.MIDDLE;

        var objs = [bg, avatarImg1, avatarName1, avatarImg2, avatarName2, content];
        objs.forEach((obj, _) => this.dlgFrame.addChild(obj));
        ViewUtils.multiLang(this.dlgFrame, ...objs);
        this.dlgFrame.width = this.bg.width;
        this.dlgFrame.height = this.bg.height;
    }

    // 构建对话内容
    makeDialog(tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        if (Occupation.exists(tex)) {

        }
        
        var avatarImg1 = <egret.Bitmap>this.dlgFrame.getChildByName("avatarImg1");
        var avatarName1 = <egret.TextField>this.dlgFrame.getChildByName("avatarName1");
        var avatarImg2 = <egret.Bitmap>this.dlgFrame.getChildByName("avatarImg2");
        var avatarName2 = <egret.TextField>this.dlgFrame.getChildByName("avatarName2");
        var content = <egret.TextField>this.dlgFrame.getChildByName("content");

        if (onLeft) {
            //ViewUtils.setTexName(avatarImg1, tex + "_png");
            avatarName1.text = name;
            avatarImg1.alpha = 1;
            avatarImg1.scaleX = flipAvatar ? -1 : 1;
            avatarName1.alpha = 1;
            avatarImg2.alpha = 0;
            avatarName2.alpha = 0;
        } else {
            //ViewUtils.setTexName(avatarImg2, tex + "_png");
            avatarName2.text = name;
            avatarImg2.alpha = 1;
            avatarImg2.scaleX = flipAvatar ? -1 : 1;
            avatarName2.alpha = 1;
            avatarImg1.alpha = 0;
            avatarName1.alpha = 0;
        }
        
        content.textFlow = ViewUtils.fromHtml(str);
        this.addChild(this.dlgFrame);
        this.dlgFrame.x = x;
        this.dlgFrame.y = y;

        return () => {
            this.removeChild(this.dlgFrame);
        };
    }

    // 显示对话内容
    async showDialog(tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        this.bg.alpha = 0;
        this.addChild(this.bg);
        var rev = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);
        return new Promise<void>((r, _) => {
            this.onBgClicked = (evt:egret.TouchEvent) => {
                this.removeChild(this.bg);
                rev();
                r();
            };
        });
    }
    
    // 指引长按同时有对话框
    async pressGridWithDialog(gx, gy, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        this.forGuideType = "press";
        var g = this.bv.mapView.getGridViewAt(gx, gy);
        var rev1 = this.tapOrPressPrepare(g, {x:g.width/2, y:g.height/2});
        var rev2 = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);

        g.notifyLongPressed = (targetResetOp) => {
            rev2();
            rev1();
            g.notifyLongPressed = undefined;
            if (targetResetOp)
                targetResetOp();
        };

        return new Promise<void>((r, _) => {
            g.notifyLongPressedEnded = () => {
                g.notifyLongPressedEnded = undefined;
                r();
            };
        });
    }

    async tapWithDialog(target, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var rev1 = this.tapOrPressPrepare(target, {x:target.width/2, y:target.height/2});
        var rev2 = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);

        return new Promise<void>((r, _) => {
            this.onTapped = (evt:egret.TouchEvent) => {
                if (this.forGuideType != "tap" || !this.tapTarget.hitTestPoint(evt.stageX, evt.stageY)) return;
                rev2();
                rev1();
                egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_TAP,
                    evt.bubbles, evt.cancelable,
                    evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
                r();
                this.onTapped = undefined; 
            };
        });
    }

    // 指引点击同时有对话框
    async tapGridWithDialog(gx, gy, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        this.forGuideType = "tap";
        var g = this.bv.mapView.getGridViewAt(gx, gy);
        await this.tapWithDialog(g, tex, name, str, x, y, onLeft, flipAvatar);
    }

    // 指引点击地图上的目标选择格子同时有对话
    public async tapSelGridWithDialog(gx:number, gy:number, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var g = this.bv.selView.getGridByPos(gx, gy);
        await this.tapWithDialog(g, tex, name, str, x, y, onLeft, flipAvatar);
    }

    // 指引点击格子物品同时有对话
    public async tapPropWithDialog(n:number, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var g = this.bv.propsView.getPropViewByIndex(n);
        await this.tapWithDialog(g, tex, name, str, x, y, onLeft, flipAvatar);
    }

    // 各种引导流程

    // 测试对话
    public async test(target) {
    }

    // 新手指引1
    async rookiePlay1(bt:Battle) {
        await AniUtils.wait4click();
        await this.showDialog("Nurse", "护士", "！！！", 0, 200, true);
        await this.showDialog("Nurse", "护士", "你怎么跑到这里来了", 0, 200, true);
        await this.showDialog("Nurse", "护士", "这是魔王的地牢，每一层都有很多怪物看守", 0, 200, true);
        await this.showDialog("Nurse", "护士", "现在你可以看到怪物和一些可以使用的道具，门后面是出口", 0, 200, true);
        await this.showDialog("Nurse", "护士", "但是你永远无法知道出口是离开地牢还是通往下一层", 0, 200, true);
    }

    // 新手指引2
    async rookiePlay2(bt:Battle) {
        await AniUtils.delay(1000);
        await this.showDialog("Nurse", "护士", "让我告诉你一些基本规则", 0, 200, true);
        await this.showDialog("Nurse", "护士", "地上的数字表示它周围8个格子里隐藏的怪物的数量", 140, 500, true);
        await this.showDialog("Nurse", "护士", "点击就可以打开格子", 0, 200, true);
        await this.tapGridWithDialog(0, 0, "Nurse", "护士", "跟着我点击闪光的格子", 140, 500, true);
        // await this.pressGridWithDialog(0, 2, "GoblinThief", "哥布林", "我就测试一下说话的同时指引点击", 140, 500, true);
        await this.showDialog("Nurse", "护士", "做的不错，你发现了一把匕首，当你无法确定时，可以用匕首来探路", 140, 500, true);
        await this.tapGridWithDialog(0, 0, "Nurse", "护士", "捡起匕首，我们来用它探路", 140, 500, true);
        await this.tapSelGridWithDialog(0, 1, "Nurse", "护士", "好的，你成功了！下来让我们攻击一个格子", 140, 500, true);
        await this.showDialog("Nurse", "护士", "看来我们遇到了对手", 140, 500, true);
        await this.showDialog("Nurse", "护士", "怪物的详细信息可以通过长按来查看", 140, 500, true);
        await this.pressGridWithDialog(0, 1, "Nurse", "护士", "来尝试一下吧", 140, 500, true)
        await this.tapGridWithDialog(0, 1, "Nurse", "护士", "让我们尝试攻击一下它", 140, 500, true);
        await this.showDialog("GoblinThief", "哥布林", "啊，我的眼睛，魔王的战士会再次归来的！", 140, 500, false);
        await this.showDialog("Nurse", "护士", "魔王的手下遍布地牢，谨慎的向前探索吧，勇士", 0, 200, true);
    }
}
