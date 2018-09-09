class LevelLogic{
    public type:string;
    public level:Level; // 所属关卡

    constructor(type:string){
        this.type = type;
    }

    // 各逻辑挂接点
    public onLevelInited;
}