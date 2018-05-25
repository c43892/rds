// 定义各种 Battle 事件，用于连接战斗逻辑和界面

// 指定位置被揭开
class BrickUncoveredEvent extends egret.Event {
    public x:number;
    public y:number;
    public static type:string = "BrickUncovered";

    public constructor(x:number, y:number, bubbles:boolean=false, cancelable:boolean=false)
    {
        super(BrickUncoveredEvent.type, bubbles, cancelable);
        this.x = x;
        this.y = y;
    }
}
