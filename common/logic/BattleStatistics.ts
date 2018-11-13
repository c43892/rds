// 所有战斗统计相关
class BattleStatistics {

    public storeyLv = 0; // 总层数
    public coins = 0; // 总金币数
    public playerLv = 0; // 玩家等级
    public sumOfRelicsLv = 0; // 总技能等级
    public monsterKilled = {normal:0, elite:0, boss:0}; // 杀死怪物技术
    public diffFact = 0; // 难度系数
    public clearBonusCount = 0; // 清关奖励计数

    public toString():string {
        return "";
    }

    public fromString(str:string) {
    }

    public bt:Battle;

    get p() : Player {
        return this.bt.player;
    }

    public static fromString(str:string):BattleStatistics {
        var st = new BattleStatistics();
        st.fromString(str);
        return st;
    }
    
    public onElemChanged(ps) {
        // 怪物死亡统计
        if (ps.subType == "die" && ps.e instanceof Monster && ps.e.isHazard()) {
            var m = <Monster>ps.e;
            if (m.isBoss)
                this.monsterKilled.boss++;
            else
                this.monsterKilled.normal++;
        }
    }

    public onPlayerChanged (ps) {
        // 角色升级
        if (ps.subType == "lvUp") {
            this.playerLv = this.p.lv;
        }
    }

    public onRelicChanged (ps) {
        // 遗物等级总和
        var sum = 0;
        var relics:Relic[] = this.p.allRelics;
        for (var r of relics) {
            sum += r.reinforceLv;
        }

        this.sumOfRelicsLv = sum;
    }

    public onGetMarkAllAward (ps) {
        // 获得清关奖励
        this.clearBonusCount++;
    }

    public notifyStoreyPosFinished(lv, n) {
        this.storeyLv = lv;
    }

    public notifyDiffFact(fact) {
        this.diffFact = fact;
    }
}
