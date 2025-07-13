const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx0jRWG5PSz0qAyNpI6iMsvPg5XnDFIOEjR1RuIOSOUby_5NVz4dzJwJpZ6u2iVPbxxTA/exec";
const BUSINESS_NAME_STORAGE_KEY = "business";
const DEFAULT_IMAGE = "maison-defaut.jpg";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/drqyicfcb/image/upload"; // cloud_name = drqyicfcb
const CLOUDINARY_PRESET = "ashimo_unsigned";

const maisonsList = document.getElementById("maisonsList");
const statusFilter = document.getElementById("statusFilter");
const businessTitle = document.getElementById("businessTitle");
const logoutBtn = document.getElementById("logoutBtn");
const backBtn = document.getElementById("backBtn");

const addMaisonBtn = document.querySelector("#addMaisonBtn button");

const formModal = document.getElementById("formModal");
const maisonForm = document.getElementById("maisonForm");
const formCloseBtn = document.getElementById("formCloseBtn");

const deleteModal = document.getElementById("deleteModal");
const confirmBusinessInput = document.getElementById("confirmBusiness");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");

const etageSelect = document.getElementById("etageSelect");

// Pagination
const pagination = document.getElementById("pagination");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const ITEMS_PER_PAGE = 9;
let currentPage = 1;

let maisonsData = [];
let filteredMaisons = [];
let maisonToDelete = null;
let currentEditId = null;

// --- Initialization ---
function init() {
  const businessName = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
  const token = sessionStorage.getItem("sessionToken");

  if (!businessName || !token) {
    window.location.href = "index.html";
    return;
  }

  businessTitle.textContent = businessName;

  // Remplir options étage (exemple, adapte selon ta config)
  const etages = ["Rez-de-chaussée", "1", "2", "3", "4", "5"];
  etageSelect.innerHTML = '<option value="" disabled selected>Étage *</option>';
  etages.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e;
    etageSelect.appendChild(opt);
  });

  // Event listeners
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "index.html";
  });

  backBtn.addEventListener("click", () => {
    window.history.back();
  });

  statusFilter.addEventListener("change", () => {
    currentPage = 1;
    filteredMaisons = filterMaisons();
    renderMaisons();
  });

  addMaisonBtn.addEventListener("click", () => {
    currentEditId = null;
    maisonForm.reset();
    showFormModal("Ajouter une maison");
  });

  formCloseBtn.addEventListener("click", () => {
    hideFormModal();
  });

  maisonForm.addEventListener("submit", handleFormSubmit);

// Écouteur pour le bouton Annuler du formulaire modal
const cancelBtn = document.getElementById("cancelBtn");
cancelBtn.addEventListener("click", () => {
  maisonForm.reset(); // Réinitialiser les champs
  formSection.classList.add("hidden"); // Masquer le formulaire modal
  currentEditId = null; // Réinitialiser le mode édition
});

// Gestion du modal de suppression
confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
  maisonToDelete = null;
  confirmBusinessInput.value = "";
});

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderMaisons();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    const maxPage = Math.ceil(filteredMaisons.length / ITEMS_PER_PAGE);
    if (currentPage < maxPage) {
      currentPage++;
      renderMaisons();
    }
  });

  // Initial load
  loadMaisons();
}

// --- Chargement des maisons ---
async function loadMaisons() {
  try {
    const res = await fetch(APP_SCRIPT_URL);
    const json = await res.json();

    if (json.status !== "ok") {
      alert("Erreur serveur : " + (json.message || "Erreur inconnue"));
      return;
    }

    maisonsData = json.maisons || [];
    currentPage = 1;
    filteredMaisons = filterMaisons();
    renderMaisons();
  } catch (e) {
    alert("Erreur réseau : " + e.message);
  }
}

// --- Filtrer maisons selon statut ---
function filterMaisons() {
  const filterValue = statusFilter.value;
  if (!filterValue) return maisonsData;
  return maisonsData.filter(m => m.Statut === filterValue);
}

