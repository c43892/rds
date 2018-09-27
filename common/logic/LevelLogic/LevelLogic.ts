class LevelLogic{
    public type:string;
    public level:Level; // 所属关卡

    constructor(type:string){
        this.type = type;
    }

    public addAI(logicPoint:string, act, Sync:boolean = false){
        this[logicPoint + (Sync ? "Sync" : "Async")] = act;
    }
}