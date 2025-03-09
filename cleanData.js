// cleanData.js
const fs = require('fs');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid'); // Installer avec "npm install uuid"

// Fonctions de formatage

// Met la première lettre en majuscule, le reste en minuscule
function formatName(name) {
  if (!name) return '';
  name = name.trim().toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Formate un numéro de téléphone au format xxx-xxx-xxxx
function formatPhone(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

// Formate un code postal au format X0X 0X0 (si possible)
function formatPostalCode(postal) {
  if (!postal) return '';
  postal = postal.replace(/\s/g, '').toUpperCase();
  if (postal.length === 6) {
    return `${postal.slice(0, 3)} ${postal.slice(3)}`;
  }
  return postal;
}

// Génère un ID automatiquement s'il n'existe pas
function ensureId(id) {
  return id && id.trim() !== '' ? id.trim() : uuidv4();
}

// Lecture d'un fichier Excel et conversion en JSON
function readExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
}

// Lecture d'un fichier CSV et retour d'une promesse avec les données
function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', err => reject(err));
  });
}

(async function () {
  try {
    // Lecture des fichiers sources

    // 1. Clients depuis Clients.xlsx (clients pas Firebase)
    const clientsXLSX = await readCSVFile('Clients.xlsx');

    // 2. Produits depuis Excel (ella_bache_produits_complet.xlsx)
    const ellaBacheData = readExcelFile('ella_bache_produits_complet.xlsx');

    // 3. Produits supplémentaires depuis Produits.csv
    const produitsCSV = await readCSVFile('Produits.csv');

    // 4. Services depuis Services.csv
    const servicesCSV = await readCSVFile('Services.csv');

    // Nettoyage et formatage des clients
    const cleanedClients = clientsXLSX.map(client => ({
      id: ensureId(client.id),
      nom: formatName(client.nom),
      email: client.email ? client.email.trim() : '',
      telephone: client.telephone ? formatPhone(client.telephone) : '',
      codePostal: client.codePostal ? formatPostalCode(client.codePostal) : ''
    }));

    // Nettoyage des produits provenant de l'Excel
    const cleanedProduitsExcel = ellaBacheData.map(prod => ({
      id: ensureId(prod.id),
      nom: formatName(prod.nom),
      description: prod.description ? prod.description.trim() : '',
      prix: prod.prix ? parseFloat(prod.prix) : 0
    }));

    // Nettoyage des produits provenant du CSV
    const cleanedProduitsCSV = produitsCSV.map(prod => ({
      id: ensureId(prod.id),
      nom: formatName(prod.nom),
      description: prod.description ? prod.description.trim() : '',
      prix: prod.prix ? parseFloat(prod.prix) : 0
    }));

    // Concaténation des produits (à adapter si besoin de gérer les doublons)
    const cleanedProduits = cleanedProduitsExcel.concat(cleanedProduitsCSV);

    // Nettoyage des services
    const cleanedServices = servicesCSV.map(service => ({
      id: ensureId(service.id),
      nom: formatName(service.nom),
      tarif: service.tarif ? parseFloat(service.tarif) : 0,
      couleur: service.couleur ? service.couleur.trim() : ''
    }));

    // Assemblage final des données (n'importation que des informations disponibles)
    const finalData = {
      clients: cleanedClients,
      produits: cleanedProduits,
      services: cleanedServices
    };

    // Sauvegarde du fichier JSON nettoyé
    fs.writeFileSync('dataCleaned.json', JSON.stringify(finalData, null, 2), 'utf8');
    console.log('Données nettoyées sauvegardées dans dataCleaned.json');
  } catch (err) {
    console.error('Erreur lors du nettoyage des données :', err);
  }
})();
