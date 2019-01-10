class LevelLogicFactory{
    public static createLevelLogic(type:string, ...ps:any[]):LevelLogic{
        var levelLogic:LevelLogic;        
        switch(type){
            case "LevelLogicTakeKey" : levelLogic = new LevelLogicTakeKey(); break;
            case "LevelLogicSearchBody" : levelLogic = new LevelLogicSearchBody(ps[0]); break;
            case "LevelLogicAddBoxAndKey" : levelLogic = new LevelLogicAddBoxAndKey(ps[0], ps[1]); break;
            case "LevelLogicChangeMonster" : levelLogic = new LevelLogicChangeMonster(ps[0], ps[1], ps[2], ps[3]); break;
            case "LevelLogicAddElemOnInit" : levelLogic = new LevelLogicAddElemOnInit(ps[0]); break;
            case "LevelLogicMarkAllAward" : levelLogic = new LevelLogicMarkAllAward(ps[0]); break;
            case "LevelLogicAddRelicOnRookie" : levelLogic = new LevelLogicAddRelicOnRookie(); break;
            case "LevelLogicAddShopNpc": levelLogic = new LevelLogicAddShopNpc(); break;
            case "LevelLogicBoss": levelLogic = new LevelLogicBoss(ps[0]); break;
            case "LevelLogicElite": levelLogic = new LevelLogicElite(ps[0]); break;
        }
        return levelLogic;
    };
}