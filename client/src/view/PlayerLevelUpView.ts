// 角色升级视图
class PlayerLevelUpView extends egret.DisplayObjectContainer {    
    public player:Player;

    // bg:egret.Bitmap; // 背景
    // lvBg:egret.Bitmap; // 恶魔头像
    // lvBg2:egret.Bitmap; // 恶魔尾巴

    public bv:BattleView; // 战斗界面

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
        // this.touchEnabled = true;

        // ViewUtils.createImgs(this, ["bg", "lvBg", "lvBg2"], 
        //     ["translucent_png", "lvBg_png", "lvBg2_png"]);
        this.btnSels = [];
        this.btnSelsRelicImgs = [];
        this.btnSelsRelicTxts = [];
        for (var i = 0; i < 3; i++) {
            this.btnSels[i] = new TextButtonWithBg("lvSelBarNormal_png");
            this.btnSels[i].name = "btnSel" + i.toString();
            // this.addChild(this.btnSels[i]);

            this.btnSelsRelicImgs[i] = new egret.Bitmap();
            this.btnSelsRelicImgs[i].name = "imgSel" + i.toString();
            // this.addChild(this.btnSelsRelicImgs[i]);
            
            this.btnSelsRelicTxts[i] = ViewUtils.createTextField(24, 0x000000);
            this.btnSelsRelicTxts[i].textAlign = egret.HorizontalAlign.LEFT;
            this.btnSelsRelicTxts[i].lineSpacing = 10;
            this.btnSelsRelicTxts[i].name = "txtSel" + i.toString();
            // this.addChild(this.btnSelsRelicTxts[i]);
        }

        this.lvTxt = new egret.BitmapText();
        this.lvTxt.name = "lvTxt";
        this.lvTxt.font = ViewUtils.getBmpFont("lvFnt");
        this.lvTxt.textAlign = egret.HorizontalAlign.CENTER;
        this.lvTxt.verticalAlign = egret.VerticalAlign.MIDDLE;
        // this.addChild(this.lvTxt);

