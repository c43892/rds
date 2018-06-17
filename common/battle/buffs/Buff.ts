class Buff {
    public type:string;
    private owner; // 所属对象
    constructor(owner, type:string) {
        this.type = type;
        this.owner = owner;
    }

    public toString():string {
        var info = {type:this.type};
        return JSON.stringify(info);
    }

    public static fromString(owner, str:string):Buff {
        var info = JSON.parse(str);
        var type = info.type;

        var creators = {
            "BuffDeathGod": () => new BuffDeathGod(owner)
        };

        var c = creators[type];
        Utils.assert(c, "no such a buff: " + type);
        return c();
    }

    // 各逻辑挂接点
    public onPlayerActed; // 无参数
}