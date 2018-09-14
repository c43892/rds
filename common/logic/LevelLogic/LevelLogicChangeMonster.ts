class LevelLogicChangeMonster extends LevelLogic{
    public changeTypes:string[];
    public num:number;
    constructor(changeTypes:string[], num){
        super("LevelLogicChangeMonster");
        this.changeTypes = changeTypes;
        this.num = num;

        this.onLevelInited = async (ps) => {
            var bt = <Battle>ps.bt;
            var noDropItems = (e:Elem) => Utils.filter(e.dropItems, (d:Elem) => d.type != "Coins").length == 0;            
            for(var i = 0; i < this.num; i++){
                var type = changeTypes[bt.srand.nextInt(0, changeTypes.length)];
                var tarm = BattleUtils.findRandomElems(bt, 1, (e:Elem) => {
                    if(!(e instanceof Monster)) return false;
                    return e.isHazard() && !e.isBoss && noDropItems(e) && e.type != type && e.type != "PlaceHolder";
                })[0];
                if (tarm) {
                    var m = this.level.createElem(type);
                    var pos = tarm.pos;
                    await bt.implRemoveElemAt(pos.x, pos.y);
                    await bt.implAddElemAt(m, pos.x, pos.y);
                }
            }
        }
    }
}