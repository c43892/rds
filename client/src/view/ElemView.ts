// 地图上的元素视图
class ElemView extends egret.DisplayObjectContainer {
    public map:Map;
    public gx:number;
    public gy:number;

    private showLayer:egret.DisplayObjectContainer; // 装入所有显示内容
    private opLayer:egret.Bitmap; // 专门用于接收操作事件
    private elemImg:egret.Bitmap; // 元素图
    private banImg:egret.Bitmap; // 禁止符号
    private cdImg:egret.Bitmap; // cd 计数
    private coveredImg:egret.Bitmap; // 标记时，要在上面盖上牌背

    private powerBg:egret.Bitmap;
    private shieldBg:egret.Bitmap;
    private hpBg:egret.Bitmap;

    private hp:egret.TextField; // 怪物血量：右下角
    private dropElemImg:egret.Bitmap; // 掉落物品的图：左上角，这里也可能显示怪物的行动回合数
    private shield:egret.TextField; // 护盾，右上角
    private power:egret.TextField; // 攻击力，左下角

    public constructor() {
        super();
        this.powerBg = ViewUtils.createBitmapByName("monsterPowerBg_png");
        this.hpBg = ViewUtils.createBitmapByName("monsterHpBg_png");
        this.shieldBg = ViewUtils.createBitmapByName("monsterShieldBg_png");

        this.elemImg = new egret.Bitmap(); // 元素图
        this.banImg = ViewUtils.createBitmapByName("ban_png"); // 禁止符号
        this.coveredImg = ViewUtils.createBitmapByName("uncoverable_png");
        this.cdImg = new egret.Bitmap(); // cd 计数
        this.showLayer = new egret.DisplayObjectContainer(); // 显示层
        this.addChild(this.showLayer);

        // 掉落物品
        this.dropElemImg = new egret.Bitmap();
        this.dropElemImg.name = "DropElem";
        this.dropElemImg.anchorOffsetX = 0;
        this.dropElemImg.anchorOffsetY = 0;
        this.dropElemImg.x = this.dropElemImg.y = 0;
        this.dropElemImg.width = this.dropElemImg.height = 32;
        this.showLayer.addChild(this.dropElemImg);

        this.opLayer = new egret.Bitmap(); // 事件层
        this.addChild(this.opLayer);

        // 血量，右下角，护盾，右上角，攻击力，左下角
        this.hp = ViewUtils.createTextField(20, 0xffffff);
        this.shield = ViewUtils.createTextField(20, 0xffffff);
        this.power = ViewUtils.createTextField(20, 0xffffff);
        this.hp.strokeColor = 0x000000;
        this.hp.stroke = 1;
        this.shield.strokeColor = 0x000000;
        this.shield.stroke = 1;
        this.power.strokeColor = 0x000000;
        this.power.stroke = 1;

        this.anchorOffsetX = 0;
        this.anchorOffsetY = 0;

        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
        this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
    }

    // 获取左上角用于显示掉落物品的图
    public getDropItemImg() {
        return this.dropElemImg;
    }

    // 刷新掉落物品显示
    dropElemImgExists = () => !!this.dropElemImg.texture;
    public refreshDropItem() {
        var g = this.map.getGridAt(this.gx, this.gy);
        var e = this.map.getElemAt(this.gx, this.gy);
        var dpe;
        if (e && e.dropItems) {
            var n = Utils.indexOf(e.dropItems, (dpe) => dpe.type != "Coins" && (dpe instanceof Item || dpe instanceof Prop || dpe instanceof Relic));
            if (n >= 0)
                dpe = e.dropItems[n];
        }

        var show = (!g.isCovered() || g.isMarked()) && !!dpe && !e.attrs.hideDropItems;
        if (show) {
            ViewUtils.setTexName(this.dropElemImg, dpe.getElemImgRes() + "_png");
            this.showLayer.setChildIndex(this.dropElemImg, -1);
        }
        else
            this.dropElemImg.texture = undefined;
    }

