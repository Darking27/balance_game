var tiltLR;
var tiltFB;

//intervals
var interval = null;
var too_fast_message_timeout = null;

var print_too_fast_message = false;

var compatible_device = true;
var current_nickname = "";
var scoreboard = {
    1: {
        nickname: "",
        level: 0
    },
    2: {
        nickname: "",
        level: 0
    },
    3: {
        nickname: "",
        level: 0
    },
    4: {
        nickname: "",
        level: 0
    },
    5: {
        nickname: "",
        level: 0
    }
}

function initialize_scoreboard() {
    // get scoreboard from cookies
    var cookie_string = document.cookie;
    var c = cookie_string.split("; ");
    for (var index in c) {
        var split = c[index].split("=");
        var parameters = split[0].split("-");
        if (parameters[0] === "pos") {
            scoreboard[parameters[1]][parameters[2]] = split[1];
        }
    }
    

    update_scoreboard();
}

function update_scoreboard() {
    for (var pos = 1; pos <= 5; pos++) {
        var now = new Date();
        var expireTime = now.getTime() + (365 * 24 * 60 * 60 * 1000);
        now.setTime(expireTime);
        document.cookie = "pos-" + pos + "-nickname=" + scoreboard[pos]["nickname"] + ";expires=" + now.toUTCString();
        document.cookie = "pos-" + pos + "-level=" + scoreboard[pos]["level"] + ";expires=" + now.toUTCString();
    }

    for (var pos in scoreboard) {
        var name = "-";
        var level = "-";
        if (scoreboard[pos]["nickname"] !== "") {
            name = scoreboard[pos]["nickname"];
            level = scoreboard[pos]["level"];
        }
        document.getElementById("pos-" + pos + "-name").innerHTML = name;
        document.getElementById("pos-" + pos + "-level").innerHTML = level;
    }
}

function insert_into_scoreboard(name, level) {
    // check if name already exists
        // yes -> check if prevois game higher
            // yes -> remove old game, add new game
            // no -> ignore this game
        // no -> add this game
    for (var pos = 1; pos <= 5; pos++) {
        if (scoreboard[pos]["nickname"] === name) {
            if (scoreboard[pos]["level"] < level) {
                for (pos; pos < 5; pos++) {
                    scoreboard[pos]["nickname"] = scoreboard[pos + 1]["nickname"];
                    scoreboard[pos]["level"] = scoreboard[pos + 1]["level"];
                }
                scoreboard[5]["nickname"] = "";
                scoreboard[5]["level"] = 0;
            } else {
                //ignore this game
                return;
            }
        }
    }
    
    for (var pos = 1; pos <= 5; pos++) {
        if (scoreboard[pos]["level"] < level) {
            console.log(pos);
            var oldname = scoreboard[pos]["nickname"];
            var oldlevel = scoreboard[pos]["level"];
            scoreboard[pos]["nickname"] = name;
            scoreboard[pos]["level"] = level;
            if (oldlevel > 0) {
                insert_into_scoreboard(oldname, oldlevel);
            }
            break;
        }
    }
}

function game_not_supported() {
    document.getElementById("invalid_device_warning").style.display = "block";
    compatible_device = false;
    document.getElementById("start_game").disabled = true;
}

function check_compatipility() {
    if (isNaN(tiltFB) || isNaN(tiltLR)) {
        game_not_supported();
    }
}

if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', deviceOrientationHandler, false);
} else {
    game_not_supported();
}
window.setTimeout(check_compatipility, 500);
nickname_changed();
initialize_scoreboard();
  
function deviceOrientationHandler (eventData) {
    tiltLR = eventData.gamma;
    tiltFB = eventData.beta;
}

const CVS = document.getElementById("game");
const CTX = CVS.getContext("2d");

document.getElementById('container').addEventListener('fullscreenchange', (event) => {
    // document.fullscreenElement will point to the element that
    // is in fullscreen mode if there is one. If not, the value
    // of the property is null.
    if (document.fullscreenElement) {
      console.log(`Element: ${document.fullscreenElement.id} entered fullscreen mode.`);
    } else {
      console.log('Leaving full-screen mode.');
      CVS.style.display = "none";
      clearInterval(interval);
    }
});

