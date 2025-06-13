# Portail de Cartographie Web - Collectivités Territoriales du Maroc

Ce projet utilise Leaflet pour créer une carte interactive des collectivités territoriales du Maroc.

## Structure du projet

```
projet-maroc/
├── index.html              # Page principale
├── css/
│   └── style.css           # Styles CSS
├── js/
│   └── script.js           # Logic JavaScript
├── data/
│   ├── communes.json       # Données des communes (à ajouter)
│   ├── provinces.json      # Données des provinces (à ajouter)
│   └── regions.json        # Données des régions (à ajouter)
└── README.md              # Ce fichier
```

## Installation et utilisation

1. **Placez vos fichiers JSON** dans le dossier `data/` :
   - `communes.json`
   - `provinces.json` 
   - `regions.json`

2. **Format des données JSON** :
   Les fichiers doivent être au format GeoJSON avec cette structure :
   ```json
   {
     "type": "FeatureCollection",
     "features": [
       {
         "type": "Feature",
         "properties": {
           "NAME_1": "Nom de la région",
           "NAME_2": "Nom de la province",
           "NAME_3": "Nom de la commune",
           // autres propriétés...
         },
         "geometry": {
           "type": "Polygon",
           "coordinates": [...]
         }
       }
     ]
   }
   ```

3. **Lancez un serveur local** :
   - Avec Python : `python -m http.server 8000`
   - Avec Node.js : `npx http-server`
   - Ou utilisez un serveur web local (XAMPP, WAMP, etc.)

4. **Ouvrez dans le navigateur** : `http://localhost:8000`

## Fonctionnalités

- ✅ Carte satellite hybride (images + labels)
- ✅ Couches vectorielles colorées (Régions, Provinces, Communes)
- ✅ Outils de zoom et navigation
- ✅ Mesure de distance
- ✅ Contrôle des couches
- ✅ Recherche par attributs
- ✅ Popups informatifs au clic
- ✅ Interface responsive
- ✅ Légende et panneau d'information

## Champs de données supportés

Le script recherche automatiquement ces champs dans vos données JSON :

### Pour les noms :
- `NAME_1`, `NAME_2`, `NAME_3` (standard)
- `NOM_REG`, `NOM_PROV`, `NOM_COM`
- `NOM`, `Name`, `name`

### Autres champs :
- `CODE_REG`, `CODE_PROV`, `CODE_COM`
- `POPULATION`
- `SUPERFICIE`

## Dépannage

### Erreur "Erreur lors du chargement des données"
- Vérifiez que les fichiers JSON sont dans le dossier `data/`
- Vérifiez que les fichiers sont au format GeoJSON valide
- Assurez-vous d'utiliser un serveur web local (pas file://)

### Couches vides ou non visibles
- Vérifiez la structure de vos données GeoJSON
- Vérifiez les coordonnées (longitude, latitude)
- Ouvrez la console développeur (F12) pour voir les erreurs

### Recherche qui ne fonctionne pas
- Vérifiez les noms des champs dans vos données
- Le script cherche dans plusieurs champs automatiquement
- Utilisez la console pour déboguer : `logLayerInfo()`

## Personnalisation

### Modifier les couleurs des couches
Dans `js/script.js`, modifiez l'objet `styles` :
```javascript
const styles = {
    regions: {
        fillColor: '#ff0000',  // Rouge
        color: '#ff0000',
        // ...
    }
};
```

### Ajouter de nouveaux champs de recherche
Modifiez les tableaux `searchFields` dans la fonction `searchFeature()`.

### Modifier le centre de la carte
Dans `initMap()`, changez les coordonnées :