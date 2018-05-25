// 红药水
class HpPotion extends Elem {
    public constructor(num:number) {
        super();
        this.type = "HpPotion";
        this.canUse = () => true; // 任何时候可使用
        this.canUseOn = () => false; // 不可对其它目标使用(不可移动)
        this.canUseOther = () => true; // 不影响其它元素使用
        this.canUseOtherOn = () => true; // 不影响其它元素对其它目标使用

        this.use = () => {
            let p = Elem.getPlayer();
            p.addHp(this.num);
            console.log("HpPotion used: " + this.num);
        };

        this.num = num;
    }

    public num:number; // 增加多少 hp
}