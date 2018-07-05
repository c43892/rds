// 遗物选择视图
class RelicSelView extends egret.DisplayObjectContainer {
    public player:Player;
    public confirmYesNo;

    private viewContent:egret.DisplayObjectContainer;
    private bg:egret.Bitmap;
    private selArea:egret.ScrollView;
    private relicGrids:egret.Bitmap[] = [];
    private btnCancel:egret.Bitmap;
    private title:egret.TextField;

    static readonly GridColNum = 5; // 一行五个

    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;

        this.title = new egret.TextField();
        this.title.x = this.title.y = 0;
        this.title.size = 50;
        this.title.textColor = 0x000000;
        this.addChild(this.title);
        this.title.textAlign = egret.HorizontalAlign.CENTER;
        this.title.verticalAlign = egret.VerticalAlign.MIDDLE;

        this.viewContent = new egret.DisplayObjectContainer();
        this.viewContent.x = this.viewContent.y = 0;
        this.viewContent.addChild(this.bg);

        this.selArea = new egret.ScrollView();
        this.selArea.x = 0;
        this.selArea.y = 100;
        this.selArea.width = this.width;
        this.selArea.height = this.height - 200;
        this.selArea.verticalScrollPolicy = "auto";
        this.selArea.horizontalScrollPolicy = "off";
        this.selArea.setContent(this.viewContent);
        this.selArea.bounces = false;        
        this.addChild(this.selArea);

        this.btnCancel = ViewUtils.createBitmapByName("goBack_png");
        this.btnCancel.x = 0;
        this.btnCancel.y = this.height - this.btnCancel.height;
        this.addChild(this.btnCancel);
        this.btnCancel.touchEnabled = true;
        this.btnCancel.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCancel, this);

        this.selArea.scrollTop = 0;

        this.touchEnabled = false;
        this.selArea.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
    }

    private doSel;
    private relics:Elem[];
    public async open(title:string, f) {
        this.title.text = title;
        this.relics = f ? this.player.relics : Utils.filter(this.player.relics, f);
        this.refresh();
        return new Promise<number>((resolve, reject) => {
            this.doSel = resolve;
        });
    }

    public refresh() {
        for (var gd of this.relicGrids)
            this.viewContent.removeChild(gd);
        this.relicGrids = [];

        this.viewContent.width = this.selArea.width;
        var gdSize = 64;
        var space = (this.viewContent.width - gdSize * RelicSelView.GridColNum) / (RelicSelView.GridColNum + 1)
        for (var i = 0; i < this.relics.length; i++) {
            var r = this.relics[i];
            var gd = ViewUtils.createBitmapByName(r.getElemImgRes() + "_png");
            gd.x = (i % RelicSelView.GridColNum) * (gdSize + space) + space;
            gd.y = Math.floor(i / RelicSelView.GridColNum) * (gdSize + space) + space;
            gd.width = gd.height = gdSize;
            gd["relicIndex"] = i;
            this.viewContent.addChild(gd);
            this.relicGrids.push(gd);
            gd.touchEnabled = true;
        }

        this.viewContent.height = Math.floor(this.relics.length / RelicSelView.GridColNum + 1) * (gdSize + space) + space;
    }

    async onTouchGrid(evt:egret.TouchEvent) {
        var gd = evt.target;
        if (!Utils.contains(this.relicGrids, gd))
            return;

        var n = gd["relicIndex"];
        this.doSel(n);
    }

    onCancel(evt:egret.TouchEvent) {
        this.doSel(-1);
    }
}
