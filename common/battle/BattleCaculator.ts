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
        var power = this.doCalc(attackerAttrs, "power");
        var accuracy = this.doCalc(attackerAttrs, "accuracy");
        var critial = this.doCalc(attackerAttrs, "critial");
        var damageAdd = this.doCalc(attackerAttrs, "damageAdd");
        var buffs = attackerAttrs.buffs;

        var immuneFlags = targetAttrs.immuneFlags;
        var guard = this.doCalc(targetAttrs, "guard");
        var dodge = this.doCalc(targetAttrs, "dodge");
        var damageDec = this.doCalc(targetAttrs, "damageDec");
        var resist = targetAttrs.resist;
        // 战斗计算结果
        var r = {r:"", dhp:0, dguard:0, buffs:[]};

        // 计算命中(-闪避)
        if (this.srand.next100() >= 100 + accuracy - dodge) {
            r.r = "dodged";
            return r;
        }

        // 计算免疫
        for (var af of attackFlags) {
            if (Utils.contains(immuneFlags, af)) {
                r.r = "immunized";
                return r;
            }
        }

        // 计算暴击
        if (this.srand.next100() < critial)
            power *= 2;

        // 计算+-伤害和抵抗
        var damage = power + damageAdd - damageDec;
        damage = (damage + resist.b) * (1 - resist.a) + resist.c;
        if (Utils.contains(attackFlags, "sneak")) damage += 2;
        if (damage < 0) damage = 0;        

        // 没有穿刺，就计算护盾
        if (!Utils.contains(attackFlags, "pierce"))
        {
            // 护盾完全挡住伤害
            if (damage <= guard) {
                r.dguard = damage - guard;
                damage = 0;
            }
            else { // 消耗护盾，再计算剩余伤害
                r.dguard = guard;
                damage -= guard;
            }
        }

        // 计算最终伤害
        r.r = "attacked";
        r.dhp = damage;

        // 根据概率计算 buff 效果
        for (var b of buffs) {
            if (Utils.contains(immuneFlags, b)) continue; // 免疫也阻止相应的 buff
            if (this.srand.next100() < buffs[b])
                r.buffs.push(b);
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
