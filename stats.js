class GameStats {
  constructor() {
    this.stats = this.loadStats();
  }

  loadStats() {
    const defaultStats = {
      totalGames: 0,
      victories: 0,
      defeats: 0,
      bestTimes: {
        facile: Infinity,
        moyen: Infinity,
        difficile: Infinity,
      },
      averageTimes: {
        facile: 0,
        moyen: 0,
        difficile: 0,
      },
      totalTimesByDifficulty: {
        facile: 0,
        moyen: 0,
        difficile: 0,
      },
      gamesByDifficulty: {
        facile: 0,
        moyen: 0,
        difficile: 0,
      },
      lastGames: [],
      longestStreak: 0,
      currentStreak: 0,
    };

    const savedStats = localStorage.getItem("demineurStats");
    return savedStats ? JSON.parse(savedStats) : defaultStats;
  }

  saveStats() {
    localStorage.setItem("demineurStats", JSON.stringify(this.stats));
  }

  updateGameStats(difficulty, time, isVictory) {
    this.stats.totalGames++;
    this.stats.gamesByDifficulty[difficulty]++;

    if (isVictory) {
      this.stats.victories++;
      this.stats.currentStreak++;
      this.stats.longestStreak = Math.max(
        this.stats.longestStreak,
        this.stats.currentStreak
      );

      if (time < this.stats.bestTimes[difficulty]) {
        this.stats.bestTimes[difficulty] = time;
      }
    } else {
      this.stats.defeats++;
      this.stats.currentStreak = 0;
    }

    this.stats.totalTimesByDifficulty[difficulty] += time;
    this.stats.averageTimes[difficulty] =
      this.stats.totalTimesByDifficulty[difficulty] /
      this.stats.gamesByDifficulty[difficulty];

    this.stats.lastGames.unshift({
      difficulty,
      time,
      isVictory,
      date: new Date().toISOString(),
    });

    if (this.stats.lastGames.length > 10) {
      this.stats.lastGames.pop();
    }

    this.saveStats();
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    const statsContainer = document.querySelector("#gameStats");
    const winRate = (this.stats.victories / this.stats.totalGames) * 100 || 0;
    const lossRate = (this.stats.defeats / this.stats.totalGames) * 100 || 0;

    statsContainer.innerHTML = `
      <div class="statsGrid">
        <div class="statBox">
          <h3>Statistiques Générales</h3>
          <p>Parties jouées: ${this.stats.totalGames}</p>
          <p>Victoires: ${this.stats.victories}</p>
          <p>Défaites: ${this.stats.defeats}</p>
          <p>Taux de victoire: ${winRate.toFixed(1)}%</p>
          <p>Taux de défaite: ${lossRate.toFixed(1)}%</p>
          <p>Série actuelle: ${this.stats.currentStreak}</p>
          <p>Meilleure série: ${this.stats.longestStreak}</p>
        </div>
        <div class="statBox">
          <h3>Statistiques par Difficulté</h3>
          <p>Facile: ${this.stats.gamesByDifficulty.facile} parties</p>
          <p>Moyen: ${this.stats.gamesByDifficulty.moyen} parties</p>
          <p>Difficile: ${this.stats.gamesByDifficulty.difficile} parties</p>
        </div>
        <div class="statBox">
          <h3>Temps Moyens</h3>
          <p>Facile: ${this.formatTime(this.stats.averageTimes.facile)}</p>
          <p>Moyen: ${this.formatTime(this.stats.averageTimes.moyen)}</p>
          <p>Difficile: ${this.formatTime(
            this.stats.averageTimes.difficile
          )}</p>
        </div>
        <div class="statBox">
          <h3>Meilleurs Temps</h3>
          <p>Facile: ${this.formatTime(this.stats.bestTimes.facile)}</p>
          <p>Moyen: ${this.formatTime(this.stats.bestTimes.moyen)}</p>
          <p>Difficile: ${this.formatTime(this.stats.bestTimes.difficile)}</p>
        </div>
        <div class="statBox">
          <h3>Dernières Parties</h3>
          ${this.getLastGamesHtml()}
        </div>
      </div>
    `;
  }

  formatTime(time) {
    return time === Infinity ? "---" : `${time}s`;
  }

  getLastGamesHtml() {
    return this.stats.lastGames
      .map(
        (game) => `
        <div class="gameRecord ${game.isVictory ? "victory" : "defeat"}">
          ${game.difficulty} - ${this.formatTime(game.time)}
          <span class="result">${game.isVictory ? "✅" : "❌"}</span>
        </div>
      `
      )
      .join("");
  }
}
