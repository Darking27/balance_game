var tiltLR;
var tiltFB;

//intervals
var interval = null;
var too_fast_message_timeout = null;

var print_too_fast_message = false;

var compatible_device = false;
var checked_compatibility = false

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
    nickname_changed();
}

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
        document.getElementById("menu_overlay").style.display = "none";
        document.getElementById("countdown_overlay").style.display = "none";
        clearInterval(interval);
    }
});

function nickname_changed() {
    var new_nickname = document.getElementById("nickname").value;
    if (new_nickname !== "") {
        if (!checked_compatibility) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === "granted") {
                            window.addEventListener('deviceorientation', deviceOrientationHandler, false);
                            compatible_device = true;
                            // document.getElementById("invalid_device_warning").style.display = "none";
                            window.setTimeout(check_compatipility, 500);
                        }
                    })
                    .catch(function() {
                        game_not_supported();
                    });
            } else {
                window.addEventListener('deviceorientation', deviceOrientationHandler, false);
                 compatible_device = true;
            }
            window.setTimeout(check_compatipility, 500);
            checked_compatibility = true;
        }
    }
    var whitepaceless = new_nickname.replace(/[ ]/g, '');
    if (new_nickname !== whitepaceless) {
        document.getElementById("nickname").value = whitepaceless;
    }
    if (whitepaceless !== "" && compatible_device) {
        document.getElementById("start_game").disabled = false;
    } else {
        document.getElementById("start_game").disabled = true;
    }
}

