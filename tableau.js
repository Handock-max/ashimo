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
document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  document.getElementById("errorMsg").style.display = "none";
  showLoader(true);

  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const users = await fetchUsersFromSheet();

  const user = users.find(u => {
    const email = (u.Email || "").toLowerCase();
    const tel = (u.Téléphone || "").replace(/\s+/g, "");
    return (email === username || tel === username.replace(/\s+/g, "")) && u.Password === password;
  });

  showLoader(false);

  if (user) {
    localStorage.setItem("loggedUser", JSON.stringify(user));
    localStorage.setItem("sessionToken", Date.now().toString());
    window.location.href = "tableau.html";
  } else {
    document.getElementById("errorMsg").style.display = "block";
  }
});
