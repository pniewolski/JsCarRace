class HTMLInterface {
    constructor(simulation) {
        this.buttonConnect = document.getElementById("connect");
        this.buttonSingle = document.getElementById("single");
        this.networkInfoDiv = document.getElementById("networkInfoText");
        this.gameLink = document.getElementById("gameLink");
        this.gameplayContainer = document.getElementById("gameplayContainer");
        this.interfaceContainer = document.getElementById("interfaceContainer");
        this.gameInfoLink = document.getElementById("gameInfoLink");
        this.connectWithRandom = document.getElementById("connectWithRandom"); 
        this.gameLevelSection = document.getElementById("gameLevelSection");
        this.gameLevel = document.getElementById("gameLevel"); 
        this.multiplayerRandomInfo = document.getElementById("multiplayerRandomInfo"); 
        this.circuitChooseInfo = document.getElementById("circuitChooseInfo"); 

        this.simulation = simulation;

        this.addClickListeners();
        this.prepareInterface();
    }

    getSelectedLevel() {
        return this.gameLevel.value;
    }

    showButtons() {
        this.interfaceContainer.style.display = '';
        this.gameplayContainer.style.display = 'none';
        this.gameLink.style.display = 'none';
        this.multiplayerRandomInfo.style.display = 'none';
    }

    hideButtons() {
        this.interfaceContainer.style.display = 'none';
        this.gameplayContainer.style.display = '';
        this.multiplayerRandomInfo.style.display = 'none';
    }

    showSearchingLayout() {
        this.interfaceContainer.style.display = 'none';
        this.multiplayerRandomInfo.style.display = '';
    }

    showGameLink(id) {
        this.connectWithRandom.style.display = 'none';
        this.gameLink.style.display = '';
        this.gameLink.innerHTML = "Wklej znajomemu ten link: <br><input type=\"text\" value=\"" + window.location.href + "#" + id + "\"/>";
    }

    clearURL() {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }

    prepareInterface() {
        this.showButtons();

        if (this.getMultiplayerIdentifier()) {
            this.connectWithRandom.style.display = 'none';
            this.buttonConnect.innerHTML = "Dołącz do gry sieciowej";
            this.gameInfoLink.innerHTML = "Zostałeś zaproszony do gry sieciowej. Kliknij na powyższy przycisk aby rozpocząć grę ze znajomym.";
            this.circuitChooseInfo.innerHTML = "Znajomy właśnie zaprosił Cię do gry sieciowej, więc Ty nie możesz wybrać toru. No chyba że najpierw chcesz sobie poćwiczyć sam to wtedy możesz wybrać dowolny tor."
            this.buttonSingle.innerHTML = "Zignoruj grę sieciową i graj sam";
            this.buttonConnect.classList.add("primary-button");
            this.buttonSingle.classList.add("secondary-button");
        } else {
            this.buttonConnect.innerHTML = "Zaproś znajomego do gry sieciowej";
        }
    }

    addClickListeners() {
        this.buttonSingle.addEventListener("click", () => { this.eventClickStartSinglePlayer(this) });
        this.buttonConnect.addEventListener("click", () => { this.eventClickStarMultiPlayer(this) });
        this.connectWithRandom.addEventListener("click", () => { this.eventClickStarMultiPlayerRandom(this) });
    }

    eventClickStartSinglePlayer(self) {
        self.simulation.requestGameStart({ mode: "single" });
    }

    eventClickStarMultiPlayer(self) {
        self.simulation.requestGameStart({ mode: "multi" });
    }

    eventClickStarMultiPlayerRandom(self) {
        self.simulation.requestGameStart({ mode: "multirandom" });
        self.showSearchingLayout();
    }

    getMultiplayerIdentifier() {
        let currentUrl = document.URL;
        let urlParts = currentUrl.split('#');
        return (urlParts.length > 1) ? urlParts[1] : null;
    }

    displayMultiplayerIdentifier(id) {
        alert(id);
    }

    displayNetworkAlert(message) {
        this.networkInfoDiv.innerHTML = message;
        console.log(message);
    }

    displayProperty(property, value, isTime = false) {
        let divEl = document.getElementById("hud_" + property);
        if (isTime) {
            value = Math.floor(value * 100 / this.simulation.fps);

            let mins = Math.floor(value / 6000);
            let secs = Math.floor(value / 100 - mins * 60);
            let milis = value % 100;
            value = mins + ":" + secs + ":" + milis;
        }
        divEl.innerHTML = value;
    }


}

export default HTMLInterface;