// 角色升级视图
class PlayerLevelUpView extends egret.DisplayObjectContainer {    
    public player:Player;

    bg:egret.Bitmap; // 背景
    lvBg:egret.Bitmap; // 恶魔头像
    lvBg2:egret.Bitmap; // 恶魔尾巴
    btnOkBg:egret.Bitmap; // 确定按钮的底

    btnOk:TextButtonWithBg; // 确定按钮
    btnSels:TextButtonWithBg[]; //  遗物选项按钮
    btnSelsRelicImgs:egret.Bitmap[]; // 遗物选项图标
    btnSelsRelicTxts:egret.TextField[]; // 遗物描述文字

    public constructor(w:number, h:number) {
        super();
        this.name = "playerLevelUpView";

        this.width = w;
        this.height = h;
        this.touchEnabled = true;

        ViewUtils.createImgs(this, ["bg", "lvBg", "lvBg2", "btnOkBg"], 
            ["translucent_png", "lvBg_png", "lvBg2_png", "lvBtnOkBg_png"]);
        this.btnSels = [];
        this.btnSelsRelicImgs = [];
        this.btnSelsRelicTxts = [];
        for (var i = 0; i < 3; i++) {
            this.btnSels[i] = ViewUtils.createImageBtn(0, 0x0000000, "lvSelBarNormal_png");
            this.btnSels[i].name = "btnSel" + i.toString();
            this.addChild(this.btnSels[i]);

            this.btnSelsRelicImgs[i] = new egret.Bitmap();
            this.btnSelsRelicImgs[i].name = "imgSel" + i.toString();
            this.addChild(this.btnSelsRelicImgs[i]);
            
            this.btnSelsRelicTxts[i] = new egret.TextField();
            this.btnSelsRelicTxts[i].name = "txtSel" + i.toString();
            this.btnSelsRelicTxts[i].textAlign = egret.HorizontalAlign.CENTER;
            this.btnSelsRelicTxts[i].verticalAlign = egret.VerticalAlign.MIDDLE;
            this.btnSelsRelicTxts[i].textColor = 0xffffff;
            this.addChild(this.btnSelsRelicTxts[i]);
        }

        this.btnOk = ViewUtils.createImageBtn(0, 0x0000000, "lvBtnOk_png");
        this.btnOk.name = "btnOk";
        this.btnOk.onClicked = async () => await this.doSel(this.choices[this.curSel]);
        this.addChild(this.btnOk);

        this.btnSels[0].onClicked = () => this.setCurSel(0);
        this.btnSels[1].onClicked = () => this.setCurSel(1);
        this.btnSels[2].onClicked = () => this.setCurSel(2);

        ViewUtils.multiLang(this, this.bg, this.lvBg, this.lvBg2, this.btnOk, this.btnOkBg, 
            this.btnSels[0], this.btnSels[1], this.btnSels[2], 
            this.btnSelsRelicImgs[0], this.btnSelsRelicImgs[1], this.btnSelsRelicImgs[2], 
            this.btnSelsRelicTxts[0], this.btnSelsRelicTxts[1], this.btnSelsRelicTxts[2]);
    }

    choices = [];
    curSel = 0;
    doSel;
    public async open(choices):Promise<string> {
        this.choices = choices;
        this.refresh();
        this.setCurSel(0);
        return new Promise<string>((resolve, reject) => {
            this.doSel = async (r) => {
                resolve(r);
            };
        });
    }

    refresh() {
        for (var i = 0; i < 3; i++) {
            ViewUtils.setTexName(this.btnSelsRelicImgs[i], this.choices[i] + "_png", true);
            this.btnSelsRelicTxts[i].text = ViewUtils.getElemNameAndDesc(this.choices[i]).shortDesc;
        }       
    }

    async setCurSel(n) {
        this.curSel = n;
        this.btnSels[0].setTexName("lvSelBarNormal_png");
        this.btnSels[1].setTexName("lvSelBarNormal_png");
        this.btnSels[2].setTexName("lvSelBarNormal_png");
        this.btnSels[n].setTexName("lvSelBarSel_png");
    }
}
