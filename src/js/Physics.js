import Geometry from "./Geometry.js";

class Physics {

    constructor(car, keyboard, multiplayer) {
        this.car = car;
        this.keyboard = keyboard;
        this.multiplayer = multiplayer;
        this.v = 0;
        this.previousPosition = this.car.getPos();
        this.maxPushDistance = 30;
    }

    calculatePerfectPosition() {
        let o = {}; //new position

        if (Math.abs(this.car.b) < 0.01) {
            let op = Geometry.shiftByAngleAndDistance(this.car, this.car.a, this.v);
            o.x = op.x;
            o.y = op.y;
            o.a = this.car.a;
        } else {
            let p = Geometry.getPivotPoint(this.car, this.car.a, this.car.b, this.car.length);
            let rotA = Geometry.getAngleSpeed(this.v, p.r);
            let op = Geometry.rotatePoint(p, this.car, rotA);
            o.x = op.x;
            o.y = op.y;
            o.a = this.car.a + rotA;
        }

        return o;
    }

    handleAcceleration(properties, isOnGravel) {
        let drag = 0;
        if (isOnGravel) drag = (this.v) ** 2 * properties.dragMultiplyOnGravel;
        else drag = (this.v) ** 2 * properties.dragMultiply;

        let power = 0;
        if (this.keyboard.keysPressed.up) {
            power = properties.enginePower;
        } else if (this.keyboard.keysPressed.down) {
            drag += properties.brakePower;
            if (this.v > 0) power = -properties.brakePower;
            else power = -properties.engineReversePower;
        }
        if (this.v >= 0) this.v += power - drag;
        else if (this.v < 0) this.v += power + drag;
    }

    handleSteering(properties) {
        if (this.keyboard.keysPressed.left) {
            this.car.b -= 0.1;
            if (this.car.b < -0.6) this.car.b = -0.6;
        } else if (this.keyboard.keysPressed.right) {
            this.car.b += 0.1;
            if (this.car.b > 0.6) this.car.b = 0.6;
        } else {
            if (this.car.b > 0.05) this.car.b -= 0.05;
            else if (this.car.b < -0.05) this.car.b += 0.05;
            else this.car.b = 0;
        }
    }

    getDriftPosFactor(levelProps, isOnIce) {
        if (isOnIce) return levelProps.gripSlideIce;
        else if (this.keyboard.keysPressed.handbrake) return levelProps.gripSlideHadbrake;
        else return levelProps.gripSlideNormal;
    }

    getDriftAngleFactor(levelProps, isOnIce) {
        if (isOnIce) return levelProps.gripHandlingIce;
        else if (this.keyboard.keysPressed.handbrake) return levelProps.gripHandlingHandbrake;
        else return levelProps.gripHandlingNormal;
    }

    calculateSlippery(levelProps, previousPos, currentPos, perfectPos, isOnIce) {
        Geometry.findCarCenterPoint(previousPos, this.car.centerPointPos);
        Geometry.findCarCenterPoint(currentPos, this.car.centerPointPos);

        let deltaX = currentPos.center.x - previousPos.center.x;
        let deltaY = currentPos.center.y - previousPos.center.y;
        let deltaA = currentPos.a - previousPos.a;

        let tmpPos = {
            x: currentPos.x,
            y: currentPos.y,
            a: currentPos.a + deltaA,
        }

        Geometry.findCarCenterPoint(tmpPos, this.car.centerPointPos);

        tmpPos.x = tmpPos.x - tmpPos.center.x + currentPos.center.x + deltaX;
        tmpPos.y = tmpPos.y - tmpPos.center.y + currentPos.center.y + deltaY;

        return {
            x: perfectPos.x * this.getDriftPosFactor(levelProps, isOnIce) + tmpPos.x * (1 - this.getDriftPosFactor(levelProps, isOnIce)),
            y: perfectPos.y * this.getDriftPosFactor(levelProps, isOnIce) + tmpPos.y * (1 - this.getDriftPosFactor(levelProps, isOnIce)),
            a: perfectPos.a * this.getDriftAngleFactor(levelProps, isOnIce) + tmpPos.a * (1 - this.getDriftAngleFactor(levelProps, isOnIce)),
        }

    }

    checkOnePointCollision(pushVectors, collisionPoint, edgeInfo) {
        if (!Geometry.checkPointOnRightSideOfLine(collisionPoint, edgeInfo.insideLine)) return;
        if (!Geometry.checkPointOnRightSideOfLine(collisionPoint, edgeInfo.lineA)) return;
        if (!Geometry.checkPointOnRightSideOfLine(collisionPoint, edgeInfo.lineB)) return;

        let pushVector = Geometry.createPushVector(collisionPoint, edgeInfo.insideLine);
        if (Geometry.distanceTwoPoints({ x: pushVector.dx, y: pushVector.dy }, { x: 0, y: 0 }) > this.maxPushDistance) return;
        pushVectors.push(pushVector);
    }

