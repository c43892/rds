class TurntableView extends egret.DisplayObjectContainer {
    public player:Player;
    
    private bg:egret.Bitmap;
    private rewards:egret.DisplayObjectContainer; //奖励内容
    private startBtn:egret.Bitmap;
    private goOutBtn:egret.Bitmap;
    private imgs:egret.Bitmap[] = []; //候选奖励
    private rewardCount = 6;
    private sign:egret.Bitmap;
    private tipBg:egret.Bitmap;
    private tipContent:egret.TextField;

    public constructor(w:number, h:number){
        super();
        this.width = w;
        this.height = h;
        this.touchEnabled = true;

        this.bg = ViewUtils.createBitmapByName("turntableBg_png");
        this.addChild(this.bg);
        this.bg.x = (this.width - this.bg.width) / 2;
        this.bg.y = (this.height - this.bg.height) / 2;

        this.sign = ViewUtils.createBitmapByName("turntableSign_png");
        this.sign.x = this.bg.x;
        this.sign.y = this.bg.y;
        
        this.rewards = new egret.DisplayObjectContainer;
        this.addChild(this.rewards);
        this.rewards.x = this.bg.x + this.bg.width / 2;
        this.rewards.y = this.bg.y + this.bg.height / 2;
        this.rewards.width = this.bg.width;
        this.rewards.height = this.bg.height;
        this.rewards.anchorOffsetX = this.rewards.width / 2;
        this.rewards.anchorOffsetY = this.rewards.height / 2;
        this.rewards.width = this.bg.width;
        this.rewards.height = this.bg.height;

        //奖励物品的Bitmap
        for(var i = 0; i < this.rewardCount; i++){
            var img = new egret.Bitmap;
            this.imgs.push(img);
            this.rewards.addChild(this.imgs[i]);
        }

        this.startBtn = ViewUtils.createBitmapByName("turntableStartBtn_png");
        this.addChild(this.startBtn);
        this.startBtn.x = this.bg.x + this.bg.width / 2;
        this.startBtn.y = this.bg.y + this.bg.height / 2;
        this.startBtn.anchorOffsetX = this.startBtn.width / 2;
        this.startBtn.anchorOffsetY = this.startBtn.height / 2;
        this.startBtn.touchEnabled = true;
        this.startBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onStart, this);

        this.tipBg = ViewUtils.createBitmapByName("turntableTipBg_png");
        this.tipBg.x = this.bg.x + this.bg.width / 2;
        this.tipBg.y = this.bg.y + this.bg.height / 2;
        this.tipBg.anchorOffsetX = this.tipBg.width / 2;
        this.tipBg.anchorOffsetY = this.tipBg.height / 2;
        this.addChild(this.tipBg);

        this.tipContent = new egret.TextField;
        this.tipContent.x = this.bg.x + this.bg.width / 2;
        this.tipContent.y = this.bg.y + this.bg.height / 2;
        this.tipContent.width = this.tipBg.width - 100;
        this.tipContent.height = this.tipBg.height;
        this.tipContent.anchorOffsetX = this.tipContent.width / 2;
        this.tipContent.anchorOffsetY = this.tipContent.height / 2;
        this.tipContent.textColor = 0X000000;
        this.tipContent.size = 30;
        this.tipContent.textAlign = egret.HorizontalAlign.CENTER;
        this.tipContent.verticalAlign = egret.VerticalAlign.MIDDLE;
        this.addChild(this.tipContent);

        this.goOutBtn = ViewUtils.createBitmapByName("turntableGoOutBtn_png");
        this.addChild(this.goOutBtn);
        this.goOutBtn.x = this.tipBg.x + this.tipBg.width / 2 - this.goOutBtn.width;
        this.goOutBtn.y = this.tipBg.y + this.tipBg.height / 2 - this.goOutBtn.height;
        this.goOutBtn.anchorOffsetX = this.goOutBtn.width / 2;
        this.goOutBtn.anchorOffsetY = this.goOutBtn.height / 2;
        this.goOutBtn.touchEnabled = true;
        this.goOutBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGoOut, this);
    }

    private doClsoe;

    // 打开转盘界面
    public async open():Promise<void> {
        this.refresh();
        
        var cfg = this.player.worldmap.cfg.turntable;
        var xOrigin = this.bg.width / 2;
        var yOrigin = this.bg.height / 2;
        
        // 根据奖励内容获取对应Bitmap并调整其位置
        for(var i = 0; i < this.rewardCount; i++){
            var type = cfg[i].type;
            switch(type){
                case "+hp":
                this.imgs[i] = ViewUtils.setTex(this.imgs[i], "turntableAddHp_png");
                break;
                case "-hp":
                this.imgs[i] = ViewUtils.setTex(this.imgs[i], "turntableMinusHp_png");
                break;
                case "box":
                this.imgs[i] = ViewUtils.setTex(this.imgs[i], "turntableBox_png");
                break;
                case "coins":
                this.imgs[i] = ViewUtils.setTex(this.imgs[i], "turntableCoin_png");
                break;
                case "item":
                var rdp = GCfg.getRandomDropGroupCfg(cfg[i].attrs);
                var dropItem = Utils.randomSelectByWeightWithPlayerFilter(this.player, rdp.elems, new SRandom, 1, 2, false)[0];
                this.imgs[i] = ViewUtils.setTex(this.imgs[i], dropItem + "_png");
                break;
            }
            this.imgs[i].x = xOrigin + 200 * Math.cos(i * 2 * Math.PI / this.rewardCount);
            this.imgs[i].y = yOrigin - 200 * Math.sin(i * 2 * Math.PI / this.rewardCount);
            this.imgs[i].rotation = 90 - 360 / this.rewardCount * i;
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
        this.addChild(this.sign);

        return new Promise<void>((resolve, reject) => this.doClsoe = resolve);
    }

    // 刷新界面,加入开始按钮,去掉前进按钮,重置奖励轮盘
    private refresh(){        
        this.addChild(this.startBtn);
        this.removeChild(this.goOutBtn);
        this.removeChild(this.tipBg);
        this.removeChild(this.tipContent);        
        for(var i = 0; i < this.rewardCount; i++){
            this.rewards.removeChild(this.imgs[i]);
        }
        this.rewards.rotation = 0;
    }

    // 转动转盘,获取随机奖励
    private onStart(evt:egret.TouchEvent){
        this.removeChild(this.startBtn);
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
        rr.to({rotation:rotateAngels}, 3000, egret.Ease.circInOut).call(() => {            
            this.addChild(this.tipBg);
            this.addChild(this.tipContent);
            this.addChild(this.goOutBtn);
            });// 3秒动画后出现前进按钮

    }

    private onGoOut(evt:egret.TouchEvent){
        this.doClsoe();
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

}