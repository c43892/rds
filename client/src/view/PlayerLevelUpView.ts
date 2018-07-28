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

    private doSel;
    public async open(choices):Promise<string> {
        this.choices = choices;
        this.refresh();
        return new Promise<string>((resolve, reject) => {
            this.doSel = async (r) => {
                resolve(r);
            };
        });
    }

    private btnChoices:egret.TextField[] = [];
    refresh() {
        for (var btn of this.btnChoices)
            this.removeChild(btn);

        var h = 50;
        this.btnChoices = [];
        for (var c of this.choices) {
            var btn = new egret.TextField();
            btn = ViewUtils.createTextField(40, 0x000000, true, true);
            btn.width = this.width;
            btn.height = h;
            btn.text = GCfg.getElemAttrsCfg(c).name;
            btn["choice"] = c;
            btn.touchEnabled = true;
            btn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onSel, this);

            this.addChild(btn);
            this.btnChoices.push(btn);
        }

        var ySpace = h * 0.5;
        var y = (this.height - (h * this.btnChoices.length + (this.btnChoices.length - 1) * ySpace)) / 2;
        for (var btn of this.btnChoices) {
            btn.x = 0;            
            btn.y = y;
            y += (h + ySpace);
        }
    }

    async onSel(evt:egret.TouchEvent) {
        var relicType = evt.target["choice"];
        await this.doSel(relicType);
    }
}
