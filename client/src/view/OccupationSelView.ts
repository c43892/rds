// 角色选择界面
class OccupationSelView extends egret.DisplayObjectContainer {
    bg:egret.Bitmap; // 背景底板
    btnCancel:TextButtonWithBg; // 返回
    btnOk:TextButtonWithBg; // 确定

    occAvatarFrame:egret.Bitmap;
    occAvatarFrameMask:egret.Bitmap;
    occAvatar:egret.DisplayObjectContainer; // 当前选中职业头像
    occDesc:egret.TextField; // 当前选中职业描述
    occRelicImg:egret.Bitmap; // 职业技能图标
    occRelicDesc:egret.TextField; // 职业技能描述
    occPropImg:egret.Bitmap; // 职业物品图标
    occPropDesc:egret.TextField; // 职业物品描述

    occAvatarBgLst:TextButtonWithBg[]; // 候选职业背景
    occAvatarLst:egret.DisplayObjectContainer[]; // 候选职业列表头像

    diffImgLst:TextButtonWithBg[]; // 难度图标
    diffFlagBg:egret.Bitmap; // 难度描述背景
    diffFlagDesc:egret.TextField; // 难度描述文字

    occ:string; // 当前选中职业
    difficultyDegree:number; // 当前选中难度

    diffDesc:LevelDiffDescView; // 难度详情

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.name = "occSelView";

        this.bg = ViewUtils.createBitmapByName("occSelViewBg_png");
        this.addChild(this.bg);

        this.btnCancel = new ArrowButton(false, "goBack_png", 30);
        this.btnCancel.name = "cancelBtn";
        this.btnCancel.onClicked = () => this.onClose(undefined);

        this.btnOk = new ArrowButton(true, "goForward_png", 30);
        this.btnOk.name = "okBtn";
        this.btnOk.onClicked = () => this.onClose({
            occ:this.occ,
            d:this.difficultyDegree
        });

        // 职业头像及物品技能信息
        this.occAvatarFrame = ViewUtils.createBitmapByName("occAvatarFrame_png");
        this.occAvatarFrame.name = "occAvatarFrame";
        this.occAvatarFrameMask = ViewUtils.createBitmapByName("occAvatarFrameMask_png");
        this.occAvatarFrameMask.name = "occAvatarFrameMask";
        this.occAvatar = new egret.DisplayObjectContainer();
        this.occAvatar.name = "occAvatar";
        this.occDesc = new egret.TextField();
        this.occDesc.name = "occDesc";
        this.occRelicImg = new egret.Bitmap();
        this.occRelicImg.name = "occRelicImg";
        this.occRelicDesc = new egret.TextField();
        this.occRelicDesc.name = "occRelicDesc";
        this.occPropImg = new egret.Bitmap();
        this.occPropImg.name = "occPropImg";
        this.occPropDesc = new egret.TextField();
        this.occPropDesc.name = "occPropDesc";

        // 职业列表
        this.occAvatarBgLst = [];
        for (var i = 0; i < 8; i++) {
            var btn = new TextButtonWithBg("occLockedBg_png");
            btn.name = "occAvatarBgLst" + (i + 1);
            this.occAvatarBgLst.push(btn);
        }

        this.occAvatarLst = [];
        for (var i = 0; i < 8; i++) {
            var c = new egret.DisplayObjectContainer();
            c.name = "occAvatarLst" + (i + 1);
            this.occAvatarLst.push(c);
        }

        // 难度列表
        this.diffImgLst = [];        
        for (var i = 0; i < 5; i++) {
            var btn = new TextButtonWithBg("diffUnlocked" + (i+1) + "_png");
            btn.setDisableBg(undefined);
            btn.enabled = false;
            btn.name = "diff" + (i + 1);
            btn.anchorOffsetX = btn.width / 2;
            btn.anchorOffsetY = btn.height;
            let diff = i;
            btn.onClicked = () => this.selDifficulty(diff);
            btn.onPressed = () => {
                this.addChild(this.diffDesc);
                this.diffDesc.open(diff).then(() => this.removeChild(this.diffDesc));
            };
            this.diffImgLst.push(btn);
        }

        this.diffFlagBg = ViewUtils.createBitmapByName("diffFlagBg_png");
        this.diffFlagBg.anchorOffsetX = this.diffFlagBg.width / 2;
        this.diffFlagBg.name = "diffFlagBg";
        this.diffFlagDesc = ViewUtils.createTextField(25, 0x000000);
        this.diffFlagDesc.name = "diffFlagDesc";

        var uis = [this.occAvatar, this.occAvatarFrame, this.occAvatarFrameMask, this.occDesc, this.occRelicImg, this.occRelicDesc, 
            this.occPropImg, this.occPropDesc, ...this.occAvatarBgLst, ...this.occAvatarLst,
            ...this.diffImgLst, this.diffFlagBg, this.diffFlagDesc, this.btnCancel, this.btnOk];

