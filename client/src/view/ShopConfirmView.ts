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

    // 打开购买确认信息界面，并等待确认
    public async open(player:Player, e:Elem, price:number) {
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
                var r2 = (<Relic>ElemFactory.create(r1.type)).toRelic(player);
                var lv = r1.reinforceLv + (<Relic>e).reinforceLv + 1;
                var maxLv = r1.attrs.reinforce.length;
                lv = lv > maxLv ? maxLv : lv;
                r2.setReinfoceLv(lv);
                this.createRelicUpgradeConfirm(r1, r2, price);
            }
        }

        return new Promise<boolean>((resolve, reject) => {
            this.onYes = () => resolve(true);
            this.onCancel = () => resolve(false);
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

    // 购买新遗物时的确认界面
    private createRelicUpgradeConfirm(r1:Relic, r2:Relic, price:number) {

        var objs = ViewUtils.createRelicUpgradeSubView(r1, r2);
        objs.forEach((obj, _) => this.addChild(obj));

        // 费用
        var cost = ViewUtils.createTextField(20, 0x000000);
        cost.textFlow = ViewUtils.fromHtml(ViewUtils.formatTip("costCoins", price.toString()));
        cost.width = this.width;
        cost.x = 0;
        cost.y = this.height - 350;
        this.addChild(cost);

        // 确定返回按钮
        var btnCancel = new TextButtonWithBg("goBack_png", 30);
        btnCancel.x = 50;
        btnCancel.y = this.height - btnCancel.height - 100;
        btnCancel.text = ViewUtils.getTipText("cancel");
        this.addChild(btnCancel);

        var btnYes = new TextButtonWithBg("goForward_png", 30);
        btnYes.x = this.width - btnYes.width - 50;
        btnYes.y = this.height - btnYes.height - 100;
        btnYes.text = ViewUtils.getTipText("yes");
        this.addChild(btnYes);

        btnYes.onClicked = () => this.onYes();
        btnCancel.onClicked = () => this.onCancel();
    }
}
