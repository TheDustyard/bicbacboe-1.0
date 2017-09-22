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

/**
 * Basically equals <b>document.querySelector</b> ¯\_(ツ)_/¯<br>
 * Small change? I THINK NOT!
 * @kind method
 */
const $ = function() { return document.querySelector.apply(document, arguments); };

var socket;

var piece;
var pieces = {X: "None", O: "None"};
var turn;

var gamestate;
var gameplaying = false;
var isready = false;

/** Executed when all the HTML loads */
function login() {
    connecting();

    socket = new WebSocket("wss://dusterthefirst.ddns.net:42691");
    // When we receive a socket message
    socket.onmessage = (event) => {
        let data = JSON.parse(event.data);
        console.log('WS Message: ', data);
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
    // Socket opened
    socket.onopen = (event) => {
        console.log("Connected to " + socket.url);
        connected();
        validate();
    };
    // Socket closed
    socket.onclose = (event) => {
        console.log("Disconnected from " + socket.url);
        if (event.reasonCode === 1010) banned();
        else disconnected();
        // RESET ALL THE THINGS
        piece = undefined;
        yourturn = false;
        gamestate = undefined;
        gameplaying = false;
    }
    // Socket error :/
    socket.onerror = (error) => { disconnected(); }
}
/** Checks if the game hash is a valid game */
function validate() {
    if (window.location.hash.substr(1) !== "") // Check if we have a hash
        socket.send(JSON.stringify({ // Send a request to the server
            type: 'validateGame',
            ID: window.location.hash.substr(1)
        }));
    else noGame(); // We don't have a hash, so show an error
}
/** Creates a game  */
function createGame() {
    if (socket.readyState !== socket.OPEN) return;
    if (document.querySelector('#nickname').value === "" || document.querySelector('#nickname').value === null) {
        nameinvalid();
        return;
    }
    namevalid();
    socket.send(JSON.stringify({
        type: 'createGame',
        nickname: document.querySelector('#nickname').value
    }));
}
/** Attempts to join a game using the hash */
function joinGame() {
    validate();
    if (window.location.hash !== "" && document.querySelector('#nickname').value !== "" && document.querySelector('#nickname').value !== null) {
        socket.send(JSON.stringify({
            type: 'joinGame',
            gameID: window.location.hash.substr(1),
            nickname: document.querySelector('#nickname').value
        }));
        namevalid();
    } else nameinvalid();
}
/** Leaves the game */
function leaveGame() {
    socket.send(JSON.stringify({
        type: 'leaveGame'
    }));
    // RESET ALL THE THINGS
    piece = undefined;
    yourturn = false;
    gamestate = undefined;
    gameplaying = false;

}
/** Attempts a reconnect */
function reconnect() {
    if(socket.readyState !== socket.OPEN)
        login();
}
/**
 * Changes the ready state
 * @param {boolean} isready - Ready state
 */
function ready(isready) {
    socket.send(JSON.stringify({
        type: 'ready',
        isReady: isready
    }));
}
//function toggleready() { isready = !isready; ready(isready); } // Not necessary cause onclick does have full JS support (Check #toggleready in index.html)

//////////VISUALS\\\\\\\\\\\\
/**
 * A "category" of functions that are for Visual effects only.
 * DO NOT PREFIX <b>Visuals.</b>!
 * @namespace Visuals
 */

let connectimeout;
/**
 * Shows a connecting status
 * @memberof Visuals
 */
function connecting() {
    document.querySelector('#disconnected').style.display = "none";
    document.querySelector('#banned').style.display = "none";
    connectimeout = setTimeout(() => {
        document.querySelector('#connecting').style.display = "block";
    }, 1000);
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Connecting...-yellow.svg?style=flat-square";
    document.querySelector('#reconnect').setAttribute('disabled', true); // Disables the reconnect button?
}
/**
 * Disconnects you from the game and returns you back to the main screen
 * @memberof Visuals
 */
function disconnected() {
    leftGame();
    clearTimeout(connectimeout);
    document.querySelector('#disconnected').style.display = "block";
    document.querySelector('#connecting').style.display = "none";
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Disconnected-yellow.svg?style=flat-square";
    document.querySelector('#reconnect').removeAttribute('disabled'); // Enables the reconnect button?
}
/**
 * Shows the banned text <i>:yellow_fruit:</i>
 * @memberof Visuals
 */
function banned() {
    disconnected();
    document.querySelector('#banned').style.display = "block";
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Banned-red.svg?style=flat-square";
}
/**
 * Recovers from the connecting status and shows the connected status
 * @memberof Visuals
 */
function connected() {
    clearTimeout(connectimeout);
    document.querySelector('#connecting').style.display = "none";
    document.querySelector('#status').src = "https://img.shields.io/badge/Connection%20Status-Connected-green.svg?style=flat-square";
    document.querySelector('#reconnect').setAttribute('disabled', true); // Disables the reconnect button? Is there even a reconnect button?
}
/**
 * Hides all warnings about an invalid game
 * @memberof Visuals
 */
function gameValid() {
    document.querySelector('#fullgame').style.display = "none";
    document.querySelector('#invalidgame').style.display = "none";
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Valid-green.svg?style=flat-square`;
    document.querySelector('#sharelink').value = window.location.href; // Sets the share link in the top right corner
    document.querySelector('#create').style.display = "none";
    document.querySelector('#join').style.display = "inline";
}
/**
 * Shows a <b>Invalid Game</b> message
 * @memberof Visuals
 */
function gameInvalid() {
    document.querySelector('#fullgame').style.display = "none";
    document.querySelector('#invalidgame').style.display = "block";
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Invalid-red.svg?style=flat-square`;
    document.querySelector('#sharelink').value = '';
    document.querySelector('#create').style.display = "inline";
    document.querySelector('#join').style.display = "none";
}
/**
 * Shows a <b>Full Game</b> message
 * @memberof Visuals
 */
function gameFull() {
    document.querySelector('#fullgame').style.display = "block";
    document.querySelector('#invalidgame').style.display = "none";
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Full-red.svg?style=flat-square`;
    document.querySelector('#sharelink').value = '';
    document.querySelector('#create').style.display = "inline";
    document.querySelector('#join').style.display = "none";
}
/**
 * Shows a <b>No Game</b> message
 * @memberof Visuals
 */
function noGame() {
    document.querySelector('#fullgame').style.display = "none";
    document.querySelector('#invalidgame').style.display = "none";
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game%20ID-None-yellow.svg?style=flat-square`;
    document.querySelector('#sharelink').value = '';
    document.querySelector('#create').style.display = "inline";
    document.querySelector('#join').style.display = "none";
}
/**
 * Disconnets you from the current game and returns you back to the login page
 * @memberof Visuals
 */
function leftGame() {
    document.querySelector('#sharelink').value = "";
    document.querySelector('#login').style.display = "block";
    document.querySelector('#board').style.display = "none";
    document.querySelector('#X').style.display = "none"; // Hides the Quit button
    document.querySelector('#gameinfo').style.display = "none";
    window.location.hash = ""; // Removes the hash in the page URL
}
/**
 * Hides all warnings and shows the game board
 * @memberof Visuals
 */
function joinedGame() {
    document.querySelector('#fullgame').style.display = "none";
    document.querySelector('#invalidgame').style.display = "none";
    document.querySelector('#gameID').src = `https://img.shields.io/badge/Game-Valid-green.svg?style=flat-square`;
    document.querySelector('#sharelink').value = window.location.href; // Sets the share link in the top right corner
    document.querySelector('#login').style.display = "none";
    document.querySelector('#board').style.display = "block";
    document.querySelector('#X').style.display = "block"; // Shows the Quit button
    document.querySelector('#gameinfo').style.display = "block";
}
/**
 * Shows an invalid name error
 * @memberof Visuals
 */
function nameinvalid() {
    document.querySelector('#invalidname').style.display = "block";
}
/**
 * Hides the invalid name error
 * @memberof Visuals
 */
function namevalid() {
    document.querySelector('#invalidname').style.display = "none";
}

/** Updates the match */
function matchUpdate(data) {
    // SET ALL THE STATES!
    pieces = {X:data.X ? data.X.name : 'None', O:data.O ? data.O.name : 'None'};
    turn = data.turn;
    gamestate = data.state;
    gameplaying = data.state === 'playing';

    // Set the names in the top left
    document.querySelector('#xman').innerHTML = pieces.X ? pieces.X : 'None';
    document.querySelector('#oman').innerHTML = pieces.O ? pieces.O : 'None';

    // Check if X side is ready (I think)
    if (data.X)
        document.querySelector('#xname').className = data.X.ready ? "ready" : "notready";
    else
        document.querySelector('#xname').className = "notready";

    // Check if O side is ready (I thonk)
    if (data.O)
        document.querySelector('#oname').className = data.O.ready ? "ready" : "notready";
    else
        document.querySelector('#oname').className = "notready";

    if (this.gameplaying === true) {
        document.querySelector('#toggleready').style.display = "none";
        document.querySelector('#turnman').innerHTML = pieces[turn.toUpperCase()];
        document.querySelector('#turndude').style.display = "block";
    } else {
        document.querySelector('#toggleready').style.display = "block";
        document.querySelector('#turndude').style.display = "none";
    }
}














function dropdown(search, that) {
    let element = document.querySelector(search);
    if (element.classList.contains('down')) {
        if (that) {
            that.innerHTML = '&#9658;';
        }
        element.classList.remove('down');
    } else {
        if (that) {
            that.innerHTML = '&#9660;';
        }
        element.classList.add('down');
    }
}

function faded(that) {
    if (that.dataset.piece !== "" || !gameplaying || !yourturn)
        return;

    let canvas = that.getElementsByClassName('cv')[0];

    let ctx = canvas.getContext("2d");

    ctx.lineWidth = canvas.width / 10;
    ctx.imageSmoothingEnabled= false;
    ctx.strokeStyle="#b7b7b7";

    if (piece === 'x') {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 10,canvas.height / 10);
        ctx.lineTo(canvas.width - (canvas.width / 10), canvas.height - (canvas.height / 10));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(canvas.width - (canvas.width / 10), canvas.height / 10);
        ctx.lineTo(canvas.width / 10, canvas.height - (canvas.height / 10));
        ctx.stroke();
    } else {
        ctx.beginPath();
        drawEllipse(ctx, canvas.width /10, canvas.height /10, canvas.width - (2 * (canvas.width / 10)), canvas.height - (2 * (canvas.height / 10)));
        ctx.stroke();
    }


}
function removefaded(that) {
    if (that.dataset.piece !== "" && !yourturn)
        return;

    let canvas = that.getElementsByClassName('cv')[0];

    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function makemove(that) {
    if (that.dataset.piece !== "" || !yourturn)
        return;

    let canvas = that.getElementsByClassName('cv')[0];

    let ctx = canvas.getContext("2d");

    ctx.lineWidth = canvas.width / 10;
    ctx.imageSmoothingEnabled= false;
    ctx.strokeStyle="#b7b7b7";

    if (piece === 'x') {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 10,canvas.height / 10);
        ctx.lineTo(canvas.width - (canvas.width / 10), canvas.height - (canvas.height / 10));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(canvas.width - (canvas.width / 10), canvas.height / 10);
        ctx.lineTo(canvas.width / 10, canvas.height - (canvas.height / 10));
        ctx.stroke();
    } else {
        ctx.beginPath();
        drawEllipse(ctx, canvas.width /10, canvas.height /10, canvas.width - (2 * (canvas.width / 10)), canvas.height - (2 * (canvas.height / 10)));
        ctx.stroke();
    }

    socket.send(JSON.stringify({
        type: 'makeMove',
        position: that.dataset.position
    }))

}

function drawEllipse(ctx, x, y, w, h) {
  var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  //ctx.closePath(); // not used correctly, see comments (use to close off open path)
  ctx.stroke();
}
