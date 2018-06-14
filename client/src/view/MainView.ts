// 主视图
class MainView extends egret.DisplayObjectContainer {    
    public player:Player; // 当前角色
    public avatar:egret.Bitmap; // 角色头像
    public hp:egret.TextField; // 血量
    public power:egret.TextField; // 攻击
    public defence:egret.TextField; // 防御
    public dodge:egret.TextField; // 闪避

    public mapView:MapView; // 地图视图
    private repView:ReplayView; // 录像界面
    public aniView:AniView; // 动画视图

    public constructor(w:number, h:number) {
        super();
        
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

        this.mapView = new MapView(w, h);
        this.addChild(this.mapView);
        this.repView = new ReplayView(w, h);
        this.addChild(this.repView);
        this.aniView = new AniView(w, h, this);
        this.addChild(this.aniView);
    }

    // 设置新的地图数据，但并不自动刷新显示，需要手动刷新
    public setMap(map:Map) {
        this.mapView.setMap(map);
    }

    // 设置角色数据，但并不刷新显示，需要手动刷新
    public setPlayer(p:Player) {
        this.player = p;
    }

    public refresh() {
        this.refreshMap();
        this.refreshPlayer();
        this.aniView.refresh(this.width, this.height);
        this.repView.refresh(this.width, this.height);
    }

    // 刷新地图显示
    public refreshMap() {
        // 地图区域尺寸
        this.mapView.width = this.width - 20; // 左右两边各留 10 像素

        // 按比例计算高度
        var mapsize = RES.getRes("levelconfig_json")["mapsize"];
        this.mapView.height = this.mapView.width * mapsize.h / mapsize.w;

        // 锚点在中间底部，方便定位
        this.mapView.anchorOffsetX = this.mapView.width / 2; 
        this.mapView.anchorOffsetY = this.mapView.height;

        // 左右居中，距离底部一个格子高+ 20 像素
        this.mapView.x = this.width / 2;
        this.mapView.y = this.height - this.mapView.width / mapsize.w - 20;

        this.mapView.refresh();
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
        this.mapView.clear();
        this.aniView.clear();
        this.repView.clear();
        this.avatar.texture = undefined;
        this.hp.text = "";
    }

    // 初始化主视图数据
    public async onLevelEvent(evt:LevelEvent) {
        if (evt.subType == "levelInited") {
            var bt = evt.bt;
            this.setMap(bt.level.map);
            this.setPlayer(bt.player);
            this.refresh();
        }

        await this.aniView.onLevelEvent(evt);
    }
}
