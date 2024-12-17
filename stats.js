class GameStats {
  constructor() {
    window.gameStats = this;

    this.ranks = {
      bronze: { name: "Bronze", minPoints: 0, color: "#cd7f32" },
      silver: { name: "Argent", minPoints: 100, color: "#c0c0c0" },
      gold: { name: "Or", minPoints: 300, color: "#ffd700" },
      platinum: { name: "Platine", minPoints: 600, color: "#e5e4e2" },
      diamond: { name: "Diamant", minPoints: 1000, color: "#b9f2ff" },
      master: { name: "Maître", minPoints: 1500, color: "#ff4d4d" },
      grandmaster: { name: "Grand Maître", minPoints: 2000, color: "#ff1a1a" },
      legend: { name: "Légende", minPoints: 3000, color: "#ff0000" },
    };

    this.stats = this.loadStats();
    if (!this.stats.rankPoints) {
      this.stats.rankPoints = 0;
      this.stats.currentRank = "bronze";
      this.saveStats();
    }
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
    const points = this.calculatePointsForGame(difficulty, time, isVictory);
    const rankChanged = this.updateRank(points);

    this.stats.totalGames++;
    if (isVictory) {
      this.stats.victories++;
      this.stats.currentStreak++;
      this.stats.longestStreak = Math.max(
        this.stats.longestStreak,
        this.stats.currentStreak
      );
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

    this.showRankNotification(points, rankChanged);
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
    const rankDisplay = document.querySelector(".header .rankDisplay");
    const rankInfo = this.ranks[this.stats.currentRank];
    const progress = this.calculateProgressPercentage();

    rankDisplay.style.setProperty("--rank-color", rankInfo.color);
    rankDisplay.innerHTML = `
      <div class="currentRankInfo">
        <span class="rankIcon">${this.getRankIcon(
          this.stats.currentRank
        )}</span>
        <span class="rankName">${rankInfo.name}</span>
        <span class="rankPoints">${this.stats.rankPoints} points</span>
      </div>
      <div class="rankProgressBar">
        <div class="progressTrack"></div>
        <div class="progressFill" style="width: ${progress}%; background-image: linear-gradient(90deg, rgba(255,255,255,0.2), ${
      rankInfo.color
    } 50%, rgba(255,255,255,0.2))"></div>
        <div class="progressGlow" style="--progress: ${progress}%; background: ${
      rankInfo.color
    }"></div>
        <div class="progressParticles">
          ${Array(10)
            .fill()
            .map(() => "<span></span>")
            .join("")}
        </div>
      </div>
      <div class="rankNextLevel">
        ${this.getNextRankInfo()}
      </div>
    `;
  }

  getNextRankInfo() {
    const nextRank = Object.entries(this.ranks).find(
      ([, data]) => data.minPoints > this.stats.rankPoints
    );

    if (!nextRank)
      return '<span class="maxRank">Rang Maximum Atteint! 🏆</span>';

    const pointsNeeded = nextRank[1].minPoints - this.stats.rankPoints;
    return `<span class="nextRank">Prochain rang: ${nextRank[1].name} (${pointsNeeded} points)</span>`;
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

  calculatePointsForGame(difficulty, time, isVictory) {
    const basePoints = {
      facile: 10,
      moyen: 25,
      difficile: 50,
    };

    if (!isVictory) {
      const pointsLoss = Math.ceil(basePoints[difficulty] * 1.5);
      return -Math.min(this.stats.rankPoints, pointsLoss);
    }

    const timeBonus = {
      facile: time < 60 ? 5 : 0,
      moyen: time < 180 ? 10 : 0,
      difficile: time < 300 ? 20 : 0,
    };

    const rankMultiplier = Math.max(0.1, 1 - this.stats.rankPoints / 3000);
    return Math.ceil(
      (basePoints[difficulty] + timeBonus[difficulty]) * rankMultiplier
    );
  }

  updateRank(points) {
    this.stats.rankPoints = Math.max(0, this.stats.rankPoints + points);

    let newRank = "bronze";
    for (const [rank, data] of Object.entries(this.ranks)) {
      if (this.stats.rankPoints >= data.minPoints) {
        newRank = rank;
      }
    }

    const rankChanged = this.stats.currentRank !== newRank;
    this.stats.currentRank = newRank;
    return rankChanged;
  }

  showRankNotification(points, rankChanged) {
    const popup = document.createElement("div");
    popup.className = "rankPopup";

    const pointsText = points >= 0 ? `+${points}` : points;
    const rankInfo = this.ranks[this.stats.currentRank];

    popup.innerHTML = `
      <div class="rankInfo" style="color: ${rankInfo.color}">
        <span class="rankPoints">${pointsText} points</span>
        <span class="rankName">${rankInfo.name}</span>
        ${rankChanged ? '<span class="rankUp">Rang Supérieur !</span>' : ""}
      </div>
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add("show"), 100);
    setTimeout(() => {
      popup.classList.remove("show");
      setTimeout(() => document.body.removeChild(popup), 300);
    }, 3000);
  }

  showRankModal() {
    const modal = document.createElement("div");
    modal.className = "rankModal";

    const ranksHtml = Object.entries(this.ranks)
      .map(([key, rank]) => {
        const isCurrentRank = key === this.stats.currentRank;
        return `
          <div class="rankItem ${isCurrentRank ? "currentRank" : ""}" 
               style="border-color: ${rank.color}">
            <div class="rankHeader" style="color: ${rank.color}">
              <span class="rankIcon">${this.getRankIcon(key)}</span>
              <span class="rankName">${rank.name}</span>
            </div>
            <div class="rankDetails">
              <p>Points requis: ${rank.minPoints}</p>
              ${this.getRankBonusInfo(key)}
            </div>
          </div>
        `;
      })
      .join("");

    modal.innerHTML = `
      <div class="modalContent">
        <div class="modalHeader">
          <h2>Système de Rangs</h2>
          <button class="closeModal">×</button>
        </div>
        <div class="modalBody">
          <div class="rankInfo">
            <h3>Votre Progression</h3>
            <p>Points actuels: ${this.stats.rankPoints}</p>
            <p>Rang actuel: ${this.ranks[this.stats.currentRank].name}</p>
          </div>
          <div class="pointsInfo">
            <h3>Gains de Points</h3>
            <ul>
              <li>🎯 Facile: 10 points + bonus temps</li>
              <li>🎯 Moyen: 25 points + bonus temps</li>
              <li>🎯 Difficile: 50 points + bonus temps</li>
              <li>⏱️ Bonus temps: jusqu'à 20 points</li>
              <li>💔 Défaite: -50% des points de base</li>
            </ul>
          </div>
          <div class="ranksGrid">
            ${ranksHtml}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector(".closeModal").onclick = () => {
      modal.classList.add("closing");
      setTimeout(() => document.body.removeChild(modal), 300);
    };

    setTimeout(() => modal.classList.add("show"), 50);
  }

  getRankIcon(rank) {
    const icons = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      platinum: "💎",
      diamond: "💫",
      master: "👑",
      grandmaster: "⚜️",
      legend: "🏆",
    };
    return icons[rank] || "🎮";
  }

  getRankBonusInfo(rank) {
    const bonuses = {
      bronze: "Pas de bonus",
      silver: "+5% points bonus",
      gold: "+10% points bonus",
      platinum: "+15% points bonus",
      diamond: "+20% points bonus",
      master: "+25% points bonus",
      grandmaster: "+30% points bonus",
      legend: "+40% points bonus",
    };
    return `<p class="rankBonus">${bonuses[rank]}</p>`;
  }

  calculateProgressPercentage() {
    const currentRank = this.ranks[this.stats.currentRank];
    const nextRank = Object.entries(this.ranks).find(
      ([, data]) => data.minPoints > this.stats.rankPoints
    );

    if (!nextRank) return 100;

    const currentPoints = this.stats.rankPoints - currentRank.minPoints;
    const pointsNeeded = nextRank[1].minPoints - currentRank.minPoints;
    return Math.min(100, (currentPoints / pointsNeeded) * 100);
  }
}
