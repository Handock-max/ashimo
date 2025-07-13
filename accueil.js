document.addEventListener("DOMContentLoaded", () => {
  // Vérification de la session utilisateur
  const token = localStorage.getItem("sessionToken");
  const userName = localStorage.getItem("userName");

  if (!token || !userName) {
    window.location.href = "index.html";
    return; // Stoppe l’exécution si l’utilisateur n’est pas connecté
  }

  // Affiche le nom de l'utilisateur
  document.getElementById("userNameHeader").textContent = userName;

  // Fonction de déconnexion
  const logout = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };

  // Écoute sur bouton croix déconnexion
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
});