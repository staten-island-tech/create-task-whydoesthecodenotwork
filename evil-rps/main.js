function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - 1)) + min;
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

// 1 word = 6 guesses
// 2 words = 7 guesses
// 3 words = 8 guesses
// 4 words = 9 guesses
// 8 words = 13 guesses
// 16 words = 21 guesses

let gameData = {
    guess: 0,
    guesses: [],
    maxGuesses: 7,
    enemies: [
        {
            id: 0,
            word: "craft",
            results: [],
        },
        {
            id: 1,
            word: "drake",
            results: [],
        },
    ],
    promises: [],
};

const settings = {
    transitionLength: 500,
};

function checkGuess(guess, word) {
    console.log(guess, word);
    const g = guess.split("");
    let w = word.split("");
    const r = Array(g.length).fill("m");
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

async function updateEnemy(enemy, guess) {
    const enemyElement = document.querySelector(`#w${enemy.id}`);
    const emptyGuess = enemyElement.querySelector(".guess.empty");
    const letters = Array.from(emptyGuess.children);
    for (let i = 0; i < guess.length; i++) {
        await wait(i * (settings.transitionLength / 50));
        letters[i].className = "revealing";
        await wait(settings.transitionLength);
        letters[i].innerHTML = `${guess[i]}`;
        console.log(gameData.guess);
        letters[i].className = `${enemy.results[gameData.guess][i]}`;
    }
    emptyGuess.classList.remove("empty");
    await wait(settings.transitionLength);
}

function nuhUh(element) {
    element.addEventListener("click", (event) => {
        event.preventDefault();
    });
}
nuhUh(document.querySelector("#submit"));

function createEnemy(id) {
    document.querySelector("#enemies").insertAdjacentHTML("beforeend", `<div class="enemy" id="w${id}"><div class="guesses"></div></div>`);
    const enemyElement = document.querySelector(`#w${id}`);
    for (let i = 0; i < gameData.maxGuesses; i++) {
        enemyElement.querySelector(".guesses").insertAdjacentHTML(
            "beforeend",
            `
            <div class="guess empty">
            <p class="e"></p>
            <p class="e"></p>
            <p class="e"></p>
            <p class="e"></p>
            <p class="e"></p>
            </div>
            `
        );
    }
}

gameData.enemies.forEach((enemy) => {
    createEnemy(enemy.id);
});

document.querySelector("#submit").addEventListener("click", () => {
    lock();
    // TODO: check if the guess is even a word
    gameData.enemies.forEach(async (enemy) => {
        enemy.results.push(checkGuess(document.querySelector("#guesser").value, enemy.word));
        console.log("UPDATE!!!!");
        gameData.promises.push(updateEnemy(enemy, document.querySelector("#guesser").value));
    });
    Promise.all(gameData.promises).then(() => {
        console.log("we're so barack");
        lock();
        gameData.guess++;
        gameData.promises = [];
    });
});

// document.querySelector("#settings").children.forEach((element) => {
// });

document.querySelector("#transitionLength").addEventListener("change", () => {
    settings.transitionLength = document.querySelector("#transitionLength").value;
    document.documentElement.style.setProperty("--transitionLength", `${settings.transitionLength}ms`);
    console.log(document.querySelector("#transitionLength").value);
});

function lock() {
    document.querySelector("#submit").disabled = !document.querySelector("#submit").disabled;
    document.querySelector("#transitionLength").disabled = !document.querySelector("#transitionLength").disabled;
}