        for (var ui of uis)
            this.addChild(ui);

        ViewUtils.multiLang(this, ...uis);

        this.occAvatar.mask = this.occAvatarFrameMask;

        this.diffDesc = new LevelDiffDescView(w, h);
        this.diffDesc.x = this.diffDesc.y = 0;
    }

    onClose;
    public refresh() {
        ViewUtils.asFullBg(this.bg);

        this.setAvailableOccList(["Rogue", "Nurse"]);
        this.setAvailableDiff(Utils.getDiffByAchvData());
        this.selOcc("Rogue");
        this.selDifficulty(Utils.getDiffByAchvData() - 1);
    }

    public async open() {
        return new Promise((resolve, _) => {
            this.onClose = (r) => {
                resolve(r);
            };
        });
    }

    diffUnlocked;
    setAvailableDiff(n) {
        this.diffUnlocked = n;
        for (var i = 0; i < this.diffImgLst.length; i++) {
            var diffImg = this.diffImgLst[i];
            if (i < this.diffUnlocked) {
                diffImg.setTexName("diffUnlocked" + (i+1) + "_png");
                diffImg.enabled = true;
            } else {
                diffImg.setTexName(undefined);
                diffImg.enabled = false;
            }
        }
    }

    occArr;
    setAvailableOccList(occArr:string[]) {
        this.occArr = occArr;
        for (var i = 0; i < this.occAvatarBgLst.length; i++) {
            this.occAvatarLst[i].removeChildren();
            this.occAvatarBgLst[i].setTexName("occUnlockedBg_png");
            this.occAvatarBgLst[i].setDisableBg("occLockedBg_png");
            if (i < occArr.length) {
                let occ = occArr[i];
                this.occAvatarBgLst[i].enabled = true;
                this.occAvatarBgLst[i].onClicked = () => {
                    this.selOcc(occ);
                };

                // let ske = ViewUtils.createSkeletonAni(occArr[i]);
                // ske.animation.play("Idle", 0);
                // this.occAvatarLst[i].addChild(ske.display);
                var c = this.occAvatarLst[i];
                let occImg = ViewUtils.createBitmapByName(occArr[i] + "_png");
                occImg.width = c.width;
                occImg.height = c.height;
                occImg.x = occImg.y = 0;
                c.addChild(occImg);
            }
            else
                this.occAvatarBgLst[i].enabled = false;
        }
    }

    selOcc(occ:string) {
        this.occ = occ;

        for (var i = 0; i < this.occArr.length; i++) {
            if (this.occArr[i] == occ)
                this.occAvatarBgLst[i].setTexName("occSelBg_png");
            else
                this.occAvatarBgLst[i].setTexName("occUnlockedBg_png");
        }

        // 头像
        this.occAvatar.removeChildren();
        var ske = ViewUtils.createSkeletonAni(occ);
        ske.animation.play("Idle", 0);
        this.occAvatar.addChild(ske.display);

        // 职业描述
        var mlCfg = ViewUtils.languageCfg;
        var curCfg = mlCfg.occupations;
        var desc = curCfg[occ]["desc"][mlCfg.currentLanguage];
        this.occDesc.textFlow = ViewUtils.fromHtml(desc);
        
        // 初始物品
        var initialItems = Occupation.getInitialItems(occ);
        ViewUtils.setTexName(this.occRelicImg, initialItems["relic"] + "_png");
        this.occRelicDesc.textFlow = ViewUtils.fromHtml(ViewUtils.getElemNameAndDesc(initialItems["relic"]).initialDesc);
        ViewUtils.setTexName(this.occPropImg, initialItems["prop"] + "_png");
        this.occPropDesc.textFlow = ViewUtils.fromHtml(ViewUtils.getElemNameAndDesc(initialItems["prop"]).initialDesc);
    }
    
    selDifficulty(d:number) {
        this.difficultyDegree = d;
        for (var i = 0; i < this.diffUnlocked; i++)
            this.diffImgLst[i].setTexName("diffUnlocked" + (i+1) + "_png");

        var diff = this.diffImgLst[d];
        diff.setTexName("diffSel" + (d+1) + "_png");

        this.diffFlagBg.x = diff.x;
        this.diffFlagBg.y = diff.y - 20;
        this.diffFlagDesc.text = ViewUtils.getTipText("diff" + (d + 1));
        this.diffFlagDesc.x = this.diffFlagBg.x - this.diffFlagBg.anchorOffsetX;
        this.diffFlagDesc.y = this.diffFlagBg.y + 12;
        this.diffFlagDesc.width = this.diffFlagBg.width;
        this.diffFlagDesc.height = this.diffFlagBg.height - 12;
        this.diffFlagDesc.textAlign = egret.HorizontalAlign.CENTER;
        this.diffFlagDesc.verticalAlign = egret.VerticalAlign.MIDDLE;
    }
}