function initialize_game() {
    initialize_game.load_new_Level = load_new_Level;
    initialize_game.exit_game = exit_game;
    initialize_game.run_with_countdown = run_with_countdown;

    current_nickname = document.getElementById("nickname").value;

    try {
        // enter fullscreen mode
        var game_display = document.querySelector("#container");
        if(game_display.requestFullscreen) {
            game_display.requestFullscreen();
        } else if(game_display.webkitRequestFullScreen) {
            game_display.webkitRequestFullScreen();
        }

        // set lanscape mode
        screen.orientation.lock("landscape-primary");
    } catch (e) {
        document.getElementById("invalid_device_warning").style.display = "block";
        document.getElementById("invalid_device_warning").innerText = "Error when entering fullscreen: " + String(e.message);
    }

    var level = 1;

    var W = 0;
    var H = 0;

    var maxX = 0;
    var maxY = 0;

    var positionX = 0;
    var positionY = 0;

    var speedX = 0;
    var speedY = 0;

    var targetX = 0;
    var targetY = 0;

    var holeX = [];
    var holeY = [];

    var background_image = new Image();
    background_image.src = "wood.jpg";

    window.setTimeout(load_new_Level, 1000);


    function exit_game() {
        document.getElementById("menu_overlay").style.display = "none";
        insert_into_scoreboard(current_nickname, level - 1);
        update_scoreboard();
        document.exitFullscreen();
    }

    function run_with_countdown() {
        document.getElementById("menu_overlay").style.display = "none";

        function countdown(number) {
            document.getElementById("countdown_counter").innerText = String(number);
        }

        document.getElementById("countdown_overlay").style.display = "flex";

        countdown(3);
        window.setTimeout(countdown, 1000, 2);
        window.setTimeout(countdown, 2000, 1);
        window.setTimeout(load_new_Level, 3000, true);
    }

    function load_new_Level(run) {
        CVS.style.display = "block";
        document.getElementById("menu_play_button").style.display = "block";
        document.getElementById("menu_retry_button").style.display = "none";
        document.getElementById("menu_overlay").style.display = "none";
        document.getElementById("countdown_overlay").style.display = "none";

        const HOLE_RADIUS = 40;

        if (run) {
            // run game
            interval = window.setInterval(loop, 15);
            console.log("Set interval for loop");
        } else {
            // initialize game variables
            W = CVS.width = screen.width;
            H = CVS.height = screen.height;

            maxX = (W - 100) / 2;
            maxY = (H - 100) / 2;

            positionX = Math.random() * (2 * (maxX - 25)) - (maxX - 25);
            positionY = Math.random() * (2 * (maxY - 25)) - (maxY - 25);

            speedX = 0;
            speedY = 0;

            if (level % 3 === 0 && level <= 21) {
                holeX.push(0);
                holeY.push(0);
            }
            if (level % 5 === 0 && level > 21) {
                holeX.push(0);
                holeY.push(0);
            }

            for (var i = 0; i < holeX.length; i++) {
                var hole_ok = false;
                while (!hole_ok) {
                    holeX[i] = Math.random() * (2 * (maxX - HOLE_RADIUS - 5)) - (maxX - HOLE_RADIUS - 5);
                    holeY[i] = Math.random() * (2 * (maxY - HOLE_RADIUS - 5)) - (maxY - HOLE_RADIUS - 5);
                    if (Math.dist(holeX[i], positionX, holeY[i], positionY) < HOLE_RADIUS + 5) continue;
                    var hit_prev_holes = false;
                    for (var a = 0; a < i; a++) {
                        if (Math.dist(holeX[i], holeX[a], holeY[i], holeY[a]) < (2 * HOLE_RADIUS + 20)) hit_prev_holes = true;
                    }
                    hole_ok = !hit_prev_holes;
                }
            }

            targetX = 0;
            targetY = 0;

            // ensure target is not to close to holes or red ball
            var target_ok = false;
            while (!target_ok) {
                targetX = Math.random() * (2 * (maxX - 20)) - (maxX - 20);
                targetY = Math.random() * (2 * (maxY - 20)) - (maxY - 20);
                if (Math.dist(targetX, positionX, targetY, positionY) < (maxX - 30)) continue;
                var holes_ok = true;
                for (var i = 0; i < holeX.length; i++) {
                    if (Math.dist(holeX[i], targetX, holeY[i], targetY) < HOLE_RADIUS + 20) holes_ok = false;
                }
                target_ok = holes_ok;
            }
            loop();
            document.getElementById("menu_overlay").style.display = "flex";
        }

        function loop() {
            // calculation of movement
            if (run) {
                if (level < 8) {
                    factor = 0.004 + (0.002 * (level - 1));
                } else if (level < 20) {
                    factor = 0.01 + (0.001 * (level - 5));
                } else {
                    factor = 0.025 + (0.0002 * (level - 20));
                }
        
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
            }
    
            // check if red ball is over void
            var ball_out = false;
            if ((Math.abs(positionX) > maxX || Math.abs(positionY) > maxY) && document.fullscreenElement) {
                ball_out = true;
                console.log("outside void");
            }
            for (var i = 0; i < holeX.length; i++) {
                if (Math.dist(holeX[i], positionX, holeY[i], positionY) < HOLE_RADIUS) {
                    ball_out = true;
                    console.log("hole void");
                }
            }
            if (ball_out) {
                insert_into_scoreboard(current_nickname, level - 1);
                window.clearInterval(interval);
                print_too_fast_message = false;
                redraw();
                document.getElementById("menu_play_button").style.display = "none";
                document.getElementById("menu_retry_button").style.display = "block";
                document.getElementById("menu_overlay").style.display = "flex";
            }

            function redraw() {
                CTX.fillStyle = "black";
                CTX.fillRect(0, 0, W, H);
        
                var pattern = CTX.createPattern(background_image, "repeat");
                CTX.fillStyle = pattern;
                CTX.fillRect(50, 50, W - 100, H - 100);

                CTX.beginPath();
                CTX.fillStyle = "blue";
                CTX.arc(targetX + (W / 2), targetY + (H / 2), 15, 0, 2 * Math.PI);
                CTX.fill();

                // holes
                for (var i = 0; i < holeX.length; i++) {
                    CTX.beginPath();
                    CTX.fillStyle = "black";
                    CTX.arc(holeX[i] + (W / 2), holeY[i] + (H / 2), HOLE_RADIUS, 0, 2 * Math.PI);
                    CTX.fill();
                }
        
                CTX.beginPath();
                CTX.fillStyle = "red";
                CTX.arc(positionX + (W / 2), positionY + (H / 2), 10, 0, 2 * Math.PI);
                CTX.fill();
        
                CTX.fillStyle = "white";
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
                    level = level + 1;
                    load_new_Level(false);
                    document.getElementById("menu_play_button").style.display = "block";
                    document.getElementById("menu_retry_button").style.display = "none";
                    document.getElementById("menu_overlay").style.display = "flex";
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

// helpers

Math.dist = function(x1, x2, y1, y2) {
    if(!x2) x2=0; 
    if(!y2) y2=0;
    return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}