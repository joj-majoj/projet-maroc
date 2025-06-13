// Variables globales
let map;
let regionsLayer, provincesLayer, communesLayer;
let regionsData, provincesData, communesData;
let currentHighlight = null;

// Styles pour les différentes couches
const styles = {
    regions: {
        fillColor: '#ff0000',
        weight: 2,
        opacity: 1,
        color: '#ff0000',
        fillOpacity: 0.3
    },
    provinces: {
        fillColor: '#00ff00',
        weight: 2,
        opacity: 1,
        color: '#00ff00',
        fillOpacity: 0.3
    },
    communes: {
        fillColor: '#0000ff',
        weight: 1,
        opacity: 1,
        color: '#0000ff',
        fillOpacity: 0.3
    }
};

// Initialisation de la carte
function initMap() {
    // Créer la carte centrée sur le Maroc
    map = L.map('map').setView([31.7917, -7.0926], 6);

    // Couche satellite hybride
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18
    });

    // Couche des labels (noms des villes, routes)
    const labelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Labels &copy; Esri',
        maxZoom: 18
    });

    // Ajouter les couches de base
    satelliteLayer.addTo(map);
    labelsLayer.addTo(map);

    // Ajouter le contrôle de mesure
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false,
            polyline: {
                shapeOptions: {
                    color: '#f357a1',
                    weight: 3
                }
            }
        },
        edit: false
    });
    map.addControl(drawControl);

    // Gérer les événements de dessin pour la mesure
    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        map.addLayer(layer);
        
        if (event.layerType === 'polyline') {
            const latlngs = layer.getLatLngs();
            let distance = 0;
            for (let i = 0; i < latlngs.length - 1; i++) {
                distance += latlngs[i].distanceTo(latlngs[i + 1]);
            }
            
            const distanceText = distance > 1000 ? 
                (distance / 1000).toFixed(2) + ' km' : 
                Math.round(distance) + ' m';
            
            layer.bindPopup('Distance: ' + distanceText).openPopup();
        }
    });

    // Ajouter le contrôle d'échelle
    L.control.scale().addTo(map);

    // Charger les données
    loadData();
}

// Fonction pour charger les données JSON
async function loadData() {
    try {
        showLoading();
        
        // Charger les trois fichiers JSON
        const [regionsResponse, provincesResponse, communesResponse] = await Promise.all([
            fetch('data/regions.json'),
            fetch('data/provinces.json'),
            fetch('data/communes.json')
        ]);

        // Vérifier si tous les fichiers ont été chargés avec succès
        if (!regionsResponse.ok) throw new Error('Erreur lors du chargement de regions.json');
        if (!provincesResponse.ok) throw new Error('Erreur lors du chargement de provinces.json');
        if (!communesResponse.ok) throw new Error('Erreur lors du chargement de communes.json');

        // Parser les données JSON
        regionsData = await regionsResponse.json();
        provincesData = await provincesResponse.json();
        communesData = await communesResponse.json();

        // Créer les couches
        createLayers();
        
        // Masquer l'écran de chargement
        hideLoading();
        
        console.log('Données chargées avec succès !');
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        hideLoading();
        alert('Erreur lors du chargement des données. Vérifiez que les fichiers JSON sont présents dans le dossier data/');
    }
}

