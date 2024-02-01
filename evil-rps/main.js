import { alphabet, possibleGuesses, solutions } from "/words.js";

function getRandomInt(min, max) {
    return Math.floor(Math.random() * max) + min;
}

let gameData = {
    guess: 0,
    maxGuesses: 0,
    enemies: [],
    promises: [],
    lastGuess: "",
    indices: [],
};

let defaultSettings = {
    transitionLength: 500,
    delay: 0.75,
    invalidPenalty: false,
    correct: "#00ff00",
    misplaced: "#ffff00",
    incorrect: "#bbbbbb",
    tile: "#000000",
    enraged: false,
    daily: true,
    focus: true,
    // don't save the dark mode value because 1. i want to flashbang people and 2. if it gets too dark i don't want to make people get lost
};

let settings = structuredClone(defaultSettings);

// updates settings object based on the html elements
function settingSettings() {
    Object.keys(settings).forEach((key) => {
        const element = document.getElementById(key);
        switch (element.type) {
            case "checkbox":
                settings[key] = element.checked;
                break;
            default:
                settings[key] = element.value;
                break;
        }
    });

    updateSettings();
}

// HAHA! hardcoded nonsense jumpscare
function updateSettings() {
    settings.transitionLength = parseInt(settings.transitionLength);
    document.documentElement.style.setProperty("--transitionLength", `${settings.transitionLength}ms`);
    settings.delay = parseFloat(document.querySelector("#delay").value);
    document.getElementById("delayOutput").innerHTML = settings.delay.toFixed(2);
    document.documentElement.style.setProperty("--dark", `${document.querySelector("#dark").value}`);
    document.body.className = settings.enraged ? "enraged" : "";
    document.documentElement.style.setProperty("--correct", settings.correct);
    document.documentElement.style.setProperty("--misplaced", settings.misplaced);
    document.documentElement.style.setProperty("--incorrect", settings.incorrect);
    document.documentElement.style.setProperty("--tile", settings.tile);
}

// updates html elements based on settings object. this doesn't touch dark
function updateHTML() {
    Object.keys(settings).forEach((key) => {
        const element = document.getElementById(key);
        switch (element.type) {
            case "checkbox":
                element.checked = settings[key];
                break;
            default:
                element.value = settings[key];
                break;
        }
    });

    // a singular hardcoded line just as a reminder that nothing in life is perfect (especially my code)
    document.getElementById("delayOutput").innerHTML = settings.delay.toFixed(2);
}

function checkGuess(guess, word) {
    // split words into arrays
    const g = guess.split("");
    let w = word.split("");
    // create an array that will store the result with miss being the default
    const r = Array(g.length).fill("m");
    // check for greens first
    for (let i = 0; i < g.length; i++) {
        // direct match between letters
        if (g[i] === w[i]) {
            // clear the matched letter from word to prevent it from matching any other letters in guess
            w[i] = 0;
            // clear the matched letter from guess to prevent it from being double checked by yellow
            g[i] = 0;
            r[i] = "g";
        }
    }
    // now check for yellows with all greens gone
    for (let i = 0; i < g.length; i++) {
        // make sure that letter in the guess isn't already green (0 means it was already matched)
        if (g[i] !== 0) {
            // does the letter, even after all greens have been removed, still exist in the word?
            const index = w.indexOf(g[i]);
            if (index !== -1) {
                // clear the matched letter from word to prevent it from matching any other letters in guess
                w[index] = 0;
                r[i] = "y";
            }
        }
    }
    // return array containing results of guess as colors
    return r;
}

async function updateEnemy(enemy, guess) {
    const enemyElement = document.querySelector(`#w${enemy.id}`);
    const emptyGuess = enemyElement.querySelector(".guess.empty");
    const letters = emptyGuess.children;
    // the design is very human
    return new Promise((resolve) => {
        const promises = [];
        for (let i = 0; i < guess.length; i++) {
            promises.push(
                new Promise((letterDone) => {
                    letters[i].animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(90deg)" }], {
                        duration: settings.transitionLength,
                        easing: "ease-in",
                        // change constant to increase time between letter flip (1 makes it so animation will start when previous animation is done through correlation not causation)
                        delay: i * settings.transitionLength * settings.delay,
                    }).onfinish = () => {
                        letters[i].innerHTML = guess[i];
                        letters[i].classList.remove("e");
                        letters[i].classList.add(enemy.results[gameData.guess][i]);

                        letters[i].animate([{ transform: "rotateY(90deg)" }, { transform: "rotateY(0deg)" }], {
                            duration: settings.transitionLength,
                            easing: "ease-out",
                        }).onfinish = () => {
                            letterDone();
                        };
                    };
                })
            );
        }
        Promise.all(promises).then(() => {
            enemyElement.querySelector(".keyboard").innerHTML = createKeyboard(enemy.id);
            resolve(emptyGuess);
        });
    });
}

