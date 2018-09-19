class LevelLogicAddElemOnInit extends LevelLogic {
    public elemTypes: string[] = [];

    constructor(elemTypes:string[]) {
        super("LevelLogicAddElemOnInit");
        this.elemTypes = elemTypes;

        this.onLevelInitElems = (ps) => {
            for (var elemType of this.elemTypes) {
                var e = this.level.createElem(elemType);
                ps.elems.push(e);
            }
        }
    }
}