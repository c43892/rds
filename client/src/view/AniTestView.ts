class AniTestView extends BattleView {
    aniFact:AnimationFactory;
    constructor(w, h) {
        super(w, h);

        ViewUtils.multiLang(this, this.bg, this.avatarBg, this.occupationBg, this.avatar, this.expBar, 
            this.hp, this.hpBar, this.power, this.dodge, this.money, this.currentStoryLv, this.deathGodBarBg, 
            this.deathGodBar, this.deathGod, this.relicsBg, this.moreRelics);

        this.bg.touchEnabled = true;
        this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, async () => {
            await this.playAniTest();
        }, this);

        this.aniFact = new AnimationFactory();
    }

    async playAniTest() {
        await this.itemDrop(ElemFactory.create("Coins"));
    }

    newImg(res) {
        var img = ViewUtils.createBitmapByName(res);
        img.x = (this.width - img.width) / 2;
        img.y = (this.height - img.height) / 2;
        this.addChild(img);
        return img;
    }

    // 物品掉落
    public async itemDrop(e:Elem) {
        var img = this.newImg(e.getElemImgRes() + "_png");
        await this.aniFact.createAni("aniGroup", [
            this.aniFact.createAni("jumping", {obj:img, fy:img.y + 50, ty:img.y, time:500}),
            this.aniFact.createAni("fade", {obj:img, fa:0, ta:1, time:100}),
        ]);

        this.removeChild(img);
    }
}