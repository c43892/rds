// 主视图下属的动画层
class AniView extends egret.DisplayObjectContainer {
    private bv:BattleView; // 主视图
    private blackCover:egret.Bitmap; // 黑屏用的遮挡

    private aniCover:egret.Bitmap; // 播放动画时的操作屏蔽层
    public aniFact:AnimationFactory; // 动画工厂

    public constructor(w:number, h:number, mainView:BattleView) {
        super();
        this.width = w;
        this.height = h;
        
        this.bv = mainView;
        this.aniCover = ViewUtils.createBitmapByName("anicover_png");
        this.aniCover.name = "AniCover";
        this.blackCover = ViewUtils.createBitmapByName("blackcover_png");
        this.blackCover.name = "BlackColver";

        this.aniFact = new AnimationFactory();
        this.aniFact.notifyAniStarted = (ani:Promise<void>, aniType:string, ps) => { this.onAniStarted(ani, aniType, ps); };
    }

    public refresh() {
        // 播放动画时阻挡玩家操作
        this.aniCover.width = this.width;
        this.aniCover.height = this.height;
        this.aniCover.touchEnabled = true;
        if (this.contains(this.aniCover))
            this.removeChild(this.aniCover);

        // 黑屏用的遮挡
        this.blackCover.width = this.width;
        this.blackCover.height = this.height;
        this.blackCover.touchEnabled = true;
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

    // 指定位置发生状态或元素变化
    public async onGridChanged(ps) {
        var e:Elem = ps.e;
        var doRefresh = () => this.bv.mapView.refreshAt(ps.x, ps.y, e && e.isBig() ? e.attrs.size : undefined);
        switch (ps.subType) {
            case "elemAdded": // 有元素被添加进地图
                doRefresh();
                var obj = this.bv.mapView.getElemViewAt(ps.x, ps.y).getShowLayer();
                if (e instanceof Monster) // 怪物是从地下冒出
                    await AniUtils.crawlOut(obj);
                else if (!ps.fromPos || (e.pos.x == ps.fromPos.x && e.pos.y == ps.fromPos.y)) // 原地跳出来
                    await AniUtils.jumpInMap(obj);
                else // 飞出来，从跳出来的位置到目标位置有一段距离
                    await AniUtils.flyOutLogicPos(obj, ps.fromPos, this.bv.mapView);
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
                await this.aniFact.createAni("tr", {
                    obj:img, time: 500, ta:0, noWait:true
                });
                gv.parent.addChild(img);
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
            var fromImg = this.bv.mapView.getElemViewAt(e.pos.x, e.pos.y).getShowLayer();
            var n = Utils.indexOf(e.bt().player.props, (p) => p.type == e.type);
            var pv = this.bv.propsView.getPropViewByIndex(n);
            var toImg = pv.getImg();
            await AniUtils.fly2(fromImg, fromImg, toImg);
        }
        this.bv.refreshProps();
    }

    // 遗物发生变化
    public async onRelicChanged(ps) {
        if (ps.subType == "addRelicByPickup") {
            var e:Elem = ps.e;
            var fromImg = this.bv.mapView.getElemViewAt(e.pos.x, e.pos.y).getShowLayer();
            var n = Utils.indexOf(e.bt().player.relics, (p) => p.type == e.type);
            var toImg = this.bv.relics[n];
            await AniUtils.fly2(fromImg, fromImg, toImg);
        }
        this.bv.refreshRelics();
    }

    // 怪物属性发生变化
    public async onElemChanged(ps) {
        var e = ps.e;
        await this.aniFact.createAni("elemChanged", {"m": ps.m});
        this.bv.mapView.refreshAt(e.pos.x, e.pos.y);
        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    // 角色信息发生变化
    public async onPlayerChanged(ps) {
        switch (ps.subType) {
            case "money":
                await this.aniFact.createAni("moneyMoving");
            break;
            default:
                await this.aniFact.createAni("playerChanged");
        }

        this.bv.refreshPlayer();
    }

    // 产生攻击行为
    public async onAttack(ps) {        
        if (ps.subType == "monster2player") {
            var m:Elem = ps.attackerAttrs.owner;
            var img = this.bv.mapView.getElemViewAt(m.pos.x, m.pos.y).getShowLayer();
            await AniUtils.monsterAttack(img);
        }
        else
            await this.aniFact.createAni("playerAttackMonster");

        this.bv.refreshPlayer();
        this.bv.mapView.refresh();
    }
    
    // 元素飞行
    public async onElemFlying(ps) {
        var fromPt = ps.fromPos;
        var toPt = ps.toPos;

        // 创建路径动画
        var showPath = Utils.map([fromPt, toPt], (pt) => this.bv.mapView.logicPos2ShowPos(pt.x - fromPt.x, pt.y - fromPt.y));
        showPath.shift();
        var ev = this.bv.mapView.getElemViewAt(fromPt.x, fromPt.y).getShowLayer();
        await this.aniFact.createAni("moveOnPath", {obj: ev, path: showPath, time:250, mode:egret.Ease.sineInOut});
        this.bv.mapView.refreshAt(fromPt.x, fromPt.y);
        this.bv.mapView.refreshAt(toPt.x, toPt.y);
        this.bv.refreshPlayer();
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
        var ev = this.bv.mapView.getElemViewAt(fromPt.x, fromPt.y).getShowLayer();
        await this.aniFact.createAni("moveOnPath", {obj: ev, path: showPath, time:250, mode:egret.Ease.sineInOut});
        
        // 刷新格子显示
        this.bv.mapView.refreshAt(fromPt.x, fromPt.y);
        if (path.length > 1)
            this.bv.mapView.refreshAt(path[path.length - 1].x, path[path.length - 1].y);

        this.bv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    // 关卡事件
    public async onLevel(ps) {
        switch (ps.subType) {
            case "levelInited": // 进关卡
                break;
            case "goOutLevel": // 出关卡
                await this.blackIn(true);
                break;
            default:
                Utils.assert(false, "unhandled LevelEvent: " + ps.subType);            
        }    
    }

    // 偷钱
    public async onMoneyStolen(ps) {
        await this.aniFact.createAni("stealMoney", {"dm":ps.dm});
    }

    // 开局时所有元素盖上
    public async onAllCoveredAtInit(ps) {
        await this.blackIn();
        this.bv.refresh();
        await this.blackOut();
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
        var e = ps.e;
        await this.aniFact.createAni("monsterTakeElem", {m:m, e:e});
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

    async blackIn(removedWhenFinish = false) {
        this.addChild(this.blackCover);
        await this.aniFact.createAni("tr", {obj: this.blackCover, fa:0, ta:1, time: 1000});
        if (removedWhenFinish)
            this.removeChild(this.blackCover);
    }

    async blackOut() {
        await this.aniFact.createAni("tr", {obj: this.blackCover, fa:1, toa:0, time: 1000});
        if (this.getChildByName(this.blackCover.name))
            this.removeChild(this.blackCover);
    }

    // 动画开始播放时，阻止玩家操作
    aniLayerCnt = 0;
    onAniStarted(ani:Promise<void>, aniType:string, ps = undefined) {
        this.addChild(this.aniCover);
        this.aniLayerCnt++;
        ani.then(() => {
            Utils.assert(this.aniLayerCnt > 0, "aniLayerCnt corrupted");
            this.aniLayerCnt--;
            if (this.aniLayerCnt == 0)
                this.removeChild(this.aniCover);
        });
    }
}
