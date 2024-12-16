class Demineur {
  constructor() {
    this.difficultySettings = {
      facile: { width: 8, height: 8, mines: 10 },
      moyen: { width: 16, height: 16, mines: 40 },
      difficile: { width: 24, height: 24, mines: 99 },
    };

    this.gameBoard = document.querySelector("#gameBoard");
    this.difficultySelect = document.querySelector("#difficultySelect");
    this.customControls = document.querySelector("#customControls");
    this.startButton = document.querySelector("#startGame");
    this.mineCountDisplay = document.querySelector("#mineCount");
    this.timerDisplay = document.querySelector("#timer");
    this.flagModeBtn = document.querySelector("#flagMode");
    this.resetBtn = document.querySelector("#resetGame");

    this.board = [];
    this.mineCount = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.gameStarted = false;
    this.ai = null;
    this.isAIMode = false;
    this.isGameOver = false;
    this.flagMode = false;

    this.initializeEventListeners();
    this.startNewGame();
  }

  initializeEventListeners() {
    this.difficultySelect.addEventListener("change", () => {
      const isCustom = this.difficultySelect.value === "custom";
      const isAI = this.difficultySelect.value.startsWith("ia-");
      this.customControls.style.display = isCustom ? "flex" : "none";
      this.isAIMode = isAI;

      if (this.ai && !isAI) {
        this.ai = null;
      }

      if (!isCustom) {
        const inputs = this.customControls.querySelectorAll("input");
        inputs.forEach((input) => (input.value = ""));
      }

      if (isAI) {
        this.startNewGame();
      }
    });

    this.startButton.addEventListener("click", () => this.startNewGame());
    this.gameBoard.addEventListener("contextmenu", (e) => e.preventDefault());
    this.flagModeBtn.addEventListener("click", () => {
      this.flagMode = !this.flagMode;
      this.flagModeBtn.classList.toggle("active");
    });
    this.resetBtn.addEventListener("click", () => {
      this.startNewGame();
    });
  }

  startNewGame() {
    if (this.ai) {
      this.ai = null;
    }

    this.resetGame();

    let settings;
    if (this.difficultySelect.value === "custom") {
      const width = parseInt(document.querySelector("#customWidth").value);
      const height = parseInt(document.querySelector("#customHeight").value);
      const mines = parseInt(document.querySelector("#customMines").value);

      if (
        isNaN(width) ||
        isNaN(height) ||
        isNaN(mines) ||
        width < 5 ||
        height < 5 ||
        mines < 1 ||
        mines >= width * height
      ) {
        alert("Paramètres invalides. Veuillez vérifier vos entrées.");
        return;
      }

      settings = { width, height, mines };
    } else if (this.difficultySelect.value.startsWith("ia-")) {
      const difficulty = this.difficultySelect.value.replace("ia-", "");
      settings = this.difficultySettings[difficulty];
      this.isAIMode = true;
    } else {
      settings = this.difficultySettings[this.difficultySelect.value];
      this.isAIMode = false;
    }

    this.initializeGame(settings);

    if (this.isAIMode) {
      this.ai = new DemineurAI(this);
      this.ai.startPlaying();
    }
  }

  initializeGame(settings) {
    this.width = settings.width;
    this.height = settings.height;
    this.mineCount = settings.mines;
    this.board = [];
    this.gameStarted = false;

    this.gameBoard.style.gridTemplateColumns = `repeat(${this.width}, 40px)`;
    this.gameBoard.innerHTML = "";
    this.mineCountDisplay.textContent = `💣 ${this.mineCount}`;

    for (let y = 0; y < this.height; y++) {
      this.board[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.board[y][x] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        };

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;

        cell.addEventListener("click", () => this.handleCellClick(x, y));
        cell.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.handleRightClick(x, y);
        });

        this.gameBoard.appendChild(cell);
      }
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.timerDisplay.textContent = `⏱️ ${this.timer}`;
    }, 1000);
  }

  placeMines(firstX, firstY) {
    let minesPlaced = 0;
    while (minesPlaced < this.mineCount) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      if (!this.board[y][x].isMine && !(x === firstX && y === firstY)) {
        this.board[y][x].isMine = true;
        minesPlaced++;
      }
    }

    this.calculateNeighborMines();
  }

  calculateNeighborMines() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.board[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const newY = y + dy;
              const newX = x + dx;
              if (
                newY >= 0 &&
                newY < this.height &&
                newX >= 0 &&
                newX < this.width
              ) {
                if (this.board[newY][newX].isMine) count++;
              }
            }
          }
          this.board[y][x].neighborMines = count;
        }
      }
    }
  }

  handleCellClick(x, y) {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.placeMines(x, y);
      this.startTimer();
    }

    const cell = this.board[y][x];
    if (cell.isRevealed || !this.gameStarted) return;

    if (this.flagMode) {
      this.handleRightClick(x, y);
      return;
    }

    if (cell.isFlagged) return;

    if (cell.isMine) {
      this.revealAllMines();
      this.endGame(false);
      return;
    }

    this.revealCell(x, y);
    if (this.checkWin()) {
      this.endGame(true);
    }
  }

  handleRightClick(x, y) {
    if (!this.gameStarted) return;

    const cell = this.board[y][x];
    if (!cell.isRevealed) {
      cell.isFlagged = !cell.isFlagged;
      this.updateCell(x, y);

      if (this.checkWin()) {
        this.endGame(true);
      }
    }
  }

  revealCell(x, y) {
    const cell = this.board[y][x];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    this.updateCell(x, y);

    if (cell.neighborMines === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const newY = y + dy;
          const newX = x + dx;
          if (
            newY >= 0 &&
            newY < this.height &&
            newX >= 0 &&
            newX < this.width
          ) {
            this.revealCell(newX, newY);
          }
        }
      }
    }
  }

  updateCell(x, y) {
    const cell = this.board[y][x];
    const cellElement = this.gameBoard.children[y * this.width + x];
    cellElement.className = "cell";

    if (cell.isRevealed) {
      cellElement.classList.add("revealed");
      if (cell.isMine) {
        cellElement.classList.add("mine");
        cellElement.textContent = "💣";
      } else if (cell.neighborMines > 0) {
        cellElement.textContent = cell.neighborMines;
        cellElement.setAttribute("data-mines", cell.neighborMines);
      } else {
        cellElement.textContent = "";
      }
    } else if (cell.isFlagged) {
      cellElement.classList.add("flagged");
      cellElement.textContent = "🚩";
    } else {
      cellElement.textContent = "";
      cellElement.removeAttribute("data-mines");
    }
  }

  revealAllMines() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.board[y][x].isMine) {
          this.board[y][x].isRevealed = true;
          this.updateCell(x, y);
        }
      }
    }
  }

  checkWin() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.board[y][x];
        if (!cell.isMine && !cell.isRevealed) return false;
      }
    }
    return true;
  }

  endGame(won) {
    this.isGameOver = true;
    if (this.ai) {
      this.ai.stopPlaying();
      this.ai = null;
    }

    clearInterval(this.timerInterval);
    this.gameStarted = false;

    const cells = this.gameBoard.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.style.pointerEvents = "none";
    });

    if (!won) {
      this.revealAllMines();
    }

    setTimeout(() => {
      const overlay = document.createElement("div");
      overlay.className = "overlay";

      const popup = document.createElement("div");
      popup.className = "popup";

      const title = document.createElement("h2");
      title.textContent = won ? "Félicitations ! 🎉" : "Game Over ! 💣";

      const message = document.createElement("p");
      message.textContent = won ? "Vous avez gagné !" : "Vous avez perdu !";

      const playAgainBtn = document.createElement("button");
      playAgainBtn.textContent = "Rejouer";
      playAgainBtn.onclick = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(popup);
        this.startNewGame();
      };

      popup.appendChild(title);
      popup.appendChild(message);
      popup.appendChild(playAgainBtn);

      document.body.appendChild(overlay);
      document.body.appendChild(popup);
    }, 100);
  }

  resetGame() {
    this.isGameOver = false;
    const cells = this.gameBoard.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.style.pointerEvents = "auto";
    });

    clearInterval(this.timerInterval);
    this.timer = 0;
    this.timerDisplay.textContent = `⏱️ ${this.timer}`;
    this.gameStarted = false;
  }
}

