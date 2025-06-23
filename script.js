async function processImage() {
  const input = document.getElementById('imageInput');
  const status = document.getElementById('status');
  if (!input.files.length) {
    status.textContent = "Please upload an image first.";
    return;
  }

  const image = input.files[0];
  status.textContent = "Scanning text...";

  const { data: { text } } = await Tesseract.recognize(image, 'eng');
  const playerName = extractName(text);
  if (!playerName) {
    status.textContent = "Player name not found.";
    return;
  }

  status.textContent = `Found: ${playerName}. Looking up team...`;
  const team = await getTeam(playerName);
  if (team) {
    saveToInventory(playerName, team);
    status.textContent = `Card saved: ${playerName} – ${team}`;
    updateInventory();
  } else {
    status.textContent = "Player not found in MLB API.";
  }
}

function extractName(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  for (const line of lines) {
    if (/^[A-Z][A-Za-z.'-]+ [A-Z][A-Za-z.'-]+$/.test(line)) {
      return line;
    }
  }
  return null;
}

async function getTeam(name) {
  const [firstName, lastName] = name.split(" ");
  const url = `https://statsapi.mlb.com/api/v1/people?firstName=${firstName}&lastName=${lastName}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.people && data.people[0] && data.people[0].currentTeam) {
      return data.people[0].currentTeam.name;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

function saveToInventory(name, team) {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  cards.push({ name, team });
  localStorage.setItem("cards", JSON.stringify(cards));
}

function updateInventory() {
  const list = document.getElementById("inventoryList");
  list.innerHTML = "";
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  cards.forEach(card => {
    const li = document.createElement("li");
    li.textContent = `${card.name} – ${card.team}`;
    list.appendChild(li);
  });
}

window.onload = updateInventory;
