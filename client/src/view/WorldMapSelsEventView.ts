// 大地图选项事件视图
class WorldMapEventSelsView extends egret.DisplayObjectContainer {    
    public player:Player;
    private bg:egret.Bitmap; // 背景
    private bg1:egret.Bitmap; // 底图
    private bg2:egret.Bitmap; // 底图问号
    private title:egret.TextField;
    private desc:egret.TextField;

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.name = "worldmapSelsEvent";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.addChild(this.bg);
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.bg2 = ViewUtils.createBitmapByName("SelEventBg_png");
        this.bg2.name = "bg2";

        this.title = ViewUtils.createTextField(40, 0x7d0403);
        this.title.name = "title";

        this.desc = ViewUtils.createTextField(25, 0x000000);
        this.desc.name = "desc";

        var objs = [this.bg1, this.bg2, this.title, this.desc];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    private sels:WMES[];
    private doClose;
    public async open(title:string, desc:string, sels:WMES[]):Promise<void> {
        this.sels = sels;
        this.title.textFlow = ViewUtils.fromHtml(title);
        this.desc.textFlow = ViewUtils.fromHtml(desc);
        this.desc.textAlign = egret.HorizontalAlign.LEFT;
        this.refresh();
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    private btnChoices:TextButtonWithBg[] = [];
    refresh() {
        for (var btn of this.btnChoices)
            this.removeChild(btn);

        this.btnChoices = [];
        this.sels.forEach((sel, i) => {
            var btn = new TextButtonWithBg("btnBg_png", 25);
            btn.textFieldOffset = {l:40, r:-20};
            btn.name = "sel" + i;
            btn.textField.textAlign = egret.HorizontalAlign.LEFT;
            btn.textFlow = ViewUtils.fromHtml(sel.desc);
            btn["sel"] = sel;
            btn.enabled = sel.valid();
            btn.onClicked = async () => await this.onSel(btn);
            this.addChild(btn);
            this.btnChoices.push(btn);
        });

        ViewUtils.multiLang(this, ...this.btnChoices);

        var lastBtn = this.btnChoices[this.btnChoices.length - 1];
        this.bg1.height = lastBtn.y + lastBtn.height + 100 - this.bg1.y;
    }

    static lastSelectionGlobalPos;
    async onSel(btn:TextButtonWithBg) {
        var sel:WMES = btn["sel"];
        WorldMapEventSelsView.lastSelectionGlobalPos = AniUtils.ani2global(btn);
        WorldMapEventSelsView.lastSelectionGlobalPos.x += btn.width / 2;
        WorldMapEventSelsView.lastSelectionGlobalPos.y += btn.height / 2;
        await sel.exec();
        if (sel.exit())
            this.doClose();
        else
            this.refresh();
    }
}
