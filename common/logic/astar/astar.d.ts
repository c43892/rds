
declare class GridNode {
    x:number;
    y:number;
    weight(_x:number, _y:number):number;
}

declare class Graph {
    grid:GridNode[][];
    constructor (gs:any[][]);
}

declare module astar {
    function search(graph:Graph, start:GridNode, end:GridNode):GridNode[];
}
