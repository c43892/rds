// 战斗视图
class BattleView extends egret.DisplayObjectContainer {    
    public player:Player; // 当前角色

    // 战斗界面背景
    public bg:egret.Bitmap; // 整体背景

    // 头像区域
    public avatarBg:egret.Bitmap; // 角色头像区域背景
    public occupationBg:egret.Bitmap; // 角色职业背景
    public avatar:egret.Bitmap; // 角色头像
    public expBar:egret.Bitmap; // 经验条
    public expBarMask:egret.Shape; // 经验条遮罩
    public hp:egret.TextField; // 血量
    public hpBar:egret.Bitmap; // 血条
    public hpBarMask:egret.Shape; // 血条遮罩
    public power:egret.TextField; // 攻击
    public dodge:egret.TextField; // 闪避

    public money:egret.TextField; // 金币
    public currentStoryLv:egret.TextField; // 当前层数
    public deathGodBarBg:egret.Bitmap; // 死神进度条底条
    public deathGodBar:egret.Bitmap; // 死神进度条
    public deathGod:egret.Bitmap; // 死神位置

    public relicsBg:egret.DisplayObjectContainer; // 遗物区域
    public relics:egret.Bitmap[] = []; // 遗物
    public moreRelics:egret.Bitmap; // 更多遗物

    public mapView:MapView; // 地图视图
    public propsView:PropsView; // 道具视图
    public selView:SelView; // 目标选择视图
    public repView:ReplayView; // 录像界面
    public av:AniView; // 动画视图

    public openAllRelicsView; // 查看所有遗物

    // 角色头像区域，以及金钱，层数，死神
    createPlayerAttrs() {
        this.createAvatarArea();

        // 死神符号
        this.deathGodBarBg = ViewUtils.createBitmapByName("deathGodBarBg_png");
        this.deathGodBarBg.name = "deathGodBarBg";
        this.addChild(this.deathGodBarBg);
        this.deathGodBar = ViewUtils.createBitmapByName("deathGodBar_png");
        this.deathGodBar.name = "deathGodBar";
        this.addChild(this.deathGodBar);
        this.deathGod = ViewUtils.createBitmapByName("deathGod_png");
        this.deathGod.name = "deathGod";
        this.addChild(this.deathGod);

        ViewUtils.multiLang(this, this.deathGodBarBg, this.deathGodBar, this.deathGod);
    }

