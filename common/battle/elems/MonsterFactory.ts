class Monster extends Elem {

    constructor(bt:Battle) {
        super(bt);
    }

    public hp:number; // 血量
    public maxHp:number; // 最大血量
    public power:number; // 攻击力
    public defence:number; // 防御
    public dodge:number; // 闪避%

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
        else if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }
}

// 怪物
class MonsterFactory {
    public creators = {
        // 兔子
        "Bunny": (bt, ps) => this.doMove("afterPlayerActed", 3, this.doAttack("afterPlayerActed", this.createNormalMonster(bt, 5, 1)))
    };

    // 创建一个普通的怪物
    createNormalMonster(bt:Battle, hp:number, power:number, defence:number = 0, dodge:number = 0):Monster {
        var m = new Monster(bt);
        m.canUse = () => true;
        m.hp = hp;
        m.maxHp = hp;
        m.power = power;
        m.hazard = true;
        m.blockUncover = true;
        m.dodge = dodge;

        // 使用，即攻击怪物
        m.use = () =>  {
            m.bt.implPlayerAttackMonster(m);
            return m.hp > 0;
        };

        return m;
    }

    // 为怪物在指定逻辑点添加一个行为
    addAI(m:Monster, logicPoint:string, act) {
        var doPrior = m[logicPoint];
        m[logicPoint] = () => {
            if (doPrior != undefined)
                doPrior();

            act();
        }
        
        return m;
    }

    // 攻击玩家一次
    doAttack(logicPoint:string, m:Monster):Monster {
        return this.addAI(m, logicPoint, () => m.bt.implMonsterAttackPlayer(m));
    }

    // 随机移动一次，dist 表示移动几格
    doMove(logicPoint:string, dist:number, m:Monster):Monster {
        var dir = [[-1,0],[1,0],[0,-1],[0,1]];
        return this.addAI(m, logicPoint, () => {
            var path = [{x:m.pos.x, y:m.pos.y}];
            for (var i = 0; i < dist; i++) {
                var d = dir[m.bt.srand.nextInt(0, dir.length)];
                var lastPt = path[path.length - 1];
                var x = lastPt.x + d[0];
                var y = lastPt.y + d[1];
                if ((m.pos.x == x && m.pos.y == y) || m.bt.level.map.isWalkable(x, y))
                    path.push({x:x, y:y});
            }

            m.bt.implMonsterMoving(m, path);
        });
    }
}
