// 📌 À PERSONNALISER : URLs des webhooks N8N
const LOAD_APPARTS_URL = 'https://ash-automation.onrender.com/webhook/charger-apparts';       // GET avec ID_Maison
const DELETE_APPART_URL = 'TON_URL_N8N_DELETE';    // POST avec ID_Appartement
const UPDATE_APPART_URL = 'TON_URL_N8N_UPDATE';    // POST avec les champs à modifier
const maisonID = sessionStorage.getItem("currentMaisonId");
// 📌 Données
let appartsData = [];
let filteredApparts = [];
let currentFilter = [];



// 📌 Chargement des appartements liés à une maison (via sessionStorage)
async function loadAppartements() {
  try {
    
    if (!maisonID) throw new Error("Aucune maison sélectionnée.");

    const res = await fetch(`${LOAD_APPARTS_URL}?ID_Maison=${encodeURIComponent(maisonID)}`);
    const json = await res.json();
    appartsData = Array.isArray(json) ? json : [];

    applyFilterAndRender();
  } catch (e) {
    alert("Erreur de chargement des appartements : " + e.message);
  }
}

// 📌 Appliquer le filtre en fonction du statut
function applyFilterAndRender() {
  filteredApparts = currentFilter
    ? appartsData.filter(app => app.Statut === currentFilter)
    : [...appartsData];
  renderApparts();
}

// 📌 Rendu visuel des cartes appartements
function renderApparts() {
  const container = document.getElementById("appartGrid");
  container.innerHTML = "";

  filteredApparts.forEach((appart) => {
    const card = document.createElement("div");
    card.className = "appart-card";

    card.innerHTML = `
      <img class="appart-img" src="${appart.Photo || 'appart.png'}" alt="Appart">
      <div class="appart-content">
        <h3>${appart.Nom_Appartement}</h3>
        <p><strong>Type:</strong> ${appart.Type}</p>
        <p><strong>Prix:</strong> ${appart.Prix || 'N/A'} FCFA</p>
      </div>
      <div class="status-banner ${appart.Statut === 'Occupé' ? 'status-occupé' : ''}">
        ${appart.Statut}
      </div>
    `;

    card.addEventListener("click", () => openDetailsModal(appart));
    container.appendChild(card);
  });
}

// 📌 Affichage de la modale détails
function openDetailsModal(appart) {
  const modal = document.getElementById("detailsModal");
  modal.querySelector(".modal-title").textContent = appart.Nom_Appartement;
  modal.querySelector(".modal-body").innerHTML = `
    <p><strong>Type :</strong> ${appart.Type}</p>
    <p><strong>Statut :</strong> ${appart.Statut}</p>
    <p><strong>Prix :</strong> ${appart.Prix || 'N/A'} FCFA</p>
    <p><strong>Description :</strong> ${appart.Description || ''}</p>
  `;

  document.getElementById("btnSupprimer").onclick = () => supprimerAppart(appart.ID_Appartement);
  document.getElementById("btnModifier").onclick = () => openEditModal(appart);
  modal.style.display = "block";
}

// 📌 Masquer une modale
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// 📌 Suppression appartement
async function supprimerAppart(id) {
  if (!confirm("Confirmer la suppression ?")) return;
  try {
    const res = await fetch(DELETE_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ID_Appartement: id }),
    });
    const result = await res.json();
    if (result.success) {
      alert("Supprimé avec succès.");
      closeModal("detailsModal");
      await loadAppartements();
    } else {
      alert("Erreur suppression.");
    }
  } catch (e) {
    alert("Erreur réseau suppression : " + e.message);
  }
}

// 📌 Ouvrir modale de modification
function openEditModal(appart) {
  closeModal("detailsModal");
  const modal = document.getElementById("editModal");
  document.getElementById("editNom").value = appart.Nom_Appartement;
  document.getElementById("editStatut").value = appart.Statut;
  document.getElementById("editPrix").value = appart.Prix || '';
  document.getElementById("editDescription").value = appart.Description || '';
  document.getElementById("editID").value = appart.ID_Appartement;
  modal.style.display = "block";
}

// 📌 Enregistrer modifications
async function saveModifications() {
  const id = document.getElementById("editID").value;
  const data = {
    ID_Appartement: id,
    Nom_Appartement: document.getElementById("editNom").value,
    Statut: document.getElementById("editStatut").value,
    Prix: document.getElementById("editPrix").value,
    Description: document.getElementById("editDescription").value,
  };

  try {
    const res = await fetch(UPDATE_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      alert("Modification enregistrée.");
      closeModal("editModal");
      await loadAppartements();
    } else {
      alert("Erreur lors de la modification.");
    }
  } catch (e) {
    alert("Erreur réseau : " + e.message);
  }
}

// 📌 Vérification des données dans sessionStorage
if (!sessionStorage.getItem("currentMaisonId") || !sessionStorage.getItem("currentMaisonName")) {
  sessionStorage.clear();
  window.location.href = "index.html"; // Redirection forcée vers la page de login
}

// 📌 Affichage du nom de la maison dans l'en-tête
document.getElementById("Maison-name").textContent = sessionStorage.getItem("currentMaisonName");

// 📌 Fonctionnalité du bouton "Retour"
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "maisons.html"; // Redirection vers la page maisons.html
});

// 📌 Fonctionnalité du bouton "Déconnexion"
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.clear(); // Vider tous les stockages
  window.location.href = "index.html"; // Redirection vers la page d'accueil
});

// 📌 Écouteurs
document.getElementById("filterStatus").addEventListener("change", (e) => {
  currentFilter = e.target.value;
  applyFilterAndRender();
});

document.getElementById("closeDetailsModal").addEventListener("click", () => closeModal("detailsModal"));
document.getElementById("closeEditModal").addEventListener("click", () => closeModal("editModal"));
document.getElementById("btnEnregistrer").addEventListener("click", saveModifications);
document.getElementById("addAppartButton").addEventListener("click", () => {
  const modal = document.getElementById("editModal");
  document.getElementById("editForm").reset();
  modal.style.display = "block";
});
document.getElementById("btnFermer").addEventListener("click", () => {
  closeModal("detailsModal");
});

// 📌 Chargement initial
window.addEventListener("DOMContentLoaded", loadAppartements);

