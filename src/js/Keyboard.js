class Keyboard {
    constructor() {
        this.keysPressed = { up: false, down: false, left: false, right: false, handbrake: false };

        window.addEventListener("keydown", (event) => {
            this.keysDown(event);
        });

        window.addEventListener("keyup", (event) => {
            this.keysUp(event);
        });
    }

    keysDown(e) {
        switch (e.keyCode) {
            case 38:
                this.keysPressed.up = true;
                break;
            case 40:
                this.keysPressed.down = true;
                break;
            case 37:
                this.keysPressed.left = true;
                break;
            case 39:
                this.keysPressed.right = true;
                break;
            case 32:
                this.keysPressed.handbrake = true;
                break;
        }
    }

    keysUp(e) {

        switch (e.keyCode) {
            case 38:
                this.keysPressed.up = false;
                break;
            case 40:
                this.keysPressed.down = false;
                break;
            case 37:
                this.keysPressed.left = false;
                break;
            case 39:
                this.keysPressed.right = false;
                break;
            case 32:
                this.keysPressed.handbrake = false;
                break;
        }

    }
}

export default Keyboard;