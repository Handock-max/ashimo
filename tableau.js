const API_KEY = "AIzaSyCcUePUO9Ji_4zWubaX7s4FmvE863lbmU8";  // remplace par ta vraie clé API
const SPREADSHEET_ID = "1kIAvS2GxZjiFWrYaFfvIAs0VwQDt_dkZiXgHHhJyS-4"; // remplace par l’ID de ton Google Sheet
const SHEET_NAME = "Users";

// Afficher ou masquer le loader
function showLoader(visible) {
  const loader = document.getElementById("loader");
  loader.style.display = visible ? "flex" : "none";
}

// Charger la liste des utilisateurs
async function fetchUsersFromSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const rows = data.values;

    const headers = rows[0];
    const users = rows.slice(1).map(row => {
      const user = {};
      headers.forEach((header, i) => {
        user[header] = row[i] || "";
      });
      return user;
    });

    return users;
  } catch (error) {
    console.error("Erreur Google Sheets :", error);
    return [];
  }
}

// Soumission du formulaire
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  showLoader(true); // Affiche le loader

  const input = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const errorMsg = document.getElementById("errorMsg");
  errorMsg.style.display = "none";

  const users = await fetchUsersFromSheet();

  const user = users.find(u =>
    (u.Email === input || u.Téléphone === input) && u.Password === password
  );

  showLoader(false); // Cache le loader

  if (user) {
    localStorage.setItem("loggedUser", JSON.stringify(user));
    window.location.href = "tableau.html";
  } else {
    errorMsg.style.display = "block";
  }
});