document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  const loader = document.getElementById("loader");

  errorMsg.style.display = "none";
  loader.style.display = "flex"; // Affiche le loader

  // Simule un temps de chargement (API ou vérification réelle à ajouter)
  setTimeout(() => {
    if (username === "admin" && password === "1234") {
      // Authentification réussie
      loader.style.display = "none";
      window.location.href = "Tableau.html";
    } else {
      // Échec d’authentification
      loader.style.display = "none";
      errorMsg.style.display = "block";
    }
  }, 2000); // 2 secondes pour imiter le chargement
});
