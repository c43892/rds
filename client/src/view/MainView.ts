// 主视图
class MainView extends egret.DisplayObjectContainer {
    private mv:MapView; // 地图视图
    private player:Player; // 当前角色
    private avatar:egret.Bitmap; // 角色头像
    private hp:egret.TextField; // 血量
    private power:egret.TextField; // 攻击
    private defence:egret.TextField; // 防御
    private dodge:egret.TextField; // 闪避

    private aniLayer:egret.Bitmap; // 播放动画时的操作屏蔽层
    private aniFact:AnimationFactory; // 动画工厂

    private rv:ReplayView; // 录像界面
    
    public constructor(w:number, h:number) {
        super();
        
        this.mv = new MapView(w, h);
        this.addChild(this.mv);
        this.avatar = new egret.Bitmap();
        this.addChild(this.avatar);
        this.hp = new egret.TextField();
        this.addChild(this.hp);
        this.power = new egret.TextField();
        this.addChild(this.power);   
        this.defence = new egret.TextField();
        this.addChild(this.defence);   
        this.dodge = new egret.TextField();
        this.addChild(this.dodge);
        this.rv = new ReplayView(w, h);
        this.addChild(this.rv);

        this.aniFact = new AnimationFactory();
        this.aniFact.notifyAniStarted = (ani:Promise<void>, aniType:string, ps) => { this.onAniStarted(ani, aniType, ps); };
    }

    // 设置新的地图数据，但并不自动刷新显示，需要手动刷新
    public setMap(map:Map) {
        this.mv.setMap(map);
    }

    // 设置角色数据，但并不刷新显示，需要手动刷新
    public setPlayer(p:Player) {
        this.player = p;
    }

    public refresh() {
        this.refreshMap();
        this.refreshPlayer();

        // 播放动画时阻挡玩家操作
        this.aniLayer = ViewUtils.createBitmapByName("anilayer_png");
        this.aniLayer.width = this.width;
        this.aniLayer.height = this.height;
        this.aniLayer.touchEnabled = true;

        this.rv.refresh(this.width, this.height);
    }

    // 刷新地图显示
    public refreshMap() {
        // 地图区域尺寸
        this.mv.width = this.width - 20; // 左右两边各留 10 像素

        // 按比例计算高度
        var mapsize = RES.getRes("levelconfig_json")["mapsize"];
        this.mv.height = this.mv.width * mapsize.h / mapsize.w;

        // 锚点在中间底部，方便定位
        this.mv.anchorOffsetX = this.mv.width / 2; 
        this.mv.anchorOffsetY = this.mv.height;

        // 左右居中，距离底部一个格子高+ 20 像素
        this.mv.x = this.width / 2;
        this.mv.y = this.height - this.mv.width / mapsize.w - 20;

        this.mv.refresh();
    }

    // 刷新角色信息
    public refreshPlayer() {
        this.avatar.texture = RES.getRes(this.player.avatar + "_png");
        this.hp.text = "血量: " + this.player.hp + "/" + this.player.maxHp;
        this.power.text = "攻击: " + this.player.power;
        this.defence.text = "防御: " + this.player.defence;
        this.dodge.text = "闪避: " + this.player.dodge + "%";

        this.avatar.anchorOffsetX = 0;
        this.avatar.anchorOffsetY = 0;
        this.avatar.x = 20;
        this.avatar.y = 20;
        if (this.avatar.texture) {
            this.avatar.width = this.avatar.texture.textureWidth;
            this.avatar.height = this.avatar.texture.textureHeight;

            var x = this.avatar.x + this.avatar.width + 20;
            var y = this.avatar.y - 10;
            var txtArr = [this.hp, this.power, this.defence, this.dodge];
            for (var txt of txtArr) {
                txt.x = x;
                txt.y = y;
                y = txt.y + txt.height + 10;
            }
        }
        else {
            this.avatar.width = 0;
            this.avatar.width = 0;
        }
    }

    // 清除所有地图显示元素
    public clear() {
        this.mv.clear();
        this.avatar.texture = undefined;
        this.hp.text = "";
    }

    // 指定位置发生状态或元素变化
    public async onGridChanged(evt:GridChangedEvent) {
        if (evt.subType.indexOf("Elem") == 0)
            await this.mv.refreshAt(evt.x, evt.y);
        else
            await this.mv.refresh3x3(evt.x, evt.y);
    }

    // 怪物属性发生变化
    public async onMonsterChanged(evt:MonsterChangedEvent) {
        var m = evt.m;
        this.mv.refreshAt(m.pos.x, m.pos.y);
        await this.aniFact.createAni("monsterChanged", {"m": evt.m});
    }

    // 角色信息发生变化
    public async onPlayerChanged(evt:PlayerChangedEvent) {
        this.refreshPlayer();
        await this.aniFact.createAni("playerChanged");
    }

    // 产生攻击行为
    public async onAttacked(evt:AttackEvent) {
        this.refreshPlayer();
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
        var showPath = Utils.map(path, (pt) => this.mv.logicPos2ShowPos(pt.x, pt.y));
        showPath = Utils.map(showPath, (pt) => [pt[0] - showPath[0][0], pt[1] - showPath[0][1]]);
        showPath.shift();
        var eImg = this.mv.getElemViewAt(fromPt.x, fromPt.y);
        await this.aniFact.createAni("moving", {"img": eImg, "path": showPath});
        
        // 刷新格子显示
        this.mv.refreshAt(fromPt.x, fromPt.y);
        if (path.length > 1)
            this.mv.refreshAt(path[path.length - 1].x, path[path.length - 1].y);
    }

    // 动画开始播放时，阻止玩家操作
    aniLayerCnt = 0;
    onAniStarted(ani:Promise<void>, aniType:string, ps = undefined) {
        this.addChild(this.aniLayer);
        this.aniLayerCnt++;
        ani.then(() => {
            Utils.assert(this.aniLayerCnt > 0, "aniLayerCnt corrupted");
            this.aniLayerCnt--;
            if (this.aniLayerCnt == 0)
                this.removeChild(this.aniLayer);
        });
    }
}
