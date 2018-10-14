class SettingView extends egret.DisplayObjectContainer{
    public player:Player;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private title:egret.TextField;
    private volumeBtn:TextButtonWithBg;
    private relicsBtn:TextButtonWithBg;
    private propsBtn:TextButtonWithBg;
    private exitBtn:TextButtonWithBg;    
    private goBackBtn:TextButtonWithBg;
    private btnsBg:egret.DisplayObjectContainer
    public confirmOkYesNo;
    public openStartup;
    
    public openAllRelicsView; // 查看所有遗物
    public openAllPropsView; // 查看所有道具

    constructor(w:number, h:number){
        super();
        this.width = w;
        this.height = h;
        this.name = "settingView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.title = ViewUtils.createTextField(45, 0x7d0403);
        this.title.name = "title";

        this.volumeBtn = new TextButtonWithBg("stOn_png");        
        this.volumeBtn.name = "volumeBtn";
        this.volumeBtn["statue"] = "on";
        this.volumeBtn.onClicked = () => this.switchSound();
        

        this.relicsBtn = new TextButtonWithBg("stSkill_png");
        this.relicsBtn.name = "relicsBtn";
        this.relicsBtn.onClicked = () => this.openAllRelicsView();

        this.propsBtn = new TextButtonWithBg("stItem_png");
        this.propsBtn.name = "propsBtn";
        this.propsBtn.onClicked = () => this.openAllPropsView(this.player.props);

        this.exitBtn = new TextButtonWithBg("stExit_png");
        this.exitBtn.name = "exitBtn";
        this.exitBtn.onClicked = () => this.exitThisGame();

        this.goBackBtn = new TextButtonWithBg("goBack_png", 30);
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.onClicked =  () => this.doClose();        

        var objs = [this.bg1, this.title, this.volumeBtn, this.relicsBtn, this.propsBtn, this.exitBtn, this.goBackBtn];        
        ViewUtils.multiLang(this, ...objs);
        this.addChild(this.bg1);

        this.btnsBg = new egret.DisplayObjectContainer;
        for(var i = 0; i < 4; i++){
            var btnBg = ViewUtils.createBitmapByName("stBtnBg_png");
            btnBg.x = 107 + i * 114;
            btnBg.y = 388;
            this.btnsBg.addChild(btnBg);
        }
        this.addChild(this.btnsBg);

        objs = [this.title, this.volumeBtn, this.relicsBtn, this.propsBtn, this.exitBtn, this.goBackBtn]; 
        objs.forEach((obj, _) => this.addChild(obj));
    }

    public async open():Promise<void>{
        this.title.text = ViewUtils.getTipText("setting");
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    private doClose;
    
    switchSound(){
        if (this.volumeBtn["statue"] == "on"){
            this.volumeBtn["statue"] = "off";
            this.volumeBtn.setTexName("stOff_png");
        }
        else{
            this.volumeBtn["statue"] = "on";
            this.volumeBtn.setTexName("stOn_png");
        }
    }

    async exitThisGame(){
        var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureExitThisGame"));
        var ok = await this.confirmOkYesNo(undefined, content, true);
        if (ok){
            Utils.savePlayer(undefined);
            await this.openStartup();
        }
    }
}