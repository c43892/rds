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
        // "Bunny": (bt) => this.doAttackBack(this.createNormalMonster(bt, 5, 1)) // 被攻击时反击
        // "Bunny": (bt) => this.doAttackBack(this.doSneakAttack(this.createNormalMonster(bt, 5, 1))) // 偷袭行为是攻击，被攻击时反击
        "Bunny": (bt) => this.doAttackBack(this.doSneakStealMoney(this.createNormalMonster(bt, 5, 1))) // 偷袭行为是偷钱，被攻击时反击
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
        m.use = async () =>  {
            await m.bt.implPlayerAttackMonster(m);
            return m.hp > 0;
        };

        return m;
    }

    // 为怪物在指定逻辑点添加一个行为
    addAI(m:Monster, logicPoint:string, act, condition = undefined) {
        var doPrior = m[logicPoint];
        m[logicPoint] = async (ps) => {
            if (doPrior != undefined)
                await doPrior(ps);

            if (!condition || condition(ps))
                await act(ps);
        }
        
        return m;
    }

    // 设定偷袭逻辑
    addSneakAI(m:Monster, act) {
        return this.addAI(m, "onGridUncovered", act, (ps) => ps.x == m.pos.x && ps.y == m.pos.y 
                                                        && ps.stateBeforeUncover != GridStatus.Marked);
    }

    // 偷袭：攻击
    doSneakAttack(m:Monster):Monster {
        return this.addSneakAI(m, () => m.bt.implMonsterAttackPlayer(m));
    }

    // 偷袭：偷钱
    doSneakStealMoney(m:Monster):Monster {
        return this.addSneakAI(m, () => m.bt.implStealMoney(m, 10));
    }

    // 被攻击时反击一次
    doAttackBack(m:Monster):Monster {
        return this.addAI(m, "onElemUsed", () => m.bt.implMonsterAttackPlayer(m), (ps) => ps.elem == m);
    }

    // 攻击玩家一次
    doAttack(logicPoint:string, m:Monster):Monster {
        return this.addAI(m, logicPoint, () => m.bt.implMonsterAttackPlayer(m));
    }

    // 随机移动一次，dist 表示移动几格
    doMove(logicPoint:string, dist:number, m:Monster):Monster {
        var dir = [[-1,0],[1,0],[0,-1],[0,1]];
        return this.addAI(m, logicPoint, async () => {
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
