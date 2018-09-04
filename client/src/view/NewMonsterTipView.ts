// 战斗中新出怪物提示
class NewMonsterTipView extends egret.DisplayObjectContainer {

    public showElemDesc;

    mapView:MapView;
    newMonsterTipsData:string[];
    readonly LOCAL_DATA_KEY = "NewMonsterTip";
    public constructor(w, h, bv:BattleView) {
        super();
        this.width = w;
        this.height = h;
        this.mapView = bv.mapView;
        this.newMonsterTipsData = Utils.loadLocalData(this.LOCAL_DATA_KEY);
        if (!this.newMonsterTipsData)
            this.newMonsterTipsData = [];

        this.numTxt = ViewUtils.createTextField(30, 0xffffff);
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
        tip.addChild(img);

        this.monsterTipArr.push(tip);
        tip.touchEnabled = true;
        tip.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTapTipImg, this);

        this.addChild(tip);
        var refPos = this.mapView.localToGlobal();

        tip.x = refPos.x + this.mapView.width - tip.width;
        tip.y = refPos.y - 50;
        this.setChildIndex(tip, -1);

        this.numTxt.text = "X" + this.monsterArr.length.toString();
        this.numTxt.x = tip.x + tip.width - this.numTxt.width - 20;
        this.numTxt.y = tip.y + tip.height - this.numTxt.height - 20;
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
}