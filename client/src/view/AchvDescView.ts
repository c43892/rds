class AchvDescView extends egret.DisplayObjectContainer {
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    // private icon:egret.Bitmap;
    private title:egret.TextField;
    private desc:egret.TextField;
    private progressTip:egret.TextField;
    private achvPoint:egret.TextField;

    private progressInfos:egret.TextField[] = [];
    private achv:Achievement;

    constructor (w, h){
        super();
        this.width = w;
        this.height = h;
        this.name = "achvDescView"

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onClickBg(), this);

        this.bg1 = ViewUtils.createBitmapByName("confirmBg_png");
        this.bg1.name = "bg1";
        this.bg1.touchEnabled = true;

        // this.icon = new egret.Bitmap();
        // this.icon.name = "icon";

        this.title = ViewUtils.createTextField(40, 0x000000);
        this.title.name = "title";
        this.title.textAlign = egret.HorizontalAlign.CENTER;

        this.desc = ViewUtils.createTextField(25, 0x000000);
        this.desc.name = "desc";
        this.desc.textAlign = egret.HorizontalAlign.LEFT;

        this.progressTip = ViewUtils.createTextField(25, 0x000000);
        this.progressTip.name = "progressTip";
        this.progressTip.text = "当前进度"
        this.progressTip.textAlign = egret.HorizontalAlign.CENTER;

        this.achvPoint = ViewUtils.createTextField(25, 0x000000);
        this.achvPoint.name = "achvPoint";
        this.achvPoint.textAlign = egret.HorizontalAlign.CENTER;

        var objs = [this.bg, this.bg1, this.title, this.desc, this.progressTip, this.achvPoint];
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));
    }

    public async open(achv:Achievement) {
        this.achv = achv;
        this.refresh();
        return new Promise((resolve, reject) => this.doClose = resolve);
    }

    doClose;

    refresh() {
        var cfg = GCfg.getAchvDescCfg(this.achv.type);

        var objs = [this.bg, this.bg1, this.title, this.desc, this.progressTip, this.achvPoint];
        ViewUtils.multiLang(this, ...objs);
        
        // ViewUtils.setTexName(this.icon, cfg.icon + "_png");

        this.title.text = cfg.title;
        this.desc.text = cfg.longDesc ? cfg.longDesc : cfg.shortDesc;
        this.achvPoint.text = "成就点: " + this.achv.cfg.achvPoint;

        this.createProgressInfo();
        this.move2Center();
    }

    createProgressInfo() {
        // var cfg = GCfg.getAchvDescCfg(this.achv.type);

        // this.progressInfos = [];
        // var progressInfos = Utils.map(cfg.progressInfos, (info) => ViewUtils.fromHtml(AchvDescView.replaceByProperties(info, this.achv)));       

        // var progressInfo0 = ViewUtils.createTextField(0, 0x000000);
        // progressInfo0.name = "progressInfo0";
        // progressInfo0.textFlow = progressInfos[0];
        // progressInfo0.textAlign = egret.HorizontalAlign.LEFT;
        // progressInfo0.lineSpacing = 8;
        // this.addChild(progressInfo0);
        // ViewUtils.multiLang(this, progressInfo0);
        // this.progressInfos.push(progressInfo0);

        // for (var i = 1; i < cfg.progressInfos.length; i++){

        // }
        this.progressTip.text = "当前进度 " + this.achv.finishedProgressInfo();
    }

    // 将面板整体在y方向上靠近居中位置显示
    move2Center() {
        var objs = [this.bg1, this.title, this.desc, this.progressTip, this.achvPoint, ...this.progressInfos];
        var md = (this.height - this.bg1.height) / 2 - 100 - this.bg.y;
        for (var obj of objs)
            obj.y += md;
    }

    onClickBg() {
        this.doClose();
    }

    // 用于替换进度信息内的动态内容
    static replaceByProperties(s:string, achv:Achievement):string {
        const r = /\{[a-z,A-Z,0-9,_,-]*\}/g;
        var ss = s;
        var m = r.exec(s);
        while (m) {
            var value = m[0];
            var key = value.substr(1, value.length - 2);
            
            if (achv[key] != undefined)
                ss = ss.replace(value, achv[key].toString());
            else if (achv.cfg[key] != undefined) 
                ss = ss.replace(value, achv.cfg[key].toString());            

            m = r.exec(s);
        }

        return ss;
    }
}