class DemineurAI {
  constructor(game) {
    this.game = game;
    this.moveDelay = 800;
    this.knownMines = new Set();
    this.safeCells = new Set();
    this.probabilityMap = new Map();
    this.isPlaying = false;
    this.revealedCells = new Set();
    this.lastAnalyzedCells = new Set();
  }

  async startPlaying() {
    this.isPlaying = true;

    while (this.isPlaying && !this.game.isGameOver) {
      if (!this.game.gameStarted) {
        const firstMove = this.getOptimalFirstMove();
        await this.makeMove(firstMove.x, firstMove.y);
        await this.sleep(this.moveDelay);
        continue;
      }

      await this.analyzeBoard();
      const move = await this.getNextMove();

      if (!move) {
        const randomMove = this.getRandomUnrevealedCell();
        if (randomMove) {
          await this.makeMove(randomMove.x, randomMove.y);
        } else {
          break;
        }
      } else {
        if (move.action === "flag") {
          this.game.handleRightClick(move.x, move.y);
        } else {
          await this.makeMove(move.x, move.y);
        }
      }

      await this.sleep(this.moveDelay);
    }

    this.isPlaying = false;
  }

  getOptimalFirstMove() {
    const corners = [
      { x: 0, y: 0 },
      { x: this.game.width - 1, y: 0 },
      { x: 0, y: this.game.height - 1 },
      { x: this.game.width - 1, y: this.game.height - 1 },
    ];

    return corners[Math.floor(Math.random() * corners.length)];
  }

