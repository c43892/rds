// 地图上的元素视图
class GridView extends egret.DisplayObjectContainer {
    public map:Map;
    public gx:number;
    public gy:number;

    private showLayer:egret.DisplayObjectContainer; // 装入所有显示内容
    private opLayer:egret.Bitmap; // 专门用于接收操作事件
    private effLayer:egret.DisplayObjectContainer; // 用于放置最上层特效
    private elemImg:egret.Bitmap; // 元素图
    private elemImgInIce:egret.Bitmap; // 冰冻中的元素图
    private banImg:egret.Bitmap; // 禁止符号
    private cdImg:egret.Bitmap; // cd 计数
    private coveredImg:egret.Bitmap; // 不可揭开
    private markedBg:egret.Bitmap; // 标记时的底
    private uncoverableImg:egret.Bitmap; // 被覆盖，但可以揭开
    private blockedImg:egret.Bitmap; // 危险
    private coveredHazardNum:egret.Bitmap; // 数字

    private powerBg:egret.Bitmap;
    private shieldBg:egret.Bitmap;    
    private attackIntervalBg:egret.Bitmap;
    private hpBg:egret.Bitmap;

    private hp:egret.TextField; // 怪物血量：右下角
    private dropElemImg:egret.Bitmap; // 掉落物品的图：左上角，这里也可能显示怪物的行动回合数
    private shield:egret.TextField; // 护盾，右上角
    private attackInterval:egret.TextField; // 攻击间隔，右上角，与护盾互斥
    private power:egret.TextField; // 攻击力，左下角
    public constructor() {
        super();
        this.powerBg = ViewUtils.createBitmapByName("monsterPowerBg_png");
        this.hpBg = ViewUtils.createBitmapByName("monsterHpBg_png");
        this.shieldBg = ViewUtils.createBitmapByName("monsterShieldBg_png");
        this.attackIntervalBg = ViewUtils.createBitmapByName("monsterAttackIntervalBg_png");
        this.blockedImg = ViewUtils.createBitmapByName("blocked_png"); // 危险
        this.uncoverableImg = ViewUtils.createBitmapByName("uncoverable_png"); // 覆盖图

        this.elemImg = new egret.Bitmap(); // 元素图
        this.elemImgInIce = new egret.Bitmap(); // 冰冻中的元素图
        this.banImg = ViewUtils.createBitmapByName("ban_png"); // 禁止符号
        this.coveredImg = ViewUtils.createBitmapByName("covered_png");
        this.markedBg = ViewUtils.createBitmapByName("markedBg_png");
        this.cdImg = new egret.Bitmap(); // cd 计数
        var showLayerContainer = new egret.DisplayObjectContainer(); // 显示层容器
        this.addChild(showLayerContainer);
        this.showLayer = new egret.DisplayObjectContainer(); // 显示层
        showLayerContainer.addChild(this.showLayer);

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

        this.effLayer = new egret.DisplayObjectContainer(); // 放置特效
        this.addChild(this.effLayer);

        // 血量，右下角，护盾，右上角，攻击力，左下角
        this.hp = ViewUtils.createTextField(20, 0xffffff);
        this.shield = ViewUtils.createTextField(20, 0xffffff);
        this.attackInterval = ViewUtils.createTextField(20, 0xffffff);
        this.power = ViewUtils.createTextField(20, 0xffffff);
        this.hp.strokeColor = 0x000000;
        this.hp.stroke = 1;
        this.shield.strokeColor = 0x000000;
        this.shield.stroke = 1;
        this.attackInterval.strokeColor = 0x000000;
        this.attackInterval.stroke = 1;
        this.power.strokeColor = 0x000000;
        this.power.stroke = 1;
        
        // 数字
        this.coveredHazardNum = new egret.Bitmap();

        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
        this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
        this.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.onTouchEnd, this);
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

    // 手动隐藏或恢复 ban 符号
    public hideBanImg(hideOrShow) {
        if (hideOrShow)
            this.banImg.texture = undefined;
        else
            ViewUtils.setTexName(this.banImg, "ban_png");
    }