        this.btnOk = new TextButtonWithBg("lvBtnOk_png");
        this.btnOk.name = "btnOk";
        this.btnOk.setFloatingEffectBg("lvBtnOkBg_png", 10);
        this.btnOk.onClicked = () => this.doSel(this.choices[this.curSel]);
        this.btnSels.forEach((btn, i) => btn.onClicked = (() => () => this.setCurSel(i))());
        // ViewUtils.multiLang(this, this.bg, this.lvBg, this.lvBg2, this.btnOk, this.lvTxt,
        //     this.btnSels[0], this.btnSels[1], this.btnSels[2], 
        //     this.btnSelsRelicImgs[0], this.btnSelsRelicImgs[1], this.btnSelsRelicImgs[2], 
        //     this.btnSelsRelicTxts[0], this.btnSelsRelicTxts[1], this.btnSelsRelicTxts[2]);
    }

    choices = [];
    curSel = 0;
    doSel;
    okBtnSlot:dragonBones.Slot;
    // Cache pluv's width/height at open time. PIXI Container.width/height returns
    // dynamic getLocalBounds() which collapses to 0 mid-animation, so reading it after
    // an await would compute the wrong armature center.
    private _stableW = 0;
    private _stableH = 0;
    public async open(choices):Promise<string> {
        this._stableW = this.width;
        this._stableH = this.height;
        this.choices = choices;
        this.refresh();
        this.lvTxt.text = (this.player.lv + 1).toString();
        this.lvTxt.height = this.lvTxt.textHeight;
        this.lvTxt.x = (this.width - this.lvTxt.width) / 2;

        var ske = ViewUtils.createSkeletonAni("shengji");
        this.addChild(ske.display);
        ske.display.x = this.width / 2;
        ske.display.y = this.height / 2;

        // 确定按钮，至少选中一个后再出现
        this.okBtnSlot = ske.getSlot("pai4");
        this.setCurSel(-1);

        // 三个选项
        for (var i = 0; i < 3; i++) {
            var biao = ske.getSlot("biao" + (i + 1).toString());
            var pai = ske.getSlot("pai" + (i + 1).toString());
            var zi = ske.getSlot("zi" + (i + 1).toString());

            if (i < this.choices.length) {
                var img = this.btnSelsRelicImgs[i];
                img.anchorOffsetX = img.width / 2;
                img.anchorOffsetY = img.height / 2;
                biao.display = img;
                var txt = this.btnSelsRelicTxts[i];
                zi.display = txt;
                txt.width = 265;
                txt.height = 100;
                txt.anchorOffsetX = txt.width / 2;
                txt.anchorOffsetY = txt.height / 2;
                var btn = this.btnSels[i];
                btn.anchorOffsetX = this.btnSels[i].width / 2;
                btn.anchorOffsetY = this.btnSels[i].height / 2;
                // btn.setTexName("lvSelBarNormal_png");
                pai.display = btn;
            } else {
                biao.display = pai.display = zi.display = new egret.Bitmap();
            }
        }

        // 等级数字
        var shuzi = ske.getSlot("shuzi");
        shuzi.display = this.lvTxt;
        this.lvTxt.anchorOffsetX = this.lvTxt.width / 2;
        this.lvTxt.anchorOffsetY = this.lvTxt.height / 2;        

        // 龙出现
        ske.animation.play("stand");

        // Port workaround for per-choice description: see note at the end of open().
        // Done here (right after play("stand")) instead of at the very end so it isn't
        // skipped by an early-resolved doSel or any timing/await interaction with the
        // intro effects that follow.
        await Utils.delay(50); // one frame for slot.global to populate from the first pose
        var armCx0 = this._stableW / 2, armCy0 = this._stableH / 2;
        for (var iTxt0 = 0; iTxt0 < this.choices.length && iTxt0 < 3; iTxt0++) {
            var ziSlot0 = ske.getSlot("zi" + (iTxt0 + 1).toString());
            var txtV0 = this.btnSelsRelicTxts[iTxt0];
            if (!ziSlot0 || !ziSlot0.global || !txtV0) continue;
            if (txtV0.parent) txtV0.parent.removeChild(txtV0);
            this.addChild(txtV0);
            txtV0.anchorOffsetX = txtV0.width / 2;
            txtV0.anchorOffsetY = txtV0.height / 2;
            txtV0.x = armCx0 + ziSlot0.global.x;
            txtV0.y = armCy0 + ziSlot0.global.y;
        }
        console.log("[pluv] reparented " + this.choices.length + " desc texts to pluv");

        await Utils.delay(100);

        // 经验条顶端爆炸
        var eff1 = AniUtils.createFrameAni("effPlayerLevelUp2", 1);
        var bvPos = AniUtils.ani2global(this.bv.avatarBg);
        var effPos = {x: bvPos.x + this.bv.avatarBg.width - 20, y:bvPos.y + 10};
        eff1.x = effPos.x;
        eff1.y = effPos.y;
        eff1["wait"]().then(() => eff1["dispose"]());

        // 飞行效果
        await Utils.delay(100);
        var eff2 = ViewUtils.createFrameAni("effPlayerLevelUp1");
        let track = new BazierControllerWrapper(eff2);
        track.rotationDelta = 180;
        AniUtils.ac.addChild(track);
        eff2.play(1);
        eff2.x = effPos.x;
        eff2.y = effPos.y;
        var toPos = AniUtils.ani2global(this);
        toPos.x += this.width / 2;
        toPos.y += this.height / 4 + 50;
        await AniUtils.createFlyTrack(track, effPos, toPos, 500);
        eff2["stop"]();
        AniUtils.ac.removeChild(track);

        // NOTE: pixi-dragonbones renders slot-Bitmap textures via its own pipeline but
        // silently skips non-textured displays like egret.TextField (a Container of PIXI.Text).
        // The icons (zi -> Bitmap) render fine; description texts (zi -> TextField) render
        // to their own texture but never reach the screen. The per-choice descriptions are
        // instead re-parented directly onto pluv right after play("stand") above, so PIXI's
        // normal render pipeline draws them. The doSel cleanup below also removes them.

        return new Promise<string>((resolve, reject) => {
            this.doSel = (r) => {
                this.removeChild(ske.display);
                // remove the description texts we re-parented to pluv so they don't linger
                for (var tt of this.btnSelsRelicTxts) {
                    if (tt && tt.parent === this) this.removeChild(tt);
                }
                resolve(r);
            };
        });
    }

    refresh() {
        // for (var i = 0; i < 3; i++) {
        //     if (this.contains(this.btnSels[i])) this.removeChild(this.btnSels[i]);
        //     if (this.contains(this.btnSelsRelicImgs[i])) this.removeChild(this.btnSelsRelicImgs[i]);
        //     if (this.contains(this.btnSelsRelicTxts[i])) this.removeChild(this.btnSelsRelicTxts[i]);
        // }
        
        for (var i = 0; i < this.choices.length; i++) {
            // this.addChild(this.btnSels[i]);
            // this.addChild(this.btnSelsRelicImgs[i]);
            // this.addChild(this.btnSelsRelicTxts[i]);

            var img = this.btnSelsRelicImgs[i];
            ViewUtils.setTexName(img, this.choices[i] + "_png", true);

            // 需要弄个假的遗物用来计算显示内容
            var allRelics = this.player.allRelics;
            var relicType = this.choices[i];
            var fakeRelic = <Relic>ElemFactory.create(relicType, undefined, this.player);
            var realRelicIndex = Utils.indexOf(allRelics, (r) => r.type == relicType);
            if (realRelicIndex >= 0) {
                var fakeLv = allRelics[realRelicIndex].reinforceLv + 1;
                fakeRelic.setReinfoceLv(fakeLv);
            }
            var nameAndDesc = ViewUtils.getElemNameAndDesc(this.choices[i]);
            var shortDesc = ViewUtils.replaceByProperties(nameAndDesc.shortDesc, fakeRelic, this.player, 1);
            this.btnSelsRelicTxts[i].textFlow = ViewUtils.fromHtml(shortDesc);
        }       
    }

    public static lastSelectedRelicImgGlobalPos; // 构建动画要用这个
    setCurSel(n) {
        this.curSel = n;
        this.btnSels.forEach((btn, _) => btn.setTexName("lvSelBarNormal_png"));

        // 确定按钮
        if (n >= 0) {
            this.okBtnSlot.display = this.btnOk;
            this.btnOk.alpha = 1;
            this.btnOk.anchorOffsetX = this.btnOk.width / 2;
            this.btnOk.anchorOffsetY = this.btnOk.height / 2;
        } else {
            this.okBtnSlot.display.alpha = 0;
            return;
        }

        if (n >= 0 && n < this.btnSels.length) {
            this.btnSels[n].setTexName("lvSelBarSel_png");
            PlayerLevelUpView.lastSelectedRelicImgGlobalPos = ViewUtils.getGlobalPosAndSize(this.btnSelsRelicImgs[n]);
        }
    }
}
