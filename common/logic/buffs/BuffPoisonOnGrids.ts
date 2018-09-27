
// 翻开某些方块时中毒
class BuffPoisonOnGrids extends Buff {
    public grids:Grid[];
    public buffPoisonPs;

    constructor (grids:Grid[], cnt:number, buffPoisonPs){
        super("BuffPoisonOnGrids");
        this.cnt = cnt;
        this.buffPoisonPs = buffPoisonPs;
        this.grids = grids;

        this.addAI("onPlayerActed", async () => {
            this.cnt --;
            var bt:Battle = this.getOwner().bt();

            if(this.cnt < 0)
                await bt.implRemoveBuff(this.getOwner(), "BuffPoisonOnGrids");
        })

        this.addAI("onGridChanged", async (ps) => {
            if(ps.subType != "gridUncovered") return;

            var bt:Battle = this.getOwner().bt();
            if(ps.opByPlayer)
                if(Utils.indexOf(this.grids, (g:Grid) => g.pos.x == ps.x && g.pos.y == ps.y) > -1)
                    await bt.implAddBuff(this.getOwner(), "BuffPoison", this.buffPoisonPs[0], this.buffPoisonPs[1]);
            
            this.grids = Utils.remove(this.grids, bt.level.map.getGridAt(ps.x, ps.y));
        })
        
        this.overBuff = (newBuff:BuffPoisonOnGrids) => {
            this.cnt = newBuff.cnt;
            for(var grid of newBuff.grids)
                if(Utils.indexOf(this.grids, (g:Grid) => g.pos.x == grid.pos.x && g.pos.y == grid.pos.y) == -1)
                    this.grids.push(grid);
            }
        
    }
}