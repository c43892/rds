class TurntableView extends egret.DisplayObjectContainer {
    public player:Player;
    
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private rewards:egret.DisplayObjectContainer; //奖励内容
    private rewardsBg:egret.Bitmap;
    private startBtn:TextButtonWithBg;
    private pointer:egret.Bitmap;
    private goOutBtn:TextButtonWithBg;
    private imgs:egret.Bitmap[] = []; //候选奖励
    private rewardCount = 6;
    private tipBg:egret.Bitmap;
    private tipContent:egret.TextField;

    public constructor(w:number, h:number){
        super();
        this.width = w;
        this.height = h;
        this.name = "turntable";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.addChild(this.bg);
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;

        this.bg1 = ViewUtils.createBitmapByName("turntableBg_png");
        this.bg1.name = "bg1";
        
        this.rewards = new egret.DisplayObjectContainer;
        this.rewards.name = "rewards";
        this.rewards.anchorOffsetX = this.rewards.anchorOffsetY = 268;

        this.rewardsBg = ViewUtils.createBitmapByName("rewardsBg_png");
        this.rewardsBg.name = "rewardsBg";
        this.rewards.addChild(this.rewardsBg);

        //奖励物品的Bitmap
        for(var i = 0; i < this.rewardCount; i++){
            var img = new egret.Bitmap();
            this.imgs.push(img);
            this.rewards.addChild(this.imgs[i]);
        }

        this.startBtn = new TextButtonWithBg("turntableStartBtn_png");
        this.startBtn.setDisableBg("turntableStartBtn2_png");
        this.startBtn.name = "startBtn";
        this.startBtn.anchorOffsetX = this.startBtn.width / 2;
        this.startBtn.anchorOffsetY = this.startBtn.height / 2;
        this.startBtn.onClicked = () => this.onStart();

        this.pointer = ViewUtils.createBitmapByName("pointer_png");
        this.pointer.name = "pointer";
        this.pointer.anchorOffsetX = this.pointer.width / 2;
        this.pointer.anchorOffsetY = this.pointer.height / 2;

        this.tipBg = ViewUtils.createBitmapByName("confirmBg_png");
        this.tipBg.name = "tipBg";

        this.tipContent = ViewUtils.createTextField(30, 0x000000);
        this.tipContent.name = "tipContent";

        this.goOutBtn = new TextButtonWithBg("turntableGoOutBtn_png");
        this.goOutBtn.name = "goOutBtn";
        this.goOutBtn.onClicked = () => this.doClsoe();

        var objs = [this.bg1, this.rewards, this.pointer, this.startBtn, this.tipBg, this.tipContent, this.goOutBtn];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    private doClsoe;

    // 打开转盘界面
    public async open():Promise<void> {
        this.refresh();
        
        var cfg = this.player.worldmap.cfg.turntable;
        var xOrigin = this.rewardsBg.x + this.rewardsBg.width / 2;
        var yOrigin = this.rewardsBg.y + this.rewardsBg.height / 2;
        
        // 根据奖励内容获取对应Bitmap并调整其位置
        for(var i = 0; i < this.rewardCount; i++){
            var type = cfg[i].type;
            switch(type){
                case "+hp":
                this.imgs[i] = ViewUtils.setTexName(this.imgs[i], "turntableAddHp_png");
                break;
                case "-hp":
                this.imgs[i] = ViewUtils.setTexName(this.imgs[i], "turntableMinusHp_png");
                break;
                case "box":
                this.imgs[i] = ViewUtils.setTexName(this.imgs[i], "TreasureBox_png");
                break;
                case "coins":
                this.imgs[i] = ViewUtils.setTexName(this.imgs[i], "Coins9_png");
                break;
                case "item":
                var rdp = GCfg.getRandomDropGroupCfg(cfg[i].attrs);
                var dropItem = Utils.randomSelectByWeightWithPlayerFilter(this.player, rdp.elems, new SRandom, 1, 2, false)[0];
                this.imgs[i] = ViewUtils.setTexName(this.imgs[i], dropItem + "_png");
                break;
            }
            this.imgs[i].x = xOrigin + 160 * Math.cos(i * 2 * Math.PI / this.rewardCount + 0.5 * Math.PI);
            this.imgs[i].y = yOrigin - 160 * Math.sin(i * 2 * Math.PI / this.rewardCount + 0.5 * Math.PI);
            this.imgs[i].rotation = - 360 / this.rewardCount * i;
            this.imgs[i].anchorOffsetX = this.imgs[i].width / 2;
            this.imgs[i].anchorOffsetY = this.imgs[i].height / 2;
            this.imgs[i]["type"] = type;
            if(type != "item")
                this.imgs[i]["attrs"] = cfg[i].attrs;
            else
                this.imgs[i]["attrs"] = dropItem;

            this.imgs[i]["weight"] = cfg.weight;
            this.rewards.addChild(this.imgs[i]);
        }

        return new Promise<void>((resolve, reject) => this.doClsoe = resolve);
    }

    // 刷新界面,重置开始按钮,去掉前进按钮,重置奖励轮盘
    private refresh(){    
        this.changeStartbtnStatus("init");
        this.removeChild(this.goOutBtn);
        this.removeChild(this.tipBg);
        this.removeChild(this.tipContent);
        for(var i = 0; i < this.rewardCount; i++){
            this.rewards.removeChild(this.imgs[i]);
        }
        this.rewards.rotation = 0;
    }

    // 转动转盘,获取随机奖励
    private onStart(){
        this.changeStartbtnStatus("used");
        var cfg = this.player.worldmap.cfg.turntable;
        var randomIndex = this.getRandomIndexByWeight(cfg);

        var rotateAngels = (randomIndex * 60  + 3600 );// 所需旋转角度,额外加十圈,角度单位

                // 将奖励添加到角色身上
        var award = this.imgs[randomIndex];
        switch(award["type"]){
                case "+hp":
                var hpBefore = this.player.hp;
                this.player.addHp(Math.round(this.player.hp * award["attrs"] / 100));
                this.tipContent.text = "恭喜你恢复了" +  (this.player.hp - hpBefore) + "点生命值.";
                break;
                case "-hp":
                var hpBefore = this.player.hp;
                this.player.addHp(Math.round(this.player.hp * award["attrs"] / 100));
                this.tipContent.text = "很不幸你失去了" +  (hpBefore - this.player.hp) + "点生命值.";
                break;
                case "box":
                var rdp = GCfg.getRandomDropGroupCfg(award["attrs"]);
                var dropItem = Utils.randomSelectByWeightWithPlayerFilter(this.player, rdp.elems, this.player.playerRandom, 1, 2, false)[0];
                var e = ElemFactory.create(dropItem);
                this.player.addItem(e);
                this.tipContent.text = "恭喜你,在宝箱中得到了" + dropItem + ".";
                break;
                case "coins":
                this.player.addMoney(award["attrs"]);                
                this.tipContent.text = "恭喜你获得了" + award["attrs"] + "金币.";
                break;
                case "item":
                var e = ElemFactory.create(award["attrs"]);
                this.player.addItem(e);
                this.tipContent.text = "恭喜你获得了" + award["attrs"];
                break;
            }

        var rr = egret.Tween.get(this.rewards, {loop:false});
        // 3秒动画后出现前进按钮W
        rr.to({rotation:rotateAngels}, 3000, egret.Ease.circInOut).call(this.fff);
    }

    private fff():any {
        this.addChild(this.tipBg);
        this.addChild(this.tipContent);
        this.addChild(this.goOutBtn);
    }

    // 根据配置的物品和权重随机奖励内容的索引
    private getRandomIndexByWeight(cfg):number{
        var totalWeight = 0;
        for(var i = 0; i < cfg.length; i++){
            totalWeight += cfg[i].weight;
        }
        var rand = new SRandom;
        var r = rand.nextInt(0, totalWeight);
        var tempWeight = 0;
        for(var j = 0; j < cfg.length; j++){
            tempWeight += cfg[j].weight;
            if(r < tempWeight)
            break;

        }
    return j;
    }

    changeStartbtnStatus(type:string){
        if(type == "init")
            this.startBtn.enabled = true;        
        else if(type == "used")
            this.startBtn.enabled = false;
        
    }
}