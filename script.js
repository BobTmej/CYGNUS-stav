
const REPO = "BobTmej/CYGNUS-stav";
const BRANCH = "main";
const FILENAME = "stav.json";
const ADMIN_PASSWORD = "IreVypadek"; // hashování doporučeno

let githubToken = localStorage.getItem("githubToken") || "";

async function fetchStatus() {
  try {
    const response = await fetch("stav.json");
    const data = await response.json();
    return data;
  } catch (e) {
    document.getElementById("statusContainer").innerHTML = "<p style='color:red;'>Nepodařilo se načíst stav ze serveru.</p>";
    return null;
  }
}

function renderStatus(data) {
  if (!data) return;
  const el = document.getElementById("statusContainer");
  const statusMap = {
    "OK": "🟢 Systém běží",
    "OMEZENÍ": "🟡 Probíhá plánovaná odstávka",
    "VÝPADEK": "🔴 Výpadek systému"
  };

  const status = data.status || "NEZNÁMÝ";
  const color = status === "OK" ? "green" : (status === "OMEZENÍ" ? "orange" : "red");
  let html = `<p><strong>Aktuální stav:</strong> <span style="color:${color}">${statusMap[status]}</span></p>`;

  if (status === "OK") {
    if (data.noteTime) {
      const t = new Date(data.noteTime);
      if (!isNaN(t.getTime())) {
        t.setHours(t.getHours() - 1, 0, 0, 0);
        html += `<p><em>Poslední aktualizace stavu: ${t.getHours().toString().padStart(2, '0')}:00.</em> Neustále tento stav monitorujeme.</p>`;
      }
    }
    html += `<p><span style="color:green; font-weight:bold;">POTVRZUJEME, že CYGNUS je v bezvadné kondici. Všechny jeho funkce jsou v pořádku!</span></p>`;
  } else if (status === "OMEZENÍ") {
    html += `<p>Díky Novinkám už to víte – aktuálně není CYGNUS skutečně dostupný.</p>`;
    if (data.note) html += `<p><strong>Detail:</strong> ${data.note}</p>`;
  } else if (status === "VÝPADEK") {
    html += `<p><strong style="color:red;">Je možné, že se vyskytla chyba, která znemožňuje spuštění systému.</strong></p>`;
    if (data.noteList?.length) {
      html += "<ul>";
      data.noteList.forEach(n => {
        html += `<li><strong>${n.time}:</strong> ${n.text}</li>`;
      });
      html += "</ul>";
    }
  }
  el.innerHTML = html;
}

function showLogin() {
  const input = prompt("Zadejte heslo správce:");
  if (input === ADMIN_PASSWORD) {
    const token = prompt("Zadejte GitHub token pro úpravy:");
    githubToken = token;
    localStorage.setItem("githubToken", token);
    document.getElementById("adminPanel").style.display = "block";
    fetchStatus().then(data => {
      document.getElementById("statusSelect").value = data.status || "OK";
      document.getElementById("statusNoteInput").value = data.note || "";
    });
  } else {
    alert("Nesprávné heslo.");
  }
}

async function saveStatus() {
  const status = document.getElementById("statusSelect").value;
  const note = document.getElementById("statusNoteInput").value.trim();

  const currentData = await fetchStatus();
  const newData = {
    ...currentData,
    status,
    note,
    noteTime: new Date().toISOString(),
    noteList: status === "VÝPADEK" && note ? [...(currentData.noteList || []), { time: new Date().toLocaleString("cs-CZ"), text: note }] : []
  };

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
  const res1 = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILENAME}`, {
    headers: { Authorization: `Bearer ${githubToken}` }
  });
  const { sha } = await res1.json();

  const res2 = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILENAME}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Aktualizace stavu systému",
      content,
      sha,
      branch: BRANCH
    })
  });

  if (res2.ok) {
    alert("✅ Stav uložen.");
    location.reload();
  } else {
    alert("❌ Nepodařilo se uložit změny.");
  }
}

fetchStatus().then(renderStatus);
