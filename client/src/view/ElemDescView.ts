
// 元素描述界面，怪物，遗物和其它三类
class ElemDescView extends egret.DisplayObjectContainer {
    closeBtn:TextButtonWithBg; // 返回按钮
    bg:egret.Bitmap;
    doClose;
    uis = {};

    constructor(w:number, h:number) {
        super();

        this.name = "elemDesc";
        this.width = w;
        this.height = h;

        this.uis["monster"] = this.buildMonsterDescView();
        this.uis["relic"] = this.buildRelicDescView();
        this.uis["item"] = this.buildItemDescView();

        // 背景压暗，点击不能穿透
        this.bg = ViewUtils.createBitmapByName("bg_png");
        this.bg.name = "bg";
        this.bg.x = this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;

        // 返回按钮
        this.closeBtn = new TextButtonWithBg(30, 0x000000, "btnBg_png");
        this.closeBtn.name = "closeBtn";
        this.closeBtn.text = "返回";
        this.closeBtn.refresh();
        this.closeBtn.touchEnabled = true;
        this.closeBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClose, this);
    }

    public async open(e:Elem) {
        this.removeChildren();

        var uiArr = [];
        var refresh;
        if (e instanceof Monster) {
            uiArr = this.uis["monster"];
        }
        else if (e instanceof Relic) {
            uiArr = this.uis["relic"];
        }
        else {
            uiArr = this.uis["item"];
            refresh = (e) => this.refreshItemDesc(e);
        }

        uiArr.unshift(this.bg);
        uiArr.push(this.closeBtn);
        for (var ui of uiArr)
            this.addChild(ui);

        refresh(e);
        ViewUtils.multiLang(this, ...uiArr);

        return new Promise((resolve, reject) => {
            this.doClose = resolve;
        });
    }

    // 怪物，有头部（包含图标和基本属性值），多条属性描述
    buildMonsterDescView() {

    }

    // 遗物，有头部（包含图标和名称等级描述），属性描述和变异描述三部分
    buildRelicDescView() {

    }
    
    // 物品只有名称和简单文字描述两部分
    itemDescBg:egret.Bitmap; // 背景
    itemName:egret.TextField; // 名称
    itemDesc:egret.TextField; // 描述
    buildItemDescView() {
        this.itemDescBg = ViewUtils.createBitmapByName("translucent_png");
        this.itemDescBg.name = "itemDescBg";
        this.itemName = ViewUtils.createTextField(30, 0xff0000);
        this.itemName.name = "itemName";
        this.itemDesc = ViewUtils.createTextField(18, 0x000000);
        this.itemDesc.name = "itemDesc";
        return [this.itemDescBg, this.itemName, this.itemDesc];
    }

    refreshItemDesc(e:Elem) {
        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);
        this.itemName.text = nameAndDesc.name;
        this.itemDesc.text = ViewUtils.replaceByProperties(nameAndDesc.desc, e);
    }

    onClose(evt:egret.TouchEvent) {
        this.doClose();
    }
}