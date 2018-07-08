// 角色升级视图
class PlayerLevelUpView extends egret.DisplayObjectContainer {    
    public player:Player;
    private bg:egret.Bitmap; // 背景

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.touchEnabled = true;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.addChild(this.bg);
        this.bg.width = this.width;
        this.bg.height = this.height;
    }

    private choices = [];

    private doClose;
    public async open(dropCfg):Promise<void> {
        this.choices = Utils.randomSelectByWeightWithPlayerFilter(this.player, dropCfg, this.player.playerRandom, 1, 4);
        this.refresh();
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    private btnChoices:egret.TextField[] = [];
    refresh() {
        for (var btn of this.btnChoices)
            this.removeChild(btn);

        this.btnChoices = [];
        for (var c of this.choices) {
            var btn = new egret.TextField();
            btn.x = (this.width - btn.x) / 2;
            this.btnChoices.push(btn);
            btn.text = GCfg.getElemAttrsCfg(c).displayName;
            btn.textAlign = egret.HorizontalAlign.CENTER;
            btn.verticalAlign = egret.VerticalAlign.MIDDLE;
            btn["choice"] = c;
            btn.touchEnabled = true;
            btn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onSel, this);
            this.addChild(btn);
        }

        var h = this.btnChoices[0].height
        var ySpace = h * 0.5;
        var y = (h * this.btnChoices.length + (h - 1) * ySpace) / 2;
        for (var btn of this.btnChoices) {
            btn.y = y;
            y += h + ySpace;
        }
    }

    onSel(evt:egret.TouchEvent) {
        Utils.log(evt.target["choice"]);
        this.doClose();
    }
}
