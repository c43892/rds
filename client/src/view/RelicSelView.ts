// 遗物选择视图
class RelicSelView extends egret.DisplayObjectContainer {
    public player:Player;
    public confirmOkYesNo;

    private viewContent:egret.DisplayObjectContainer;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private selArea:egret.ScrollView;
    private relicGrids:egret.Bitmap[] = [];
    private btnGoBack:TextButtonWithBg;
    private title:egret.TextField;

    static readonly GridColNum = 4; // 一行四个

    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;
        this.name = "relicSelView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";
        ViewUtils.multiLang(this, this.bg1);

        this.title = ViewUtils.createTextField(50, 0xff0000);
        this.title.name = "title";
        this.title.textAlign = egret.HorizontalAlign.CENTER;
        this.title.verticalAlign = egret.VerticalAlign.MIDDLE;

        this.viewContent = new egret.DisplayObjectContainer();
        this.viewContent.x = this.viewContent.y = 0;

        this.selArea = new egret.ScrollView();
        this.selArea.x = this.bg1.x + 75;
        this.selArea.y = this.bg1.y + 75;
        this.selArea.width = 460;
        this.selArea.height = 500;
        this.selArea.verticalScrollPolicy = "auto";
        this.selArea.horizontalScrollPolicy = "off";
        this.selArea.setContent(this.viewContent);
        this.selArea.bounces = false;

        this.btnGoBack = new TextButtonWithBg("goBack_png", 30);
        this.btnGoBack.text = ViewUtils.getTipText("goBackBtn");
        this.btnGoBack.x = 0;
        this.btnGoBack.y = this.height - this.btnGoBack.height;
        this.btnGoBack.onClicked = () => this.onCancel();

        this.selArea.scrollTop = 0;

        this.touchEnabled = false;
        this.selArea.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);

        var objs = [this.bg1, this.title, this.selArea, this.btnGoBack];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    private doSel;
    private relics:Elem[];
    public async open(title:string, f) {
        this.title.text = title;
        this.relics = Utils.filter(this.player.allRelics, f);
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

    onCancel() {
        this.doSel(-1);
    }
}
