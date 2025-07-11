const API_KEY = "AIzaSyCcUePUO9Ji_4zWubaX7s4FmvE863lbmU8";  // remplace par ta vraie clé API
const SPREADSHEET_ID = "1kIAvS2GxZjiFWrYaFfvIAs0VwQDt_dkZiXgHHhJyS-4"; // remplace par l’ID de ton Google Sheet
const SHEET_NAME = "Users";

// Affiche ou cache le loader
function showLoader(show) {
  const loader = document.getElementById("loader");
  loader.style.display = show ? "flex" : "none";
}

// Récupère les utilisateurs depuis Google Sheets
async function fetchUsersFromSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length === 0) {
      console.error("Aucune donnée trouvée dans la feuille Google Sheets.");
      return [];
    }

    const headers = rows[0];
    const users = rows.slice(1).map(row => {
      const user = {};
      headers.forEach((header, i) => {
        user[header] = row[i] ? row[i].toString().trim() : "";
      });
      return user;
    });

    return users;
  } catch (error) {
    console.error("Erreur lors de la récupération des données Google Sheets :", error);
    return [];
  }
}

// Gestion du formulaire de connexion
document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  // Cacher message erreur et afficher loader
  document.getElementById("errorMsg").style.display = "none";
  showLoader(true);

  // Récupérer et nettoyer les valeurs saisies
  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  // Récupérer utilisateurs
  const users = await fetchUsersFromSheet();

  // Chercher utilisateur valide
  const user = users.find(u =>
    (u.Email.toLowerCase() === username || u.Téléphone === username) &&
    u.Password === password
  );

  // Cacher loader
  showLoader(false);

  if (user) {
    // Stocker utilisateur connecté et rediriger
    localStorage.setItem("loggedUser", JSON.stringify(user));
    window.location.href = "tableau.html";
  } else {
    // Afficher erreur
    document.getElementById("errorMsg").style.display = "block";
  }
});