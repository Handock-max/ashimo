document.addEventListener("DOMContentLoaded", () => {
  // Vérification de la session utilisateur
  const token = sessionStorage.getItem("sessionToken");
  const userName = localStorage.getItem("userName");

  if (!token || !userName) {
    window.location.href = "index.html";
    return;
    } else {
  // Démarre le timer d’inactivité
  startInactivityTimer();
  } // Stoppe l’exécution si l’utilisateur n’est pas connecté


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

//TIMER
  function startInactivityTimer() {
  let inactivityTimer;

  function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      sessionStorage.clear();
      localStorage.clear();      
      alert("Session expirée après 5 minutes d'inactivité.");
      window.location.href = "index.html";
    }, 5 * 60 * 1000); // 5 minutes
  }

  window.onload = resetTimer;
  document.onmousemove = resetTimer;
  document.onkeypress = resetTimer;
}

});