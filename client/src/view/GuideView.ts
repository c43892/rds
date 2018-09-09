// 指引视图
class GuideView extends egret.DisplayObjectContainer {
    wmv:WorldMapView;
    bv:BattleView;

    bg:egret.Bitmap;
    public constructor(w, h, wmv, bv) {
        super();
        this.name = "guide";
        this.width = w;
        this.height = h;
        this.wmv = wmv;
        this.bv = bv;

        // 背景响应点击
        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickBg, this);

        this.buildDialog();
    }

    onBgClicked;
    onClickBg(evt:egret.TouchEvent) {
        if (this.onBgClicked) {
            this.onBgClicked();
            this.onBgClicked = undefined;
        }
    }

    // 基本功能单元

    // 剧情对话

    dlgFrame:egret.DisplayObjectContainer;
    buildDialog() {
        this.dlgFrame = new egret.DisplayObjectContainer();
        this.dlgFrame.name = "guideDlgFrame";
        this.dlgFrame.width = 500;
        this.dlgFrame.height = 400;

        var bg = ViewUtils.createBitmapByName("confirmBg_png");
        bg.name = "bg";

        var avatarImg1 = new egret.Bitmap();
        avatarImg1.name = "avatarImg1";
        avatarImg1.anchorOffsetX = avatarImg1.width / 2;
        var avatarName1 = ViewUtils.createTextField(30, 0xffffff);
        avatarName1.name = "avatarName1";
        avatarName1.textAlign = egret.HorizontalAlign.LEFT;
        avatarName1.verticalAlign = egret.VerticalAlign.MIDDLE;

        var avatarImg2 = new egret.Bitmap();
        avatarImg2.name = "avatarImg2";
        avatarImg2.anchorOffsetX = avatarImg2.width / 2;
        var avatarName2 = ViewUtils.createTextField(30, 0xffffff);
        avatarName2.name = "avatarName2";
        avatarName2.textAlign = egret.HorizontalAlign.RIGHT;
        avatarName2.verticalAlign = egret.VerticalAlign.MIDDLE;

        var content = ViewUtils.createTextField(30, 0xffffff);
        content.name = "content";
        content.textAlign = egret.HorizontalAlign.LEFT;
        content.verticalAlign = egret.VerticalAlign.MIDDLE;

        var objs = [bg, avatarImg1, avatarName1, avatarImg2, avatarName2, content];
        objs.forEach((obj, _) => this.dlgFrame.addChild(obj));
        ViewUtils.multiLang(this.dlgFrame, ...objs);
    }

    // 显示对话内容
    async showDialog(tex:string, name:string, str:string, x:number, y:number, onLeft:boolean = true, flipAvatar:boolean = false) {
        var avatarImg1 = <egret.Bitmap>this.dlgFrame.getChildByName("avatarImg1");
        var avatarName1 = <egret.TextField>this.dlgFrame.getChildByName("avatarName1");
        var avatarImg2 = <egret.Bitmap>this.dlgFrame.getChildByName("avatarImg2");
        var avatarName2 = <egret.TextField>this.dlgFrame.getChildByName("avatarName2");
        var content = <egret.TextField>this.dlgFrame.getChildByName("content");

        if (onLeft) {
            ViewUtils.setTexName(avatarImg1, tex);
            avatarName1.text = name;
            avatarImg1.alpha = 1;
            avatarImg1.scaleX = flipAvatar ? -1 : 1;
            avatarName1.alpha = 1;
            avatarImg2.alpha = 0;
            avatarName2.alpha = 0;
        } else {
            ViewUtils.setTexName(avatarImg2, tex);
            avatarName2.text = name;
            avatarImg2.alpha = 1;
            avatarImg2.scaleX = flipAvatar ? -1 : 1;
            avatarName2.alpha = 1;
            avatarImg1.alpha = 0;
            avatarName1.alpha = 0;
        }
        
        content.textFlow = ViewUtils.fromHtml(str);

        this.addChild(this.bg);
        this.addChild(this.dlgFrame);
        this.dlgFrame.x = x;
        this.dlgFrame.y = y;
        return new Promise<void>((r, _) => {
            this.onBgClicked = () => {
                this.removeChild(this.bg);
                this.removeChild(this.dlgFrame);
                r();
            };
        });
    }

    // 各种引导流程

    // 测试对话
    public async testDialog() {
        await this.showDialog("Nurse_png", "护士1", "我是一个护士", 0, 200, true);
        await this.showDialog("Nurse_png", "护士2", "我还是一个护士", 140, 500, false, true);
    }
}
