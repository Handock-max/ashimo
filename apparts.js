// 📌 À PERSONNALISER : URLs des webhooks N8N
const LOAD_APPARTS_URL = 'https://ash-automation.onrender.com/webhook/charger-apparts';       // GET avec ID_Maison
const DELETE_APPART_URL = 'TON_URL_N8N_DELETE';    // POST avec ID_Appartement
const UPDATE_APPART_URL = 'TON_URL_N8N_UPDATE';    // POST avec les champs à modifier

// 📌 Données
let appartsData = [];
let filteredApparts = [];
let currentFilter = "";

// 📌 Chargement des appartements liés à une maison (via sessionStorage)
async function loadAppartements() {
  try {
    const maisonID = sessionStorage.getItem("ID_Maison");
    if (!maisonID) throw new Error("Aucune maison sélectionnée.");

    const res = await fetch(`${LOAD_APPARTS_URL}?idMaison=${encodeURIComponent(maisonID)}`);
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

  filteredApparts.forEach((appart, index) => {
    const card = document.createElement("div");
    card.className = "appart-card";

    card.innerHTML = `
      <div class="appart-img"><img src="${appart.Photo || 'appart.png'}" alt="Appart"></div>
      <div class="appart-info">
        <h3>${appart.Nom_Appartement}</h3>
      </div>
      <div class="appart-status ${appart.Statut === 'Libre' ? 'Libre' : 'Occupé'}">
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
    <p><strong>Nombre de pièces :</strong> ${appart.Pieces}</p>
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
  modal.querySelector("#editNom").value = appart.Nom_Appartement;
  modal.querySelector("#editStatut").value = appart.Statut;
  modal.querySelector("#editPrix").value = appart.Prix || '';
  modal.querySelector("#editDescription").value = appart.Description || '';
  modal.querySelector("#editID").value = appart.ID_Appartement;
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

// 📌 Écouteurs
document.getElementById("filterStatus").addEventListener("change", (e) => {
  currentFilter = e.target.value;
  applyFilterAndRender();
});

document.getElementById("closeDetailsModal").addEventListener("click", () => closeModal("detailsModal"));
document.getElementById("closeEditModal").addEventListener("click", () => closeModal("editModal"));
document.getElementById("btnEnregistrer").addEventListener("click", saveModifications);

// 📌 Chargement initial
window.addEventListener("DOMContentLoaded", loadAppartements);
