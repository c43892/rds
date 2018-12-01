// 角色选择界面
class OccupationSelView extends egret.DisplayObjectContainer {
    bg:egret.Bitmap; // 背景底板
    btnCancel:TextButtonWithBg; // 返回
    btnOk:TextButtonWithBg; // 确定

    occAvatar:egret.DisplayObjectContainer; // 当前选中职业头像
    occDesc:egret.TextField; // 当前选中职业描述
    occRelicImg:egret.Bitmap; // 职业技能图标
    occRelicDesc:egret.TextField; // 职业技能描述
    occItemImg:egret.Bitmap; // 职业物品图标
    occItemDesc:egret.TextField; // 职业物品描述

    occAvatarBgLst:TextButtonWithBg[]; // 候选职业背景
    occAvatarLst:egret.DisplayObjectContainer[]; // 候选职业列表头像

    diffImgLst:egret.Bitmap[]; // 难度图标
    diffFlagBg:egret.Bitmap; // 难度描述背景
    diffFlagDesc:egret.TextField; // 难度描述文字

    occ:string; // 当前选中职业
    difficultyDegree:number; // 当前选中难度

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.name = "occSelView";

        this.bg = ViewUtils.createBitmapByName("occSelViewBg_png");
        this.addChild(this.bg);

        this.btnCancel = new TextButtonWithBg("goBack_png", 30);
        this.btnCancel.name = "cancelBtn";
        this.btnCancel.onClicked = () => this.onClose(undefined);

        this.btnOk = new TextButtonWithBg("goForward_png", 30);
        this.btnOk.name = "okBtn";
        this.btnOk.onClicked = () => this.onClose({
            occ:this.occ,
            d:this.difficultyDegree
        });

        // 职业头像及物品技能信息
        this.occAvatar = new egret.DisplayObjectContainer();
        this.occAvatar.name = "occAvatar";
        this.occDesc = new egret.TextField();
        this.occDesc.name = "occDesc";
        this.occRelicImg = new egret.Bitmap();
        this.occRelicImg.name = "occRelicImg";
        this.occRelicDesc = new egret.TextField();
        this.occRelicDesc.name = "occRelicDesc";
        this.occItemImg = new egret.Bitmap();
        this.occItemImg.name = "occItemImg";
        this.occItemDesc = new egret.TextField();
        this.occItemDesc.name = "occItemDesc";

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

        var uis = [this.occAvatar, this.occDesc, this.occRelicImg, this.occRelicDesc, 
            this.occItemImg, this.occItemDesc, ...this.occAvatarBgLst, ...this.occAvatarLst,
            this.btnCancel, this.btnOk];

        for (var ui of uis)
            this.addChild(ui);

        ViewUtils.multiLang(this, ...uis);

        for (var i = 0; i < this.occAvatarLst.length; i++) {
            var c = this.occAvatarLst[i];
            var img = this.occAvatarBgLst[i];
            c.width = img.width; c.height = img.height;
            c.x = img.x + img.width / 2;
            c.y = img.y + img.height / 2;
        }
    }

    onClose;
    public async open() {
        ViewUtils.asFullBg(this.bg);

        this.setAvailableOccList(["Nurse", "Rogue"]);
        this.selOcc("Nurse");
        this.selDifficulty(0);

        return new Promise((resolve, _) => {
            this.onClose = (r) => {
                resolve(r);
            };
        });
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

                let ske = ViewUtils.createSkeletonAni(occArr[i]);
                ske.animation.play("Idle", 0);
                this.occAvatarLst[i].addChild(ske.display);
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

        this.occAvatar.removeChildren();
        var ske = ViewUtils.createSkeletonAni(occ);
        ske.animation.play("Idle", 0);
        this.occAvatar.addChild(ske.display);
    }
    
    selDifficulty(d:number) {
        this.difficultyDegree = d;
    }
}
