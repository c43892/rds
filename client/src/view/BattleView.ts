// 战斗视图
class BattleView extends egret.DisplayObjectContainer {    
    public player:Player; // 当前角色
    public title:egret.TextField; // 战斗名称
    public avatar:egret.Bitmap; // 角色头像
    public playerLv:egret.TextField; // 角色等级
    public money:egret.TextField; // 金币
    public deathStep:egret.TextField; // 死神距离
    public hp:egret.TextField; // 血量
    public power:egret.TextField; // 攻击
    public dodge:egret.TextField; // 闪避
    public relics:egret.Bitmap[] = []; // 遗物

    public mapView:MapView; // 地图视图
    public propsView:PropsView; // 道具视图
    public selView:SelView; // 目标选择视图
    private repView:ReplayView; // 录像界面
    public aniView:AniView; // 动画视图
    
    public openShop; // 打开商店界面
    public openPlayerLevelUpSels; // 打开角色升级界面

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        
        this.avatar = new egret.Bitmap();
        this.addChild(this.avatar);
        this.title = new egret.TextField();
        this.title.x = this.title.y = 0;
        this.title.width = this.width;
        this.addChild(this.title);
        this.playerLv = new egret.TextField();
        this.addChild(this.playerLv);

        this.money = new egret.TextField();
        this.addChild(this.money);

        this.deathStep = new egret.TextField();
        this.addChild(this.deathStep);

        this.hp = new egret.TextField();
        this.addChild(this.hp);
        this.power = new egret.TextField();
        this.addChild(this.power);  
        this.dodge = new egret.TextField();
        this.addChild(this.dodge);

        this.mapView = new MapView(w, h);
        this.addChild(this.mapView);
        this.propsView = new PropsView(w, 100);
        this.addChild(this.propsView);
        this.selView = new SelView();
        this.addChild(this.selView);
        this.repView = new ReplayView(w, h);
        this.addChild(this.repView);
        this.aniView = new AniView(w, h, this);
        this.addChild(this.aniView);
    }

    // 设置新的地图数据，但并不自动刷新显示，需要手动刷新
    public setMap(map:Map, title:string) {
        this.mapView.setMap(map);
        this.title.text = title;
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
        this.selView.width = this.width; this.selView.height = this.height;
        this.selView.x = this.selView.y = 0;
        this.selView.close();
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
        this.avatar.texture = RES.getRes(this.player.occupation + "_png");
        this.playerLv.text = "lv:" + this.player.lv + ", e:" + this.player.exp;
        this.money.text = "💴：" + this.player.money;
        this.deathStep.text = "😈：" + this.player.deathStep;
        this.hp.text = "血量: " + this.player.hp + "/" + this.player.maxHp;

        this.player.bt().calcPlayerAttackerAttrs().then((attackerAttrs) => {
            var power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
            this.power.text = "攻击: " + power;
        })

        this.player.bt().calcPlayerTargetAttrs().then((targetAttrs) => {
            var dodge = targetAttrs.dodge.b * (1 + targetAttrs.dodge.a) + targetAttrs.dodge.c;
            this.dodge.text = "闪避: " + this.player.dodge + "%";
        });

        this.avatar.anchorOffsetX = 0;
        this.avatar.anchorOffsetY = 0;
        this.avatar.x = 20;
        this.avatar.y = 20;

        if (this.avatar.texture) {
            this.avatar.width = this.avatar.texture.textureWidth;
            this.avatar.height = this.avatar.texture.textureHeight;

            this.money.x = this.avatar.x; 
            this.money.y = this.avatar.y + this.avatar.height + 10;
            this.deathStep.x = this.money.x + this.money.width + 10;
            this.deathStep.y = this.money.y;

            var x = this.avatar.x + this.avatar.width + 20;
            var y = this.avatar.y - 10;
            var txtArr = [this.hp, this.power, this.dodge];
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

        this.playerLv.x = this.avatar.x;
        this.playerLv.y = this.avatar.y;
        this.playerLv.width = this.avatar.width;
        this.playerLv.height = 30;
        this.playerLv.textColor = 0xff0000;

        this.refreshRelics();
        this.propsView.width = this.width;
        this.propsView.y = this.height - this.propsView.height;
        this.propsView.refresh(this.player.props);
    }

    public refreshRelics() {
        for (var rBmp of this.relics) this.removeChild(rBmp);
        this.relics = [];

        var x = this.money.x;
        var y = this.money.y + this.money.height + 10;
        for (var r of this.player.relics) {
            var rBmp = ViewUtils.createBitmapByName(r.getElemImgRes() + "_png");
            rBmp.x = x; rBmp.y = y;
            rBmp.width = rBmp.height = 25;
            x += rBmp.width + 5;
            this.addChild(rBmp);
            this.relics.push(rBmp);
        }
    }

    // 清除所有地图显示元素
    public clear() {
        this.mapView.clear();
        this.aniView.clear();
        this.repView.clear();
        this.selView.close();
        this.avatar.texture = undefined;
        this.hp.text = "";
        for (var rBmp of this.relics) this.removeChild(rBmp);
        this.relics = [];
    }

    // 初始化主视图数据
    public async onLevel(ps) {
        if (ps.subType == "levelInited") {
            var bt:Battle = ps.bt;
            this.setMap(bt.level.map, bt.displayName);
            this.setPlayer(bt.player);
            this.refresh();
        }

        await this.aniView.onLevel(ps);
    }

    // 角色变化
    public async onPlayerChanged(ps) {
        if (ps.subType == "lvUp") // 等级提升
            await this.openPlayerLevelUpSels();
    }

    // 打开商店
    public async onOpenShop(ps) {
        var shop = ps.shopCfg;
        var onBuy = ps.onBuy;
        var refreshItems = ps.refreshItems;
        await this.openShop(shop, onBuy, refreshItems);
    }

    // n 选 1
    public async select1inN(title:string, choices:string[], f) {
        return this.selView.sel1inN(title, choices, f);
    }

    // 打开目标选择界面
    public async selectGrid(f) {
        return this.selView.selGrid(this.mapView.gw, this.mapView.gh, 
                            this.mapView.gsize.w, this.mapView.gsize.h, 
                             /* mapView 是下面中间对齐的，我们需要计算左上角 */
                            this.mapView.x - this.mapView.width / 2, this.mapView.y - this.mapView.height,
                            f);
    }
}
