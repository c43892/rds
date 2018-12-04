// 所有战斗统计相关
class BattleStatistics {
    public player:Player
    public totalStoreyLevel = () => this.player.finishedTotalStorey(); // 总层数
    public totalCoins = 0; // 总金币数
    public playerLevel = () => this.player.lv; // 玩家等级    
    public monsterKilled = {normal:0, elite:0, boss:0}; // 杀死怪物计数    
    public clearBonusCount = {normal:0, elite:0, boss:0}; // 清关奖励计数

    constructor(p:Player){
        this.player = p;
    }

    public toString():string {
        return "";
    }

    public fromString(str:string) {
    }

    public static fromString(p:Player, str:string):BattleStatistics {
        var st = new BattleStatistics(p);
        st.fromString(str);
        return st;
    }
    
    public onElemChangedAsync(ps) {
        // 怪物死亡统计
        if (ps.subType == "die" && ps.e instanceof Monster && ps.e.isHazard() && ps.e.type != "PlaceHolder") {
            var m = <Monster>ps.e;
            if (m.isBoss)
                this.monsterKilled.boss++;
            else
                this.monsterKilled.normal++;
        }
    }

    // 总技能等级
    public totalRelicLevel(){
        var l = 0;
        for (var r of this.player.allRelics)
            l = l + r.reinforceLv + 1;
        return l;
    } 

    // 难度
    public difficulty(){
        return this.player.difficulty;
    }

    // 获得清关奖励
    public onGetMarkAllAwardAsync (ps) {
        this.clearBonusCount[ps.btType]++;
    }

    public addCoins(d:number){
        this.totalCoins += d;
    }

    // 获取得分信息
    public static getScoreInfos(bs:BattleStatistics){
        var si = {totalStoreyLevel:0, playerLevel:0, totalCoins:0, totalRelicLevel:0, totalMonster:0, clearBonusCount:0, difficulty:0};
        si.totalStoreyLevel = bs.totalStoreyLevel() * GCfg.getMiscConfig("scoreInfoPs")["totalStoreyLevel"];
        si.playerLevel = bs.playerLevel() * GCfg.getMiscConfig("scoreInfoPs")["playerLevel"];
        si.totalCoins = bs.totalCoins * GCfg.getMiscConfig("scoreInfoPs")["totalCoins"];
        si.totalRelicLevel = bs.totalRelicLevel() * GCfg.getMiscConfig("scoreInfoPs")["totalRelicLevel"];
        si.totalMonster = bs.monsterKilled.normal * GCfg.getMiscConfig("scoreInfoPs")["normalMonster"]
            + bs.monsterKilled.elite * GCfg.getMiscConfig("scoreInfoPs")["eliteMonster"]
            + bs.monsterKilled.boss * GCfg.getMiscConfig("scoreInfoPs")["bossMonster"];
        si.clearBonusCount = bs.clearBonusCount.normal * GCfg.getMiscConfig("scoreInfoPs")["normalBonus"]
            + bs.clearBonusCount.elite * GCfg.getMiscConfig("scoreInfoPs")["eliteBonus"]
            + bs.clearBonusCount.boss * GCfg.getMiscConfig("scoreInfoPs")["bossBonus"];
        si.difficulty =  GCfg.getMiscConfig("scoreInfoPs")["difficulty"][bs.difficulty()];

        var needFloors = ["totalStoreyLevel", "playerLevel", "totalCoins", "totalRelicLevel", "totalMonster", "clearBonusCount"];
        for (var needFloor of needFloors)
            si[needFloor] = Math.floor(si[needFloor]);

        return si;
    }

    // 获取总得分
    public static getFinalScore(si){
        var fs = 0;
        for (var title in si) 
            if (title != "difficulty")
                fs += si[title];
        
        return Math.floor(fs * si["difficulty"]);
    }
}
