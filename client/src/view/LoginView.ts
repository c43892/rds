// 登录界面
class LoginView extends egret.DisplayObjectContainer {
    public player:Player;

    bg:egret.Bitmap;
    title:egret.TextField;
    btnContinue:TextButtonWithBg;
    btnNewPlay:TextButtonWithBg;
    btnOpenRank:TextButtonWithBg;

    public constructor(w:number, h:number) {
        super();

        this.name = "login";
        this.width = w;
        this.height = h;

        // 背景
        this.bg = ViewUtils.createBitmapByName("loginBackground_png"); 
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);
        this.bg.name = "bg";

        // 标题
        this.title = ViewUtils.createTextField(100, 0x0000ff);
        this.title.text = "Zombie Mine";
        this.title.width = this.width;
        this.title.name = "title";
        this.addChild(this.title);

        // 继续游戏按钮
        this.btnContinue = ViewUtils.createImageBtn(50, 0x000000);
        this.btnContinue.touchEnabled = true;
        this.btnContinue.text = "Continue Play ...";
        this.btnContinue.name = "continueBtn";
        this.addChild(this.btnContinue);

        // 开始新游戏按钮
        this.btnNewPlay = ViewUtils.createImageBtn(50, 0x000000);
        this.btnNewPlay.x = this.btnContinue.x;
        this.btnNewPlay.y = this.btnContinue.y + this.btnNewPlay.height + 100;
        this.btnNewPlay.touchEnabled = true;
        this.btnNewPlay.text = "New Play";
        this.btnNewPlay.name = "newPlayBtn";
        this.addChild(this.btnNewPlay);

        // 排行榜按钮
        this.btnOpenRank = ViewUtils.createImageBtn(30, 0x000000);
        this.btnOpenRank.touchEnabled = true;
        this.btnOpenRank.text = "Rank";
        this.btnOpenRank.name = "rankBtn";
        this.btnOpenRank.x = (this.width - this.btnOpenRank.width) / 2;
        this.addChild(this.btnOpenRank);

        this.btnContinue.onClicked = () => this.onClose("continuePlay");
        this.btnNewPlay.onClicked = () => this.onClose("newPlay");
        this.btnOpenRank.onClicked = () => this.onClose("openRank");

        ViewUtils.multiLang(this, this.title, this.btnContinue, this.btnNewPlay, this.btnOpenRank);
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
}
