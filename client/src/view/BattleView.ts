// 战斗视图
class BattleView extends egret.DisplayObjectContainer {    
    public player:Player; // 当前角色

    // 战斗界面背景
    public bg:egret.Bitmap; // 整体背景

    // 头像区域
    public avatarBg:egret.Bitmap; // 角色头像区域背景
    public avatar:egret.Bitmap; // 角色头像
    public expBar:egret.Bitmap; // 经验条
    public hpBar:egret.Bitmap; // 血条
    public hpBarBg:egret.Bitmap; // 血条底色
    public expBarMask:egret.Shape; // 经验条遮罩
    public hpBarMask:egret.Shape; // 血条遮罩
    public power:egret.TextField; // 攻击
    public dodge:egret.TextField; // 闪避

    public money:egret.TextField; // 金币
    public currentStoryLv:egret.TextField; // 当前层数
    public deathStep:egret.TextField; // 死神距离    

    public title:egret.TextField; // 战斗名称
    public playerLv:egret.TextField; // 角色等级

    public relics:egret.Bitmap[] = []; // 遗物

    public mapView:MapView; // 地图视图
    public propsView:PropsView; // 道具视图
    public selView:SelView; // 目标选择视图
    public repView:ReplayView; // 录像界面
    public aniView:AniView; // 动画视图
    
    public openShop; // 打开商店界面
    public openPlayerLevelUpSels; // 打开角色升级界面

    // 角色头像区域，以及金钱，层数，死神
    createPlayerAttrs() {
        this.createAvatarArea();

        this.money = ViewUtils.createTextField(25, 0xffff00, false);
        this.money.name = "money";
        this.addChild(this.money);

        this.currentStoryLv = ViewUtils.createTextField(25, 0xffff00, false);
        this.currentStoryLv.name = "storeyLv";
        this.addChild(this.currentStoryLv);

        ViewUtils.multiLang(this, this.money,this.currentStoryLv);
    }

    // 头像、经验条、血条、攻击、闪避
    createAvatarArea() {

        // 头像区域背景
        this.avatarBg = ViewUtils.createBitmapByName("avatarBg_png");
        this.avatarBg.name = "avatarBg";
        this.addChild(this.avatarBg);

        // 经验条
        this.expBar = ViewUtils.createBitmapByName("expBar_png");
        this.expBar.name = "expBar";
        this.addChild(this.expBar);

        // 经验条遮罩
        this.expBarMask = new egret.Shape();
        this.expBarMask.name = "expBarMask";
        this.expBar.mask = this.expBarMask;
        this.addChild(this.expBarMask);

        // 血条
        this.hpBarBg = ViewUtils.createBitmapByName("hpBarBg_png");
        this.hpBarBg.name = "hpBarBg";
        this.addChild(this.hpBarBg);        
        this.hpBar = ViewUtils.createBitmapByName("hpBar_png");
        this.hpBar.name = "hpBar";
        this.addChild(this.hpBar);

        // 血条遮罩
        this.hpBarMask = new egret.Shape();
        this.hpBarMask.name = "expBarMask";
        this.hpBar.mask = this.hpBarMask;
        this.addChild(this.hpBarMask);

        // 头像
        this.avatar = new egret.Bitmap();
        this.avatar.name = "avatar";
        this.addChild(this.avatar);

        // 攻击闪避属性
        this.power = ViewUtils.createTextField(20, 0xff0000, false);
        this.power.name = "power";
        this.addChild(this.power);
        this.dodge = ViewUtils.createTextField(20, 0xff0000, false);
        this.dodge.name = "dodge";
        this.addChild(this.dodge);

        ViewUtils.multiLang(this, this.avatarBg, this.avatar, this.expBar, this.hpBar, this.hpBarBg, this.power, this.dodge);
        this.refreshExpBar();
        this.refreshHpBar();
    }