    public refresh() {
        this.clear();
        var g = this.map.getGridAt(this.gx, this.gy);
        var e = this.map.getElemAt(this.gx, this.gy);
        switch (g.status) {
            case GridStatus.Marked: // 被标记
            case GridStatus.Uncovered: { // 被揭开
                if (e && !e.attrs.invisible) { // 有元素显示元素图片
                    this.elemImg = ViewUtils.createBitmapByName(e.getElemImgRes() + "_png");
                    this.showLayer.addChild(this.elemImg);
                    if (e instanceof Monster) { // 怪物
                        var m = <Monster>e;

                        // 血量，右下角
                        this.hpBg.x = this.width - this.hpBg.width; this.hpBg.y = this.height - this.hpBg.height;
                        this.showLayer.addChild(this.hpBg);
                        this.hp.text = m.hp.toString();
                        this.hp.x = m.hp >= 10 ? this.width - 23 : this.width - 22;
                        this.hp.y = m.hp >= 10 ? this.height - 23 : this.height - 25;
                        this.hp.size = m.hp >= 10 ? 15 : 20;
                        this.showLayer.addChild(this.hp);
                        
                        // 护盾，右上角
                        if (m.shield > 0 && !m.isDead()) {
                            this.shieldBg.x = this.width - this.shieldBg.width; this.shieldBg.y = 0;
                            this.showLayer.addChild(this.shieldBg);
                            this.shield.text = m.shield.toString();
                            this.shield.x = 2;
                            this.shield.y = 2;
                            this.shield.x = m.shield >= 10 ? this.width - 23 : this.width - 22;
                            this.shield.y = m.shield >= 10 ? 5 : 3;
                            this.shield.size = m.shield >= 10 ? 15 : 20;
                            this.showLayer.addChild(this.shield);
                        }

                        // 攻击力，左下角
                        var power;
                        m.bt().calcMonsterAttackerAttrs(m).then((attackerAttrs) => {
                            power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
                            if (power)
                                power = power < 1 ? 1 : power;
                                
                            if (power > 0 && !m.isDead()) {
                                this.power.text = power.toString();
                                this.powerBg.x = 0; this.powerBg.y = this.height - this.powerBg.height;
                                this.showLayer.addChild(this.powerBg);
                                this.power.x = power >= 10 ? 4 : 6;
                                this.power.y = power >= 10 ? this.height - 23 : this.height - 25;
                                this.power.size = power >= 10 ? 15 : 20;
                                this.showLayer.addChild(this.power);
                            };
                        })
                    } else {    
                        if (e.attrs.showCDNum && e.cd > 0) { // 显示 cd 计数
                            ViewUtils.setTexName(this.cdImg, "cd" + e.cd + "_png");
                            this.showLayer.addChild(this.cdImg);
                        }

                        // 禁止符号
                        if (!e.attrs.invisible && !this.map.isGenerallyValid(e.pos.x, e.pos.y) && e.type != "Hole")
                            this.showLayer.addChild(this.banImg);
                    }
                }
            }
            break;
        }

        this.refreshDropItem(); // 刷新掉落物品显示

        if (g.status == GridStatus.Marked) {
            var colorFilter = new egret.ColorMatrixFilter([
                0.2, 0.3, 0.2, 0, 0,
                0.2, 0.3, 0.2, 0, 0,
                0.2, 0.3, 0.2, 0, 0,
                0, 0, 0, 1, 0
            ]);

            this.addChild(this.coveredImg);
            this.setChildIndex(this.coveredImg, 0);
            this.coveredImg.x = (this.width - this.coveredImg.width) / 2;
            this.coveredImg.y = (this.height - this.coveredImg.height) / 2;
            this.showLayer.filters = [colorFilter];
            this.showLayer.blendMode = egret.BlendMode.ADD;
            this.showLayer.alpha = 0.5;
        } else {
            if (this.contains(this.coveredImg)) this.removeChild(this.coveredImg);
            this.showLayer.filters = undefined;
            this.showLayer.blendMode = egret.BlendMode.NORMAL;
            this.showLayer.alpha = 1;
        }
        
        var w = this.width;
        var h = this.height;

        if (this.contains(this.showLayer)) {
            this.showLayer.x = this.showLayer.y = 0;
            this.showLayer.width = w;
            this.showLayer.height = h;
            this.showLayer.alpha = 1;
            this.showLayer.rotation = 0;
        }

        var arr = [this.opLayer, this.elemImg, this.banImg, this.cdImg];
        arr.forEach((a) => {
            a.alpha = 1;
            a.x = 0;
            a.y = 0;
            a.width = w;
            a.height = h;
            a.rotation = 0;
        });

        if (e && e.isBig()) {
            this.showLayer.scaleX = e.attrs.size.w;
            this.showLayer.scaleY = e.attrs.size.h;
        } else {
            this.showLayer.scaleX = 1;
            this.showLayer.scaleY = 1;
        }
    }

