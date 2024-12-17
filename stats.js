class GameStats {
  constructor() {
    this.stats = this.loadStats();
    this.achievements = this.initializeAchievements();
    this.lastPlayedDate = this.loadLastPlayedDate();
    this.totalPlayTime = this.loadTotalPlayTime() || 0;
    this.checkAchievements();
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
    this.saveLastPlayedDate();
    this.saveTotalPlayTime(time);

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

  initializeAchievements() {
    const savedAchievements = localStorage.getItem("demineurAchievements");
    if (savedAchievements) {
      return JSON.parse(savedAchievements);
    }

    return {
      firstWin: {
        unlocked: false,
        name: "Premier Pas",
        icon: "🎉",
        description: "Remporter votre première partie",
      },
      speedRunner: {
        unlocked: false,
        name: "Speed Runner",
        icon: "⚡",
        description: "Gagner une partie en moins de 30 secondes",
      },
      masterMiner: {
        unlocked: false,
        name: "Expert Démineur",
        icon: "👑",
        description: "Gagner en mode difficile",
      },
      perfectStreak: {
        unlocked: false,
        name: "Sans Faute",
        icon: "🌟",
        description: "Gagner 5 parties d'affilée",
      },
      centuryClub: {
        unlocked: false,
        name: "Club des 100",
        icon: "🏆",
        description: "Jouer 100 parties",
      },
      flagMaster: {
        unlocked: false,
        name: "Maître des Drapeaux",
        icon: "🚩",
        description: "Placer 50 drapeaux correctement",
      },
      secretNinja: {
        unlocked: false,
        name: "Ninja Silencieux",
        icon: "🥷",
        description: "Gagner sans placer un seul drapeau",
        isSecret: true,
      },
      secretNight: {
        unlocked: false,
        name: "Joueur Nocturne",
        icon: "🌙",
        description: "Jouer entre minuit et 4h du matin",
        isSecret: true,
      },
      secretLucky: {
        unlocked: false,
        name: "Chanceux",
        icon: "🍀",
        description: "Gagner en moins de 10 clics",
        isSecret: true,
      },
    };
  }

  checkAchievements() {
    const achievements = this.achievements;
    const stats = this.stats;

    if (stats.victories > 0 && !achievements.firstWin.unlocked) {
      this.unlockAchievement("firstWin");
    }

    if (stats.bestTimes.facile < 30 && !achievements.speedRunner.unlocked) {
      this.unlockAchievement("speedRunner");
    }

    if (stats.totalGames >= 100 && !achievements.veteran.unlocked) {
      this.unlockAchievement("veteran");
    }

    if (
      stats.victories > 0 &&
      stats.currentStreak >= 5 &&
      !achievements.perfectStreak.unlocked
    ) {
      this.unlockAchievement("perfectStreak");
    }

    const hasWonAllDifficulties =
      stats.gamesByDifficulty.facile > 0 &&
      stats.gamesByDifficulty.moyen > 0 &&
      stats.gamesByDifficulty.difficile > 0;

    if (hasWonAllDifficulties && !achievements.allRounder.unlocked) {
      this.unlockAchievement("allRounder");
    }

    if (
      this.stats.bestTimes.facile < 5 &&
      !this.achievements.secretSpeed.unlocked
    ) {
      this.unlockAchievement("secretSpeed");
    }

    const currentHour = new Date().getHours();
    if (
      currentHour >= 2 &&
      currentHour <= 4 &&
      !this.achievements.secretNight.unlocked
    ) {
      this.unlockAchievement("secretNight");
    }

    const lastGame = this.stats.lastGames[0];
    if (
      lastGame &&
      lastGame.isVictory &&
      lastGame.noNumbersRevealed &&
      !this.achievements.secretLucky.unlocked
    ) {
      this.unlockAchievement("secretLucky");
    }

    this.saveAchievements();
  }

  unlockAchievement(achievementId) {
    if (!this.achievements[achievementId].unlocked) {
      this.achievements[achievementId].unlocked = true;
      this.achievements[achievementId].dateUnlocked = new Date().toISOString();
      this.showAchievementPopup(this.achievements[achievementId]);
      this.saveAchievements();
    }
  }

  showAchievementPopup(achievement) {
    const popup = document.createElement("div");
    popup.className = `achievementPopup ${
      achievement.isSecret ? "secret" : ""
    }`;
    popup.innerHTML = `
      <div class="achievementIcon">${achievement.icon}</div>
      <div class="achievementInfo">
        <h3>${
          achievement.isSecret
            ? "🔒 Succès Secret Débloqué !"
            : "Succès Débloqué !"
        }</h3>
        <p>${achievement.name}</p>
      </div>
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add("show"), 100);
    setTimeout(() => {
      popup.classList.remove("show");
      setTimeout(() => document.body.removeChild(popup), 300);
    }, 4000);
  }

  saveAchievements() {
    localStorage.setItem(
      "demineurAchievements",
      JSON.stringify(this.achievements)
    );
  }

  updateStatsDisplay() {
    const statsContainer = document.querySelector("#gameStats");
    const winRate = (this.stats.victories / this.stats.totalGames) * 100 || 0;

    const achievementsHtml = Object.entries(this.achievements)
      .map(
        ([, achievement]) => `
        <div class="achievementItem ${
          achievement.unlocked ? "unlocked" : "locked"
        }">
          <span class="achievementIcon">${achievement.icon}</span>
          <div class="achievementDetails">
            <h4>${achievement.name}</h4>
            ${
              achievement.description ? `<p>${achievement.description}</p>` : ""
            }
            ${
              achievement.unlocked
                ? `<span class="unlockDate">Débloqué le ${new Date(
                    achievement.dateUnlocked
                  ).toLocaleDateString()}</span>`
                : ""
            }
          </div>
        </div>
      `
      )
      .join("");

    statsContainer.innerHTML = `
      <h2>Statistiques de Jeu</h2>
      <div class="statsGrid">
        <div class="statBox">
          <h3>Statistiques Générales</h3>
          <p>🎮 Parties jouées: ${this.stats.totalGames || 0}</p>
          <p>🏆 Victoires: ${this.stats.victories || 0}</p>
          <p>💔 Défaites: ${this.stats.defeats || 0}</p>
          <p>📊 Taux de victoire: ${winRate.toFixed(1)}%</p>
          <p>🔥 Série actuelle: ${this.stats.currentStreak || 0}</p>
          <p>⭐ Meilleure série: ${this.stats.longestStreak || 0}</p>
        </div>
        <div class="statBox">
          <h3>Meilleurs Temps</h3>
          <p>😊 Facile: ${this.formatTime(this.stats.bestTimes.facile)}</p>
          <p>😐 Moyen: ${this.formatTime(this.stats.bestTimes.moyen)}</p>
          <p>😅 Difficile: ${this.formatTime(
            this.stats.bestTimes.difficile
          )}</p>
        </div>
        <div class="statBox">
          <h3>Temps Moyens</h3>
          <p>😊 Facile: ${this.formatTime(
            this.stats.averageTimes.facile || 0
          )}</p>
          <p>😐 Moyen: ${this.formatTime(
            this.stats.averageTimes.moyen || 0
          )}</p>
          <p>😅 Difficile: ${this.formatTime(
            this.stats.averageTimes.difficile || 0
          )}</p>
        </div>
        <div class="statBox">
          <h3>Parties par Difficulté</h3>
          <p>😊 Facile: ${this.stats.gamesByDifficulty.facile || 0}</p>
          <p>😐 Moyen: ${this.stats.gamesByDifficulty.moyen || 0}</p>
          <p>😅 Difficile: ${this.stats.gamesByDifficulty.difficile || 0}</p>
        </div>
        <div class="statBox achievements">
          <h3>🏆 Achievements</h3>
          <div class="achievementsGrid">
            ${achievementsHtml}
          </div>
        </div>
      </div>
    `;
  }

  formatTime(seconds) {
    if (!seconds || seconds === Infinity) return "Aucun record";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  getLastGamesHtml() {
    return this.stats.lastGames
      .map(
        (game) => `
        <div class="gameRecord ${game.isVictory ? "victory" : "defeat"}">
          ${game.difficulty} - ${this.formatTime(game.time)}
          <span class="result">${game.isVictory ? "��" : "❌"}</span>
        </div>
      `
      )
      .join("");
  }

  loadLastPlayedDate() {
    return localStorage.getItem("demineurLastPlayed") || null;
  }

  saveLastPlayedDate() {
    localStorage.setItem("demineurLastPlayed", new Date().toISOString());
  }

  loadTotalPlayTime() {
    return parseInt(localStorage.getItem("demineurTotalPlayTime")) || 0;
  }

  saveTotalPlayTime(sessionTime) {
    this.totalPlayTime += sessionTime;
    localStorage.setItem(
      "demineurTotalPlayTime",
      this.totalPlayTime.toString()
    );
  }
}
