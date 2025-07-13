const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRfuzAwi3TkC9YOvIb-iKsZClMUT3H8MR4sH-ERAKGxpQYWEINaR9DL6HytJQAT54BpQ/exec";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ashimo/image/upload";
const CLOUDINARY_PRESET = "ashimo_unsigned";
const DEFAULT_IMAGE = "maison-defaut.jpg";
const BUSINESS_NAME_STORAGE_KEY = "business";

// Références DOM
const maisonsList = document.getElementById("maisonsList");
const statusFilter = document.getElementById("statusFilter");
const businessTitle = document.getElementById("businessTitle");
const logoutBtn = document.getElementById("logoutBtn");
const backBtn = document.getElementById("backBtn");

const formSection = document.getElementById("form-section");
const maisonForm = document.getElementById("maisonForm");
const addMaisonBtn = document.querySelector("#addMaisonBtn button");

const deleteModal = document.getElementById("deleteModal");
const confirmBusinessInput = document.getElementById("confirmBusiness");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");

let maisonsData = [];
let maisonToDelete = null;
let currentEditId = null;

function init() {
  const businessName = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
  const token = sessionStorage.getItem("sessionToken");

  // Sécurité : redirection si session expirée
  if (!businessName || !token) {
    return (window.location.href = "index.html");
  }

  // Affichage du nom du business centré dans le header
  businessTitle.textContent = businessName;

  // Bouton retour (vers accueil ou dashboard)
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "accueil.html";
    });
  }

  // Déconnexion
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "index.html";
    });
  }

  // Filtrage des maisons selon le statut
  statusFilter.addEventListener("change", () => {
    renderMaisons(filterMaisons());
  });

  // Ajout nouvelle maison
  addMaisonBtn.addEventListener("click", () => {
    maisonForm.reset();
    currentEditId = null;
    formSection.classList.remove("hidden");
  });

  // Soumission formulaire
  maisonForm.addEventListener("submit", handleFormSubmit);

  // Suppression : confirmation ou annulation
  confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.classList.add("hidden");
    maisonToDelete = null;
  });

  // Charger les données
  loadMaisons();
}

async function loadMaisons() {
  try {
    const res = await fetch(APP_SCRIPT_URL);
    const json = await res.json();
    maisonsData = json.maisons || [];
    renderMaisons(filterMaisons());
  } catch (e) {
    alert("Erreur de chargement : " + e.message);
  }
}

function filterMaisons() {
  const f = statusFilter.value;
  return f ? maisonsData.filter(m => m.Statut === f) : maisonsData;
}

function renderMaisons(data) {
  maisonsList.innerHTML = "";

  if (data.length === 0) {
    maisonsList.innerHTML = `<p>Aucune maison à afficher.</p>`;
    return;
  }

  data.forEach(maison => {
    const card = document.createElement("div");
    card.className = "maison-card";

    const image = maison.Photo ? maison.Photo : DEFAULT_IMAGE;

    card.innerHTML = `
      <img src="${image}" class="maison-img" />
      <div class="maison-content">
        <h3>${maison.Nom_Maison}</h3>
        <p>${maison.Adresse}, ${maison.Ville}</p>
        <div class="info-row"><span>Étage:</span><span>${maison.Etage}</span></div>
        <div class="info-row"><span>Garage:</span><span>${maison.Garage}</span></div>
        <div class="info-row"><span>Appartements:</span><span>${maison.Nombre_Appartements}</span></div>
        <div class="info-row"><span>Gérant:</span><span>${maison.Gérant || ""}</span></div>
        <div class="card-actions">
          <button class="edit-btn" data-id="${maison.ID_Maison}">Modifier</button>
          <button class="delete-btn" data-id="${maison.ID_Maison}">Supprimer</button>
        </div>
      </div>
    `;

    // Bouton supprimer
    card.querySelector(".delete-btn").addEventListener("click", () => {
      maisonToDelete = maison;
      deleteModal.classList.remove("hidden");
    });

    // Bouton modifier
    card.querySelector(".edit-btn").addEventListener("click", () => {
      currentEditId = maison.ID_Maison;
      populateForm(maison);
      formSection.classList.remove("hidden");
    });

    maisonsList.appendChild(card);
  });
}

function populateForm(maison) {
  for (const field of maisonForm.elements) {
    if (field.name && maison[field.name] !== undefined && field.type !== "file") {
      field.value = maison[field.name];
    }
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(maisonForm);
  const payload = {};

  for (const [key, value] of formData.entries()) {
    if (key !== "Photo") payload[key] = value;
  }

  const businessName = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
  if (!businessName) return alert("Session expirée");

  payload.businessName = businessName;
  payload.mode = currentEditId ? "edit" : "add";
  if (currentEditId) payload.ID_Maison = currentEditId;

  const imageFile = formData.get("Photo");
  if (imageFile && imageFile.name) {
    try {
      const imageUrl = await uploadToCloudinary(imageFile);
      payload.Photo = imageUrl;
    } catch (err) {
      alert("Échec de l'upload image : " + err.message);
      return;
    }
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
      formSection.classList.add("hidden");
      currentEditId = null;
      loadMaisons();
    } else {
      alert("Erreur : " + result.message);
    }
  } catch (e) {
    alert("Erreur réseau : " + e.message);
  }
}

async function handleConfirmDelete() {
  const nom = confirmBusinessInput.value.trim();
  const expected = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
  if (!maisonToDelete || nom !== expected) return alert("Nom incorrect");

  try {
    const res = await fetch(APP_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID_Maison: maisonToDelete.ID_Maison,
        businessName: expected,
      }),
    });

    const result = await res.json();
    if (result.status === "success") {
      alert("Maison supprimée.");
      deleteModal.classList.add("hidden");
      maisonToDelete = null;
      loadMaisons();
    } else {
      alert("Erreur : " + result.message);
    }
  } catch (e) {
    alert("Erreur réseau : " + e.message);
  }
}

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
  throw new Error("Erreur upload");
}

// Lancement
init();