    public clear() {
        this.showLayer.removeChildren();
        this.showLayer.addChild(this.dropElemImg);
    }

    public getElem():Elem {
        return this.map.getElemAt(this.gx, this.gy);
    }

    public getGrid():Grid {
        return this.map.getGridAt(this.gx, this.gy);
    }

    public getShowLayer():egret.DisplayObject {
        return this.showLayer;
    }

    // 各种操作逻辑构建
    static dragStartThreshold2 = 25; // 拖动多远之后，认为已经开始拖拽
    static pressed:boolean = false; // 按下，但尚未开始拖拽移动
    static longPressed:boolean = false; // 是否产生了长按事件
    static dragging:boolean = false; // 开始拖拽，和 pressed 是互斥的
    static dragFrom:ElemView;
    static draggingElemImgTex:egret.RenderTexture;
    static draggingElemImg:egret.Bitmap; // 拖拽中的元素图
    static pressTimer:egret.Timer; // 长按计时

    public static try2UseElem; // 尝试无目标使用元素，会挂接形如 function(e:Elem) 的函数
    public static try2UseElemAt; // 尝试使用一个元素，将坐标为目标
    public static selectGrid; // 选择目标
    public static confirmOkYesNo; // 确认选择
    public static reposElemTo; // 将物品放到指定空位
    public static try2UncoverAt; // 尝试解开指定位置
    public static try2BlockGrid; // 尝试设置/取消一个危险标志
    public static notifyLongPressStarted; // 通知长按开始计时
    public static notifyLongPressEnded; // 通知长按计时结束
    public static showElemDesc; // 显示元素信息

