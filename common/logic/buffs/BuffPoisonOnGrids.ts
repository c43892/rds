
// 翻开某些方块时中毒
class BuffPoisonOnGrids extends Buff {
    public grids:Grid[];
    public buffPoisonPs;

    constructor (grids:Grid[], cnt:number, buffPoisonPs){
        super("BuffPoisonOnGrids");
        this.cnt = cnt;
        this.buffPoisonPs = buffPoisonPs;
        this.grids = grids;

        this.onPlayerActed = async () => {
            this.cnt --;
            var bt:Battle = this.getOwner().bt();

            if(this.cnt < 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        }

        this.onPlayerActed = async (ps) => {
            if(ps.subType != "uncoverAt") return;

            var bt:Battle = this.getOwner().bt();
            var map:Map = bt.level.map;
            if(Utils.indexOf(grids, (g:Grid) => g.pos.x == ps.x && g.pos.y == ps.y) > -1){
                await bt.implAddBuff(this.getOwner(), "BuffPoison", this.buffPoisonPs[0], this.buffPoisonPs[1]);
            }
        }

        this.onGridChanged = (ps) => {
            if(ps.subType != "gridUncovered") return;
            var bt:Battle = this.getOwner().bt();
            var g = bt.level.map.getGridAt(ps.x, ps.y)
            var n = Utils.indexOf(this.grids, (grid:Grid) => grid = g);
            if(n > -1)
                this.grids = Utils.removeAt(this.grids, n);
        }

        this.addBuffCnt = (cnt, newCnt) => this.cnt = newCnt;
    }
}