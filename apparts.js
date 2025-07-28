// 📌 URLs des webhooks N8N (à configurer)
const LOAD_APPARTS_URL = 'https://ash-automation.onrender.com/webhook/charger-apparts';
const DELETE_APPART_URL = 'TON_URL_N8N_DELETE';  // à remplacer
const UPDATE_APPART_URL = 'https://ash-automation.onrender.com/webhook/modifier-appart';//déjà remplacer
const ADD_APPART_URL = 'TON_URL_N8N_ADD';        // à remplacer

// 📌 Variables globales
const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let appartsData = [];
let filteredApparts = [];
let currentFilter = null;

// 📌 Éléments DOM
const appartGrid = document.getElementById("appartGrid");
const appartStatusFilter = document.getElementById("appartStatusFilter");
const addAppartButton = document.getElementById("addAppartButton");
const detailsModal = document.getElementById("detailsModal");
const editModal = document.getElementById("editModal");
const closeDetailsModal = document.getElementById("closeDetailsModal");
const closeEditModal = document.getElementById("closeEditModal");
const btnEnregistrer = document.getElementById("btnEnregistrer");
const btnFermer = document.getElementById("btnFermer");
const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");
const pageIndicator = document.getElementById("pageIndicator");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");


// Cacher les modales au démarrage
    function openModal(id) {
  document.getElementById(id).classList.remove("modal-hidden");
    }

    function closeModal(id) {
      document.getElementById(id).classList.add("modal-hidden");
    }

// 📌 Fonction d’enregistrement
function saveModifications() {
  const id = document.getElementById("editID").value;
  const maisonID = document.getElementById("editMaisonID").value;
  const etage = document.getElementById("editEtage").value.trim();
  const type = document.getElementById("editType").value.trim();
  const prix = parseFloat(document.getElementById("editPrix").value);
  const description = document.getElementById("editDescription").value.trim();
  const statut = document.getElementById("editStatut").value;
  const occupants = parseInt(document.getElementById("editOccupants").value) || 0;

  if (!etage) return alert("L'étage est requis.");
  if (!type) return alert("Le type est requis.");
  if (!statut) return alert("Le statut est requis.");

  const data = {
    ID_Appart: id,
    ID_Maison: maisonID,
    Etage: etage || null,
    Type: type,
    Prix: isNaN(prix) ? null : prix,
    Spécificité: description || null,
    Statut: statut,
    Occupants: occupants
  };

  id ? modifierAppart(data) : ajouterAppart(data);
  closeModal("editModal");
}

// 📌 Initialisation
function init() {
  const businessName = localStorage.getItem("business");
  const token = sessionStorage.getItem("sessionToken");
  const maisonID = sessionStorage.getItem("currentMaisonId");
  const maisonName = sessionStorage.getItem("currentMaisonName");

  if (!businessName || !token || !maisonID || !maisonName) {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "index.html";
    return;
  }

  document.getElementById("Maison-name").textContent = maisonName;

  logoutBtn?.addEventListener("click", handleLogout);
  backBtn?.addEventListener("click", () => window.location.href = "maisons.html");
  appartStatusFilter?.addEventListener("change", handleFilterChange);
  addAppartButton?.addEventListener("click", openAddModal);
  
  closeDetailsModal?.addEventListener("click", () => {
    closeModal("detailsModal")
  });
  closeEditModal?.addEventListener("click", () => {
    closeModal("editModal")
  });
  btnEnregistrer?.addEventListener("click", saveModifications);
  cancelEditBtn?.addEventListener("click", () => {
    closeModal("editModal")
  });
  btnFermer?.addEventListener("click", () => {
    closeModal("detailsModal")
  });
  prevPageBtn?.addEventListener("click", handlePrevPage);
  nextPageBtn?.addEventListener("click", handleNextPage);

  loadAppartements();
}



// 📌 Chargement des appartements

async function loadAppartements() {

  try {
    const maisonID = sessionStorage.getItem("currentMaisonId");
    const storedApparts = localStorage.getItem("AppartArray");

    if (storedApparts) { // Vérification du cache localStorage
      // 🔁 Chargement depuis le cache localStorage
      appartData = JSON.parse(storedApparts); // Chargement depuis le cache localStorage
      currentPage = 1;
      applyFilterAndRender();// Affichage des appartements filtrés
      return; // On sort de la fonction, pas besoin de fetch
    }

    const res = await fetch(LOAD_APPARTS_URL); // Requête pour charger les appartements
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // Vérification de la réponse

    const json = await res.json();// Conversion de la réponse en JSON
    appartsData = Array.isArray(json) ? json : [];// Vérification que c'est un tableau

    // 🔁 Stockage brut dans localStorage (pas filtré)
    localStorage.setItem("AppartArray", JSON.stringify(appartsData));

    currentPage = 1;// Réinitialisation de la page courante
    applyFilterAndRender();// Affichage des appartements filtrés
  } catch (e) {
    alert("Erreur réseau : " + e.message); // Affichage d'une alerte en cas d'erreur
  }
}


// 📌 Appliquer filtre

function applyFilterAndRender() {
  const maisonID = sessionStorage.getItem("currentMaisonId");

  if (!maisonID) {
    alert("Maison non trouvée. Veuillez retourner à la page des maisons.");
    return;
  }

  filteredApparts = appartsData.filter(app => {
    const maisonOK = app.ID_Maison == maisonID;
    const statutOK = currentFilter ? app.Statut === currentFilter : true;
    return maisonOK && statutOK;
  });

  renderApparts(); // Affichage des appartements filtrés
}

