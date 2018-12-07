// 主视图下属的动画层
class AniView extends egret.DisplayObjectContainer {
    private mv:MainView;
    
    private get bv():BattleView { return this.mv.bv; } // 战斗视图
    private get sv():ShopView { return this.mv.sv; } // 商店视图
    private get wmv():WorldMapView { return this.mv.wmv; } // 大地图
    private get wmtv():WorldMapTopView { return this.mv.wmtv; } // 大地图顶部

    private blackCover:egret.Bitmap; // 黑屏用的遮挡
    private aniCover:egret.Bitmap; // 播放动画时的操作屏蔽层
    public aniFact:AnimationFactory; // 动画工厂

    public showRelicLevelUpDesc; // 遗物升级时的信息提示    

    public constructor(w:number, h:number, mainView:MainView) {
        super();
        this.width = w;
        this.height = h;
        
        this.mv = mainView;
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

    getEVByPos(x, y):egret.DisplayObject {
        return this.bv.mapView.getGridViewAt(x, y).getEffectLayer();
    }

    // 获取一个道具对应的PropView
    getSVOfProp(p:Prop):PropView {
        var index = Utils.indexOf(this.bv.player.props, (prop:Prop) => prop.type == p.type);
        return this.bv.propsView.getPropViewByIndex(index)
    }

    // 获取一个玩家的遗物对应的Bitmap
    getBitmapOfRelic(r:Relic):egret.Bitmap {
        var index = Utils.indexOf(this.bv.player.relicsEquipped, (relic:Relic) => relic.type == r.type);
        return index >= this.bv.relics.length && index < this.bv.player.relicsEquipped.length ? undefined : this.bv.relics[index];
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
        var anis = [];
        var objs = [];
        for (var i = 0; i < es.length; i++) {
            var e = es[i];
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y, e && e.isBig() ? e.attrs.size : undefined);
            var obj = this.getSVByPos(e.pos.x, e.pos.y);
            objs.push(obj);
            var ani;
            if (e.attrs.addInEffect == "noEffect") {
                // 不需要额外表现效果
            }
            else if (!fromPos || (e.pos.x == fromPos.x && e.pos.y == fromPos.y)) // 原地跳出来
                ani = AniUtils.jumpInMap(obj);
            else
                ani = AniUtils.flyOutLogicPos(obj, this.bv.mapView, fromPos);

            if (ani)
                anis.push(ani);
        }

        for (var i = 0; i < anis.length; i++)
            await anis[i];

        objs.forEach((obj, _) => obj["resetSelf"]());
        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
        this.bv.mapView.refresh();
    }

    // 指定位置发生状态或元素变化
    public async onGridChanged(ps) {
        var e:Elem = ps.e;
        if(!e)
            e = this.bv.player.bt().level.map.getElemAt(ps.x, ps.y);
        var sv = this.bv.mapView.getGridViewAt(ps.x, ps.y);
        var doRefresh = () => this.bv.mapView.refreshAt(ps.x, ps.y, e && e.isBig() ? e.attrs.size : undefined);
        if(e && e.type == "Vest") {
            var bt = this.bv.player.bt();
            var ms = bt.level.map.findAllElems((e:Elem) => e instanceof Monster && e.isHazard())
            ms.forEach((m:Monster, _) => {
                var pos = m.pos;
                this.bv.mapView.refreshAt(pos.x, pos.y, m.isBig());
            })
        }

        switch (ps.subType) {
            case "elemAdded": // 有元素被添加进地图
                if (e.type == "DeathGod") {
                    await sv.addEffect("effDeathGodIn", 1)["wait"]();
                    sv.removeEffect("effDeathGodIn");
                }

                doRefresh();
                // 需要提示的元素变化时,刷新战斗地图的元素提示
                if (e && Utils.indexOf(GCfg.getBattleViewElemTipTypes(), (s: string) => s == e.type) > -1) 
                    this.bv.refreshElemsTip();
                var obj = this.getSVByPos(ps.x, ps.y);
                if (ps.e instanceof Plant || (ps.e instanceof Monster && ps.e.type == "ShopNpc")) {
                    // 植物都是玩家这边的，直接加魅惑表现
                    // sv.addEffect("effCharmed");
                    this.bv.mapView.refreshAt(ps.x, ps.y);
                    AudioFactory.play("charmed");
                } else if (e.attrs.addInEffect == "noEffect") {
                    // 不需要额外表现效果
                } else if (e instanceof Monster) // 怪物是从地下冒出
                    await AniUtils.crawlOut(obj);
                else if (!ps.fromPos || (e.pos.x == ps.fromPos.x && e.pos.y == ps.fromPos.y)) { // 原地跳出来
                    await AniUtils.jumpInMap(obj);
                } else // 飞出来，从跳出来的位置到目标位置有一段距离
                    await AniUtils.flyOutLogicPos(obj, this.bv.mapView, ps.fromPos);

                obj["resetSelf"]();
                break;
            case "gridBlocked": {
                var img = AniUtils.createImg("blocked_png");
                img.width = sv.width;
                img.height = sv.height;
                img.anchorOffsetX = img.width / 2;
                img.anchorOffsetY = img.height / 2;
                var toPos = AniUtils.ani2global(sv);
                img.x = toPos.x + sv.width / 2;
                img.y = toPos.y + sv.height / 2;
                img.alpha = 0;
                img.scaleX = img.scaleY = 5;
                await this.aniFact.createAni("tr", {
                    obj:img, time: 750,
                    tsx:1, tsy:1, ta:1, mode:egret.Ease.backIn
                });
                img["dispose"]();
                AudioFactory.play("block");
                doRefresh();
            }
            break;
            case "gridUnblocked": {
                doRefresh();
                var img = AniUtils.createImg("blocked_png");
                img.width = sv.width;
                img.height = sv.height;
                img.anchorOffsetX = img.width / 2;
                img.anchorOffsetY = img.height / 2;
                var toPos = AniUtils.ani2global(sv);
                img.x = toPos.x + sv.width / 2;
                img.y = toPos.y + sv.height / 2;
                img.alpha = 1;
                img.scaleX = img.scaleY = 1;
                await this.aniFact.createAni("tr", {
                    obj:img, time: 750,
                    tsx:5, tsy:5, ta:0, mode:egret.Ease.backOut
                });
                img["dispose"]();
            }
            break;
            case "gridUncovered": {
                doRefresh();
                sv.removeEffect("effPoisonMist"); // 翻开就去掉毒雾
                if (ps.stateBeforeUncover != GridStatus.Marked) {
                    var eff = sv.addEffect("effUncover", 1); // 翻开特效
                    eff["wait"]().then(() => sv.removeEffect("effUncover"));
                }

                if (e instanceof Monster && (<Monster>e).isBoss)
                    await AniUtils.shakeCamera(2, 100);
            }
            break;
            case "elemMarked": {
                doRefresh();
                AudioFactory.play("mark");
                if (!e.attrs.invisible) {
                    var img = AniUtils.createImg(e.getElemImgRes() + "_png");
                    var pos = AniUtils.ani2global(sv);
                    img.x = pos.x;
                    img.y = pos.y;
                    img.width = sv.width;
                    img.height = sv.height;
                    img.scaleX = sv.scaleX;
                    img.scaleY = sv.scaleY;
                    AniUtils.flash(img, 250, true).then(() => {
                        this.aniFact.createAniByCfg({type:"tr", fa:1, ta:0, time:250, obj:img}).then(() => {
                            img["dispose"]();
                        });
                    });
                    await AniUtils.delay(100);
                }
            }
            break;
            // 以下情况需要连特效一起移动
            case "move2StartupRegion":
                this.bv.mapView.refresh(); // 整地图刷新，不然会看到残留的魅惑特效之类的
            break;
            default:
                doRefresh();
        }

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    // 刷新地图显示
    public refreshMap() {
        this.bv.mapView.refresh();
    }

    // 揭开起始区域
    public async onStartupRegionUncovered(ps) {
        var grids = ps.grids;
        for (var i = 0; i < grids.length; i++) {
            let pos = grids[i];
            let g = this.bv.mapView.getGridViewAt(pos.x, pos.y);
            g.refresh();
            var eff = g.addEffect("effUncover", 1); // 翻开特效
            eff["wait"]().then(() => g.removeEffect("effUncover"));
            await AniUtils.delay(100);
        }

        await AniUtils.delay(500);
        grids.forEach((pos, _) => this.bv.mapView.refreshAt(pos.x, pos.y));
        await AniUtils.delay(500);
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
            fromImg["resetSelf"]();
        }
        this.bv.refreshProps();
    }

