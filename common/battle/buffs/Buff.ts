class Buff {
    owner; // 所属对象
    constructor(owner) {
        this.owner = owner;
    }

    // 各逻辑挂接点
    public onPlayerActed; // 无参数
}