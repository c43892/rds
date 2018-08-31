// 查看所有遗物界面
class AllElemsView extends egret.DisplayObjectContainer {
    private viewContent:egret.DisplayObjectContainer;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private title:egret.TextField;
    private scrollArea:egret.ScrollView;
    private closeBtn:TextButtonWithBg;

    public static showElemDesc;

    public constructor(w:number, h:number) {
        super();

        this.name = "allRelics";
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        // 标题
        this.title = ViewUtils.createTextField(45, 0x7d0403);
        this.title.name = "title";

        // 滚动窗口区域
        this.viewContent = new egret.DisplayObjectContainer(); // 这个是滚动区域内完整尺寸的显示区域
        this.scrollArea = new egret.ScrollView();
        this.scrollArea.name = "scrollArea";
        this.scrollArea.verticalScrollPolicy = "auto";
        this.scrollArea.horizontalScrollPolicy = "off";
        this.scrollArea.setContent(this.viewContent);
        this.scrollArea.bounces = false;

        this.closeBtn = new TextButtonWithBg("btnBg_png", 30);
        this.closeBtn.name = "closeBtn";
        this.closeBtn.touchEnabled = true;
        this.closeBtn.onClicked = () => this.doClose();

        var objs = [this.bg1, this.title, this.scrollArea, this.closeBtn]
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    doClose;
    public async open(elems) {
        this.refresh(elems);
        return new Promise<void>((resolve, reject) => {
            this.doClose = resolve;
        });
    }

    readonly ColNum = 4; // 每一行 4 个
    readonly GridSize = 84; // 图标大小

    refresh(elems:Elem[]) {
        this.viewContent.removeChildren();

        // 根据传进来的elems类型确定标题内容
        if(elems[0] instanceof Relic)
            this.title.text = ViewUtils.getTipText("relics");
        else if(elems[0] instanceof Prop)
            this.title.text = ViewUtils.getTipText("props");

        // 根据宽度和每行数量自动计算平均的间隔大小，横竖间隔保持相同
        var space = (this.scrollArea.width - (this.ColNum * this.GridSize)) / (this.ColNum + 1);
        var x = space;
        var y = space;

        for (var i = 0; i < elems.length; i++) {
            var e = elems[i];

            var g = ViewUtils.createBitmapByName(e.getElemImgRes() + "_png");
            g.x = x;
            g.y = y;
            g.width = g.height = this.GridSize;
            this.viewContent.addChild(g);
            g["elem"] = e;
            g.touchEnabled = true;
            g.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTapRelic, this);

            // 等级星星
            if(e instanceof Relic) {
                var r = e;
                var stars = ViewUtils.createRelicLevelStars(r, g);
                stars.forEach((star, _) => this.viewContent.addChild(star));
            }

            x += this.GridSize + space;
            if (x >= this.scrollArea.width) {
                x = space;
                y += this.GridSize + space;
            }
        }

        this.viewContent.height = y + space;

        // 初始化滚动条位置
        this.scrollArea.scrollTop = 0;
    }

    async onTapRelic(evt:egret.TouchEvent) {
        var e:Elem = evt.target["elem"];
        await AllElemsView.showElemDesc(e);
    }
}