  async analyzeBoard() {
    this.knownMines.clear();
    this.safeCells.clear();
    this.probabilityMap.clear();
    this.lastAnalyzedCells.clear();

    for (let y = 0; y < this.game.height; y++) {
      for (let x = 0; x < this.game.width; x++) {
        const cell = this.game.board[y][x];
        if (cell.isRevealed && cell.neighborMines > 0) {
          this.analyzeCellPattern(x, y);
          this.analyzeAdvancedPatterns(x, y);
        }
      }
    }

    this.calculateProbabilities();
    this.findTandemPatterns();
  }

  analyzeCellPattern(x, y) {
    const cell = this.game.board[y][x];
    const neighbors = this.getUnrevealedNeighbors(x, y);
    const flaggedCount = this.getFlaggedNeighborsCount(x, y);
    const remainingMines = cell.neighborMines - flaggedCount;
    const remainingCells = neighbors.length;

    if (remainingMines === remainingCells) {
      neighbors.forEach((n) => {
        if (!n.isFlagged) this.knownMines.add(`${n.x},${n.y}`);
      });
    } else if (remainingMines === 0) {
      neighbors.forEach((n) => {
        if (!n.isFlagged) this.safeCells.add(`${n.x},${n.y}`);
      });
    } else {
      this.updateProbabilityMap(neighbors, remainingMines);
    }
  }

  updateProbabilityMap(cells, mineCount) {
    const probability = mineCount / cells.length;
    cells.forEach((cell) => {
      const key = `${cell.x},${cell.y}`;
      const currentProb = this.probabilityMap.get(key) || 0;
      this.probabilityMap.set(key, Math.max(currentProb, probability));
    });
  }

  calculateProbabilities() {
    for (let y = 0; y < this.game.height; y++) {
      for (let x = 0; x < this.game.width; x++) {
        const cell = this.game.board[y][x];
        if (!cell.isRevealed && !cell.isFlagged) {
          const key = `${x},${y}`;
          if (!this.probabilityMap.has(key)) {
            this.probabilityMap.set(key, 0.5);
          }
        }
      }
    }
  }

  async getNextMove() {
    if (this.safeCells.size > 0) {
      const [x, y] = Array.from(this.safeCells)[0].split(",").map(Number);
      return { x, y, action: "reveal" };
    }

    if (this.knownMines.size > 0) {
      const [x, y] = Array.from(this.knownMines)[0].split(",").map(Number);
      return { x, y, action: "flag" };
    }

    return this.getSmartestProbabilityMove();
  }

  getSmartestProbabilityMove() {
    let bestMove = null;
    let lowestProbability = 1;
    let highestSafetyScore = -1;

    for (let y = 0; y < this.game.height; y++) {
      for (let x = 0; x < this.game.width; x++) {
        const cell = this.game.board[y][x];
        if (!cell.isRevealed && !cell.isFlagged) {
          const key = `${x},${y}`;
          const probability = this.probabilityMap.get(key) || 0.5;
          const safetyScore = this.calculateSafetyScore(x, y);

          if (
            probability < lowestProbability ||
            (probability === lowestProbability &&
              safetyScore > highestSafetyScore)
          ) {
            lowestProbability = probability;
            highestSafetyScore = safetyScore;
            bestMove = { x, y, action: "reveal" };
          }
        }
      }
    }

    return bestMove;
  }

  calculateSafetyScore(x, y) {
    let score = 0;
    const neighbors = this.getRevealedNeighbors(x, y);

    neighbors.forEach((n) => {
      if (n.neighborMines === 0) score += 2;
      else if (n.neighborMines === 1) score += 1;
    });

    return score;
  }

