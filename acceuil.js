// Sécurité de session
const token = localStorage.getItem("sessionToken");
const userName = localStorage.getItem("userName");

if (!token || !userName) {
  window.location.href = "index.html";
}

// Affichage du nom dans l’en-tête
document.getElementById("userNameHeader").textContent = userName;

// Année dynamique
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("year2").textContent = new Date().getFullYear();

// Gestion menu latéral
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

menuBtn.addEventListener("click", () => {
  sideMenu.classList.toggle("visible");
});

// Déconnexion
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("logoutBtn2").addEventListener("click", logout);
