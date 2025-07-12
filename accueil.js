const API_KEY = "AIzaSyCcUePUO9Ji_4zWubaX7s4FmvE863lbmU8";
const SPREADSHEET_ID = "1kIAvS2GxZjiFWrYaFfvIAs0VwQDt_dkZiXgHHhJyS-4";
const SHEET_NAME = "Users";

// Affiche ou cache le loader
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
    return [];
  }
}

// Gestion du formulaire de connexion
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const errorMsg = document.getElementById("errorMsg");
  errorMsg.style.display = "none";
  showLoader(true);

  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const users = await fetchUsersFromSheet();

  // On cherche un utilisateur correspondant (email ou téléphone) et mot de passe OK
  const matchingUser = users.find(u => {
    const email = (u.Email || "").toLowerCase();
    const tel = (u.Téléphone || "").replace(/\s+/g, "");
    const inputTel = username.replace(/\s+/g, "");
    return (
      (email === username || tel === inputTel) &&
      u.Password === password
    );
  });

  showLoader(false);

  const status = (matchingUser.Statut || matchingUser.Status || "").toLowerCase().trim();

if (status === "Actif") {
  // Connexion autorisée
  localStorage.setItem("loggedUser", JSON.stringify(matchingUser));
  localStorage.setItem("userName", matchingUser["Nom"] || "");
  localStorage.setItem("userFirstname", matchingUser["Prénoms"] || "");
  localStorage.setItem("businessName", matchingUser["Business"] || "");
  localStorage.setItem("userDatabaseID", matchingUser["Database"] || "");
  localStorage.setItem("userPhoto", matchingUser["Photo"] || "");
  localStorage.setItem("sessionToken", Date.now().toString());

  window.location.href = "accueil.html";
} else {
  errorMsg.textContent = "Veuillez payer votre abonnement";
  errorMsg.style.display = "block";
}
});
// Ce bloc est à ajouter juste après la gestion du "submit"
document.getElementById("username").addEventListener("input", () => {
  const errorMsg = document.getElementById("errorMsg");
  if (errorMsg) errorMsg.style.display = "none";
});

document.getElementById("password").addEventListener("input", () => {
  const errorMsg = document.getElementById("errorMsg");
  if (errorMsg) errorMsg.style.display = "none";
});