function nickname_changed() {
    var nickname = document.getElementById("nickname");
    if (nickname.value !== "" && compatible_device) {
        document.getElementById("start_game").disabled = false;
    } else {
        document.getElementById("start_game").disabled = true;
    }
}

function start_game() {
    start_game.load_new_Level = load_new_Level;
    start_game.exit_game = exit_game;

    current_nickname = document.getElementById("nickname").value;

    // enter fullscreen mode
    var game_display = document.querySelector("#container");
    if(game_display.requestFullscreen) {
        game_display.requestFullscreen();
    } else if(game_display.webkitRequestFullScreen) {
        game_display.webkitRequestFullScreen();
    }

    // set lanscape mode
    screen.orientation.lock("landscape-primary");

    var level = 1;

    window.setTimeout(load_new_Level, 500);


    function exit_game() {
        document.getElementById("menu_overlay").style.display = "none";
        insert_into_scoreboard(current_nickname, level - 1);
        update_scoreboard();
        document.exitFullscreen();
    }

    function load_new_Level(run) {
        CVS.style.display = "block";
        document.getElementById("menu_play_button").style.display = "block";
        document.getElementById("menu_retry_button").style.display = "none";
        document.getElementById("menu_overlay").style.display = "none";

        var W = CVS.width = screen.width;
        var H = CVS.height = screen.height;

        var maxX = (W - 100) / 2;
        var maxY = (H - 100) / 2;

        var positionX = 0;
        var positionY = 0;

        var speedX = 0;
        var speedY = 0;

        var targetX = Math.random() * (2 * (maxX - 15)) - (maxX - 15);
        var targetY = Math.random() * (2 * (maxY - 15)) - (maxY - 15);

        if (run) {
            interval = window.setInterval(loop, 15);
        } else {
            loop();
            document.getElementById("menu_overlay").style.display = "block";
        }

        function loop() {
            // calculation of movement
            var factor = 0.01 + (0.001 * level);
    
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
    
            positionX = positionX + speedX;
            positionY = positionY + speedY;
    
            if ((Math.abs(positionX) > maxX || Math.abs(positionY) > maxY) && document.fullscreenElement) {
                insert_into_scoreboard(current_nickname, level - 1);
                window.clearInterval(interval);
                print_too_fast_message = false;
                redraw();
                document.getElementById("menu_play_button").style.display = "none";
                document.getElementById("menu_retry_button").style.display = "block";
                document.getElementById("menu_overlay").style.display = "block";
            }

            function redraw() {
                CTX.fillStyle = "white";
                CTX.fillRect(0, 0, W, H);
        
                CTX.fillStyle = "gray";
                CTX.fillRect(50, 50, W - 100, H - 100);

                if (run) {
                    CTX.beginPath();
                    CTX.fillStyle = "blue";
                    CTX.arc(targetX + (W / 2), targetY + (H / 2), 15, 0, 2 * Math.PI);
                    CTX.fill();
                }
        
                CTX.beginPath();
                CTX.fillStyle = "red";
                CTX.arc(positionX + (W / 2), positionY + (H / 2), 10, 0, 2 * Math.PI);
                CTX.fill();
        
                CTX.fillStyle = "black";
                CTX.font = "30px Arial";
                CTX.fillText("Level: " + level, 20, 30);

                if (print_too_fast_message) {
                    CTX.fillStyle = "red";
                        CTX.font = "30px Arial";
                        CTX.fillText("Too fast!", 300, 30);
                }
            }

            redraw();
    
            var diffX = Math.abs(targetX - positionX);
            var diffY = Math.abs(targetY - positionY);
    
            var distance = Math.sqrt((diffX * diffX) + (diffY * diffY));
            if (distance < 10) {
                if ((Math.abs(speedX) < 0.5) && (Math.abs(speedY < 0.5))) {
                    window.clearInterval(interval);
                    print_too_fast_message = false;
                    redraw();
                    level = level + 1;
                    document.getElementById("menu_play_button").style.display = "block";
                    document.getElementById("menu_retry_button").style.display = "none";
                    document.getElementById("menu_overlay").style.display = "block";
                } else {
                    print_too_fast_message = true;
                    window.clearTimeout(too_fast_message_timeout);
                    too_fast_message_timeout = window.setTimeout(function() {
                        print_too_fast_message = false;
                    }, 1000);
                }
            }
    
        }
    }

}