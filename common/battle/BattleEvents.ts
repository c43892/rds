// 定义各种 Battle 事件，用于连接战斗逻辑和界面

// 指定位置状态或元素发生变化
class GridChangedEvent extends egret.Event {
    public x:number;
    public y:number;
    public subType:string; // 进一步类型信息
    public static type:string = "GridChangedEvent";

    public constructor(x:number, y:number, subType:string, bubbles:boolean=false, cancelable:boolean=false)
    {
        super(GridChangedEvent.type, bubbles, cancelable);
        this.subType = subType;
        this.x = x;
        this.y = y;
    }
}

// 角色信息发生变化
class PlayerChangedEvent extends egret.Event {
    public subType:string; // 进一步类型信息
    public static type:string = "PlayerChangedEvent";

    public constructor(subType:string, bubbles:boolean=false, cancelable:boolean=false)
    {
        super(PlayerChangedEvent.type, bubbles, cancelable);
        this.subType = subType;
    }
}

// 怪物信息发生变化
class MonsterChangedEvent extends egret.Event {
    public subType:string; // 进一步类型信息
    public m:Monster; // 目标怪物
    public static type:string = "MonsterChangedEvent";

    public constructor(subType:string, m:Monster, bubbles:boolean=false, cancelable:boolean=false)
    {
        super(MonsterChangedEvent.type, bubbles, cancelable);
        this.subType = subType;
        this.m = m;
    }
}

// 产生攻击结果
class AttackEvent extends egret.Event {
    public subType:string; // 进一步类型信息: player2elem, elem2player, elem2elem
    public r; // 攻击结果
    public m; // 相关怪物
    public static type:string = "AttackEvent";

    public constructor(subType:string, r, m:Monster, bubbles:boolean=false, cancelable:boolean=false)
    {
        super(AttackEvent.type, bubbles, cancelable);
        this.subType = subType;
        this.r = r;
        this.m = m;
    }
}

// 物品移动
class ElemMovingEvent extends egret.Event {
    public subType:string;
    public e:Elem; // 移动主体
    public path; // 移动路径
    public static type:string = "ElemMovingEvent";

    public constructor(subType:string, e:Elem, path, bubbles:boolean=false, cancelable:boolean=false)
    {
        super(ElemMovingEvent.type, bubbles, cancelable);
        this.subType = subType;
        this.e = e;
        this.path = path;
    }
}

// 玩家操作事件，用于录像
class PlayerOpEvent extends egret.Event {
    public op:string; // 玩家操作类型
    public ps; // 玩家操作参数
    public static type:string = "PlayerOpEvent";

    public constructor(op:string, ps, bubbles:boolean=false, cancelable:boolean=false)
    {
        super(PlayerOpEvent.type, bubbles, cancelable);
        this.op = op;
        this.ps = ps;
    }
}