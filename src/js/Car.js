class Car {
    constructor(length, width, x=0, y=0, a=0) {
        this.x = x;
        this.y = y;
        this.a = a;
        this.b = 0;
        this.length = length;
        this.width = width;
        this.centerPointPos = length * 0.5;
    }

    applyPos(newPos) {
        this.x = newPos.x;
        this.y = newPos.y;
        this.a = newPos.a;
    }

    getPos() {
        return {x:this.x, y:this.y, a: this.a};
    }

}

export default Car;