    private refreshMarkedEffect(g:Grid) {
        this.showLayer.addChild(this.markedBg);
        this.showLayer.setChildIndex(this.markedBg, 0);
        ViewUtils.makeGray(this.elemImg, true);
    }

    putNumOnBg(num, bg) {
        num.width = bg.width * 2;
        num.height = bg.height;
        num.textAlign = egret.HorizontalAlign.CENTER;
        num.verticalAlign = egret.VerticalAlign.MIDDLE;
        num.x = bg.x - (num.width - bg.width) / 2;
        num.y = bg.y;
    }

    private refreshElemShowLayer(g:Grid, e:Elem) {
        if (e && !e.attrs.invisible) { // 有元素显示元素图片
            if (e["getElemImgResInIce"]) {
                var elemInIceRes = e["getElemImgResInIce"]();
                if (elemInIceRes) {
                    ViewUtils.setTexName(this.elemImgInIce, elemInIceRes + "_png");
                    this.showLayer.addChild(this.elemImgInIce);
                }
            }

            ViewUtils.setTexName(this.elemImg, e.getElemImgRes() + "_png");
            this.showLayer.addChild(this.elemImg);
            if (e instanceof Monster) { // 怪物
                var m = <Monster>e;
                Utils.assert(!(m.shield && m.shield != 0 && m["attackInterval"]), "shield can not coexist with attackInterval on:" + m.type);

                // 血量，右下角
                if (e.hp > 0) {
                    this.hpBg.x = this.width - this.hpBg.width; this.hpBg.y = this.height - this.hpBg.height;
                    this.showLayer.addChild(this.hpBg);
                    this.hp.text = m.hp.toString();
                    this.putNumOnBg(this.hp, this.hpBg);
                    this.showLayer.addChild(this.hp);
                }
                
                // 护盾，右上角
                if (m.shield > 0 && !m.isDead()) {
                    this.shieldBg.x = this.width - this.shieldBg.width; this.shieldBg.y = 0;
                    this.showLayer.addChild(this.shieldBg);
                    this.shield.text = m.shield.toString();
                    this.putNumOnBg(this.shield, this.shieldBg);
                    this.showLayer.addChild(this.shield);
                }

                // 攻击间隔，右上角
                if (m["attackInterval"] && !m.isDead() && m.attrs.attackInterval != undefined){
                    this.attackIntervalBg.x = this.width - this.attackIntervalBg.width; 
                    this.attackIntervalBg.y = 0;
                    this.showLayer.addChild(this.attackIntervalBg);
                    this.attackInterval.text = m["attackInterval"].toString();
                    this.putNumOnBg(this.attackInterval, this.attackIntervalBg);
                    this.showLayer.addChild(this.attackInterval);
                }

                // 攻击力，左下角
                var power;
                var attackerAttrs = m.bt().calcMonsterAttackerAttrs(m);
                power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
                    
                if (power > 0 && !m.isDead()) {
                    this.powerBg.x = 0; 
                    this.powerBg.y = this.height - this.powerBg.height;
                    this.showLayer.addChild(this.powerBg);

                    this.power.text = power.toString();
                    this.putNumOnBg(this.power, this.powerBg);
                    this.showLayer.addChild(this.power);
                };
            } else {
                if (e.attrs.showCDNum && e.cd > 0) { // 显示 cd 计数
                    ViewUtils.setTexName(this.cdImg, "cd" + e.cd + "_png", true);
                    this.cdImg.x = (this.showLayer.width - this.cdImg.width) / 2;
                    this.cdImg.y = (this.showLayer.height - this.cdImg.height) / 2;
                    this.showLayer.addChild(this.cdImg);
                }

                // 禁止符号
                if (!e.attrs.invisible && !this.map.isGenerallyValid(e.pos.x, e.pos.y) && e.type != "Hole")
                    this.showLayer.addChild(this.banImg);
            }
        } else if (!e) {
            var num = this.map.getCoveredHazardNum(this.gx, this.gy);
            if (num > 0) {
                ViewUtils.setTexName(this.coveredHazardNum, "num" + num + "_png");
                this.showLayer.addChild(this.coveredHazardNum);
            }
            else if (num < 0) { // 显示 ?
                ViewUtils.setTexName(this.coveredHazardNum, "questionMark_png");
                this.showLayer.addChild(this.coveredHazardNum);
            }

            if (num != 0) {
                this.coveredHazardNum.x = (this.width - this.coveredHazardNum.width) / 2;
                this.coveredHazardNum.y = (this.height - this.coveredHazardNum.height) / 2;
            }
        }
    }

