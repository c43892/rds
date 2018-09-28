// 主视图下属的动画层
class AniView extends egret.DisplayObjectContainer {
    private bv:BattleView; // 战斗视图
    private wmv:WorldMapView; // 大地图
    private blackCover:egret.Bitmap; // 黑屏用的遮挡

    private aniCover:egret.Bitmap; // 播放动画时的操作屏蔽层
    public aniFact:AnimationFactory; // 动画工厂

    public constructor(w:number, h:number, mainView:MainView) {
        super();
        this.width = w;
        this.height = h;
        
        this.bv = mainView.bv;
        this.wmv = mainView.wmv;
        this.aniCover = new egret.Bitmap();
        this.aniCover.touchEnabled = true;

        this.blackCover = ViewUtils.createBitmapByName("black_png");
        this.blackCover.width = this.width;
        this.blackCover.height = this.height;
        this.blackCover.touchEnabled = true;

        this.aniFact = new AnimationFactory();
        this.aniFact.notifyAniStarted = (ani:Promise<void>, aniType:string, ps) => { this.onAniStarted(ani, aniType, ps); };
    }

    // 获取一个地图上的元素对应的显示层
    getSV(e:Elem):egret.DisplayObject {
        return this.getSVByPos(e.pos.x, e.pos.y);
    }

    // 获取一个地图上的指定位置元素对应的显示层
    getSVByPos(x, y):egret.DisplayObject {
        return this.bv.mapView.getGridViewAt(x, y).getShowLayer();
    }

    // 获取一个道具对应的PropView
    getSVOfProp(p:Prop):PropView {
        var index = Utils.indexOf(this.bv.player.props, (prop:Prop) => prop.type == p.type);
        return this.bv.propsView.getPropViewByIndex(index)
    }

    // 获取一个玩家的遗物对应的Bitmap
    getBitmapOfRelic(r:Relic):egret.Bitmap {
        var index = Utils.indexOf(this.bv.player.relics, (relic:Relic) => relic.type == r.type);
        return index >= 6 ? undefined : this.bv.relics[index];
    }
    

    public refresh() {
        // 播放动画时阻挡玩家操作        
        if (this.contains(this.aniCover))
            this.removeChild(this.aniCover);

        // 黑屏用的遮挡
        if (this.contains(this.blackCover))
            this.removeChild(this.blackCover);
    }

    // 清除所有地图显示元素
    public clear() {
        // if (this.contains(this.blackCover))
        //     this.removeChild(this.blackCover);

        // if (this.contains(this.aniCover))
        //     this.removeChild(this.aniCover);

        this.removeChildren();
    }

    // 开始环形进度条
    public async onCycleStart(img:egret.Bitmap, ps) {
        var eImg = this.bv.mapView.getGridViewAt(ps.x, ps.y);
        ps.r = eImg.width;
        ps.x = eImg.x + eImg.width / 2;
        ps.y = eImg.y + eImg.height / 2;

        img.x = eImg.x;
        img.y = eImg.y;
        img.width = eImg.width;
        img.height = eImg.height;
        eImg.parent.addChild(img);
        ps.img = img;
        ps.noWait = true; // 不阻挡操作
        await this.aniFact.createAni("cycleMask", ps);
        if (img.parent && img.parent.contains(img))
            img.parent.removeChild(img);
    }

    // 批量物品掉落
    public async onNotifyElemsDropped(ps) {
        var lastAni;
        var es = ps.es;
        var fromPos = ps.fromPos;
        for (var i = 0; i < es.length; i++) {
            var e = es[i];
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y, e && e.isBig() ? e.attrs.size : undefined);
            var obj = this.getSVByPos(e.pos.x, e.pos.y);
            if (e.attrs.addInEffect == "noEffect") {
                // 不需要额外表现效果
            }
            else if (!fromPos || (e.pos.x == fromPos.x && e.pos.y == fromPos.y)) // 原地跳出来
                lastAni = AniUtils.jumpInMap(obj);
            else
                lastAni = AniUtils.flyOutLogicPos(obj, this.bv.mapView, fromPos);
        }

