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

  // Mise à jour dynamique de l'année
  const currentYear = new Date().getFullYear();
  document.querySelectorAll(".year").forEach(el => (el.textContent = currentYear));

  // Gestion du menu latéral
  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");

  menuBtn?.addEventListener("click", () => {
    const isVisible = sideMenu.classList.toggle("visible");
    sideMenu.setAttribute("aria-hidden", !isVisible);
    console.log(`Menu ${isVisible ? "ouvert" : "fermé"}`); // Debug : état du menu
  });

  // Fonction de déconnexion
  const logout = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };

  // Gestion des événements de déconnexion
  document.querySelectorAll("#logoutBtn, #logoutBtn2").forEach(btn =>
    btn?.addEventListener("click", e => {
      e.preventDefault();
      logout();
    })
  );
});
