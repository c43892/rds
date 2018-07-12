// 大地图选项事件视图
class WorldMapEventSelsView extends egret.DisplayObjectContainer {    
    public player:Player;
    private bg:egret.Bitmap; // 背景
    private title:egret.TextField;
    private desc:egret.TextField;

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.touchEnabled = true;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.addChild(this.bg);
        this.bg.width = this.width;
        this.bg.height = this.height;

        this.title = ViewUtils.createTextField(50, 0x000000);
        this.title.width = this.width;
        this.title.y = 50;
        this.addChild(this.title);

        this.desc = ViewUtils.createTextField(25, 0x000000);
        this.desc.width = this.width;
        this.desc.height = 200;
        this.desc.y = 150;
        this.addChild(this.desc);
    }

    private sels:WMES[];
    private doClose;
    public async open(title:string, desc:string, sels:WMES[]):Promise<void> {
        this.sels = sels;
        this.title.text = title;
        this.desc.text = desc;
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
            btn.text = sel.desc;
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
