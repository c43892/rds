// 查看所有遗物界面
class AllElemsView extends egret.DisplayObjectContainer {
    public player:Player;
    private viewContent:egret.DisplayObjectContainer;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private title:egret.TextField;
    private scrollArea:egret.ScrollView;
    private closeBtn:TextButtonWithBg;
    private funcOnClinked; // 点击的操作,默认为显示点击对象的详情
    private tip;

    public showElemDesc;
    public openCompareRelicView;

    public constructor(w:number, h:number) {
        super();

        this.name = "allElems";
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
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
        this.scrollArea.bounces = true;

        this.closeBtn = new TextButtonWithBg("goBack_png", 30);
        this.closeBtn.name = "closeBtn";
        this.closeBtn.touchEnabled = true;
        this.closeBtn.onClicked = () => this.onGoBack();

        var objs = [this.bg1, this.title, this.scrollArea, this.closeBtn]
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
        this.viewContent.width = this.scrollArea.width;
    }

    doClose;
    public async open(elems:Elem[], funcOnClinked = undefined, title:string = undefined, tip:string = undefined) {
        this.funcOnClinked = funcOnClinked;
        this.tip = tip;

        if (elems.length > 0) {
            if (elems[0] instanceof Relic)
                this.refreshRelics(elems, title);
            else
                this.refreshProps(elems, title);
        }

        return new Promise<number>((resolve, reject) => {
            this.doClose = resolve;
        });
    }

    showRelicsEquippedOrInBag = true; // true: equipped, false: inBag
    refreshRelics(elems:Elem[], title:string) {
        var rs = Utils.filter(elems, (r:Relic) => 
            Utils.contains(this.player.relicsEquipped, r) == this.showRelicsEquippedOrInBag);

        this.refresh(rs, title);
    }

    refreshProps(elems:Elem[], title:string) {
        this.refresh(elems, title);
    }

    readonly ColNum = 4; // 每一行 4 个
    readonly GridSize = 84; // 图标大小
    readonly GridCount = 48;

    refresh(elems:Elem[], title:string = undefined) {
        this.viewContent.removeChildren();

        // 如果没有传入标题则根据传进来的elems类型确定标题内容
        if (!title){
            if(elems[0] instanceof Relic)
                this.title.text = ViewUtils.getTipText("relics");
            else if(elems[0] instanceof Prop)
                this.title.text = ViewUtils.getTipText("props");
            }
        else
            this.title.text = title;

        // 根据宽度和每行数量自动计算平均的间隔大小
        var space = (this.scrollArea.width - (this.ColNum * this.GridSize)) / (this.ColNum + 1);
        var x = space;
        var y = space - 25;

        for (var i = 0; i < this.GridCount; i++) {
            if(i < elems.length){
                var e = elems[i];
                let g = new TextButtonWithBg(e.getElemImgRes() + "_png");
                g.x = x;
                g.y = y;
                g.width = g.height = this.GridSize;
                this.viewContent.addChild(g);
                g["elem"] = e;
                g.onClicked = () => this.onClickedElem(g);

                // 等级星星
                if(e instanceof Relic) {
                    var r = e;
                    var stars = ViewUtils.createRelicLevelStars(r, g);
                    stars.forEach((star, _) => this.viewContent.addChild(star));
                }
            }
            // 超过的部分填满空洞底盘
            else{
                let g = ViewUtils.createBitmapByName("aevNoElem_png")
                g.x = x;
                g.y = y;
                g.width = g.height = this.GridSize;
                this.viewContent.addChild(g);
            }

            x += this.GridSize + space;
            if (x >= this.scrollArea.width) {
                x = space;
                y += this.GridSize + space;
            }
        }

        this.viewContent.height = y + space;

        // 增加一个看不见的底图为了覆盖整个滚动区域响应事件
        var bgx = new egret.Bitmap();
        bgx.width = this.viewContent.width;
        bgx.height = this.viewContent.height;
        this.viewContent.addChild(bgx);
        this.viewContent.setChildIndex(bgx, 0);

        // 初始化滚动条位置
        this.scrollArea.scrollTop = 0;
    }


    async onClickedElem(g){
        var e:Elem = g["elem"];
        switch(this.funcOnClinked){
            case "selRelic":{
                var n = Utils.indexOf(this.player.relicsEquipped, (r:Relic) => r.type == g["elem"].type);
                var r = <Relic>ElemFactory.create(e.type);
                var yesno = await this.openCompareRelicView(this.player, r, undefined, false);
                if(yesno)
                    this.doClose(n);
                else
                    this.doClose(-1);
                break;
            }
            default:
                await this.showElemDesc(e);
        }
    }

    onGoBack(){
        this.doClose(-2);
    }
}
