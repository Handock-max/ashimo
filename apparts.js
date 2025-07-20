// 📌 URLs des webhooks N8N
const LOAD_APPARTS_URL = 'https://ash-automation.onrender.com/webhook/charger-apparts'; // GET avec ID_Maison
const DELETE_APPART_URL = 'TON_URL_N8N_DELETE'; // POST avec ID_Appartement
const UPDATE_APPART_URL = 'TON_URL_N8N_UPDATE'; // POST avec les champs à modifier
const ADD_APPART_URL = 'TON_URL_N8N_ADD'; // POST avec les champs à ajouter

// 📌 Constantes et variables globales
const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let appartsData = [];
let filteredApparts = [];
let currentFilter = null;

// 📌 Sélection des éléments DOM
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


// 📌 Fonction universelle d'enregistrement (ajout ou modification)
function saveModifications() {
  const id = document.getElementById("editID").value;
  const nom = document.getElementById("editNom").value.trim();
  const statut = document.getElementById("editStatut").value;
  const prix = document.getElementById("editPrix").value;
  const type = document.getElementById("editType").value;
  const description = document.getElementById("editDescription").value;
  const maisonID = sessionStorage.getItem("currentMaisonId");

  if (!nom) {
    alert("Le nom est requis.");
    return;
  }

  const data = {
    ID_Appartement: id,
    Nom_Appartement: nom,
    Statut: statut,
    Prix: prix,
    Description: description,
    ID_Maison: maisonID,
    Type : type
  };

  if (id) {
    modifierAppart(data);
  } else {
    ajouterAppart(data);
  }

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

  logoutBtn.addEventListener("click", handleLogout);
  backBtn.addEventListener("click", () => window.location.href = "maisons.html");
  appartStatusFilter.addEventListener("change", handleFilterChange);
  addAppartButton.addEventListener("click", openAddModal);
  closeDetailsModal.addEventListener("click", () => closeModal("detailsModal"));
  closeEditModal.addEventListener("click", () => closeModal("editModal"));
  btnEnregistrer.addEventListener("click", saveModifications);
  cancelEditBtn.addEventListener("click", () => closeModal("editModal"));
  btnFermer.addEventListener("click", () => closeModal("detailsModal"));
  prevPageBtn?.addEventListener("click", handlePrevPage);
  nextPageBtn?.addEventListener("click", handleNextPage);

  loadAppartements();
}


// 📌 Chargement des appartements
async function loadAppartements() {
  try {
    const maisonID = sessionStorage.getItem("currentMaisonId");
    const storedApparts = localStorage.getItem("AppartArray");

    if (storedApparts) {
      const appartsArray = JSON.parse(storedApparts);
      appartsData = appartsArray.filter(app => app.ID_Maison === maisonID);
      currentPage = 1;
      applyFilterAndRender();
      return;
    }

    const res = await fetch(LOAD_APPARTS_URL);
    const json = await res.json();

    appartsData = Array.isArray(json) ? json : [];
    localStorage.setItem("AppartArray", JSON.stringify(appartsData));
    currentPage = 1;
    applyFilterAndRender();
  } catch (e) {
    alert("Erreur de chargement : " + e.message);
  }
}

// 📌 Appliquer le filtre et afficher
function applyFilterAndRender() {
  filteredApparts = currentFilter
    ? appartsData.filter(app => app.Statut === currentFilter)
    : [...appartsData];
  renderApparts();
}

// 📌 Afficher les cartes d'appartements
function renderApparts() {
  appartGrid.innerHTML = "";

  if (!filteredApparts.length) {
    appartGrid.innerHTML = "<p>Aucun appartement à afficher.</p>";
    return;
  }

  const maxPage = Math.ceil(filteredApparts.length / ITEMS_PER_PAGE);
  if (currentPage > maxPage) currentPage = maxPage;

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageApparts = filteredApparts.slice(startIdx, endIdx);

  pageApparts.forEach(appart => {
    const card = document.createElement("div");
    card.className = "appart-card";

    card.innerHTML = `
      <img class="appart-img" src="${appart.Photo || 'appart.png'}" alt="Appart">
      <div class="appart-content">
        <h3>${appart.Nom_Appartement}</h3>
        <p><strong>Type:</strong> ${appart.Type}</p>
        <p><strong>Prix:</strong> ${appart.Prix} FCFA</p>
        <p><strong>Spécificité:</strong> ${appart.Description || 'N/A'}</p>

      </div>
      <div class="status-banner ${appart.Statut === 'Occupé' ? 'status-occupé' : ''}">
        ${appart.Statut}
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
  currentFilter = appartStatusFilter.value;
  currentPage = 1;
  applyFilterAndRender();
}

// 📌 Supprimer
async function supprimerAppart(idAppart) {
  try {
    const res = await fetch(DELETE_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ID_Appartement: idAppart }),
    });

    if (res.ok) {
      localStorage.removeItem("AppartArray");
      alert("Appartement supprimé.");
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
      alert("Modification réussie.");
      init();
    } else {
      alert("Erreur lors de la modification.");
    }
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}

// 📌 Ouvrir modal ajout
function openAddModal() {
  document.getElementById("editForm").reset();
  document.getElementById("editID").value = "";
  editModal.style.display = "block";
}

// 📌 Ouvrir modal détails
function openDetailsModal(appart) {
  detailsModal.querySelector(".modal-title").textContent = appart.Nom_Appartement;
  detailsModal.querySelector(".modal-body").innerHTML = `
    <p><strong>Type :</strong> ${appart.Type}</p>
    <p><strong>Statut :</strong> ${appart.Statut}</p>
    <p><strong>Prix :</strong> ${appart.Prix || 'N/A'} FCFA</p>
    <p><strong>Description :</strong> ${appart.Description || ''}</p>
  `;

  document.getElementById("btnSupprimer").onclick = () => supprimerAppart(appart.ID_Appartement);
  document.getElementById("btnModifier").onclick = () => openEditModal(appart);
  detailsModal.style.display = "block";
}

// 📌 Ouvrir modal édition
function openEditModal(appart) {
  document.getElementById("editID").value = appart.ID_Appartement;
  document.getElementById("editNom").value = appart.Nom_Appartement;
  document.getElementById("editStatut").value = appart.Statut;
  document.getElementById("editPrix").value = appart.Prix || "";
  document.getElementById("editType").value = appart.Type || "";
  document.getElementById("editDescription").value = appart.Description || "";
  editModal.style.display = "block";
}

// 📌 Fermer un modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// 📌 Déconnexion
function handleLogout() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "index.html";
}

// 📌 Lancer l'app
init();
