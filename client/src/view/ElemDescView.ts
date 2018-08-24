
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
        this.bg = ViewUtils.createBitmapByName("black_png");
        this.bg.name = "bg";
        this.bg.x = this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;

        // 返回按钮
        this.closeBtn = new TextButtonWithBg("btnBg_png", 30);
        this.closeBtn.name = "closeBtn";
        this.closeBtn.text = "返回";
        this.closeBtn.touchEnabled = true;
        this.closeBtn.onClicked = () => this.doClose();
    }

    public async open(e:Elem) {
        this.removeChildren();

        var uiArr = [];
        var refresh;
        if (e instanceof Monster) {
            uiArr = this.uis["monster"];
            refresh = (e) => this.refreshMonsterDesc(e);
        }
        else if (e instanceof Relic) {
            uiArr = this.uis["relic"];
            refresh = (e) => this.refreshRelicDesc(e);
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
    monsterBg:egret.Bitmap; // 背景
    monsterIcon:egret.Bitmap; // 怪物头像
    powerBg:egret.Bitmap;
    powerTxt:egret.TextField;
    hpBg:egret.Bitmap;
    hpTxt:egret.TextField;
    moveRangeBg:egret.Bitmap;
    moveRangeTxt:egret.TextField;
    shieldBg:egret.Bitmap;
    shieldTxt:egret.TextField;
    attackIntervalBg:egret.Bitmap;
    attackIntervalTxt:egret.TextField;
    monsterDesc:egret.TextField;
    monsterName:egret.TextField;
    buildMonsterDescView() {
        this.monsterBg = ViewUtils.createBitmapByName("translucent_png");
        this.monsterBg.name = "monsterBg";
        this.monsterName = ViewUtils.createTextField(40, 0x00ffff);
        this.monsterName.name = "monsterName";
        this.monsterIcon = new egret.Bitmap();
        this.monsterIcon.name = "monsterIcon";
        
        this.powerBg = ViewUtils.createBitmapByName("monsterPowerBg_png");
        this.powerTxt = ViewUtils.createTextField(25, 0xff0000, false);
        this.hpBg = ViewUtils.createBitmapByName("monsterHpBg_png");
        this.hpTxt = ViewUtils.createTextField(25, 0xffff00, false);
        this.moveRangeBg = ViewUtils.createBitmapByName("monsterMoveRangeBg_png");
        this.moveRangeTxt = ViewUtils.createTextField(25, 0x0000ff, false);
        this.shieldBg = ViewUtils.createBitmapByName("monsterShieldBg_png");
        this.shieldTxt = ViewUtils.createTextField(25, 0x0000ff, false);
        this.attackIntervalBg = ViewUtils.createBitmapByName("monsterAttackIntervalBg_png");
        this.attackIntervalTxt = ViewUtils.createTextField(25, 0x0000ff, false);

        this.monsterDesc = ViewUtils.createTextField(25, 0x000000, false, false);
        this.monsterDesc.name = "monsterDesc";

        return [this.monsterBg, this.monsterName, this.monsterIcon, this.monsterDesc];
    }

    refreshMonsterDesc(e:Elem) {
        var m = <Monster>e;
        ViewUtils.setTexName(this.monsterIcon, m.getElemImgRes() + "_png");

        var n = 1;
        var attrs = [];        
        if (m.attrs.power){
            this.powerTxt.text = m.attrs.power.toString();
            this.powerTxt.name = "attrtxt" + n;
            this.powerBg.name = "attrbg" + n;
            attrs.push(this.powerBg, this.powerTxt);
            n++;
        }

        this.hpTxt.text = m.hp.toString();
        this.hpTxt.name = "attrtxt" + n;
        this.hpBg.name = "attrbg" + n;
        attrs.push(this.hpBg, this.hpTxt);
        n++;

        if (m.attrs.moveRange > 0) {
            this.moveRangeTxt.text = m.attrs.moveRange.toString();
            this.moveRangeTxt.name = "attrtxt" + n;
            this.moveRangeBg.name = "attrbg" + n;
            attrs.push(this.moveRangeBg, this.moveRangeTxt);
            n++;
        }

        if (m.shield > 0) {
            this.shieldTxt.text = m.shield.toString();
            this.shieldTxt.name = "attrtxt" + n;
            this.shieldBg.name = "attrbg" + n;
            attrs.push(this.shieldBg, this.shieldTxt);
            n++;
        }

        if (m.attrs.attackInterval > 0) {
            this.attackIntervalTxt.text = m.attrs.attackInterval.toString();
            this.attackIntervalTxt.name = "attrtxt" + n;
            this.attackIntervalBg.name = "attrbg" + n;
            attrs.push(this.attackIntervalBg, this.attackIntervalTxt);
            n++;
        }

        for (var ui of attrs)
            this.addChild(ui);

        ViewUtils.multiLang(this, ...attrs);

        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);
        this.monsterName.text = nameAndDesc.name;
        var txt = ViewUtils.replaceByProperties(nameAndDesc.desc, e);
        this.monsterDesc.textFlow = ViewUtils.fromHtml(txt);
    }

    // 遗物，有头部（包含图标和名称等级描述），属性描述和变异描述三部分
    relicDescBg:egret.Bitmap; // 背景
    relicIcon:egret.Bitmap; // 图标
    relicName:egret.TextField; // 名称
    relicDesc:egret.TextField; // 描述
    buildRelicDescView() {
        this.relicDescBg = ViewUtils.createBitmapByName("translucent_png");
        this.relicDescBg.name = "relicDescBg";
        this.relicIcon = new egret.Bitmap();
        this.relicIcon.name = "relicIcon";
        this.relicName = ViewUtils.createTextField(30, 0xff0000, false, false);
        this.relicName.name = "relicName";
        this.relicDesc = ViewUtils.createTextField(18, 0xff0000, false, false);
        this.relicDesc.name = "relicDesc";
        return [this.relicDescBg, this.relicIcon, this.relicName, this.relicDesc];
    }

    refreshRelicDesc(e:Elem) {
        ViewUtils.setTexName(this.relicIcon, e.getElemImgRes() + "_png");
        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);
        this.relicName.textFlow = [{text: nameAndDesc.name, style:{"textColor":0xff0000, "size":30}},
            {text: " Lv " + ((<Relic>e).reinforceLv + 1), style:{"textColor":0xff0000, "size":30}}];

        var txt = ViewUtils.replaceByProperties(nameAndDesc.desc, e);
        this.relicDesc.textFlow = ViewUtils.fromHtml(txt);
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
        var txt = ViewUtils.replaceByProperties(nameAndDesc.desc, e);
        this.itemDesc.textFlow = ViewUtils.fromHtml(txt);
    }

    onClose(evt:egret.TouchEvent) {
        this.doClose();
    }
}