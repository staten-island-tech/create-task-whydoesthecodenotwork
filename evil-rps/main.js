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
    encounter: [{ name: "steve", health: 20, choice: "" }],
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
        console.log(g[i], w[i]);
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
            console.log(`looking for ${g[i]} in ${w}`);
            const index = w.indexOf(g[i]);
            if (index !== -1) {
                console.log(`found it at ${index}`);
                // clear the matched letter from word to prevent it from matching any other letters in guess
                w[index] = 0;
                r[i] = "y";
            }
        }
    }
    console.log(r);
    return r;
}
checkGuess("crate", "creek");

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
    if (getRandomInt(1, 10) === 1) {
        combat();
    }
}

function combat() {
    console.log("a");
    dom.dialog.innerHTML = `
    <h1>holy guacamole</h1>
    <div id="enemies"></div>
    <div id="attacks">
        <button>r</button>
        <button>p</button>
        <button>s</button>
    </div>
    `;
    updateEnemies();
    dom.dialog.appendChild(document.querySelector("#healthbar"));
    Array.from(document.querySelectorAll("dialog #attacks button")).forEach((button) => {
        button.addEventListener("click", () => {
            console.log(`ujhhh this is ${button.innerHTML}`);
            attack(button.innerHTML);
        });
    });
    dom.dialog.showModal();
}

function attack(choice) {
    gameData.encounter.forEach((enemy) => {
        switch (rps(choice, enemy.choice)) {
            case "win":
                console.log("you winner");
                enemy.health -= gameData.attack;
                break;
            case "lose":
                console.log("you losted");
                damage(20);
                break;
            case "tie":
                console.log("holy hell");
                break;
        }
    });
    console.log(gameData.encounter);
    console.log(
        gameData.encounter.filter((enemy) => {
            return enemy.health > 0;
        })
    );
    if (
        gameData.encounter.filter((enemy) => {
            return enemy.health > 0;
        }).length === 0
    ) {
        joever();
    } else {
        updateEnemies();
    }
}

function updateEnemies() {
    dom.dialog.querySelector("#enemies").replaceChildren();
    gameData.encounter.forEach((enemy) => {
        enemy.choice = "rps"[getRandomInt(0, 2)];
        dom.dialog.querySelector("#enemies").insertAdjacentHTML("beforeend", `<p>this is ${enemy.name} with ${enemy.health}hp and choiced ${enemy.choice}</p>`);
    });
}

function joever() {
    document.querySelector("#stage").after(dom.dialog.querySelector("#healthbar"));
    dom.dialog.close();
}

updateHealth();
