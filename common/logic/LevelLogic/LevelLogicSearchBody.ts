class LevelLogicSearchBody extends LevelLogic{
    public rdps:string[];
    constructor(level:Level, rdps:string[]){
        super("LevelLogicSearchBody");
        this.level = level;
        this.rdps = rdps;

        this.beforeLevelInited = async (ps) => {
            var bt = <Battle>ps.bt;
            for(var i = 0; i < rdps.length; i++){
                var box = this.level.createElem("TreasureBox", {rdp:rdps[i]});
                var key = this.level.createElem("Key");
                var gs = BattleUtils.findRandomGrids(bt, (g:Grid) => !g.getElem() && !g.isCovered(), 2);
                if(gs.length == 2){
                    await bt.implAddElemAt(box, gs[0].pos.x, gs[0].pos.y);
                    await bt.implAddElemAt(key, gs[1].pos.x, gs[1].pos.y);
                }
            }
        }
    }

}