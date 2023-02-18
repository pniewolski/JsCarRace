import Car from "./Car.js";
import Graphics from "./Graphics.js";
import Keyboard from "./Keyboard.js"
import Physics from "./Physics.js";
import Level from "./Level.js";
import Multiplayer from "./Multiplayer.js";
import HTMLInterface from "./HTMLInterface.js";
import GameFinder from "./GameFinder.js";


class Simulation {
    constructor() {
        this.level = new Level();
        this.multiplayer = null;
        this.interface = new HTMLInterface(this);
        this.net_meReady = false;
        this.net_remoteReady = false;

        this.fps = 45;
        this.interval = Math.ceil(1000 / this.fps);
        this.counter = 0;

        this.lap = 0;
        this.lastLapStart = 0;
        this.ghost = [];
        this.currentGhost = [];
        this.collisionShift = null;
    }

    requestGameStart(options) {
        switch (options.mode) {
            case "single":
                this.setSim();
                break;
            case "multi":
                this.startMultiplayerGame();
                break;
            case "multirandom":
                this.startMultiplayerRandomGame();
                break;
                
        }

    }

    startMultiplayerGame() {
        let clientId = this.interface.getMultiplayerIdentifier();
        console.log("client ID", clientId);
        this.multiplayer = new Multiplayer(this);
        this.multiplayer.initialize(clientId);
    }
    
    async startMultiplayerRandomGame() {
        this.gameFinder = new GameFinder(this.interface.getSelectedLevel());
        let foundGuid = await this.gameFinder.getGame();
        this.multiplayer = new Multiplayer(this);
        console.log("found guid: "+foundGuid);
        if (foundGuid == "nogame") {
            this.multiplayer.initialize(false,this.gameFinder);
        } else {
            this.multiplayer.initialize(foundGuid);
        }
    }

    networkMessage(message) {
        switch (message.command) {
            case "clientReady":
                this.setSim(null, true);
                break;

            case "setLevel":
                this.startClientGame(message.payload);
                break;

            case "setReady":
                this.net_remoteReady = true;
                this.checkBothReady();
                break;

            case "collisionShift":
                this.collisionShift = JSON.parse(message.payload);
                break;

            case "refuseConnection":
                alert("Pod tym linkiem już gra ktoś inny. Poproś znajomego aby wysłał Ci nowy link lub sam go wygeneruj.");
                this.interface.clearURL();
                location.reload();
                break;

        }
    }

    startClientGame(level) {
        this.setSim(level, true);
    }

    async setSim(level = null, network = false) {
        if (!level) {
            level = this.interface.getSelectedLevel();
        }

        if (this.gameFinder) {
            this.gameFinder.stopTimer();
        }
        this.level.path = level;
        this.interface.hideButtons();
        this.isNetworkGame = network;

        let res = await this.level.loadLevel();
        let props = this.level.data.properties;

        this.keyboard = new Keyboard();
        this.graphics = new Graphics("gameCanvas");
        if (this.isNetworkGame && this.multiplayer.serverMode) {
            this.car = new Car(props.carLength, props.carWidth, props.startPositionSecondPlayer.x, props.startPositionSecondPlayer.y, props.startPositionSecondPlayer.a);
        } else {
            this.car = new Car(props.carLength, props.carWidth, props.startPosition.x, props.startPosition.y, props.startPosition.a);
        }
        this.physics = new Physics(this.car, this.keyboard, this.multiplayer);

        this.graphics.loadCarImage(props.carImage);
        this.graphics.loadLevelImage(props.levelBackground);

        if (this.isNetworkGame) {
            this.prepareNetworkGameStart();
        } else {
            this.startGameTimer();
        }
    }

    prepareNetworkGameStart() {
        if (this.multiplayer.serverMode) {
            this.multiplayer.sendSystemData("setLevel", this.level.path);
        }
        this.net_meReady = true;
        this.multiplayer.sendSystemData("setReady", "true");
        this.checkBothReady();
    }

    checkBothReady() {
        if (this.net_meReady && this.net_remoteReady) {
            this.startGameTimer();
        }
    }

    startGameTimer() {
        this.interface.clearURL();
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        this.gameTimer = setInterval(this.simTick, this.interval, this);
    }

    checkLapTime() {
        let finishLine = this.physics.checkCrossedFinishLine(this.level.data.finishLine);
        this.interface.displayProperty("speed", Math.floor(20 * this.physics.getCurrentSpeed()));
        if (finishLine != 0) {
            this.lap += finishLine;
            if (finishLine < 0) {
                return;
            }
            if (!this.lastLapCount) {
                this.lastLapCount = 1;
            }
            if (this.lap == this.lastLapCount) {
                return;
            }
            this.interface.displayProperty("lap", this.lap);
            this.lastLapCount = this.lap;
            let currentTime = this.counter - this.lastLapStart;
            this.interface.displayProperty("currLap", currentTime, true);
            this.lastLapStart = this.counter;
            if (!this.bestTime) {
                this.bestTime = currentTime;
            }
            if (currentTime <= this.bestTime) {
                this.bestTime = currentTime;
                this.interface.displayProperty("bestLap", this.bestTime, true);
                this.ghost = this.currentGhost;
            }

            this.currentGhost = [];
            console.log("lap:", this.lap, "czas:", currentTime, "best:", this.bestTime);
        }

    }

    handleGhost(data) {
        let currentCounter = this.counter - this.lastLapStart;
        this.currentGhost[currentCounter] = data;
        if (this.ghost[currentCounter]) {
            return this.ghost[currentCounter];
        }
        return false;
    }

    handleTime() {
        let currentCounter = this.counter - this.lastLapStart;
        this.interface.displayProperty("time", currentCounter, true);
    }

    simTick(self) {
        if (self.isNetworkGame && (self.counter - self.multiplayer.remoteCar.n) > 5) {
            return;
        }
        if (self.isNetworkGame && self.collisionShift) {
            self.physics.doCollisionShift(self.collisionShift);
            self.collisionShift = null;
        }
        self.graphics.clearBoard();
        self.physics.tick(self.level);


        self.checkLapTime();

        self.graphics.setCamera(self.car);
        self.graphics.paintLevel(self.level);
        self.graphics.paintCar(self.car, self.car);
        if (self.isNetworkGame) {
            self.multiplayer.sendCarData({ x: self.car.x, y: self.car.y, a: self.car.a, b: self.car.b, n: self.counter });
            self.graphics.paintCar(self.multiplayer.remoteCar, self.car, true);
        } else {
            self.graphics.paintCar(self.handleGhost({ x: self.car.x, y: self.car.y, a: self.car.a, b: self.car.b }), self.car, true);
        }
        self.handleTime();
        self.graphics.restoreCamera();

        self.counter += 1;
    }

}

export default Simulation;