
declare class GridNode {
    x:number;
    y:number;
    weight:number;
}

declare class Graph {
    grid:GridNode[][];
    constructor (gs:number[][]);
}

declare module astar {
    function search(graph:Graph, start:GridNode, end:GridNode):GridNode[];
}
