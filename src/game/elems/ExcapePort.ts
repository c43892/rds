
// 逃跑出口
class EscapePort extends Elem {
    public constructor() {
        super();
        this.type = "EscapePort";
        this.use = Elem.escape;
        this.canUse = () => true; // 任何时候可使用
        this.canUseOn = () => false; // 不可对其它目标使用(不可移动)
        this.canUseOther = () => true; // 不影响其它元素使用
        this.canUseOtherOn = () => true; // 不影响其它元素对其它目标使用
    }
}