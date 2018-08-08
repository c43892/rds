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
        await this.addElem(ElemFactory.create("Shield"));
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
        var aniFact = AniUtils.aniFact;
        
        // var to = {x:img.x - 100, y:img.y+500, width:img.width, height:img.height};
        // await AniUtils.fly2(img, img, to);

        await AniUtils.turnover(img, () => {
            console.log("in middle");
        });

        this.removeChild(img);
    }
}