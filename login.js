// === PARAMÈTRES ===
const API_KEY = "AIzaSyCcUePUO9Ji_4zWubaX7s4FmvE863lbmU8";
const SPREADSHEET_ID = "1kIAvS2GxZjiFWrYaFfvIAs0VwQDt_dkZiXgHHhJyS-4";
const SHEET_NAME = "Users";

// === UTILITAIRES ===

// Affiche ou masque le loader
function showLoader(show) {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = show ? "flex" : "none";
}

// Récupère les utilisateurs depuis Google Sheets
async function fetchUsersFromSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length === 0) return [];

    const headers = rows[0];
    return rows.slice(1).map(row => {
      const user = {};
      headers.forEach((header, i) => {
        user[header.trim()] = row[i] ? row[i].toString().trim() : "";
      });
      return user;
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
    return [];
  }
}

// === TIMER INACTIVITÉ ===

function startInactivityTimer() {
  let inactivityTimer;

  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      sessionStorage.clear();
      localStorage.clear();      
      alert("Session expirée après 5 minutes d'inactivité.");
      window.location.href = "login.html";
    }, 5 * 60 * 1000); // 5 minutes
  }

  window.onload = resetTimer;
  document.onmousemove = resetTimer;
  document.onkeypress = resetTimer;
}

// === ÉVÉNEMENT DE SOUMISSION DU FORMULAIRE ===

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const errorMsg = document.getElementById("errorMsg");
  errorMsg.style.display = "none";
  showLoader(true);

  const usernameInput = document.getElementById("username").value.trim().toLowerCase();
  const passwordInput = document.getElementById("password").value.trim();

  const users = await fetchUsersFromSheet();
  showLoader(false);

  const matchingUser = users.find(u => {
    const email = (u.Email || "").toLowerCase();
    const tel = (u.Téléphone || "").replace(/\s+/g, "");
    const inputTel = usernameInput.replace(/\s+/g, "");
    return (
      (email === usernameInput || tel === inputTel) &&
      u.Password === passwordInput
    );
  });

  if (!matchingUser) {
    errorMsg.textContent = "Identifiant et/ou mot de passe invalide(s).";
    errorMsg.style.display = "block";
    return;
  }

  const status = (matchingUser.Statut || "").toLowerCase().trim();

  if (status === "actif") {
    // 🧠 Stockage dans sessionStorage
    sessionStorage.setItem("sessionToken", Date.now().toString());

    // 📦 Copie vers localStorage
    localStorage.setItem("username", matchingUser["Nom"] || "");
    localStorage.setItem("userFirstname", matchingUser["Prénoms"] || "");
    localStorage.setItem("business", matchingUser["Business"] || "");
    localStorage.setItem("database", matchingUser["Database"] || "");
    localStorage.setItem("photo", matchingUser["Photo"] || "");
    localStorage.setItem("status", status);

    // Redirection + activation du timer
    window.location.href = "accueil.html";
  } else {
    errorMsg.textContent = "Compte inactif. Veuillez renouveler votre abonnement.";
    errorMsg.style.display = "block";
  }
});

// === EFFACER LE MESSAGE D'ERREUR LORS DE LA SAISIE ===

document.getElementById("username").addEventListener("input", () => {
  const errorMsg = document.getElementById("errorMsg");
  if (errorMsg) errorMsg.style.display = "none";
});

document.getElementById("password").addEventListener("input", () => {
  const errorMsg = document.getElementById("errorMsg");
  if (errorMsg) errorMsg.style.display = "none";
});

// === DÉMARRAGE TIMER SUR PAGE PROTÉGÉE ===
// (à placer dans les autres pages comme accueil.html, maisons.html, etc.)
if (window.location.pathname.includes("accueil") || window.location.pathname.includes("maisons")) {
  startInactivityTimer();
}
