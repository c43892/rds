class LevelLogicMarkAllAward extends LevelLogic {
    private rdp;
    private valid = true;

    constructor(rdp: string) {
        super("LevelLogicMarkAllAward");
        this.rdp = rdp;

        this.addAI("afterGridUncovered", async (ps) => {
            if (!this.valid) return;
            var bt = this.level.bt;
            var gs = this.level.map.findAllGrid((x, y, g: Grid) => {
                if (!g.isCovered())
                    return false;
                var e = g.getElem();
                return !e || !(e instanceof Monster) || !e.isHazard();
            });
            if (gs.length != 0) return;

            var boxGrid = BattleUtils.findRandomEmptyGrid(bt);
            if (boxGrid) {
                var keyGrid = this.level.map.findFirstGrid((x, y, g: Grid) => {
                    if (g == boxGrid) return false;
                    var e = g.getElem();
                    if (e && e instanceof Monster && e.isHazard() && !e.isBig() && e.type != "PlaceHolder" && !e.attrs.cannotTake)
                        return Utils.indexOf(e.dropItems, (dp: Elem) => dp.type != "Coins") == -1;
                });
                if (!keyGrid)
                    keyGrid = BattleUtils.findRandomGrids(bt, (g:Grid) => !g.isCovered() && g != boxGrid, 1)[0];
                if (keyGrid) {
                    this.valid = false;
                    var box = this.level.createElem("TreasureBox", { rdp: this.rdp });
                    await bt.implAddElemAt(box, boxGrid.pos.x, boxGrid.pos.y);
                    var key = this.level.createElem("Key");
                    if (!keyGrid.isCovered())
                        await bt.implAddElemAt(key, keyGrid.pos.x, keyGrid.pos.y);
                    else {
                        var e = keyGrid.getElem();
                        e.addDropItem(key);
                        await bt.fireEvent("onElemImgFlying", { e: key, fromPos: boxGrid.pos, toPos: keyGrid.pos });
                    }
                }
            }
        })
    }
}