var tiltLR;
var tiltFB;
var interval = null;

if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', deviceOrientationHandler, false);
} else {
    document.getElementById('logoContainer').innerText = 'Device Orientation API not supported.';
}
  
function deviceOrientationHandler (eventData) {
    tiltLR = eventData.gamma;
    tiltFB = eventData.beta;
}

const CVS = document.getElementById("game");
const CTX = CVS.getContext("2d");

var started = null;
window.addEventListener('click', () => {
  if (started) return;
  started = true;
  landscape_fullscreen();
})

document.getElementById('container').addEventListener('fullscreenchange', (event) => {
    // document.fullscreenElement will point to the element that
    // is in fullscreen mode if there is one. If not, the value
    // of the property is null.
    if (document.fullscreenElement) {
      console.log(`Element: ${document.fullscreenElement.id} entered fullscreen mode.`);
    } else {
      console.log('Leaving full-screen mode.');
      started = null;
      CVS.style.display = "none";
      clearInterval(interval);
    }
});

function landscape_fullscreen() {
    var game_display = document.querySelector("#container");
    if(game_display.requestFullscreen) {
        game_display.requestFullscreen();
    } else if(game_display.webkitRequestFullScreen) {
        game_display.webkitRequestFullScreen();
    }
    screen.orientation.lock("landscape-primary");

    console.log("Timer")
    window.setTimeout(initialize_context, 500);
}

function initialize_context() {
    console.log("start");
    CVS.style.display = "block";

    var W = CVS.width = screen.width;
    var H = CVS.height = screen.height;

    console.log("Height: " + H + ", Width: " + W);

    interval = window.setInterval(loop, 15);

    var maxX = (W - 100) / 2;
    var maxY = (H - 100) / 2;

    var positionX = 0;
    var positionY = 0;

    var speedX = 0;
    var speedY = 0;

    var targetX = Math.random() * (2 * maxX) - maxX;
    var targetY = Math.random() * (2 * maxY) - maxY;

    console.log("Target X: " + targetX);
    console.log("Target Y: " + targetY);

    function loop() {
        // calculation of movement
        var factor = 0.01;

        speedX = speedX + (tiltFB * factor);
        speedY = speedY - (tiltLR * factor);

        if (speedX > 3) {
            speedX = 3;
        } else if (speedX < -3) {
            speedX = -3;
        }
        if (speedY > 3) {
            speedY = 3;
        } else if (speedY < -3) {
            speedY = -3;
        }

        console.log("Speed Y: " + speedY + "Speed X: " + speedX);

        positionX = positionX + speedX;
        positionY = positionY + speedY;

        if (Math.abs(positionX) > maxX || Math.abs(positionY) > maxY) {
            alert("Lose");
        }

        CTX.fillStyle = "white";
        CTX.fillRect(0, 0, W, H);

        CTX.fillStyle = "gray";
        CTX.fillRect(50, 50, W - 100, H - 100);

        CTX.fillStyle = "blue";
        CTX.fillRect((targetX - 10) + (W / 2), (targetY - 10) + (H / 2), 20, 20);

        CTX.beginPath();
        CTX.fillStyle = "red";
        CTX.arc(positionX + (W / 2), positionY + (H / 2), 10, 0, 2 * Math.PI);
        CTX.fill();

        var diffX = Math.abs(targetX - positionX);
        var diffY = Math.abs(targetY - positionY);

        var distance = Math.sqrt((diffX * diffX) + (diffY * diffY));
        if (distance < 5 && speedX < 0.5 && speedY < 0.5) {
            alert("Win");
        }

    }
}