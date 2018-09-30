// 角色升级视图
class PlayerLevelUpView extends egret.DisplayObjectContainer {    
    public player:Player;

    bg:egret.Bitmap; // 背景
    lvBg:egret.Bitmap; // 恶魔头像
    lvBg2:egret.Bitmap; // 恶魔尾巴

    lvTxt:egret.BitmapText; // 等级数字
    btnOk:TextButtonWithBg; // 确定按钮
    btnSels:TextButtonWithBg[]; //  遗物选项按钮
    btnSelsRelicImgs:egret.Bitmap[]; // 遗物选项图标
    btnSelsRelicTxts:egret.TextField[]; // 遗物描述文字

    public constructor(w:number, h:number) { 
        super();
        this.name = "playerLevelUp";

        this.width = w;
        this.height = h;
        this.touchEnabled = true;

        ViewUtils.createImgs(this, ["bg", "lvBg", "lvBg2"], 
            ["translucent_png", "lvBg_png", "lvBg2_png"]);
        this.btnSels = [];
        this.btnSelsRelicImgs = [];
        this.btnSelsRelicTxts = [];
        for (var i = 0; i < 3; i++) {
            this.btnSels[i] = new TextButtonWithBg("lvSelBarNormal_png");
            this.btnSels[i].name = "btnSel" + i.toString();
            this.addChild(this.btnSels[i]);

            this.btnSelsRelicImgs[i] = new egret.Bitmap();
            this.btnSelsRelicImgs[i].name = "imgSel" + i.toString();
            this.addChild(this.btnSelsRelicImgs[i]);
            
            this.btnSelsRelicTxts[i] = ViewUtils.createTextField(24, 0x000000);
            this.btnSelsRelicTxts[i].textAlign = egret.HorizontalAlign.LEFT;
            this.btnSelsRelicTxts[i].lineSpacing = 10;
            this.btnSelsRelicTxts[i].name = "txtSel" + i.toString();
            this.addChild(this.btnSelsRelicTxts[i]);
        }

        this.lvTxt = new egret.BitmapText();
        this.lvTxt.name = "lvTxt";
        this.lvTxt.font = ViewUtils.getFont("lvFnt");
        this.lvTxt.textAlign = egret.HorizontalAlign.CENTER;
        this.lvTxt.verticalAlign = egret.VerticalAlign.MIDDLE;
        this.addChild(this.lvTxt);

        this.btnOk = new TextButtonWithBg("lvBtnOk_png");
        this.btnOk.name = "btnOk";
        this.btnOk.setFloatingEffectBg("lvBtnOkBg_png", 10);
        this.btnOk.onClicked = async () => await this.doSel(this.choices[this.curSel]);
        this.btnSels.forEach((btn, i) => btn.onClicked = (() => () => this.setCurSel(i))());
        ViewUtils.multiLang(this, this.bg, this.lvBg, this.lvBg2, this.btnOk, this.lvTxt,
            this.btnSels[0], this.btnSels[1], this.btnSels[2], 
            this.btnSelsRelicImgs[0], this.btnSelsRelicImgs[1], this.btnSelsRelicImgs[2], 
            this.btnSelsRelicTxts[0], this.btnSelsRelicTxts[1], this.btnSelsRelicTxts[2]);
    }

    choices = [];
    curSel = 0;
    doSel;
    public async open(choices):Promise<string> {
        this.choices = choices;
        this.lvTxt.text = (this.player.lv + 1).toString();
        this.lvTxt.height = this.lvTxt.textHeight;
        this.lvTxt.x = (this.width - this.lvTxt.width) / 2;
        this.refresh();
        if (this.contains(this.btnOk)) {
            this.setCurSel(-1);
            this.removeChild(this.btnOk); // 至少选择一个遗物后再出现该按钮
        }
        return new Promise<string>((resolve, reject) => {
            this.doSel = async (r) => {
                resolve(r);
            };
        });
    }

    refresh() {
        for (var i = 0; i < 3; i++) {
            this.removeChild(this.btnSels[i]);
            this.removeChild(this.btnSelsRelicImgs[i]);
            this.removeChild(this.btnSelsRelicTxts[i]);
        }
        
        for (var i = 0; i < this.choices.length; i++) {
            this.addChild(this.btnSels[i]);
            this.addChild(this.btnSelsRelicImgs[i]);
            this.addChild(this.btnSelsRelicTxts[i]);

            var img = this.btnSelsRelicImgs[i];
            ViewUtils.setTexName(img, this.choices[i] + "_png", true);

            // 需要弄个假的遗物用来计算显示内容
            var relicType = this.choices[i];
            var fakeRelic = <Relic>ElemFactory.create(relicType, undefined, this.player);
            var realRelicIndex = Utils.indexOf(this.player.relics, (r) => r.type == relicType);
            var fakeLv = realRelicIndex >= 0 ? this.player.relics[realRelicIndex].reinforceLv + 1 : 1;
            fakeRelic.setReinfoceLv(fakeLv);
            var nameAndDesc = ViewUtils.getElemNameAndDesc(this.choices[i]);
            var shortDesc = ViewUtils.replaceByProperties(nameAndDesc.shortDesc, fakeRelic, this.player);
            this.btnSelsRelicTxts[i].textFlow = ViewUtils.fromHtml(shortDesc);
        }       
    }

    public static lastSelectedRelicImgGlobalPos; // 构建动画要用这个
    setCurSel(n) {
        this.curSel = n;
        this.addChild(this.btnOk);
        this.btnSels.forEach((btn, _) => btn.setTexName("lvSelBarNormal_png"));

        if (n >= 0 && n < this.btnSels.length) {
            this.btnSels[n].setTexName("lvSelBarSel_png");
            PlayerLevelUpView.lastSelectedRelicImgGlobalPos = ViewUtils.getGlobalPosAndSize(this.btnSelsRelicImgs[n]);
        }
    }
}
