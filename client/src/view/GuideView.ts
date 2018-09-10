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
        bt.registerEvent("onStartupRegionUncovered", async (ps) => {
            var bt = ps.bt;
            if (bt.btType == "rookiePlay")
                await this.rookiePlay(ps.bt)
        });
    }

    // 点击指引

    tapBg:egret.Bitmap;
    tapTarget:egret.DisplayObject;
    tapFrameAni:egret.MovieClip;
    tapArea:egret.Bitmap;
    buildTap() {
        this.tapBg = new egret.Bitmap();
        this.tapBg.touchEnabled = true;
        this.tapFrameAni = ViewUtils.createFrameAni("effWantedOrder");
        this.tapFrameAni.play(-1);
        
        this.tapArea = ViewUtils.createBitmapByName("guideTapArea_png");
        this.tapArea.anchorOffsetX = this.tapArea.width / 2;
        this.tapArea.anchorOffsetY = this.tapArea.height / 2;
        this.tapArea.touchEnabled = true;
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_TAP, this.touchTap, this);
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchMove, this);
        this.tapArea.addEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);
    }

    tapOrPressPrepare(target:egret.DisplayObject, offset = {x:0, y:0}) {
        this.tapTarget = target;
        var targetPos = target.localToGlobal();

        this.tapArea.x = targetPos.x + offset.x;
        this.tapArea.y = targetPos.y + offset.y;

        var maskContainer = new egret.DisplayObjectContainer();
        this.tapArea.alpha = 1;
        this.tapArea.blendMode = egret.BlendMode.ERASE;
        maskContainer.addChild(this.bg);
        maskContainer.addChild(this.tapArea);

        var rt = new egret.RenderTexture();
        rt.drawToTexture(maskContainer);
        ViewUtils.setTex(this.tapBg, rt);

        this.tapArea.alpha = 0;
        this.tapArea.blendMode = egret.BlendMode.NORMAL;
        this.addChild(this.tapBg);
        this.addChild(this.tapFrameAni);
        this.addChild(this.tapArea);
        this.tapFrameAni.x = targetPos.x + offset.x;
        this.tapFrameAni.y = targetPos.y + offset.y;

        return () => {
            this.removeChild(this.tapBg);
            this.removeChild(this.tapFrameAni);
            this.removeChild(this.tapArea);
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
            };
        });
    }

    // 指引长按
    public async press(target, offset = {x:0, y:0}) {
        this.forGuideType = "press";
        var rev = this.tapOrPressPrepare(target, offset);
        return new Promise<void>((r, _) => {
            target.notifyLongPressed = () => {
                rev();
                r();
            };
        });
    }

    // 指引点击地图格子
    public async tapGrid(gx:number, gy:number) {
        var g = this.bv.mapView.getGridViewAt(gx, gy);
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
        this.dlgFrame.width = 500;
        this.dlgFrame.height = 400;

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
    }

    // 显示对话内容
    async showDialog(tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var avatarImg1 = <egret.Bitmap>this.dlgFrame.getChildByName("avatarImg1");
        var avatarName1 = <egret.TextField>this.dlgFrame.getChildByName("avatarName1");
        var avatarImg2 = <egret.Bitmap>this.dlgFrame.getChildByName("avatarImg2");
        var avatarName2 = <egret.TextField>this.dlgFrame.getChildByName("avatarName2");
        var content = <egret.TextField>this.dlgFrame.getChildByName("content");

        if (onLeft) {
            ViewUtils.setTexName(avatarImg1, tex + "_png");
            avatarName1.text = name;
            avatarImg1.alpha = 1;
            avatarImg1.scaleX = flipAvatar ? -1 : 1;
            avatarName1.alpha = 1;
            avatarImg2.alpha = 0;
            avatarName2.alpha = 0;
        } else {
            ViewUtils.setTexName(avatarImg2, tex + "_png");
            avatarName2.text = name;
            avatarImg2.alpha = 1;
            avatarImg2.scaleX = flipAvatar ? -1 : 1;
            avatarName2.alpha = 1;
            avatarImg1.alpha = 0;
            avatarName1.alpha = 0;
        }
        
        content.textFlow = ViewUtils.fromHtml(str);

        this.addChild(this.bg);
        this.addChild(this.dlgFrame);
        this.dlgFrame.x = x;
        this.dlgFrame.y = y;
        return new Promise<void>((r, _) => {
            this.onBgClicked = (evt:egret.TouchEvent) => {
                this.removeChild(this.bg);
                this.removeChild(this.dlgFrame);
                r();
            };
        });
    }

    // 各种引导流程

    // 测试对话
    public async test(target) {
    }

    // 新手指引
    async rookiePlay(bt:Battle) {
        await AniUtils.wait4click(); // 等待点击
        await this.showDialog("Nurse", "护士", "我是护士，我让你点哪里就点哪里", 0, 200, true);
        // await this.tapGrid(0, 0);
        await this.pressGrid(0, 0);
        await this.showDialog("GoblinThief", "哥布林", "啊啊！干得好！", 140, 500, false);
    }
}