    // 根据当前升级进度，刷新经验条遮罩
    refreshExpBar() {
        var shape = this.expBarMask;
        var p = !this.player ? 0 : this.player.lvUpProgress();

        var pts = [
            {x: this.expBar.x + this.expBar.width, y: this.expBar.y + this.expBar.height}, // 右下角
            {x: this.expBar.x, y: this.expBar.y + this.expBar.height} // 左下角
        ];

        if (p > 0.5) {
            pts.push({x: this.expBar.x, y: this.expBar.y}); // 左上角
            pts.push({x: this.expBar.x + this.expBar.width * (p - 0.5) / 0.5, y: this.expBar.y}); // 右上角
        } else {
            pts.push({x: this.expBar.x, y: this.expBar.y + this.expBar.height * (0.5 - p) / 0.5}); // 左上角
        }
        
        shape.graphics.beginFill(0xffffff);
        shape.graphics.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++)
            shape.graphics.lineTo(pts[i].x, pts[i].y);
        shape.graphics.lineTo(pts[0].x, pts[0].y);
        shape.graphics.endFill();
    }

    // 刷新血条遮罩
    refreshHpBar() {
        var shape = this.hpBarMask;
        var p = !this.player ? 0 : (this.player.hp / this.player.maxHp);

        var pts = [
            {x: this.hpBar.x, y: this.hpBar.y + this.hpBar.height}, // 左下角
            {x: this.hpBar.x + this.hpBar.width, y: this.hpBar.y + this.hpBar.height} // 右下角
        ];

        var h = p * this.hpBar.height;
        pts.push({x: this.hpBar.x + this.hpBar.width, y: this.expBar.y + h}); // 右上角
        pts.push({x: this.hpBar.x, y: this.expBar.y + h}); // 左上角
        
        shape.graphics.beginFill(0xffffff);
        shape.graphics.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++)
            shape.graphics.lineTo(pts[i].x, pts[i].y);
        shape.graphics.lineTo(pts[0].x, pts[0].y);
        shape.graphics.endFill();
    }

    public constructor(w:number, h:number) {
        super();

        this.name = "battle";
        this.width = w;
        this.height = h;

        // 整体背景
        this.bg = ViewUtils.createBitmapByName("battleBg_png"); 
        this.bg.name = "bg";
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.scale9Grid = new egret.Rectangle(50, 50, 150, 150);
        this.addChild(this.bg);

        // 角色属性相关
        this.createPlayerAttrs();
        
        this.title = new egret.TextField();
        // this.addChild(this.title);
        this.playerLv = new egret.TextField();
        this.avatar.name = "avatar";
        // this.addChild(this.playerLv);

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
        ViewUtils.setTexName(this.avatar, this.player.occupation + "_png");
        this.playerLv.text = "lv:" + this.player.lv + ", e:" + this.player.exp;
        this.money.text = "⚪:" + this.player.money;
        this.currentStoryLv.text = "📶:" + this.player.currentStoreyPos.lv;
        // this.deathStep.text = "😈：" + this.player.deathStep;

        this.player.bt().calcPlayerAttackerAttrs().then((attackerAttrs) => {
            var power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
            this.power.text = power.toString();
        })

        this.player.bt().calcPlayerTargetAttrs().then((targetAttrs) => {
            var dodge = targetAttrs.dodge.b * (1 + targetAttrs.dodge.a) + targetAttrs.dodge.c;
            this.dodge.text = this.player.dodge + "%";
        });

        // this.playerLv.x = this.avatar.x;
        // this.playerLv.y = this.avatar.y;
        // this.playerLv.width = this.avatar.width;
        // this.playerLv.height = 30;
        // this.playerLv.textColor = 0xff0000;

        this.refreshRelics();
        this.propsView.width = this.width;
        this.propsView.y = this.height - this.propsView.height;
        this.propsView.refresh(this.player.props);

        this.refreshExpBar();
        this.refreshHpBar();
        ViewUtils.multiLang(this, this.avatarBg, this.avatar, this.power, this.dodge);
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
        for (var rBmp of this.relics)
            this.removeChild(rBmp);
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
