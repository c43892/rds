// 玩家起名界面
class NameView extends egret.DisplayObjectContainer {
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private keyInName:egret.TextField;
    private randomBtn:egret.Bitmap;
    private goOnBtn:ArrowButton;
    private tip:egret.TextField;

    constructor(w, h) {
        super();
        
        this.width = w;
        this.height = h;
        this.name = "nameView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.bg.name = "bg";

        this.bg1 = ViewUtils.createBitmapByName("nameViewBg_png");
        this.bg1.name = "bg1";

        this.tip = new egret.TextField();
        this.tip.name = "tip";
        this.tip.text = ViewUtils.getTipText("keyInNewName");
        this.tip.textColor = 0x4a3728;
        this.tip.textAlign = egret.HorizontalAlign.CENTER;

        this.keyInName = new egret.TextField();
        this.keyInName.name = "keyInName";
        this.keyInName.touchEnabled = true;
        this.keyInName.type = egret.TextFieldType.INPUT;
        this.keyInName.textAlign = egret.HorizontalAlign.CENTER;
        this.keyInName.textColor = 0x4a3728;
        // this.keyInName.text = "点击输入名字"
        // this.keyInName.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt) => this.clearDefaultName(), this);

        this.randomBtn = ViewUtils.createBitmapByName("randomNameBtn_png");
        this.randomBtn.name = "randomBtn";
        this.randomBtn.touchEnabled = true;
        this.randomBtn.anchorOffsetX = this.randomBtn.width / 2;
        this.randomBtn.anchorOffsetY = this.randomBtn.height / 2;
        this.randomBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt) => this.getRandomName(), this);

        this.goOnBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.onClicked = () => this.onGoOn();

        var objs = [this.bg, this.bg1, this.tip, this.keyInName, this.randomBtn, this.goOnBtn];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    public async open() {
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    // 清空姓名框内的默认显示内容
    clearDefaultName() {
        if(this.keyInName.text == "点击输入名字")
            this.keyInName.text = "";
    }

    // 获取一个随机的名字
    getRandomName() {
        var nameCfg = GCfg.getRandomNameCfg();
        var rd = new SRandom();
        var first = nameCfg.first[rd.nextInt(0, nameCfg.first.length)];
        var last = nameCfg.last[rd.nextInt(0, nameCfg.last.length)];
        this.keyInName.text = first + last;
        egret.Tween.removeTweens(this.randomBtn);
        this.randomBtn.alpha = 1;
        this.scaleX = 1;
        this.scaleY = 1;
        egret.Tween.get(this.randomBtn)
            .to({alpha:3, scaleX:1.1, scaleY:1.1}, 250, egret.Ease.cubicIn)
            .to({alpha:1, scaleX:1, scaleY:1}, 250, egret.Ease.cubicOut);
    }

    // 点击继续按钮时检查起名
    async onGoOn() {
        var r = this.checkName();
        switch(r){
            case "needName":{
                await AniUtils.tipAt(ViewUtils.getTipText("needName"), {x:this.width/2, y:this.height/2});
                break;
            }
            case "tooLongName":{
                await AniUtils.tipAt(ViewUtils.getTipText("tooLongName"), {x:this.width/2, y:this.height/2});
                break;
            }
            case "inValidName":{
                await AniUtils.tipAt(ViewUtils.getTipText("inValidName"), {x:this.width/2, y:this.height/2});
                break;
            }
            case "validName":{
                this.saveName();
                this.doClose();
                break;
            }
        }
    }

    doClose;

    checkName() {
        var name = this.keyInName.text;
        if (name.length == 0 || name == "点击输入名字")
            return "needName";
        else if (name.length > 7)
            return "tooLongName";
        else if (!Utils.checkValidName(name))
            return "inValidName";
        else return "validName";
    }

    saveName() {
        var name = this.keyInName.text;
        Utils.saveCloudData("playerName", name);
        Utils.saveLocalData("playerName", name);
    }
}