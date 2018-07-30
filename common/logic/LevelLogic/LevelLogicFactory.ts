class LevelCfgFactory{
    public createLevelCfg(type:string){
        var levelLogic;
        switch(type){
            case "levelCfgBasic" : levelLogic = new LevelLogicBasic();
        }

        return levelLogic;
    };
}