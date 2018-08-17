// 所有战斗相关计算集中于此
class BattleCalculator {
    private srand:SRandom; // 随机数生成器
    public constructor(srand:SRandom) {
        this.srand = srand;
    }

    // 计算攻击，attacker 必须包含 power, target 必须包含 hp，
    // 返回结果有以下几种结果("r" 表示)
    //      "attacked": 攻击成功
    //      "blocked": 完全格挡
    //      "dodged": 被闪避
    // 具体结果数值附加在其它结果参数中
    public doAttackCalc(attackerAttrs, targetAttrs):any {
        var attackFlags = attackerAttrs.attackFlags;
        var power = this.doCalc(attackerAttrs, "power") < 1 ? 1 :this.doCalc(attackerAttrs, "power");
        var accuracy = this.doCalc(attackerAttrs, "accuracy");
        var critical = this.doCalc(attackerAttrs, "critical");
        var damageAdd = this.doCalc(attackerAttrs, "damageAdd");
        var addBuffs = attackerAttrs.addBuffs;

        var immuneFlags = targetAttrs.immuneFlags;
        var targetFlags = targetAttrs.targetFlags;
        var shield = this.doCalc(targetAttrs, "shield");
        var dodge = this.doCalc(targetAttrs, "dodge");
        var damageDec = this.doCalc(targetAttrs, "damageDec");
        var resist = targetAttrs.resist;

        // 战斗计算结果
        var r = {r:"attacked", dhp:0, dShield:0, addBuffs:[]};

        if (Utils.contains(immuneFlags, "cancelAttack")) { // 攻击行为被取消
            r.r = "canceled";
            return r;
        }

        // 计算命中(-闪避)
        if (this.srand.next100() >= 100 + accuracy - dodge) {
            r.r = "dodged";
            return r;
        }

        // 判断免疫
        for (var af of attackFlags) {
            if (Utils.contains(immuneFlags, af)) {
                r.r = "immunized";
                break;
            }
        }

        // 如果免疫，则跳过伤害计算
        if (r.r != "immunized") {
            // 计算暴击
            if (this.srand.next100() < critical)
                power *= 2;

            // 计算+-伤害和抵抗
            var damage = power + damageAdd - damageDec;
            damage = (damage + resist.b) * (1 - resist.a) + resist.c;
            if (Utils.contains(targetFlags, "Sneaked")) damage += 2;
            if (damage < 0) damage = 0;        

            // 没有穿刺，就计算护盾
            if (!Utils.contains(attackFlags, "Pierce") && shield > 0)
            {
                r.dShield = -(damage > shield ? shield : damage);
                damage = 0;
            }

            // 计算最终伤害
            r.r = "attacked";
            r.dhp = -damage;
        }

        // 根据概率计算 buff 效果
        for (var b of addBuffs) {
            var buffType = b.type;
            if (this.srand.next100() < b.rate)
                r.addBuffs.push({type:buffType, ps:b.ps});
        }

        return r;
    }

    // 属性加成计算
    public doCalc(attrs, k:string) {
        var a = attrs[k].a;
        var b = attrs[k].b;
        var c = attrs[k].c;
        return b * (1 + a) + c;
    }
}
