const gameData = {
    health: 100,
    maxHealth: 100,
    damage: 0,
    hurt: null,
};

function rps(player, enemy) {
    if (player === enemy) {
        return "tie";
    } else {
        /*         
        const rps = ["r", "s", "p"];
        const p = rps.indexOf(player);
        let e = rps.indexOf(enemy) - 1;
        if (e < 0) {
            e += 3;
        }
        return p === e ? "win" : "lose";
        // this is too hard to explain, so just abuse switch statements
        // it does work though
        */
        switch (player) {
            case "r":
                return enemy === "s" ? "win" : "lose";
            case "p":
                return enemy === "r" ? "win" : "lose";
            case "s":
                return enemy === "p" ? "win" : "lose";
        }
    }
}

function damage(x) {
    gameData.damage += x;
    if (!gameData.hurt) {
        gameData.hurt = setInterval(() => {
            if (gameData.damage > 0) {
                gameData.damage--;
                gameData.health--;
                updateHealth();
            } else {
                console.log("change the world my final message goodbye");
                clearInterval(gameData.hurt);
                gameData.hurt = null;
            }
        }, 500);
    }
}

function updateHealth() {
    const redpercent = ((gameData.health - gameData.damage) / gameData.maxHealth) * 100;
    const whitepercent = (gameData.health / gameData.maxHealth) * 100;
    document.querySelector(
        "#healthbar"
    ).style.backgroundImage = `linear-gradient(to top, red 0 ${redpercent}%, yellow ${redpercent}%, white ${whitepercent}%, black ${whitepercent}% 100%)`;
    document.querySelector("#health").innerHTML = gameData.health;
}

document.querySelector("#hurt").addEventListener("click", () => {
    damage(10);
});
document.querySelector("#unhurt").addEventListener("click", () => {
    clearInterval(gameData.hurt);
    gameData.hurt = null;
    console.log(gameData.health, gameData.damage);
    // remove all pending damage, then restore 80% of missing health
    gameData.health += Math.ceil((gameData.maxHealth - (gameData.health - gameData.damage)) * 0.8) - gameData.damage;
    gameData.damage = 0;
    updateHealth();
});

updateHealth();