    // 点击
    async onTouchGrid(evt:egret.TouchEvent) {
        if (ElemView.longPressed || ElemView.gestureChecked || ElemView.dragging || !this.map.isGenerallyValid(this.gx, this.gy))
            return;

        let b = this.map.getGridAt(this.gx, this.gy);
        switch (b.status) {
            case GridStatus.Covered:
                ElemView.try2UncoverAt(b.pos.x, b.pos.y);
            break;
            case GridStatus.Marked:
            {
                let e = this.map.getElemAt(this.gx, this.gy);
                Utils.assert(!!e, "empty grid cannot be marked");
                if ((e instanceof Prop || e instanceof Item || e instanceof Relic) || (e instanceof Monster && !(e.isHazard() || (e["linkTo"] && e["linkTo"].isHazard()))))
                    ElemView.try2UncoverAt(b.pos.x, b.pos.y);
                else
                    await ElemView.try2UseElem(e);
                break;
            }
            case GridStatus.Uncovered:
            {
                let e = this.map.getElemAt(this.gx, this.gy);
                if (e) {
                    if (e.useWithTarget()) {
                        e.bt().fireEvent("onElemFloating", {e:e});
                        ElemView.selectGrid((x, y) => e.canUseAt(x, y), async (pos) => {
                            e.bt().fireEvent("onElemFloating", {e:e});
                            if (!pos) return; // 取消选择
                            await ElemView.try2UseElemAt(e, pos.x, pos.y);
                        });
                    } else if (e.canUse()) {
                        if(e.attrs.useWithConfirm){
                            var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureUseElem"), ViewUtils.getElemNameAndDesc(e.type).name);
                            var ok = await PropView.confirmOkYesNo(undefined, content, true, ["确定", "取消"]);
                            if (ok) ElemView.try2UseElem(e);
                        } else {
                            if (e instanceof Prop || e instanceof Monster || e instanceof Relic)
                                await ElemView.try2UseElem(e);
                            else {
                                if (!e.attrs.useWithoutConfirm){
                                    var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureUseElem"), ViewUtils.getElemNameAndDesc(e.type).name);
                                    var ok = await PropView.confirmOkYesNo(undefined, content, true, ["确定", "取消"]);
                                    if (ok) ElemView.try2UseElem(e);
                                }
                                else
                                    await ElemView.try2UseElem(e);
                            }
                        }
                    } else {
                        // can not use
                        var r = e.canNotUseReason();
                        if (r)
                            await e.bt().fireEvent("canNotUseItem", {e:e, r:r});
                    }
                }
            }
        }
    }

    // 按下
    static readonly LongPressThreshold = 500; // 按下持续 0.5s 算长按
    onTouchBegin(evt:egret.TouchEvent) {
        ElemView.gesturePts = [];
        ElemView.gestureOnElemView = this;
        ElemView.gestureChecked = false;
		
		if (ElemView.gesturePts)
            ElemView.gesturePts.push({x:evt.stageX, y:evt.stageY});    

        let g = this.map.getGridAt(this.gx, this.gy);
        if (!this.map.isGenerallyValid(this.gx, this.gy) && g.status != GridStatus.Blocked)
            return;

        ElemView.pressed = true;
        ElemView.longPressed = false;
        if (ElemView.notifyLongPressEnded)
            ElemView.notifyLongPressEnded();
        ElemView.dragging = false;
        ElemView.dragFrom = this;

        if (!ElemView.pressTimer) {
            ElemView.pressTimer = new egret.Timer(ElemView.LongPressThreshold, 1);
            ElemView.pressTimer.addEventListener(egret.TimerEvent.TIMER, ElemView.onPressTimer, this);
        }

        ElemView.pressTimer.start();
        if (ElemView.notifyLongPressStarted)
            ElemView.notifyLongPressStarted(this.gx, this.gy, ElemView.LongPressThreshold);
    }

    static async onPressTimer() {
        if (!ElemView.pressed)
            return;

        ElemView.longPressed = true;
        if (ElemView.notifyLongPressEnded)
            ElemView.notifyLongPressEnded();
        ElemView.pressTimer.stop();

        let g = ElemView.dragFrom.map.getGridAt(ElemView.dragFrom.gx, ElemView.dragFrom.gy);
        switch (g.status) {
            case GridStatus.Covered:
                if (g.isUncoverable())
                    ElemView.try2BlockGrid(g.pos.x, g.pos.y, true);
            break;
            case GridStatus.Blocked:
                ElemView.try2BlockGrid(g.pos.x, g.pos.y, false);
            break;
            case GridStatus.Uncovered:
            case GridStatus.Marked:
                var e = g.getElem();
                if (e)
                    await ElemView.showElemDesc(e);
            break;
        }
    }

