class Monster extends Elem {
    public hp:number; // 血量
    public power:number; // 攻击力
    public defence:number; // 防御
    public dodge:number; // 闪避%
}

// 怪物
class MonsterFactory {
    public creators = {
        // 兔子
        "Bunny": (ps) => this.createNormalMonster(5, 1)
    };

    // 创建一个普通的怪物
    createNormalMonster(hp:number, power:number, defence:number = 0, dodge:number = 0):Monster {
        var m = new Monster();
        m.canUse = () => true;
        m.hp = hp;
        m.power = power;
        m.hazard = true;

        // 使用，即是攻击怪物
        m.use = () =>  {
            Battle.CurrentBattle.tryPlayerAttackElem(m);
            return m.hp > 0;
        }

        // 角色行动后，会攻击角色
        m.afterPlayerActed = () => {
            Battle.CurrentBattle.tryElemAttackPlayer(m);
        }
        return m;
    }
}
