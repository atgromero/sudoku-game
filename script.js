let level;
let timerInterval;
let timeLeft;
const timeDisplay = document.getElementById("time-display");

let errors = 0;
const maxErrors = 5;

let gameStarted = false;
let gameOver = false;
const errorsLeftDisplay = document.getElementById("errors-left");
const errorsLeftCount = document.getElementById("errors-left-count");
const failInt = document.getElementById("fails");

let solution;
let board;
let numSelected = null;
let tileSelected = null;

const solutions = [
  [
    "387491625",
    "241568379",
    "569327418",
    "758619234",
    "123784596",
    "496253187",
    "934176852",
    "675832941",
    "812945763",
  ],
  [
    "921674835",
    "438519276",
    "765328149",
    "147296583",
    "382751694",
    "596843721",
    "859137462",
    "274965318",
    "613482957",
  ],
  [
    "159437826",
    "426589713",
    "738261459",
    "861395247",
    "947126385",
    "325748691",
    "612874593",
    "583912674",
    "794653128",
  ],
  [
    "835672491",
    "294158376",
    "176349528",
    "487216953",
    "563794182",
    "912583764",
    "621437895",
    "758921643",
    "349865217",
  ],
];

// Init Function

window.onload = function () {
  setNumbers();
  setBoard();
  clearBoard();
};

// Event Listeners

document.getElementById("start-btn").addEventListener("click", () => {
  clearBoard();
  startGame();
});

document.getElementById("retry-btn").addEventListener("click", retry);

//Show Msg function

function showMsg(msg, duration = 2000) {
  const modal = document.getElementById(msg);
  modal.classList.remove("hidden");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, duration);
}

// Helper functions
function getLevel() {
  return document.querySelector('input[name="level"]:checked').value;
}

function getRandomSolution() {
  const randomIndex = Math.floor(Math.random() * solutions.length);
  return solutions[randomIndex];
}

function minMax(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getConfetti() {
  confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.6 },
    angle: 90,
    colors: ["#f9d5e5", "#cce3dc", "#f0f0f0", "#b08d57", "#c9d6df"],
    ticks: 200,
    gravity: 0.8,
  });
}

// Core functions

function setNumbers() {
  for (let row = 1; row < 10; row++) {
    let number = document.createElement("div");
    number.id = row;
    number.innerText = row;
    number.addEventListener("click", selectNumber);
    number.setAttribute("aria-label", `Select number ${row}`);
    number.classList.add("number");
    document.getElementById("numbers").appendChild(number);
  }
}

function setBoard() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      let tile = document.createElement("div");
      tile.id = `${row}-${col}`;
      tile.classList.add("tile");
      tile.setAttribute(
        "aria-label",
        `Empty tile at row ${row + 1}, column ${col + 1}`
      );
      tile.addEventListener("click", chooseTile);
      document.getElementById("grid").appendChild(tile);
    }
  }
}

function generateBoard(solution, cluesPerRow) {
  return solution.map((row) => {
    const rowArr = row.split("");
    let indexes = Array.from({ length: 9 }, (_, i) => i);
    indexes.sort(() => Math.random() - 0.5);
    const keepIdxNum = new Set(indexes.slice(0, cluesPerRow));
    return rowArr.map((num, i) => (keepIdxNum.has(i) ? num : "-")).join("");
  });
}

function startGame() {
  gameStarted = true;
  startTimer();

  level = getLevel();

  let cluesPerRow;

  if (level === "easy") {
    cluesPerRow = minMax(4, 6);
  } else if (level === "medium") {
    cluesPerRow = minMax(3, 4);
  } else if (level === "hard") {
    cluesPerRow = minMax(0, 3);
  }

  solution = getRandomSolution();

  board = generateBoard(solution, cluesPerRow);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      const tile = document.getElementById(`${row}-${col}`);

      if (value !== "-") {
        tile.innerText = value;
        tile.classList.add("tile-start");
        setAriaLabel(tile, "prefilled", value);
      } else {
        tile.innerText = "";
        tile.classList.remove("tile-start", "fail", "correct");
        setAriaLabel(tile, "empty", value);
      }
    }
  }
}

function selectNumber() {
  if (!gameStarted) {
    showMsg("start-msg");
    return;
  }
  if (numSelected != null) {
    numSelected.classList.remove("number-selected");
  }
  numSelected = this;
  numSelected.classList.add("number-selected");
}

