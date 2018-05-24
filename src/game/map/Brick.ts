
// 地图上每一个格子的状态
enum BrickStatus {
    Covered, // 默认状态，被覆盖
    Uncovered, // 已经被揭开
    Marked, // 未揭开，但已经标记了其中的内容
    Blocked, // 用户标记为危险，不可被揭开
}

// 表示一个地图格
class Brick {

    // 表示地图块的坐标
    public pos = {x: 0, y: 0};

    // 地图格子默认是覆盖的状态
    public status : BrickStatus = BrickStatus.Covered;

    // 广义上的覆盖状态
    public isCovered = () => this.status != BrickStatus.Uncovered;

    // 会被赋值一个 function(x, y): Elem 的函数，用于获取当前格子上的元素
    public getElem;

    // 会被赋值一个 function(x, y): Number 的函数，用于获取当前格子八邻的隐藏元素数量
    public getCoveredElemNum;
}