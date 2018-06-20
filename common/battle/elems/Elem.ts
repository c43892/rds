
// 地图上每个怪物，物品，符文都是一个元素
class Elem {
    constructor(bt:Battle) {
        this.$$bt = bt;
        this.canUse = () => false;  // 不可使用
        this.canUseAt = () => false; // 不可对其它目标使用(不可移动)
        this.canUseOther = () => true;  // 不影响其它元素使用
        this.canUseOtherAt = () => true;  // 不影响其它元素对其它目标使用
    }

    public $$id:string; // 调试用
    private $$bt; // 所属战斗对象
    public setBattle(bt:Battle) { this.$$bt = bt; }
    public bt():Battle { return this.$$bt; } // 所属战斗对象
    public type: string; // 元素类型
    public cnt:number; // 叠加数量
    public pos = {x: 0, y: 0}; // 元素当前坐标位置
    public hazard:boolean; // 是否有害，有害的元素会被相邻格子计数
    public blockUncover:boolean; // 是否阻挡后面的格子（比如岩石）
    public movingSpeed:number; // 移动速度
    public getGrid = () => this.bt().level.map.getGridAt(this.pos.x, this.pos.y); // 当前元素所在的地图格

    // 各逻辑点，挂接的都是函数
    public canUse = () => { return false; } // 一个 function():boolean
    public canUseAt = (x, y) => { return false }; // 一个 function(x:number, y:number):boolean
    public canUseOther = (e) => { return true; }; // 一个 function(e:Elem):boolean，用于表示是否影响另外一个元素的使用
    public canUseOtherAt = (e, x, y) => { return true; } // 一个 function(e:Elem, x:number, y:number)，用于表示是否影响另外一个元素使用在另外一个目标元素上
    public canBeMoved = false; // 可以被玩家移动
    
    // 以下关于 use 相关的逻辑，都不考虑未揭开情况，因为 Elem 并不包含揭开这个逻辑，
    // 也不考虑被其它元素的影响的情况，这种影响属于地图整体逻辑的一部分
    public use; // 一个 function():boolean, 返回值表示是否要保留（不消耗）
    public useAt; // 一个 function(x:number, y:number):boolean, 返回值表示是否要保留（不消耗）

    // 各种逻辑点，Elem 应该在此作响应逻辑
    public afterPlayerActed; // 当角色行动结束时触发，会被赋值为一个 function():void 的函数
    public beforePlayerMove2NextLevel; // 当角色准备进入下一层时触发
    public onDie; // 物品死亡时（物品使用后从地图上移除也算）
    
    public attrs; // 来自配置表的属性
    public dropItems:Elem[] = [];

    // 添加掉落物品
    public addDropItem(e:Elem) {
        // 目前限定，Item 和 Prop 类型的非金钱掉落，最多只能有一个
        Utils.assert(Utils.indexOf(this.dropItems, (elem) => elem.type != "Coins" && (elem instanceof Prop || elem instanceof Item)) < 0,
                 "only one drop item allowed (except Coins or Relic or Monster)");

        if (e.attrs.canOverlap) { // 叠加物品
            var n = Utils.indexOf(this.dropItems, (elem) => elem.type == e.type);
            if (n >= 0)
                this.dropItems[n].cnt += e.cnt;
            else
                this.dropItems.push(e);
        } else {
            this.dropItems.push(e);
        }
    }

    // 序列化和反序列化

    public toString():string {
        var dropItmes = [];
        for (var dp of this.dropItems)
            dropItmes.push(dp.toString());

        return JSON.stringify({type:this.type, attrs:this.attrs, dropItems:dropItmes});
    }

    public static fromString(str:string):Elem {
        var info = JSON.parse(str);
        var e = ElemFactory.create(info.type, info.attrs);
        for (var dp of info.dropItems)
            e.dropItems.push(Elem.fromString(dp));
        
        return e;
    }
}
