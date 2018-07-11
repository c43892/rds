namespace astar{
    export class Graph {
        private grid:astar.Grid;
        private walkableChecker;

        constructor(w, h, walkableChecker) {
            this.grid = new Grid(w, h, walkableChecker);
            this.walkableChecker = walkableChecker;
        }

        public search(sx, sy, ex, ey, findNearest:boolean) {
            this.grid.setStartNode(sx, sy);
            this.grid.setEndNode(ex, ey);
            
            var aStar:AStar = new AStar();
            if(aStar.findPath(this.grid, findNearest))
            {
                var path = aStar.path;
                var st = path.shift(); // remove the start node
                Utils.assert(st.x == sx && st.y == sy, "this first node should be start node");
                return Utils.map(path, (node:Node) => { return {x:node.x, y:node.y}; });
            }
            else {
                return [];
            }
        }
    }
}
