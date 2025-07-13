// === CONFIG & CONSTANTES ===
const API_KEY = "AIzaSyCcUePUO9Ji_4zWubaX7s4FmvE863lbmU8";
const SPREADSHEET_ID = "1kIAvS2GxZjiFWrYaFfvIAs0VwQDt_dkZiXgHHhJyS-4";
const SHEET_MAISON = "Maison";
const SHEET_CONFIG = "Config";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/drqyicfcb/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "Ashimo"; // Utilisez nom dossier comme preset si configuré
const CLOUDINARY_FOLDER = "Ashimo";

// Timer session : 5 minutes
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;

let maisons = [];
let configData = {};
let filteredMaisons = [];
let inactivityTimer = null;

// === UTILITAIRES ===

// Affiche ou masque un loader (optionnel à ajouter en HTML si besoin)
function showLoader(show) {
  // À adapter si vous ajoutez un loader visuel
  // Ex: document.getElementById('loader').style.display = show ? 'block' : 'none';
}

// Récupérer les données d'une feuille Google Sheets (sous forme tabulaire)
async function fetchSheetData(sheetName) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.values || json.values.length === 0) return [];

    const [header, ...rows] = json.values;
    return rows.map(row => {
      let obj = {};
      header.forEach((h, i) => (obj[h.trim()] = row[i] ? row[i].toString().trim() : ""));
      return obj;
    });
  } catch (err) {
    console.error("Erreur fetchSheetData:", err);
    return [];
  }
}

// Stocker config en localStorage
function saveConfigToLocalStorage(config) {
  localStorage.setItem("configData", JSON.stringify(config));
}

// Charger config depuis localStorage (null si pas dispo)
function loadConfigFromLocalStorage() {
  const json = localStorage.getItem("configData");
  return json ? JSON.parse(json) : null;
}

// Génère les options d'un select à partir d'un tableau de valeurs
function buildSelectOptions(selectElem, optionsArray) {
  selectElem.innerHTML = "";
  optionsArray.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    selectElem.appendChild(option);
  });
}

// Génération automatique ID maison : MSN-000[n]
function generateMaisonID() {
  const n = maisons.length + 1;
  return `MSN-${String(n).padStart(4, "0")}`;
}

// Affiche le nom du business depuis localStorage
function showBusinessTitle() {
  const titleElem = document.getElementById("businessTitle");
  const businessName = localStorage.getItem("businessName") || "Mon Business";
  titleElem.textContent = businessName;
}

// Filtre maisons selon statut (vide = tous)
function filterMaisonsByStatus(status) {
  if (!status) return maisons;
  return maisons.filter(m => (m.Statut || "").toLowerCase() === status.toLowerCase());
}

// Crée une carte maison
function createMaisonCard(maison) {
  const card = document.createElement("article");
  card.classList.add("maison-card");

  // Image (fallback si vide)
  const img = document.createElement("img");
  img.classList.add("maison-img");
  img.src = maison.Photo || "https://res.cloudinary.com/drqyicfcb/image/upload/v1690000000/Ashimo/default_house.jpg";
  img.alt = maison.Nom_Maison || "Maison";
  card.appendChild(img);

  // Contenu
  const content = document.createElement("div");
  content.classList.add("maison-content");

  // Titre + ID
  const h3 = document.createElement("h3");
  h3.textContent = `${maison.Nom_Maison} (${maison.ID_Maison})`;
  content.appendChild(h3);

  // Adresse + Ville
  const addr = document.createElement("p");
  addr.textContent = `${maison.Adresse}, ${maison.Ville}`;
  content.appendChild(addr);

  // Etage, Garage, Nb appart
  const infoRow1 = document.createElement("div");
  infoRow1.classList.add("info-row");
  infoRow1.textContent = `Étage : ${maison.Etage} | Garage : ${maison.Garage} | Appartements : ${maison.Nombre_Appartements || "N/A"}`;
  content.appendChild(infoRow1);

  // Statut + Revenu (lecture seule)
  const infoRow2 = document.createElement("div");
  infoRow2.classList.add("info-row");
  infoRow2.textContent = `Statut : ${maison.Statut || "N/A"} | Revenu mensuel estimé : ${maison["Revenu Mensuel estimé"] || "N/A"}`;
  content.appendChild(infoRow2);

  // Description
  if (maison.Description) {
    const desc = document.createElement("p");
    desc.textContent = maison.Description;
    content.appendChild(desc);
  }

  // Gérant
  if (maison.Gérant) {
    const gerant = document.createElement("p");
    gerant.textContent = `Gérant : ${maison.Gérant}`;
    content.appendChild(gerant);
  }

  // Actions : modifier / supprimer
  const actions = document.createElement("div");
  actions.classList.add("card-actions");

  // Modifier
  const btnEdit = document.createElement("button");
  btnEdit.classList.add("edit-btn");
  btnEdit.textContent = "Modifier";
  btnEdit.addEventListener("click", () => openEditForm(maison));
  actions.appendChild(btnEdit);

  // Supprimer
  const btnDelete = document.createElement("button");
  btnDelete.classList.add("delete-btn");
  btnDelete.textContent = "Supprimer";
  btnDelete.addEventListener("click", () => openDeleteModal(maison));
  actions.appendChild(btnDelete);

  content.appendChild(actions);
  card.appendChild(content);

  return card;
}

// Affiche la liste des maisons (filtrée)
function displayMaisons(list) {
  const container = document.getElementById("maisonsList");
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = "<p>Aucune maison trouvée.</p>";
    return;
  }
  list.forEach(m => {
    const card = createMaisonCard(m);
    container.appendChild(card);
  });
}