  getUnrevealedNeighbors(x, y) {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const newX = x + dx;
        const newY = y + dy;
        if (this.isValidCell(newX, newY)) {
          const cell = this.game.board[newY][newX];
          if (!cell.isRevealed) {
            neighbors.push({ x: newX, y: newY, ...cell });
          }
        }
      }
    }
    return neighbors;
  }

  getFlaggedNeighborsCount(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const newX = x + dx;
        const newY = y + dy;
        if (
          this.isValidCell(newX, newY) &&
          this.game.board[newY][newX].isFlagged
        ) {
          count++;
        }
      }
    }
    return count;
  }

  isValidCell(x, y) {
    return x >= 0 && x < this.game.width && y >= 0 && y < this.game.height;
  }

  async makeMove(x, y) {
    this.game.handleCellClick(x, y);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stopPlaying() {
    this.isPlaying = false;
  }

  analyzeAdvancedPatterns(x, y) {
    const cell = this.game.board[y][x];
    const neighbors = this.getUnrevealedNeighbors(x, y);
    const revealedNeighbors = this.getRevealedNeighbors(x, y);

    if (neighbors.length === 0) return;

    const flaggedCount = this.getFlaggedNeighborsCount(x, y);
    const remainingMines = cell.neighborMines - flaggedCount;

    if (remainingMines === 0) {
      neighbors.forEach((n) => this.safeCells.add(`${n.x},${n.y}`));
      return;
    }

    revealedNeighbors.forEach((rn) => {
      if (rn.neighborMines > 0) {
        const sharedCells = this.getSharedUnrevealedCells(x, y, rn.x, rn.y);
        if (sharedCells.length > 0) {
          this.analyzeOverlappingPatterns(cell, rn, sharedCells);
        }
      }
    });
  }

  analyzeOverlappingPatterns(cell1, cell2, sharedCells) {
    const mines1 =
      cell1.neighborMines - this.getFlaggedNeighborsCount(cell1.x, cell1.y);
    const mines2 =
      cell2.neighborMines - this.getFlaggedNeighborsCount(cell2.x, cell2.y);

    const unsharedCells1 = this.getUnsharedCells(cell1, sharedCells);

    if (mines1 === mines2 && sharedCells.length > mines1) {
      unsharedCells1.forEach((c) => this.safeCells.add(`${c.x},${c.y}`));
    }
  }

  getRevealedNeighbors(x, y) {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const newX = x + dx;
        const newY = y + dy;
        if (this.isValidCell(newX, newY)) {
          const cell = this.game.board[newY][newX];
          if (cell.isRevealed) {
            neighbors.push({ x: newX, y: newY, ...cell });
          }
        }
      }
    }
    return neighbors;
  }

  getSharedUnrevealedCells(x1, y1, x2, y2) {
    const neighbors1 = this.getUnrevealedNeighbors(x1, y1);
    const neighbors2 = this.getUnrevealedNeighbors(x2, y2);
    const sharedCells = [];

    neighbors1.forEach((n1) => {
      neighbors2.forEach((n2) => {
        if (n1.x === n2.x && n1.y === n2.y) {
          sharedCells.push(n1);
        }
      });
    });

    return sharedCells;
  }

  getUnsharedCells(cell, sharedCells) {
    const neighbors = this.getUnrevealedNeighbors(cell.x, cell.y);
    const unsharedCells = [];

    neighbors.forEach((n) => {
      let isShared = false;
      sharedCells.forEach((sc) => {
        if (n.x === sc.x && n.y === sc.y) {
          isShared = true;
        }
      });
      if (!isShared) {
        unsharedCells.push(n);
      }
    });

    return unsharedCells;
  }

  findTandemPatterns() {
    for (let y = 0; y < this.game.height; y++) {
      for (let x = 0; x < this.game.width; x++) {
        const cell = this.game.board[y][x];
        if (cell.isRevealed && cell.neighborMines > 0) {
          this.checkTandemPattern(x, y);
        }
      }
    }
  }

  checkTandemPattern(x, y) {
    const cell = this.game.board[y][x];
    const neighbors = this.getRevealedNeighbors(x, y);

    neighbors.forEach((n) => {
      if (n.neighborMines > 0) {
        const sharedCells = this.getSharedUnrevealedCells(x, y, n.x, n.y);
        if (sharedCells.length > 0) {
          this.analyzeTandemPattern(cell, n, sharedCells);
        }
      }
    });
  }

  analyzeTandemPattern(cell1, cell2, sharedCells) {
    const mines1 =
      cell1.neighborMines - this.getFlaggedNeighborsCount(cell1.x, cell1.y);
    const mines2 =
      cell2.neighborMines - this.getFlaggedNeighborsCount(cell2.x, cell2.y);

    if (mines1 === mines2 && sharedCells.length > mines1) {
      sharedCells.forEach((c) => this.knownMines.add(`${c.x},${c.y}`));
    }
  }

  getRandomUnrevealedCell() {
    const unrevealedCells = [];

    for (let y = 0; y < this.game.height; y++) {
      for (let x = 0; x < this.game.width; x++) {
        const cell = this.game.board[y][x];
        if (!cell.isRevealed && !cell.isFlagged) {
          unrevealedCells.push({ x, y });
        }
      }
    }

    if (unrevealedCells.length === 0) return null;
    return unrevealedCells[Math.floor(Math.random() * unrevealedCells.length)];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Demineur();
});