    // 遗物发生变化
    public async onRelicChanged(ps) {
        var e:Elem = ps.e;
        var p = e.bt().player;
        var n = Utils.indexOf(p.relicsEquipped, (p) => p.type == e.type);        
        var toRefImg = n >= 0 && n < this.bv.relics.length && n < p.relicsEquipped.length ? this.bv.relics[n] : this.bv.moreRelics;
        
        var toImg = AniUtils.createImg(undefined);
        var toRefPos = AniUtils.ani2global(toRefImg);
        toImg.x = toRefPos.x;
        toImg.y = toRefPos.y;
        toImg.width = this.bv.relics[0].width;
        toImg.height = this.bv.relics[0].height;
        if (ps.subType == "addRelicByPickup") {
            var fromObj = this.getSV(e);
            await AniUtils.fly2(fromObj, fromObj, toImg, true, 1);
            fromObj["resetSelf"]();
            toImg["dispose"]();
            await this.showRelicLevelUpDesc(e);
        } else if (ps.subType == "addRelicBySel") {
            var fromPos = PlayerLevelUpView.lastSelectedRelicImgGlobalPos
            if (fromPos) {
                var fromImg = AniUtils.createImg(e.getElemImgRes() + "_png");
                fromImg.x = fromPos.x;
                fromImg.y = fromPos.y;
                fromImg.width = fromPos.w;
                fromImg.height = fromPos.h;
                await AniUtils.flash(fromImg, 200, false);
                await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
                fromImg["dispose"]();
                toImg["dispose"]();
            }
            this.tipRelicShortDesc(<Relic>e);
        } else if (ps.subType == "addRelicByRookie") {
            var fromImg = AniUtils.createImg(e.getElemImgRes() + "_png");
            fromImg.x = this.width / 2;
            fromImg.y = this.height / 2;
            await AniUtils.flash(fromImg, 200, false);
            await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
            fromImg["dispose"]();
            toImg["dispose"]();
            await GridView.showElemDesc(e);
        } else if (ps.subType == "addRelicByLuxuryChest") {
            var fromObj = this.getSV(ps.fromBox);
            var fromObjPos = AniUtils.ani2global(fromObj);
            var flyImg = AniUtils.createImg(e.getElemImgRes() + "_png");
            flyImg.x = fromObjPos.x;
            flyImg.y = fromObjPos.y;
            fromObj.alpha = 0;
            await AniUtils.fly2(flyImg, fromObj, toImg, true, 1);
            flyImg["dispose"]();
            await this.showRelicLevelUpDesc(e);
            fromObj.alpha = 1;
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
        toImg.x = this.wmtv.btnSetting.x;
        toImg.y = this.wmtv.btnSetting.y;
        toImg.width = toImg.height = 0;
        toImg.alpha = 0;

        await AniUtils.flash(fromImg, 200, false);
        await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
        fromImg["dispose"]();
        toImg["dispose"]();

        // 遗物需要出个短提示
        if (e instanceof Relic) {
            this.tipRelicShortDesc(e);
            this.wmtv.refresh();
        }
    }

    public get player() {
        return this.bv.player ? this.bv.player : this.wmv.player;
    }

    // 遗物获得短提示
    async tipRelicShortDesc(r:Relic) {
        var nameAndDesc = ViewUtils.getElemNameAndDesc(r.type);
        var shortDesc = ViewUtils.replaceByProperties(nameAndDesc.shortDesc, r, this.player, 0);
        AniUtils.tipAt(shortDesc, {x:this.width/2, y:this.height/3}, 25, 0xffffff, 1500);
    }

    // 在大地图上获得金钱
    public async onGetMoneyInWorldmap(ps) {
        var coin = this.wmtv.getMoneyIcon();
        var d = ps.dm > 0 ? 1 : -1;
        var p = this.wmv.player;
        var toPos = ps.reason == "shop" ? this.sv.shopNpcSlotGlobalPos : WorldMapEventSelsView.lastSelectionGlobalPos;

        if (d > 0)
            await this.coinsFly(undefined, toPos, coin, ps.dm);
        else
            await this.coinsFly(undefined, coin, toPos, ps.dm);

        this.wmtv.refreshMoney();
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

        this.wmtv.refreshHp();
    }

    // 休息屋休息
    public async onHospitalCureStart(ps) {
        await this.blackIn();
    }
    public async onHospitalCureEnd(ps) {
        this.wmtv.refreshHp();
        await this.blackOut();
    }

    // 偷袭表现
    public async onSneaking(ps) {
        var m:Elem = ps.m;
        var sv = this.getSV(m);
        if (m.attrs.invisible || ps.isNormalAttack)
            return;

        var img = AniUtils.createImg(m.getElemImgRes() + "_png");
        img.anchorOffsetX = img.width / 2;
        img.anchorOffsetY = img.height / 2;
        var toPos = AniUtils.ani2global(sv);
        img.x = toPos.x + sv.width / 2;
        img.y = toPos.y + sv.height / 2;
        img.alpha = 1;
        img.scaleX = img.scaleY = 1;
        var nameAndDesc = ViewUtils.getElemNameAndDesc(m.type);
        var sneakSkillName = nameAndDesc.skillNames && nameAndDesc.skillNames.length > 0 ? nameAndDesc.skillNames[0] : ViewUtils.getTipText("sneaking");
        AudioFactory.play("monsterSneak");
        AniUtils.tipAt(sneakSkillName, {x:toPos.x + 50, y:toPos.y + 30}, 40, 0xffffff);
        this.aniFact.createAni("tr", {
            obj:img, time: 2000,
            tsx:5, tsy:5, ta:0, mode:egret.Ease.backOut, noWait:true
        }).then(() => img["dispose"]());
        await AniUtils.delay(500);
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
                await AniUtils.turnover(g, () => {
                    this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
                }, false);
            }
            else
                this.bv.mapView.refreshAt(e.pos.x, e.pos.y);

            g["resetSelf"]();
        }
    }

    // 正要使用物品
    public async onUseElem(ps) {
        var e = ps.e;
        var sv = this.getSV(e);
        var type = e.type;
        
        if (type == "IceBlock" || type == "Rock" || type == "Cocoon") {
            AniUtils.flashAndShake(sv);
            var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
            var attackEff:egret.MovieClip = g.addEffect("effPlayerAttack", 1);
            AudioFactory.play("attacking");
            await attackEff["wait"]().then();
            g.removeEffect("effPlayerAttack");
        }

        if (e.attrs.audioOnUsing)
            AudioFactory.play(e.attrs.audioOnUsing);

        sv["resetSelf"]();
    }

    // 对目标位置使用物品
    public async onUseElemAt(ps) {
        var e = ps.e;
        if (e.type == "Key" || e.type == "Knife" || e.type == "SmallRock" || e.type == "Shield") { // 钥匙飞向目标
            var g = this.getSV(e);
            var tar = this.bv.mapView.getGridViewAt(ps.toPos.x, ps.toPos.y).getElem();
            var tg = this.bv.mapView.getGridViewAt(ps.toPos.x, ps.toPos.y);
            AniUtils.clearAll(g);

            if (e.type == "Knife"|| e.type == "Shield") { // 要调整图片方向
                var rot = Utils.getRotationFromTo(
                    AniUtils.ani2global(g), 
                    AniUtils.ani2global(tg));
                rot += 45;
                g.rotation = rot;
            }

            await AniUtils.flyAndFadeout(g, AniUtils.ani2global(tg), 
                e.type == "Key" ? 300 : 150, 1, 1, 0,
                e.type == "Key" ? undefined : egret.Ease.quintIn);

            if (e.type == "Key") {
                if (tar.type == "Door")
                    AudioFactory.play("openDoor");
                else if (tar.type == "TreasureBox")
                    AudioFactory.play("openBox");
            }

            g["resetSelf"]();

            // // 盾牌飞出去后需要隐藏原来格子的显示内容
            // if (e.type == "Shield")
            //     g.alpha = 0;
        }
    }

    // 处理盾牌攻击完成后的动画
    public async onShieldFlyBack(ps) {
        var e:Elem = ps.e;
        var g = this.getSV(e);
        if (ps.back) {
            var fg = this.bv.mapView.getGridViewAt(ps.from.pos.x, ps.from.pos.y);
            var fp = AniUtils.ani2global(fg);
            var tp = AniUtils.ani2global(g);
            var img = AniUtils.createImg(e.getElemImgRes() + "_png");
            img.x = fp.x;
            img.y = fp.y;
            await AniUtils.flyAndFadeout(img, tp, 150, 1, 1, 0, egret.Ease.quintIn);
            img["dispose"]();
        }
        g.alpha = 1;
    }

    // 怪物属性发生变化
    public async onElemChanged(ps) {
        var e = ps.e;
        var sv = this.getSV(e);
        var noFreshElemAtPos = false; // 为了某些特殊表现效果，暂时不刷新指定位置

        // 需要提示的元素变化时,刷新战斗地图的元素提示
        if (e && Utils.indexOf(GCfg.getBattleViewElemTipTypes(), (s: string) => s == e.type) > -1) {
            this.bv.refreshElemsTip();
        }
        if (ps.subType == "monsterHp") {
            var dhp = ps.dhp;
            var p = AniUtils.ani2global(sv);
            if (dhp > 0) {
                AniUtils.tipAt(ViewUtils.getTipText("cure"), {x:p.x+44, y:p.y+1}, 30);
                AniUtils.jumpingTip(dhp.toString(), {x:p.x+sv.width,  y:p.y}, "lvFnt");
            }
            else if (dhp < 0 && !e.isDead()){
                if (ps.flag == "thorns")
                    AniUtils.tipAt(ViewUtils.getTipText("thorns"), {x:p.x+44, y:p.y+31}, 30);

                AniUtils.jumpingTip((-dhp).toString(), {x:p.x+sv.width,  y:p.y-sv.height/2}, "wmFnt");
            }
        } else if (ps.subType == "die" && e instanceof Monster) {
            if (e.type == "ShopNpc" && Utils.contains(ps.flags, "byUse")) {
                await AniUtils.flashOut(sv, false);
            } else if (Utils.contains(ps.flags, "frozen")) {
                noFreshElemAtPos = true; // 冰冻死亡的什么也不干
            } else {
                var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
                // 怪物死亡特效
                g.clearAllEffects();
                var dieEff = g.addEffect("effMonsterDie", 1);
                dieEff["wait"]().then(() =>g.removeEffect("effMonsterDie"));
            }
        } else if (ps.subType == "useElem")
            await this.onElemUsed(ps);
        
        if (!noFreshElemAtPos)
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响

        sv["resetSelf"]();
    }

    // 有物品被使用
    public async onElemUsed(ps) {
        var e = ps.e;
        var type = e.type;
        var sv = this.getSV(e);

        if (Utils.checkCatalogues(type, "book")) { // 书籍需要提示还剩几次
            if (e.cnt > 0) {
                var p = AniUtils.ani2global(sv);
                AniUtils.tipAt((e.attrs.cnt - e.cnt) + "/" + e.attrs.cnt, {x:p.x+41, y:p.y-1});
                await AniUtils.flashAndShake(sv);
            }
            this.bv.playAvatarAni("Book");
        } else if (Utils.checkCatalogues(type, "food")) { // 食物抖一下
            AudioFactory.play("takeFood");
            await AniUtils.flashAndShake(sv);
        } else if (e.attrs.audioOnUsed)
            AudioFactory.play(e.attrs.audioOnUsed);

        sv["resetSelf"]();
    }

    // 披风生效
    public async onCloakImmunizeSneak(ps) {
        var e:Elem = ps.e;
        var m = ps.m;
        var sv = this.getSV(e);
        var msv = this.getSV(m);
        var toPos = AniUtils.ani2global(msv);
        await AniUtils.flashOut(sv, false);
        await AniUtils.flyAndFadeout(sv, toPos, 500, 1, 1, 0, egret.Ease.cubicIn);
        sv.alpha = 0;
        var img = AniUtils.createImg(e.getElemImgRes() + "_png");
        img.anchorOffsetX = img.width / 2;
        img.anchorOffsetY = img.height / 2;
        img.x = toPos.x;
        img.y = toPos.y;
        img.alpha = 1;
        img.scaleX = img.scaleY = 1;
        this.aniFact.createAni("tr", {
            obj:img, time: 2000,
            tsx:5, tsy:5, ta:0, mode:egret.Ease.backOut, noWait:true
        }).then(() => {
            img["dispose"]();
            sv["resetSelf"]();
        });
        await AniUtils.delay(500);
    }

    // 死神步数发生变化
    public async onAddDeathGodStep(ps) {
        var d = Math.abs(ps.d);
        var sign = ps.d < 0 ? -1 : 1;
        var e = ps.e;

        if (ps.subType == "deathGodBuff"){ // 这个最频繁的操作不产生需要等待的动画
            this.bv.playDeathGodAni().then(() => this.bv.refreshDeathGod());
            if (this.bv.player.deathStep > 0 && this.bv.player.deathStep <= this.bv.deathGodWarningStep) {
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
                var stepAt = this.bv.player.deathStep - ps.d + i * sign;
                let eff = ViewUtils.createFrameAni("effExpTrack", "track");
                let track = new BazierControllerWrapper(eff);
                AniUtils.ac.addChild(track);
                eff.play(1);
                var fromPos = AniUtils.ani2global(sv);
                fromPos.x += sv.width / 2;
                fromPos.y += sv.height / 2;
                AniUtils.createFlyTrack(track, fromPos, AniUtils.ani2global(this.bv.effDeathGodGray), 400).then(() => {
                    eff.stop();
                    AniUtils.ac.removeChild(track);
                });
                AudioFactory.play("deathGodStep");
                await this.aniFact.createAniByCfg({type:"seq", arr: [
                    {type:"tr", fa:1, ta:3, time:50, obj:sv},
                    {type:"tr", fa:3, ta:1, time:50, obj:sv},
                ]});
                this.bv.refreshDeathGod(stepAt);
            }
            sv["resetSelf"]();
            this.bv.playDeathGodAni(0);
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        } else {
            // 死神闪烁后退
            this.bv.playDeathGodAni(-1);
            var nps = this.bv.mapView.getGridViews((e:Elem) => e && e.type == "NextLevelPort", false);
            var npsv = nps.length > 0 ? this.getSV(nps[0].getElem()) : undefined;
            var fromPos = AniUtils.ani2global(npsv)
            fromPos.x += npsv.width / 2;
            fromPos.y += npsv.height / 2;
            for (var i = 0; i < d; i++) {
                var stepAt = this.bv.player.deathStep - d + i;
                this.bv.refreshDeathGod(stepAt);
                let eff = ViewUtils.createFrameAni("effExpTrack", "track");
                let track = new BazierControllerWrapper(eff);
                AniUtils.ac.addChild(track);
                eff.play(1);
                AniUtils.createFlyTrack(track, fromPos, AniUtils.ani2global(this.bv.effDeathGodGray), 400).then(() => {
                    eff.stop();
                    AniUtils.ac.removeChild(track);
                });
                AudioFactory.play("deathGodStep");
                await AniUtils.delay(50);
            }
            if (npsv) npsv["resetSelf"]();
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
                var svPos = AniUtils.ani2global(sv);
                svPos.x += sv.width / 2;
                svPos.y += sv.height / 2;
                var expBarPos = AniUtils.ani2global(this.bv.expBar);
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
                if (this.bv.player.hp <= 10) {
                    egret.Tween.get(dm, {loop:true}).to({"alpha": 1}, 1000).to({"alpha": 0}, 1000);
                } else {
                    egret.Tween.removeTweens(dm);
                    dm.alpha = 0;
                }

                this.aniFact.createAniByCfg({type:"seq", arr:[
                    {type:"tr", fa:1, ta:3, time:75},
                    {type:"tr", fa:3, ta:1, time:75}
                ], obj:this.bv.hpBar, noWait:true});
                this.bv.refreshHpAt();
            }
            break;
            case "san": {
                var san:number = ps.san;
                if (san){
                    var sanLevel:number[] = GCfg.getMiscConfig("sanLevel");
                    var num;
                    for (var i = 0; i < sanLevel.length - 1; i++) {
                        if (san > sanLevel[i + 1] && san <= sanLevel[i]){
                            num = i + 1;
                            break;
                        }
                    }
                    this.bv.playAvatarAni("Charmed", num);
                } else { // san值被移除,停止魅惑动作,播放待机动作
                    this.bv.avatarSke.animation.stop("Charmed");
                    this.bv.avatarItemSke.animation.stop("Charmed");
                    this.bv.playAvatarAni("Idle");
                }
                break;
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

        coinSV["resetSelf"]();
        this.bv.refreshMoney();
    }

    // 糖衣炮弹
    public async onCandyCannon(ps) {
        var index = Utils.indexOf(this.bv.player.props, (p:Prop) => p.type == "CandyCannon");
        var tarMonsterSV = this.getSV(ps.tar);
        if(index == -1) return;
        var ccView = this.bv.propsView.getPropViewByIndex(index);
        await this.coinsFly(undefined, ccView, tarMonsterSV, ps.dm, 150, {fx:0, fy:0, tx:16, ty:16});
        tarMonsterSV["resetSelf"]();
        this.bv.refreshMoney();
    }

    public async coinsFly(e:Elem = undefined, from, to, d:number, time:number = 300, offset = {fx:0, fy:0, tx:0, ty:0}) {
        var dm = Math.abs(d);

        var fromObj = from;
        from = from instanceof egret.DisplayObject ? AniUtils.ani2global(from) : from;
        to = to instanceof egret.DisplayObject ? AniUtils.ani2global(to) : to;

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
            var txt = this.bv.player ? this.bv.getMoneyText() : this.wmtv.getMoneyText();
            var v = p.money - (dm - i) * dir;
            txt.text = v.toString();
        }

        coinsImgArr.forEach((img, _) => {
            // AudioFactory.play("deathGodStep");
            img["dispose"]();
        });
    }

    // 吸血效果
    public async bloodFly(e:Elem = undefined, from, to, d:number, time:number, offset = {fx:0, fy:0, tx:0, ty:0}) {
        var fromObj = from;
        from = from instanceof egret.DisplayObject ? AniUtils.ani2global(from) : from;
        to = to instanceof egret.DisplayObject ? AniUtils.ani2global(to) : to;
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
    public async onSingleAttacked(ps) {
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
            var p = AniUtils.ani2global(sv);
            AniUtils.popupTipAt(Math.abs(dhp).toString(), "popupTipBg_png", {x:p.x, y:p.y-25});
        }
        sv["resetSelf"]();
    }

    // 玩家受到攻击
    async onPlayerGotAttacked(ps) {
        if (ps.r.r == "attacked") {
            var avatar = this.bv.avatar;
            this.showMonsterAttackValue(ps.attackerAttrs.owner, ps.r.dhp)
            AudioFactory.play("playerHurt");
            this.bv.playAvatarAni("Hurt");
            await AniUtils.flashAndShake(avatar);
        } else if (ps.r.r == "dodged") {
            AudioFactory.play("dodged");
            this.bv.playAvatarAni("Dodged");
        }
        else if (ps.r.r == "blocked") {
            AudioFactory.play("shieldBlock");
            this.bv.playAvatarAni("Block");
        }
    }

    // 怪物受到攻击
    async onMonsterGotAttacked(ps) {
        if (ps.attackerAttrs.owner instanceof Monster)
            this.showMonsterAttackValue(ps.attackerAttrs.owner, ps.r.dhp);
        
        var m:Monster = ps.targetAttrs.owner;
        var g = this.getSV(m);
        await AniUtils.flashAndShake(g);
        g["resetSelf"]();
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
                var ani = AniUtils.rotateAndBack(it.getShowLayer(), true);
                aniArr.push(ani);
            }

            // 播放角色动画
            this.bv.playAvatarAni("Attack");

            // 这个效果不等待
            if (aniArr.length > 0)
                await aniArr[0];

            // 刀光
            var e = ps.targets[0];
            if (e) {
                var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
                var attackEff:egret.MovieClip = g.addEffect("effPlayerAttack", 1);
                attackEff["wait"]().then(() => g.removeEffect("effPlayerAttack"));
            }

            AudioFactory.play("attacking");
        } else if (weapon.type == "RayGun") { // 火焰射线 AOE
            // 先飞火球
            var g = this.bv.mapView.getGridViewAt(ps.x, ps.y);
            var sv = this.getSVByPos(ps.x, ps.y);
            var effBall = g.addEffect("effRayGunBall", -1, "default", true);
            var toPos = AniUtils.ani2global(sv);
            toPos.x += sv.width / 2;
            toPos.y += sv.height / 2;
            effBall.x += 250;
            effBall.y -= 250;
            effBall.alpha = 0;
            AudioFactory.play("rayGunAttacking");
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
            AudioFactory.play("fronzeGunAttacking");
            await eff["wait"]();
            g.removeEffect("effIceGun");
        } else if (weapon.type == "Bazooka") { // 火箭筒
            // 先飞火球
            var sv = this.getSVByPos(ps.x, ps.y);
            var effBall = ViewUtils.createFrameAni("effBazooka", "fly");
            var toPos = AniUtils.ani2global(sv);
            toPos.x += sv.width / 2;
            toPos.y += sv.height / 2;
            var pv = this.getSVOfProp(weapon);
            var fromPos = AniUtils.ani2global(pv);
            fromPos.x += pv.width / 2;
            fromPos.y += pv.height / 2;
            var r = Utils.getRotationFromTo(fromPos, toPos);
            effBall.rotation = r;
            AudioFactory.play("bazookaAttacking");
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
        } else if (weapon.type == "Knife" || weapon.type == "SmallRock") {
            AudioFactory.play("knifeAttacking");
        }
    }

    // 使用道具
    public async onUseProp(ps) {
        var p:Prop = ps.p;
        if (Utils.checkCatalogues(p.type, "potion"))
            AudioFactory.play("usePotion");
    }

    // 复活
    public async onElemRevive(ps) {
        var type = ps.type;
        AudioFactory.play("revive");
    }

    // 角色升级
    public async onPlayerLevelUp(ps) {
        AudioFactory.play("playerLevelUp");
    }
    
    // 怪物攻击
    public async onMonsterAttack(ps) {
        var m:Monster = ps.m;
        var sv = this.getSV(m);
        var flags = ps.addFlags;
        var g = this.bv.mapView.getGridViewAt(m.pos.x, m.pos.y);

        if (Utils.contains(flags, "attackOnPlayerLeave") && m.type == "Gengar")
            await this.gengarLick(sv);       
        else if (m.isBoss && Utils.contains(ps.addFlags, "activeAttack")) { // boss 主动攻击
            var fsx = sv.scaleX;
            var fsy = sv.scaleY;
            var fromPos = AniUtils.ani2global(sv);
            var toPos = {x:fromPos.x, y:fromPos.y - 200};
            var rev = AniUtils.reserveObjTrans(sv, fromPos, toPos);
            AniUtils.shakeCamera(2, 100);
            await this.aniFact.createAniByCfg({type:"seq", arr:[
                {type:"tr", tsx:fsx*0.8, tsy:fsy*0.8, time:350, mode:egret.Ease.cubicOut},
                {type:"delay", time:50},
                {type:"tr", tsx:fsx*1.3, tsy:fsy*1.3, fy:fromPos.y, ty:toPos.y, time:150},
                {type:"tr", tsx:fsx, tsy:fsy, fy:toPos.y, ty:fromPos.y, time:300},
            ], obj:sv});
            AniUtils.shakeCamera(2, 100);
            rev();
        } else
            await AniUtils.shakeTo(sv);

        sv["resetSelf"]();
    }

    // 怪物的攻击动作,只针对单个目标的单次攻击
    public async monsterAttackSingleTargetAct(ps) {
        var m:Monster = ps.m;
        var msv = this.getSV(m);
        var target = ps.target;
        var tsv = target instanceof Player ? this.bv.avatar : this.getSV(target);
        if (Utils.getPlantType(m) == "Peashooter") {
            var peaImg = AniUtils.createImg("Pea_png");
            var fromPos = AniUtils.ani2global(msv);
            fromPos.x += msv.width / 2;
            fromPos.y += msv.height / 2;
            peaImg.x = fromPos.x;
            peaImg.y = fromPos.y;
            var toPos = AniUtils.ani2global(tsv);
            toPos.x += tsv.width / 2;
            toPos.y += tsv.height / 2;
            await AniUtils.flyAndFadeout(peaImg, toPos, 250, 1, 0, 0, egret.Ease.quintIn);
            peaImg["dispose"]();
        }
    }

    // 自爆憎恶自爆
    public onSelfExplode(ps) {
        var m:Monster = ps.m;
        var g = this.bv.mapView.getGridViewAt(m.pos.x, m.pos.y);
        AudioFactory.play("selfExplode");
        var explodeEff = g.addEffect("effSelfExplode", 1);
        explodeEff["wait"]().then(() => g.removeEffect("effSelfExplode"));
    }

    // 怪物吃食物
    public async onMonsterEatFood(ps) {
        var m:Monster = ps.m;
        var food:Elem = ps.food;
        var msv = this.getSV(m);
        var fsv = this.getSV(food);
        AudioFactory.play("takeFood");
        await AniUtils.shakeTo(fsv, AniUtils.ani2global(msv));
        this.bv.mapView.refreshAt(food.pos.x, food.pos.y);
        msv["resetSelf"]();
        fsv["resetSelf"]();
    }

    // 元素飞行
    public async onElemFlying(ps) {
        var e = ps.e;
        var sv = this.getSVByPos(ps.fromPos.x, ps.fromPos.y);
        var tosv = this.getSVByPos(ps.toPos.x, ps.toPos.y);
        var ta = e.type == "CowardZombie" ? 0 : 1; // 胆怯僵尸的飞行是带隐藏效果的
        await AniUtils.flyAndFadeout(sv, AniUtils.ani2global(tosv), 500, 1, ta, 0, egret.Ease.quintIn);
        sv["resetSelf"]();
        this.bv.refreshPlayer();
        this.bv.mapView.refreshAt(ps.fromPos.x, ps.fromPos.y);
        this.bv.mapView.refreshAt(ps.toPos.x, ps.toPos.y);
    }

    // 元素的图标飞行
    public async onElemImgFlying(ps) {
        var e = <Elem>ps.e;
        var img = AniUtils.createImg(e.getElemImgRes() + "_png");
        var sv = this.getSVByPos(ps.fromPos.x, ps.fromPos.y);
        img.x = AniUtils.ani2global(sv).x;
        img.y = AniUtils.ani2global(sv).y;
        var tosv = this.getSVByPos(ps.toPos.x, ps.toPos.y);
        await AniUtils.fly2(img, sv, tosv, false, 1);
        img["dispose"]();
        this.bv.mapView.refreshAt(ps.fromPos.x, ps.fromPos.y);
        this.bv.mapView.refreshAt(ps.toPos.x, ps.toPos.y);
    }

    // 元素跟去下一层
    public async onElem2NextLevel(ps) {
        var e = ps.e;
        var sv = this.getSV(e);
        var tosv = this.bv.mapView.getGridViewsWithElem((elem:Elem) => elem.type == "NextLevelPort", false)[0];
        if (e instanceof Monster)
            await AniUtils.flyAndFadeout(sv, AniUtils.ani2global(tosv), 1000, 1, 0, 0, undefined);
        else
            await AniUtils.fly2(sv, sv, tosv, false, 0);

        sv["resetSelf"]();
        AudioFactory.play("followDown");
        this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
    }

    // 茧包裹物品
    public async onSwatheItemWithCocoon(ps) {
        var m = ps.m;
        var e = ps.e;
        var fromSV = this.getSV(m);
        var toSV = this.getSV(e);
        var from = AniUtils.ani2global(fromSV);
        from.x += fromSV.width / 2;
        from.y += fromSV.height / 2;
        var to = AniUtils.ani2global(toSV);
        to.x += toSV.width / 2;
        to.y += toSV.height / 2;
        var l = AniUtils.createImg("CocoonLine_png");
        l.anchorOffsetX = l.width / 2;
        var r = Utils.getRotationFromTo(from, to);
        l.rotation = r + 90;
        var sy = Utils.getDist(from, to) / l.height;
        var t = Utils.getDist(from, to);
        await this.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"tr", tx:from.x, ty:from.y, tsy:0, time:0},
            {type:"tr", fx:from.x, fy:from.y, tx:to.x, ty:to.y, fsy:0, tsy:sy, time:t},
            {type:"tr", fsy:sy, tsy:0, time:t},
        ], obj:l});
        l["dispose"]();
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
        var sv = this.getSVByPos(fromPt.x, fromPt.y);
        var ev = this.getEVByPos(fromPt.x, fromPt.y);
        await this.aniFact.createAni("moveOnPath", {objs: [sv, ev], path: showPath, time:150, mode:egret.Ease.sineInOut});
        sv["resetSelf"]();
        // 刷新格子显示
        this.bv.mapView.refreshAt(fromPt.x, fromPt.y);
        if (path.length > 1)
            this.bv.mapView.refreshAt(path[path.length - 1].x, path[path.length - 1].y);

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    public async onInitBattleView(ps) {
        var dm = this.bv.deadlyMask;
        if (this.bv.player.hp <= 10) {
            egret.Tween.get(dm, {loop:true}).to({"alpha": 1}, 1000).to({"alpha": 0}, 1000);
        } else {
            egret.Tween.removeTweens(dm);
            dm.alpha = 0;
        }   
    }

    // 怪物被魅惑
    public async onMonsterCharmed(ps) {
        var tar:Monster = ps.m;
        // var gv = this.bv.mapView.getGridViewAt(tar.pos.x, tar.pos.y);
        // gv.addEffect("effCharmed");
        this.bv.mapView.refreshAt(tar.pos.x, tar.pos.y);
        AudioFactory.play("charmed");
    }

    // 关卡初始化乱序动画
    // 等待点击屏幕
    public async onAllCoveredAtInit(ps) {
        // 提示点击屏幕以继续
        var pressTip = ViewUtils.createBitmapByName("pressAnyKey_png");
        pressTip.x = this.bv.x + this.bv.width / 2;
        pressTip.y = this.bv.y + this.bv.height / 2;
        pressTip.anchorOffsetX = pressTip.width / 2;
        pressTip.anchorOffsetY = pressTip.height / 2;
        this.bv.addChild(pressTip);
        AniUtils.floating(pressTip);
        await AniUtils.wait4click();
        AniUtils.floating(pressTip, true);
        this.bv.removeChild(pressTip);  

        var rand = new SRandom();
        var svArr = [];
        var actualMapRange = Utils.getActualMapRange(this.player.bt());
        var elemsCanMove = (e:Elem) => e.pos.x <= actualMapRange.maxX && e.pos.x >= actualMapRange.minX
                                        && e.pos.y <= actualMapRange.maxY && e.pos.y >= actualMapRange.minY;
        var evs = this.bv.mapView.getGridViewsWithElem(elemsCanMove, true);
        evs.forEach((ev, _) => {
            var sv = ev.getShowLayer();
            var effv = ev.getEffectLayer();
            effv["gx"] = sv["gx"] = ev.getElem().pos.x;
            effv["gy"] = sv["gy"] = ev.getElem().pos.y;
            effv["tgx1"] = sv["tgx1"] = rand.nextInt(actualMapRange.minX, actualMapRange.maxX);
            effv["tgy1"] = sv["tgy1"] = rand.nextInt(actualMapRange.minY, actualMapRange.maxY);
            effv["tgx2"] = sv["tgx2"] = rand.nextInt(actualMapRange.minX, actualMapRange.maxX);
            effv["tgy2"] = sv["tgy2"] = rand.nextInt(actualMapRange.minY, actualMapRange.maxY);
            effv["tgx3"] = sv["tgx3"] = rand.nextInt(actualMapRange.minX, actualMapRange.maxX);
            effv["tgy3"] = sv["tgy3"] = rand.nextInt(actualMapRange.minY, actualMapRange.maxY);
            effv["delay1"] = sv["delay1"] = rand.nextInt(100, 1000);
            effv["delay2"] = sv["delay2"] = rand.nextInt(100, 1000);
            effv["delay3"] = sv["delay3"] = rand.nextInt(100, 1000);
            effv["delay4"] = sv["delay4"] = rand.nextInt(100, 1000);
            svArr.push(sv);
            svArr.push(effv);
        });

        // 开始乱窜
        var revArr = AniUtils.LoopMoveAll(svArr, this.bv.mapView);
        await AniUtils.delay(2000);

        // 开始发牌盖住所有格子
        await AniUtils.coverAll(this.bv.mapView, actualMapRange);
        
        revArr.forEach((rev, _) => rev());
        this.bv.refresh();
    }

    // 清除所有角色 buff 显示效果
    clearPlayerBuffEffect() {
        this.removeColorEffect("poison", this.bv.hpBar, this.bv.avatar);
        this.bv.deadlyMask.alpha = 0;
        egret.Tween.removeTweens(this.bv.deadlyMask);
    }

    // 离开关卡时清除所有角色 buff 效果
    public async onGoOutLevel(ps) {
        this.clearPlayerBuffEffect();
        this.bv.playAvatarAni("Downstairs");
        await Utils.delay(2000);
    }

    // 复活
    public async onPlayerReborn(ps) {
        if (ps.inBattle) {
            this.clearPlayerBuffEffect();
            this.bv.refreshPlayer();
        }
        else {
            this.wmtv.refreshHp();
        }
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
        sv["resetSelf"]();
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
            g["resetSelf"]();
            this.bv.mapView.refreshAt(m.pos.x, m.pos.y);
        } else { // 直线飞向怪物消失
            var svArr = [];
            for (var e of es) {
                var g = this.getSV(e);
                svArr.push(g);
            }
            
            await AniUtils.flyAndFadeoutArr(svArr, AniUtils.ani2global(msv), 500, 0.5, 0, 0, egret.Ease.quintIn);
            svArr.forEach((sv, _) => sv["resetSelf"]());
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
            let e = AniUtils.createImg("eyeDemonEye_png");
            eyes.push(e);
            lastAni = AniUtils.flyOutLogicPos(e, this.bv.mapView, m.pos, pt).then(() => e["dispose"]());
        }

        if (lastAni)
            await lastAni;
    }

    // 舞王僵尸突袭时召唤
    public async summonByDancer(ps){
        var dancer:Monster = ps.m;
        var ms:Monster[] = ps.ms;
        var gs:Grid[] = ps.gs;
        var summons = [];
        var dancerPos = AniUtils.ani2global(this.getSV(dancer));
        var ani;
        for(var index = 0; index < ms.length; index++){
            var fromImg = AniUtils.createImg(ms[index].getElemImgRes() + "_png");
            fromImg.x = dancerPos.x;
            fromImg.y = dancerPos.y;
            ani = AniUtils.summonByDancer(fromImg, fromImg, this.getSVByPos(gs[index].pos.x, gs[index].pos.y));
            summons.push(fromImg);
        }
        if (ani)
            await ani;

        summons.forEach((summon, _) => summon["dispose"]());
    }

    // 克苏鲁之脑BOSS战中san值降低到各个阈值时的提示
    public async onSanThreshold(ps) {
        var m:Monster = ps.m;
        var bt:Battle = ps.m.bt();
        if (ps.subType == "hideHazardNumber"){
            var tip = ViewUtils.getTipText("hideHazardNumber");
            await this.bv.confirmOkYesNo("", tip, false);
        } else if (ps.subType == "hideMonsterAttrs"){
            var tip = ViewUtils.getTipText("hideMonsterAttrs");
            await this.bv.confirmOkYesNo("", tip, false);
        } else if (ps.subType == "attackRandomGrid"){
            var tip = ViewUtils.getTipText("attackRandomGrid");
            await this.bv.confirmOkYesNo("", tip, false);
        }
    }

    // 物品被拿起等待使用时的悬浮效果
    public async onElemFloating(ps) {
        var e:Elem = ps.e;
        var sv = this.getSV(e);
        AniUtils.floating(sv, ps.stop);
    }

    // 通缉令
    public async onMakeWanted(ps) {
        await this.onElemFlying(ps);
        // var g = this.bv.mapView.getGridViewAt(ps.toPos.x, ps.toPos.y);
        // g.addEffect("effWantedOrder");
        this.bv.mapView.refreshAt(ps.toPos.x, ps.toPos.y);
    }

    // 标记所有怪物的奖励
    public async onGetMarkAllAward() {
        var ended = false;
        var ske = ViewUtils.createSkeletonAni("bonus", () => ended = true);
        var d = ske.display;
        d.x = this.width / 2;
        d.y = this.height / 2;
        AniUtils.ac.addChild(d);
        ske.animation.play("stand", 1);
        await Utils.waitUtil(() => ended);
        ske["stop"]();
        AniUtils.ac.removeChild(d);
    }

    // 移除颜色效果
    removeColorEffect(effName, ...objs) {
        effName += "Effect";
        objs.forEach((obj, _) => {
            if (!obj[effName])
                return;

            var eff = <ColorEffect>obj[effName];
            eff.stop();
            delete obj[effName];
            this.removeChild(eff);
        });
    }

    // 添加颜色效果
    addColorEffect(effName, time, ...objs) {
        objs.forEach((obj, _) => {
            switch (effName) {
                case "poison": {
                    if (obj["poisonEffect"])
                        return;

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

                    var eff = new ColorEffect(poisonFromMat, poisonToMat, time, obj);
                    obj["poisonEffect"] = eff;
                    eff.start();
                    this.addChild(eff);
                }
                break;
                default:
                    Utils.assert(false, "unknown color effect name: " + effName);
            }
        });
    }

    // 玩家获得buff
    public async onBuffAdded(ps) {
        var buff = ps.buff;
        var buffType = buff.type;

        if (ps.target instanceof Player) {
            switch (buffType) {
                case "BuffPoisonOnGrids": {
                    var gs = Utils.map(buff.grids, (g) => this.bv.mapView.getGridViewAt(g.pos.x, g.pos.y));
                    gs.forEach((g:GridView, _) => {
                        g.addEffect("gridPoisoned");
                        g.addRandomDelayLoopEffect("effPoisonMist", AniUtils.rand, [0, 30000]);
                    });
                }
                break;
                case "BuffPoison":
                    this.addColorEffect("poison", 2000, this.bv.poisonedHpBar, this.bv.avatar);
                break;
                case "BuffSuper":
                    this.bv.addAvaterEffect("effSuperPotion");
                break;
            }
        } else {
            if (ps.target.isDead())
                 return;

            var e = <Elem>(ps.target);
            // var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
            // switch (buffType) {
            //     case "BuffPoison":
            //         g.addEffect("elemPoisoned");
            //     break;
            //     case "BuffFlame":
            //         g.addEffect("effBurning");
            //     break;
            // }
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        }
    }

    // buff 移除
     public async onBuffRemoved(ps) {
        var buff = ps.buff;
        var buffType = buff.type;

        if (ps.target instanceof Player) {
            switch (buffType) {
                case "BuffPoisonOnGrids": {
                    var gs = Utils.map(buff.grids, (g) => this.bv.mapView.getGridViewAt(g.pos.x, g.pos.y));
                    gs.forEach((g, _) => {
                        g.removeEffect("gridPoisoned");
                        g.removeEffect("effPoisonMist");
                    });
                }
                break;
                case "BuffPoison":
                    this.removeColorEffect("poison", this.bv.poisonedHpBar, this.bv.avatar);
                break;
                case "BuffSuper":
                    this.bv.removeAvatarEffect("effSuperPotion");
                break;
            }
        }
        else {
            var e = <Elem>(ps.target);
            // var g = this.bv.mapView.getGridViewAt(e.pos.x, e.pos.y);
            // switch (buffType) {
            //     case "BuffPoison":
            //         g.removeEffect("elemPoisoned");
            //     break;
            //     case "BuffFlame":
            //         g.removeEffect("effBurning");
            //     break;
            // }
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        }
    }

    // 物品不可使用
    public async canNotUseItem(ps) {
        if (!ps.e) return;

        var e:Elem = ps.e;
        var sv = this.getSV(e);
        var pos = AniUtils.ani2global(sv);
        pos.x += sv.width / 2
        pos.y -= sv.height / 2 - 45;
        if (ps.r)
            AniUtils.tipAt(ViewUtils.getTipText(ps.r), pos);

        AudioFactory.play("unuseable");
        await AniUtils.flashAndShake(sv);
        sv["resetSelf"]();
    }

    public async onRelicEffect(ps){
        var relics = this.bv.relics;
        var relicImg = this.getBitmapOfRelic(ps.r);
        if(relicImg)
            await AniUtils.flash(relicImg, 200, false);
    }

    // 援护提示
    public async onProtect(ps){
        var m = ps.m;
        var sv = this.getSV(m);
        var p = AniUtils.ani2global(sv);
        AniUtils.tipAt(ViewUtils.getTipText("protect"), {x:p.x, y:p.y+1}, 30);
    }

    // 连击提示
    public async onMultAttack(ps){
        var m = ps.m;
        var sv = this.getSV(m);
        var p = AniUtils.ani2global(sv);
        AniUtils.tipAt(ViewUtils.getTipText("multAttack"), {x:p.x + 88, y:p.y+1}, 30);
    }

    // 耿鬼长舌头攻击动画
    async gengarLick(sv:egret.DisplayObject) {
        var bodyOffset = {x:sv.width / 2, y:sv.height};
        var tongueAnchorPos = {x:0, y:-30};
        var avatarPos = AniUtils.ani2global(this.bv.avatar);

        // 耿鬼长舌头攻击: 播一段骨骼动画 + 一段 tr 动画 + 一段骨骼动画

        sv.alpha = 0; // 隐藏原怪物形象

        // 播放攻击前段动画
        var aw1 = this.aniFact.createAni("skeleton", {name:"genggui_shenti", act:"start", playTimes:1});
        var aw2 = this.aniFact.createAni("skeleton", {name:"genggui_shetou", act:"start", playTimes:1});
        var disp1:egret.DisplayObject = aw1["getDisplay"]();
        var disp2:egret.DisplayObject = aw2["getDisplay"]();
        AniUtils.ac.addChild(disp1);
        AniUtils.ac.addChild(disp2);
        var dispPos = AniUtils.ani2global(sv);
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

    // 大地图从顶部滑动到指定百分比
    async doWorldMapSlide(p, time:number, worldNum:number) {
        this.addBlockLayer();

        var rev;
        if (worldNum) { // 显示当前世界编号
            var numBg = ViewUtils.createBitmapByName("worldNumBg_png");
            numBg.width *= 2;
            numBg.height *= 2;
            var numTxt = new egret.BitmapText();
            numTxt.font = ViewUtils.getBmpFont("wmFnt");
            numTxt.text = worldNum.toString();
            numTxt.textAlign = egret.HorizontalAlign.CENTER;
            numTxt.width *= 2;
            numTxt.height *= 2;
            AniUtils.ac.addChild(numBg);
            AniUtils.ac.addChild(numTxt);
            numBg.x = (this.width - numBg.width) / 2;
            numBg.y = (this.height - numBg.height) / 2;
            numTxt.x = (this.width - numTxt.width) / 2;
            numTxt.y = (this.height - numTxt.height) / 2 + 60;
            rev = () => {
                AniUtils.ac.removeChild(numBg);
                AniUtils.ac.removeChild(numTxt);
            };
        }
        
        return new Promise<void>((r, _) => {
            var tw = egret.Tween.get(this.wmv).to({rawMapScrollPosRange:p}, time, egret.Ease.cubicInOut);
            tw.call(() => {
                if (rev) rev();
                this.decBlockLayer();
                r();
            });
        });
    }

    // 装备格打开效果
    public async relicsEquippedMaxNumAdded(ps) {
        var n = this.bv.player.relicsEquippedCapacity;
        var rv = this.bv.relics[n - 1];
        var fromPos = ShopView.lastSelectedElemGlobalPos;
        var img = AniUtils.createImg("OpenRelicSpace_png");
        img.x = fromPos.x;
        img.y = fromPos.y;
        await AniUtils.fly2(img, img, rv, false, 1, false);
        img["dispose"]();
        await AniUtils.shakeCamera(1, 50, true);
        this.bv.refreshRelics();
        AudioFactory.play("monsterDie");
        var eff = AniUtils.createFrameAni("effMonsterDie", 1);
        var toPos = AniUtils.ani2global(rv);
        eff.x = toPos.x + rv.width / 2;
        eff.y = toPos.y + rv.height / 2;
        eff["wait"]().then(() => {
            AudioFactory.play("openRelicGrid");
            eff["dispose"]();
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
