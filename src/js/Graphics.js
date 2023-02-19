class Graphics {

    constructor(canvasContainerId, carImage, levelImage, cameraSpeed = 2) {
        this.c = document.getElementById(canvasContainerId);
        this.ctx = this.c.getContext("2d");
        this.loadCarImage(carImage);
        this.loadLevelImage(levelImage);
        this.camera = { x: 0, y: 0, a: 0 };
        this.centerX = this.c.width / 2;
        this.centerY = this.c.height / 2;
        this.cameraSpeed = cameraSpeed;
        this.carImage = null;
        this.levelImage = null;
    }

    clearBoard() {
        this.ctx.clearRect(0, 0, this.c.width, this.c.height);
    }

    drawLineByAngle(p, angle, len, color = "black", line = 1, pointOnCenter = false) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = line;
        let dx = Math.cos(angle) * len;
        let dy = Math.sin(angle) * len;
        if (pointOnCenter) {
            this.ctx.moveTo(p.x - dx, p.y - dy);
        } else {
            this.ctx.moveTo(p.x, p.y);
        }
        this.ctx.lineTo(p.x + dx, p.y + dy);
        this.ctx.stroke();
        return { x: p.x + dx, y: p.y + dy };
    }

    drawLineByPoints(p, p2, color = "black", line = 1) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = line;
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
        return p2;
    }

    paintPolygons(edges, colorEdge, colorFill) {
        this.ctx.fillStyle = colorFill;
        this.ctx.strokeStyle = colorEdge;
        this.ctx.lineWidth = 3;

        edges.forEach(wallLoop => {
            this.ctx.beginPath();
            this.ctx.moveTo(wallLoop[0].x, wallLoop[0].y);
            for (let n = 1; n < wallLoop.length; n++) {
                this.ctx.lineTo(wallLoop[n].x, wallLoop[n].y);
            }
            this.ctx.lineTo(wallLoop[0].x, wallLoop[0].y);
            if (colorEdge) this.ctx.stroke();
            this.ctx.fill();
        });
    }

    loadCarImage(carImage) {
        this.carImage = new Image();
        this.carImage.src = carImage;
    }

    loadLevelImage(levelBackground) {
        this.levelImage = new Image();
        this.levelImage.src = levelBackground;
    }

    paintCar(car, carProto, ghost = false) {
        this.ctx.translate(car.x, car.y);
        this.ctx.rotate(car.a);
        this.drawLineByAngle({ x: carProto.length * 0.8, y: carProto.width * 0.36 }, car.b, carProto.length * 0.1, "black", carProto.width / 7, true);
        this.drawLineByAngle({ x: carProto.length * 0.8, y: carProto.width * -0.36 }, car.b, carProto.length * 0.1, "black", carProto.width / 7, true);
        if (ghost) {
            this.ctx.globalAlpha = 0.4;
        }
        if (this.carImage) this.ctx.drawImage(this.carImage, 0, -carProto.width / 2, carProto.length, carProto.width);
        if (ghost) {
            this.ctx.globalAlpha = 1.0;
        }
        this.ctx.rotate(-car.a);
        this.ctx.translate(-car.x, -car.y);
    }

    paintLevel(level) {
        if (this.levelImage) this.ctx.drawImage(this.levelImage, 0, 0);
        /*this.paintPolygons(level.data.track,"red","rgba(0,0,0,0.2)");
        this.paintPolygons(level.data.gravel,"orange","rgba(23,45,0,0.1)");
        this.paintPolygons(level.data.ice,"blue","rgba(0,45,200,0.1)");*/

    }

    setCamera(car) {
        let newCameraX = car.x - this.centerX;
        let newCameraY = car.y - this.centerY;

        newCameraX = (newCameraX + this.cameraSpeed * this.camera.x) / (this.cameraSpeed + 1);
        newCameraY = (newCameraY + this.cameraSpeed * this.camera.y) / (this.cameraSpeed + 1);

        this.camera = { x: newCameraX, y: newCameraY, a: car.a };
        this.ctx.translate(-this.camera.x, -this.camera.y);

    }

    restoreCamera() {
        this.ctx.translate(this.camera.x, this.camera.y);
    }

    paintCountdown(sec) {
        let text = 5 - sec;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '120px serif';
        this.ctx.fillText(text, 300 + this.camera.x, 200 + this.camera.y);
    }


}

export default Graphics;