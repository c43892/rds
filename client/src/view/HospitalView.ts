// 医院视图
class HospitalView extends egret.DisplayObjectContainer {    
    public player:Player;
    public confirmOkYesNo; // yesno 确认
    public selRelic; // 选择遗物

    private bg:egret.Bitmap; // 背景
    private bg1:egret.Bitmap; // 背景羊皮纸
    private bg2:egret.Bitmap; // 营火
    private title:egret.TextField;
    private tip:egret.TextField;
    private btnCure:TextButtonWithBg; // 治疗
    private btnReinforce:TextButtonWithBg; // 强化
    private btnMutate:TextButtonWithBg; // 变异
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

        // // 变异
        // this.btnMutate = new TextButtonWithBg("btnBg_png", 30);
        // this.btnMutate.text = ViewUtils.getTipText("hospitalMutate");
        // this.btnMutate.name = "btnMutate";
        // this.btnMutate.onClicked = async () => await this.openMutate();

        this.btnGoOn = new TextButtonWithBg("goForward_png", 30);
        this.btnGoOn.text = ViewUtils.getTipText("continueBtn");
        this.btnGoOn.name = "btnGoOn";
        this.btnGoOn.onClicked = () => this.onGoOn();

        var objs = [this.bg1, this.bg2, this.title, this.tip, this.btnCure, this.btnReinforce, this.btnGoOn];        
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));
    }

    private doClose;
    public async openHospital() {
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    async onCure() {
        var yesno = await this.confirmOkYesNo(undefined, "确定治疗？(回复最多 30% 生命)", true);
        if (yesno) {
            this.player.addHp(this.player.maxHp / 2);
            this.doClose();
        }
    }

    async openReinforce() {
        var parent = this.parent;
        parent.removeChild(this);
        
        var sel = -1;
        while (sel < 0) {
            sel = await this.selRelic("选择要强化的遗物", (r:Relic) => r.canReinfoce());
            if (sel >= 0) {
                var e:Relic = <Relic>this.player.relics[sel];
                var yesno = await this.confirmOkYesNo(undefined, "确定强化 " + ViewUtils.getElemNameAndDesc(e.type).name, true);
                if (yesno) {
                    e.reinforceLvUp();
                    this.doClose();
                } else
                    sel = -1;
            } else
                break;
        }

        parent.addChild(this);
    }

    async openMutate() {
        var parent = this.parent;
        parent.removeChild(this);

        var sel = -1;
        while (sel < 0) {
            sel = await this.selRelic("选择要变异的遗物", (r) => true);
            if (sel >= 0) {
                var e = this.player.relics[sel];
                var yesno = await this.confirmOkYesNo(undefined, "确定变异 " + ViewUtils.getElemNameAndDesc(e.type).name, true);
                if (yesno) {
                    this.doClose();
                } else
                    sel = -1;
            } else
                break;
        }

        parent.addChild(this);
    }

    onGoOn() {
        this.doClose();
    }
}
