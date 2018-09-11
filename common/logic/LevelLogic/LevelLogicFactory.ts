class LevelLogicFactory{
    public static createLevelLogic(type:string, level:Level, ...ps:any[]):LevelLogic{
        var levelLogic;
        switch(type){
            case "LevelLogicTakeKey" : levelLogic = new LevelLogicTakeKey(level); break;
            case "LevelLogicSearchBody" : levelLogic = new LevelLogicSearchBody(level, ps[0]); break;
            case "LevelLogicAddBoxAndKey" : levelLogic = new LevelLogicAddBoxAndKey(level); break;
        }

        return levelLogic;
    };
}