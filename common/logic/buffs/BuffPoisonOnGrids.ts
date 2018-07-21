
// 翻开某些方块时中毒
class BuffPoisonOnGrids extends Buff {
    public Grids:Grid[];
    public buffPoisonPs;

    constructor (grids:Grid[], cnt:number, buffPoisonPs){
        super("BuffPoisonOnGrids");
        this.cnt = cnt;
        this.buffPoisonPs = buffPoisonPs;
        this.Grids = grids;

        
        
        this.onPlayerActed = async () => {
            cnt --;
            var bt:Battle = this.getOwner().bt();

            if (this.cnt <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        }

        this.onGridChanged = async (ps) => {
            var bt:Battle = this.getOwner().bt();
            var map:Map = bt.level.map;
            if(ps.subType != "gridUnconvered") return;

            if(Utils.indexOf(grids, (g:Grid) => g.pos.x == ps.x && g.pos.y == ps.y) > -1){
                await bt.implAddBuff(this.getOwner(), "BuffPoison", this.buffPoisonPs[0], this.buffPoisonPs[1]);
            }
        }
        this.addBuffCnt = (cnt, newCnt) => this.cnt = newCnt;
    }

    
}