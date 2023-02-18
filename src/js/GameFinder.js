class GameFinder {
    constructor(level) {
        this.gameLevel = level;
        this.requestInterval = null;
    }
    async getGame() {
        console.log("getting game", this.gameLevel);
        const response = await fetch('https://car-game-api.aplikacje.top/?command=get-game&level='+this.gameLevel);
        const data = await response.text();
        return data;
    }

    sendOffer(guid, level) {
        fetch('https://car-game-api.aplikacje.top/?command=offer-game&level='+level+'&guid='+guid);
    }
    offerGame(guid) {
        this.sendOffer(guid, this.gameLevel);
        this.requestInterval = setInterval(() => {
            this.sendOffer(guid, this.gameLevel);
        }, 5000);
    }

    stopTimer() {
        clearInterval(this.requestInterval);
    }   
}

export default GameFinder;