var socket;
/** Used to prevent constant querySelector usage in Canvas.render() */
var board;
/**
 * The Canvas object that controls the board
 * @namespace
 */
var Canvas = {
  /** The canvas element itself. */
  canvas: null,
  /** The 2D Context. Will be <b>null</b> if WebGL is on */
  ctx: null,
  /** The WebGL Context. Will be <b>null</b> if WebGL is off */
  gl: null,
  /**
   * The Canvas's render method<br>(Yes, I could've made it separate, but for JSDoc cleanliness, I added it to the object - FatalError)
   * @param {DOMHighResTimeStamp} deltaTime
   */
  render: function(deltaTime) { window.requestAnimationFrame(Canvas.render); },
  /**
   * The Canvas's click method. Usually called when it's clicked and Utils.initializeCanvas was called.
   * @param {number} x
   * @param {number} y
   * @param {MouseEvent} event - The mouse click event
   */
  click: function(x, y, event) { console.warn("Click function uninitialized") },
  /**
   * Used for storing the states of any effects and animations<br>
   * (Afterall, I want the line drawing and board highlighting and all that to look nice - FatalError)
   */
  effectBuffer: {},
  // Insert glBuffer here *eventually*
  /**
   * Canvas's current mouse position<br>
   * -1 = Mouse not over canvas
   * @param x
   * @param y
   */
  mousePos: { x: -1, y: -1 }
};

var piece;
var pieces = {X: "None", O: "None"};
var turn;

var gamestate;
var gameplaying = false;
var isready = false;