    // 头像、经验条、血条、攻击、闪避
    createAvatarArea() {

        // 头像
        this.occupationBg = new egret.Bitmap();
        this.occupationBg.name = "occupationBg";
        this.addChild(this.occupationBg);
        this.avatar = new egret.Bitmap();
        this.avatar.name = "avatar";
        this.addChild(this.avatar);

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
        this.hpBar = ViewUtils.createBitmapByName("hpBar_png");
        this.hpBar.name = "hpBar";
        this.addChild(this.hpBar);
        this.hp = ViewUtils.createTextField(20, 0xffffff);
        this.hp.name = "hp";
        this.addChild(this.hp);

        // 血条遮罩
        this.hpBarMask = new egret.Shape();
        this.hpBarMask.name = "expBarMask";
        this.hpBar.mask = this.hpBarMask;
        this.addChild(this.hpBarMask);

        // 攻击闪避属性
        this.power = ViewUtils.createTextField(20, 0xffffff, false);
        this.power.name = "power";
        this.addChild(this.power);
        this.dodge = ViewUtils.createTextField(20, 0xffffff, false);
        this.dodge.name = "dodge";
        this.addChild(this.dodge);

        // 金钱
        this.money = ViewUtils.createTextField(20, 0xffffff, false);
        this.money.name = "money";
        this.addChild(this.money);

        // 当前层数
        this.currentStoryLv = ViewUtils.createTextField(20, 0xffffff, false);
        this.currentStoryLv.name = "storeyLv";
        this.addChild(this.currentStoryLv);

        ViewUtils.multiLang(this, this.occupationBg, this.avatarBg, this.avatar, this.expBar, this.hp, this.hpBar, this.power, this.dodge, this.money, this.currentStoryLv);
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
        
        shape.graphics.clear();
        shape.graphics.beginFill(0xffffff);
        shape.graphics.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++)
            shape.graphics.lineTo(pts[i].x, pts[i].y);
        shape.graphics.lineTo(pts[0].x, pts[0].y);
        shape.graphics.endFill();
    }

    // 刷新血条遮罩
    refreshHpBar() {
        this.hp.text = !this.player ? "0" : this.player.hp.toString();
        var shape = this.hpBarMask;
        var p = !this.player ? 0 : (this.player.hp / this.player.maxHp);

        var pts = [
            {x: this.hpBar.x, y: this.hpBar.y + this.hpBar.height}, // 左下角
            {x: this.hpBar.x + this.hpBar.width, y: this.hpBar.y + this.hpBar.height} // 右下角
        ];

        var h = (1 - p) * this.hpBar.height;
        pts.push({x: this.hpBar.x + this.hpBar.width, y: this.expBar.y + h}); // 右上角
        pts.push({x: this.hpBar.x, y: this.expBar.y + h}); // 左上角

        shape.graphics.clear();            
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
        this.bg.scale9Grid = new egret.Rectangle(50, 150, 150, 50);
        this.addChild(this.bg);

        // 角色属性相关
        this.createPlayerAttrs();
        
        // 战斗区域
        this.mapView = new MapView(w, h);
        this.mapView.name = "mapView";
        this.addChild(this.mapView);

        // 物品栏
        this.propsView = new PropsView();
        this.propsView.name = "propsView";
        this.addChild(this.propsView);

        // 遗物区域
        this.relicsBg = new egret.DisplayObjectContainer();
        this.relicsBg.name = "relicsBg";
        this.addChild(this.relicsBg);
        this.moreRelics = ViewUtils.createBitmapByName("moreRelicsBtn_png");
        this.moreRelics.name = "moreRelics";
        this.addChild(this.moreRelics);
        this.moreRelics.touchEnabled = true;
        this.moreRelics.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt:egret.TouchEvent) => {
            this.openAllRelicsView(this.player.relics);
        }, this);

        // 格子选择
        this.selView = new SelView(w, h);
        this.addChild(this.selView);

        // 录像
        this.repView = new ReplayView(w, h);
        this.addChild(this.repView);
    }

    // 设置新的地图数据，但并不自动刷新显示，需要手动刷新
    public setMap(map:Map, title:string) {
        this.mapView.setMap(map);
    }

    // 设置角色数据，但并不刷新显示，需要手动刷新
    public setPlayer(p:Player) {
        this.player = p;
    }

    public refresh() {
        this.refreshMap();
        this.refreshPlayer();
        this.av.refresh();
        this.repView.refresh();
        this.selView.close();
    }

    // 刷新地图显示
    public refreshMap() {
        ViewUtils.multiLang(this, this.mapView);
        this.mapView.refresh();
    }

    // 刷新角色信息
    deathGodBarPosX;
    deathGodBarWidth;
    public refreshPlayer() {
        ViewUtils.setTexName(this.occupationBg, this.player.occupation + "Bg_png");
        ViewUtils.setTexName(this.avatar, this.player.occupation + "_png");
        this.money.text = this.player.money.toString();
        this.currentStoryLv.text = this.player.currentStoreyPos.lv.toString();

        if (!this.deathGodBarPosX) this.deathGodBarPosX = this.deathGodBar.x
        if (!this.deathGodBarWidth) this.deathGodBarWidth = this.deathGodBar.width;
        var p = this.player.deathStep / this.player.maxDeathStep;
        this.deathGod.x = this.deathGodBarPosX + p * this.deathGodBarWidth - this.deathGod.width / 2;
        this.deathGodBar.width = this.deathGodBarWidth * p;

        this.player.bt().calcPlayerAttackerAttrs().then((attackerAttrs) => {
            var power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
            this.power.text = power.toString();
        })

        this.player.bt().calcPlayerTargetAttrs().then((targetAttrs) => {
            var dodge = targetAttrs.dodge.b * (1 + targetAttrs.dodge.a) + targetAttrs.dodge.c;
            this.dodge.text = this.player.dodge + "%";
        });

        // 遗物
        this.refreshRelics();

        this.refreshExpBar();
        this.refreshHpBar();
        ViewUtils.multiLang(this, this.avatarBg, this.avatar, this.power, this.dodge, this.propsView, this.moreRelics);

        // 物品
        this.refreshProps();
    }

    // 刷新物品列表
    public refreshProps() {
        this.propsView.refresh(this.player.props);
    }

    public refreshRelics() {
        ViewUtils.multiLang(this, this.relicsBg);

        for (var rBmp of this.relics)
            this.removeChild(rBmp);
        
        this.relics = [];

        const ShowMaxRelicNum = 6;
        var w = this.relicsBg.width / ShowMaxRelicNum;
        var h = w;
        var x = this.relicsBg.x;
        var y = this.relicsBg.y;
        var spaceX = (this.relicsBg.width - ShowMaxRelicNum * w) / (ShowMaxRelicNum - 1);
        for (var i = 0; i < this.player.relics.length && i < ShowMaxRelicNum; i++) {
            var r = this.player.relics[i];
            var rBmp = ViewUtils.createBitmapByName(r.getElemImgRes() + "_png");
            rBmp.x = x;
            rBmp.y = y;
            rBmp.width = w;
            rBmp.height = h;
            x += w + spaceX;
            this.addChild(rBmp);
            this.relics.push(rBmp);
            rBmp.touchEnabled = true;
            rBmp["relic"] = r;
            rBmp.addEventListener(egret.TouchEvent.TOUCH_TAP, async (evt:egret.TouchEvent) => {
                await ElemView.showElemDesc(evt.target["relic"]);
            }, this);
        }
    }

    // 清除所有地图显示元素
    public clear() {
        this.mapView.clear();
        this.av.clear();
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

        await this.av.onLevel(ps);
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
            this.mapView.x, this.mapView.y, f);
    }
}