function spawnEnemy(id) {
    document.querySelector("#enemies").insertAdjacentHTML(
        "beforeend",
        `<div class="enemy" id="w${id}">
            <div class="guesses"></div>
            <details class="keyboardToggle">
                <summary>show keyboard</summary>
                <div class="keyboard"></div>
            </details>
            </div>`
    );
    const enemyElement = document.querySelector(`#w${id}`);
    enemyElement.querySelector(".keyboard").innerHTML = createKeyboard(id);
    for (let i = 0; i < gameData.maxGuesses; i++) {
        enemyElement.querySelector(".guesses").insertAdjacentHTML(
            "beforeend",
            `
            <div class="guess empty">
            <span class="e letter"></span>
            <span class="e letter"></span>
            <span class="e letter"></span>
            <span class="e letter"></span>
            <span class="e letter"></span>
            </div>
            `
        );
    }
    if (gameData.enemies.length > 1) {
        enemyElement.querySelector(".guesses").insertAdjacentHTML(
            "beforebegin",
            `
        <h2>word ${id + 1}</h2>`
        );
    }
}

function createKeyboard(id) {
    const enemy = gameData.enemies[id];
    const rows = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["z", "x", "c", "v", "b", "n", "m"],
    ];
    // new Array(3).fill([]) makes all arrays of output be the same because fill just does that
    let output = [[], [], []];

    // EVIL nested foreach with I counter
    let i = 0;
    rows.forEach((row) => {
        row.forEach((letter) => {
            output[i] += `<span class='${enemy.intel[letter]} letter'>${letter}</span>`;
        });
        i++;
    });

    return `<div class="row">${output[0]}</div>
    <div class="row">${output[1]}</div>
    <div class="row">${output[2]}</div>`;
}

document.querySelector("#submit").addEventListener("click", (event) => {
    // do NOT refresh the page (default behavior for a submit input)
    event.preventDefault();
    let guess = document.querySelector("#guesser").value;
    if (guess.length !== 5) {
        alert("guess must be 5 letters");
        if (settings.invalidPenalty) {
            document.querySelector("#guesser").value = "💀";
            // string of 5 skull emojis has a length of 10, causing everything to burst into flames
            guess = "-----";
        } else {
            return;
        }
    } else {
        if (!possibleGuesses.includes(guess)) {
            alert(`"${guess}" is NOT a valid word`);
            if (settings.invalidPenalty) {
                document.querySelector("#guesser").value = "💀";
                guess = "-----";
            } else {
                return;
            }
        }
    }

    lock();
    gameData.enemies
        .filter((enemy) => {
            return !enemy.solved;
        })
        .forEach((enemy) => {
            const result = checkGuess(guess, enemy.word);
            enemy.results.push(result);
            for (let i = 0; i < 5; i++) {
                // greens yellow grey priority order, don't override higher priorities
                const priority = ["e", "m", "y", "g"];
                const letter = guess[i];
                const color = result[i];
                if (priority.indexOf(color) > priority.indexOf(enemy.intel[letter])) {
                    enemy.intel[letter] = color;
                }
            }
            if (result.join("") === "ggggg") {
                enemy.solved = true;
            }
            gameData.promises.push(updateEnemy(enemy, guess));
        });
    Promise.all(gameData.promises).then((values) => {
        // this removes the empty class from the just used guess elements
        values.forEach((value) => value.classList.remove("empty"));
        document.querySelector("#guesser").value = "";
        gameData.guess++;
        gameData.promises = [];
        // solve enemies once all animations have completed
        const solvedEnemies = gameData.enemies.filter((enemy) => {
            return enemy.solved;
        });
        solvedEnemies.forEach((enemy) => {
            document.querySelector(`#w${enemy.id}`).classList.add("solved");
        });
        if (solvedEnemies.length === gameData.enemies.length) {
            // alert("you win. oho yeah!");
            promptContinue(true);
            return;
        } else if (gameData.guess >= gameData.maxGuesses) {
            // alert("you did NOT win. oho no");
            promptContinue(false);
            return;
        }
        lock();
        if (settings.focus) {
            document.querySelector("#guesser").focus();
        }
    });
});

