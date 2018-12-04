// 玩家起名界面
class NameView extends egret.DisplayObjectContainer {
    public player:Player;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private keyInName:egret.TextField;
    private randomBtn:egret.Bitmap;
    private goOnBtn:ArrowButton;
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

        this.keyInName = new egret.TextField();
        this.keyInName.name = "keyInName";
        this.keyInName.touchEnabled = true;
        this.keyInName.type = egret.TextFieldType.INPUT;
        this.keyInName.size = 40;
        this.keyInName.textAlign = egret.HorizontalAlign.CENTER;
        this.keyInName.text = "点击输入名字"
        this.keyInName.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt) => this.clearDefaultName(), this);

        this.randomBtn = ViewUtils.createBitmapByName("randomNameBtn_png");
        this.randomBtn.name = "randomBtn";
        this.randomBtn.touchEnabled = true;
        this.randomBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt) => this.getRandomName(), this);

        this.goOnBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.onClicked = () => this.onGoOn();

        var objs = [this.bg, this.bg1, this.keyInName, this.randomBtn, this.goOnBtn];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    public open() {
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
        var middle = nameCfg.middle[rd.nextInt(0, nameCfg.middle.length)];
        var last = nameCfg.last[rd.nextInt(0, nameCfg.last.length)];
        this.keyInName.text = first + middle + last;
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
        Utils.saveLocalData("playerName", this.keyInName.text);
    }
}