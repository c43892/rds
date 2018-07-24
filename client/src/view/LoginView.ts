// 登录界面
class LoginView extends egret.DisplayObjectContainer {
    public player:Player;

    bg:egret.Bitmap;
    title:egret.TextField;
    btnContinue:egret.Bitmap;
    btnNewPlay:egret.Bitmap;
    btnOpenRank:egret.TextField;

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;

        // 背景
        this.bg = ViewUtils.createBitmapByName("loginBackground_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        // 标题
        this.title = ViewUtils.createTextField(100, 0x0000ff);
        this.title.text = "僵尸扫雷";
        this.title.x = 0;
        this.title.y = 0;
        this.title.width = this.width;
        this.addChild(this.title);
        this.title.y = 150;

        // 继续游戏按钮
        this.btnContinue = ViewUtils.createBitmapByName("continuePlay_png");        
        this.btnContinue.touchEnabled = true;
        this.btnContinue.name = "continuePlay";
        this.addChild(this.btnContinue);
        this.btnContinue.width = 300;
        this.btnContinue.height = 100;
        this.btnContinue.x = (this.width - this.btnContinue.width) / 2;
        this.btnContinue.y = this.height - 500;

        // 开始新游戏按钮
        this.btnNewPlay = ViewUtils.createBitmapByName("newPlay_png");
        this.btnNewPlay.x = this.btnContinue.x;
        this.btnNewPlay.y = this.btnContinue.y + this.btnNewPlay.height + 100;
        this.btnNewPlay.touchEnabled = true;
        this.btnNewPlay.name = "newPlay";
        this.addChild(this.btnNewPlay);
        this.btnNewPlay.width = 300;
        this.btnNewPlay.height = 100;
        this.btnNewPlay.x = (this.width - this.btnNewPlay.width) / 2;
        this.btnNewPlay.y = this.height - 350;

        // 排行榜按钮
        this.btnOpenRank = ViewUtils.createTextField(30, 0x000000);
        this.btnOpenRank.x = this.btnNewPlay.x;
        this.btnOpenRank.y = this.btnNewPlay.y + this.btnOpenRank.height + 100;
        this.btnOpenRank.touchEnabled = true;
        this.btnOpenRank.name = "newPlay";
        this.btnOpenRank.text = "排行榜 >>>";
        this.addChild(this.btnOpenRank);
        this.btnOpenRank.x = (this.width - this.btnOpenRank.width) / 2;
        this.btnOpenRank.y = this.height - 200;

        this.btnContinue.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onContinuePlay, this);
        this.btnNewPlay.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onNewPlay, this);
        this.btnOpenRank.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onOpenRank, this);
    }

    public onClose;
    public open() {
        this.btnNewPlay.touchEnabled = true;
        if (!this.player) {
            this.btnContinue.touchEnabled = false;
            ViewUtils.makeGray(this.btnContinue);
        } else {
            this.btnContinue.touchEnabled = true;
            ViewUtils.makeGray(this.btnContinue, false);
        }
    }

    onContinuePlay(evt:egret.TouchEvent) {
        this.onClose("continuePlay");
    }

    onNewPlay(evt:egret.TouchEvent) {
        this.onClose("newPlay");
    }

    onOpenRank(evt:egret.TouchEvent) {
        this.onClose("openRank");
    }
}