function promptContinue(gaming) {
    // if player finished playing daily mode, they shouldn't be told to play daily mode again
    settings.daily = false;
    saveSettings();
    // turn disabled buttons from hourglass to stop
    document.documentElement.style.setProperty("--cursor", "not-allowed");
    // gaming is bool representing if player won
    const prompt = document.querySelector("#continue");
    prompt.innerHTML = `
    <h2>${gaming ? "congratulations you're winner" : "you did NOT win"}</h2>
    <h3>you ${gaming ? "got the word" : "did NOT get the word"} in ${gameData.guess} guess${gameData.guess > 1 ? "es" : ""}</h3>
    <button id="promptRefresh">continue gaming</button>
    <button id="promptClose">ok</button>
    `;
    const refresh = prompt.querySelector("#promptRefresh");
    refresh.addEventListener("click", () => {
        // EVIL way of restarting the game (it refreshes the page haha)
        location.reload();
    });
    prompt.querySelector("#promptClose").addEventListener("click", () => {
        // still give the player an option to restart
        refresh.innerHTML = "<b>refresh the game</b>";
        document.querySelector("#controls").insertAdjacentElement("beforeend", refresh);
        prompt.close();
    });
    prompt.showModal();
}

document.querySelector("#guesser").addEventListener("input", () => {
    let guess = document.querySelector("#guesser").value;

    // nothing here supports uppercase
    guess = guess.toLowerCase();

    // remove the spaces because they are EVIL
    guess = guess.replace(" ", "");

    // do NOT go over 5 letters
    // yes the input field has maxlength but uhhhhhhh never trust the user or something
    if (guess.length > 5) {
        guess = guess.slice(0, 5);
    }

    document.querySelector("#guesser").value = guess;

    Array.from(document.querySelectorAll(".enemy:not(.solved) .guesses")).forEach((guesses) => {
        const emptyGuess = guesses.querySelector(".guess.empty");

        for (let i = 0; i < 5; i++) {
            // evil ternary isn't real; evil ternary:
            emptyGuess.children[i].innerHTML = i < guess.length ? guess[i] : "";
        }

        // this whole thing is to determine if the last letter should bounce or not
        if (guess.length > gameData.lastGuess.length || (guess.slice(-1) !== gameData.lastGuess[guess.length - 1] && guess.length > 0)) {
            emptyGuess.children[guess.length - 1].animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }], {
                duration: 100,
                iterations: 2,
                direction: "alternate",
                easing: "linear",
            });
        }
    });
    gameData.lastGuess = guess;
});

document.querySelector("#openSettings").addEventListener("click", () => {
    document.querySelector("#settings").style.display = "flex";
    document.querySelector("#settings").showModal();
});

document.querySelector("#closeSettings").addEventListener("keydown", (key) => {
    if (key.key === "Escape") {
        key.preventDefault();
        saveSettings();
        document.querySelector("#settings").style.display = "none";
        document.querySelector("#settings").close();
    }
});

document.querySelector("#closeSettings").addEventListener("click", () => {
    saveSettings();
    document.querySelector("#settings").style.display = "none";
    document.querySelector("#settings").close();
});

// this updates all the settings when even one is changed, but i don't think this will explode anyone's computer
Array.from(document.querySelectorAll("#settings *")).forEach((setting) => {
    setting.addEventListener("change", settingSettings);
});
// these are NOT part of the in-game settings popup, but it is part of settings. i've made a mess..
document.querySelector("#invalidPenalty").addEventListener("change", () => {
    settingSettings();
    saveSettings();
});
document.querySelector("#daily").addEventListener("change", () => {
    settingSettings();
    saveSettings();
});