    // 拖拽移动
    onTouchMove(evt:egret.TouchEvent) {
        if (ElemView.gesturePts) ElemView.gesturePts.push({x:evt.stageX, y:evt.stageY});

        if (ElemView.longPressed 
            || this.map.getGridAt(this.gx, this.gy).isCovered() 
            || !this.map.isGenerallyValid(this.gx, this.gy))
            return;

        var px = evt.localX + this.x;
        var py = evt.localY + this.y;

        if (!ElemView.dragging && ElemView.dragFrom) {
            var e = ElemView.dragFrom.getElem();
            if (!e || !e.canBeDragDrop)
                return;

            var dx = ElemView.dragFrom.x - px;
            var dy = ElemView.dragFrom.y - py;
            if (dx * dx + dy * dy >= ElemView.dragStartThreshold2) {
                ElemView.pressed = false;
                ElemView.dragging = true;
                
                if (!ElemView.draggingElemImg) {
                    ElemView.draggingElemImg = new egret.Bitmap();
                    ElemView.draggingElemImg.width = ElemView.dragFrom.width;
                    ElemView.draggingElemImg.height = ElemView.dragFrom.height;
                }

                if (!ElemView.draggingElemImgTex)
                    ElemView.draggingElemImgTex = new egret.RenderTexture();

                ElemView.draggingElemImgTex.drawToTexture(this);
                ElemView.draggingElemImg.texture = ElemView.draggingElemImgTex;
                ElemView.draggingElemImg.x = px - ElemView.draggingElemImg.width / 2;
                ElemView.draggingElemImg.y = py - ElemView.draggingElemImg.height / 2;
                this.parent.addChild(ElemView.draggingElemImg);
                ElemView.dragFrom.showLayer.alpha = 0;
            }
        }
        else if (ElemView.draggingElemImg) {
            ElemView.draggingElemImg.x = px - ElemView.draggingElemImg.width / 2;
            ElemView.draggingElemImg.y = py - ElemView.draggingElemImg.height / 2;
        }
    }

    // 结束拖拽
    onTouchEnd(evt:egret.TouchEvent) {
        ElemView.gestureChecked = false;
        if (ElemView.gesturePts && ElemView.onGesture)
            ElemView.gestureChecked = ElemView.onGesture(ElemView.gesturePts);

        ElemView.gesturePts = undefined;
        ElemView.gestureOnElemView = undefined;

        if (ElemView.dragging) {
            ElemView.dragFrom.showLayer.alpha = 1;
            this.parent.removeChild(ElemView.draggingElemImg);
            ElemView.draggingElemImg.texture = undefined;

            var from = ElemView.dragFrom;
            var to = this;
            ElemView.reposElemTo(from.getElem(), to.gx, to.gy);
        }

        ElemView.pressed = false;
        ElemView.dragging = false;
        ElemView.dragFrom = undefined;
        if (ElemView.pressTimer) {
            ElemView.pressTimer.stop();
            if (ElemView.notifyLongPressEnded)
                ElemView.notifyLongPressEnded();
        }
    }

    // 记录一次按下弹起所经过的路径点，用于手势判断
    public static gesturePts;
    public static gestureOnElemView:ElemView;
    public static gestureChecked:boolean;
    public static onGesture(pts):boolean { // 响应手势操作
        if (pts.length < 10) return;
        // 统计四边和中心位置
        var l = pts[0].x; var r = l;
        var t = pts[0].y; var b = t;
        pts.forEach((pt, _) => {
            if (pt.x < l) l = pt.x;
            if (pt.x > r) r = pt.x;
            if (pt.y < t) t = pt.y;
            if (pt.y > b) b = pt.y;
        });

        if (r - l < 30 && b - t < 30) return;
        var g = ElemView.gestureOnElemView.getGrid();
        if (g.isUncoverable() && g.status != GridStatus.Marked) {
            ElemView.try2BlockGrid(g.pos.x, g.pos.y, true);
            return true;
        } else if (g.status == GridStatus.Blocked) {
            ElemView.try2BlockGrid(g.pos.x, g.pos.y, false);
            return true;
        }
        
        return false;
    };
}
