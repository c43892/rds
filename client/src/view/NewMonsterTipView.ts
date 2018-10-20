// 战斗中新出怪物提示
class NewMonsterTipView extends egret.DisplayObjectContainer {
    bt:Battle;
    mapView:MapView;
    elemDescView:ElemDescView;
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

        this.btnNext = new TextButtonWithBg("goForward_png", 30);
        this.btnNext.onClicked = () => this.onNext();
        this.elemDescView = new ElemDescView(w, h);

        this.monsterTip = new egret.DisplayObjectContainer();
        var tip = this.monsterTip;
        tip.touchEnabled = true;
        tip.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTapTipImg, this);

        var bg = ViewUtils.createBitmapByName("newMonsterTipBg_png");
        tip.addChild(bg);
        tip.width = bg.width;
        tip.height = bg.height;
        tip.anchorOffsetX = tip.width / 2;
        tip.anchorOffsetY = 0;

        this.tipImg = new egret.Bitmap();
        this.tipImg.width = this.tipImg.height = 60;
        this.tipImg.x = (tip.width - this.tipImg.width) / 2;
        this.tipImg.y = tip.height - this.tipImg.height - 12;
        tip.addChild(this.tipImg);

        this.numTxt = ViewUtils.createTextField(25, 0xffffff);
        tip.addChild(this.numTxt);
    }

    // 怪物提示列表
    monsterArr:string[] = [];
    monsterResArr:string[] = [];
    monsterTip:egret.DisplayObjectContainer;
    tipImg:egret.Bitmap;
    numTxt:egret.TextField;

    public setBattle(bt:Battle) {
        this.bt = bt;
    }

    // 添加一个怪物类型等待显示
    public tryAddNewMonsterTip(m:Monster) {
        if (Utils.contains(this.newMonsterTipsData, m.type) || m.attrs.invisible)
            return;

        if (m.isBoss) { // boss 直接出详细界面
            var av = <AniView>AniUtils.ac;
            av.addBlockLayer();
            AniUtils.delay(500).then(() => {
                GridView.showElemDesc(m);
                this.newMonsterTipsData.push(m.type);
                Utils.saveLocalData(this.LOCAL_DATA_KEY, this.newMonsterTipsData);
                AniUtils.shakeCamera(2, 100);
                av.decBlockLayer();
            });

            return;
        }

        this.newMonsterTipsData.push(m.type);
        this.monsterArr.push(m.type);
        this.monsterResArr.push(m.getElemImgRes());
        var tip = this.monsterTip;
        ViewUtils.setTexName(this.tipImg, m.getElemImgRes() + "_png");
        
        var refPos = AniUtils.ani2global(this.mapView);
        tip.x = refPos.x + this.mapView.width - tip.width + tip.$anchorOffsetX + 10;
        tip.y = refPos.y - tip.height - 5 + tip.$anchorOffsetY;

        if (this.monsterArr.length == 1) { // 新飞出来的第一个
            this.addChild(tip);
            this.numTxt.alpha = 0;

            // 制作飞行动画
            AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
                {type:"tr", fx:tip.x + 100, tx:tip.x, time:100, mode:egret.Ease.cubicIn},
                {type:"tr", fr:0, tr:10, time:150, mode:egret.Ease.cubicOut},
                {type:"tr", fr:10, tr:-10, time:500, mode:egret.Ease.cubicInOut},
                {type:"tr", fr:-10, tr:0, time:250, mode:egret.Ease.cubicInOut},
            ], obj:tip, noWait:true});
            AniUtils.shakeCamera(2, 100);
        }
        else { // 叠加在现有的上面
            this.numTxt.text = "X" + this.monsterArr.length.toString();
            this.numTxt.x = tip.width - this.numTxt.width - 10;
            this.numTxt.y = tip.height - this.numTxt.height - 10;
            this.numTxt.alpha = 1;
        }
    }

    onTapTipImg(evt:egret.TouchEvent) {
        var type = this.monsterArr.pop();
        var res = this.monsterResArr.pop();
        this.showDesc(type);
    }

    onNext() {
        if (this.monsterArr.length > 0) {
            var type = this.monsterArr.pop();
            var res = this.monsterResArr.pop();
            this.showDesc(type);
        } else {
            this.removeChild(this.elemDescView);
            this.clear();
        }
    }

    showDesc(monsterType) {
        Utils.saveLocalData(this.LOCAL_DATA_KEY, this.newMonsterTipsData);

        // 显示怪物信息
        var m = <Monster>this.bt.level.createElem(monsterType);

        if (!this.contains(this.elemDescView)) {
            this.addChild(this.elemDescView);
            this.setChildIndex(this.elemDescView, 0);
        }

        this.elemDescView.open(m, undefined, true);

        if (this.monsterArr.length > 1)
            this.numTxt.text = "X" + this.monsterArr.length.toString();
        else
            this.numTxt.alpha = 0;

        if (this.monsterArr.length == 0)
            this.removeChild(this.monsterTip);
        else
            ViewUtils.setTexName(this.tipImg, this.monsterResArr[this.monsterResArr.length - 1] + "_png");

        if (!this.contains(this.btnNext))
            this.addChild(this.btnNext);

        this.btnNext.text = ViewUtils.getTipText(this.monsterArr.length > 0 ? "nextOne" : "close");
        this.btnNext.x = 417;
        this.btnNext.y = 960;
        this.btnNext.refresh();
    }

    // public onAttacked(ps) {
    //     if (ps.subType != "monster2targets")
    //         return;

    //     var m:Monster = ps.attackerAttrs.owner;
    //     if (!m || !m.isBoss || Utils.contains(this.newMonsterTipsData, m.type) || m.attrs.invisible)
    //         return;

    //     GridView.showElemDesc(m);
    //     this.newMonsterTipsData.push(m.type);
    //     Utils.saveLocalData(this.LOCAL_DATA_KEY, this.newMonsterTipsData);
    // }

    public onGridChanged(ps) {
        if (ps.subType != "gridUncovered" && ps.subType != "elemMarked")
            return;

        var g = this.mapView.getGridViewAt(ps.x, ps.y);
        var m = g.getElem();
        if (!(m instanceof Monster))
            return;

        if(m.attrs.noNewMonsterTip)
            return;

        this.tryAddNewMonsterTip(m);
    }

    public clear() {
        this.removeChildren();
    }
}