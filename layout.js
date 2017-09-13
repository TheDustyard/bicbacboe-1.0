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