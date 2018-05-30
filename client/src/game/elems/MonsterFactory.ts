class Monster extends Elem {

    constructor(bt:Battle) {
        super(bt);
    }

    public hp:number; // 血量
    public power:number; // 攻击力
    public defence:number; // 防御
    public dodge:number; // 闪避%

    public addHp; // +hp，可以是+负数
}

// 怪物
class MonsterFactory {
    public creators = {
        // 兔子
        "Bunny": (bt, ps) => this.createNormalMonster(bt, 5, 1)
    };

    // 创建一个普通的怪物
    createNormalMonster(bt:Battle, hp:number, power:number, defence:number = 0, dodge:number = 0):Monster {
        var m = new Monster(bt);
        m.canUse = () => true;
        m.hp = hp;
        m.power = power;
        m.hazard = true;

        m.addHp = (dhp) => {
            m.hp = m.hp + dhp > 0 ? m.hp + dhp : 0;
        };

        // 使用，即攻击怪物
        m.use = () =>  {
            m.bt.implPlayerAttackMonster(m);
            return m.hp > 0;
        };

        // 角色行动后，会攻击角色
        m.afterPlayerActed = () => {
            m.bt.implMonsterAttackPlayer(m);
        };

        return m;
    }
}
