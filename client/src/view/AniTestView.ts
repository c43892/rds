class AniTestView extends BattleView {
constructor(w, h) {
        super(w, h);

        ViewUtils.multiLang(this, this.bg, this.avatarBg, this.occupationBg, this.avatar, this.expBar, 
            this.hp, this.hpBar, this.power, this.dodge, this.money, this.currentStoryLv, this.deathGodBarBg, 
            this.deathGodBar, this.deathGod, this.relicsBg, this.moreRelics);

        this.bg.touchEnabled = true;
        this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, async () => {
            await this.playAniTest();
        }, this);

        AniUtils.ac = this;
    }

    async playAniTest() {
        // await this.addElem(ElemFactory.create("DeathGod"));
        var eff:egret.MovieClip = ViewUtils.createFrameAni("effWantedOrder");
        this.addChild(eff);
        eff.anchorOffsetX = eff.width / 2;
        eff.anchorOffsetY = eff.height / 2;
        eff.x = this.width / 2;
        eff.y = this.height / 2;
        eff.gotoAndPlay(0, -1);
    }

    newImg(res) {
        var img = ViewUtils.createBitmapByName(res);
        img.x = (this.width - img.width) / 2;
        img.y = (this.height - img.height) / 2;
        this.addChild(img);
        return img;
    }

    // 物品掉落
    public async addElem(e:Elem) {
        var img = this.newImg(e.getElemImgRes() + "_png");
        var smallImg = this.newImg(e.getElemImgRes() + "_png");
        smallImg.x += 200;
        smallImg.y += 200;
        smallImg.width /= 2;
        smallImg.height /= 2;
        smallImg.alpha = 0;

        var to = {x:img.x+100, y:img.y+100};
        await AniUtils.fly2(img, img, smallImg, true, 1);

        this.removeChild(img);
    }
}