/** Executed when all the HTML loads */
function login() {
    // Set board to board object
    board = $("#board");
    // Prepare our Canvas
    Utils.initializeCanvas(Canvas, true);

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
            case 'gameUpdate':
                matchUpdate(data);
                break;
            case 'broadcast':
                alert(`BROADCAST: ${data.message}`);
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
    if (!socket || socket.readyState !== socket.OPEN) return;
    if ($('#nickname').value === "" || $('#nickname').value === null) {
        nameinvalid();
        return;
    }
    namevalid();
    socket.send(JSON.stringify({
        type: 'createGame',
        nickname: $('#nickname').value
    }));
}
/** Attempts to join a game using the hash */
function joinGame() {
    validate();
    if (window.location.hash !== "" && $('#nickname').value !== "" && $('#nickname').value !== null) {
        socket.send(JSON.stringify({
            type: 'joinGame',
            gameID: window.location.hash.substr(1),
            nickname: $('#nickname').value
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
    if(!socket || socket.readyState !== socket.OPEN)
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
    $('#disconnected').style.display = "none";
    $('#banned').style.display = "none";
    connectimeout = setTimeout(() => {
        $('#connecting').style.display = "block";
    }, 1000);
    $('#status').src = "https://img.shields.io/badge/Connection%20Status-Connecting...-yellow.svg?style=flat-square";
    $('#reconnect').setAttribute('disabled', true); // Disables the reconnect button?
}
/**
 * Disconnects you from the game and returns you back to the main screen
 * @memberof Visuals
 */
function disconnected() {
    leftGame();
    clearTimeout(connectimeout);
    $('#disconnected').style.display = "block";
    $('#connecting').style.display = "none";
    $('#status').src = "https://img.shields.io/badge/Connection%20Status-Disconnected-yellow.svg?style=flat-square";
    $('#reconnect').removeAttribute('disabled'); // Enables the reconnect button?
}
/**
 * Shows the banned text <i>:yellow_fruit:</i>
 * @memberof Visuals
 */
function banned() {
    disconnected();
    $('#banned').style.display = "block";
    $('#status').src = "https://img.shields.io/badge/Connection%20Status-Banned-red.svg?style=flat-square";
}
/**
 * Recovers from the connecting status and shows the connected status
 * @memberof Visuals
 */
function connected() {
    clearTimeout(connectimeout);
    $('#connecting').style.display = "none";
    $('#status').src = "https://img.shields.io/badge/Connection%20Status-Connected-green.svg?style=flat-square";
    $('#reconnect').setAttribute('disabled', true); // Disables the reconnect button? Is there even a reconnect button?
}
/**
 * Hides all warnings about an invalid game
 * @memberof Visuals
 */
function gameValid() {
    $('#fullgame').style.display = "none";
    $('#invalidgame').style.display = "none";
    $('#gameID').src = `https://img.shields.io/badge/Game-Valid-green.svg?style=flat-square`;
    $('#sharelink').value = window.location.href; // Sets the share link in the top right corner
    $('#create').style.display = "none";
    $('#join').style.display = "inline";
}
/**
 * Shows a <b>Invalid Game</b> message
 * @memberof Visuals
 */
function gameInvalid() {
    $('#fullgame').style.display = "none";
    $('#invalidgame').style.display = "block";
    $('#gameID').src = `https://img.shields.io/badge/Game-Invalid-red.svg?style=flat-square`;
    $('#sharelink').value = '';
    $('#create').style.display = "inline";
    $('#join').style.display = "none";
}
/**
 * Shows a <b>Full Game</b> message
 * @memberof Visuals
 */
function gameFull() {
    $('#fullgame').style.display = "block";
    $('#invalidgame').style.display = "none";
    $('#gameID').src = `https://img.shields.io/badge/Game-Full-red.svg?style=flat-square`;
    $('#sharelink').value = '';
    $('#create').style.display = "inline";
    $('#join').style.display = "none";
}
/**
 * Shows a <b>No Game</b> message
 * @memberof Visuals
 */
function noGame() {
    $('#fullgame').style.display = "none";
    $('#invalidgame').style.display = "none";
    $('#gameID').src = `https://img.shields.io/badge/Game%20ID-None-yellow.svg?style=flat-square`;
    $('#sharelink').value = '';
    $('#create').style.display = "inline";
    $('#join').style.display = "none";
}
/**
 * Disconnets you from the current game and returns you back to the login page
 * @memberof Visuals
 */
function leftGame() {
    $('#sharelink').value = "";
    $('#login').style.display = "block";
    $('#board').style.display = "none";
    $('#X').style.display = "none"; // Hides the Quit button
    $('#gameinfo').style.display = "none";
    window.location.hash = ""; // Removes the hash in the page URL
}
/**
 * Hides all warnings and shows the game board
 * @memberof Visuals
 */
function joinedGame() {
    $('#fullgame').style.display = "none";
    $('#invalidgame').style.display = "none";
    $('#gameID').src = `https://img.shields.io/badge/Game-Valid-green.svg?style=flat-square`;
    $('#sharelink').value = window.location.href; // Sets the share link in the top right corner
    $('#login').style.display = "none";
    $('#board').style.display = "block";
    $('#X').style.display = "block"; // Shows the Quit button
    $('#gameinfo').style.display = "block";
    // Reset board mouseover effect
    for(let x = 0; x < 3; x++) {
      for(let y = 0; y < 3; y++) {
        let boardpos = "";
        if(y === 0) boardpos += "t"; else if(y === 2) boardpos += "b";
        if(x === 0) boardpos += "l"; else if(x === 1) boardpos += "m"; else if(x === 2) boardpos += "r";
        Canvas.effectBuffer[boardpos + "_board_mouseover"] = 0;
      }
    }
}
/**
 * Shows an invalid name error
 * @memberof Visuals
 */
function nameinvalid() {
    $('#invalidname').style.display = "block";
}
/**
 * Hides the invalid name error
 * @memberof Visuals
 */
function namevalid() {
    $('#invalidname').style.display = "none";
}



/** Updates the match */
function matchUpdate(data) {
    // SET ALL THE STATES!
    pieces = {X:data.X ? data.X.name : 'None', O:data.O ? data.O.name : 'None'};
    turn = data.turn;
    gamestate = data.state;
    gameplaying = data.state === 'playing';

    // Set the names in the top left
    $('#xman').innerHTML = pieces.X ? pieces.X : 'None';
    $('#oman').innerHTML = pieces.O ? pieces.O : 'None';

    // Check if X side is ready (I think)
    if (data.X)
        $('#xname').className = data.X.ready ? "ready" : "notready";
    else
        $('#xname').className = "notready";

    // Check if O side is ready (I thonk)
    if (data.O)
        $('#oname').className = data.O.ready ? "ready" : "notready";
    else
        $('#oname').className = "notready";

    if (this.gameplaying === true) {
        $('#toggleready').style.display = "none";
        $('#turnman').innerHTML = pieces[turn.toUpperCase()];
        $('#turndude').style.display = "block";
    } else {
        $('#toggleready').style.display = "block";
        $('#turndude').style.display = "none";
    }
}

function dropdown(search, that) {
    let element = $(search);
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

function makemove(position) {
    if (!yourturn)
        return;

    socket.send(JSON.stringify({
        type: 'makeMove',
        position: position
    }))

}

/* 2D Context already has a circle function :face_palm:
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
}*/

let lastTime = 0;
Canvas.render = function(time) {
  let deltaTime = time - lastTime;
  // UPDATES
  for(let x = 0; x < 3; x++) {
    for(let y = 0; y < 3; y++) {
      let boardPos = Utils.effects.getBoardPos(x, y);
      if(Canvas.mousePos.x >= (110 * x) + 10 && Canvas.mousePos.x <= (110 * x) + 110
        && Canvas.mousePos.y >= (110 * y) + 10 && Canvas.mousePos.y <= (110 * y) + 110)
        Canvas.effectBuffer.board_mouseover[boardPos] = Utils.math.lerp(Canvas.effectBuffer.board_mouseover[boardPos], 230, 0.5);
      else Canvas.effectBuffer.board_mouseover[boardPos] = 0;
    }
   }
  // RENDERING
  // If board is not visible, do NOT render to save CPU and GPU
  if(board.style.getPropertyValue("display") === "none") { window.requestAnimationFrame(Canvas.render); return; }

  // Shortcuts so we don't have to type out the entire thing every time
  let gl = Canvas.gl; let ctx = Canvas.ctx;
  // GL Preparation
  if(gl) {
    gl.viewport(0, 0, 360, 360);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  // Board rendering
  if(gl) {
    // TODO: Figure out this thing
  } else if(ctx) { // To avoid any crashes
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 340, 340);
    for(let x = 0; x < 3; x++) {
      for(let y = 0; y < 3; y++) {
        let boardpos = Utils.effects.getBoardPos(x, y);
        ctx.fillStyle = "#" + (255 - Math.floor(Canvas.effectBuffer.board_mouseover[boardpos])).toString(16)
          + (22 + Math.floor(Canvas.effectBuffer.board_mouseover[boardpos])).toString(16) + "00";
        ctx.fillRect((110 * x) + 10, (110 * y) + 10, 100, 100);
      }
    }
  }

  // There's going to be more stuff here :P
  window.requestAnimationFrame(Canvas.render);
}

/*
To be fair, you have to have a very high IQ to understand :b:ic :b:ac :b:oe.
The humor is extremely subtle, and without a solid grasp of how to play a game most of the jokes will go over a typical viewer's head.
There's also Paul's nihilistic outlook, which is deftly woven into his characterisation
- his personal philosophy draws heavily from Narodnaya Volya literature, for instance.
The fans understand this stuff; they have the intellectual capacity to truly appreciate the depths of these jokes,
to realize that they're not just funny- they say something deep about LIFE.
As a consequence people who dislike :b:ic :b:ac :b:oe truly ARE idiots- of course they wouldn't appreciate, for instance,
the humour in Duster's existencial catchphrase ":lock: LOCKED UNTIL RELEASE :lock:," which itself is a cryptic reference to Boney M's Russian epic Rasputin.
I'm smirking right now just imagining one of those addlepated simpletons scratching their heads in confusion as the devs genius unfolds itself on their computer screens.
What fools... how I pity them. :joy: And yes by the way, I DO have a :b:ic :b:ac :b:oe tattoo.
And no, you cannot see it. It's for the ladies' eyes only-
And even they have to demonstrate that they're within 5 IQ points of my own (preferably lower) beforehand.
*/
/*
I can not begin to express how much I love :b:ic :b:ac :b:oe. I knew that I could relate to this game.
I have a higher than normal IQ, genius level to be exact, and most other games, I just can't understand why people like them,
or why I just claimed to be a genius and used so many fucking commas in a run-on sentence from Hell. :b:ic :b:ac :b:oe's comedy, sarcasm,
and wittiness is so funny, not because of the actual boring content, but because I know that so many people, less smart than me, can not begin to understand what they mean.
The characters are also hillarious. The relationship between FatalError and Paul is so deep, yet distant.
The writers for this show really know how to set up a perfect world that only arrogant fucks who go on Discord rants can understand.
Unfortunately, lots of people don't find this game funny, because it isn't. I just can not understand why.
The only possibility in my mind is that they are just too dumb to comprehend the pseudo-science humor.
This game is targeted, to awkward fucks who want to feel some kind of mainstream vindication and acceptance for their lack of social skills. It's a game that is intelligent, but at the same time shitty.
It's a game that has such deep meaning and characters, you begin to want to live there yourself. This game is amazing, and if I could, I would give it higher. 10/10.
*/
/*
You want to know why I love :b:ic :b:ac :b:oe? :b:ic :b:ac :b:oe is a completely self-made game.
So many other games are based in nostalgic childrens shows, funny faces, relatable situations, or references. Not :b:ic :b:ac :b:oe. :b:ic :b:ac :b:oe is completely absurd.
It's an online version of tic tac toe, and with the Ts switched out for :b:s. The first person to ever upvote :b:ic :b:ac :b:oe did not do so out of recognition.
The first person to ever upvote :b:ic :b:ac :b:oe did not do so because of a pre-existing game format.
The first person to ever upvote :b:ic :b:ac :b:oe upvoted a game literally pulled from the ether by sheer human creativity and willpower.
:b:ic :b:ac :b:oe is evidence that humans can stare into the meaningless void of eternity and force their own meaning onto to it. I will always upvote :b:ic :b:ac :b:oe,
:lock: LOCKED UNTIL RELEASE :lock:!
*/
