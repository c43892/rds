// 医院视图
class HospitalView extends egret.DisplayObjectContainer {    
    public player:Player;
    public confirmOkYesNo; // yesno 确认
    public selRelic; // 选择遗物
    public exchangeRelic; // 交换遗物

    private bg:egret.Bitmap; // 背景
    private bg1:egret.Bitmap; // 背景羊皮纸
    private bg2:egret.Bitmap; // 营火
    private title:egret.TextField;
    private tip:egret.TextField;
    private btnCure:TextButtonWithBg; // 治疗
    private btnReinforce:TextButtonWithBg; // 强化
    private btnDeathGodBack:TextButtonWithBg; // 死神回退
    private btnExchangeRelic:TextButtonWithBg // 交换遗物
    private btnGoOn:TextButtonWithBg;

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.name = "hospitalView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.bg2 = ViewUtils.createBitmapByName("campfire_png");
        this.bg2.name = "bg2";

        this.title = ViewUtils.createTextField(45, 0x7d0403);
        this.title.text = ViewUtils.getTipText("hospitalTitle");
        this.title.name = "title";

        this.tip = ViewUtils.createTextField(30, 0x000000);
        this.tip.text = ViewUtils.getTipText("hospitalTip");
        this.tip.name = "tip";

        // 三个功能选项

        // 治疗
        this.btnCure = new TextButtonWithBg("btnBg_png", 30);
        this.btnCure.text = ViewUtils.getTipText("hospitalCure");
        this.btnCure.name = "btnCure";
        this.btnCure.onClicked = () => this.onCure();

        // 强化
        this.btnReinforce = new TextButtonWithBg("btnBg_png", 30);
        this.btnReinforce.text = ViewUtils.getTipText("hospitalReinforce");
        this.btnReinforce.name = "btnReinforce";
        this.btnReinforce.onClicked = () => this.openReinforce();

        // 死神回退
        this.btnDeathGodBack = new TextButtonWithBg("btnBg_png", 30);
        this.btnDeathGodBack.text = ViewUtils.getTipText("hospitalDeathGodBack");
        this.btnDeathGodBack.name = "btnDeathGodBack";
        this.btnDeathGodBack.onClicked = async () => this.onDeathGodBack();

        // 交换遗物
        this.btnExchangeRelic = new TextButtonWithBg("btnBg_png", 30);
        this.btnExchangeRelic.text = ViewUtils.getTipText("hospitalExchangeRelic");
        this.btnExchangeRelic.name = "btnExchangeRelic";
        this.btnExchangeRelic.onClicked = () => this.openExchangeRelic();

        this.btnGoOn = new TextButtonWithBg("goForward_png", 30);
        this.btnGoOn.text = ViewUtils.getTipText("continueBtn");
        this.btnGoOn.name = "btnGoOn";
        this.btnGoOn.onClicked = () => this.onGoOn();

        var objs = [this.bg1, this.bg2, this.title, this.tip, this.btnCure, this.btnDeathGodBack, this.btnReinforce, this.btnExchangeRelic, this.btnGoOn];        
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));
    }

    private doClose;
    public async openHospital() {
        this.btnReinforce.enabled = Utils.filter(this.player.allRelics, (r:Relic) => r.canReinfoce()).length > 0;
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    async onCure() {
        var yesno = await this.confirmOkYesNo("确定治疗", "回复最多 30% 生命", true);
        if (yesno) {
            await this.player.fireEvent("onHospitalCureStart");
            this.player.addHp(Math.floor(this.player.maxHp * 0.3));
            this.doClose();
            await this.player.fireEvent("onHospitalCureEnd");
        }
    }

    async openReinforce() {
        this.alpha = 0; 
        while (1) {
            var r = await this.selRelic();
            if (r instanceof Relic){
                r.reinforceLvUp();
                this.doClose();
                break;
            }
            else if (r == -1)
                break;
        }

        this.alpha = 1;
    }

    // async openMutate() {
    //     var parent = this.parent;
    //     parent.removeChild(this);

    //     var sel = -1;
    //     while (sel < 0) {
    //         sel = await this.selRelic("选择要变异的遗物", "确定变异 ",(r) => true);
    //         if (sel >= 0){ 
    //             var e:Relic = <Relic>this.player.relics[sel];
    //             this.doClose();
    //         }
    //         if (sel == -2)
    //             break;
    //     }

    //     parent.addChild(this);
    // }

    // 死神回退
    async onDeathGodBack() {
        var yesno = await this.confirmOkYesNo("确定驱逐死神", "死神回退 50 步", true);
        if (yesno) {
            var deathStep = this.player.deathStep + 50;
            this.player.deathStep = deathStep > this.player.maxDeathStep ? this.player.maxDeathStep : deathStep;
            this.doClose();
        }
    }

    async openExchangeRelic() {
        var sel = -1;
        this.bg.alpha = 0;
        sel = await this.exchangeRelic();
        this.bg.alpha = 1;
        if (sel == 1){
            this.doClose();
        }
    }

    onGoOn() {
        this.doClose();
    }
}
