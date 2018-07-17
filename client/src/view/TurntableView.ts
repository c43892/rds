class TurntableView extends egret.DisplayObjectContainer {
    public player:Player;
    
    private bg:egret.Bitmap;
    private rewards:egret.DisplayObjectContainer; //奖励内容
    private startBtn:egret.Bitmap;
    private goOutBtn:egret.Bitmap;
    private imgs:egret.Bitmap[] = []; //候选奖励
    private rewardCount = 6;

    public constructor(w:number, h:number){
        super();
        this.width = w;
        this.height = h;
        this.touchEnabled = true;

        this.bg = ViewUtils.createBitmapByName("turntableBg_png");
        this.addChild(this.bg);
        this.bg.x = (this.width - this.bg.width) / 2;
        this.bg.y = (this.height - this.bg.height) / 2;
        
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

        this.goOutBtn = ViewUtils.createBitmapByName("turntableGoOutBtn_png");
        this.addChild(this.goOutBtn);
        this.goOutBtn.x = this.width - this.goOutBtn.width;
        this.goOutBtn.y = this.height - this.goOutBtn.height;
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
                var dropItem = Utils.randomSelectByWeightWithPlayerFilter(this.player, rdp.elems, this.player.playerRandom, 1, 2, false)[0];
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

        return new Promise<void>((resolve, reject) => this.doClsoe = resolve);
    }

    // 刷新界面,加入开始按钮,去掉前进按钮,重置奖励轮盘
    private refresh(){        
        this.addChild(this.startBtn);
        this.removeChild(this.goOutBtn);
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

        var rr = egret.Tween.get(this.rewards, {loop:false});
        rr.to({rotation:rotateAngels}, 3000, egret.Ease.circInOut).call(() => this.addChild(this.goOutBtn));// 3秒动画后出现前进按钮

        // 将奖励添加到角色身上
        var award = this.imgs[randomIndex];
        switch(award["type"]){
                case "+hp":
                Utils.log("before hp", this.player.hp);
                this.player.addHp(Math.round(this.player.hp * award["attrs"] / 100));
                Utils.log("after hp", this.player.hp);
                break;
                case "-hp":
                Utils.log("before hp", this.player.hp);
                this.player.addHp(Math.round(this.player.hp * award["attrs"] / 100));
                Utils.log("after hp", this.player.hp);
                break;
                case "box":
                var rdp = GCfg.getRandomDropGroupCfg(award["attrs"]);
                var dropItem = Utils.randomSelectByWeightWithPlayerFilter(this.player, rdp.elems, this.player.playerRandom, 1, 2, false)[0];
                var e = ElemFactory.create(dropItem);                
                this.player.addItem(e);
                Utils.log("get item from box", dropItem);
                break;
                case "coins":
                Utils.log("before money", this.player.money);
                this.player.addMoney(award["attrs"]);
                Utils.log("after money", this.player.money);
                break;
                case "item":
                var e = ElemFactory.create(award["attrs"]);
                this.player.addItem(e);
                Utils.log("get item from turntable", award["attrs"]);
                break;
            }
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
        var r = this.player.playerRandom.nextInt(0,totalWeight);    
        var tempWeight = 0;
        for(var j = 0; j < cfg.length; j++){
            tempWeight += cfg[j].weight;
            if(r < tempWeight)
            break;

        }
    return j;
    }

}