    checkCollision(edges, useCornerPoints, returnPushVectors) {
        let pushVectors = [];
        edges.forEach(wallLoop => {
            for (let n = 0; n < wallLoop.length; n++) {
                let p1 = wallLoop[n].edgeInfo.p1;
                let p2 = wallLoop[n].edgeInfo.p2;

                if (!Geometry.estimatePointCloseToLineSegment(this.car, p1, p2)) continue;

                let collisionPoint = {};
                if (useCornerPoints) {
                    for (let m = 0; m < this.car.cornerPoints.length; m++) {
                        collisionPoint = this.car.cornerPoints[m];
                        this.checkOnePointCollision(pushVectors, collisionPoint, wallLoop[n].edgeInfo);
                    }
                } else {
                    collisionPoint = Geometry.findCarCenterPoint(this.car, this.car.centerPointPos);
                    this.checkOnePointCollision(pushVectors, collisionPoint, wallLoop[n].edgeInfo);
                }
            }
            if (!returnPushVectors && pushVectors.length > 0) {
                return true;
            }

        });
        if (returnPushVectors) return pushVectors;
        else return false;
    }

    checkRectangleCollision(edges, currentPos) {
        for (let n = 0; n < edges.length; n++) {
            if (edges[n][0].x < currentPos.x && currentPos.x < edges[n][1].x && edges[n][0].y < currentPos.y && currentPos.y < edges[n][1].y) {
                return true;
            }
        }
        return false;
    }

    checkCrossedFinishLine(finishLine) {
        let currentPos = this.car.getPos();
        let previousPos = this.previousPosition;
        return Geometry.crrossedLine(currentPos, previousPos, finishLine[0], finishLine[1]);
    }

    getCurrentSpeed() {
        return Geometry.distanceTwoPoints(this.car.getPos(), this.previousPosition);
    }

    checkCarsCollision() {
        if (!this.multiplayer) {
            return;
        }

        if (!this.multiplayer.serverMode) {
            return;
        }

        let carCenterA = Geometry.findCarCenterPoint(this.car, this.car.centerPointPos);
        let carCenterB = Geometry.findCarCenterPoint(this.multiplayer.remoteCar, this.car.centerPointPos);


        let distance = Geometry.distanceTwoPoints(carCenterA, carCenterB);
        if (!distance) {
            return;

        }
        if (distance > this.car.length * 2) {
            return;
        }

        let carPointsA = Geometry.getCarCornerPoints(this.car, this.car.length, this.car.width);
        let carPointsB = Geometry.getCarCornerPoints(this.multiplayer.remoteCar, this.car.length, this.car.width);

        let intersectionPoints = Geometry.getIntersectionPointsTwoPolylines(carPointsA, carPointsB);

        if (!intersectionPoints) {
            return;
        }

        this.applySimpleCarsCollision(carCenterA, carCenterB);
    }

    applySimpleCarsCollision(myCar, hisCar) {
        let vector = Geometry.vectorFrom2Points(myCar, hisCar);
        vector.l = 3;

        let newCarPos = Geometry.addAngleVectorToPoint(this.car, vector);
        this.car.x = newCarPos.x;
        this.car.y = newCarPos.y;

        let vectorSend = Geometry.angleVectorToPointVector(vector);
        vectorSend.dx = -vectorSend.dx;
        vectorSend.dy = -vectorSend.dy;
        this.multiplayer.sendSystemData("collisionShift", JSON.stringify(vectorSend));
    }

    doCollisionShift(vector) {
        this.car.x += vector.dx;
        this.car.y += vector.dy;
    }

    tick(level) {
        this.checkCarsCollision();

        let currentPos = this.car.getPos();
        let previousPos = this.previousPosition;

        let isOnGravel = this.checkRectangleCollision(level.data.gravel, currentPos);
        let isOnIce = this.checkRectangleCollision(level.data.ice, currentPos);

        this.handleAcceleration(level.data.properties, isOnGravel);
        this.handleSteering(level.data.properties);

        let perfectPos = this.calculatePerfectPosition();
        this.previousPosition = currentPos;

        let finalPos = this.calculateSlippery(level.data.properties, previousPos, currentPos, perfectPos, isOnIce);

        this.car.cornerPoints = Geometry.getCarCornerPoints(finalPos, this.car.length, this.car.width);
        let pushVectors = this.checkCollision(level.data.track, true, true);

        let finalPosAfterCollisions = Geometry.addVectorsAvgToPoint(finalPos, pushVectors, this.car.centerPointPos);

        this.car.applyPos(finalPosAfterCollisions);
    }
}

export default Physics