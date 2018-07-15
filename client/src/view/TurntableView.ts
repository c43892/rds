class TurntableView extends egret.DisplayObjectContainer {
    public player:Player;
    
    private bg:egret.Bitmap;
    private startBtn:egret.Bitmap;
    private rewards:egret.DisplayObjectContainer;//奖励内容
    private goOutBtn:egret.Bitmap;

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
        this.rewards.x = 0;
        this.rewards.y = 0;
        this.rewards.width = this.bg.width;
        this.rewards.height = this.bg.height;

        this.startBtn = ViewUtils.createBitmapByName("turntableStartBtn_png");
        this.addChild(this.startBtn);
        this.startBtn.x = this.bg.x + this.bg.width / 2;
        this.startBtn.y = this.bg.y + this.bg.height / 2;
        this.startBtn.anchorOffsetX = this.startBtn.width / 2;
        this.startBtn.anchorOffsetY = this.startBtn.height / 2;
        this.startBtn.touchEnabled = true;
        this.startBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onStart, this);

        this.goOutBtn = ViewUtils.createBitmapByName("turntableGoOutBtn_png");
        this.goOutBtn.x = this.width - this.goOutBtn.width;
        this.goOutBtn.y = this.height - this.goOutBtn.height;
        this.goOutBtn.anchorOffsetX = this.goOutBtn.width / 2;
        this.goOutBtn.anchorOffsetY = this.goOutBtn.height / 2;
        this.goOutBtn.touchEnabled = true;
        this.goOutBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGoOut, this);
    }
    
    public async open(){
        
        var cfg = this.player.worldmap.cfg.turntable;
        var xOrigin = this.x + this.bg.width / 2;
        var yOrigin = this.bg.y + this.bg.height / 2;
        
        var imgs:egret.Bitmap[] = [];
        for(var i = 0; i < cfg.length; i++){
            var type = cfg[i].type;
            switch(type){
                case "+hp":
                var img = ViewUtils.createBitmapByName("turntableAddHp_png");
                break;
                case "-hp":
                var img = ViewUtils.createBitmapByName("turntableMinusHp_png");
                break;
                case "box":
                var img = ViewUtils.createBitmapByName("turntableBox_png");
                break;
                case "coins":
                var img = ViewUtils.createBitmapByName("turntableCoin_png");
                break;
                case "item":
                var rdp = GCfg.getRandomDropGroupCfg(cfg[i].attrs);
                var dropItem = Utils.randomSelectByWeightWithPlayerFilter(this.player, rdp.elems, this.player.playerRandom, 1, 2, false)[0];
                var img = ViewUtils.createBitmapByName(dropItem + "_png");
                break;
            }
            img.x = xOrigin + 200 * Math.cos(i * Math.PI / 3);
            img.y = yOrigin - 200 * Math.sin(i * Math.PI / 3);
            img.anchorOffsetX = img.width / 2;
            img.anchorOffsetY = img.height / 2;
            img.rotation = 90 - 60 * i;
            img["type"] = type;
            if(type != "item")
                img["attrs"] = cfg[i].attrs;
            else 
                img["attrs"] = dropItem;
            img["weight"] = cfg.weight;
            imgs.push(img);
            this.rewards.addChild(img);
        }
        this.onStart(imgs);
    }

    private onStart(arr:egret.Bitmap[]){
        var cfg = this.player.worldmap.cfg.turntable;
        var randomIndex = this.getRandomIndex(cfg);
        Utils.log("randomIndex", randomIndex, "type", arr[randomIndex]["type"], "attrs",arr[randomIndex]["attrs"]);

        var rotateAngels = ( randomIndex / 3 + 2 * 10 ) * Math.PI;//所需旋转角度,额外加十圈,弧度单位
        //待添加的旋转动画

        var award = arr[randomIndex];
        switch(award["type"]){
                case "+hp":
                Utils.log("after hp", this.player.hp);
                this.player.addHp(Math.round(this.player.hp * award["attrs"] / 100));
                Utils.log("after hp", this.player.hp);
                break;
                case "-hp":
                Utils.log("after hp", this.player.hp);
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
        
        this.addChild(this.goOutBtn);
    }

    private onGoOut(){
        
    }

    private getRandomIndex(cfg):number{
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