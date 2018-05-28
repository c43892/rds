
// 地图上每个怪物，物品，符文都是一个元素
class Elem {

    constructor() {
        this.canUse = () => false;  // 不可使用
        this.canUseOn = () => false; // 不可对其它目标使用(不可移动)
        this.canUseOther = () => true;  // 不影响其它元素使用
        this.canUseOtherOn = () => true;  // 不影响其它元素对其它目标使用
    }

    public type: string; // 元素类型
    public pos = {x: 0, y: 0}; // 元素当前坐标位置
    public hazard:boolean; // 是否有害，有害的元素会被相邻格子计数
    
    public getBrick; // 会被赋值一个 function(x, y): Brick 的函数，用于获取当前元素所在的地图格

    // 各逻辑点，挂接的都是函数
    public canUse; // 一个 function():boolean
    public canUseOn; // 一个 function(e:Elem):boolean
    public canUseOther; // 一个 function(e:Elem):boolean，用于表示是否影响另外一个元素的使用
    public canUseOtherOn; // 一个 function(e:Elem, target:Elem)，用于表示是否影响另外一个元素使用在另外一个目标元素上
    
    // 以下关于 use 相关的逻辑，都不考虑未揭开情况，因为 Elem 并不包含揭开这个逻辑，
    // 也不考虑被其它元素的影响的情况，这种影响属于地图整体逻辑的一部分
    public use; // 一个 function():void
    public useOn; // 一个 function(e:Elem):void

    // 当用户回合结束时，会被赋值为一个 function():void 的函数
    public afterPlayerAction;

    // 实现各种元素功能的 api
    public static escape; // 具体逃跑逻辑由外层指定，是一个 function():void
    public static getPlayer; // 获取当前角色
    public static addPlayerHp = (hp:number) => { // 给玩家角色 +hp
        let p = Elem.getPlayer();
            p.addHp(hp);
            console.log("+hp: " + hp);
    }
    public static Go2NextLevel; // 进入下一关
}