// i like setting my sliders to multiples of 5, so specific code to let me do that
// also this needs a parsefloat because guess what a range input's value is? a string. thanks javascript
document.querySelector("#delay").addEventListener("input", () => {
    document.getElementById("delayOutput").innerHTML = parseFloat(document.querySelector("#delay").value).toFixed(2);
});
document.querySelector("#reset").addEventListener("click", () => {
    const invalidPenalty = settings.invalidPenalty;
    const daily = settings.daily;
    settings = structuredClone(defaultSettings);
    settings.invalidPenalty = invalidPenalty;
    settings.daily = daily;
    // because dark isn't in settings
    document.querySelector("#dark").value = 0;
    // update html elements using the newly set settings
    updateHTML();
    // then do the hardcoded nonsense
    updateSettings();
});

function lock() {
    // all of these elements should share the same disabled state
    const isDisabled = document.querySelector("#guesser").disabled;
    document.querySelector("#guesser").disabled = !isDisabled;
    document.querySelector("#submit").disabled = !isDisabled;
    document.querySelector("#openSettings").disabled = !isDisabled;
}

function saveSettings() {
    // console.log("saved settings");
    localStorage.settings = JSON.stringify(settings);
}

// game setup
// storageAvailable() is from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API

function storageAvailable(type) {
    let storage;
    try {
        storage = window[type];
        const x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === "QuotaExceededError" ||
                // Firefox
                e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage &&
            storage.length !== 0
        );
    }
}

if (storageAvailable("localStorage")) {
    // load the settings
    if (localStorage.settings) {
        settings = JSON.parse(localStorage.settings);
        if (Object.keys(settings).length !== Object.keys(defaultSettings).length) {
            // oh goodness something's off, go nuclear
            settings = structuredClone(defaultSettings);
            saveSettings();
        }
        updateHTML();
    }
}

document.querySelector("#gamemode").addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        event.preventDefault();
    }
});

document.querySelector("#toggleKeyboards").addEventListener("click", () => {
    Array.from(document.querySelectorAll(".keyboardToggle")).forEach((summary) => {
        summary.open = !summary.open;
    });
});

document.querySelector("#gamemode").style.display = "flex";
document.querySelector("#gamemode").showModal();

document.querySelector("#gamemodeSelector").addEventListener("change", () => {
    document.querySelector("#enemyCount").value = document.querySelector("#gamemodeSelector").value;
    document.querySelector("#guessCount").value = [6, 7, 8, 9, 13, 21][document.querySelector("#gamemodeSelector").selectedIndex];
});

function blankPreset() {
    document.querySelector("#gamemodeSelector").value = "";
}
document.querySelector("#enemyCount").addEventListener("input", blankPreset);
document.querySelector("#guessCount").addEventListener("input", blankPreset);

document.querySelector("#start").addEventListener("click", () => {
    document.querySelector("#enemies").replaceChildren();
    gameData.maxGuesses = document.querySelector("#guessCount").value;
    const time = new Date(Date.now());
    // fill array that we will pick from
    gameData.indices = [];
    for (let i = 0; i < 2309; i++) {
        gameData.indices.push(i);
    }
    for (let i = 0; i < document.querySelector("#enemyCount").value; i++) {
        let wordIndex = 0;
        if (settings.daily) {
            // I don't know how many numbers from 0-2308 this actually covers, but oh well
            wordIndex =
                Math.ceil(time.getDate() * time.getFullYear() * (time.getMonth() + 1) * Math.pow(document.querySelector("#enemyCount").value, i + 1)) % 2309;
        } else {
            if (gameData.indices.length > 0) {
                const index = getRandomInt(0, gameData.indices.length - 1);
                wordIndex = gameData.indices[index];
                gameData.indices.splice(index, 1);
            } else {
                // if you are playing with more than 2309 words, that is your personal problem
                wordIndex = getRandomInt(0, 2308);
            }
        }
        gameData.enemies.push({
            id: i,
            word: solutions[wordIndex],
            results: [],
            solved: false,
            // store the whole alphabet in an object to make the keyboard. mmm
            intel: structuredClone(alphabet),
        });
    }
    gameData.enemies.forEach((enemy) => {
        spawnEnemy(enemy.id);
    });
    settingSettings();
    document.querySelector("#gamemode").style.display = "none";
    document.querySelector("#gamemode").close();
});
