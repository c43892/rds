class Monster extends Elem {

    constructor(bt:Battle) {
        super(bt);
    }

    public hp:number; // 血量
    public power:number; // 攻击力
    public defence:number; // 防御
    public dodge:number; // 闪避%

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
    }
}

// 怪物
class MonsterFactory {
    public creators = {
        // "Bunny": (bt, attrs) => this.doAttackBack(this.createNormalMonster(bt, attrs.hp, attrs.power, attrs.defence, attrs.dodge)) // 被攻击时反击
        // "Bunny": (bt, attrs) => this.doAttackBack(this.doSneakAttack(this.createNormalMonster(bt, attrs.hp, attrs.power, attrs.defence, attrs.dodge))) // 偷袭行为是攻击，被攻击时反击
        "Bunny": (bt, attrs) => MonsterFactory.doAttackBack(MonsterFactory.doSneakStealMoney(this.createNormalMonster(bt, attrs.hp, attrs.power, attrs.defence, attrs.dodge))) // 偷袭行为是偷钱，被攻击时反击
    };

    // 创建一个普通的怪物
    createNormalMonster(bt:Battle, hp:number, power:number, defence:number, dodge:number):Monster {
        var m = new Monster(bt);
        m.canUse = () => true;
        m.hp = hp ? hp : 0;
        m.power = power ? power : 0;
        m.defence = defence ? defence : 0;
        m.dodge = dodge ? dodge : 0;        
        m.hazard = true;
        m.blockUncover = true;

        // 使用，即攻击怪物
        m.use = async () =>  {
            await m.bt.implPlayerAttackMonster(m);
            return true; // m.hp > 0;
        };

        return m;
    }

    // 设定偷袭逻辑
    static addSneakAI(m:Monster, act) {
        return <Monster>ElemFactory.addAI(m, "onGridUncovered", act, (ps) => ps.x == m.pos.x && ps.y == m.pos.y 
                                                        && ps.stateBeforeUncover != GridStatus.Marked);
    }

    // 偷袭：攻击
    static doSneakAttack(m:Monster):Monster {
        return MonsterFactory.addSneakAI(m, () => m.bt.implMonsterAttackPlayer(m));
    }

    // 偷袭：偷钱
    static doSneakStealMoney(m:Monster):Monster {
        return MonsterFactory.addSneakAI(m, () => {
            var dm = 10;
            if (!m.dropItems["Coins"])
                m.dropItems["Coins"] = {num:1, attrs:{cnt:0}};

            m.dropItems["Coins"] = {num:1, attrs:{cnt:m.dropItems["Coins"].attrs.cnt + dm}};
            m.bt.implAddMoney(m, -dm);
        });
    }

    // 被攻击时反击一次
    static doAttackBack(m:Monster):Monster {
        return <Monster>ElemFactory.addAI(m, "onMonsterHurt", () => m.bt.implMonsterAttackPlayer(m), (ps) => ps.m == m);
    }

    // 攻击玩家一次
    static doAttack(logicPoint:string, m:Monster):Monster {
        return <Monster>ElemFactory.addAI(m, logicPoint, () => m.bt.implMonsterAttackPlayer(m));
    }

    // 随机移动一次，dist 表示移动几格
    static doMove(logicPoint:string, dist:number, m:Monster):Monster {
        var dir = [[-1,0],[1,0],[0,-1],[0,1]];
        return <Monster>ElemFactory.addAI(m, logicPoint, async () => {
            var path = [{x:m.pos.x, y:m.pos.y}];
            for (var i = 0; i < dist; i++) {
                var d = dir[m.bt.srand.nextInt(0, dir.length)];
                var lastPt = path[path.length - 1];
                var x = lastPt.x + d[0];
                var y = lastPt.y + d[1];
                if ((m.pos.x == x && m.pos.y == y) || m.bt.level.map.isWalkable(x, y))
                    path.push({x:x, y:y});
            }

            await m.bt.implMonsterMoving(m, path);
        });
    }
}
