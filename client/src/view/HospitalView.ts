// 医院视图
class HospitalView extends egret.DisplayObjectContainer {    
    public player:Player;
    public confirmOkYesNo; // yesno 确认
    public selRelic; // 选择遗物

    private bg:egret.Bitmap; // 背景
    private btnCure:egret.Bitmap; // 治疗
    private btnReinforce:egret.Bitmap; // 强化
    private btnMutate:egret.Bitmap; // 变异
    private btnCancel:egret.Bitmap;

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.addChild(this.bg);

        // 三个功能选项

        // 治疗
        this.btnCure = ViewUtils.createBitmapByName("btnCure_png");
        this.btnCure.width = this.width;
        this.btnCure.height = 250;
        this.btnCure.x = 0;
        this.btnCure.y = 0;
        this.addChild(this.btnCure);
        this.btnCure.touchEnabled = true;
        this.btnCure.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCure, this);

        // 强化
        this.btnReinforce = ViewUtils.createBitmapByName("btnReinforce_png");
        this.btnReinforce.width = this.width;
        this.btnReinforce.height = 250;
        this.btnReinforce.x = 0;
        this.btnReinforce.y = 300;
        this.addChild(this.btnReinforce);
        this.btnReinforce.touchEnabled = true;
        this.btnReinforce.addEventListener(egret.TouchEvent.TOUCH_TAP, this.openReinforce, this);

        // 变异
        this.btnMutate = ViewUtils.createBitmapByName("btnMutate_png");
        this.btnMutate.width = this.width;
        this.btnMutate.height = 250;
        this.btnMutate.x = 0;
        this.btnMutate.y = 600;
        this.addChild(this.btnMutate);
        this.btnMutate.touchEnabled = true;
        this.btnMutate.addEventListener(egret.TouchEvent.TOUCH_TAP, this.openMutate, this);

        this.btnCancel = ViewUtils.createBitmapByName("goForward_png");
        this.btnCancel.x = this.width - this.btnCancel.width;
        this.btnCancel.y = this.height - this.btnCancel.height;
        this.addChild(this.btnCancel);
        this.btnCancel.touchEnabled = true;
        this.btnCancel.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCancel, this);
    }

    private doClose;
    public async openHospital() {
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    async onCure(evt:egret.TouchEvent) {
        var yesno = await this.confirmOkYesNo(undefined, "确定治疗？(回复最多 50% 生命)", true);
        if (yesno) {
            this.player.addHp(this.player.maxHp / 2);
            this.doClose();
        }
    }

    async openReinforce(evt:egret.TouchEvent) {
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

    async openMutate(evt:egret.TouchEvent) {
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

    onCancel(evt:egret.TouchEvent) {
        this.doClose();
    }
}
