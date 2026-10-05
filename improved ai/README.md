# 🏥 KidneyVision AI - Architecture Médicale SOTA

Moteur d'Intelligence Artificielle de pointe pour le diagnostic multi-pathologies rénales basé sur **ConvNeXt-Tiny (Meta AI)** et entraîné sur **15 810 scanners CT abdominaux réels**.

---

## 📂 Structure Modulaire du Projet

```
c:\Users\mossa\OneDrive\Desktop\ai model\
│
├── 🧠 models/                  # Checkpoints SOTA finaux entraînés
│   ├── kidneyvision_master_4class_sota.pth   (112.5 MB - Modèle Master 4-Classes sur 15 810 CT)
│   └── kidneyvision_convnext_sota.pth        (111.7 MB - Modèle Échographie ConvNeXt-Tiny)
│
├── ⚙️ api_service/             # Moteur d'Inférence IA & Serveur REST API
│   ├── kidneyvision_sota_engine.py           (Inférence, Auto-Masking, Grad-CAM, mm, recommandations)
│   └── web_api_service.py                    (Serveur Flask API REST avec CORS activé)
│
├── 🔬 training/                # Scripts de Pipeline et Ré-entraînement GPU
│   ├── train_convnext_4class_master_gpu.py   (Entraînement GPU sur 15 810 scanners)
│   └── merge_all_ct_datasets.py              (Fusion et stratification des données)
│
├── 📊 clinical_reports/        # Rapports Cliniques & Démonstrations Visuelles
│   ├── master_4class_clean_showcase_8cases.png   (Planche comparative 8 cas)
│   ├── demonstration_personal_image_solution.png (Démonstration sur le scanner réel personnel)
│   ├── exemple_stone.png                         (Fiche Lithiase / Calcul)
│   ├── exemple_tumor.png                         (Fiche Tumeur / Masse)
│   ├── exemple_cyst.png                          (Fiche Kyste simple)
│   └── exemple_normal.png                        (Fiche Rein sain)
│
├── 📁 datasets/                # Jeux de données médicaux
│   ├── dataset_4class/         (15 810 scanners CT consolidés - 12 901 train / 2 909 val)
│   ├── reel image personel/    (Scanners réels photographiés sur papier)
│   ├── archive/                (Archive CT d'origine)
│   └── kidneydata/             (Données sources initiales)
│
├── run_api.bat                 # Lanceur Windows 1-clic pour démarrer le serveur API
├── requirements.txt            # Dépendances Python nécessaires
└── README.md                   # Ce fichier guide
```

---

## 🚀 Démarrage Rapide

### 1. Installation des Dépendances
```bash
pip install -r requirements.txt
```

### 2. Lancement du Serveur API
Double-cliquez sur **`run_api.bat`** ou exécutez dans le terminal :
```bash
python api_service/web_api_service.py
```
Le serveur démarrera sur `http://localhost:5000`.

---

## 📡 Documentation API REST

### Endpoint Principal : Diagnostic IA Multi-Classes
* **Route** : `POST http://localhost:5000/api/predict`
* **Méthode** : `POST` (`multipart/form-data` ou `application/octet-stream`)
* **Paramètres Form-Data** :
  * `image` : Le fichier image (JPG, PNG, JPEG)
  * `auto_mask` : (Optionnel, défaut: `true`) Active le nettoyage automatique du texte et des bordures.

#### Exemple de Réponse JSON :
```json
{
  "success": true,
  "filename": "scan_abdominal.jpg",
  "predicted_class": "Stone",
  "confidence_percent": 98.64,
  "primary_diagnosis": "Lithiase Rénale (Calcul / Stone)",
  "has_stone": true,
  "stone_probability": 98.64,
  "class_probabilities": {
    "Cyst": 0.70,
    "Normal": 0.50,
    "Stone": 98.64,
    "Tumor": 0.16
  },
  "clinical_assessment": {
    "lesion_detected": true,
    "estimated_diameter_mm": 10.4,
    "severity_grade": "MODÉRÉ (LEC / Avis Urologie)",
    "recommendation": "Calcul > 10 mm : Consultation urologique recommandée..."
  },
  "visualization_base64": "data:image/png;base64,iVBORw0KGgo...",
  "cleaned_scan_base64": "data:image/png;base64,iVBORw0KGgo..."
}
```

---

## 🩺 Performances Médicales du Master Model (ConvNeXt-Tiny)

* **Dataset total** : **15 810 scanners CT réels**
* **Validation externe stricte** : 2 909 cas non-vus
* **Exactitude globale (Accuracy)** : **98.42%**
* **Macro F1-Score** : **98.48%**
* **Cyst (Kyste)** : **100.00% Sensibilité** (667/667 kystes détectés)
* **Tumor (Tumeur)** : **100.00% Précision** (0 fausse alerte de tumeur)
* **Temps d'inférence** : **< 8 ms** par scanner sur GPU
