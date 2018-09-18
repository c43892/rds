// 战斗视图
class BattleView extends egret.DisplayObjectContainer {    
    public player:Player; // 当前角色

    // 战斗界面背景
    public bg:egret.Bitmap; // 整体背景
    public mapViewBg:egret.Bitmap; // 格子区域底图
    public bgGrids:egret.Bitmap; // 背景格子

    // 头像区域
    public avatarBg:egret.Bitmap; // 角色头像区域背景
    public occupationBg:egret.Bitmap; // 角色职业背景
    public avatar:egret.Bitmap; // 角色头像
    public avatarWeapon:egret.Bitmap; // 角色上层的武器表现
    public avatarAreaMask:egret.Bitmap; // 角色区域的遮罩
    public expBar:egret.Bitmap; // 经验条
    public expBarMask:egret.Shape; // 经验条遮罩
    public deadlyMask:egret.Bitmap; // 濒死效果
    public hp:egret.TextField; // 血量
    public hpBar:egret.Bitmap; // 血条
    public hpBarMask:egret.Shape; // 血条遮罩
    public power:egret.TextField; // 攻击
    public dodge:egret.TextField; // 闪避

    // 金钱和当前层数显示背景，需要置顶
    public moneyAndStoriesBg:egret.Bitmap;

    public money:egret.TextField; // 金币
    public currentStoryLv:egret.TextField; // 当前层数
    public deathGodBarBg:egret.Bitmap; // 死神进度条底条
    public deathGodBar:egret.Bitmap; // 死神进度条
    public deathGod:egret.Bitmap; // 死神位置
    public deathGodStepBtn:egret.Bitmap; // 用于点击后提示死神剩余步数
    public effDeathGod:egret.MovieClip; // 死神快到的时候闪烁

    readonly ShowMaxRelicNum = 6;
    public relicsBg:egret.DisplayObjectContainer; // 遗物区域
    public relics:egret.Bitmap[] = []; // 遗物
    public moreRelics:egret.Bitmap; // 更多遗物

    public mapView:MapView; // 地图视图
    public propsView:PropsView; // 道具视图
    public selView:SelView; // 目标选择视图
    public repView:ReplayView; // 录像界面
    public av:AniView; // 动画视图
    public monsterTip:NewMonsterTipView; // 新怪物提示
    public elemsTip:egret.DisplayObjectContainer;// 特殊元素提示
    public elemsTipBitmaps:egret.Bitmap[] = []; // 特殊元素提示图

