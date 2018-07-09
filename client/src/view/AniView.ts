// 主视图下属的动画层
class AniView extends egret.DisplayObjectContainer {
    private mv:BattleView; // 主视图
    private blackCover:egret.Bitmap; // 黑屏用的遮挡

    private aniCover:egret.Bitmap; // 播放动画时的操作屏蔽层
    private aniFact:AnimationFactory; // 动画工厂

    public constructor(w:number, h:number, mainView:BattleView) {
        super();
        
        this.mv = mainView;
        this.aniCover = ViewUtils.createBitmapByName("anicover_png");
        this.aniCover.name = "AniCover";
        this.blackCover = ViewUtils.createBitmapByName("blackcover_png");
        this.blackCover.name = "BlackColver";

        this.aniFact = new AnimationFactory();
        this.aniFact.notifyAniStarted = (ani:Promise<void>, aniType:string, ps) => { this.onAniStarted(ani, aniType, ps); };
    }

    public refresh(w:number, h:number) {
        this.width = w;
        this.height = h;
        
        // 播放动画时阻挡玩家操作
        this.aniCover.width = this.width;
        this.aniCover.height = this.height;
        this.aniCover.touchEnabled = true;
        if (this.getChildByName(this.aniCover.name) != undefined)
            this.removeChild(this.aniCover);

        // 黑屏用的遮挡
        this.blackCover.width = this.width;
        this.blackCover.height = this.height;
        this.blackCover.touchEnabled = true;
        if (this.getChildByName(this.blackCover.name) != undefined)
            this.removeChild(this.blackCover);
    }

    // 清除所有地图显示元素
    public clear() {
        if (this.getChildByName(this.blackCover.name) != undefined)
            this.removeChild(this.blackCover);

        if (this.getChildByName(this.aniCover.name) != undefined)
            this.removeChild(this.aniCover);
    }

    // 指定位置发生状态或元素变化
    public async onGridChanged(ps) {
        switch (ps.subType) {
            case "ElemAdded":
                this.mv.mapView.refreshAt(ps.x, ps.y);
                var eImg = this.mv.mapView.getElemViewAt(ps.x, ps.y).getImg();
                await this.aniFact.createAni("fadeIn", {"img": eImg, "time":1000});
            break;
        }

        var e:Elem = ps.e;
        this.mv.mapView.refreshAt(ps.x, ps.y, e && e.isBig() ? e.attrs.size : undefined);
        this.mv.refreshPlayer(); // 角色属性受地图上所有东西影响
    }

    // 怪物属性发生变化
    public async onElemChanged(ps) {
        var e = ps.e;
        this.mv.mapView.refreshAt(e.pos.x, e.pos.y);
        await this.aniFact.createAni("elemChanged", {"m": ps.m});
        this.mv.refreshPlayer(); // 角色属性受地图上所有东西影响
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

        this.mv.refreshPlayer();
    }

    // 道具发生变化
    public async onPropChanged(ps) {
        this.mv.refreshPlayer();
    }

    // 产生攻击行为
    public async onAttack(ps) {
        this.mv.refreshPlayer();
        if (ps.subType == "player2monster")
            await this.aniFact.createAni("monsterAttackPlayer");
        else
            await this.aniFact.createAni("playerAttackMonster");
    }

    // 元素移动
    public async onElemMoving(ps) {
        var path = ps.path;
        if (path.length <= 1) // 只有一个起点，就不用移动了
            return;

        var fromPt = path[0];

        // 创建路径动画
        var showPath = Utils.map(path, (pt) => this.mv.mapView.logicPos2ShowPos(pt.x - fromPt.x, pt.y - fromPt.y));
        showPath.shift();
        var ev = this.mv.mapView.getElemViewAt(fromPt.x, fromPt.y).getShowLayer();
        await this.aniFact.createAni("moving", {"obj": ev, "path": showPath});
        
        // 刷新格子显示
        this.mv.mapView.refreshAt(fromPt.x, fromPt.y);
        if (path.length > 1)
            this.mv.mapView.refreshAt(path[path.length - 1].x, path[path.length - 1].y);

        this.mv.refreshPlayer(); // 角色属性受地图上所有东西影响
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
        this.mv.refresh();
        await this.blackOut();
    }

    // 吸血
    public async onSuckPlayerBlood(ps) {
        var x = ps.m.pos.x;
        var y = ps.m.pos.y
        await this.aniFact.createAni("suckBlood", {x:x, y:y});
        this.mv.refreshPlayer();
        this.mv.mapView.refreshAt(x, y);
    }

    // 怪物拿走物品
    public async onMonsterTakeElem(ps) {
        var m = ps.m;
        var e = ps.e;
        await this.aniFact.createAni("monsterTakeElem", {m:m, e:e});
    }

    async blackIn(removedWhenFinish = false) {
        this.addChild(this.blackCover);
        await this.aniFact.createAni("fadeIn", {"img": this.blackCover, "time": 1000});
        if (removedWhenFinish)
            this.removeChild(this.blackCover);
    }

    async blackOut() {
        await this.aniFact.createAni("fadeOut", {"img": this.blackCover, "time": 1000});
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
