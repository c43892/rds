// 大地图顶部部分
class WorldMapTopView extends egret.DisplayObjectContainer {
    topBar:egret.Bitmap;
    btnSetting:TextButtonWithBg; // 设置按钮
    coins:egret.Bitmap; // 金币图标
    numCoins:egret.TextField; // 金币数量
    hpTitle:egret.Bitmap; // 血量图标
    hp:egret.TextField; // 血量

    public openSettingView;
    public player:Player;

    public getMoneyText():egret.TextField {
        return this.numCoins;
    }

    public refreshMoney() {
        this.numCoins.text = this.player.money.toString();
    }

    public refreshHp() {
        this.hp.text = this.player.hp.toString() + "/" + this.player.maxHp.toString();
    }

    public refresh() {
        this.refreshMoney();
        this.refreshHp();
    }

    public constructor(w, h) {
        super();
        this.width = w;
        this.height = h;
        this.name = "worldmapTopView";

        this.topBar = ViewUtils.createBitmapByName("topBar_png");
        this.topBar.name = "topBar";
        this.topBar.scale9Grid = new egret.Rectangle(25, 10, this.topBar.width - 50, this.topBar.height - 20);
        this.btnSetting = new TextButtonWithBg("BtnSetting_png");
        this.btnSetting.name = "btnSetting";
        this.btnSetting.onClicked = () => this.openSettingView();
        this.coins = ViewUtils.createBitmapByName("Coins_png");
        this.coins.name = "coins";
        this.numCoins = ViewUtils.createTextField(33, 0xffffff, false, false);
        this.numCoins.name = "numCoins";
        this.hpTitle = ViewUtils.createBitmapByName("hpTitle_png");
        this.hpTitle.name = "hpTitle";
        this.hp = ViewUtils.createTextField(33, 0xffffff, false, false);
        this.hp.name = "hp";

        var objs = [this.topBar, this.btnSetting, this.coins, this.numCoins, this.hpTitle, this.hp];
        objs.forEach((obj, _) => {
            this.addChild(obj);
        });
        ViewUtils.multiLang(this, ...objs);
        this.topBar.width = this.width;
    }
}