// Ouvre le formulaire d’ajout ou modification
function openEditForm(maison = null) {
  const formSection = document.getElementById("form-section");
  const form = document.getElementById("maisonForm");

  form.reset();

  if (maison) {
    // Modification
    form.dataset.editingId = maison.ID_Maison;
    // Remplir les champs
    form.Nom_Maison.value = maison.Nom_Maison || "";
    form.Adresse.value = maison.Adresse || "";
    form.Ville.value = maison.Ville || "";
    form.Etage.value = maison.Etage || "";
    form.Garage.value = maison.Garage || "Non";
    form.Nombre_Appartements.value = maison.Nombre_Appartements || "";
    form.Latitude.value = maison.Latitude || "";
    form.Longitude.value = maison.Longitude || "";
    form.Description.value = maison.Description || "";
    form.Gérant.value = maison.Gérant || "";
  } else {
    // Ajout : suppression flag edition
    delete form.dataset.editingId;
  }

  formSection.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Ferme le formulaire
function closeForm() {
  const formSection = document.getElementById("form-section");
  formSection.classList.add("hidden");
  const form = document.getElementById("maisonForm");
  form.reset();
  delete form.dataset.editingId;
}

// Upload image sur Cloudinary
async function uploadImageToCloudinary(file, idMaison) {
  if (!file) return null;

  // Compression & conversion vers jpg peut être ajoutée ici (si besoin)

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Ashimo");
  formData.append("folder", CLOUDINARY_FOLDER);
  formData.append("public_id", idMaison);

  try {
    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (json.secure_url) return json.secure_url;
    throw new Error("Upload failed");
  } catch (err) {
    console.error("Erreur upload Cloudinary:", err);
    return null;
  }
}

// Enregistre ou modifie la maison (simulateur)
async function saveMaison(data, isEdit = false) {
  // Ici il faudra appeler un backend ou utiliser une API Google Sheets modifiable via un service serveur
  // Pour l’instant, on simule un enregistrement local
  if (isEdit) {
    const index = maisons.findIndex(m => m.ID_Maison === data.ID_Maison);
    if (index !== -1) maisons[index] = data;
  } else {
    maisons.push(data);
  }
  // Simuler persistante
  console.log("Maison sauvegardée:", data);
  return true;
}

// Form submit handler
document.getElementById("maisonForm").addEventListener("submit", async e => {
  e.preventDefault();

  const form = e.target;
  const isEdit = !!form.dataset.editingId;

  // Données du formulaire
  let maisonData = {
    ID_Maison: isEdit ? form.dataset.editingId : generateMaisonID(),
    Nom_Maison: form.Nom_Maison.value.trim(),
    Adresse: form.Adresse.value.trim(),
    Ville: form.Ville.value.trim(),
    Etage: form.Etage.value,
    Garage: form.Garage.value,
    Nombre_Appartements: form.Nombre_Appartements.value.trim(),
    Statut: "", // Ne sera pas modifié ici
    Latitude: form.Latitude.value.trim(),
    Longitude: form.Longitude.value.trim(),
    "Revenu Mensuel estimé": "", // Non modifiable
    Description: form.Description.value.trim(),
    Gérant: form.Gérant.value.trim(),
    Photo: ""
  };

  showLoader(true);

  // Upload photo si modifiée
  const photoFile = form.Photo.files[0];
  if (photoFile) {
    const uploadedUrl = await uploadImageToCloudinary(photoFile, maisonData.ID_Maison);
    if (uploadedUrl) maisonData.Photo = uploadedUrl;
  } else if (isEdit) {
    // Garder ancienne photo si modif sans nouvelle photo
    const oldMaison = maisons.find(m => m.ID_Maison === maisonData.ID_Maison);
    maisonData.Photo = oldMaison ? oldMaison.Photo : "";
  } else {
    // Image par défaut
    maisonData.Photo = "https://res.cloudinary.com/drqyicfcb/image/upload/v1690000000/Ashimo/default_house.jpg";
  }

  // Sauvegarde
  const saved = await saveMaison(maisonData, isEdit);
  showLoader(false);

  if (saved) {
    // Refresh affichage
    maisons = await fetchSheetData(SHEET_MAISON);
    filteredMaisons = filterMaisonsByStatus(document.getElementById("statusFilter").value);
    displayMaisons(filteredMaisons);
    closeForm();
  } else {
    alert("Erreur lors de la sauvegarde.");
  }
});

// Ouvre la modale suppression
let maisonToDelete = null;
function openDeleteModal(maison) {
  maisonToDelete = maison;
  const modal = document.getElementById("deleteModal");
  modal.classList.remove("hidden");
  document.getElementById("confirmBusiness").value = "";
  document.getElementById("confirmBusiness").focus();
}

// Fermer modale suppression
document.getElementById("cancelDelete").addEventListener("click", () => {
  maisonToDelete = null;
  document.getElementById("deleteModal").classList.add("hidden");
});

// Confirmer suppression
document.getElementById("confirmDelete").addEventListener("click", async () => {
  const inputBusiness = document.getElementById("confirmBusiness").value.trim();
  const currentBusiness = localStorage.getItem("businessName") || "";

  if (inputBusiness !== currentBusiness) {
    alert("Nom du business incorrect. Suppression annulée.");
    return;
  }
  if (!maisonToDelete) return;

  showLoader(true);

  // Simuler suppression en effaçant la ligne dans Google Sheets (à implémenter côté serveur)
  // Ici on enlève de la liste locale seulement
  maisons = maisons.filter(m => m.ID_M
