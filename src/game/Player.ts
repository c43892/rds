
// 玩家角色数据
class Player {
    public currentLevel:string; // 当前关卡配置名称

    // 血量逻辑
    public hp:number;
    public maxHp:number;
    public addHp(num:number) {
        this.hp += num;
        if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }
}
