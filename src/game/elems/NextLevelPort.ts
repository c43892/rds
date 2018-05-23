
// 下一关入口
class NextLevelPort extends Elem {
    public constructor() {
        super();
        this.type = "NextLevelPort";
        this.use = NextLevelPort.Go2NextLevel;
        this.canUse = () => true; // 任何时候可使用
        this.canUseOn = () => false; // 不可对其它目标使用(不可移动)
        this.canUseOther = () => true; // 不影响其它元素使用
        this.canUseOtherOn = () => true; // 不影响其它元素对其它目标使用
    }

    // 具体进入下一关逻辑由外层指定，是一个 function():void
    public static Go2NextLevel;
}