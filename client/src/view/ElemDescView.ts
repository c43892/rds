
// 元素描述界面，怪物，遗物和其它三类
class ElemDescView extends egret.DisplayObjectContainer {
    closeBtn:TextButtonWithBg; // 返回按钮
    bg:egret.Bitmap;
    doClose;
    uis = {};
    player:Player;

    constructor(w:number, h:number) {
        super();

        this.name = "elemDesc";
        this.width = w;
        this.height = h;

        this.uis["monster"] = this.buildMonsterDescView();
        this.uis["relic"] = this.buildRelicDescView();
        this.uis["item"] = this.buildItemDescView();

        // 背景压暗，点击不能穿透
        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.name = "bg";
        this.bg.x = this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;

        // 返回按钮
        this.closeBtn = new TextButtonWithBg("goBack_png", 30);
        this.closeBtn.name = "closeBtn";
        this.closeBtn.text = "返回";
        this.closeBtn.touchEnabled = true;
        this.closeBtn.onClicked = () => this.doClose();
    }

    public async open(e:Elem, withCancelBtn:boolean = true, defaultAttrs:boolean = false) {
        this.removeChildren();

        var uiArr = [];
        var refresh;
        if (e instanceof Monster) {
            uiArr = this.uis["monster"];
            refresh = (e) => this.refreshMonsterDesc(e, defaultAttrs);
        }
        else if (e instanceof Relic) {
            uiArr = this.uis["relic"];
            refresh = (e) => this.refreshRelicDesc(e, defaultAttrs);
        }
        else {
            uiArr = this.uis["item"];
            refresh = (e) => this.refreshItemDesc(e, defaultAttrs);
        }

        uiArr.unshift(this.bg);
        uiArr.push(this.closeBtn);
        uiArr.forEach((ui, _) => this.addChild(ui));
        ViewUtils.multiLang(this, ...uiArr);
        refresh(e);

        if (!withCancelBtn)
            this.removeChild(this.closeBtn);
        
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
    monsterName:egret.TextField;
    buildMonsterDescView() {
        this.monsterBg = ViewUtils.createBitmapByName("confirmBg_png");
        this.monsterBg.name = "monsterBg";
        this.monsterName = ViewUtils.createTextField(40, 0x7d0403);
        this.monsterName.name = "monsterName";
        this.monsterIcon = new egret.Bitmap();
        this.monsterIcon.name = "monsterIcon";
        
        this.powerBg = ViewUtils.createBitmapByName("attrsBgPower_png");
        this.powerBg.name = "powerBg";
        this.powerTxt = ViewUtils.createTextField(25, 0x000000, false);
        this.powerTxt.name = "powerTxt";
        this.hpBg = ViewUtils.createBitmapByName("attrsBgHp_png");
        this.hpBg.name = "hpBg";
        this.hpTxt = ViewUtils.createTextField(25, 0x000000, false);
        this.hpTxt.name = "hpTxt";
        this.moveRangeBg = ViewUtils.createBitmapByName("attrsBgMoveRange_png");
        this.moveRangeBg.name = "moveRangeBg";
        this.moveRangeTxt = ViewUtils.createTextField(25, 0x000000, false);
        this.moveRangeTxt.name = "moveRangeTxt";
        this.shieldBg = ViewUtils.createBitmapByName("attrsBgShield_png");
        this.shieldBg.name = "shieldBg";
        this.shieldTxt = ViewUtils.createTextField(25, 0x000000, false);
        this.shieldTxt.name = "shieldTxt";
        this.attackIntervalBg = ViewUtils.createBitmapByName("attrsBgAttackInterval_png");
        this.attackIntervalBg.name = "attackIntervalBg";
        this.attackIntervalTxt = ViewUtils.createTextField(25, 0x000000, false);
        this.attackIntervalTxt.name = "attackIntervalTxt";

        return [this.monsterBg, this.monsterName, this.monsterIcon, 
            this.powerBg, this.powerTxt, this.hpBg, this.hpTxt, this.moveRangeBg, this.moveRangeTxt,
            this.shieldBg, this.shieldTxt, this.attackIntervalBg, this.attackIntervalTxt];
    }

    refreshMonsterDesc(e:Elem, defaultAttrs:boolean = false) {
        var m = <Monster>e;
        ViewUtils.setTexName(this.monsterIcon, m.getElemImgRes() + "_png");

        var n = 1;
        var attrs = [];
        
        var power;
        if(!defaultAttrs){
            var powerABC = m.bt().calcMonsterAttackerAttrs(m).power;
            power = powerABC.b * (1 + powerABC.a) + powerABC.c;
        }
        else power = m.attrs.power;
        this.powerTxt.text = power ? m.attrs.power.toString() : 0;
        attrs.push(this.powerBg, this.powerTxt);
        n++;

        this.hpTxt.text = m.hp.toString();
        attrs.push(this.hpBg, this.hpTxt);
        n++;

        this.moveRangeTxt.text = m.attrs.moveRange ? m.attrs.moveRange.toString() : 0;
        attrs.push(this.moveRangeBg, this.moveRangeTxt);
        n++;

        if (m.shield > 0) {
            this.shieldTxt.text = m.shield.toString();
            attrs.push(this.shieldBg, this.shieldTxt);
            n++;
        } else {
            this.removeChild(this.shieldBg);
            this.removeChild(this.shieldTxt);
        }

        var attackInterval;
        if(!defaultAttrs) attackInterval = m.bt().calcMonsterAttackInterval(m);
        else attackInterval = m.attrs.attackInterva;        
        if (attackInterval > 0) {
            this.attackIntervalTxt.text = attackInterval.toString();
            attrs.push(this.attackIntervalBg, this.attackIntervalTxt);
            n++;
        } else {
            this.removeChild(this.attackIntervalBg);
            this.removeChild(this.attackIntervalTxt);
        }

        ViewUtils.multiLang(this, ...attrs);

        var descArr;
        if(e["Charmed"] == "normal"){
            var index = e.type.indexOf("Charmed");
            var type = e.type.substring(0 , index);
            this.monsterName.text = ViewUtils.getElemNameAndDesc(type).name;
            this.monsterName.bold = true;            
            descArr = ViewUtils.getElemNameAndDesc("CharmedNormal").desc;
        } else {
            var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);
            this.monsterName.text = nameAndDesc.name;
            descArr = nameAndDesc.desc;
        }

        descArr = Utils.map(descArr, (desc) => ViewUtils.fromHtml(ViewUtils.replaceByProperties(desc, e, defaultAttrs ? undefined : this.player)));

        // 第一组描述文字根据配置排版，后续的对齐第一组
        var monsterDescTxt0 = ViewUtils.createTextField(0, 0x000000);
        monsterDescTxt0.name = "monsterDesc0";
        monsterDescTxt0.textFlow = descArr[0];
        monsterDescTxt0.textAlign = egret.HorizontalAlign.LEFT;
        monsterDescTxt0.lineSpacing = 8;
        this.addChild(monsterDescTxt0);
        var bgFrame0 = ViewUtils.createBitmapByName("bgFrame_png");
        bgFrame0.name = "monsterDescBgFrame0";
        bgFrame0.scale9Grid = new egret.Rectangle(45, 45, 225, 1);
        this.addChild(bgFrame0);
        ViewUtils.multiLang(this, monsterDescTxt0, bgFrame0);

        var yInterval = 25;
        bgFrame0.height = monsterDescTxt0.height + 65;
        var currentY = bgFrame0.y + bgFrame0.height + yInterval;

        for (var i = 1; i < descArr.length; i++) {
            var txt = ViewUtils.createTextField(0, 0x000000);
            txt.textAlign = egret.HorizontalAlign.LEFT;
            txt.lineSpacing = 8;
            txt.textFlow = descArr[i];
            txt.x = monsterDescTxt0.x;
            txt.width = monsterDescTxt0.width;
            txt.y = currentY;
            this.addChild(txt);

            var bgFrame = ViewUtils.createBitmapByName("bgFrame_png");
            bgFrame.x = bgFrame0.x;
            bgFrame.width = bgFrame0.width;
            bgFrame.y = txt.y + bgFrame0.y - monsterDescTxt0.y;
            bgFrame.height = txt.height + 65;
            bgFrame.scale9Grid = new egret.Rectangle(45, 45, 225, 1);
            this.addChild(bgFrame);

            currentY = bgFrame.y + bgFrame.height + yInterval;
        }

        this.monsterBg.height = currentY - this.monsterBg.y + 70;
    }

