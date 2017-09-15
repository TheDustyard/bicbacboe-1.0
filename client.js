/*
//CLIENT
export type ValidateGame = {
    type: 'validateGame',
    ID: string
};

export type CreateGame = {
    type: 'createGame',
    nickname: string
};

export type Ready = {
    type: 'ready',
    isReady: boolean
};

export type JoinGame = {
    type: 'joinGame',
    gameID: string,
    nickname: string
};

export type LeaveGame = {
    type: 'leaveGame'
};

export type MakeMove = {
    type: 'makeMove',
    position: Game.Position
}

//SERVER
export type Connected = {
    type: 'connected',
    user: Game.User
};

export type CreatedGame = {
    type: 'createdGame',
    tournamentID: string
};

export type JoinedGame = {
    type: 'joinedGame',
    tournamentID: string,
    piece: Game.Piece
};

export type MatchUpdateMessage = {
    type: 'matchUpdate',
    board: Game.Board,
    state: Game.State,
    X: Game.User,
    O: Game.User,
    turn: Game.Piece
};

export type LeftGame = {
    type: 'leftGame',
    tournamentID: string
};

export type GameFull = {
    type: 'gameFull',
};

export type GameNotFound = {
    type: 'gameNotFound'
};

export type GameExists = {
    type: 'gameExists'
};
*/

var socket; 
var socketisopen;
var piece;
var pieces = {X:"None", O:"None"};
var yourturn = false;
var gamestate;
var gameplaying = false;
function login() {
    connecting();

    socket = new WebSocket("wss://dusterthefirst.ddns.net:42691");
    socketisopen = false;
    socket.onmessage = (event) => {
        let data = JSON.parse(event.data);
        console.log(data);
        switch (data.type) {
            case "joinedGame":
                window.location.hash = data.tournamentID;
                piece = data.piece;
                joinedGame();
                break;
            case 'gameNotFound':
                gameInvalid();
                break;
            case 'gameFull':
                gameFull();
                break;
            case 'gameExists':
                gameValid();
                break;
            case 'leftGame':
                piece = 'none';
                leftGame();
                break;
            case 'matchUpdate':
                matchUpdate(data);
                break;
        }
    }
    socket.onopen = (event) => {
        console.log("Connected to " + socket.url);
        socketisopen = true;
        connected();
        validate();
    };
    socket.onclose = (event) => {
        console.log("Disconnected from " + socket.url);
        socketisopen = false;
        if (event.reasonCode === 1010) {
            banned();
        } else {
            disconnected();
        }
        piece = undefined;
        yourturn = false;
        gamestate = undefined;
        gameplaying = false;
    }
    socket.onerror = (error) => {
        socketisopen = false;
        disconnected();
    }
}
function validate() {
    if (window.location.hash.substr(1) !== "")
        socket.send(JSON.stringify({
            type: 'validateGame',
            ID: window.location.hash.substr(1)
        }));
    else
        noGame();
}
function createGame() {
    if (!socketisopen)
        return;

    socket.send(JSON.stringify({
        type: 'createGame',
        nickname: document.getElementById('nickname').value
    }));
}
function joinGame() {
    if (window.location.hash !== "") {
        socket.send(JSON.stringify({
            type: 'joinGame',
            gameID: window.location.hash.substr(1),
            nickname: document.getElementById('nickname').value
        }));
    }
}
function leaveGame() {
    socket.send(JSON.stringify({
        type: 'leaveGame'
    }));
    piece = undefined;
    yourturn = false;
    gamestate = undefined;
    gameplaying = false;

}
function reconnect() {
    if(!socketisopen)
        login();
}

//////////VISUALS\\\\\\\\\\\\
let connectimeout;
function connecting() {
    document.querySelector('#disconnected').style.display = "none";
    document.querySelector('#banned').style.display = "none";
    connectimeout = setTimeout(() => {
        document.querySelector('#connecting').style.display = "block";
    }, 1000);
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Connecting...-yellow.svg?style=flat-square";
    document.querySelector('#reconnect').setAttribute('disabled', true);
}
function disconnected() {
    clearTimeout(connectimeout);
    document.querySelector('#disconnected').style.display = "block";
    document.querySelector('#connecting').style.display = "none";
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Disconnected-yellow.svg?style=flat-square";
    document.querySelector('#reconnect').removeAttribute('disabled');
}
function banned() {
    clearTimeout(connectimeout);
    document.querySelector('#banned').style.display = "block";
    document.querySelector('#connecting').style.display = "none";
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Banned-red.svg?style=flat-square";
    document.querySelector('#reconnect').setAttribute('disabled', true);
}
function connected() {
    clearTimeout(connectimeout);
    document.querySelector('#connecting').style.display = "none";
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Connected-green.svg?style=flat-square";
    document.querySelector('#reconnect').setAttribute('disabled', true);
}

function gameValid() {
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Valid-green.svg?style=flat-square`;
    document.querySelector('#sharelink').value = window.location.href;
    document.querySelector('#create').style.display = "none";
    document.querySelector('#join').style.display = "inline";
}
function gameInvalid() {
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Invalid-red.svg?style=flat-square`;
    document.querySelector('#sharelink').value = '';
    document.querySelector('#create').style.display = "inline";
    document.querySelector('#join').style.display = "none";
}
function gameFull() {
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Full-red.svg?style=flat-square`;
    document.querySelector('#sharelink').value = '';
    document.querySelector('#create').style.display = "inline";
    document.querySelector('#join').style.display = "none";
}
function noGame() {
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game%20ID-None-yellow.svg?style=flat-square`;
    document.querySelector('#sharelink').value = '';
    document.querySelector('#create').style.display = "inline";
    document.querySelector('#join').style.display = "none";
}

function leftGame() {
    document.querySelector('#sharelink').value = "";
    document.querySelector('#login').style.display = "block";
    document.querySelector('#board').style.display = "none";
    document.querySelector('#X').style.display = "none";
    document.querySelector('#gameinfo').style.display = "none";
}
function joinedGame() {
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Valid-green.svg?style=flat-square`;
    document.querySelector('#sharelink').value = window.location.href;
    document.querySelector('#login').style.display = "none";
    document.querySelector('#board').style.display = "block";
    document.querySelector('#X').style.display = "block";
    document.querySelector('#gameinfo').style.display = "block";
}

function matchUpdate(data) {
    this.pieces = {X:data.X ? data.X.name : 'None', O:data.O ? data.O.name : 'None'};
    this.yourturn = data.turn === this.piece;
    this.gamestate = data.state;
    this.gameplaying = data.state === 'playing';

    document.querySelector('#xman').innerHTML = pieces.X ? pieces.X : 'None';
    document.querySelector('#oman').innerHTML = pieces.O ? pieces.O : 'None';
    if (this.gameplaying === true) {
        document.querySelector('#turnman').innerHTML = yourturn ? pieces[piece] : pieces[piece === "x" ? 'O' : 'X'];
    } else {
        document.querySelector('#turnman').innerHTML = "Game not started";
    }
}
