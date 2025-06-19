
let isAdmin = false;

function showLogin() {
  document.getElementById("loginSection").style.display = "block";
}

async function adminLogin() {
  const password = document.getElementById("adminPassword").value;
  const res = await fetch('/admin_login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (data.success) {
    isAdmin = true;
    document.getElementById("adminPanel").style.display = "block";
    loadStatus();
  } else {
    alert("Nesprávné heslo");
  }
}

async function loadStatus() {
  const res = await fetch('/status');
  const data = await res.json();
  const container = document.getElementById("statusContainer");
  let html = `<p><strong>Aktuální stav:</strong> ${getStatusLabel(data.status)}</p>`;

  if (data.status === "OK") {
    html += formatUpdateTime();
    html += `<p><span style="color: green; font-weight: bold;">POTVRZUJEME, že CYGNUS je v bezvadné kondici. Všechny jeho funkce jsou v pořádku!</span></p>`;
    html += `<p><strong>Pokud přesto máte potíže se spuštěním nebo připojením k CYGNUSu, vyzkoušejte následující:</strong></p>`;
    html += `<ol style="margin-left: 1.5em;">`;
    html += `<li style="margin-bottom: 0.6em;">Zkontrolujte, zdali Vám funguje Vaše internetové připojení. Například tak, že zkusíte otevřít nějakou internetovou stránku.</li>`;
    html += `<li style="margin-bottom: 0.6em;">Zkuste vypnout a znovu zapnout CYGNUS.</li>`;
    html += `<li>Zkuste restartovat počítač a poté znovu spustit CYGNUS.</li>`;
    html += `</ol>`;
    html += `<p style="text-align: justify;">Nepomohlo nic z výše uvedeného? Obraťte se prosím na svého IT správce nebo kontaktujte naše oddělení podpory pomocí odkazu <a href="https://napoveda.cygnusakademie.cz/support/tickets/new" target="_blank">zde</a>. Rádi Vám poradíme – i nám záleží na tom, aby Vám vše fungovalo, jak má.</p>`;
  } else if (data.status === "OMEZENÍ") {
    html += `<p style="text-align: justify;">Díky Novinkám už to víte – aktuálně není CYGNUS skutečně dostupný. Až jej opět spustíme, bude Vám sloužit ve Vaší práci ještě lépe – bude lepší, zdravější a výkonnější!</p>`;
    if (data.note) html += `<p><strong>Detail:</strong> ${data.note}</p>`;
  } else if (data.status === "VÝPADEK") {
    const hasNotes = data.notes && data.notes.length > 0;

    html += `<p>Ups, i přes veškerou péči má CYGNUS nyní slabší chvilku.</p>`;
    html += `<p><span style="color: red; font-weight: bold;">Je možné, že se vyskytla nějaká chyba, znemožňující jeho spuštění, nebo nefunguje některá jeho část.</span></p>`;
    if (data.notes && data.notes.length > 0) {
      html += "<ul>";
    
      data.notes.forEach((n, i) => {
        html += `<li><strong>${n.time}:</strong> ${n.text}`;
        if (isAdmin) html += ` <span style='color:red;cursor:pointer;' onclick='deleteNote(${i})'>✖</span>`;
        html += `</li>`;
      });
      html += "</ul>";
    
    }
    if (!hasNotes) {
      html += `<p><em>Pracujeme na upřesnění detailních informací.</em></p>`;
    }
    html += `<p style="text-align: justify;">Ale víme o tom! Usilovně pracujeme na odstranění potíží. Prosíme o strpení, naše péče se nyní maximálně soustředí na znovuspuštění CYGNUSu. Jakmile budeme vědět, napíšeme na toto místo, o jakou potíž se jedná a předpokládaný čas spuštění tak, aby Vám mohl CYGNUS opět maximálně sloužit.</p>`;
  }

  html += `<p style='margin-top:1rem;'><a href='' onclick='location.reload(); return false;'>🔁 Zde klikněte pro aktualizaci informací na této stránce</a></p>`;
  container.innerHTML = html;

  if (isAdmin) {
    document.getElementById("statusSelect").value = data.status;
    const noteInput = document.getElementById("noteInput");

    if (data.status === "OK") {
      noteInput.placeholder = "Poznámky nejsou potřeba";
      noteInput.disabled = true;
    } else if (data.status === "OMEZENÍ") {
      noteInput.placeholder = "Např. Konec probíhající odstávky očekáváme ve 2:00";
      noteInput.disabled = false;
    } else if (data.status === "VÝPADEK") {
    const hasNotes = data.notes && data.notes.length > 0;

      noteInput.placeholder = "Např. Výpadek na straně poskytovatele cloudových služeb";
      noteInput.disabled = false;
    }

    noteInput.value = data.note || "";
  }
}

function getStatusLabel(s) {
  if (s === "OK") {
    return `<span style="color: green; font-weight: bold;">🟢 Systém běží</span>`;
  } else if (s === "OMEZENÍ") {
    return `<span style="color: orange; font-weight: bold;">🟡 Probíhá plánovaná odstávka</span>`;
  } else if (s === "VÝPADEK") {
    return `<span style="color: red; font-weight: bold;">🔴 Výpadek systému</span>`;
  }
  return s;
}

function formatUpdateTime(rawTime) {
  const timeObj = rawTime ? new Date(rawTime) : new Date();

  if (!isNaN(timeObj.getTime())) {
    timeObj.setHours(timeObj.getHours() - 1);
    timeObj.setMinutes(0, 0, 0);
    const hours = timeObj.getHours().toString().padStart(2, '0');
    const minutes = timeObj.getMinutes().toString().padStart(2, '0');
    return `<p><em>Poslední aktualizace stavu: ${hours}:${minutes}. Neustále tento stav monitorujeme.</em></p>`;
  } else {
    return `<p><em>Čas poslední aktualizace není dostupný.</em></p>`;
  }
}

async function saveStatus() {
  const status = document.getElementById("statusSelect").value;
  const note = document.getElementById("noteInput").value;

  await fetch('/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note })
  });

  loadStatus();
}

async function deleteNote(index) {
  await fetch('/delete_note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index })
  });
  loadStatus();
}


function onStatusChange() {
  const status = document.getElementById("statusSelect").value;
  const noteInput = document.getElementById("noteInput");
  noteInput.value = "";

  if (status === "OK") {
    noteInput.placeholder = "Poznámky nejsou potřeba";
    noteInput.disabled = true;
  } else if (status === "OMEZENÍ") {
    noteInput.placeholder = "Např. Konec probíhající odstávky očekáváme ve 2:00";
    noteInput.disabled = false;
  } else if (status === "VÝPADEK") {
    noteInput.placeholder = "Např. Výpadek na straně poskytovatele cloudových služeb";
    noteInput.disabled = false;
  }
}

window.onload = loadStatus;

