// 指引视图
class GuideView extends egret.DisplayObjectContainer {
    wmv:WorldMapView;
    bv:BattleView;
    cv:CharacterView;
    
    bg:egret.Bitmap;
    public constructor(w, h, wmv, bv, cv) {
        super();
        this.name = "guide";
        this.width = w;
        this.height = h;
        this.wmv = wmv;
        this.bv = bv;
        this.cv = cv;

        // 背景响应点击
        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickBg, this);

        this.buildDialog();
        this.buildGeneral();
        this.buildTap();
        this.buildSlide();
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
        if (this.onTapped)
            this.onTapped(evt);
    }

    onLongPressed;
    touchBegin(evt:egret.TouchEvent) {
        if (this.forGuideType != "press") return;
        if (this.tapTarget instanceof GridView)
            GridView.onEvent(this.tapTarget, "onTouchBegin", evt);
        else
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
        if (this.tapTarget instanceof GridView) {
            evt.data = {noTap:true};
            GridView.onEvent(this.tapTarget, "onTouchEnd", evt);
        }
        else
            egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_END,
                evt.bubbles, evt.cancelable,
                evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
    }

    // 注册所有可能触发指引的事件
    public registerEvents(bt:Battle) {
        bt.registerEvent("onLevelInited", async (ps) => {
            var bt = ps.bt;
            if (bt.btType == "rookiePlay_1")
                await this.rookiePlay1(ps.bt) // 新手指引1
            else if (bt.btType == "rookiePlay_5") // 新手指引5
                await this.rookiePlay5(bt);
        });

        bt.registerEvent("onStartupRegionUncovered", async (ps) => {
            var bt = ps.bt;
            var av = <AniView>AniUtils.ac;
            if (bt.btType == "rookiePlay_1") {
                av.addBlockLayer();
                var tid;
                tid = egret.setTimeout(async () => {
                    av.decBlockLayer();
                    egret.clearTimeout(tid);
                    await this.rookiePlay2(ps.bt);
                }, this, 1000);
            }
        });

        // 被怪物突袭指引
        bt.registerEvent("onSneaked", async (ps) => {
            var m = ps.m; // 突袭怪物
            var immunized = ps.immunized; // 是否被免疫
            if (immunized || !Utils.checkRookiePlay())
                return;

            // 检查指引标记
            if (Utils.loadLocalData("onSneakedGuideFinished"))
                return;

            await this.onSneakedGuide(m);

            // 存一下指引标记
            Utils.saveLocalData("onSneakedGuideFinished", true);
        });

        // 怪物被标记指引
        bt.registerEvent("onGridChanged", async (ps) => {
            var subType = ps.subType;
            if (subType != "elemMarked" || !Utils.checkRookiePlay())
                return;

            var e = ps.e;
            if (!(e instanceof Monster)) // 只算标记怪
                return;

            // 检查指引标记
            if (Utils.loadLocalData("onMonsterMarkedGuideFinished"))
                return;

            await this.onMonsterMarkedGuide(e);

            // 存一下指引标记
            Utils.saveLocalData("onMonsterMarkedGuideFinished", true);
        });

        // 遗物出现
        bt.registerEvent("onRelicChanged", async (ps) => {
            var subType = ps.subType;
            if (subType != "addRelicBySel")
                return;

            var e:Elem = ps.e;
            var bt = e.bt();
            if (bt.btType != "rookiePlay_5")
                return;

            await this.openAvatarView();
        });
    }

    // 点击指引
    
    hand:egret.Bitmap;
    rt = new egret.RenderTexture();
    buildGeneral() {
        this.hand = ViewUtils.createBitmapByName("guideHand_png");
    }

    tapBg:egret.Bitmap;
    tapTarget:egret.DisplayObject;
    tapFrameAni:egret.MovieClip;
    tapArea:egret.Bitmap;
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
    }

    // 滑动指引
    slideBg:egret.Bitmap;
    slideArea:egret.Bitmap;
    buildSlide() {
        this.slideBg = new egret.Bitmap();
        this.slideBg.touchEnabled = true;
        this.slideBg.pixelHitTest = true;
        this.slideArea = ViewUtils.createBitmapByName("guideSlideArea_png");
        this.slideArea.scale9Grid = new egret.Rectangle(84, 84, this.slideArea.width - 168, this.slideArea.height - 168);
    }

    tapOrPressPrepare(target:egret.DisplayObject, tapOrPress:boolean, offset = {x:0, y:0}) {
        this.tapTarget = target;
        var targetPos = AniUtils.ani2global(target);
        
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

        if (tapOrPress) { // tap
            this.hand.anchorOffsetX = this.hand.anchorOffsetY = 0;
            this.hand.rotation = 0;
            egret.Tween.get(this.hand, {loop:true})
                .to({"scaleX":1.2, "scaleY":1.2}, 500, egret.Ease.cubicOut)
                .to({"scaleX":1, "scaleY":1}, 500, egret.Ease.cubicIn);
        } else { // press
            this.hand.anchorOffsetX = this.hand.anchorOffsetY = 10;
            this.hand.rotation = 30;
            egret.Tween.get(this.hand, {loop:true})
                .to({"rotation":-30}, 1000, egret.Ease.cubicOut)
                .to({"rotation":30}, 1000, egret.Ease.cubicIn)
        }

        return () => {
            this.removeChild(this.tapBg);
            this.removeChild(this.tapFrameAni);
            this.removeChild(this.tapArea);
            this.removeChild(this.hand);
        };
    }

    slideGridsPrepare(fromTarget:egret.DisplayObject, distance:number, dir, gridSize) {
        var fromPos = AniUtils.ani2global(fromTarget);
        fromPos.x += gridSize.w / 2;
        fromPos.y += gridSize.h / 2;
        this.slideArea.anchorOffsetX = this.slideArea.anchorOffsetY = 42;
        this.slideArea.x = fromPos.x;
        this.slideArea.y = fromPos.y;
        this.slideArea.width = distance * gridSize.w;
        this.slideArea.rotation = dir * 90;

        var maskContainer = new egret.DisplayObjectContainer();
        this.slideArea.alpha = 1;
        this.slideArea.blendMode = egret.BlendMode.ERASE;
        this.bg.alpha = 0.5;
        maskContainer.addChild(this.bg);
        maskContainer.addChild(this.slideArea);

        this.rt.drawToTexture(maskContainer);
        ViewUtils.setTex(this.slideBg, this.rt);
        this.addChild(this.slideBg);

        this.addChild(this.hand);
        var handFromPos = {x:fromPos.x, y:fromPos.y};
        var handToPos = {x:handFromPos.x, y:handFromPos.y};
        if (dir == 0) {
            // handFromPos.x += gridSize.w / 2;
            // handFromPos.y += gridSize.h / 2;
            handToPos = {x:handFromPos.x + (distance - 1) * gridSize.w, y:handFromPos.y};
        }
        else if (dir == 1) {
            // handFromPos.x -= gridSize.w / 2;
            // handFromPos.y += gridSize.h / 2;
            handToPos = {x:handFromPos.x, y:handFromPos.y + (distance - 1) * gridSize.h};
        }
        else if (dir == 2)
            handToPos = {x:handFromPos.x - (distance - 1) * gridSize.w, y:handFromPos.y};
        else
            handToPos = {x:handFromPos.x, y:handFromPos.y - (distance - 1) * gridSize.h};

        this.hand.x = handFromPos.x;
        this.hand.y = handFromPos.y;
        this.hand.scaleX = this.hand.scaleY = 1;
        egret.Tween.removeTweens(this.hand);

        this.hand.scaleX = this.hand.scaleY = 1.2;
        egret.Tween.get(this.hand, {loop:true})
                .to({"scaleX":1, "scaleY":1}, 500, egret.Ease.cubicIn)
                .to({"x":handToPos.x, "y":handToPos.y}, distance * 500)
                .to({"scaleX":1.2, "scaleY":1.2}, 500, egret.Ease.cubicOut)
                .to({"x":handFromPos.x, "y":handFromPos.y}, distance * 250);
        
        return () => {
            this.removeChild(this.slideBg);
            this.removeChild(this.hand);
        };
    }

    forGuideType = undefined; // "tap", "press", "slide"

    // 指引点击
    public async tap(target:egret.DisplayObject, offset = {x:0, y:0}) {
        this.forGuideType = "tap";
        return new Promise<void>((r, _) => {
            var rev;
            this.onTapped = (evt:egret.TouchEvent) => {
                if (this.forGuideType != "tap" || !this.tapTarget.hitTestPoint(evt.stageX, evt.stageY)) return;
                rev();

                if (target instanceof GridView) {
                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_BEGIN,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_END,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
                } else
                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_TAP,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
                r();
                this.onTapped = undefined; 
            };

            rev = this.tapOrPressPrepare(target, true, offset);
        });
    }

    // 指引长按
    public async press(target, offset = {x:0, y:0}) {
        this.forGuideType = "press";
        return new Promise<void>((r, _) => {
            var rev;
            target.notifyLongPressed = (targetResetOp) => {
                rev();
                r();
                target.notifyLongPressed = undefined;
                if (targetResetOp)
                    targetResetOp();
            };

            rev = this.tapOrPressPrepare(target, false, offset);
        });
    }

    // 指引点击地图格子
    public async tapGrid(gx:number, gy:number) {
        var g = this.bv.mapView.getGridViewAt(gx, gy);
        await this.tap(g, {x:g.width/2, y:g.height/2});
    }

    // 指引点击地图上的目标选择格子
    public async tapSelGrid(gx:number, gy:number) {
        await Utils.waitUtil(() => this.bv.selView.parent != null);
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

    // 指引滑动打开一条格子
    public async slide2OpenGrids(fgx:number, fgy:number, tgx:number, tgy:number) {
        Utils.assert((fgx != tgx || fgy != tgy) && (fgx == tgx || fgy == tgy), "only horizental or vertical slide track is supported");
        var dir = (fgy == tgy) ? (tgx > fgx ? 0 : 2) : (tgy > fgy ? 1 : 3);
        var dist = ((fgy == tgy) ? Math.abs(fgx - tgx) : Math.abs(fgy - tgy)) + 1;

        var fg = this.bv.mapView.getGridViewAt(fgx, fgy);
        var rev = this.slideGridsPrepare(fg, dist, dir, {w:fg.width, h:fg.height});

        await Utils.waitUtil(() => {
            var dx = 0;
            var dy = 0;
            if (dir == 0)
                dx = 1;
            else if (dir == 1)
                dy = 1;
            else if (dir == 2)
                dx = -1;
            else
                dy = -1;

            var p = {x:fgx, y:fgy};
            while (p.x != tgx || p.y != tgy) {
                var g = this.bv.mapView.getGridViewAt(p.x, p.y);
                if (g.getGrid().isCovered())
                    return false;

                p = {x:p.x + dx, y:p.y + dy};
            }

            return true;
        });

        rev();
    }

    // 指引滑动打开一条格子
    public async slide2DragItem(fgx:number, fgy:number, tgx:number, tgy:number) {
        Utils.assert((fgx != tgx || fgy != tgy) && (fgx == tgx || fgy == tgy), "only horizental or vertical slide track is supported");
        var dir = (fgy == tgy) ? (tgx > fgx ? 0 : 2) : (tgy > fgy ? 1 : 3);
        var dist = ((fgy == tgy) ? Math.abs(fgx - tgx) : Math.abs(fgy - tgy)) + 1;

        var fg = this.bv.mapView.getGridViewAt(fgx, fgy);
        var rev = this.slideGridsPrepare(fg, dist, dir, {w:fg.width, h:fg.height});

        await Utils.waitUtil(() => {
            var g = this.bv.mapView.getGridViewAt(tgx, tgy);
            return !!g.getElem();
        });

        rev();
    }

    // 剧情对话
    dlgFrame:egret.DisplayObjectContainer;
    buildDialog() {
        this.dlgFrame = new egret.DisplayObjectContainer();
        this.dlgFrame.name = "guideDlgFrame";

        var bg = ViewUtils.createBitmapByName("confirmBg_png");
        bg.name = "bg";

        var avatar1 = new egret.DisplayObjectContainer();
        avatar1.name = "avatar1";
        avatar1.anchorOffsetX = avatar1.width / 2;
        var avatarName1 = ViewUtils.createTextField(30, 0x7d0403); // 左侧头像的名字
        avatarName1.name = "avatarName1";
        avatarName1.textAlign = egret.HorizontalAlign.LEFT;
        avatarName1.verticalAlign = egret.VerticalAlign.MIDDLE;

        var avatar2 = new egret.DisplayObjectContainer();
        avatar2.name = "avatar2";
        avatar2.anchorOffsetX = avatar2.width / 2;
        var avatarName2 = ViewUtils.createTextField(30, 0x7d0403); // 右侧头像的名字
        avatarName2.name = "avatarName2";
        avatarName2.textAlign = egret.HorizontalAlign.RIGHT;
        avatarName2.verticalAlign = egret.VerticalAlign.MIDDLE;

        var content = ViewUtils.createTextField(25, 0xffffff); // 对话文本
        content.name = "content";
        content.textAlign = egret.HorizontalAlign.LEFT;
        content.verticalAlign = egret.VerticalAlign.TOP;

        var icon = ViewUtils.createBitmapByName(undefined); // 图标
        icon.name = "icon";

        var objs = [bg, avatar1, avatarName1, avatar2, avatarName2, content, icon];
        objs.forEach((obj, _) => this.dlgFrame.addChild(obj));
        ViewUtils.multiLang(this.dlgFrame, ...objs);
        this.dlgFrame.width = this.bg.width;
        this.dlgFrame.height = this.bg.height;
    }

    // 构建对话内容
    makeDialog(tex:string, name:string, str:string, 
            x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false,
            iconRes = undefined, iconPos = undefined) {
        var avatar1 = <egret.DisplayObjectContainer>this.dlgFrame.getChildByName("avatar1");
        var avatar2 = <egret.DisplayObjectContainer>this.dlgFrame.getChildByName("avatar2");
        avatar1.removeChildren();
        avatar2.removeChildren();

        var ske;
        if (Occupation.exists(tex)) {
            ske = ViewUtils.createSkeletonAni(tex);
            ske.animation.play("Idle");
            (onLeft ? avatar1 : avatar2).addChild(ske.display);
            ske.display.x = avatar1.width / 2;
            ske.display.y = avatar1.height / 2;
        } else {
            (onLeft ? avatar1 : avatar2).addChild(ViewUtils.createBitmapByName(tex + "_png"));
        }

        var avatarName1 = <egret.TextField>this.dlgFrame.getChildByName("avatarName1");
        var avatarName2 = <egret.TextField>this.dlgFrame.getChildByName("avatarName2");
        var content = <egret.TextField>this.dlgFrame.getChildByName("content");

        if (onLeft) {
            avatarName1.text = name;
            avatar1.alpha = 1;
            avatar1.scaleX = flipAvatar ? -1 : 1;
            avatarName1.alpha = 1;
            avatar2.alpha = 0;
            avatarName2.alpha = 0;
        } else {
            avatarName2.text = name;
            avatar2.alpha = 1;
            avatar2.scaleX = flipAvatar ? -1 : 1;
            avatarName2.alpha = 1;
            avatar1.alpha = 0;
            avatarName1.alpha = 0;
        }
        
        content.textFlow = ViewUtils.fromHtml(str);
        this.addChild(this.dlgFrame);
        this.dlgFrame.x = x;
        this.dlgFrame.y = y;

        var icon = <egret.Bitmap>this.dlgFrame.getChildByName("icon");
        if (iconRes) {
            icon.x = iconPos.x; icon.y = iconPos.y;
            ViewUtils.setTexName(icon, iconRes + "_png");
        } else 
            ViewUtils.setTexName(icon, undefined);

        return () => {
            this.removeChild(this.dlgFrame);
            if (ske)
                ske["dispose"]();
        };
    }

    // 显示对话内容
    async showDialog(tex:string, name:string, str:string, 
                x:number, y:number, onLeft:boolean = true, 
                flipAvatar:boolean = false, iconRes = undefined, iconPos = undefined) {
        this.bg.alpha = 0;
        this.addChild(this.bg);
        var rev = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar, iconRes, iconPos);
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
        var rev1;
        var rev2;
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

            rev1 = this.tapOrPressPrepare(g, false, {x:g.width/2, y:g.height/2});
            rev2 = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);
        });
    }

    async tapWithDialog(target, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var rev1;
        var rev2;

        this.forGuideType = "tap";
        return new Promise<void>((r, _) => {
            this.onTapped = (evt:egret.TouchEvent) => {
                if (this.forGuideType != "tap" || !this.tapTarget.hitTestPoint(evt.stageX, evt.stageY)) return;
                rev2();
                rev1();

                if (this.tapTarget instanceof GridView) {
                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_BEGIN,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);

                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_END,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
                } else
                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_TAP,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);

                r();
                this.onTapped = undefined; 
            };

            rev1 = this.tapOrPressPrepare(target, true, {x:target.width/2, y:target.height/2});
            rev2 = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);
        });
    }

    async slideWithDialog(target, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var rev1;
        var rev2;

        return new Promise<void>((r, _) => {
            this.onTapped = (evt:egret.TouchEvent) => {
                if (this.forGuideType != "tap" || !this.tapTarget.hitTestPoint(evt.stageX, evt.stageY)) return;
                rev2();
                rev1();

                if (this.tapTarget instanceof GridView) {
                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_BEGIN,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);

                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_END,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);
                } else
                    egret.TouchEvent.dispatchTouchEvent(this.tapTarget, egret.TouchEvent.TOUCH_TAP,
                        evt.bubbles, evt.cancelable,
                        evt.stageX, evt.stageY, evt.touchPointID, evt.touchDown);

                r();
                this.onTapped = undefined; 
            };

            rev1 = this.tapOrPressPrepare(target, true, {x:target.width/2, y:target.height/2});
            rev2 = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);
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
        await Utils.waitUtil(() => this.bv.selView.parent != null);
        var g = this.bv.selView.getGridByPos(gx, gy);
        await this.tapWithDialog(g, tex, name, str, x, y, onLeft, flipAvatar);
    }

    // 指引点击格子物品同时有对话
    public async tapPropWithDialog(n:number, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var g = this.bv.propsView.getPropViewByIndex(n);
        await this.tapWithDialog(g, tex, name, str, x, y, onLeft, flipAvatar);
    }

    // 指引滑动开格子同时有对话框
    async slide2OpenGridsWithDialog(fgx:number, fgy:number, tgx:number, tgy:number, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        Utils.assert((fgx != tgx || fgy != tgy) && (fgx == tgx || fgy == tgy), "only horizental or vertical slide track is supported");
        var dir = (fgy == tgy) ? (tgx > fgx ? 0 : 2) : (tgy > fgy ? 1 : 3);
        var dist = ((fgy == tgy) ? Math.abs(fgx - tgx) : Math.abs(fgy - tgy)) + 1;

        var fg = this.bv.mapView.getGridViewAt(fgx, fgy);
        var rev1 = this.slideGridsPrepare(fg, dist, dir, {w:fg.width, h:fg.height});
        var rev2 = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);

        await Utils.waitUtil(() => {
            var dx = 0;
            var dy = 0;
            if (dir == 0)
                dx = 1;
            else if (dir == 1)
                dy = 1;
            else if (dir == 2)
                dx = -1;
            else
                dy = -1;

            var p = {x:fgx, y:fgy};
            while (p.x != tgx || p.y != tgy) {
                var g = this.bv.mapView.getGridViewAt(p.x, p.y);
                if (g.getGrid().isCovered())
                    return false;

                p = {x:p.x + dx, y:p.y + dy};
            }

            return true;
        });

        rev2();
        rev1();
    }

    // 指引滑动开格子同时有对话框
    async slide2DragItemWithDialog(fgx:number, fgy:number, tgx:number, tgy:number, tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        Utils.assert((fgx != tgx || fgy != tgy) && (fgx == tgx || fgy == tgy), "only horizental or vertical slide track is supported");
        var dir = (fgy == tgy) ? (tgx > fgx ? 0 : 2) : (tgy > fgy ? 1 : 3);
        var dist = ((fgy == tgy) ? Math.abs(fgx - tgx) : Math.abs(fgy - tgy)) + 1;

        var fg = this.bv.mapView.getGridViewAt(fgx, fgy);
        var rev1 = this.slideGridsPrepare(fg, dist, dir, {w:fg.width, h:fg.height});
        var rev2 = this.makeDialog(tex, name, str, x, y, onLeft, flipAvatar);

        await Utils.waitUtil(() => {
            var g = this.bv.mapView.getGridViewAt(tgx, tgy);
            return !!g.getElem();
        });

        rev2();
        rev1();
    }

    // 各种引导流程

    // 测试对话
    public async test(target) {
    }

    // 新手指引1
    async rookiePlay1(bt:Battle) {
        await AniUtils.wait4click();
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay101"), 0, 200, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay102"), 0, 200, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay103"), 0, 200, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay104"), 0, 200, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay105"), 0, 200, true);
    }

    // 新手指引2
    async rookiePlay2(bt:Battle) {
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay201"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay202"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay203"), 0, 550, true);
        await this.tapGridWithDialog(1, 2, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay204"), 0, 550, true);
        // await this.pressGridWithDialog(0, 2, "GoblinThief", "哥布林", "我就测试一下说话的同时指引点击", 140, 500, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay205"), 0, 550, true);
        await this.tapGridWithDialog(1, 2, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay206"), 0, 550, true);
        await this.tapSelGridWithDialog(1, 3, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay207"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay208"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay209"), 0, 550, true);
        await this.pressGridWithDialog(1, 3, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay210"), 0, 550, true)
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay211"), 0, 550, true);
        await this.tapGridWithDialog(1, 3, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay212"), 0, 550, true);
        await AniUtils.delay(1400);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay213"), 0, 550, true);
        await this.tapGridWithDialog(1, 4, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay214"), 0, 650, true);
        await this.slide2DragItemWithDialog(1, 4, 1, 2, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay215"), 0, 630, true);
        await this.tapGridWithDialog(4, 4, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay216"), 0, 650, true);
        await this.tapGridWithDialog(4, 4, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay217"), 0, 650, true);
        var propGrid = this.bv.propsView.getPropViewByIndex(2);
        await this.tapWithDialog(propGrid, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay218"), 0, 550);
        await this.tapSelGridWithDialog(2, 6, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay219"), 0, 250, true);
        await AniUtils.delay(2000);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay220"), 0, 630, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay221"), 0, 550, true);
        await this.pressGridWithDialog(5, 1, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay222"), 0, 550, true);
        await this.pressGridWithDialog(5, 2, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay223"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay224"), 0, 550, true);

    }

    // 被怪物突袭指引
    async onSneakedGuide(m:Monster) {
        var nameAndDesc = ViewUtils.getElemNameAndDesc(m.type);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("onSneakedGuide01"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("onSneakedGuide02"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("onSneakedGuide03"), 0, 550, true);
    }

    // 怪物被标记指引
    async onMonsterMarkedGuide(m:Monster) {
        var nameAndDesc = ViewUtils.getElemNameAndDesc(m.type);
        await AniUtils.delay(700);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("onMonsterMarkedGuide01"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("onMonsterMarkedGuide02"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("onMonsterMarkedGuide03"), 0, 550, true);

    }

    // 第五层战斗指引
    async rookiePlay5(bt:Battle) {
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay501"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay502"), 0, 550, true);
        await this.showDialog("Gardener", ViewUtils.getTipText("horticulturist"), ViewUtils.getTipText("rookiePlay503"), 0, 550, true);
        await this.showDialog("Gardener", ViewUtils.getTipText("horticulturist"), ViewUtils.getTipText("rookiePlay504"), 0, 550, true);
        await this.showDialog("Gardener", ViewUtils.getTipText("horticulturist"), ViewUtils.getTipText("rookiePlay505"), 0, 550, true);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("rookiePlay506"), 0, 550, true);    
    }

    // 额外抢劫剧情
    async robExtraItemDialog(item: Elem) {
        var iconPos = { x: 480, y: 150 }; // 图标位置
        await this.showDialog("ShopNpc", ViewUtils.getTipText("merchant"),
            ViewUtils.getTipText("robExtraItemDialog01") + ViewUtils.getElemNameAndDesc(item.type).name,
            0, 350, true, false,
            item.getElemImgRes() /* 获取图标资源 */, iconPos /* 图标位置 */);

        // 把图标位置返回，外面播动画用
        return { x: this.x + this.dlgFrame.x + iconPos.x, y: this.y + this.dlgFrame.y + iconPos.y};
    }

    // 引导点击头像界面
    async openAvatarView() {
        var avatar = this.bv.getChildByName("avatarBg");
        await this.tapWithDialog(avatar, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("openAvatarView01"), 0, 550);

        await AniUtils.delay(2000);
        await this.showDialog("Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("openAvatarView02"), 0, 550, true);

        var avatar = this.cv.getChildByName("goBackBtn");
        await this.tapWithDialog(avatar, "Nurse", ViewUtils.getTipText("nurse"), ViewUtils.getTipText("openAvatarView03"), 0, 550);
    }
}
