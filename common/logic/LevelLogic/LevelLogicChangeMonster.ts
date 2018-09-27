class LevelLogicChangeMonster extends LevelLogic{
    public changeTypes:string[];
    public num:number;
    constructor(changeTypes:string[], num){
        super("LevelLogicChangeMonster");
        this.changeTypes = changeTypes;
        this.num = num;

        this.addAI("onLevelInited", async (ps) => {
            var bt = <Battle>ps.bt;
            var noDropItems = (e:Elem) => Utils.filter(e.dropItems, (d:Elem) => d.type != "Coins").length == 0;
            var notSameType = (e:Elem) => Utils.indexOf(this.changeTypes, (changeType:string) => e.type == changeType) < 0;
            var tarms = BattleUtils.findRandomElems(bt, this.num, (e:Elem) => {
                    if(!(e instanceof Monster)) return false;
                    return e.isHazard() && !e.isBoss && noDropItems(e) && notSameType(e) && e.type != type && e.type != "PlaceHolder";})
            for(var i = 0; i < tarms.length; i++){
                var type = changeTypes[bt.srand.nextInt(0, changeTypes.length)];
                var m = this.level.createElem(type);
                var pos = tarms[i].pos;
                await bt.implRemoveElemAt(pos.x, pos.y);
                await bt.implAddElemAt(m, pos.x, pos.y);
            }
        })

    }
}