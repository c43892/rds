
// 元素描述界面，怪物，遗物和其它三类
class ItemDescView extends egret.DisplayObjectContainer {
    constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;

        this.buildMonsterDescView();
        this.buildRelicDescView();
        this.buildItemDescView();
    }

    // 怪物，有头部（包含图标和基本属性值），多条属性描述
    monsterDescs:egret.DisplayObjectContainer;
    buildMonsterDescView() {

    }

    // 遗物，有头部（包含图标和名称等级描述），属性描述和变异描述三部分
    relicsDescs:egret.DisplayObjectContainer;
    buildRelicDescView() {

    }
    
    // 物品只有名称和简单文字描述两部分
    itemDescs:egret.DisplayObjectContainer;
    buildItemDescView() {

    }
}