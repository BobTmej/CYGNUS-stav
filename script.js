
const repo = "BobTmej/CYGNUS-stav";
const branch = "main";
const filename = "stav.json";
const rawURL = "stav.json";
const apiURL = `https://api.github.com/repos/${repo}/contents/${filename}`;
const adminHash = "3a3c313cfb9c88fc5ae69a9f25c4eaef186d6d6fd0e2d8a0eb1c1431c7e6df84"; // hash hesla

let githubToken = ""; // nastaví se po přihlášení

async function sha256(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function loadStatus() {
  const res = await fetch(rawURL);
  if (!res.ok) {
    alert("Nepodařilo se načíst stav ze serveru.");
    return;
  }
  const data = await res.json();
  return data;
}

async function saveStatus(newData) {
  if (!githubToken) {
    alert("Chybí GitHub token.");
    return;
  }

  const shaRes = await fetch(apiURL, {
    headers: { Authorization: `token ${githubToken}` }
  });
  const fileData = await shaRes.json();

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

  const res = await fetch(apiURL, {
    method: "PUT",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Aktualizace stavu systému",
      content,
      sha: fileData.sha,
      branch
    })
  });

  if (res.ok) {
    alert("✅ Stav úspěšně uložen.");
  } else {
    alert("❌ Nepodařilo se uložit stav.");
  }
}

async function checkAdminLogin() {
  const password = prompt("Zadejte heslo:");
  const hashed = await sha256(password || "");
  if (hashed === adminHash) {
    githubToken = prompt("Zadejte GitHub token:");
    if (githubToken) {
      alert("✅ Přihlášení úspěšné.");
      document.getElementById("adminControls").style.display = "block";
    }
  } else {
    alert("❌ Neplatné heslo.");
  }
}
