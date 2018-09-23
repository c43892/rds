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

    tapOrPressPrepare(target:egret.DisplayObject, offset = {x:0, y:0}) {
        this.tapTarget = target;
        var targetPos = target.localToGlobal();

        this.tapArea.x = targetPos.x + offset.x;
        this.tapArea.y = targetPos.y + offset.y;

        var maskContainer = new egret.DisplayObjectContainer();
        this.tapArea.alpha = 1;
        this.tapArea.blendMode = egret.BlendMode.ERASE;
        this.tapArea.scaleX = this.tapArea.scaleY = 1.5;
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

    // 新手指引1
    async rookiePlay1(bt:Battle) {
        await AniUtils.wait4click();
        await this.showDialog("Nurse", "护士", "让我告诉你基本的规则，首先地上的数字表示它周围8个格子里怪物的数量。来，跟着我点击这个地块", 0, 200, true);
    }

    // 新手指引2
    async rookiePlay2(bt:Battle) {
        await AniUtils.delay(1000);
        await this.tapGrid(0, 0);
        await this.showDialog("Nurse", "护士", "做的不错，你发现了一把匕首，当你无法确定时，可以用匕首来探路", 0, 200, true);
        await this.showDialog("Nurse", "护士", "捡起匕首，我们来用它探路", 0, 200, true);
        await this.tapGrid(0, 0);
        await this.showDialog("Nurse", "护士", "你看来很适合使用匕首，那攻击那个格子吧，说不定有惊喜哦", 0, 200, true);
        await this.tapSelGrid(0, 1);
        await this.showDialog("GoblinThief", "哥布林", "什么人？", 140, 500, false);
        await this.showDialog("GoblinThief", "哥布林", "好多年没有闻到这么新鲜的味道了，闯入者，这片地牢里，我就是不死的存在，你每遇到一个新的我，都会是更强的存在，加入我们吧", 140, 500, false);
        await this.showDialog("Nurse", "护士", "你看他多丑，快痛快解决了这一切", 0, 200, true);
        await this.tapGrid(0, 1);
        await this.showDialog("GoblinThief", "哥布林", "啊，我的眼睛，魔王的战士会再次归来的！", 140, 500, false);
        await this.showDialog("Nurse", "护士", "怪物各有特点，你可以长按已经发现的怪物来了解它们", 0, 200, true);
        await this.showDialog("Nurse", "护士", "注意右上角那里，每当你遇到新的怪物，这里会有提醒哦", 0, 200, true);
        await this.showDialog("Nurse", "护士", "继续探索，当你发现门并且打开它之后，你就有机会离开地牢，或者进入下一层，让我们前进吧", 0, 200, true);
    }
}
