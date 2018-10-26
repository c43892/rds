// 冒险者的尸体事件专用逻辑
class LevelLogicSearchBody extends LevelLogic{
    public rdps; // 掉落表数组
    constructor(rdps){
        super("LevelLogicSearchBody");
        this.rdps = rdps;

        this.addAI("beforeLevelInited", async (ps) => {
            var bt = this.level.bt;
            for(var i = 0; i < rdps.length; i++){
                // 约定:传入的不是数字则为掉落组,是数字则为钱的数量
                if(isNaN(rdps[i]))
                    var box = this.level.createElem("TreasureBox", {rdp:rdps[i]});
                else{
                    var box = this.level.createElem("TreasureBox");
                    var coins = this.level.createElem("Coins", {cnt:rdps[i]})
                    box.addDropItem(coins);
                }
                var key = this.level.createElem("Key");
                var g = BattleUtils.findRandomGrids(bt, (g:Grid) => !g.getElem() && !g.isCovered(), 1)[0];
                if(g){
                    await bt.implAddElemAt(box, g.pos.x, g.pos.y);
                    this.level.keys.push(key);
                }
            }
        })
    }
}