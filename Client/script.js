// Game data arrays
const gameData = {
  guest: {
    score: 164,
    words: [
      {
        text: "tamboys",
        score: 12,
      },
    ],
  },
  ai: {
    score: 0,
    words: [
      {
        text: "tamboys",
        score: 12,
      },
      {
        text: "grill",
        score: 8,
      },
      {
        text: "easting",

        score: 12,
      },
      {
        text: "domelike",

        score: 12,
      },
      {
        text: "thicked",

        score: 11,
      },
      {
        text: "embedment",

        score: 12,
      },
      {
        text: "sulphone",

        score: 12,
      },
    ],
  },
};

// Function to render word list
function renderWordList(playerId, words) {
  const container = document.getElementById(`${playerId}-words`);
  container.innerHTML = "";
  words.forEach((word) => {
    const wordItem = document.createElement("div");
    wordItem.className = `word-item${word.isPass ? " pass" : ""}`;

    const wordText = document.createElement("span");
    wordText.className = "word-text";

    if (word.highlight) {
      const baseText = word.text.replace(word.highlight, "");
      const highlightSpan = `<span style="color: ${word.highlightColor};">${word.highlight}</span>`;
      wordText.innerHTML = baseText + highlightSpan;
    } else {
      wordText.textContent = word.text;
    }

    const wordScore = document.createElement("span");
    wordScore.className = "word-score";

    const scoreIcon = document.createElement("span");
    scoreIcon.className = `score-icon${
      playerId === "ai" ? " ai-score-icon" : ""
    }`;
    scoreIcon.textContent = "!";

    wordScore.appendChild(document.createTextNode(word.score));
    wordScore.appendChild(scoreIcon);

    wordItem.appendChild(wordText);
    wordItem.appendChild(wordScore);
    container.appendChild(wordItem);
  });
}

// Function to update scores
function updateScores() {
  document.getElementById("guest-score").textContent = gameData.guest.score;
  document.getElementById("ai-score").textContent = gameData.ai.score;
}

// Function to add new word
function addWord(playerId, wordData) {
  gameData[playerId].words.unshift(wordData);
  renderWordList(playerId, gameData[playerId].words);
}

// Initialize the game display
function initGame() {
  renderWordList("guest", gameData.guest.words);
  renderWordList("ai", gameData.ai.words);
  updateScores();
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initGame);

function showMessage(message, type = "error") {
  const container = document.getElementById("message-container");

  container.className = "";
  container.classList.add(type);
  container.textContent = message;
  container.style.display = "block";

  setTimeout(() => {
    container.style.display = "none";
  }, 3000);
}

function getLastWord(word) {
  return word.toString().split("").reverse()[0];
}
function getFirstWord(word) {
  return word.toString().split("")[0];
}
let currentWord = "a";
const socket = io("http://localhost:3000");
const userId = Math.random().toString()?.split(".")[1];
const joinbtn = document.getElementById("joinbtn");
const myname = document.getElementById("myname");
const roomname = document.getElementById("roomname");
const submitForm = document.getElementById("submitForm");
const myscore = document.getElementById("my-score");
const otherscore = document.getElementById("other-score");
const input = document.querySelector(".myinput");
const myinput = document.querySelector(".me");
const otherinput = document.querySelector(".other");
const onput = document.querySelector(".otherinput");
const myName = document.querySelector(".myName");
const otherName = document.querySelector(".otherName");

myinput.addEventListener("keyup", (e) => {
  socket.emit("steam", e.target.value);
});
socket.on("steamResponse", (data) => {
  if (data.id !== userId && onput) {
    onput.placeholder = data.placeholder;
  }
});
submitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const wordCheck = getFirstWord(input.value);
  if (currentWord?.toLowerCase() !== wordCheck.toString().toLowerCase()) {
    return showMessage(`Starting letter must be "${currentWord}"`, "info");
  }
  fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${input.value
      ?.toString()
      .toLowerCase()}`
  )
    .then((response) => response.json())
    .then((result) => {
      if (Array.isArray(result)) {
        socket.emit("inputValue", input.value);
        input.value = "";
      } else {
        socket.emit("worngWord");
        return showMessage("Please use a valid English word.", "error");
        // return showMessage("Please use a valid English word.");
      }
    })
    .catch((err) => {
      showMessage(err.message, "error");
    });
});

joinbtn.addEventListener("click", () => {
  if (myname.value?.trim() === "") {
    return showMessage("Your name is required", "error");
  }
  if (roomname.value?.trim() === "") {
    return showMessage("Room name is required", "error");
  }
  socket.emit("join-room", {
    name: myname.value,
    room: roomname.value,
    userId,
  });
  joinbtn.innerText = "Your are in";
  joinbtn.style.backgroundColor = "#047857";
});
socket.on("response", (data) => {
  if (data.member.length === 1) {
    if (data.member[0]?.userId === userId) {
      myscore.innerText = 100;
      myName.innerText = data.member[0]?.name;
      otherName.innerText = "loading...";
      otherscore.innerText = 0;
    }
    if (data.member[0]?.userId !== userId) {
      otherscore.innerText = 100;
      otherName.innerText = data.member[0]?.name;
    }
  }
  data?.member.map((user) => {
    if (user?.userId === userId) {
      myscore.innerText = 100;
      myName.innerText = user?.name;
    }
    if (user?.userId !== userId) {
      otherscore.innerText = 100;
      otherName.innerText = user?.name;
    }
  });
});

socket.on("inputResponse", (data) => {
  const isMyTurn = data.data.user !== userId;

  // Update current word
  currentWord = getLastWord(data.data.message);

  if (isMyTurn) {
    myinput.classList.add("activePannel");
    otherinput.classList.remove("activePannel");
    input.disabled = false; // enable
    input.placeholder = "Enter your word...";
  } else {
    myinput.classList.remove("activePannel");
    otherinput.classList.add("activePannel");
    input.disabled = true; // disable
    input.placeholder = "Opponent's turn...";
  }

  // Update scores
  if (data.data.user === userId) {
    myscore.innerText = data?.data.points;
  } else {
    otherscore.innerText = data?.data.points;
  }
});

socket.on("worngWordResponse", (data) => {
  if (data.data.user === userId) {
    myscore.innerText = data?.data.points;
  } else {
    otherscore.innerText = data?.data.points;
  }
});