    public setCoverImg(covered:boolean) {
        if (this.uncoverableImg.parent != null) this.uncoverableImg.parent.removeChild(this.uncoverableImg);
        if (this.coveredImg.parent != null) this.coveredImg.parent.removeChild(this.coveredImg);
        if (this.markedBg.parent != null) this.markedBg.parent.removeChild(this.markedBg);

        if (covered) {
            if (this.getGrid().isUncoverable())
                this.showLayer.addChild(this.uncoverableImg);
            else
                this.showLayer.addChild(this.coveredImg);
        }
    }

    public refresh() {
        this.clear();
        var g = this.map.getGridAt(this.gx, this.gy);
        var e = this.map.getElemAt(this.gx, this.gy);
        switch (g.status) {
            case GridStatus.Covered: // 被覆盖                
                this.setCoverImg(true);
            break;
            case GridStatus.Blocked: // 危险
                this.setCoverImg(true);
                this.showLayer.addChild(this.blockedImg);
            break;
            case GridStatus.Marked: // 被标记
                this.setCoverImg(false);
                this.refreshElemShowLayer(g, e);
                if (!e.attrs.invisible)
                    this.refreshMarkedEffect(g);
            break;
            case GridStatus.Uncovered: // 被揭开
                this.setCoverImg(false);
                this.refreshElemShowLayer(g, e);
                // if (this.showLayer.contains(this.coveredImg)) this.showLayer.removeChild(this.coveredImg);
            break;
        }

        // 哪些特效在什么情况下要移除，需要仔细处理
        if (!e) {
            var effOnTar = ["effWantedOrder", "effCharmed"];
            effOnTar.forEach((eff, _) => this.removeEffect(eff));
        }

        this.refreshDropItem(); // 刷新掉落物品显示
        
        var w = this.width;
        var h = this.height;

        if (this.contains(this.showLayer)) {
            this.showLayer.x = this.showLayer.y = 0;
            this.showLayer.width = w;
            this.showLayer.height = h;
            this.showLayer.alpha = 1;
            this.showLayer.rotation = 0;
        }

        var arr = [this.opLayer, this.effLayer, this.elemImg, this.elemImgInIce, this.banImg, this.blockedImg, this.coveredImg, this.markedBg, this.uncoverableImg];
        arr.forEach((a) => {
            a.alpha = 1;
            a.x = 0;
            a.y = 0;
            a.width = w;
            a.height = h;
            a.rotation = 0;
        });

        this.cdImg.x = (this.showLayer.width - this.cdImg.width) / 2;
        this.cdImg.y = (this.showLayer.height - this.cdImg.height) / 2;

        if (e && e.isBig() && g.status != GridStatus.Covered) {
            this.showLayer.scaleX = e.attrs.size.w;
            this.showLayer.scaleY = e.attrs.size.h;
            this.effLayer.scaleX = e.attrs.size.w;
            this.effLayer.scaleY = e.attrs.size.h;
            ViewUtils.forEachChild(this.effLayer, (eff:egret.DisplayObject) => {
                if (eff["noScale"]) {
                    eff.scaleX = 1 / e.attrs.size.w;
                    eff.scaleY = 1 / e.attrs.size.h;
                }
            });
        }
        else {
            this.showLayer.scaleX = 1;
            this.showLayer.scaleY = 1;
            this.effLayer.scaleX = 1;
            this.effLayer.scaleY = 1;

            ViewUtils.forEachChild(this.effLayer, (eff: egret.DisplayObject) => {
                eff.scaleX = eff.scaleY = 1;
            });
        }
    }