// --- Afficher maisons (pagination incluse) ---
function renderMaisons() {
  maisonsList.innerHTML = "";
  if (!filteredMaisons.length) {
    maisonsList.innerHTML = "<p>Aucune maison à afficher.</p>";
    pagination.classList.add("hidden");
    return;
  }

  pagination.classList.remove("hidden");

  const maxPage = Math.ceil(filteredMaisons.length / ITEMS_PER_PAGE);
  if (currentPage > maxPage) currentPage = maxPage;

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageMaisons = filteredMaisons.slice(startIdx, endIdx);

  pageMaisons.forEach(maison => {
    const card = document.createElement("div");
    card.className = "maison-card";

    const imageSrc = maison.Photo ? maison.Photo : DEFAULT_IMAGE;

    card.innerHTML = `
      <img src="${imageSrc}" alt="Photo de la maison ${maison.Nom_Maison}" class="maison-img" />
      <div class="maison-content">
        <h3>${maison.Nom_Maison}</h3>
        <p>${maison.Adresse}, ${maison.Ville}</p>
        <div class="info-row"><span>Étage:</span><span>${maison.Etage || "-"}</span></div>
        <div class="info-row"><span>Garage:</span><span>${maison.Garage || "-"}</span></div>
        <div class="info-row"><span>Appartements:</span><span>${maison.Nombre_Appartements || "-"}</span></div>
        <div class="info-row"><span>Gérant:</span><span>${maison.Gérant || "-"}</span></div>
        <div class="card-actions">
          <button class="edit-btn" data-id="${maison.ID_Maison}">Modifier</button>
          <button class="delete-btn" data-id="${maison.ID_Maison}">Supprimer</button>
        </div>
      </div>
    `;

    // Événements boutons
    card.querySelector(".edit-btn").addEventListener("click", () => {
      currentEditId = maison.ID_Maison;
      populateForm(maison);
      showFormModal("Modifier une maison");
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      maisonToDelete = maison;
      confirmBusinessInput.value = "";
      deleteModal.classList.remove("hidden");
      confirmBusinessInput.focus();
    });

    maisonsList.appendChild(card);
  });

  // Mise à jour pagination
  pageIndicator.textContent = `Page ${currentPage} / ${maxPage}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= maxPage;
}

// --- Remplir formulaire avec données maison ---
function populateForm(maison) {
  maisonForm.reset();
  for (const field of maisonForm.elements) {
    if (field.name && maison[field.name] !== undefined && field.type !== "file") {
      field.value = maison[field.name];
    }
  }
}

// --- Afficher / cacher modal formulaire ---
function showFormModal(title) {
  document.getElementById("formTitle").textContent = title;
  formModal.classList.remove("hidden");
}

function hideFormModal() {
  formModal.classList.add("hidden");
  currentEditId = null;
}

// --- Gestion formulaire Ajout / Modification ---
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(maisonForm);
  const payload = {};

  // Récupère toutes les valeurs sauf la photo (upload spécial)
  for (const [key, value] of formData.entries()) {
    if (key !== "Photo") {
      payload[key] = value.trim();
    }
  }

  const businessName = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
  if (!businessName) {
    alert("Session expirée, veuillez vous reconnecter.");
    window.location.href = "index.html";
    return;
  }

  payload.businessName = businessName;
  payload.mode = currentEditId ? "edit" : "add";

  if (currentEditId) payload.ID_Maison = currentEditId;

  const imageFile = formData.get("Photo");
  if (imageFile && imageFile.name) {
    try {
      const imageUrl = await uploadToCloudinary(imageFile);
      payload.Photo = imageUrl;
    } catch (err) {
      alert("Échec de l'upload de l'image : " + err.message);
      return;
    }
  } else if (currentEditId) {
    // Ne pas modifier la photo si aucune nouvelle fournie en modification
  } else {
    payload.Photo = ""; // Optionnel, ou mettre image par défaut côté front
  }

  try {
    const res = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (result.status === "success") {
      alert("Maison enregistrée avec succès");
      maisonForm.reset();
      hideFormModal();
      loadMaisons();
    } else {
      alert("Erreur : " + (result.message || "Erreur inconnue"));
    }
  } catch (e) {
    alert("Erreur réseau : " + e.message);
  }
}

// --- Confirmation suppression ---
async function handleConfirmDelete() {
  const nomSaisi = confirmBusinessInput.value.trim();
  const nomAttendu = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);

  if (!maisonToDelete) {
    alert("Aucune maison sélectionnée");
    return;
  }

  if (nomSaisi !== nomAttendu) {
    alert("Nom du business incorrect");
    confirmBusinessInput.focus();
    return;
  }

  try {
    const res = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID_Maison: maisonToDelete.ID_Maison,
        businessName: nomAttendu,
        mode: "delete",
      }),
    });

    const result = await res.json();

    if (result.status === "success") {
      alert("Maison supprimée avec succès");
      deleteModal.classList.add("hidden");
      maisonToDelete = null;
      confirmBusinessInput.value = "";
      loadMaisons();
    } else {
      alert("Erreur : " + (result.message || "Erreur inconnue"));
    }
  } catch (e) {
    alert("Erreur réseau : " + e.message);
  }
}

// --- Upload image sur Cloudinary ---
async function uploadToCloudinary(file) {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: data,
  });
  const json = await res.json();
  if (json.secure_url) return json.secure_url;
  throw new Error("Erreur lors de l'upload de l'image");
}

// --- Démarrage ---
init();
