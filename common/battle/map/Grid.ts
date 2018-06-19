
// 地图上每一个格子的状态
enum GridStatus {
    Covered, // 默认状态，被覆盖
    Uncovered, // 已经被揭开
    Marked, // 未揭开，但已经标记了其中的内容
    Blocked, // 危险，不可被揭开
}

// 表示一个地图格
class Grid {

    public map:Map; // 反向引用所属地图

    // 表示地图块的坐标
    public pos = {x: 0, y: 0};

    // 地图格子默认是覆盖的状态
    public status : GridStatus = GridStatus.Covered;

    // 广义上的覆盖状态
    public isCovered() { return this.status != GridStatus.Uncovered; }
    // 可以被揭开
    public isUncoverable() { return this.map.isUncoverable(this.pos.x, this.pos.y); }
    // 已经被揭开或者被标记
    public isUncoveredOrMarked() { return this.status == GridStatus.Uncovered || this.status == GridStatus.Marked; }
    // 获取其上的元素
    public getElem() { return this.map.getElemAt(this.pos.x, this.pos.y); }
}