// 主视图
class MainView extends egret.DisplayObjectContainer {
    private mv:MapView; // 地图视图
    private player:Player; // 当前角色
    private avatar:egret.Bitmap; // 角色头像
    private hp:egret.TextField; // 血量
    private power:egret.TextField; // 攻击
    private defence:egret.TextField; // 防御
    private dodge:egret.TextField; // 闪避

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
    public onGridChanged(evt:GridChangedEvent) {
        if (evt.subType.indexOf("Elem") == 0)
            this.mv.refreshAt(evt.x, evt.y);
        else
            this.mv.refresh3x3(evt.x, evt.y);
    }

    // 怪物属性发生变化
    public onMonsterChanged(evt:MonsterChangedEvent) {
        var m = evt.m;
        this.mv.refreshAt(m.pos.x, m.pos.y);
    }

    // 角色信息发生变化
    public onPlayerChanged(evt:PlayerChangedEvent) {
        this.refreshPlayer();
    }

    // 产生攻击行为
    public onAttacked(evt:AttackEvent) {
    }

    // 元素移动
    public onElemMoving(evt:ElemMovingEvent) {
        var path = evt.path;
        
        // var iter = Utils.createInterpolater(Utils.map(path, (pt) => [pt.x, pt.y]));
        // while (true) {
        //     var pt = iter(0.1);
        //     if (pt == undefined)
        //         break;
        // }

        if (path.length == 1)
            this.mv.refreshAt(path[0].x, path[0].y);
        else if (path.length > 1) {
            this.mv.refreshAt(path[0].x, path[0].y);
            this.mv.refreshAt(path[path.length - 1].x, path[path.length - 1].y);
        }
    }
}
