class LevelLogicRandomEgg extends LevelLogic {
    private valid = true;
    private rdp;

    constructor(rdp: string){
        super("LevelLogicRandomEgg");
        this.rdp = rdp;

        this.addAI("onElemChanged", async (ps) => {
            if (ps.subType != "dead" || !this.valid) return;

            var map = this.level.map;
            var bt = this.level.bt;
            var randomEggZombies = map.findAllElems((e: Elem) => e.type == "RandomEggZombie");
            if (randomEggZombies.length == 0) {
                // 判断是出现监狱还是道具
                // 概率为10%
                var rate = this.level.bt.srand.next100();
                // 几率随机到并且有可解锁职业才出密室
                if (rate < 100 && Utils.getLockedOccupations().length > 0) {
                    var pg = BattleUtils.findRandomEmptyGrid(this.level.bt, false);
                    if (pg) {
                        this.valid = false;
                        var prison = this.level.createElem("Prison");
                        await bt.fireEvent("onGetMarkAllAward", { btType: "randomEgg" });
                        await this.level.bt.implAddElemAt(prison, pg.pos.x, pg.pos.y);
                    }
                }
                // 其他情况奖励道具
                else {
                    var gs = map.findAllGrid((x, y, g: Grid) => {
                        if (!g.isCovered())
                            return false;
                        var e = g.getElem();
                        return !e || !(e instanceof Monster) || !e.isHazard();
                    });
                    if (gs.length != 0) return;

                    var boxGrid = BattleUtils.findRandomEmptyGrid(bt);
                    if (boxGrid) {
                        // 钥匙优先掉落在怪物身上
                        var keyGrid = map.findFirstGrid((x, y, g: Grid) => {
                            if (g == boxGrid) return false;
                            var e = g.getElem();
                            if (e && e instanceof Monster && e.isHazard() && !e.isBig() && e.type != "PlaceHolder" && !e.attrs.cannotTake)
                                return Utils.indexOf(e.dropItems, (dp: Elem) => dp.type != "Coins") == -1;
                        });

                        // 没有目标怪物则掉落在空地上
                        if (!keyGrid)
                            keyGrid = BattleUtils.findRandomGrids(bt, (g: Grid) => !g.isCovered() && !g.getElem() && g != boxGrid, 1)[0];

                        // 分配好宝箱和钥匙的目标位置都才一起掉落出来
                        if (keyGrid) {
                            this.valid = false;
                            await bt.fireEvent("onGetMarkAllAward", { btType: "randomEgg" });
                            var box = this.level.createElem("TreasureBox", { rdp: this.rdp });
                            await bt.implAddElemAt(box, boxGrid.pos.x, boxGrid.pos.y);
                            var key = this.level.createElem("Key");
                            var e = keyGrid.getElem();
                            if (!e) {
                                Utils.assert(!keyGrid.isCovered(), "only uncovered grid without monster is valid");
                                await bt.implAddElemAt(key, keyGrid.pos.x, keyGrid.pos.y);
                            }
                            else {
                                Utils.assert(e instanceof Monster, "only monster can take the key: " + e.type + " at " + keyGrid.pos.x + ", " + keyGrid.pos.y);
                                e.addDropItem(key);
                                await bt.fireEvent("onElemImgFlying", { e: key, fromPos: boxGrid.pos, toPos: keyGrid.pos });
                            }
                            await bt.triggerLogicPoint("onGetMarkAllAward", { btType: "randomEgg" });
                        }
                    }
                }                
            }
        })
    }
}