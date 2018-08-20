// 查看所有遗物界面
class AllRelicsView extends egret.DisplayObjectContainer {
    private viewContent:egret.DisplayObjectContainer;
    private bg:egret.Bitmap;
    private scrollArea:egret.ScrollView;
    private scrollAreaBg:egret.Bitmap;
    private closeBtn:TextButtonWithBg;

    public static showElemDesc;

    public constructor(w:number, h:number) {
        super();
        this.name = "allRelics";

        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.name = "bg";
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.viewContent = new egret.DisplayObjectContainer();
        this.viewContent.x = 0;
        this.viewContent.y = 0;
        this.viewContent.width = w;
        this.viewContent.height = h;

        this.scrollArea = new egret.ScrollView();
        this.scrollArea.name = "scrollArea";
        this.scrollArea.verticalScrollPolicy = "auto";
        this.scrollArea.horizontalScrollPolicy = "off";
        this.scrollArea.setContent(this.viewContent);
        this.scrollArea.bounces = false;        
        this.addChild(this.scrollArea);

        this.scrollAreaBg = ViewUtils.createBitmapByName("black_png");
        this.scrollAreaBg.name = "scrollBg";
        this.scrollAreaBg.fillMode = egret.BitmapFillMode.REPEAT;
        this.viewContent.addChild(this.scrollAreaBg);

        this.closeBtn = new TextButtonWithBg(30, 0x000000, "btnBg_png");
        this.closeBtn.name = "closeBtn";
        this.closeBtn.refresh();
        this.closeBtn.touchEnabled = true;
        this.closeBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt:egret.TouchEvent) => this.doClose(), this);
        this.addChild(this.closeBtn);
        
        this.scrollArea.scrollTop = 0;

        ViewUtils.multiLang(this, this.scrollArea, this.closeBtn, this.scrollAreaBg);
    }

    readonly ColNum = 5;
    readonly GridSize = 84;

    doClose;
    public async open(relics) {
        this.refresh(relics);
        return new Promise<void>((resolve, reject) => {
            this.doClose = resolve;
        });
    }

    refresh(relics:Relic[]) {
        this.viewContent.removeChildren();
        this.viewContent.addChild(this.scrollAreaBg);
        ViewUtils.multiLang(this, this.scrollArea, this.closeBtn, this.scrollAreaBg);        

        var space = (this.scrollArea.width - (this.ColNum * this.GridSize)) / (this.ColNum + 1);
        var x = space;
        var y = space;
        for (var i = 0; i < relics.length; i++) {
            var r = relics[i];

            var g = ViewUtils.createBitmapByName(r.getElemImgRes() + "_png");
            g.x = x;
            g.y = y;
            g.width = g.height = this.GridSize;
            this.viewContent.addChild(g);
            g["relic"] = r;
            g.touchEnabled = true;
            g.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTapRelic, this);
            
            var lv = ViewUtils.createTextField(15, 0xffffff);
            lv.textAlign = egret.HorizontalAlign.RIGHT;
            lv.verticalAlign = egret.VerticalAlign.BOTTOM;
            lv.x = g.x; lv.y = g.y; lv.width = g.width; lv.height = g.height;
            lv.text = "Lv" + r.reinforceLv;
            this.viewContent.addChild(lv);

            x += this.GridSize + space;
            if (x >= this.scrollArea.width) {
                x = space;
                y += this.GridSize + space;
            }
        }

        this.viewContent.height = y + space;
    }

    async onTapRelic(evt:egret.TouchEvent) {
        var r:Relic = evt.target["relic"];
        await AllRelicsView.showElemDesc(r);
    }
}
