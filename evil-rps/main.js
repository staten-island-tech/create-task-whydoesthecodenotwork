function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - 1)) + min;
}

const gameData = {
    health: 100,
    maxHealth: 100,
    attack: 10,
    damage: 0,
    move: null,
    hurt: null,
    encounter: [
        { name: "steve", word: "craft", guesses: [], health: 2 },
        { name: "josh", word: "drake", guesses: [], health: 5 },
    ],
};

const dom = {
    dialog: document.querySelector("dialog"),
};

/* function rps(player, enemy) {
    if (player === enemy) {
        return "tie";
    } else {        
        // const rps = ["r", "s", "p"];
        // const p = rps.indexOf(player);
        // let e = rps.indexOf(enemy) - 1;
        // if (e < 0) {
        //     e += 3;
        // }
        // return p === e ? "win" : "lose";
        // this is too hard to explain, so just abuse switch statements
        // it does work though
        switch (player) {
            case "r":
                return enemy === "s" ? "win" : "lose";
            case "p":
                return enemy === "r" ? "win" : "lose";
            case "s":
                return enemy === "p" ? "win" : "lose";
        }
    }
} */

function checkGuess(guess, word) {
    console.log(guess, word);
    // TODO: check if the guess is even a word
    const g = guess.split("");
    let w = word.split("");
    const r = Array(g.length).fill("e");
    // check for greens first
    for (let i = 0; i < g.length; i++) {
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
    console.log(r);
    return r;
}

// it's back
function nuhUh(element) {
    element.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
        }
    });
}
nuhUh(dom.dialog);

function damage(x) {
    console.log(x);
    gameData.damage += x;
    if (gameData.damage > gameData.health) {
        // do not ULTRAKILL the player
        gameData.damage = gameData.health;
    }
    if (!gameData.hurt) {
        gameData.hurt = setInterval(() => {
            if (gameData.damage > 0) {
                if (gameData.health < 1) {
                    gameData.damage = 0;
                    dead();
                } else {
                    gameData.damage--;
                    gameData.health--;
                }
                updateHealth();
            } else {
                // player has stopped hurting
                console.log("change the world my final message goodbye");
                clearInterval(gameData.hurt);
                gameData.hurt = null;
            }
        }, 30);
    }
}

function updateHealth() {
    const redpercent = ((gameData.health - gameData.damage) / gameData.maxHealth) * 100;
    const whitepercent = (gameData.health / gameData.maxHealth) * 100;
    // "You're dying. You're dying. You're dying. You're dying. You're dying."
    const color = redpercent <= 0 ? (gameData.damage % 2 === 0 ? "red" : "yellow") : "yellow";
    document.querySelector(
        "#healthbar"
    ).style.backgroundImage = `linear-gradient(to top, red 0 ${redpercent}%, ${color} ${redpercent}%, white ${whitepercent}%, black ${whitepercent}% 100%)`;
    document.querySelector("#health").innerHTML = gameData.health;
}

document.querySelector("#hurt").addEventListener("click", () => {
    move();
    // damage(getRandomInt(1, 4) * 5);
});

document.querySelector("#unhurt").addEventListener("click", () => {
    clearInterval(gameData.hurt);
    gameData.hurt = null;
    // remove all pending damage, then restore 80% of missing health
    gameData.health += Math.ceil((gameData.maxHealth - (gameData.health - gameData.damage)) * 0.8) - gameData.damage;
    gameData.damage = 0;
    updateHealth();
});

function dead() {
    console.log("you are dead. oho no");
}

function move() {
    document.querySelector("#stage progress").value += 0.1;
    if (getRandomInt(1, 1) === 1) {
        combat();
    }
}

function combat() {
    dom.dialog.innerHTML = `
    <h1>holy guacamole</h1>
    <div id="enemies"></div>
    <input type='text'>
    <button>submit</button>
    `;
    dom.dialog.querySelector("button").addEventListener("click", () => {
        attack(dom.dialog.querySelector("input").value);
    });
    updateEnemies();
    dom.dialog.appendChild(document.querySelector("#healthbar"));
    dom.dialog.showModal();
}

function attack(guess) {
    gameData.encounter.forEach((enemy) => {
        const result = checkGuess(guess, enemy.word);
        enemy.guesses.push([guess, result]);
        // player guessed it
        if (result.join("") === "g".repeat(result.length)) {
            enemy.health -= 1;
            enemy.guesses = [];
        }
    });
    console.log(gameData.encounter);
    gameData.encounter = gameData.encounter.filter((enemy) => {
        return enemy.health > 0;
    });

    if (gameData.encounter.length === 0) {
        joever();
    } else {
        updateEnemies();
    }
}

function updateEnemies() {
    dom.dialog.querySelector("#enemies").replaceChildren();
    gameData.encounter.forEach((enemy) => {
        updateEnemy(enemy);
    });
}

function updateEnemy(enemy) {
    console.log(enemy);

    dom.dialog.querySelector("#enemies").insertAdjacentHTML(
        "beforeend",
        `
        <div class="enemy">
            <p>this is ${enemy.name}</p>
            <div class="guesses"></div>
        </div>
        `
    );
    const enemyElement = dom.dialog.querySelector("#enemies").lastElementChild;
    enemy.guesses.forEach((guess) => {
        // here guess is ["pzazz", ['e'...]]
        console.log(guess);
        const display = [];
        for (let i = 0; i < guess[1].length; i++) {
            display.push(`<p class="${guess[1][i]}">${guess[0][i]}</p>`);
        }
        enemyElement.querySelector(".guesses").insertAdjacentHTML(
            "beforeend",
            `
            <div class="guess">${display.join("")}</div>
        `
        );
    });
}

function joever() {
    document.querySelector("#stage").after(dom.dialog.querySelector("#healthbar"));
    dom.dialog.close();
}

updateHealth();
