// 战斗中新出怪物提示
class NewMonsterTipView extends egret.DisplayObjectContainer {

    public showElemDesc;
    public closeElemDesc;

    mapView:MapView;
    newMonsterTipsData:string[];
    readonly LOCAL_DATA_KEY = "NewMonsterTip";
    btnNext:TextButtonWithBg;
    public constructor(w, h, bv:BattleView) {
        super();
        this.width = w;
        this.height = h;
        this.mapView = bv.mapView;
        this.newMonsterTipsData = Utils.loadLocalData(this.LOCAL_DATA_KEY);
        if (!this.newMonsterTipsData)
            this.newMonsterTipsData = [];

        this.numTxt = ViewUtils.createTextField(25, 0xffffff);
        this.btnNext = new TextButtonWithBg("btnBg_png", 30);
        this.btnNext.onClicked = () => this.onNext();
    }

    // 怪物提示列表
    monsterArr:string[] = [];
    monsterTipArr:egret.DisplayObjectContainer[] = [];
    numTxt:egret.TextField;

    // 添加一个怪物类型等待显示
    public tryAddNewMonsterTip(m:Monster) {
        if (Utils.contains(this.newMonsterTipsData, m.type))
            return;

        this.newMonsterTipsData.push(m.type);
        this.monsterArr.push(m.type);
        var tip = new egret.DisplayObjectContainer();
        tip["monsterType"] = m.type;
        tip["monster"] = m;

        var bg = ViewUtils.createBitmapByName("newMonsterTipBg_png");
        tip.addChild(bg);
        tip.width = bg.width;
        tip.height = bg.height;
        
        var img = ViewUtils.createBitmapByName(m.getElemImgRes() + "_png");
        img.width = img.height = 60;
        img.x = (tip.width - img.width) / 2;
        img.y = tip.height - img.height - 12;
        tip.addChild(img);

        this.monsterTipArr.push(tip);
        tip.touchEnabled = true;
        tip.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTapTipImg, this);

        this.addChild(tip);
        var refPos = this.mapView.localToGlobal();

        tip.x = refPos.x + this.mapView.width - tip.width;
        tip.y = refPos.y - tip.height - 5;
        this.setChildIndex(tip, -1);

        this.numTxt.text = "X" + this.monsterArr.length.toString();
        this.numTxt.x = tip.x + tip.width - this.numTxt.width - 10;
        this.numTxt.y = tip.y + tip.height - this.numTxt.height - 10;
        this.addChild(this.numTxt);
        this.setChildIndex(this.numTxt, -1);

        return tip;
    }

    onTapTipImg(evt:egret.TouchEvent) {
        var tip = this.monsterTipArr.pop();
        Utils.assert(tip == evt.target, "tips array gets corruption");

        var mType = tip["monsterType"];
        var type = this.monsterArr.pop();
        Utils.assert(mType == type, "tips array gets corruption");

        this.showDesc(tip);
    }

    onNext() {
        if (this.monsterTipArr.length > 0) {
            var tip = this.monsterTipArr.pop();
            var mType = tip["monsterType"];
            var type = this.monsterArr.pop();
            Utils.assert(mType == type, "tips array gets corruption");
            this.showDesc(tip);
        } else {
            this.closeElemDesc();
            this.clear();
        }
    }

    showDesc(tip) {
        this.removeChild(tip);

        // 显示怪物信息
        var m = tip["monster"];
        this.showElemDesc(m);

        if (this.monsterTipArr.length > 0) {
            tip = this.monsterTipArr[this.monsterTipArr.length - 1];
            this.numTxt.text = "X" + this.monsterTipArr.length.toString();
        } else {
            this.removeChild(this.numTxt);
        }

        if (!this.contains(this.btnNext))
            this.addChild(this.btnNext);

        this.btnNext.width = 150;
        this.btnNext.text = ViewUtils.getTipText(
            this.monsterTipArr.length > 0 ? "nextOne" : "close");
        this.btnNext.x = this.width - this.btnNext.width - 50;
        this.btnNext.y = this.height - this.btnNext.height - 100;
        this.btnNext.refresh();
    }

    public async onGridChanged(ps) {
        if (ps.subType != "gridUncovered" && ps.subType != "elemMarked")
            return;

        var g = this.mapView.getGridViewAt(ps.x, ps.y);
        var m = g.getElem();
        if (!(m instanceof Monster))
            return;

        var tip = this.tryAddNewMonsterTip(m);
        if (tip)
            await AniUtils.flash(tip, 300);
    }

    public clear() {
        this.removeChildren();
    }
}