    // 遗物，有头部（包含图标和名称等级描述），属性描述和变异描述三部分
    relicDescBg:egret.Bitmap; // 背景
    relicIcon:egret.Bitmap; // 图标
    relicName:egret.TextField; // 名称
    buildRelicDescView() {
        this.relicDescBg = ViewUtils.createBitmapByName("confirmBg_png");
        this.relicDescBg.name = "relicDescBg";
        this.relicIcon = new egret.Bitmap();
        this.relicIcon.name = "relicIcon";
        this.relicName = ViewUtils.createTextField(30, 0x200000, false, false);
        this.relicName.name = "relicName";
        return [this.relicDescBg, this.relicIcon, this.relicName];
    }

    refreshRelicDesc(e:Elem, defaultAttrs:boolean = false) {
        ViewUtils.setTexName(this.relicIcon, e.getElemImgRes() + "_png");
        // 添加遗物等级星星
        var stars = ViewUtils.createRelicLevelStars(<Relic>e, this.relicIcon);
        stars.forEach((star, _) => this.addChild(star));
        
        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);
        this.relicName.textAlign = egret.HorizontalAlign.LEFT;
        this.relicName.bold =true;
        this.relicName.textFlow = [{text: nameAndDesc.name, style:{"textColor":0x7d0403, "size":30}},
           // {text: " Lv " + ((<Relic>e).reinforceLv + 1), style:{"textColor":0x7d0403, "size":30}}
            ];

