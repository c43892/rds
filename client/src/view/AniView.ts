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
        if (this.contains(this.blackCover))
            this.removeChild(this.blackCover);

        if (this.contains(this.aniCover))
            this.removeChild(this.aniCover);
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
            if (!fromPos || (e.pos.x == fromPos.x && e.pos.y == fromPos.y)) // 原地跳出来
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
        var doRefresh = () => this.bv.mapView.refreshAt(ps.x, ps.y, e && e.isBig() ? e.attrs.size : undefined);
        switch (ps.subType) {
            case "elemAdded": // 有元素被添加进地图
                doRefresh();
                var obj = this.getSVByPos(ps.x, ps.y);
                if (e instanceof Monster) // 怪物是从地下冒出
                    await AniUtils.crawlOut(obj);
                else if (!ps.fromPos || (e.pos.x == ps.fromPos.x && e.pos.y == ps.fromPos.y)) // 原地跳出来
                    await AniUtils.jumpInMap(obj);
                else // 飞出来，从跳出来的位置到目标位置有一段距离
                    await AniUtils.flyOutLogicPos(obj, this.bv.mapView, ps.fromPos);
                break;
            case "gridBlocked": {
                var gv = this.bv.mapView.getGridViewAt(ps.x, ps.y);
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
                var gv = this.bv.mapView.getGridViewAt(ps.x, ps.y);
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
                var gv = this.bv.mapView.getGridViewAt(ps.x, ps.y);
                doRefresh();
                var img = ViewUtils.createBitmapByName("covered_png");
                img.alpha = 1;
                img.width = gv.width;
                img.height = gv.height;
                img.x = gv.x - (img.width - gv.width) / 2;
                img.y = gv.y - (img.height - gv.height) / 2;
                gv.parent.addChild(img);
                // 这个动画不等
                this.aniFact.createAni("tr", {
                    obj:img, time: 500, ta:0, noWait:true
                }).then(() => gv.parent.removeChild(img));
            }
            break;
            default:
                doRefresh();
        }

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
        this.bv.mapView.refresh();
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

    // 从大地图的商店买东西
    public async onBuyElemFromWorldmapShop(ps) {
        var e:Elem = ps.e;
        var fromPos = ShopView.lastSelectedElemGlobalPos;

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

    // cd 变化
    public async onColddownChanged(ps) {
        var e = ps.e;
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
                e.type == "Key" ? 300 : 150, 1, 1, 
                e.type == "Key" ? undefined : egret.Ease.quintIn);
        }
    }

    // 怪物属性发生变化
    public async onElemChanged(ps) {
        var e = ps.e;
        var g = this.getSV(e);
        if (ps.subType == "monsterHp") {
            var dhp = ps.dhp;
            var p = g.localToGlobal();
            if (dhp > 0)
                await AniUtils.tipAt(ViewUtils.getTipText("cure"), p);
        } else if (ps.subType == "die" && e instanceof Monster) {
            // 怪物死亡时候抖一下消失
            var sv = this.getSV(e);
            var pos = sv.localToGlobal();
            pos.x += sv.width / 2
            pos.y -= sv.height / 2;
            await AniUtils.flashAndShake(sv);
        } else if (ps.subType == "useElem")
            await this.onElemUsed(ps);
        
        this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    // 有物品被使用
    public async onElemUsed(ps) {
        var e = ps.e;
        var foods = ["Apple", "Steak"];
        var books = ["EconomyMagazine", "Magazine"];
        var type = e.type;
        var sv = this.getSV(e);

        if (Utils.contains(books, type) && e.cnt > 0) { // 书籍需要提示还剩几次
            var p = sv.localToGlobal();
            AniUtils.tipAt((e.attrs.cnt - e.cnt) + "/" + e.attrs.cnt, {x:p.x+25, y:p.y-25});
            await AniUtils.flashAndShake(this.getSV(e));
        } else if (Utils.contains(foods, type)) { // 食物抖一下
            await AniUtils.flashAndShake(this.getSV(e));
        }
    }

    // 死神步数发生变化
    public async onAddDeathGodStep(ps) {
        var d = -Math.abs(ps.d);
        var e = ps.e;
        var deathImg = this.bv.getDeathGodImg();
        
        if (ps.subType == "deathGodBuff"){ // 这个最频繁的操作不产生需要等待的动画
            this.aniFact.createAniByCfg({type:"seq", arr: [
                {type:"tr", fa:1, ta:3, time:25, noWait:true},
                {type:"tr", fa:3, ta:1, time:25, noWait:true},
            ], obj:deathImg, noWait:true}).then(() => this.bv.refreshDeathGod());
            return;
        }

        if (e && !(e instanceof Relic)) {
            var sv = this.getSV(e);

            var flashCnt = d < 3 ? 3 : d; // 至少闪三下
            // 死神闪烁后退，道具闪烁;
            for (var i = 0; i < flashCnt; i++) {
                this.bv.refreshDeathGod(this.bv.player.deathStep - d + i);
                await this.aniFact.createAniByCfg({type:"seq", arr: [
                    {type:"tr", fa:1, ta:3, time:25, obj:deathImg},
                    {type:"tr", fa:3, ta:1, time:25, obj:deathImg},
                    {type:"tr", fa:1, ta:3, time:25, obj:sv},
                    {type:"tr", fa:3, ta:1, time:25, obj:sv},
                ]});
            }

            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        }
        else {
            // 死神闪烁后退
            for (var i = 0; i < d; i++) {
                this.bv.refreshDeathGod(this.bv.player.deathStep - d + i);
                await this.aniFact.createAniByCfg({type:"seq", arr: [
                    {type:"tr", fa:1, ta:3, time:25},
                    {type:"tr", fa:3, ta:1, time:25},
                ], obj:deathImg});
            }
        }

        this.bv.refreshDeathGod();
    }

    // 角色信息发生变化
    public async onPlayerChanged(ps) {
        switch (ps.subType) {
            case "money":
                await this.onMoneyChanged(ps);
            break;
            default:
        }
    }

    // 金钱变化
    public async onMoneyChanged(ps) {
        var coins = ["CoinsTiny", "CoinsSmall", "Coins", "CoinsBig", "CoinsHuge"];
        var dm = Math.abs(ps.d);
        var txt = this.bv.getMoneyText();
        var e = ps.e;
        var coinSV = this.getSV(e);

        var d = ps.d > 0 ? 1 : -1;
        var coinsImgArr = [];
        for (var i = dm > 15 ? dm - 15 : 0; i < dm; i++) {
            var v = this.bv.player.money - (dm - i) * d;            
            var coinsImg = AniUtils.createImg("Coins_png");
            coinsImgArr.push(coinsImg);
            if (d > 0) {
                this.aniFact.createAni("seq", {subAniArr:[
                    this.aniFact.createAni("tr", {obj:coinsImg, fx:coinSV.localToGlobal().x, fy:coinSV.localToGlobal().y,
                        tx:txt.localToGlobal().x, ty:txt.localToGlobal().y,
                        fsx:1, fsy:1, tsx:0.6, tsy:0.6, time:350}),
                    this.aniFact.createAni("tr", {obj:coinsImg, fa:1, ta:0, time:1})
                ]});

                var cnt = dm - i;
                if (cnt > 0 && Utils.contains(coins, e.type)) {
                    e.cnt = cnt;
                    this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
                }
                else
                    coinSV.alpha = 0;
            } else if (e.type != "ShopNpc") {
                this.aniFact.createAni("seq", {subAniArr:[
                    this.aniFact.createAni("tr", {obj:coinsImg, tx:txt.localToGlobal().x, ty:txt.localToGlobal().y,
                        fx:coinSV.localToGlobal().x, fy:coinSV.localToGlobal().y,
                        fsx:0.6, fsy:0.6, tsx:1, tsy:1, time:350}),
                    this.aniFact.createAni("tr", {obj:coinsImg, fa:1, ta:0, time:1})
                ]});
            }
            
            await AniUtils.delay(100);
            this.bv.refreshMoneyAt(v);
        }

        coinsImgArr.forEach((img, _) => img["dispose"]());

        this.bv.refreshMoneyAt();
    }

    // 产生攻击行为
    public async onAttacking(ps) {        
        if (ps.subType == "player2monster")
            await this.onPlayerAttack(ps);
        else
            await this.onMonsterAttack(ps);

        this.bv.refreshPlayer();
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
            AniUtils.popupTipAt(dhp.toString(), "popupTipBg_png", {x:p.x, y:p.y-25});
        }
    }

    // 玩家受到攻击
    async onPlayerGotAttacked(ps) {
        this.showMonsterAttackValue(ps.attackerAttrs.owner, ps.r.dhp);
    }

    // 怪物受到攻击
    async onMonsterGotAttacked(ps) {
        if (ps.attackerAttrs.owner instanceof Monster)
            this.showMonsterAttackValue(ps.attackerAttrs.owner, ps.r.dhp);
        
        var m:Monster = ps.targetAttrs.owner;
        if (m.isDead()) return; // 死了就不播放受创表现了

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
            // 平砍时有些元素需要表现一下动作
            var itemTypes = ["Baton"];
            var items = this.bv.mapView.getGridViews((e:Elem) => Utils.contains(itemTypes, e.type) && e.isValid());
            var aniArr = [];
            for (var it of items) {
                var ani = AniUtils.rotateAndBack(it.getShowLayer());
                aniArr.push(ani);
            }
            
            // 这个效果不等待
            if (aniArr.length > 0)
                this.aniFact.createAniByCfg({type:"gp", arr:aniArr, noWait:true});
        }
    }

    // 怪物攻击
    public async onMonsterAttack(ps) {
        var m:Elem = ps.m;
        var sv = this.getSV(m);
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
        await AniUtils.flyAndFadeout(sv, tosv.localToGlobal(), 500, 1, ta, egret.Ease.quintIn);
        this.bv.refreshPlayer();
        this.bv.mapView.refreshAt(ps.fromPos.x, ps.fromPos.y);
        this.bv.mapView.refreshAt(ps.toPos.x, ps.toPos.y);
    }

    // 元素跟去下一层
    public async onElem2NextLevel(ps) {
        var e = ps.e;
        var sv = this.getSV(e);
        var tosv = this.bv.mapView.getGridViews((elem:Elem) => elem.type == "NextLevelPort", false)[0];
        if (e instanceof Monster)
            await AniUtils.flyAndFadeout(sv, tosv.localToGlobal(), 1000, 1, 0, undefined);
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

    // 关卡初始化乱序动画
    public async onAllCoveredAtInit(ps) {
        // 等待点击屏幕
        await AniUtils.wait4click();

        var rand = new SRandom();
        var svArr = [];
        var evs = this.bv.mapView.getGridViews(undefined, true);
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
        await AniUtils.delay(1000);
    }

    // 关卡事件
    public async onGoOutLevel(ps) {
        await this.blackIn(true);
    }

    // 偷钱
    public async onMoneyStolen(ps) {
        await this.aniFact.createAni("stealMoney", {"dm":ps.dm});
    }

    // 吸血
    public async onSuckPlayerBlood(ps) {
        var x = ps.m.pos.x;
        var y = ps.m.pos.y
        await this.aniFact.createAni("suckBlood", {x:x, y:y});
        this.bv.refreshPlayer();
        this.bv.mapView.refreshAt(x, y);
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
            
            await AniUtils.flyAndFadeoutArr(svArr, msv.localToGlobal(), 500, 0.5, 0, egret.Ease.quintIn);
        }

        for (var e of es)
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
    }

    // 眼魔死亡时飞几个眼睛出来
    public async onEyeDemonUncoverGrids(ps) {
        var m:Elem = ps.m;
        var eyes = [];
        var eyeAnis = [];
        for (var pt of ps.pts) {
            var e = ViewUtils.createBitmapByName("eyeDemonEye_png");
            this.addChild(e);
            eyes.push(e);
            var ani = AniUtils.flyOutLogicPos(e, this.bv.mapView, m.pos, pt);
            eyeAnis.push(ani);
        }

        if (eyeAnis.length > 0)
            await this.aniFact.createAniByCfg({type:"seq", arr:eyeAnis});
    }

    // 物品被拿起等待使用时的悬浮效果
    public async onElemFloating(ps) {
        var e:Elem = ps.e;
        var sv = this.getSV(e);
        if (ps.stop)
            await AniUtils.floating(sv);
        else
            AniUtils.clearAll(sv);
    }

    // 玩家获得buff
    public async onBuffAdded(ps) {
        if (ps.target instanceof Player)
            this.bv.refreshPlayer();
        else {
            var e = <Elem>(ps.target);
            this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
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

    // 黑幕开启
    async blackIn(removedWhenFinish = false) {
        this.addChild(this.blackCover);
        await this.aniFact.createAni("tr", {obj: this.blackCover, fa:0, ta:1, time: 1000});
        if (removedWhenFinish)
            this.removeChild(this.blackCover);
    }

    // 黑幕退出
    async blackOut() {
        if (!this.contains(this.blackCover))
            this.addChild(this.blackCover);
        await this.aniFact.createAni("tr", {obj: this.blackCover, fa:1, ta:0, time: 1000});
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