// 📌 Affichage cartes
function renderApparts() {
  //
  appartGrid.innerHTML = "";

  if (!filteredApparts.length) {
    appartGrid.innerHTML = "<p>Aucun appartement à afficher.</p>";
    pageIndicator.textContent = "Page 0 / 0";
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }

  const maxPage = Math.ceil(filteredApparts.length / ITEMS_PER_PAGE);
  currentPage = Math.min(currentPage, maxPage);

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageApparts = filteredApparts.slice(startIdx, endIdx);

  pageApparts.forEach(appart => {
    const card = document.createElement("div");
    card.className = "appart-card";

    card.innerHTML = `
      <img class="appart-img" src="${(appart.Photos && appart.Photos.length) ? appart.Photos[0] : 'appart.png'}" alt="Appart">
      <div class="appart-content">
        <h3>${appart.Type || 'N/A'}</h3>
        <p><strong>Etage:</strong> ${appart.Etage || 'N/A'}</p>
        <p><strong>Prix:</strong> ${appart.Prix ? appart.Prix + " FCFA" : 'N/A'}</p>
        <p><strong>Spécificité:</strong> ${appart.Spécificité || 'N/A'}</p>
        <p><strong>Occupants:</strong> ${appart.Occupants || 0}</p>
      </div>
      <div class="status-banner ${appart.Statut === 'Occupé' ? 'status-occupé' : ''}">
        ${appart.Statut || 'Libre'}
      </div>
    `;

    card.addEventListener("click", () => openDetailsModal(appart));
    appartGrid.appendChild(card);
  });

  pageIndicator.textContent = `Page ${currentPage} / ${maxPage}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= maxPage;
}

// 📌 Pagination
function handlePrevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderApparts();
  }
}

function handleNextPage() {
  const maxPage = Math.ceil(filteredApparts.length / ITEMS_PER_PAGE);
  if (currentPage < maxPage) {
    currentPage++;
    renderApparts();
  }
}

// 📌 Changement de filtre
function handleFilterChange() {
  currentFilter = appartStatusFilter.value || null;
  currentPage = 1;
  applyFilterAndRender();
}

// 📌 Supprimer
async function supprimerAppart(idAppart) {
  if (!confirm("Voulez-vous vraiment supprimer cet appartement ?")) return;
  try {
    const res = await fetch(DELETE_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ID_Appart: idAppart }),
    });

    if (res.ok) {
      localStorage.removeItem("AppartArray");
      alert("Appartement supprimé.");
      closeModal("detailsModal");
      init();
    } else {
      alert("Échec de la suppression.");
    }
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}

// 📌 Ajouter
async function ajouterAppart(data) {
  try {
    const res = await fetch(ADD_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      localStorage.removeItem("AppartArray");
      alert("Ajout réussi.");
      init();
    } else {
      alert("Erreur lors de l'ajout.");
    }
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}

// 📌 Modifier
async function modifierAppart(data) {
  try {
    const res = await fetch(UPDATE_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      localStorage.removeItem("AppartArray");
      alert("L'appartement a bien été changé.");
      loadAppartements();
    } else {
      alert("Erreur lors de la modification.");
    }
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}

// 📌 Modal Ajout
function openAddModal() {
  document.getElementById("editForm").reset();
  document.getElementById("editID").value = "";
  document.getElementById("editMaisonID").value = sessionStorage.getItem("currentMaisonId") || "";
  document.getElementById("editMaisonID").readOnly = true;
}

// 📌 Modal Détails
function openDetailsModal(appart) {
  detailsModal.querySelector(".modal-title").textContent = appart.Type || 'Appartement';
  detailsModal.querySelector(".modal-body").innerHTML = `
    <p><strong>ID Appartement :</strong> ${appart.ID_Appart}</p>
    <p><strong>ID Maison :</strong> ${appart.ID_Maison}</p>
    <p><strong>Etage :</strong> ${appart.Etage || 'N/A'}</p>
    <p><strong>Type :</strong> ${appart.Type || 'N/A'}</p>
    <p><strong>Prix :</strong> ${appart.Prix ? appart.Prix + ' FCFA' : 'N/A'}</p>
    <p><strong>Spécificité :</strong> ${appart.Spécificité || 'N/A'}</p>
    <p><strong>Statut :</strong> ${appart.Statut || 'Libre'}</p>
    <p><strong>Occupants :</strong> ${appart.Occupants || 0}</p>
    <p><strong>Photos :</strong> ${appart.Photos && appart.Photos.length ? appart.Photos.map(p => `<img src="${p}" style="max-width:80px; margin-right:5px; border-radius:4px;" alt="Photo">`).join('') : 'Aucune'}</p>
  `;
  document.getElementById("btnSupprimer").onclick = () => supprimerAppart(appart.ID_Appart);
  document.getElementById("btnModifier").onclick = () => {
    openEditModal(appart);
    closeModal("detailsModal");
  };
  detailsModal.classList.remove("modal-hidden");
}

// 📌 Modal Édition
function openEditModal(appart) {
  document.getElementById("editID").value = appart.ID_Appart || "";
  document.getElementById("editMaisonID").value = sessionStorage.getItem("currentMaisonId") || "";
  document.getElementById("editMaisonID").readOnly = true;
  document.getElementById("editEtage").value = appart.Etage || "";
  document.getElementById("editType").value = appart.Type || "";
  document.getElementById("editPrix").value = appart.Prix || "";
  document.getElementById("editDescription").value = appart.Spécificité || "";
  document.getElementById("editStatut").value = appart.Statut || "Libre";
  document.getElementById("editOccupants").value = appart.Occupants || "";
  editModal.classList.remove("modal-hidden");
}

// 📌 Fermer modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("modal-hidden");
}

// 📌 Déconnexion
function handleLogout() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "index.html";
}

// 📌 Lancer app
init();
