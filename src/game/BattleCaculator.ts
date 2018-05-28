// 所有战斗相关计算集中于此
class BattleCalculator {

    private srand:SRandom; // 随机数生成器

    public constructor(randomSeed:number) {
        this.srand = new SRandom(randomSeed);
    }

    // 计算攻击，attacker 必须包含 power, target 必须包含 hp，
    // 返回结果有以下几种结果("r" 表示)
    //      "attacked": 攻击成功
    //      "blocked": 完全格挡
    //      "dodged": 被闪避
    // 具体结果数值附加在其它结果参数中
    public tryAttack(attacker, target):any {
        var power = attacker.power;
        var defence = target.defence ? target.defenct : 0;
        var dodge = target.dodge ? target.dodge : 0;
        
        // 计算闪避
        var r = this.srand.nextInt(0, 100);
        if (r < dodge)
            return {"r": "dodged"};
        else {
            var d = power > defence ? power - defence : 1; // 伤害至少是 1
            return {"r": "attacked", "dhp": -d}; // 参数表示血量变化
        }
    }
}