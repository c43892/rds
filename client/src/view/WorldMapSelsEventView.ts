// 大地图选项事件视图
class WorldMapEventSelsView extends egret.DisplayObjectContainer {    
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

    private sels:WMES[];
    private doClose;
    public async open(sels:WMES[]):Promise<void> {
        this.sels = sels;
        this.refresh();
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    private btnChoices:egret.TextField[] = [];
    refresh() {
        for (var btn of this.btnChoices)
            this.removeChild(btn);

        var h = 50;
        this.btnChoices = [];
        for (var sel of this.sels) {
            var btn = new egret.TextField();
            btn.width = this.width;
            btn.size = 30;
            btn.height = h;
            btn.text = sel.getDesc();
            btn.textAlign = egret.HorizontalAlign.CENTER;
            btn.verticalAlign = egret.VerticalAlign.MIDDLE;
            btn["sel"] = sel;
            var valid = sel.valid();
            btn.textColor = valid ? 0x0000ff : 0x888888;
            btn.touchEnabled = valid;
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
        var sel:WMES = evt.target["sel"];
        await sel.exec();
        if (sel.exit())
            this.doClose();
        else
            this.refresh();
    }
}
