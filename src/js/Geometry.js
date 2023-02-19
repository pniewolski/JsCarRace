class Geometry {
    static getPivotPoint(o, vehicleAngle, steeringAngle, vehicleLen) {
        let r = vehicleLen / Math.tan(steeringAngle);
        let px = o.x + r * Math.cos(vehicleAngle + Math.PI * 0.5);
        let py = o.y + r * Math.sin(vehicleAngle + Math.PI * 0.5);
        return { x: px, y: py, r: r };
    }

    static getAngleSpeed(v, r) {
        return v / r;
    }

    static rotatePoint(rotCenter, rotPoint, angle) {
        let rx = (rotPoint.x - rotCenter.x) * Math.cos(angle) - (rotPoint.y - rotCenter.y) * Math.sin(angle) + rotCenter.x;
        let ry = (rotPoint.y - rotCenter.y) * Math.cos(angle) + (rotPoint.x - rotCenter.x) * Math.sin(angle) + rotCenter.y;
        return { x: rx, y: ry };
    }

    static shiftByAngleAndDistance(p, angle, distance) {
        let x2 = p.x + distance * Math.cos(angle);
        let y2 = p.y + distance * Math.sin(angle);
        return { x: x2, y: y2 };
    }

    static findCarCenterPoint(p, dist) {
        let centerPoint = this.shiftByAngleAndDistance(p, p.a, dist);
        p.center = {};
        p.center.x = centerPoint.x;
        p.center.y = centerPoint.y;
        return p.center;
    }

    static distanceTwoPoints(t, p) {
        return Math.sqrt((t.x - p.x) ** 2 + (t.y - p.y) ** 2);
    }

    static angle3Points(p1, p2, p3) {
        let a1 = Math.atan((p1.y - p2.y) / (p1.x - p2.x));
        let a2 = Math.atan((p3.y - p2.y) / (p3.x - p2.x));
        return a2 - a1;
    }

    static estimatePointCloseToLineSegment(p, l1, l2, margin = 50) {
        let minx = Math.min(l1.x, l2.x) - margin;
        let miny = Math.min(l1.y, l2.y) - margin;
        let maxx = Math.max(l1.x, l2.x) + margin;
        let maxy = Math.max(l1.y, l2.y) + margin;

        if (minx <= p.x && p.x <= maxx && miny <= p.y && p.y <= maxy) {
            return true;
        }
        return false;
    }

    static lineFrom2Points(p1, p2) {
        let a = p1.y - p2.y;
        let b = - p1.x + p2.x;
        let c = p1.x * p2.y - p2.x * p1.y;
        return { a: a, b: b, c: c };
    }

    static checkPointOnRightSideOfLine(p, l) {
        if (p.x * l.a + p.y * l.b + l.c > 0) {
            return true;
        } else {
            return false;
        }
    }

    static perpendicularThroughPoint(l, p, rotation = 1) {
        let a2 = rotation * l.b;
        let b2 = -rotation * l.a;
        let c2 = -(a2 * p.x + b2 * p.y);
        return { a: a2, b: b2, c: c2 };
    }

    static getCarCornerPoints(car, length, width) {
        let p1 = { x: car.x, y: car.y - width * 0.4 };
        let p2 = { x: car.x, y: car.y + width * 0.4 };
        let p3 = { x: car.x + length, y: car.y - width * 0.4 };
        let p4 = { x: car.x + length, y: car.y + width * 0.4 };

        return [
            this.rotatePoint(car, p1, car.a),
            this.rotatePoint(car, p2, car.a),
            this.rotatePoint(car, p3, car.a),
            this.rotatePoint(car, p4, car.a),
        ]
    }

    static closestPointInLine(l, p) {
        let x1 = (l.b * (l.b * p.x - l.a * p.y) - l.a * l.c) / (l.a ** 2 + l.b ** 2);
        let y1 = (l.a * (-l.b * p.x + l.a * p.y) - l.b * l.c) / (l.a ** 2 + l.b ** 2);
        return { x: x1, y: y1 };
    }

    static createPushVector(p, line) {
        let closestP = this.closestPointInLine(line, p);
        return { dx: closestP.x - p.x, dy: closestP.y - p.y };
    }


    static addVectorsAvgToPoint(p, vArr, centerPointPos) {
        if (vArr.length == 0) {
            return p;
        }

        this.findCarCenterPoint(p, centerPointPos);

        let dx = 0;
        let dy = 0;
        let da = 0;
        for (let n = 0; n < vArr.length; n++) {
            dx += vArr[n].dx;
            dy += vArr[n].dy;
            da += this.angle3Points(p, p.center, { x: p.x + vArr[n].dx, y: p.y + vArr[n].dy });
        }

        dx = dx / vArr.length;
        dy = dy / vArr.length;
        da = da / vArr.length;
        if (da > 0.015) da = 0.015;
        else if (da < -0.015) da = -0.015;

        return {
            ...p,
            x: p.x + dx,
            y: p.y + dy,
            a: p.a - da,
        }
    }

    static crossedProbabilityX(p1, p2, p3, p4, limit) {
        if (Math.abs(p1.x - p3.x) < limit) return true;
        if (Math.abs(p1.x - p4.x) < limit) return true;
        if (Math.abs(p2.x - p3.x) < limit) return true;
        if (Math.abs(p2.x - p4.x) < limit) return true;
        return false;
    }

    static crossedProbabilityY(p1, p2, p3, p4, limit) {
        if (Math.abs(p1.y - p3.y) < limit) return true;
        if (Math.abs(p1.y - p4.y) < limit) return true;
        if (Math.abs(p2.y - p3.y) < limit) return true;
        if (Math.abs(p2.y - p4.y) < limit) return true;
        return false;
    }

    static lineIntersect(p1, p2, p3, p4) {
        if ((p1.x === p2.x && p1.y === p2.y) || (p3.x === p4.x && p3.y === p4.y)) {
            return false;
        }
        let denominator = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y))
        if (denominator === 0) {
            return false;
        }
        let ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator
        let ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false;
        }
        let x = p1.x + ua * (p2.x - p1.x)
        let y = p1.y + ua * (p2.y - p1.y)
        return { x: x, y: y }
    }

    static crrossedLine(p1, p2, p3, p4) {
        if (!this.crossedProbabilityX(p1, p2, p3, p4, 100) && !this.crossedProbabilityY(p1, p2, p3, p4, 100)) {
            return 0;
        }

        if (this.lineIntersect(p1, p2, p3, p4)) {
            let line = this.lineFrom2Points(p3, p4);
            if (this.checkPointOnRightSideOfLine(p1, line)) {
                return 1;
            } else {
                return -1;
            }
        }

        return 0;
    }

    static getIntersectionPointsTwoPolylines(poly1, poly2) {
        let result = [];
        for (let n1 = 0; n1 < poly1.length; n1++) {
            let l1 = { p1: poly1[n1], p2: poly1[(n1 + 1) % poly1.length] };
            for (let n2 = 0; n2 < poly2.length; n2++) {
                let l2 = { p1: poly2[n2], p2: poly2[(n2 + 1) % poly2.length] };
                let cross = this.lineIntersect(l1.p1, l1.p2, l2.p1, l2.p2);
                if (cross) {
                    result.push(cross);
                }
            }
        }
        return result.length > 0 ? result : null;
    }

    static vectorFrom2Points(p1, p2) {
        let dx = p1.x - p2.x;
        let dy = p1.y - p2.y;
        let length = this.distanceTwoPoints(p1, p2);
        let angle = Math.atan2(dy, dx);
        return { a: angle, l: length };
    }

    static addAngleVectorToPoint(p, v) {
        let v2 = this.angleVectorToPointVector(v); 
        return { x: p.x + v2.dx, y: p.y + v2.dy };
    }

    static angleVectorToPointVector(v) {
        let dx = v.l * Math.cos(v.a);
        let dy = v.l * Math.sin(v.a);
        return { dx: dx, dy: dy };
    }
}

export default Geometry;