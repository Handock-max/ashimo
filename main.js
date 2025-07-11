document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  // Authentification fictive pour démo locale
  if (username === "admin" && password === "1234") {
    // Rediriger vers tableau de bord (par ex. tableau.html)
    window.location.href = "pages/tableau.html";
  } else {
    // Afficher l’erreur
    document.getElementById("errorMsg").style.display = "block";
  }
});