// Fonction pour créer les couches
function createLayers() {
    // Créer la couche des régions
    regionsLayer = L.geoJSON(regionsData, {
        style: styles.regions,
        onEachFeature: onEachFeature
    }).addTo(map);

    // Créer la couche des provinces
    provincesLayer = L.geoJSON(provincesData, {
        style: styles.provinces,
        onEachFeature: onEachFeature
    }).addTo(map);

    // Créer la couche des communes
    communesLayer = L.geoJSON(communesData, {
        style: styles.communes,
        onEachFeature: onEachFeature
    }).addTo(map);

    // Créer le contrôle des couches
    const baseMaps = {
        "Satellite": map._layers[Object.keys(map._layers)[0]] // Première couche ajoutée
    };

    const overlayMaps = {
        "Régions": regionsLayer,
        "Provinces": provincesLayer,
        "Communes": communesLayer
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Ajuster la vue sur toutes les données
    const group = new L.featureGroup([regionsLayer, provincesLayer, communesLayer]);
    map.fitBounds(group.getBounds());
}

// Fonction pour créer les popups
function createPopup(feature, layer) {
    const props = feature.properties;
    let popupContent = '<div class="popup-title">';
    
    // Déterminer le type d'entité et son nom
    if (props.NAME_1 && !props.NAME_2 && !props.NAME_3) {
        popupContent += 'Région: ' + props.NAME_1;
    } else if (props.NAME_2 && !props.NAME_3) {
        popupContent += 'Province: ' + props.NAME_2;
    } else if (props.NAME_3) {
        popupContent += 'Commune: ' + props.NAME_3;
    } else {
        // Essayer d'autres champs de nom possibles
        const nameFields = ['NOM', 'Name', 'name', 'NOM_REG', 'NOM_PROV', 'NOM_COM'];
        let entityName = 'Collectivité Territoriale';
        
        for (let field of nameFields) {
            if (props[field]) {
                entityName = props[field];
                break;
            }
        }
        popupContent += entityName;
    }
    
    popupContent += '</div>';
    
    // Ajouter toutes les propriétés disponibles
    for (let key in props) {
        if (props[key] && typeof props[key] !== 'object') {
            const displayKey = formatFieldName(key);
            popupContent += '<div class="popup-info"><strong>' + displayKey + ':</strong> <span>' + props[key] + '</span></div>';
        }
    }
    
    layer.bindPopup(popupContent);
}

// Fonction pour formater les noms des champs
function formatFieldName(fieldName) {
    const fieldMappings = {
        'NAME_1': 'Région',
        'NAME_2': 'Province',
        'NAME_3': 'Commune',
        'NOM_REG': 'Région',
        'NOM_PROV': 'Province',
        'NOM_COM': 'Commune',
        'CODE_REG': 'Code Région',
        'CODE_PROV': 'Code Province',
        'CODE_COM': 'Code Commune',
        'POPULATION': 'Population',
        'SUPERFICIE': 'Superficie (km²)'
    };
    
    return fieldMappings[fieldName] || fieldName;
}

// Fonction pour gérer les interactions avec les features
function onEachFeature(feature, layer) {
    createPopup(feature, layer);
    
    layer.on({
        mouseover: function(e) {
            const layer = e.target;
            layer.setStyle({
                weight: 3,
                color: '#666',
                fillOpacity: 0.7
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
        },
        mouseout: function(e) {
            resetLayerStyle(e.target);
        },
        click: function(e) {
            map.fitBounds(e.target.getBounds());
            e.target.openPopup();
        }
    });
}

// Fonction pour réinitialiser le style d'une couche
function resetLayerStyle(layer) {
    if (regionsLayer && regionsLayer.hasLayer(layer)) {
        regionsLayer.resetStyle(layer);
    } else if (provincesLayer && provincesLayer.hasLayer(layer)) {
        provincesLayer.resetStyle(layer);
    } else if (communesLayer && communesLayer.hasLayer(layer)) {
        communesLayer.resetStyle(layer);
    }
}

// Fonction de recherche
function searchFeature() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const layerType = document.getElementById('searchLayer').value;
    
    if (!searchTerm) {
        alert('Veuillez entrer un terme de recherche');
        return;
    }
    
    let targetLayer;
    let searchFields = [];
    
    switch(layerType) {
        case 'regions':
            targetLayer = regionsLayer;
            searchFields = ['NAME_1', 'NOM_REG', 'NOM', 'Name', 'name'];
            break;
        case 'provinces':
            targetLayer = provincesLayer;
            searchFields = ['NAME_2', 'NOM_PROV', 'NOM', 'Name', 'name'];
            break;
        case 'communes':
            targetLayer = communesLayer;
            searchFields = ['NAME_3', 'NOM_COM', 'NOM', 'Name', 'name'];
            break;
    }
    
    if (!targetLayer) {
        alert('Couche non disponible');
        return;
    }
    
    let found = false;
    let results = [];
    
    targetLayer.eachLayer(function(layer) {
        const props = layer.feature.properties;
        
        // Chercher dans tous les champs possibles
        for (let field of searchFields) {
            if (props[field] && props[field].toString().toLowerCase().includes(searchTerm)) {
                results.push({
                    layer: layer,
                    name: props[field],
                    field: field
                });
                break;
            }
        }
    });
    
    if (results.length > 0) {
        // Si plusieurs résultats, prendre le premier
        const result = results[0];
        map.fitBounds(result.layer.getBounds());
        result.layer.openPopup();
        
        // Surligner temporairement
        result.layer.setStyle({
            weight: 4,
            color: '#ff0000',
            fillOpacity: 0.8
        });
        
        setTimeout(() => {
            resetLayerStyle(result.layer);
        }, 3000);
        
        if (results.length > 1) {
            console.log(`${results.length} résultats trouvés pour "${searchTerm}"`);
        }
        
    } else {
        alert(`Aucun résultat trouvé pour: "${searchTerm}"`);
    }
}

// Fonction pour afficher l'écran de chargement
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

// Fonction pour masquer l'écran de chargement
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Permettre la recherche avec la touche Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchFeature();
            }
        });
    }
});

// Initialiser la carte quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});

// Fonctions utilitaires pour le débogage
function logLayerInfo() {
    console.log('Informations sur les couches:');
    if (regionsLayer) console.log('Régions:', regionsLayer.getLayers().length, 'features');
    if (provincesLayer) console.log('Provinces:', provincesLayer.getLayers().length, 'features');
    if (communesLayer) console.log('Communes:', communesLayer.getLayers().length, 'features');
}