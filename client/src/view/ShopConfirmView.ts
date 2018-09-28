// 商店购买确认视图
class ShopConfirmView extends egret.DisplayObjectContainer {
    private fullBg:egret.Bitmap;
    constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.fullBg = ViewUtils.createBitmapByName("translucent_png");
        this.fullBg.x = this.fullBg.y = 0;
        this.fullBg.width = this.width;
        this.fullBg.height = this.height;
        this.fullBg.touchEnabled = true;
    }

    private clear() {
        this.removeChildren();
        this.addChild(this.fullBg);
    }

    onYes;
    onCancel;

    // 打开购买确认信息界面，并等待确认. 用于营火升级遗物时不显示价格
    public async open(player:Player, e:Elem, price:number, showPrice = true) {
        this.clear();
        if (e instanceof Prop || e instanceof Item)
            this.createItemPropConfirm(player, e, price);
        else {
            Utils.assert(e instanceof Relic, "only prop, item, relic should be in shop");
            var rn = Utils.indexOf(player.relics, (r) => r.type == e.type);
            if (rn < 0)
                this.createNewRelicConfirm(<Relic>e, price, player);
            else {
                var r1 = player.relics[rn];
                var r2 = (<Relic>ElemFactory.create(r1.type));
                var lv = r1.reinforceLv + (<Relic>e).reinforceLv + 1;
                var maxLv = r1.attrs.reinforce.length;
                lv = lv > maxLv ? maxLv : lv;
                r2.setReinfoceLv(lv);
                this.createRelicUpgradeConfirm(r1, r2, price, showPrice);
            }
        }

        return new Promise<boolean>((r, reject) => {
            this.onYes = () => r(true);
            this.onCancel = () => r(false);
        });
    }
    
    // 购买物品和道具使用同一种确认界面
    private createItemPropConfirm(player:Player, e:Elem, price:number) {
        // 背景底图
        var bg = ViewUtils.createBitmapByName("confirmBg_png");
        bg.width = 600;
        bg.x = 20;
        bg.y = 400;
        this.addChild(bg);

        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);

        // 标题
        var title = ViewUtils.createTextField(35, 0x7d0403);
        title.text = nameAndDesc.name;
        title.width = bg.width;
        title.x = bg.x;
        title.y = bg.y + 40;
        this.addChild(title);

        // 描述
        var desc = ViewUtils.createTextField(20, 0x000000);
        desc.textFlow = ViewUtils.fromHtml(ViewUtils.replaceByProperties(nameAndDesc.desc[0], e, player));
        desc.width = bg.width;
        desc.x = bg.x;
        desc.y = title.y + title.height + 30;
        this.addChild(desc);

        // 费用
        var cost = ViewUtils.createTextField(20, 0x000000);
        cost.textFlow = ViewUtils.fromHtml(ViewUtils.formatTip("costCoins", price.toString()));
        cost.width = bg.width;
        cost.x = bg.x;
        cost.y = desc.y + desc.height + 20;
        this.addChild(cost);

        var currentY = cost.y + cost.height;
        if (e instanceof Prop) { // 只有道具显示这一项
            var numHold = ViewUtils.createTextField(20, 0x000000);
            numHold.textFlow = ViewUtils.fromHtml(ViewUtils.formatTip("numHold", Utils.Count(player.props, (p) => p.type == e.type).toString()));
            numHold.width = bg.width;
            numHold.x = bg.x;
            numHold.y = currentY + 20;
            currentY = numHold.y + numHold.height;
            this.addChild(numHold);
        }

        // 确定取消按钮

        var btnCancel = new TextButtonWithBg("btnBg_png", 25);
        btnCancel.width = 120;
        btnCancel.height = 50;
        btnCancel.refresh();
        btnCancel.x = bg.x + bg.width / 2 - btnCancel.width - 50;
        btnCancel.y = currentY + 20;
        btnCancel.text = ViewUtils.getTipText("cancel");
        this.addChild(btnCancel);

        var btnYes = new TextButtonWithBg("btnBg_png", 25);
        btnYes.width = 120;
        btnYes.height = 50;
        btnYes.refresh();
        btnYes.x = bg.x + bg.width / 2 + 50;
        btnYes.y = currentY + 20;
        btnYes.text = ViewUtils.getTipText("yes");
        this.addChild(btnYes);

        btnYes.onClicked = () => this.onYes();
        btnCancel.onClicked = () => this.onCancel();

        var currentY = btnYes.y + btnYes.height;
        bg.height = currentY + 50 - bg.y;
    }

    // 购买新遗物时的确认界面
    private createNewRelicConfirm(e:Elem, price:number, player) {
        // 背景底图
        var bg = ViewUtils.createBitmapByName("confirmBg_png");
        bg.width = 600;
        bg.x = 20;
        bg.y = 400;
        this.addChild(bg);

        // 图标
        var icon = ViewUtils.createBitmapByName(e.getElemImgRes() + "_png");
        icon.x = bg.x + icon.width + 40;
        icon.y = bg.y + 30;
        this.addChild(icon);
        // 添加遗物等级星星
        var stars = ViewUtils.createRelicLevelStars(<Relic>e, icon);
        stars.forEach((star, _) => this.addChild(star));

        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);

        // 标题
        var title = ViewUtils.createTextField(35, 0x7d0403);
        title.text = nameAndDesc.name;
        title.textAlign = egret.HorizontalAlign.LEFT;
        title.x = icon.x + icon.width + 20;
        title.width = bg.width - title.x;
        title.y = bg.y + 55;
        this.addChild(title);

        // 简要描述
        var desc = ViewUtils.createTextField(20, 0x000000);
        desc.textFlow = ViewUtils.fromHtml(ViewUtils.replaceByProperties(nameAndDesc.shortDesc, e, player));
        desc.width = bg.width;
        desc.x = bg.x;
        desc.y = title.y + title.height + 35;
        this.addChild(desc);

        // 费用
        var cost = ViewUtils.createTextField(20, 0x000000);
        cost.textFlow = ViewUtils.fromHtml(ViewUtils.formatTip("costCoins", price.toString()));
        cost.width = bg.width;
        cost.x = bg.x;
        cost.y = desc.y + desc.height + 20;
        this.addChild(cost);

        var currentY = cost.y + cost.height;

        // 确定取消按钮

        var btnCancel = new TextButtonWithBg("btnBg_png", 25);
        btnCancel.width = 120;
        btnCancel.height = 50;
        btnCancel.refresh();
        btnCancel.x = bg.x + bg.width / 2 - btnCancel.width - 50;
        btnCancel.y = currentY + 20;
        btnCancel.text = ViewUtils.getTipText("cancel");
        this.addChild(btnCancel);

        var btnYes = new TextButtonWithBg("btnBg_png", 25);
        btnYes.width = 120;
        btnYes.height = 50;
        btnYes.refresh();
        btnYes.x = bg.x + bg.width / 2 + 50;
        btnYes.y = currentY + 20;
        btnYes.text = ViewUtils.getTipText("yes");
        this.addChild(btnYes);

        btnYes.onClicked = () => this.onYes();
        btnCancel.onClicked = () => this.onCancel();

        var currentY = btnYes.y + btnYes.height;
        bg.height = currentY + 50 - bg.y;
    }

    // 升级遗物时的确认界面
    c1 = new egret.DisplayObjectContainer();
    c2 = new egret.DisplayObjectContainer();
    private createRelicUpgradeConfirm(r1:Relic, r2:Relic, price:number, showPrice = true) {
        // 左边的遗物信息
        this.c1.removeChildren();
        var objs1 = ViewUtils.createSmallRelicInfoRect(r1);
        objs1.forEach((obj, _) => this.c1.addChild(obj));
        var bg1 = objs1[0];
        this.c1.x = 10;
        this.c1.y = 200;
        this.c1.width = bg1.width;
        this.c1.height = bg1.height;

        // 右边的遗物信息
        this.c2.removeChildren();
        var objs2 = ViewUtils.createSmallRelicInfoRect(r2);
        objs2.forEach((obj, _) => this.c2.addChild(obj));
        var bg2 = objs2[0];
        this.c2.x = 330;
        this.c2.y = 200;
        this.c2.width = bg2.width;
        this.c2.height = bg2.height;

        // 箭头
        var arrow = ViewUtils.createBitmapByName("relicUpgradeArrow_png");
        arrow.name = "arrow";
        arrow.x = 320 - arrow.width / 2;
        var bg = objs1[0];
        arrow.y = 130 + bg.height;

        this.addChild(this.c1);
        this.addChild(this.c2);
        this.addChild(arrow);

        // 费用
        if (showPrice) {
            var cost = ViewUtils.createTextField(20, 0x000000);
            cost.textFlow = ViewUtils.fromHtml(ViewUtils.formatTip("costCoins", price.toString()));
            cost.width = this.width;
            cost.x = 0;
            cost.y = this.height - 350;
            this.addChild(cost);
        }

        // 确定返回按钮
        var btnCancel = new TextButtonWithBg("goBack_png", 30);
        btnCancel.x = 10;
        btnCancel.y = 960;
        btnCancel.text = ViewUtils.getTipText("cancel");
        this.addChild(btnCancel);

        var btnYes = new TextButtonWithBg("goForward_png", 30);
        btnYes.x = 417;
        btnYes.y = 960;
        btnYes.text = ViewUtils.getTipText("yes");
        this.addChild(btnYes);

        btnYes.onClicked = () => {
            this.playRelicEffect().then(() => {                
                this.onYes();
            });
        };
        btnCancel.onClicked = () => this.onCancel();
    }

    // 播放遗物升级动画
    async playRelicEffect() {
        var icon = this.c2.getChildByName("icon");

        // 两边隐藏掉
        this.removeChildren();
        this.addChild(this.c1);
        this.addChild(this.c2);
        egret.Tween.get(this.c1).to({alpha:0}, 500);
        egret.Tween.get(this.c2).to({alpha:0}, 500);
        await Utils.delay(500);

        // 结果出来
        this.c2.anchorOffsetX = this.c2.width / 2;
        this.c2.anchorOffsetY = this.c2.height / 2;
        this.c2.x = this.width / 2;
        this.c2.y = this.height / 2;
        this.c2.scaleX = 0.5;
        this.c2.scaleY = 0.5;
        egret.Tween.get(this.c2).to({alpha:1, scaleX:1, scaleY:1}, 1000);
        await Utils.delay(1000);

        // 光效
        var eff = ViewUtils.createFrameAni("effRelicShining");
        eff.x = icon.x + icon.width / 2;
        eff.y = icon.y + icon.height / 2;
        eff.scaleX = 0.75;
        eff.scaleY = 0.75;
        this.c2.addChild(eff);
        eff.play(1);
        await eff["wait"]();
        this.c2.removeChild(eff);

        egret.Tween.get(this.c2).to({alpha:0, scaleX:0.5, scaleY:0.5}, 500);
        await Utils.delay(500);
        this.removeChild(this.c1);
        this.removeChild(this.c2);
        egret.Tween.removeTweens(this.c1);
        egret.Tween.removeTweens(this.c2);
        this.c1.alpha = 1;
        this.c2.alpha = 1;
        this.c2.scaleX = this.c2.scaleY = 1;
        this.c2.anchorOffsetX = this.c2.anchorOffsetY = 0;
    }
}
