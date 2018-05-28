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

            this.hp.x = this.avatar.x + this.avatar.width + 20;
            this.hp.y = this.avatar.y - 10;
            this.power.x = this.hp.x;
            this.power.y = this.hp.y + this.hp.height + 10;
            this.defence.x = this.power.x;
            this.defence.y = this.power.y + this.defence.height + 10;
            this.dodge.x = this.defence.x;
            this.dodge.y = this.defence.y + this.dodge.height + 10;
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
    public onBrickChanged(evt:BrickChangedEvent) {
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
}
