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
const socket = io("http://13.202.211.217");
const userId = Math.random().toString()?.split(".")[1];
const joinbtn = document.getElementById("joinbtn");
const myname = document.getElementById("myname");
const roomname = document.getElementById("roomname");
const submitForm = document.getElementById("submitForm");
const myscore = document.getElementById("my-score");
const currentW = document.getElementById("currentWord");
const otherscore = document.getElementById("other-score");
const wordDiv = document.getElementById("word");
const input = document.querySelector(".myinput");
const myinput = document.querySelector(".me");
const otherinput = document.querySelector(".other");
const onput = document.querySelector(".otherinput");

const myName = document.querySelector(".myName");
const otherName = document.querySelector(".otherName");
currentW.innerText = currentWord;

myinput.addEventListener("keyup", (e) => {
  socket.emit("steam", e.target.value);
});
socket.on("steamResponse", (data) => {
  if (data.id !== userId && onput) {
    onput.placeholder = data.placeholder;
  }
});

socket.on("joinLimit", () => {
  joinbtn.innerText = "Join Room";
  joinbtn.style.backgroundColor = "#1e3a8a";
  return showMessage(`Your requested room is full`, "info");
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

  wordDiv.style.display = "block";

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
  currentWord = getLastWord(data.data.message);
  currentW.innerText = currentWord;
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
