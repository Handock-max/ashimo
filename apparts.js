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

// 📌 Initialisation
function init() {
  // Vérification des données dans sessionStorage
  const businessName = localStorage.getItem("business");
  const token = sessionStorage.getItem("sessionToken");
  const maisonID = sessionStorage.getItem("currentMaisonId");
  const maisonName = sessionStorage.getItem("currentMaisonName");

  if (!businessName || !token || !maisonID || !maisonName) {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "index.html"; // Redirection vers la page de connexion
    return;
  }

  // Affichage du nom de la maison dans l'en-tête
  document.getElementById("Maison-name").textContent = maisonName;

  // Configuration des écouteurs d'événements
  logoutBtn.addEventListener("click", handleLogout);
  backBtn.addEventListener("click", () => window.location.href = "maisons.html");
  appartStatusFilter.addEventListener("change", handleFilterChange);
  addAppartButton.addEventListener("click", openAddModal);
  closeDetailsModal.addEventListener("click", () => closeModal("detailsModal"));
  closeEditModal.addEventListener("click", () => closeModal("editModal"));
  btnEnregistrer.addEventListener("click", saveModifications);
  btnFermer.addEventListener("click", () => closeModal("detailsModal"));
  prevPageBtn.addEventListener("click", handlePrevPage);
  nextPageBtn.addEventListener("click", handleNextPage);

  // Chargement initial des appartements
  loadAppartements();
}

// 📌 Chargement des appartements liés à une maison
async function loadAppartements() {
  try {
    const maisonID = sessionStorage.getItem("currentMaisonId");

    // Vérifier si AppartArray existe dans le localStorage
    const storedApparts = localStorage.getItem("AppartArray");
    if (storedApparts) {
      const appartsArray = JSON.parse(storedApparts);
      // Filtrer les appartements par ID_Maison
      appartsData = appartsArray.filter(app => app.ID_Maison === maisonID);
      currentPage = 1;
      applyFilterAndRender();
      return;
    }

    // Si AppartArray n'existe pas, effectuer le fetch
    const res = await fetch(`${LOAD_APPARTS_URL}?ID_Maison=${maisonID}`);
    const json = await res.json();

    // Stocker les données dans appartsData et localStorage
    appartsData = Array.isArray(json) ? json : [];
    localStorage.setItem("AppartArray", JSON.stringify(appartsData));
    currentPage = 1;
    applyFilterAndRender();
  } catch (e) {
    alert("Erreur de chargement des appartements : " + e.message);
  }
}

// 📌 Appliquer le filtre et rendre les appartements
function applyFilterAndRender() {
  filteredApparts = currentFilter
    ? appartsData.filter(app => app.Statut === currentFilter)
    : [...appartsData];
  renderApparts();
}

// 📌 Rendu visuel des cartes appartements
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
        <p><strong>Prix:</strong> ${appart.Prix || 'N/A'} FCFA</p>
      </div>
      <div class="status-banner ${appart.Statut === 'Occupé' ? 'status-occupé' : ''}">
        ${appart.Statut}
      </div>
    `;

    card.addEventListener("click", () => openDetailsModal(appart));
    appartGrid.appendChild(card);
  });

  // Mise à jour de la pagination
  pageIndicator.textContent = `Page ${currentPage} / ${maxPage}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= maxPage;
}

// 📌 Gestion des événements de pagination
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

// 📌 Gestion du filtre
function handleFilterChange() {
  currentFilter = appartStatusFilter.value;
  currentPage = 1;
  applyFilterAndRender();
}

// 📌 Supprimer un appartement
async function supprimerAppart(idAppart) {
  try {
    const res = await fetch(DELETE_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ID_Appartement: idAppart }),
    });

    if (res.ok) {
      // Supprimer AppartArray du localStorage
      localStorage.removeItem("AppartArray");
      alert("Appartement supprimé avec succès.");
      init(); // Réinitialiser l'application
    } else {
      alert("Erreur lors de la suppression de l'appartement.");
    }
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}

// 📌 Ajouter un appartement
async function ajouterAppart(data) {
  try {
    const res = await fetch(ADD_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      // Supprimer AppartArray du localStorage
      localStorage.removeItem("AppartArray");
      alert("Appartement ajouté avec succès.");
      init(); // Réinitialiser l'application
    } else {
      alert("Erreur lors de l'ajout de l'appartement.");
    }
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}

// 📌 Modifier un appartement
async function modifierAppart(data) {
  try {
    const res = await fetch(UPDATE_APPART_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      // Supprimer AppartArray du localStorage
      localStorage.removeItem("AppartArray");
      alert("Appartement modifié avec succès.");
      init(); // Réinitialiser l'application
    } else {
      alert("Erreur lors de la modification de l'appartement.");
    }
  } catch (e) {
    alert("Erreur : " + e.message);
  }
}

// 📌 Ouvrir la modale d'ajout
function openAddModal() {
  const modal = document.getElementById("editModal");
  document.getElementById("editForm").reset();
  modal.style.display = "block";
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

// 📌 Déconnexion
function handleLogout() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "index.html";
}

// 📌 Lancer l'initialisation
init();