        var descArr = ViewUtils.getElemNameAndDesc(e.type).desc;
        descArr = Utils.map(descArr, (desc) => ViewUtils.fromHtml(ViewUtils.replaceByProperties(desc, e, defaultAttrs ? undefined : this.player)));

        // 第一组描述文字根据配置排版，后续的对齐第一组
        var relicDescTxt0 = ViewUtils.createTextField(0, 0x000000);
        relicDescTxt0.name = "relicDesc0";
        relicDescTxt0.textFlow = descArr[0];
        relicDescTxt0.textAlign = egret.HorizontalAlign.LEFT;
        relicDescTxt0.lineSpacing = 8;
        this.addChild(relicDescTxt0);
        var bgFrame0 = ViewUtils.createBitmapByName("bgFrame_png");
        bgFrame0.name = "relicDescBgFrame0";
        bgFrame0.scale9Grid = new egret.Rectangle(45, 45, 225, 1);
        this.addChild(bgFrame0);
        ViewUtils.multiLang(this, relicDescTxt0, bgFrame0);

        var yInterval = 25;
        bgFrame0.height = relicDescTxt0.height + 65;
        var currentY = bgFrame0.y + bgFrame0.height + yInterval;

        for (var i = 1; i < descArr.length; i++) {
            var txt = ViewUtils.createTextField(0, 0x000000);
            txt.textAlign = egret.HorizontalAlign.LEFT;
            txt.lineSpacing = 8;
            txt.textFlow = descArr[i];
            txt.x = relicDescTxt0.x;
            txt.width = relicDescTxt0.width;
            txt.y = currentY;
            this.addChild(txt);

            var bgFrame = ViewUtils.createBitmapByName("bgFrame_png");
            bgFrame.x = bgFrame0.x;
            bgFrame.width = bgFrame0.width;
            bgFrame.y = txt.y + bgFrame0.y - relicDescTxt0.y;
            bgFrame.height = txt.height + 65;
            bgFrame.scale9Grid = new egret.Rectangle(45, 45, 225, 1);
            this.addChild(bgFrame);

            currentY = bgFrame.y + bgFrame.height + yInterval;
        }

        this.relicDescBg.height = currentY - this.relicDescBg.y + 70;
    }
    
    // 物品只有名称和简单文字描述两部分
    itemDescBg:egret.Bitmap; // 背景
    itemIcon:egret.Bitmap; // 物品图标
    itemName:egret.TextField; // 名称
    itemDesc:egret.TextField; // 描述
    buildItemDescView() {
        this.itemDescBg = ViewUtils.createBitmapByName("confirmBg_png");
        this.itemDescBg.name = "itemDescBg";
        this.itemIcon = new egret.Bitmap();
        this.itemIcon.name = "itemIcon";
        this.itemName = ViewUtils.createTextField(30, 0x7d0403);
        this.itemName.name = "itemName";
        this.itemName.textAlign = egret.HorizontalAlign.LEFT;
        this.itemDesc = ViewUtils.createTextField(18, 0x000000);
        this.itemDesc.name = "itemDesc";
        return [this.itemDescBg, this.itemIcon, this.itemName, this.itemDesc];
    }

    refreshItemDesc(e:Elem, defaultAttrs:boolean = false) {
        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);
        this.itemName.text = nameAndDesc.name;
        var txt = ViewUtils.replaceByProperties(nameAndDesc.desc[0], e, defaultAttrs ? undefined : this.player);
        this.itemDesc.textFlow = ViewUtils.fromHtml(txt);
        ViewUtils.setTexName(this.itemIcon, e.getElemImgRes() + "_png");
    }

    onClose(evt:egret.TouchEvent) {
        this.doClose();
    }
}