    public openAllElemsView; // 查看所有的某类元素如玩家的遗物或者道具
    public confirmOkYesNo;

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
        this.deathGodStepBtn = new egret.Bitmap();
        this.deathGodStepBtn.width = this.deathGod.width + 10;
        this.deathGodStepBtn.height = this.deathGod.height + 10;
        this.deathGodStepBtn.touchEnabled = true;
        this.deathGodStepBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, async (evt:egret.TouchEvent) => await this.showDeathGodStep(evt), this);
        this.addChild(this.deathGodStepBtn);
        this.effDeathGod = ViewUtils.createFrameAni("effDeathGod");
        this.addChild(this.effDeathGod);
        
        ViewUtils.multiLang(this, this.deathGodBarBg, this.deathGodBar, this.deathGod);
    }

    // 头像、经验条、血条、攻击、闪避
    createAvatarArea() {
        // 头像
        this.occupationBg = new egret.Bitmap();
        this.occupationBg.name = "occupationBg";
        this.avatar = new egret.Bitmap();
        this.avatar.name = "avatar";
        this.avatarWeapon = new egret.Bitmap();
        this.avatarWeapon.alpha = 0; // 平时隐藏
        this.avatarWeapon.name = "avatarWeapon";
        this.avatarAreaMask = ViewUtils.createBitmapByName("translucent_png");
        this.avatarAreaMask.name = "avatarAreaMask";

        this.avatar.mask = this.avatarAreaMask;
        this.occupationBg.mask = this.avatarAreaMask;
        this.avatarWeapon.mask = this.avatarAreaMask;

        // 头像区域背景
        this.avatarBg = ViewUtils.createBitmapByName("avatarBg_png");
        this.avatarBg.name = "avatarBg";

        // 经验条
        this.expBar = ViewUtils.createBitmapByName("expBar_png");
        this.expBar.name = "expBar";

        // 经验条遮罩
        this.expBarMask = new egret.Shape();
        this.expBarMask.name = "expBarMask";
        this.expBar.mask = this.expBarMask;

        // 血条
        this.hpBar = ViewUtils.createBitmapByName("hpBar_png");
        this.hpBar.name = "hpBar";
        this.hp = ViewUtils.createTextField(20, 0xffffff);
        this.hp.name = "hp";

        // 金钱等背景
        this.moneyAndStoriesBg = ViewUtils.createBitmapByName("moneyAndStoriesBg_png");
        this.moneyAndStoriesBg.name = "moneyAndStoriesBg";
        this.moneyAndStoriesBg.y = ViewUtils.getScreenEdges().top;

        // 血条遮罩
        this.hpBarMask = new egret.Shape();
        this.hpBarMask.name = "expBarMask";
        this.hpBar.mask = this.hpBarMask;
        
        // 攻击闪避属性
        this.power = ViewUtils.createTextField(20, 0xffffff, false);
        this.power.name = "power";
        this.dodge = ViewUtils.createTextField(20, 0xffffff, false);
        this.dodge.name = "dodge";

        // 金钱
        this.money = ViewUtils.createTextField(20, 0xffffff, false);
        this.money.name = "money";
        this.money.y = this.moneyAndStoriesBg.y + 10;

        // 当前层数
        this.currentStoryLv = ViewUtils.createTextField(20, 0xffffff, false);
        this.currentStoryLv.name = "storeyLv";
        this.currentStoryLv.y = this.moneyAndStoriesBg.y + 10;

        var objs = [
            this.moneyAndStoriesBg, this.occupationBg, this.avatar, this.avatarWeapon, this.avatarBg,
            this.currentStoryLv, this.money, this.power, this.dodge, 
            this.hpBarMask, this.expBarMask, this.expBar, this.hpBar, this.hp
        ];

        this.addChild(this.avatarAreaMask);
        this.avatarAreaMask.x = this.avatarBg.x;
        this.avatarAreaMask.y = this.avatarBg.y;
        this.avatarAreaMask.width = this.avatarBg.width - 20;
        this.avatarAreaMask.height = this.avatarBg.height - 20;

        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

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
        this.addChild(this.bg);
        ViewUtils.asFullBg(this.bg);
        this.bg.touchEnabled = true;

        // 格子区域底图
        this.mapViewBg = ViewUtils.createBitmapByName("mapViewbg_png"); 
        this.mapViewBg.name = "mapViewBg";
        this.addChild(this.mapViewBg);

        // 背景格子
        this.bgGrids = ViewUtils.createBitmapByName("bgGrids_png");
        this.bgGrids.name = "bgGrids";
        this.addChild(this.bgGrids);

        // 角色属性相关
        this.createPlayerAttrs();
        
        // 战斗区域
        this.mapView = new MapView(w, h);
        this.mapView.name = "mapView";
        this.addChild(this.mapView);

        //特殊元素提示
        this.elemsTip = new egret.DisplayObjectContainer();
        this.elemsTip.name = "elemsTip";
        this.addChild(this.elemsTip);        

        // 物品栏
        this.propsView = new PropsView();
        this.propsView.name = "propsView";
        this.addChild(this.propsView);

        // 格子选择
        this.selView = new SelView(w, h);
        this.addChild(this.selView);

        // 遗物区域
        this.relicsBg = new egret.DisplayObjectContainer();
        this.relicsBg.name = "relicsBg";
        this.addChild(this.relicsBg);
        this.moreRelics = ViewUtils.createBitmapByName("moreRelicsBtn_png");
        this.moreRelics.name = "moreRelics";
        this.addChild(this.moreRelics);
        this.moreRelics.touchEnabled = true;
        this.moreRelics.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt:egret.TouchEvent) => {
            this.openAllElemsView(this.player.relics);
        }, this);

        for (var i = 0; i < this.ShowMaxRelicNum; i++) {
            var bmp = new egret.Bitmap();
            bmp.alpha = 0;
            this.addChild(bmp);
            this.relics.push(bmp);
            bmp.touchEnabled = true;
            bmp.addEventListener(egret.TouchEvent.TOUCH_TAP, async (evt:egret.TouchEvent) => {
                var r = evt.target["relic"];
                if (r) await GridView.showElemDesc(r);
            }, this);
        }

        // 录像
        this.repView = new ReplayView(w, h);
        this.addChild(this.repView);

        // 新怪的图例提示
        this.monsterTip = new NewMonsterTipView(w, h, this);
        this.addChild(this.monsterTip);

        // 濒死效果
        this.deadlyMask = ViewUtils.createBitmapByName("deadlyMask_png");
        this.deadlyMask.alpha = 0;
        this.deadlyMask.width = this.width;
        this.deadlyMask.height = this.height;
        this.addChild(this.deadlyMask);

        ViewUtils.multiLang(this, this.bgGrids, this.mapViewBg);
    }

    // 设置新的地图数据，但并不自动刷新显示，需要手动刷新
    public setMap(map:Map, title:string) {
        this.mapView.setMap(map);
        this.selView.rebuild(this.mapView.gsize.w, this.mapView.gsize.h);
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
        this.refreshElemsTip();
        if (this.contains(this.selView)) this.removeChild(this.selView);
    }

    // 刷新地图显示
    public refreshMap() {
        ViewUtils.multiLang(this, this.mapView);
        this.mapView.refresh();
    }

    // 刷新死神位置
    public refreshDeathGod(stepAt = undefined) {
        stepAt = stepAt ? stepAt : this.player.deathStep;
        if (stepAt >= this.player.maxDeathStep)
            stepAt = this.player.maxDeathStep;
        else if (stepAt < 0)
            stepAt = 0;

        var p = stepAt / this.player.maxDeathStep;
        this.deathGod.x = this.deathGodBarPosX + p * this.deathGodBarWidth - this.deathGod.width / 2;
        this.deathGodBar.width = this.deathGodBarWidth * p;
        this.deathGod.alpha = 1;

        this.deathGodStepBtn.x = this.deathGod.x - 5;
        this.deathGodStepBtn.y = this.deathGod.y - 5;

        // 死神临近效果
        this.effDeathGod.x = this.deathGod.x;
        this.effDeathGod.y = this.deathGod.y;

        if (stepAt <= 5) {
            this.effDeathGod.gotoAndPlay(0, -1);
            this.effDeathGod.alpha = 1;
        }
        else {
            this.effDeathGod.stop();
            this.effDeathGod.alpha = 0;
        }
    }

    // 获取死神图片，做动画效果用
    public getDeathGodImg() {
        return this.deathGod;
    }

    // 刷新金钱显示
    public refreshMoney() {
        var num = this.player.money;
        this.money.text = num.toString();
    }

    // 获取金钱显示对象
    public getMoneyText() {
        return this.money;
    }

    // 刷新角色信息
    deathGodBarPosX;
    deathGodBarWidth;
    public refreshPlayer() {
        ViewUtils.setTexName(this.occupationBg, this.player.occupation + "Bg_png", true);
        ViewUtils.setTexName(this.avatar, this.player.occupation + "_png", true);
        this.avatarWeapon.alpha = 0;
        this.currentStoryLv.text = this.player.currentStoreyPos.lv.toString();

        this.refreshMoney();

        // 刷新死神位置
        if (!this.deathGodBarPosX) this.deathGodBarPosX = this.deathGodBar.x
        if (!this.deathGodBarWidth) this.deathGodBarWidth = this.deathGodBar.width;
        this.refreshDeathGod();

        var attackerAttrs = this.player.bt().calcPlayerAttackerAttrs();
        var power = attackerAttrs.power.b * (1 + attackerAttrs.power.a) + attackerAttrs.power.c;
        this.power.text = power.toString();
        
        var targetAttrs = this.player.bt().calcPlayerTargetAttrs();
        var dodge = targetAttrs.dodge.b * (1 + targetAttrs.dodge.a) + targetAttrs.dodge.c;
        this.dodge.text = this.player.dodge + "%";

        // 遗物
        this.refreshRelics();

        this.refreshExpBar();
        this.refreshHpBar();
        ViewUtils.multiLang(this, this.avatarBg, this.avatarAreaMask, this.avatar, this.avatarWeapon, this.power, this.dodge, this.propsView, this.moreRelics);

        // 物品
        this.refreshProps();
    }

    // 刷新物品列表
    public refreshProps() {
        this.propsView.refresh(this.player.props);
    }

    public refreshRelics() {
        ViewUtils.multiLang(this, this.relicsBg);

        var w = this.relicsBg.height;
        var h = w;
        var x = this.relicsBg.x;
        var y = this.relicsBg.y;
        var spaceX = (this.relicsBg.width - this.ShowMaxRelicNum * w) / (this.ShowMaxRelicNum - 1);
        for (var i = 0; i < this.relics.length; i++) {
            var bmp = this.relics[i];
            bmp.x = x;
            bmp.y = y;
            bmp.width = w;
            bmp.height = h;
            x += w + spaceX;

            var r = this.player.relics[i];
            if (r) {
                ViewUtils.setTexName(bmp, r.getElemImgRes() + "_png");
                bmp.alpha = 1;
                bmp["relic"] = r;
            } else {
                bmp.alpha = 0;
                bmp["relic"] = undefined;
            }
        }
    }

    // 清除所有地图显示元素
    public clear() {
        this.mapView.clear();
        this.av.clear();
        this.repView.clear();
        if (this.contains(this.selView)) this.removeChild(this.selView);
        this.avatar.texture = undefined;
        this.avatarWeapon.texture = undefined;
        for (var bmp of this.relics) {
            bmp.alpha = 0;
            bmp["relic"] = undefined;
        }
    }

    public initBattleView (ps) {
        var bt:Battle = ps.bt;
        this.setMap(bt.level.map, bt.displayName);
        this.setPlayer(bt.player);
        this.refresh();
    }

    // 初始状态下隐藏所有 ban 符号
    public hideAllBanImg(hideOrShow:boolean) {
        var gs = this.mapView.getGridViews(undefined, true);
        gs.forEach((g, _) => g.hideBanImg(hideOrShow));
    }

    // n 选 1
    // public async select1inN(title:string, choices:string[], f) {
    //     return this.selView.sel1inN(title, choices, f);
    // }

    // 打开目标选择界面
    public async selectGrid(f) {
        this.addChild(this.selView);
        var r = await this.selView.selGrid(this.mapView.gw, this.mapView.gh,
            this.mapView.x, this.mapView.y,
            f, (x, y) => this.mapView.getGridViewAt(x, y));
        this.removeChild(this.selView);
        return r;
    }

    public async showDeathGodStep(evt:egret.TouchEvent){
        var tip = ViewUtils.formatString(ViewUtils.getTipText("showDeathGodStep"), this.player.deathStep);
        await this.confirmOkYesNo("", tip, false);
    }

    // 刷新特殊元素提示
    public refreshElemsTip() {
        this.elemsTipBitmaps = [];
        this.elemsTip.removeChildren();
        ViewUtils.multiLang(this, this.elemsTip);
        var tipTypes = ["Clock", "Magazine", "EconomyMagazine", "Gengar", "TreasureBox"];
        var elems = this.player.bt().level.map.findAllElems((e:Elem) => Utils.indexOf(tipTypes, (s:string) => s == e.type) > -1);
        var gap = 8;
        for(var i = 0; i < elems.length; i++){
            var img = ViewUtils.createBitmapByName(elems[i].getElemImgRes() + "_png");
            img.width = img.height = 55;
            img.x = this.elemsTip.width / 2 + (i - (elems.length - 1) / 2) * (gap + img.width) - img.width / 2
            img.y = 0;
            this.elemsTipBitmaps.push(img);
        }
        this.elemsTipBitmaps.forEach((bitmap, _) => this.elemsTip.addChild(bitmap));
    }
}