    public clear() {
        this.showLayer.removeChildren();
        this.showLayer.addChild(this.dropElemImg);
        this.setCoverImg(false);
        ViewUtils.makeGray(this.elemImg, false);
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

    private effects = {}; // 所有挂在这个格子上的特效    
    public addEffect(effName, playTimes = -1, aniName = "default", noScale = false) {
        if (this.effects[effName])
            this.removeEffect(effName);

        var eff:egret.MovieClip = ViewUtils.createFrameAni(effName, aniName);
        this.effects[effName] = eff;
        this.effLayer.addChild(eff);
        eff.x = this.width / 2;
        eff.y = this.height / 2;
        eff["noScale"] = noScale;
        if (playTimes != 0)
            eff.gotoAndPlay(0, playTimes);

        return eff;
    }

    // 添加带指定延迟循环播放的特效
    public addRandomDelayLoopEffect(effName, rand:SRandom, delays, aniName = "default", noScale = false) {
        var eff = this.addEffect(effName, 1, aniName, noScale);
        this.removeEffect(effName);
        eff.alpha = 0;

        var stopped = false;
        var effWrapper = new egret.DisplayObjectContainer();
        effWrapper.addChild(eff);
        effWrapper["stop"] = () => {
            eff.stop();
            effWrapper.removeChild(eff);
            stopped = true;
        };
        this.effects[effName] = effWrapper;
        this.effLayer.addChild(effWrapper);
               
        var doDelay;
        var doEff;

        doDelay = () => {
            var delay = rand.nextInt(delays[0], delays[1]);
            var d = Utils.delay(delay);
            d.then(() => {
                if (stopped) return;
                eff.alpha = 1;
                eff.gotoAndPlay(0, 1);
            });
        };

        doEff = () => {
            eff["wait"]().then(() => {
                eff.alpha = 0;
                if (stopped) return;
                doDelay();
            });
        };

        doDelay();
        return effWrapper;
    }

    public addColorEffect(effName) {
        if (this.effects[effName]) return this.effects[effName];

        var poisonFromMat = [
            0.75, 0, 0, 0, 0,
            0.25, 0.5, 0.25, 0, 0,
            0, 0, 0.75, 0, 0,
            0, 0, 0, 1, 0
        ];

        var poisonToMat = [
            0.25, 0, 0, 0, 0,
            0.5, 0.75, 0.5, 0, 0,
            0, 0, 0.25, 0, 0,
            0, 0, 0, 1, 0
        ];

        var poisonMistMat = [
            0.1, 0, 0, 0, 0,
            0.4, 0.7, 0.4, 0, 0,
            0, 0, 0.1, 0, 0,
            0, 0, 0, 1, 0
        ];

        var eff;
        switch (effName) {
            case "elemPoisoned":
                eff = new ColorEffect(poisonFromMat, poisonToMat, 2000, this.elemImg);
            break;
            case "gridPoisoned":
                eff = new ColorEffect(poisonMistMat, poisonMistMat, 0, this.coveredImg, this.uncoverableImg);
            break;
            default:
                Utils.assert(false, "unknown color effect name:" + effName);
        }

        eff.start();
        this.effects[effName] = eff;
        this.effLayer.addChild(eff);
        return eff;
    }

    public removeEffect(effName) {
        if (!this.effects[effName]) return;
        var eff = this.effects[effName];
        eff.stop();
        this.effLayer.removeChild(eff);
        delete this.effects[effName];
    }

    public clearAllEffects() {
        for (var effName in this.effects) {
            var eff = this.effects[effName];
            eff.stop();
        }

        this.effLayer.removeChildren();        
        this.effects = {};
    }

    // 各种操作逻辑构建
    static dragStartThreshold2 = 25; // 拖动多远之后，认为已经开始拖拽
    static pressed:boolean = false; // 按下，但尚未开始拖拽移动
    static longPressed:boolean = false; // 是否产生了长按事件
    static dragging:boolean = false; // 开始拖拽，和 pressed 是互斥的
    static dragFrom:GridView;
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
    public static showElemDesc; // 显示元素信息

    public notifyLongPressed; // 通知产生了长按行为
    public notifyLongPressedEnded; // 通知产生了长按行为结束

    // 点击
    async onTouchGrid(evt:egret.TouchEvent) {
        if (GridView.longPressed || /*GridView.gestureChecked ||*/ GridView.dragging || !this.map.isGenerallyValid(this.gx, this.gy))
            return;

        let b = this.map.getGridAt(this.gx, this.gy);
        switch (b.status) {
            case GridStatus.Covered:
                GridView.try2UncoverAt(b.pos.x, b.pos.y);
            break;
            case GridStatus.Marked: {
                let e = this.map.getElemAt(this.gx, this.gy);
                Utils.assert(!!e, "empty grid cannot be marked");
                if ((e instanceof Prop || e instanceof Item || e instanceof Relic) || (e instanceof Monster && !(e.isHazard() || (e["linkTo"] && e["linkTo"].isHazard()))))
                    GridView.try2UncoverAt(b.pos.x, b.pos.y);
                else
                    await GridView.try2UseElem(e);
                break;
            }
            case GridStatus.Uncovered: {
                let e = this.map.getElemAt(this.gx, this.gy);
                if (e) {
                    if (e.useWithTarget()) {
                        e.bt().fireEvent("onElemFloating", {e:e});
                        var pos = await GridView.selectGrid((x, y) => e.canUseAt(x, y));
                        e.bt().fireEvent("onElemFloating", {e:e, stop:true});
                        if (!pos) return; // 取消选择
                        await GridView.try2UseElemAt(e, pos.x, pos.y);
                    } else if (e.canUse()) {
                        if(e.attrs.useWithConfirm){
                            var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureUseElem"), ViewUtils.getElemNameAndDesc(e.type).name);
                            var ok = await PropView.confirmOkYesNo(undefined, content, true, ["确定", "取消"]);
                            if (ok) GridView.try2UseElem(e);
                        } else {
                            if (e instanceof Prop || e instanceof Monster || e instanceof Relic)
                                await GridView.try2UseElem(e);
                            else {
                                if (!e.attrs.useWithoutConfirm){
                                    var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureUseElem"), ViewUtils.getElemNameAndDesc(e.type).name);
                                    var ok = await PropView.confirmOkYesNo(undefined, content, true, ["确定", "取消"]);
                                    if (ok) GridView.try2UseElem(e);
                                }
                                else
                                    await GridView.try2UseElem(e);
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
        GridView.longPressed = false;
        // GridView.gesturePts = [];
        // GridView.gestureOnGridView = this;
        // GridView.gestureChecked = false;
		
		// if (GridView.gesturePts)
        //     GridView.gesturePts.push({x:evt.stageX, y:evt.stageY});

        let g = this.map.getGridAt(this.gx, this.gy);
        if (!this.map.isGenerallyValid(this.gx, this.gy) && g.status != GridStatus.Blocked)
            return;

        GridView.pressed = true;        
        GridView.dragging = false;
        GridView.dragFrom = this;

        if (!GridView.pressTimer) {
            GridView.pressTimer = new egret.Timer(GridView.LongPressThreshold, 1);
            GridView.pressTimer.addEventListener(egret.TimerEvent.TIMER, GridView.onPressTimer, this);
        }

        GridView.pressTimer.start();
    }

    static async onPressTimer() {
        if (!GridView.pressed)
            return;

        GridView.longPressed = true;
        GridView.pressTimer.stop();

        let g = GridView.dragFrom.map.getGridAt(GridView.dragFrom.gx, GridView.dragFrom.gy);
        let gv = GridView.dragFrom;

        if (gv.notifyLongPressed) {
            gv.notifyLongPressed(() => {
                GridView.pressed = false;
                GridView.dragging = false;
                GridView.dragFrom = undefined;
                if (GridView.pressTimer)
                    GridView.pressTimer.stop();
            });
        }

        switch (g.status) {
            case GridStatus.Covered:
                if (g.isUncoverable())
                    await GridView.try2BlockGrid(g.pos.x, g.pos.y, true);
            break;
            case GridStatus.Blocked:
                await GridView.try2BlockGrid(g.pos.x, g.pos.y, false);
            break;
            case GridStatus.Uncovered:
            case GridStatus.Marked:
                var e = g.getElem();
                if (e) {
                    if(e["linkTo"])
                        e = e["linkTo"];

                    await GridView.showElemDesc(e);
                }
            break;
        }

        if (gv.notifyLongPressedEnded)
            gv.notifyLongPressedEnded();
    }

    // 拖拽移动
    onTouchMove(evt:egret.TouchEvent) {
        // if (GridView.gesturePts)
        //     GridView.gesturePts.push({x:evt.stageX, y:evt.stageY});

        if (GridView.longPressed)
            return;

        var px = evt.localX + this.x;
        var py = evt.localY + this.y;

        // 翻开的格子才可能拖动
        if (!GridView.dragging && GridView.dragFrom && !this.getGrid().isCovered()) {
            var e = GridView.dragFrom.getElem();
            if (!e || !e.canBeDragDrop || e.getGrid().isCovered())
                return;

            var dx = GridView.dragFrom.x - px;
            var dy = GridView.dragFrom.y - py;
            if (dx * dx + dy * dy >= GridView.dragStartThreshold2) {
                GridView.pressed = false;
                GridView.dragging = true;
                
                if (!GridView.draggingElemImg) {
                    GridView.draggingElemImg = new egret.Bitmap();
                    GridView.draggingElemImg.width = GridView.dragFrom.width;
                    GridView.draggingElemImg.height = GridView.dragFrom.height;
                }

                if (!GridView.draggingElemImgTex)
                    GridView.draggingElemImgTex = new egret.RenderTexture();

                GridView.draggingElemImgTex.drawToTexture(this);
                GridView.draggingElemImg.texture = GridView.draggingElemImgTex;
                GridView.draggingElemImg.x = px - GridView.draggingElemImg.width / 2;
                GridView.draggingElemImg.y = py - GridView.draggingElemImg.height / 2;
                this.parent.addChild(GridView.draggingElemImg);
                GridView.dragFrom.showLayer.alpha = 0;
            }
        }
        else if (GridView.draggingElemImg) {
            GridView.draggingElemImg.x = px - GridView.draggingElemImg.width / 2;
            GridView.draggingElemImg.y = py - GridView.draggingElemImg.height / 2;
        }
    }

    // 结束拖拽
    onTouchEnd(evt:egret.TouchEvent) {
        // GridView.gestureChecked = false;
        // if (GridView.gesturePts && GridView.onGesture)
        //     GridView.gestureChecked = GridView.onGesture(GridView.gesturePts);

        // GridView.gesturePts = undefined;
        // GridView.gestureOnGridView = undefined;

        if (!GridView.longPressed && GridView.dragging) {
            GridView.dragFrom.showLayer.alpha = 1;
            this.parent.removeChild(GridView.draggingElemImg);
            GridView.draggingElemImg.texture = undefined;

            var from = GridView.dragFrom;
            var to = this;
            GridView.reposElemTo(from.getElem(), to.gx, to.gy);
        }

        GridView.pressed = false;
        GridView.dragging = false;
        GridView.dragFrom = undefined;
        if (GridView.pressTimer)
            GridView.pressTimer.stop();
    }

    // 记录一次按下弹起所经过的路径点，用于手势判断
    // public static gesturePts;
    // public static gestureOnGridView:GridView;
    // public static gestureChecked:boolean;
    // public static onGesture(pts):boolean { // 响应手势操作
    //     if (pts.length < 10) return;
    //     // 统计四边和中心位置
    //     var l = pts[0].x; var r = l;
    //     var t = pts[0].y; var b = t;
    //     pts.forEach((pt, _) => {
    //         if (pt.x < l) l = pt.x;
    //         if (pt.x > r) r = pt.x;
    //         if (pt.y < t) t = pt.y;
    //         if (pt.y > b) b = pt.y;
    //     });

    //     if (r - l < 30 && b - t < 30) return;
    //     var g = GridView.gestureOnGridView.getGrid();
    //     if (g.isUncoverable() && g.status != GridStatus.Marked) {
    //         GridView.try2BlockGrid(g.pos.x, g.pos.y, true);
    //         return true;
    //     } else if (g.status == GridStatus.Blocked) {
    //         GridView.try2BlockGrid(g.pos.x, g.pos.y, false);
    //         return true;
    //     }
        
    //     return false;
    // };
}
