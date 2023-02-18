import Peer from "peerjs";

class Multiplayer {
    constructor(simulation) {
        this.simulation = simulation;

        this.lastPeerId = null;
        this.peer = null;
        this.peerId = null;
        this.conn = null;
        this.serverMode = false;

        this.remoteCar = {};
    }

    initialize(clientId,gameFinder = false) {

        this.peer = new Peer(null, {
            debug: 2
        });

        this.peer.on('open', (id) => {
            if (this.peer.id === null) {
                this.peer.id = lastPeerId;
            } else {
                this.lastPeerId = this.peer.id;
            }

            console.log('ID: ' + this.peer.id);
            if (gameFinder) {
                gameFinder.offerGame(this.peer.id);
            } else {
                this.simulation.interface.showGameLink(this.peer.id);
            }

            if (clientId) {
                this.join(clientId);
            }

        });
        this.peer.on('connection', (c) => {
            this.simulation.interface.displayNetworkAlert("Łączenie...");
            if (this.conn && this.conn.open) {
                c.on('open', () => {
                    this.sendSystemData("refuseConnection","", c);
                    setTimeout(function () { c.close(); }, 500);
                });
                return;
            }

            this.conn = c;
            this.simulation.interface.displayNetworkAlert("Jest połączenie z innym graczem.");
            this.connectionReady();
            this.serverMode = true;
        });
        this.peer.on('disconnected', () => {
            this.simulation.interface.displayNetworkAlert("Połączenie utracone, proszę połączyć się ponownie.");

            // Workaround for peer.reconnect deleting previous id
            this.peer.id = this.lastPeerId;
            this.peer._lastServerId = this.lastPeerId;
            this.peer.reconnect();
        });
        this.peer.on('close', () => {
            this.conn = null;
            this.simulation.interface.displayNetworkAlert("Połączenie utracone.");
        });
        this.peer.on('error', (err) => {
            this.simulation.interface.displayNetworkAlert("Błąd połączenia...");
        });

        
    }

    connectionReady() {
        this.conn.on('data', (data) => {
            this.gotData(data);            
        });

        this.conn.on('close', () => {
            this.simulation.interface.displayNetworkAlert("Połączenie zakończone.");
        });
    }

    sendData(message, connection = null) {
        let usedConnection = this.conn;
        if (connection) {
            usedConnection = connection;
        }
        if (usedConnection && usedConnection.open) {
            usedConnection.send(JSON.stringify(message));
        } else {
            this.simulation.interface.displayNetworkAlert("Brak połączenia.");
        }
    }

    gotData(data) {
        let incomingData = JSON.parse(data);
        if (incomingData.type == "car") {
            this.remoteCar = incomingData.message;
        } else {
            this.simulation.networkMessage(incomingData.message);
        }
    }

    sendCarData(carData) {
        let message = {type: "car", message: carData};
        this.sendData(message);
    }

    sendSystemData(command, payload, connection = null) {
        let message = {type: "system", message: {command: command, payload: payload}};
        this.sendData(message, connection);
    }

    join(identifier) {
        this.simulation.interface.displayNetworkAlert("Łączenie...");
        if (this.conn) {
            this.conn.close();
        }

        this.conn = this.peer.connect(identifier, {
            reliable: true
        });

        this.conn.on('open', () => {
            this.connectionReady();
            this.serverMode = false;
            this.simulation.interface.displayNetworkAlert("Połączony z drugim graczem.");
            this.sendSystemData("clientReady", "true");
        });
    }
}

export default Multiplayer;