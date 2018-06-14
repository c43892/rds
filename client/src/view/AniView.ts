// 主视图下属的动画层
class AniView extends egret.DisplayObjectContainer {
    private mv:MainView; // 主视图
    private blackCover:egret.Bitmap; // 黑屏用的遮挡

    private aniCover:egret.Bitmap; // 播放动画时的操作屏蔽层
    private aniFact:AnimationFactory; // 动画工厂

    public constructor(w:number, h:number, mainView:MainView) {
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
    public async onGridChanged(evt:GridChangedEvent) {
        if (evt.subType.indexOf("Elem") == 0)
            await this.mv.mapView.refreshAt(evt.x, evt.y);
        else
            await this.mv.mapView.refresh3x3(evt.x, evt.y);
    }

    // 怪物属性发生变化
    public async onMonsterChanged(evt:MonsterChangedEvent) {
        var m = evt.m;
        this.mv.mapView.refreshAt(m.pos.x, m.pos.y);
        await this.aniFact.createAni("monsterChanged", {"m": evt.m});
    }

    // 角色信息发生变化
    public async onPlayerChanged(evt:PlayerChangedEvent) {
        this.mv.refreshPlayer();
        await this.aniFact.createAni("playerChanged");
    }

    // 产生攻击行为
    public async onAttacked(evt:AttackEvent) {
        this.mv.refreshPlayer();
        if (evt.subType == "player2monster")
            await this.aniFact.createAni("monsterAttackPlayer", {"m": evt.m});
        else
            await this.aniFact.createAni("playerAttackMonster", {"m": evt.m});
    }

    // 元素移动
    public async onElemMoving(evt:ElemMovingEvent) {
        var path = evt.path;
        var fromPt = evt.path[0];
        
        // 创建路径动画
        var showPath = Utils.map(path, (pt) => this.mv.mapView.logicPos2ShowPos(pt.x, pt.y));
        showPath = Utils.map(showPath, (pt) => [pt[0] - showPath[0][0], pt[1] - showPath[0][1]]);
        showPath.shift();
        var eImg = this.mv.mapView.getElemViewAt(fromPt.x, fromPt.y);
        await this.aniFact.createAni("moving", {"img": eImg, "path": showPath});
        
        // 刷新格子显示
        this.mv.mapView.refreshAt(fromPt.x, fromPt.y);
        if (path.length > 1)
            this.mv.mapView.refreshAt(path[path.length - 1].x, path[path.length - 1].y);
    }

    // 关卡事件
    public async onLevelEvent(evt:LevelEvent) {
        switch (evt.subType) {
            case "goOutLevel": // 出关卡
                this.addChild(this.blackCover);
                await this.aniFact.createAni("fadeIn", {"img": this.blackCover, "time": 1000});
                this.removeChild(this.blackCover);
            break;
            case "goInLevel": // 进关卡
                this.addChild(this.blackCover);
                await this.aniFact.createAni("fadeOut", {"img": this.blackCover, "time": 1000});
                this.removeChild(this.blackCover);
            break;
            default:
                Utils.assert(false, "unhandled LevelEvent: " + evt.subType);            
        }    
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
