import Geometry from "./Geometry.js";

class Level {
    constructor() {
        this.path = "";
        this.data = {};
    }

    calculateLinesForLevelLimits(polylines) {
        polylines.forEach(wallLoop => {
            for (let n = 0; n < wallLoop.length; n++) {
                wallLoop[n].edgeInfo = {
                    p1: { x: wallLoop[n].x, y: wallLoop[n].y },
                    p2: { x: wallLoop[(n + 1) % wallLoop.length].x, y: wallLoop[(n + 1) % wallLoop.length].y },
                }
            }

            for (let n = 0; n < wallLoop.length; n++) {
                wallLoop[n].edgeInfo.insideLine = Geometry.lineFrom2Points(wallLoop[n].edgeInfo.p1, wallLoop[n].edgeInfo.p2);
                wallLoop[n].edgeInfo.lineA = Geometry.perpendicularThroughPoint(wallLoop[n].edgeInfo.insideLine, wallLoop[n].edgeInfo.p1, 1);
                wallLoop[n].edgeInfo.lineB = Geometry.perpendicularThroughPoint(wallLoop[n].edgeInfo.insideLine, wallLoop[n].edgeInfo.p2, -1);
            }
        });
    }

    async loadLevel() {
        console.log("load level", this.path);
        const response = await fetch(this.path);
        const mapCode = await response.json();
        this.data = mapCode;
        this.calculateLinesForLevelLimits(this.data.track);
    }

}

export default Level;