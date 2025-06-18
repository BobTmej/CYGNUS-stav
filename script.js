
async function loadStatus() {
  try {
    const response = await fetch("stav.json");
    if (!response.ok) throw new Error("Soubor stav.json nebyl nalezen");
    return await response.json();
  } catch (e) {
    document.getElementById("statusContainer").innerHTML = `<p style="color:red;"><strong>❌ Nepodařilo se načíst stav systému.</strong><br>${e.message}</p>`;
    return { status: "NEZNÁMÝ", note: "", noteList: [], noteTime: "" };
  }
}

function checkAdminLogin() {
  const password = prompt("Zadejte administrátorské heslo:");
  if (password === "IreVypadek") {
    document.getElementById("adminControls").style.display = "block";
  }
}

async function saveStatus(data) {
  alert("Uložení na server není dostupné bez serverového prostředí nebo GitHub tokenu.");
}
