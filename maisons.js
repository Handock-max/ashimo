// Constantes et variables globales
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8vCDd3k1XdYuojuLh5HGprdJ5LsbWxfmyTxvXyyFewwW4lBAJ1HPhvNAY9N78_f7DFg/exec";
const BUSINESS_NAME_STORAGE_KEY = "businessName";

// Éléments DOM
const businessTitle = document.getElementById("businessTitle");
const logoutBtn = document.getElementById("logoutBtn");
const statusFilter = document.getElementById("statusFilter");
const maisonsList = document.getElementById("maisonsList");
const addMaisonBtn = document.querySelector("#addMaisonBtn button");
const formSection = document.getElementById("form-section");
const maisonForm = document.getElementById("maisonForm");
const deleteModal = document.getElementById("deleteModal");
const confirmBusinessInput = document.getElementById("confirmBusiness");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");

let maisonsData = []; // données maisons chargées
let maisonToDelete = null; // maison sélectionnée pour suppression

// --- Gestion session ---
function getBusinessName() {
  return localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
}

function setBusinessName(name) {
  localStorage.setItem(BUSINESS_NAME_STORAGE_KEY, name);
}

function clearSession() {
  localStorage.removeItem(BUSINESS_NAME_STORAGE_KEY);
}

// --- Initialisation de la page ---
function init() {
  // Vérifier présence businessName sinon rediriger vers login (à adapter)
  const businessName = getBusinessName();
  if (!businessName) {
    alert("Session expirée ou non trouvée. Veuillez vous reconnecter.");
    window.location.href = "index.html"; // ou ta page login
    return;
  }
  businessTitle.textContent = businessName;

  // Charger les données depuis Apps Script
  loadMaisons();

  // Évènements
  logoutBtn.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });

  statusFilter.addEventListener("change", () => {
    renderMaisons(filterMaisons());
  });

  addMaisonBtn.addEventListener("click", () => {
    openForm();
  });

  maisonForm.addEventListener("submit", handleFormSubmit);

  confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
}

// --- Chargement des maisons via GET ---
async function loadMaisons() {
  try {
    const response = await fetch(APP_SCRIPT_URL);
    if (!response.ok) throw new Error("Erreur réseau lors du chargement");
    const result = await response.json();
    if (result.status !== "ok") throw new Error("Erreur API: " + result.message);

    // Supposons que ton API GET renvoie un tableau 'maisons' en plus de status/message
    // Exemple attendu: { status:"ok", message:"API en ligne", maisons: [ {...}, {...} ] }
    if (!result.maisons || !Array.isArray(result.maisons)) {
      throw new Error("Format de données inattendu");
    }

    maisonsData = result.maisons;
    renderMaisons(maisonsData);
  } catch (err) {
    console.error(err);
    alert("Impossible de charger les maisons : " + err.message);
  }
}

// --- Filtrage par statut ---
function filterMaisons() {
  const filterValue = statusFilter.value;
  if (!filterValue) return maisonsData;
  return maisonsData.filter(m => m.Statut === filterValue);
}

// --- Affichage des maisons ---
function renderMaisons(data) {
  maisonsList.innerHTML = "";
  if (data.length === 0) {
    maisonsList.innerHTML = `<p>Aucune maison trouvée pour ce filtre.</p>`;
    return;
  }
  data.forEach(maison => {
    const card = createMaisonCard(maison);
    maisonsList.appendChild(card);
  });
}

// --- Création carte maison ---
function createMaisonCard(maison) {
  const card = document.createElement("div");
  card.className = "maison-card";

  const photoUrl = maison.Photo || "default-house.jpg"; // image par défaut si aucune photo

  card.innerHTML = `
    <img src="${photoUrl}" alt="Photo ${maison.Nom_Maison}" class="maison-img" />
    <div class="maison-content">
      <h3>${escapeHtml(maison.Nom_Maison)}</h3>
      <p>${escapeHtml(maison.Adresse)}, ${escapeHtml(maison.Ville)}</p>
      <div class="info-row"><span>Étage :</span><span>${escapeHtml(maison.Etage)}</span></div>
      <div class="info-row"><span>Garage :</span><span>${escapeHtml(maison.Garage)}</span></div>
      <div class="info-row"><span>Appartements :</span><span>${escapeHtml(maison.Nombre_Appartements)}</span></div>
      <div class="info-row"><span>Gérant :</span><span>${escapeHtml(maison.Gérant)}</span></div>
      <p>${escapeHtml(maison.Description)}</p>
      <div class="card-actions">
        <button class="edit-btn" data-id="${maison.ID_Maison}">Modifier</button>
        <button class="delete-btn" data-id="${maison.ID_Maison}">Supprimer</button>
      </div>
    </div>
  `;

  // Évènements bouton supprimer
  card.querySelector(".delete-btn").addEventListener("click", () => {
    openDeleteModal(maison);
  });

  // TODO: ajout modification (edit) plus tard si tu veux
  card.querySelector(".edit-btn").addEventListener("click", () => {
    alert("Fonction modification non encore implémentée");
  });

  return card;
}

// --- Échappement HTML basique pour éviter injection ---
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Gestion formulaire ---

function openForm() {
  formSection.classList.remove("hidden");
  maisonForm.reset();
  maisonForm.querySelector("h2").textContent = "Ajouter une maison";
}

function closeForm() {
  formSection.classList.add("hidden");
}

function handleFormSubmit(event) {
  event.preventDefault();
  alert("Ajout / modification non encore implémenté");
  closeForm();
}

// --- Gestion suppression ---

function openDeleteModal(maison) {
  maisonToDelete = maison;
  confirmBusinessInput.value = "";
  deleteModal.classList.remove("hidden");
  confirmBusinessInput.focus();
}

function closeDeleteModal() {
  deleteModal.classList.add("hidden");
  maisonToDelete = null;
}

async function handleConfirmDelete() {
  const inputName = confirmBusinessInput.value.trim();
  if (!maisonToDelete) return alert("Aucune maison sélectionnée");
  if (inputName !== getBusinessName()) {
    alert("Le nom du business est incorrect");
    return;
  }

  // Appel API suppression via POST
  try {
    const response = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID_Maison: maisonToDelete.ID_Maison,
        businessName: inputName,
      }),
    });
    const result = await response.json();
    if (result.status === "success") {
      alert("Maison supprimée avec succès !");
      closeDeleteModal();
      // Recharge les données
      loadMaisons();
    } else {
      alert("Erreur lors de la suppression : " + (result.message || "Inconnue"));
    }
  } catch (err) {
    alert("Erreur réseau lors de la suppression : " + err.message);
  }
}

// --- Lancement ---
init();