        if (lastAni)
            await lastAni;

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
        this.bv.mapView.refresh();
    }

    // 指定位置发生状态或元素变化
    public async onGridChanged(ps) {
        var e:Elem = ps.e;
        var gv = this.bv.mapView.getGridViewAt(ps.x, ps.y);
        var doRefresh = () => this.bv.mapView.refreshAt(ps.x, ps.y, e && e.isBig() ? e.attrs.size : undefined);
        switch (ps.subType) {
            case "elemAdded": // 有元素被添加进地图
                doRefresh();
                this.bv.refreshElemsTip();
                var obj = this.getSVByPos(ps.x, ps.y);
                if (e.attrs.addInEffect == "noEffect") {
                    // 不需要额外表现效果
                } else if (e instanceof Monster) // 怪物是从地下冒出
                    await AniUtils.crawlOut(obj);
                else if (!ps.fromPos || (e.pos.x == ps.fromPos.x && e.pos.y == ps.fromPos.y)) { // 原地跳出来
                    await AniUtils.jumpInMap(obj);
                }
                else // 飞出来，从跳出来的位置到目标位置有一段距离
                    await AniUtils.flyOutLogicPos(obj, this.bv.mapView, ps.fromPos);
                break;
            case "gridBlocked": {
                var img = ViewUtils.createBitmapByName("blocked_png");

                var scale = 3;
                img.alpha = 0;
                img.width = gv.width * scale;
                img.height = gv.height * scale;
                img.x = gv.x - (img.width - gv.width) / 2;
                img.y = gv.y - (img.height - gv.height) / 2;
                
                gv.parent.addChild(img);
                await this.aniFact.createAni("tr", {
                    obj:img, time: 500,
                    tx:gv.x, ty:gv.y, tw:gv.width, th:gv.height, ta:1, mode:egret.Ease.backIn
                });
                gv.parent.removeChild(img);
                doRefresh();
            }
            break;
            case "gridUnblocked": {
                doRefresh();
                var img = ViewUtils.createBitmapByName("blocked_png");
                img.alpha = 1;
                img.width = gv.width;
                img.height = gv.height;
                img.x = gv.x - (img.width - gv.width) / 2;
                img.y = gv.y - (img.height - gv.height) / 2;
                gv.parent.addChild(img);
                await this.aniFact.createAni("tr", {
                    obj:img, time: 300, ta:0, mode:egret.Ease.quintInOut
                });
                gv.parent.removeChild(img);
            }
            break;
            case "gridUncovered": {
                doRefresh();
                gv.removeEffect("effPoisonMist"); // 翻开就去掉毒雾
                var eff = gv.addEffect("effUncover", 1);
                eff["wait"]().then(() => gv.removeEffect("effUncover"));
            }
            break;
            case "addBoxAndKey":
                this.bv.refreshElemsTip();
                doRefresh();
            break;
            default:
                this.bv.refreshElemsTip();
                doRefresh();
        }

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    // 道具发生变化
    public async onPropChanged(ps) {
        if (ps.subType == "addProp") {
            var e:Elem = ps.e;
            var fromImg = this.getSV(e);
            var n = Utils.indexOf(e.bt().player.props, (p) => p.type == e.type);
            var pv = this.bv.propsView.getPropViewByIndex(n);
            var toImg = pv.getImg();
            await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
        }
        this.bv.refreshProps();
    }

    // 遗物发生变化
    public async onRelicChanged(ps) {
        var e:Elem = ps.e;
        var n = Utils.indexOf(e.bt().player.relics, (p) => p.type == e.type);        
        var toImg = n < 6 ? this.bv.relics[n] : this.bv.moreRelics;
        
        if (ps.subType == "addRelicByPickup") {
            var fromObj = this.getSV(e);
            await AniUtils.fly2(fromObj, fromObj, toImg, true, 1);
        } else if (ps.subType == "addRelicBySel") {
            var e:Elem = ps.e;
            var fromPos = PlayerLevelUpView.lastSelectedRelicImgGlobalPos
            if (fromPos) {
                var fromImg = AniUtils.createImg(e.getElemImgRes() + "_png");
                fromImg.x = fromPos.x;
                fromImg.y = fromPos.y;
                fromImg.width = fromPos.w;
                fromImg.height = fromPos.h;
                await AniUtils.flash(fromImg, 200);
                await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
                fromImg["dispose"]();
            }
        }

        this.bv.refreshRelics();
        this.bv.refreshPlayer();
    }

    // 在大地图获取东西
    public async onGetElemInWorldmap(ps) {
        var e:Elem = ps.e;
        var fromPos = ps.fromPos ? ps.fromPos : {x:this.width/2, y:this.height/2};
        
        var fromImg = AniUtils.createImg(e.getElemImgRes() + "_png");
        fromImg.x = fromPos.x;
        fromImg.y = fromPos.y;
        fromImg.width = fromPos.w;
        fromImg.height = fromPos.h;

        var toImg = AniUtils.createImg(e.getElemImgRes() + "_png");
        toImg.x = this.wmv.btnSetting.x;
        toImg.y = this.wmv.btnSetting.y;
        toImg.width = toImg.height = 0;
        toImg.alpha = 0;

        await AniUtils.flash(fromImg, 200);
        await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
        fromImg["dispose"]();
        toImg["dispose"]();
    }

    // 在大地图上获得金钱
    public async onGetMoneyInWorldmap(ps) {
        var txt = this.wmv.getMoneyText();
        var d = ps.dm > 0 ? 1 : -1;
        var p = this.wmv.player;

        if (d > 0)
            await this.coinsFly(undefined, WorldMapEventSelsView.lastSelectionGlobalPos, txt, ps.dm);
        else
            await this.coinsFly(undefined, txt, WorldMapEventSelsView.lastSelectionGlobalPos, ps.dm);

        this.wmv.refreshMoney();
    }

    // 大地图上加血
    public async onGetHpInWorldmap(ps) {
        var d = ps.dhp;
        if (d < 0) {
            var img = AniUtils.createImg("deadlyMask_png");
            img.width = this.width;
            img.height = this.height;
            await AniUtils.shakeCamera();
            img["dispose"]();
        }

        this.wmv.refreshHp();
    }

    // 休息屋休息
    public async onHospitalCureStart(ps) {
        await this.blackIn();
        this.wmv.refreshHp();
    }
    public async onHospitalCureEnd(ps) {
        await this.blackOut();
    }

    // 大地图上加血上限
    public async onGetHpMaxInWorldmap(ps) {
        var d = ps.dMaxHp;
        if (d < 0) {
            var img = AniUtils.createImg("deadlyMask_png");
            img.width = this.width;
            img.height = this.height;
            await AniUtils.shakeCamera();
            img["dispose"]();
        }
    }

    // cd 变化
    public async onColddownChanged(ps) {
        var e = ps.e;        
        if (e instanceof Prop) {
            var pv = this.getSVOfProp(e);
            pv.refresh();
        }
        else {
            var g = this.getSV(e);
            // 翻转表达冷却效果
            if ((e.cd > 0 && ps.priorCD <= 0)
                || (e.cd <= 0 && ps.priorCD > 0)) {
                // 这个效果不等待
                AniUtils.turnover(g, () => {
                    this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
                });
            }
            else
                this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        }
    }

    // 使用物品
    public async onUseElem(ps) {
        var e = ps.e;
        var g = this.getSV(e);
        if (e.type == "ShopNpc" && (<Monster>e).isDead()) // 商人使用后闪烁消失
            await AniUtils.flashOut(g);
    }

    // 对目标位置使用物品
    public async onUseElemAt(ps) {
        var e = ps.e;
        var g = this.getSV(e);
        if (e.type == "Key" || e.type == "Knife" || e.type == "SmallRock") { // 钥匙飞向目标
            var g = this.getSV(e);
            var target = ps.target;
            var tg = this.bv.mapView.getGridViewAt(ps.toPos.x, ps.toPos.y);
            AniUtils.clearAll(g);

            if (e.type == "Knife") { // 要调整图片方向
                var rot = Utils.getRotationFromTo(g.localToGlobal(), tg.localToGlobal());
                rot += 45;
                g.rotation = rot;
            }

            await AniUtils.flyAndFadeout(g, tg.localToGlobal(), 
                e.type == "Key" ? 300 : 150, 1, 1, 0,
                e.type == "Key" ? undefined : egret.Ease.quintIn);
        }
    }

    // 怪物属性发生变化
    public async onElemChanged(ps) {
        var e = ps.e;
        var sv = this.getSV(e);
        if (ps.subType == "monsterHp") {
            var dhp = ps.dhp;
            var p = sv.localToGlobal();
            if (dhp > 0)
                await AniUtils.tipAt(ViewUtils.getTipText("cure"), p);
        } else if (ps.subType == "die" && e instanceof Monster) {
            var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
            // 怪物死亡特效
            var dieEff = g.addEffect("effMonsterDie", 1);
            dieEff["wait"]().then(() =>g.removeEffect("effMonsterDie"));
        } else if (ps.subType == "useElem")
            await this.onElemUsed(ps);
        
        this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    // 有物品被使用
    public async onElemUsed(ps) {
        var e = ps.e;
        var type = e.type;
        var sv = this.getSV(e);

        if (Utils.checkCatalogues(type, "book")) { // 书籍需要提示还剩几次
            if (e.cnt > 0) {
                var p = sv.localToGlobal();
                AniUtils.tipAt((e.attrs.cnt - e.cnt) + "/" + e.attrs.cnt, {x:p.x+25, y:p.y-25});
                AniUtils.flashAndShake(sv);
            }
            this.bv.playAvatarAni("Book");
        } else if (Utils.checkCatalogues(type, "food")) { // 食物抖一下
            await AniUtils.flashAndShake(sv);
        } else if (type == "IceBlock" || type == "Rock") {
            var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
            AniUtils.flashAndShake(sv);
            var attackEff:egret.MovieClip = g.addEffect("effPlayerAttack", 1);
            await attackEff["wait"]().then();
            g.removeEffect("effPlayerAttack");
        }
    }

    // 披风生效
    public async onCloakImmunizeSneak(ps) {
        var e = ps.e;
        var sv = this.getSV(e);
        await AniUtils.flashOut(sv);
    }

    // 死神步数发生变化
    public async onAddDeathGodStep(ps) {
        var d = Math.abs(ps.d);
        var e = ps.e;

        if (ps.subType == "deathGodBuff"){ // 这个最频繁的操作不产生需要等待的动画
            this.bv.playDeathGodAni().then(() => this.bv.refreshDeathGod());
            if (this.bv.player.deathStep <= this.bv.deathGodWarningStep) {
                // warning 了就开始冒数字
                AniUtils.tipAt(this.bv.player.deathStep.toString(), this.bv.deathGodStepBtn, 20, 0xffffff);
            }
            return;
        }

        if (e && !(e instanceof Relic)) {
            var sv = this.getSV(e);
            var flashCnt = Math.abs(d) < 3 ? 3 : Math.abs(d); // 至少闪三下
            // 死神闪烁后退，道具闪烁;
            this.bv.playDeathGodAni(-1);
            for (var i = 0; i < flashCnt; i++) {
                var stepAt = this.bv.player.deathStep - d + i;
                let eff = ViewUtils.createFrameAni("effExpTrack", "track");
                let track = new BazierControllerWrapper(eff);
                AniUtils.ac.addChild(track);
                eff.play(1);
                var fromPos = sv.localToGlobal();
                fromPos.x += sv.width / 2;
                fromPos.y += sv.height / 2;
                AniUtils.createFlyTrack(track, fromPos, this.bv.effDeathGodGray.localToGlobal(), 400).then(() => {
                    eff.stop();
                    AniUtils.ac.removeChild(track);
                });
                await this.aniFact.createAniByCfg({type:"seq", arr: [
                    {type:"tr", fa:1, ta:3, time:50, obj:sv},
                    {type:"tr", fa:3, ta:1, time:50, obj:sv},
                ]});
                this.bv.refreshDeathGod(stepAt);
            }
            this.bv.playDeathGodAni(0);
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        }
        else {
            // 死神闪烁后退
            this.bv.playDeathGodAni(-1);
            var nps = this.bv.mapView.getGridViews((e:Elem) => e && e.type == "NextLevelPort", false);
            var npsv = nps.length > 0 ? this.getSV(nps[0].getElem()) : undefined;
            var fromPos = npsv.localToGlobal();
            fromPos.x += npsv.width / 2;
            fromPos.y += npsv.height / 2;
            for (var i = 0; i < d; i++) {
                var stepAt = this.bv.player.deathStep - d + i;
                this.bv.refreshDeathGod(stepAt);
                let eff = ViewUtils.createFrameAni("effExpTrack", "track");
                let track = new BazierControllerWrapper(eff);
                AniUtils.ac.addChild(track);
                eff.play(1);
                AniUtils.createFlyTrack(track, fromPos, this.bv.effDeathGodGray.localToGlobal(), 400).then(() => {
                    eff.stop();
                    AniUtils.ac.removeChild(track);
                });
                await AniUtils.delay(50);
            }
            this.bv.playDeathGodAni(0);
        }

        this.bv.refreshDeathGod();
    }

    // 角色信息发生变化
    public async onPlayerChanged(ps) {
        switch (ps.subType) {
            case "money":
                await this.onMoneyChanged(ps);
            break;
            case "exp": {
                this.bv.refreshExpBar();
                var eff = ViewUtils.createFrameAni("effExpTrack", "track");
                var track = new BazierControllerWrapper(eff);
                var sv = this.getSVByPos(ps.fromPos.x, ps.fromPos.y);
                var svPos = sv.localToGlobal();
                svPos.x += sv.width / 2;
                svPos.y += sv.height / 2;
                var expBarPos = this.bv.expBar.localToGlobal();
                expBarPos.x += 7;
                expBarPos.y += (this.bv.expBar.height - 5);
                AniUtils.ac.addChild(track);
                eff.play(1);
                var t = 400; //  Utils.getDist(svPos, expBarPos) / 2;
                AniUtils.createFlyTrack(track, svPos, expBarPos, t).then(() => {
                    eff.stop();
                    AniUtils.ac.removeChild(track);
                    this.aniFact.createAniByCfg({type:"seq", arr:[
                        {type:"tr", fa:1, ta:3, time:75},
                        {type:"tr", fa:3, ta:1, time:75}
                    ], obj:this.bv.expBar, noWait:true});
                    eff = ViewUtils.createFrameAni("effExpTrack", "spot");
                    AniUtils.ac.addChild(eff);
                    eff.x = expBarPos.x;
                    eff.y = expBarPos.y;
                    eff.play(1);
                    eff["wait"]().then(() => { eff.stop(); AniUtils.ac.removeChild(eff); });
                });
            }
            break;
            case "hp": {
                var dm = this.bv.deadlyMask;
                if (this.bv.player.hp <= 5) {
                    egret.Tween.get(dm, {loop:true}).to({"alpha": 1}, 1000).to({"alpha": 0}, 1000);
                } else {
                    egret.Tween.removeTweens(dm);
                    dm.alpha = 0;
                }

                this.aniFact.createAniByCfg({type:"seq", arr:[
                    {type:"tr", fa:1, ta:3, time:75},
                    {type:"tr", fa:3, ta:1, time:75}
                ], obj:this.bv.hpBar, noWait:true});
            }
            default:
        }
    }

    // 金钱变化
    public async onMoneyChanged(ps) {
        var txt = this.bv.getMoneyText();
   
        var e = ps.e;
        var d = ps.d > 0 ? 1 : -1;
        var coinSV = this.getSV(e);

        if (d > 0) 
            await this.coinsFly(e, coinSV, txt, ps.d)
        else if (e.type != "ShopNpc")
            await this.coinsFly(e, txt, coinSV, ps.d)

        this.bv.refreshMoney();
    }

    // 糖衣炮弹
    public async onCandyCannon(ps) {
        var index = Utils.indexOf(this.bv.player.props, (p:Prop) => p.type == "CandyCannon");
        var tarMonsterSV = this.getSV(ps.tar);
        if(index == -1) return;
        var ccView = this.bv.propsView.getPropViewByIndex(index);
        await this.coinsFly(undefined, ccView, tarMonsterSV, ps.dm, 150, {fx:0, fy:0, tx:16, ty:16});
        this.bv.refreshMoney();
    }

    public async coinsFly(e:Elem = undefined, from, to, d:number, time:number = 300, offset = {fx:0, fy:0, tx:0, ty:0}) {
        var dm = Math.abs(d);

        var fromObj = from;
        from = from instanceof egret.DisplayObject ? from.localToGlobal() : from;
        to = to instanceof egret.DisplayObject ? to.localToGlobal() : to;

        var dir = d > 0 ? 1 : -1;
        var coinsImgArr = [];
        for (var i = dm > 15 ? dm - 15 : 0; i < dm; i++) {
            var coinsImg = AniUtils.createImg("Coins_png");
            coinsImgArr.push(coinsImg);
            this.aniFact.createAni("seq", {subAniArr:[
                this.aniFact.createAni("tr", {obj:coinsImg, fx:from.x + offset.fx, fy:from.y + offset.fy,
                    tx:to.x + offset.tx, ty:to.y + offset.ty,
                    fsx:1, fsy:1, tsx:0.6, tsy:0.6, time:time}),
                this.aniFact.createAni("tr", {obj:coinsImg, fa:1, ta:0, time:0})
            ]});
            var cnt = dm - i;
            if (e && Utils.checkCatalogues(e.type, "coin")) {
                if(cnt > 0){
                    e.cnt = cnt;
                    this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
                }
                else if (fromObj instanceof egret.DisplayObject)
                    fromObj.alpha = 0;
            }

            await AniUtils.delay(100);
            var p = this.bv.player ? this.bv.player : this.wmv.player;
            var txt = this.bv.player ? this.bv.getMoneyText() : this.wmv.getMoneyText();
            var v = p.money - (dm - i) * dir;
            txt.text = v.toString();
        }

        coinsImgArr.forEach((img, _) => img["dispose"]());        
    }

    // 吸血效果
    public async bloodFly(e:Elem = undefined, from, to, d:number, time:number, offset = {fx:0, fy:0, tx:0, ty:0}) {
        var fromObj = from;
        from = from instanceof egret.DisplayObject ? from.localToGlobal() : from;
        to = to instanceof egret.DisplayObject ? to.localToGlobal() : to;
        from.x += offset.fx;
        from.y += offset.fy;
        to.x += offset.tx;
        to.y += offset.ty;

        for (var i = d > 15 ? d - 15 : 0; i < d; i++) {
            let img = ViewUtils.createBitmapByName("blood_png");
            img.anchorOffsetX = img.width / 2;
            img.anchorOffsetY = img.height / 2;
            var s = AniUtils.rand.nextDouble() * 2 + 1;
            img.scaleX = s;
            img.scaleY = s;
            let track = new BazierControllerWrapper(img);
            AniUtils.ac.addChild(track);
            AniUtils.createFlyTrack(track, from, to, time).then(() => {
                AniUtils.ac.removeChild(track);
            });

            await AniUtils.delay(200);
            var p = this.bv.player;
            this.bv.refreshHpAt(p.hp + (d - i));
        }

        await AniUtils.delay(time);
        this.bv.refreshHpAt();
    }

    // 产生攻击行为
    public async onAttacking(ps) {        
        if (ps.subType == "player2monster")
            await this.onPlayerAttack(ps);
        else
            await this.onMonsterAttack(ps);
    }

    // 得到攻击结果
    public async onAttacked(ps) {
        if (ps.targetAttrs.owner instanceof Player)
            await this.onPlayerGotAttacked(ps);
        else 
            await this.onMonsterGotAttacked(ps);

        this.bv.refreshPlayer();
        this.bv.mapView.refresh();
    }

    // 攻击时显示怪物伤害值
    showMonsterAttackValue(m, dhp) {
        var sv = this.getSV(m);
        if (dhp < 0) {
            var p = sv.localToGlobal();
            AniUtils.popupTipAt(Math.abs(dhp).toString(), "popupTipBg_png", {x:p.x, y:p.y-25});
        }
    }

    // 玩家受到攻击
    async onPlayerGotAttacked(ps) {
        if (ps.r.r == "attacked") {
            var avatar = this.bv.avatar;
            this.showMonsterAttackValue(ps.attackerAttrs.owner, ps.r.dhp)
            this.bv.playAvatarAni("Hurt");
            await AniUtils.flashAndShake(avatar);
        } else if (ps.r.r == "dodged")
            this.bv.playAvatarAni("Dodged");
        else if (ps.r.r == "blocked")
            this.bv.playAvatarAni("Block");
    }

    // 怪物受到攻击
    async onMonsterGotAttacked(ps) {
        if (ps.attackerAttrs.owner instanceof Monster)
            this.showMonsterAttackValue(ps.attackerAttrs.owner, ps.r.dhp);
        
        var m:Monster = ps.targetAttrs.owner;
        var g = this.getSV(m);
        var dhp = ps.r.dhp;
        var p = g.localToGlobal();
        AniUtils.jumpingTip(dhp.toString(), {x:p.x+g.width,  y:p.y});
        await AniUtils.flashAndShake(g);
    }

    // 玩家攻击
    public async onPlayerAttack(ps) {
        var weapon = ps.weapon;

        if (!weapon) {
            var occ = this.bv.player.occupation;
            // 平砍时有些元素需要表现一下动作
            var itemTypes = ["Baton"];
            var items = this.bv.mapView.getGridViewsWithElem((e:Elem) => Utils.contains(itemTypes, e.type) && e.isValid());
            var aniArr = [];
            for (var it of items) {
                var ani = AniUtils.rotateAndBack(it.getShowLayer());
                aniArr.push(ani);
            }

            // 播放角色动画
            this.bv.playAvatarAni("Attack");

            // 这个效果不等待
            if (aniArr.length > 0)
                this.aniFact.createAniByCfg({type:"gp", arr:aniArr, noWait:true});

            // 刀光
            var e = ps.targets[0];
            if (e) {
                var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
                var attackEff:egret.MovieClip = g.addEffect("effPlayerAttack", 1);
                attackEff["wait"]().then(() => g.removeEffect("effPlayerAttack"));
            }
        } else if (weapon.type == "RayGun") { // 火焰射线 AOE
            // 先飞火球
            var g = this.bv.mapView.getGridViewAt(ps.x, ps.y);
            var sv = this.getSVByPos(ps.x, ps.y);
            var effBall = g.addEffect("effRayGunBall", -1, "default", true);
            var toPos = sv.localToGlobal();
            toPos.x += sv.width / 2;
            toPos.y += sv.height / 2;
            effBall.x += 250;
            effBall.y -= 250;
            effBall.alpha = 0;
            await AniUtils.flyAndFadeout(effBall, toPos, 250, 1, 1, -3600, undefined);
            g.removeEffect("effRayGunBall");

            // 每个目标格子随机一个效果
            ps.poses.forEach((pt, _) => {
                g = this.bv.mapView.getGridViewAt(pt.x, pt.y);
                var eff = g.addEffect("effRayGun", 1, "flame" + AniUtils.rand.nextInt(1, 5), true);
                eff.rotation = AniUtils.rand.nextInt(0, 36) * 10;
                eff["wait"]().then(() => g.removeEffect("effRayGun"));
            });
        } else if (weapon.type == "IceGun") { // 冰冻射线
            var g = this.bv.mapView.getGridViewAt(ps.x, ps.y);
            var eff = g.addEffect("effIceGun", 1);
            await eff["wait"]();
            g.removeEffect("effIceGun");
        } else if (weapon.type == "Bazooka") { // 火箭筒
            // 先飞火球
            var sv = this.getSVByPos(ps.x, ps.y);
            var effBall = ViewUtils.createFrameAni("effBazooka", "fly");
            var toPos = sv.localToGlobal();
            toPos.x += sv.width / 2;
            toPos.y += sv.height / 2;
            var pv = this.getSVOfProp(weapon);
            var fromPos = pv.localToGlobal();
            fromPos.x += pv.width / 2;
            fromPos.y += pv.height / 2;
            var r = Utils.getRotationFromTo(fromPos, toPos);
            effBall.rotation = r;
            AniUtils.ac.addChild(effBall);
            await this.aniFact.createAniByCfg({type:"tr", fx: fromPos.x, fy:fromPos.y, tx:toPos.x, ty:toPos.y, 
                time:250, obj:effBall});
            AniUtils.ac.removeChild(effBall);

            // 爆炸效果
            var g = this.bv.mapView.getGridViewAt(ps.x, ps.y);
            var tar = g.getElem();
            while (g && tar && tar.type == "PlaceHolder")
                tar = tar["linkTo"];
            g = tar ? this.bv.mapView.getGridViewAt(tar.pos.x, tar.pos.y) : g;
            var eff = g.addEffect("effBazooka", 1, "flame");
            eff["wait"]().then(() => g.removeEffect("effBazooka"));
        }
    }
    
    // 怪物攻击
    public async onMonsterAttack(ps) {
        var m:Elem = ps.m;
        var sv = this.getSV(m);
        var flags = ps.addFlags;
        var g = this.bv.mapView.getGridViewAt(m.pos.x, m.pos.y);

        if (Utils.contains(flags, "attackOnPlayerLeave") && m.type == "Gengar")
            await this.gengarLick(sv);
        else if (Utils.contains(flags, "selfExplode")) {
            var explodeEff = g.addEffect("effSelfExplode", 1);
            explodeEff["wait"]().then(() => g.removeEffect("effSelfExplode"));
        } else
            await AniUtils.shakeTo(sv);
    }

    // 怪物吃食物
    public async onMonsterEatFood(ps) {
        var m:Monster = ps.m;
        var food:Elem = ps.food;
        var msv = this.getSV(m);
        var fsv = this.getSV(food);
        await AniUtils.shakeTo(fsv, msv.localToGlobal());
        this.bv.mapView.refreshAt(food.pos.x, food.pos.y);
    }

    // 元素飞行
    public async onElemFlying(ps) {
        var e = ps.e;
        var sv = this.getSVByPos(ps.fromPos.x, ps.fromPos.y);
        var tosv = this.getSVByPos(ps.toPos.x, ps.toPos.y);
        var ta = e.type == "CowardZombie" ? 0 : 1; // 贪婪僵尸的飞行是带隐藏效果的
        await AniUtils.flyAndFadeout(sv, tosv.localToGlobal(), 500, 1, ta, 0, egret.Ease.quintIn);
        this.bv.refreshPlayer();
        this.bv.mapView.refreshAt(ps.fromPos.x, ps.fromPos.y);
        this.bv.mapView.refreshAt(ps.toPos.x, ps.toPos.y);
    }

    // 元素跟去下一层
    public async onElem2NextLevel(ps) {
        var e = ps.e;
        var sv = this.getSV(e);
        var tosv = this.bv.mapView.getGridViewsWithElem((elem:Elem) => elem.type == "NextLevelPort", false)[0];
        if (e instanceof Monster)
            await AniUtils.flyAndFadeout(sv, tosv.localToGlobal(), 1000, 1, 0, 0, undefined);
        else
            await AniUtils.fly2(sv, sv, tosv, false, 0);

        this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
    }

    // 元素移动
    public async onElemMoving(ps) {
        var path = ps.path;
        if (path.length <= 1) // 只有一个起点，就不用移动了
            return;

        var fromPt = path[0];

        // 创建路径动画
        var showPath = Utils.map(path, (pt) => this.bv.mapView.logicPos2ShowPos(pt.x - fromPt.x, pt.y - fromPt.y));
        showPath.shift();
        var ev = this.getSVByPos(fromPt.x, fromPt.y);
        await this.aniFact.createAni("moveOnPath", {obj: ev, path: showPath, time:250, mode:egret.Ease.sineInOut});
        
        // 刷新格子显示
        this.bv.mapView.refreshAt(fromPt.x, fromPt.y);
        if (path.length > 1)
            this.bv.mapView.refreshAt(path[path.length - 1].x, path[path.length - 1].y);

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    public async onInitBattleView(ps) {
        var dm = this.bv.deadlyMask;
        if (this.bv.player.hp <= 5) {
            egret.Tween.get(dm, {loop:true}).to({"alpha": 1}, 1000).to({"alpha": 0}, 1000);
        } else {
            egret.Tween.removeTweens(dm);
            dm.alpha = 0;
        }   
    }

    // 怪物被魅惑
    public async onMonsterCharmed(ps) {
        var tar:Monster = ps.m;
        var gv = this.bv.mapView.getGridViewAt(tar.pos.x, tar.pos.y);
        gv.addEffect("effCharmed");
    }

    // 关卡初始化乱序动画
    // 等待点击屏幕
    public async onAllCoveredAtInit(ps) {
        await AniUtils.wait4click();

        var rand = new SRandom();
        var svArr = [];
        var evs = this.bv.mapView.getGridViewsWithElem(undefined, true);
        evs.forEach((ev, _) => {
            var sv = ev.getShowLayer();
            sv["gx"] = ev.getElem().pos.x;
            sv["gy"] = ev.getElem().pos.y;
            sv["tgx1"] = rand.nextInt(0, GCfg.mapsize.w);
            sv["tgy1"] = rand.nextInt(0, GCfg.mapsize.h);
            sv["tgx2"] = rand.nextInt(0, GCfg.mapsize.w);
            sv["tgy2"] = rand.nextInt(0, GCfg.mapsize.h);
            sv["tgx3"] = rand.nextInt(0, GCfg.mapsize.w);
            sv["tgy3"] = rand.nextInt(0, GCfg.mapsize.h);
            sv["delay1"] = rand.nextInt(100, 1000);
            sv["delay2"] = rand.nextInt(100, 1000);
            sv["delay3"] = rand.nextInt(100, 1000);
            sv["delay4"] = rand.nextInt(100, 1000);
            svArr.push(sv);
        });

        // 开始乱窜
        var revArr = AniUtils.LoopMoveAll(svArr, this.bv.mapView);
        await AniUtils.delay(2000);

        // 开始发牌盖住所有格子
        await AniUtils.coverAll(this.bv.mapView);
        
        svArr.forEach((sv, _) => AniUtils.clearAll(sv));
        revArr.forEach((rev, _) => rev());
        this.bv.refresh();
    }

    // 关卡事件
    public async onGoOutLevel(ps) {
    }

    // 偷钱
    public async onMoneyStolen(ps) {
        await this.aniFact.createAni("stealMoney", {"dm":ps.dm});
    }

    // 吸血
    public async onSuckPlayerBlood(ps) {
        var m = ps.m;
        var dhp = ps.dhp;
        var g = this.bv.mapView.getGridViewAt(m.pos.x, m.pos.y);
        g.addEffect("effSuckBloodCircle");
        var sv = this.getSV(m);
        await this.bloodFly(m, this.bv.getBloodText(), sv, -dhp, 300, {fx:0, fy:0, tx:sv.width / 2, ty:sv.height / 2});
        g.removeEffect("effSuckBloodCircle");
        this.bv.refreshPlayer();
        this.bv.mapView.refreshAt(m.pos.x, m.pos.y);
    }

    // 怪物拿走物品
    public async onMonsterTakeElem(ps) {
        var m = ps.m;
        var es:Elem[] = ps.es;
        var toDropList = ps.toDropList;

        var msv = this.getSV(m);
        if (es[0].type != "Coins" && toDropList) { // 抛物线飞到左上角
            Utils.assert(es.length == 1, "can not take more than 1 item toDropList");
            var e = es[0];
            var dropItemImg = this.bv.mapView.getGridViewAt(m.pos.x, m.pos.y).getDropItemImg();
            var g = this.getSV(e)
            await AniUtils.fly2(g, g, dropItemImg, false, 1);
            this.bv.mapView.refreshAt(m.pos.x, m.pos.y);
        } else { // 直线飞向怪物消失
            var svArr = [];
            for (var e of es) {
                var g = this.getSV(e);
                svArr.push(g);
            }
            
            await AniUtils.flyAndFadeoutArr(svArr, msv.localToGlobal(), 500, 0.5, 0, 0, egret.Ease.quintIn);
        }

        for (var e of es)
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
    }

    // 眼魔死亡时飞几个眼睛出来
    public async onEyeDemonUncoverGrids(ps) {
        var m:Elem = ps.m;
        var eyes = [];
        var lastAni;
        for (var pt of ps.pts) {
            var e = AniUtils.createImg("eyeDemonEye_png");
            eyes.push(e);
            lastAni = AniUtils.flyOutLogicPos(e, this.bv.mapView, m.pos, pt);
        }

        if (lastAni)
            await lastAni;

        eyes.forEach((e, _) => e["dispose"]());
    }

    // 物品被拿起等待使用时的悬浮效果
    public async onElemFloating(ps) {
        var e:Elem = ps.e;
        var sv = this.getSV(e);
        await AniUtils.floating(sv, ps.stop);
    }

    // 通缉令
    public async onMakeWanted(ps) {
        await this.onElemFlying(ps);
        var g = this.bv.mapView.getGridViewAt(ps.toPos.x, ps.toPos.y);
        g.addEffect("effWantedOrder");
    }

    // 玩家获得buff
    public async onBuffAdded(ps) {
        var buff = ps.buff;
        var buffType = buff.type;

        if (ps.target instanceof Player) {
            if(buffType == "BuffPoisonOnGrids") {
                var gs = Utils.map(buff.grids, (g) => this.bv.mapView.getGridViewAt(g.pos.x, g.pos.y));
                gs.forEach((g:GridView, _) => {
                    g.addColorEffect("gridPoisoned");
                    g.addRandomDelayLoopEffect("effPoisonMist", AniUtils.rand, [0, 30000]);
                });
            }
        } else {
            var e = <Elem>(ps.target);
            var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
            switch (buffType) {
                case "BuffPoison":
                    g.addColorEffect("elemPoisoned");
                break;
                case "BuffFlame":
                break;
            }
        }
    }

    // buff 移除
     public async onBuffRemoved(ps) {
        var buff = ps.buff;
        var buffType = buff.type;

        if (ps.target instanceof Player) {
            if(buffType == "BuffPoisonOnGrids") {
                var gs = Utils.map(buff.grids, (g) => this.bv.mapView.getGridViewAt(g.pos.x, g.pos.y));
                gs.forEach((g, _) => {
                    g.removeEffect("gridPoisoned");
                    g.removeEffect("effPoisonMist");
                });
            }
        }
        else {
            var e = <Elem>(ps.target);
            var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
            switch (buffType) {
                case "BuffPoison":
                    g.removeEffect("elemPoisoned");
                break;
                case "BuffFlame":                    
                break;
            }
        }
    }

    // 物品不可使用
    public async canNotUseItem(ps) {
        if (!ps.r) return;

        var e:Elem = ps.e;
        var sv = this.getSV(e);
        var pos = sv.localToGlobal();
        pos.x += sv.width / 2
        pos.y -= sv.height / 2;
        AniUtils.tipAt(ViewUtils.getTipText(ps.r), pos);
        await AniUtils.flashAndShake(sv);
    }

    public async onRelicAddElem(ps){
        var relics = this.bv.relics;
        var relicImg = this.getBitmapOfRelic(ps.r);
        if(relicImg)
            await AniUtils.flash(relicImg, 200);
    }

    // 耿鬼长舌头攻击动画
    async gengarLick(sv:egret.DisplayObject) {
        var bodyOffset = {x:sv.width / 2, y:sv.height};
        var tongueAnchorPos = {x:0, y:-30};
        var avatarPos = this.bv.avatar.localToGlobal();

        // 耿鬼长舌头攻击: 播一段骨骼动画 + 一段 tr 动画 + 一段骨骼动画

        sv.alpha = 0; // 隐藏原怪物形象

        // 播放攻击前段动画
        var aw1 = this.aniFact.createAni("skeleton", {name:"genggui_shenti", act:"start", playTimes:1});
        var aw2 = this.aniFact.createAni("skeleton", {name:"genggui_shetou", act:"start", playTimes:1});
        var disp1:egret.DisplayObject = aw1["getDisplay"]();
        var disp2:egret.DisplayObject = aw2["getDisplay"]();
        AniUtils.ac.addChild(disp1);
        AniUtils.ac.addChild(disp2);
        var dispPos = sv.localToGlobal();
        disp1.x = dispPos.x + bodyOffset.x;
        disp1.y = dispPos.y + bodyOffset.y;
        disp2.x = disp1.x + tongueAnchorPos.x;
        disp2.y = disp1.y + tongueAnchorPos.y;
        disp2.anchorOffsetX = tongueAnchorPos.x;
        disp2.anchorOffsetY = tongueAnchorPos.y;
        var tongueRootPos = {x:disp2.x + disp2.anchorOffsetX, y:disp2.y + disp2.anchorOffsetY};
        var avatarCenterPos = {x:avatarPos.x + this.bv.avatar.width / 2, y:avatarPos.y + this.bv.avatar.height/2};
        var r = Utils.getRotationFromTo(tongueRootPos, avatarCenterPos) + 90;
        var aw3 = this.aniFact.createAni("tr", {obj:disp2, fr:0, tr:r, time:500});
        await this.aniFact.createAni("gp", {subAniArr:[aw1, aw2, aw3]});

        // 舌头伸长进行攻击
        var ys = Utils.getDist(tongueRootPos, avatarCenterPos) / disp2.height;
        var aw4 = this.aniFact.createAni("tr", {obj:disp2, fsy:1, tsy:ys, time:100, mode:egret.Ease.cubicIn});
        var aw5 = this.aniFact.createAni("tr", {obj:disp2, fsy:ys, tsy:1, time:100, mode:egret.Ease.cubicOut});
        await this.aniFact.createAni("seq", {subAniArr:[aw4, aw5]});

        AniUtils.ac.removeChild(disp1);
        AniUtils.ac.removeChild(disp2);

        // 播放攻击后段动画
        var aw1 = this.aniFact.createAni("skeleton", {name:"genggui_shenti", act:"back", playTimes:1});
        var aw2 = this.aniFact.createAni("skeleton", {name:"genggui_shetou", act:"back", playTimes:1});
        var disp1:egret.DisplayObject = aw1["getDisplay"]();
        var disp2:egret.DisplayObject = aw2["getDisplay"]();
        AniUtils.ac.addChild(disp1);
        AniUtils.ac.addChild(disp2);
        disp1.x = dispPos.x + bodyOffset.x;
        disp1.y = dispPos.y + bodyOffset.y;
        disp2.x = disp1.x + tongueAnchorPos.x;
        disp2.y = disp1.y + tongueAnchorPos.y;
        disp2.anchorOffsetX = tongueAnchorPos.x;
        disp2.anchorOffsetY = tongueAnchorPos.y;
        disp2.rotation = r;
        var tongueRootPos = {x:disp2.x + disp2.anchorOffsetX, y:disp2.y + disp2.anchorOffsetY};
        var avatarCenterPos = {x:avatarPos.x + this.bv.avatar.width / 2, y:avatarPos.y + this.bv.avatar.height/2};
        var aw3 = this.aniFact.createAni("tr", {obj:disp2, fr:-(360-r), tr:0, time:250});
        this.aniFact.createAni("gp", {subAniArr:[aw1, aw2, aw3]}).then(() => {
            AniUtils.ac.removeChild(disp1);
            AniUtils.ac.removeChild(disp2);
            sv.alpha = 1;
        });
    }

    // 黑幕开启
    async blackIn(removedWhenFinish = false) {
        this.addChild(this.blackCover);
        await this.aniFact.createAni("tr", {obj: this.blackCover, fa:0, ta:1, time: 500});
        if (removedWhenFinish)
            this.removeChild(this.blackCover);
    }

    // 黑幕退出
    async blackOut() {
        if (!this.contains(this.blackCover))
            this.addChild(this.blackCover);

        await this.aniFact.createAni("tr", {obj: this.blackCover, fa:1, ta:0, time: 500});
        this.removeChild(this.blackCover);
    }

    // 动画开始播放时，阻止玩家操作
    aniLayerCnt = 0;
    onAniStarted(ani:Promise<void>, aniType:string, ps = undefined) {
        this.addBlockLayer();
        ani.then(() => this.decBlockLayer());
    }

    // 增加阻挡点击的操作层数（类似自旋），只要结果 >0 就会阻挡操作
    public addBlockLayer() {
        if (this.aniLayerCnt == 0) {
            this.addChild(this.aniCover);
            ViewUtils.asFullBg(this.aniCover);
        }
        this.aniLayerCnt++;
    }

    // 减少阻挡点击的操作层数，只有结果 == 0 才会解除阻挡
    public decBlockLayer() {
        Utils.assert(this.aniLayerCnt > 0, "aniLayerCnt corrupted");
        this.aniLayerCnt--;
        if (this.aniLayerCnt == 0)
            this.removeChild(this.aniCover);
        Utils.assert(this.aniLayerCnt >= 0, "aniLayerCnt corrupted");
    }
}
