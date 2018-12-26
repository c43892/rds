// 关卡难度详细界面
class LevelDiffDescView extends egret.DisplayObjectContainer {

    descArr:egret.TextField[]; // 等级描述
    bbg:egret.Bitmap; // 半透明区域背景，点击关闭
    bg:egret.Bitmap; // 底图
    btnLeft:TextButtonWithBg; // 向左箭头
    btnRight:TextButtonWithBg; // 向左箭头

    public constructor(w, h) {
        super();
        this.width = w;
        this.height = h;

        // 半透明背景
        this.bbg = ViewUtils.createBitmapByName("black_png");
        this.bbg.alpha = 0.75;
        this.bbg.width = this.width;
        this.bbg.height = this.height;
        this.bbg.x = this.bbg.y = 0;
        this.bbg.touchEnabled = true;
        this.bbg.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.close(), this);
        this.addChild(this.bbg);

        // 底图
        this.bg = ViewUtils.createBitmapByName("confirmBg_png");
        this.bg.x = (this.width - this.bg.width) / 2;
        this.bg.y = (this.height - this.bg.height) / 2;
        this.addChild(this.bg);
        
        // 五个等级的描述
        var descTxt = ViewUtils.getTipText("levelDifficultyDesc");
        this.descArr = [];
        for (var i = 0; i < 5; i++) {
            var desc = new egret.TextField();
            desc.width = this.bg.width;
            desc.height = this.bg.height;
            desc.y = this.bg.y;
            desc.x = this.bg.x + this.bg.width * i;
            desc.textAlign = egret.HorizontalAlign.CENTER;
            desc.textFlow = ViewUtils.fromHtml(descTxt[i]);

            var bgMask = ViewUtils.createBitmapByName("confirmBgMask_png");
            bgMask.x = this.bg.x;
            bgMask.y = this.bg.y;
            desc.mask = bgMask;
            this.addChild(bgMask);

            this.descArr.push(desc);
            this.addChild(desc);
        }

        // 左右按钮
        this.btnLeft = new TextButtonWithBg("pageUpBtn_png");
        this.btnLeft.bg.scaleX = -2;
        this.btnLeft.bg.scaleY = 2;
        this.btnLeft.bg.anchorOffsetX = this.btnLeft.bg.width / 2;
        this.btnLeft.x = 75;
        this.btnLeft.enabled = true;
        
        this.btnRight = new TextButtonWithBg("pageUpBtn_png");
        this.btnRight.bg.scaleX = 2;
        this.btnRight.bg.scaleY = 2;
        this.btnRight.bg.anchorOffsetX = this.btnRight.bg.width / 2;
        this.btnRight.x = this.width - 75;
        this.btnRight.enabled = true;

        this.btnLeft.y = this.btnRight.y = this.height / 2;

        this.addChild(this.btnLeft);
        this.addChild(this.btnRight);
        this.btnLeft.onClicked = () => this.moveDesc(this.currentN - 1, 500);
        this.btnRight.onClicked = () => this.moveDesc(this.currentN + 1, 500);
    }

    currentN;
    moveDesc(n, time) {
        n = n < 0 ? 0 : (n >= this.descArr.length ? this.descArr.length - 1 : n);
        if (this.currentN == n)
            return;

        this.currentN = n;
        var dPosX = this.bg.width * n;
        for (var i = 0; i < this.descArr.length; i++) {
            var desc = this.descArr[i];
            egret.Tween.removeTweens(desc);
            var posX = this.bg.x + this.bg.width * i - dPosX;
            egret.Tween.get(desc).to({x:posX}, time, egret.Ease.cubicInOut);
        }
    }

    doClose;
    public async open(n) {
        this.moveDesc(n, 1);
        return new Promise((r, _) => {
            this.doClose = r;
        });
    }

    close() {
        this.doClose();
    }
}