function chooseTile() {
  if (!gameStarted || gameOver) return;

  if (!numSelected) {
    showMsg("select-msg");
    return;
  }
  if (
    this.classList.contains("tile-start") ||
    this.classList.contains("correct")
  )
    return;

  if (tileSelected) tileSelected.classList.remove("tile-active");

  tileSelected = this;
  tileSelected.classList.add("tile-active");
  // console.log(this.id);

  if (numSelected) {
    const [r, c] = this.id.split("-").map(Number);

    this.innerText = numSelected.id;

    if (solution[r][c] == numSelected.id) {
      this.classList.remove("fail");
      this.classList.add("correct");
      setAriaLabel(this, "correct", numSelected.id);
      checkWin();
    } else {
      this.classList.add("fail");
      setAriaLabel(this, "fail", numSelected.id);
      errors += 1;
      updateStatus();
      if (errors >= maxErrors) {
        endGame(false);
      }
    }
  }
}

function updateStatus() {
  const errLeft = maxErrors - errors;

  errorsLeftDisplay.classList.add("small");
  errorsLeftDisplay.classList.remove("hidden");
  errorsLeftCount.innerText = errLeft;
  failInt.innerText = errors;
}

function clearBoard() {
  gameStarted = false;
  gameOver = false;
  errorsLeftCount.innerText = "5";
  errorsLeftDisplay.classList.add("hidden");
  tileSelected = null;

  errors = 0;
  failInt.innerText = errors;
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.innerText = "";
    tile.classList.remove("tile-start", "fail", "correct", "tile-active");

    const [row, col] = tile.id.split("-").map(Number);
    setAriaLabel(tile, "empty");
  });
  if (numSelected) {
    numSelected.classList.remove("number-selected");
    numSelected = null;
  }
}

function retry() {
  errors = 0;
  failInt.innerText = errors;
  tileSelected = null;
  clearInterval(timerInterval);
  startTimer();

  updateStatus();

  document.querySelectorAll(".tile").forEach((tile) => {
    if (!tile.classList.contains("tile-start")) {
      tile.innerText = "";
      tile.classList.remove("fail", "correct", "tile-active");
      setAriaLabel(tile, "empty");
    }
  });

  if (numSelected) {
    numSelected.classList.remove("number-selected");
    numSelected = null;
  }
}

function endGame(win) {
  gameOver = true;
  clearInterval(timerInterval);
  const msg = win ? "You Win!" : "You Lose!";
  errorsLeftDisplay.innerText = msg;

  if (!win) {
    showMsg("over-msg");
  } else {
    getConfetti();
  }
}

function checkWin() {
  const allCorrect = Array.from(document.querySelectorAll(".tile")).every(
    (tile) =>
      tile.classList.contains("tile-start") ||
      tile.classList.contains("correct")
  );

  if (allCorrect) {
    endGame(true);
  }
}

//Timer functions

function getTimer() {
  const timer = document.querySelector('input[name="time"]:checked').value;

  if (timer === "seven") return 7 * 60;
  if (timer === "twenty") return 20 * 60;
  return null;
}

function startTimer() {
  clearInterval(timerInterval);
  const timeLimit = getTimer();

  if (timeLimit === null) {
    timeDisplay.innerText = "Time: ∞";
    return;
  }

  timeLeft = timeLimit;
  updateTimeDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimeDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame(false);
    }
  }, 1000);
}

function updateTimeDisplay() {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const pad = sec < 10 ? "0" + sec : sec;
  timeDisplay.innerText = `Time: ${min}:${pad}`;
}

//Aria labels

function setAriaLabel(tile, status, value = "") {
  const [row, col] = tile.id.split("-").map(Number);

  let label = "";

  if (status === "empty") {
    label = `Empty tile at row ${row + 1}, column ${col + 1}`;
  } else if (status === "prefilled") {
    label = `Pre-filled number ${value} at row ${row + 1}, column ${col + 1}`;
  } else if (status === "correct") {
    label = `Correct number ${value} at row ${row + 1}, column ${col + 1}`;
  } else if (status === "fail") {
    label = `Incorrect number ${value} at row ${row + 1}, column ${col + 1}`;
  }

  tile.setAttribute("aria-label", label);
}
