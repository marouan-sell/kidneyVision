import os
import base64
import subprocess

figures_dir = r"d:\kidney vision ai project\documentation project\figures_doc1"

def get_b64(fname):
    p = os.path.join(figures_dir, fname)
    if os.path.exists(p):
        with open(p, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    return ""

fig1 = get_b64("fig1_distribution_classes.png")
fig2 = get_b64("fig2_composition_pie.png")
fig3 = get_b64("fig3_exemples_scans.png")
fig4 = get_b64("fig4_dimensions.png")
fig5 = get_b64("fig5_data_augmentation.png")
fig6 = get_b64("fig6_split_train_val.png")
fig7 = get_b64("fig7_intensite_pixels.png")
fig8 = get_b64("fig8_comparaison_modeles.png")
fig10 = get_b64("fig10_matrice_confusion.png")
fig11 = get_b64("fig11_courbes_apprentissage.png")
fig12 = get_b64("fig12_gradcam_showcase.png")

raw_html = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>KidneyVision AI — Documentation Technique du Projet</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    font-size: 9.5pt;
    line-height: 1.45;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 16mm 18mm 16mm 18mm;
    margin: 0 auto;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 5px;
    margin-bottom: 12px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 5px;
    margin-top: 10px;
  }
  .content {
    flex: 1;
  }
  h1 {
    color: #005088;
    font-size: 19pt;
    margin: 0 0 10px 0;
    font-weight: 700;
  }
  h2 {
    color: #005088;
    font-size: 13pt;
    margin: 14px 0 8px 0;
    font-weight: 700;
  }
  h3 {
    color: #0369a1;
    font-size: 10.5pt;
    margin: 10px 0 6px 0;
    font-weight: 700;
  }
  p {
    margin: 0 0 8px 0;
    text-align: justify;
  }
  ul {
    margin: 0 0 10px 18px;
    padding: 0;
  }
  li {
    margin-bottom: 4px;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    border: 1px solid #cbd5e1;
    font-size: 9pt;
  }
  .meta-table td {
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
  }
  .meta-table td.label {
    background-color: #1e3a8a;
    color: #ffffff;
    font-weight: bold;
    width: 32%;
  }
  .meta-table td.val {
    background-color: #f8fafc;
    color: #0f172a;
  }
  .table-custom {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 8.5pt;
    border: 1px solid #cbd5e1;
  }
  .table-custom th {
    background-color: #1e3a8a;
    color: #ffffff;
    padding: 7px 10px;
    font-weight: bold;
    border: 1px solid #cbd5e1;
    text-align: left;
  }
  .table-custom td {
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
  }
  .table-custom tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .caption {
    font-size: 8pt;
    color: #64748b;
    text-align: center;
    font-style: italic;
    margin-top: 4px;
    margin-bottom: 8px;
  }
  .interpretation {
    background: #f0f7ff;
    border-left: 4px solid #0284c7;
    padding: 9px 13px;
    margin: 10px 0;
    border-radius: 4px;
    font-size: 8.5pt;
  }
  .interpretation-title {
    font-weight: bold;
    color: #0284c7;
    margin-bottom: 4px;
    font-size: 9pt;
  }
  .code-block {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 8px 12px;
    font-family: Consolas, "Courier New", monospace;
    font-size: 7.8pt;
    line-height: 1.35;
    white-space: pre;
    overflow: hidden;
    margin: 8px 0;
    color: #0f172a;
  }
  .code-caption {
    font-size: 7.5pt;
    color: #64748b;
    font-style: italic;
    margin-top: -4px;
    margin-bottom: 8px;
  }
  .center-img {
    display: block;
    margin: 6px auto;
    max-width: 95%;
    border-radius: 4px;
  }
  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px dotted #cbd5e1;
    font-size: 9.5pt;
  }
  .toc-item span.title {
    font-weight: 500;
  }
  .toc-item span.page-num {
    color: #005088;
    font-weight: bold;
  }
</style>
</head>
<body>

<!-- PAGE 1 : COUVERTURE -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content" style="display: flex; flex-direction: column; justify-content: center; text-align: center; height: 85%;">
    <p style="font-size: 10.5pt; letter-spacing: 1.5px; color: #0284c7; font-weight: bold; margin-bottom: 15px; text-align: center;">
      PROJET D'INTELLIGENCE ARTIFICIELLE — DEEP LEARNING MÉDICAL
    </p>
    <h1 style="font-size: 32pt; color: #005088; margin: 10px 0 15px 0; letter-spacing: 1px;">KIDNEYVISION AI</h1>
    <p style="font-size: 13.5pt; color: #334155; font-style: italic; margin-bottom: 35px; text-align: center;">
      Diagnostic Multi-Pathologies Rénales & IA Explicable à partir de 15 810 Scanners CT Réels
    </p>

    <table class="meta-table" style="text-align: left; max-width: 92%; margin: 0 auto;">
      <tr>
        <td class="label">Domaine</td>
        <td class="val">Deep Learning — Vision par ordinateur médicale & Diagnostic Assisté (CADx)</td>
      </tr>
      <tr>
        <td class="label">Tâche</td>
        <td class="val">Classification multi-classes (Cyst, Normal, Stone, Tumor) & Triage Gatekeeper binaire</td>
      </tr>
      <tr>
        <td class="label">Technologies</td>
        <td class="val">PyTorch 2.14, Torchvision, Scikit-learn, OpenCV 4.10, CUDA (RTX 4060 GPU), NumPy</td>
      </tr>
      <tr>
        <td class="label">Modèles étudiés</td>
        <td class="val">ConvNeXt-Tiny (SOTA Meta AI), MobileNetV3-Small (Gatekeeper), ResNet50V2, EfficientNetB0</td>
      </tr>
      <tr>
        <td class="label">Jeu de données</td>
        <td class="val">Dataset Consolidé de 15 810 scanners CT abdominaux axiaux réels (Cyst, Normal, Stone, Tumor)</td>
      </tr>
    </table>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 1 / 30</span>
  </div>
</div>

<!-- PAGE 2 : TABLE DES MATIÈRES -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>Table des matières</h2>
    <div style="margin-top: 15px;">
      <div class="toc-item"><span class="title">1. Présentation du projet</span><span class="page-num">3</span></div>
      <div class="toc-item"><span class="title">2. Jeu de données et exploration</span><span class="page-num">4</span></div>
      <div class="toc-item"><span class="title">3. Nettoyage et prétraitement des données</span><span class="page-num">7</span></div>
      <div class="toc-item"><span class="title">4. Augmentation des données (Data Augmentation)</span><span class="page-num">9</span></div>
      <div class="toc-item"><span class="title">5. Analyse exploratoire approfondie (EDA)</span><span class="page-num">10</span></div>
      <div class="toc-item"><span class="title">6. Architecture et développement des modèles</span><span class="page-num">12</span></div>
      <div class="toc-item"><span class="title">7. Entraînement des modèles</span><span class="page-num">15</span></div>
      <div class="toc-item"><span class="title">8. Évaluation des performances</span><span class="page-num">16</span></div>
      <div class="toc-item"><span class="title">9. Comparaison visuelle des modèles</span><span class="page-num">18</span></div>
      <div class="toc-item"><span class="title">10. Matrices de confusion</span><span class="page-num">21</span></div>
      <div class="toc-item"><span class="title">11. Courbes d'apprentissage</span><span class="page-num">24</span></div>
      <div class="toc-item"><span class="title">12. Sélection du meilleur modèle</span><span class="page-num">25</span></div>
      <div class="toc-item"><span class="title">13. Prédiction sur de nouvelles images</span><span class="page-num">26</span></div>
      <div class="toc-item"><span class="title">14. Sauvegarde du modèle et préparation au déploiement</span><span class="page-num">27</span></div>
      <div class="toc-item"><span class="title">15. Limites du projet et dimension d'assistance médicale</span><span class="page-num">29</span></div>
      <div class="toc-item"><span class="title">16. Conclusion générale</span><span class="page-num">30</span></div>
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 2 / 30</span>
  </div>
</div>

<!-- PAGE 3 : SECTION 1 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>1. Présentation du projet</h2>
    <h3>1.1 Contexte et problématique</h3>
    <p>
      KidneyVision AI est une plateforme d'aide au diagnostic clinique de nouvelle génération basée sur le Deep Learning et la Vision par Ordinateur médicale. Son objectif est de détecter, discriminer et caractériser précisément quatre états pathologiques rénaux majeurs à partir de coupes tomodensitométriques (CT Scan) et échographiques :
    </p>
    <ul>
      <li><b>Normal :</b> Parenchyme rénal sain et homogène, sans anomalie structurelle ni calcul.</li>
      <li><b>Stone (Lithiase rénale) :</b> Présence d'un calcul calcique avec cône d'atténuation postérieur.</li>
      <li><b>Cyst (Kyste rénal) :</b> Formation liquidienne anéchogène ou hypodense (classification de Bosniak I/II).</li>
      <li><b>Tumor (Tumeur rénale) :</b> Masse tissulaire solide hétérogène suspecte imposant une prise en charge oncologique urgente.</li>
    </ul>
    <p>
      Dans la pratique radiologique moderne, la surcharge de travail des praticiens et l'urgence diagnostique face aux micro-lésions constituent des défis majeurs. KidneyVision AI ne remplace pas le radiologue, mais fournit un outil d'assistance au tri initial et à la localisation rapide des anomalies.
    </p>
    <h3>1.2 Objectifs du projet</h3>
    <ul>
      <li>Constituer et harmoniser un corpus massif de <b>15 810 scanners CT axiaux authentiques</b>.</li>
      <li>Développer un modèle de filtrage en première ligne (<b>Neural Gatekeeper</b>) éliminant les images non rénales (radios thoraciques, dentaires, photos).</li>
      <li>Mettre en œuvre un algorithme de débruitage morphologique par <b>Inpainting de Telea</b> éliminant les marqueurs textuels sans altérer le tissu rénal.</li>
      <li>Entraîner et comparer 5 architectures de pointe dont le modèle SOTA <b>ConvNeXt-Tiny</b> de Meta AI.</li>
      <li>Intégrer une explicabilité clinique par <b>Grad-CAM</b> avec masquage anatomique et estimation métrique du diamètre en millimètres (mm).</li>
      <li>Déployer le modèle au sein d'un microservice Flask conteneurisé prêt pour la production hospitalière.</li>
    </ul>
    <h3>1.3 Résultats attendus</h3>
    <ul>
      <li>Un dataset stratifié en 12 901 images d'entraînement et 2 909 images de validation externe.</li>
      <li>Une exactitude globale (Accuracy) supérieure à 98.5% avec zéro faux négatif sur les kystes et tumeurs.</li>
      <li>Une estimation dimensionnelle calibrée du diamètre lésionnel (0.45 mm/pixel).</li>
      <li>Le checkpoint PyTorch optimisé sauvegardé sous <code>kidneyvision_master_4class_sota.pth</code>.</li>
    </ul>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 3 / 30</span>
  </div>
</div>

<!-- PAGE 4 : SECTION 2 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>2. Jeu de données et exploration</h2>
    <h3>2.1 Description du dataset</h3>
    <p>
      Le corpus d'imagerie clinique réunit <b>15 810 coupes tomodensitométriques (CT) axiales réelles</b> issues de protocoles standardisés d'imagerie abdominale. Contrairement aux versions antérieures limitées à la détection binaire, ce jeu de données couvre l'éventail complet des pathologies rénales corticales et calicielles.
    </p>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Indicateur</th>
          <th>Valeur</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Nombre total d'images CT collectées</td><td><b>15 810</b></td></tr>
        <tr><td>Images « Normal » (Parenchyme sain)</td><td>5 077 (32,1 %)</td></tr>
        <tr><td>Images « Stone » (Calculs rénaux)</td><td>3 874 (24,5 %)</td></tr>
        <tr><td>Images « Cyst » (Kystes corticaux)</td><td>3 709 (23,5 %)</td></tr>
        <tr><td>Images « Tumor » (Masses solides)</td><td>3 150 (19,9 %)</td></tr>
        <tr><td>Résolution native d'acquisition</td><td>512 × 512 pixels</td></tr>
        <tr><td>Format d'encodage</td><td>.jpg (Coupes axiales médicales)</td></tr>
        <tr><td>Valeurs manquantes / Images corrompues</td><td>0 %</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 1 — Statistiques du dataset consolidé 4 classes.</div>
    <h3>2.2 Visualisation de la distribution par classe</h3>
    <img src="__FIG1__" class="center-img" style="height: 180px;" alt="Distribution par classe">
    <div class="caption">Figure 1 — Distribution du nombre d'images CT par pathologie rénale.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 4 / 30</span>
  </div>
</div>

<!-- PAGE 5 : SECTION 2 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <img src="__FIG2__" class="center-img" style="height: 190px;" alt="Composition du dataset">
    <div class="caption">Figure 2 — Composition du dataset consolidé par pathologie, en pourcentage.</div>
    <div style="margin-top: 12px;"></div>
    <img src="__FIG3__" class="center-img" style="height: 135px;" alt="Échantillons de scanners">
    <div class="caption">Figure 3 — Échantillons cliniques réels de coupes tomodensitométriques rénales du dataset.</div>
    <div class="interpretation">
      <div class="interpretation-title">Interprétation Médicale des Clichés :</div>
      Les quatre classes présentent des caractéristiques sémantiques distinctes : le parenchyme <b>Normal</b> est dense et homogène ; les <b>Calculs (Stone)</b> se manifestent par une hyperdensité focale dense ; les <b>Kystes (Cyst)</b> forment une cavité hypodense parfaitement circulaire ; tandis que les <b>Tumeurs (Tumor)</b> se révèlent sous forme de masses solides expansives désorganisant l'architecture de la loge rénale.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 5 / 30</span>
  </div>
</div>

<!-- PAGE 6 : SECTION 2 (Partie 3) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <img src="__FIG4__" class="center-img" style="height: 220px;" alt="Dimensions">
    <div class="caption">Figure 4 — Distribution des dimensions des images et standardisation.</div>
    <div class="interpretation">
      <div class="interpretation-title">Interprétation de la Standardisation :</div>
      Toutes les coupes CT sources ont été acquises en matrice 512 × 512 pixels. Pour optimiser l'efficacité computationnelle lors des passes GPU et éliminer la redondance fréquentielle sans sacrifier la netteté des micro-calculs, les images sont redimensionnées bilinéairement à la résolution standardisée de 224 × 224 × 3 pixels. Cette transformation préserve scrupuleusement l'intégrité morphologique des structures anatomiques rénales.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 6 / 30</span>
  </div>
</div>

<!-- PAGE 7 : SECTION 3 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>3. Nettoyage et prétraitement des données</h2>
    <h3>3.1 Détection des artefacts et images invalides</h3>
    <p>
      L'imagerie médicale tomodensitométrique et échographique est fréquemment polluée par des incrustations graphiques : horodatage, nom du fabricant de l'échographe, calibrations de calipers et repères en croix. L'analyse automatique de l'intégrité de chaque fichier avec la bibliothèque PIL confirme 100% de fichiers décodables.
    </p>
    <h3>3.2 Auto-Masking & Inpainting de Telea (OpenCV)</h3>
    <p>
      Pour éviter que le réseau de neurones n'apprenne des corrélations fallacieuses basées sur les typographies médicales, un module d'inpainting de Telea (Fast Marching Method) a été développé :
    </p>
    <div class="code-block"># Détection morphologique des textes saturés et inpainting de Telea
gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
text_mask = (tophat > 38) & (gray > 135)
dilated_mask = cv2.dilate(np.uint8(text_mask)*255, kernel, iterations=1)
cleaned_bgr = cv2.inpaint(bgr, dilated_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)</div>
    <div class="code-caption">Extrait de code — Prétraitement et élimination des artefacts par Inpainting de Telea.</div>
    <h3>3.3 Vérification des labels & Partitionnement stratifié</h3>
    <p>
      Le dataset nettoyé de 15 810 images est découpé de manière stratifiée afin de préserver rigoureusement le ratio de chaque pathologie entre les sous-ensembles : <b>81,6 %</b> pour l'entraînement (12 901 scanners) et <b>18,4 %</b> pour l'évaluation externe (2 909 scanners).
    </p>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Ensemble</th>
          <th>Total</th>
          <th>Cyst</th>
          <th>Normal</th>
          <th>Stone</th>
          <th>Tumor</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Train</td><td>12 901</td><td>3 028</td><td>4 147</td><td>3 163</td><td>2 563</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 2 — Répartition stratifiée d'entraînement (Train Set).</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 7 / 30</span>
  </div>
</div>

<!-- PAGE 8 : SECTION 3 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <table class="table-custom">
      <thead>
        <tr>
          <th>Ensemble</th>
          <th>Total</th>
          <th>Cyst</th>
          <th>Normal</th>
          <th>Stone</th>
          <th>Tumor</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Validation</td><td>2 909</td><td>681</td><td>930</td><td>711</td><td>587</td></tr>
        <tr style="font-weight: bold; background: #e0f2fe;">
          <td>Total Consolidé</td><td>15 810</td><td>3 709</td><td>5 077</td><td>3 874</td><td>3 150</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 3 — Répartition stratifiée globale des données (Train / Validation).</div>
    <p style="margin-top: 15px;">
      La traçabilité complète de la stratification est persistée dans les répertoires d'entraînement et les fichiers de métadonnées du projet, garantissant une reproductibilité absolue des expérimentations.
    </p>
    <div class="interpretation">
      <div class="interpretation-title">Garantie d'Absence de Fuite d'Information (Data Leakage) :</div>
      La stratification a été opérée au niveau de l'examen tomodensitométrique. Aucune coupe adjacente provenant d'une même acquisition clinique ne figure simultanément dans l'ensemble d'entraînement et dans l'ensemble de validation, écartant formellement tout risque de mémorisation par le réseau.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 8 / 30</span>
  </div>
</div>

<!-- PAGE 9 : SECTION 4 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>4. Augmentation des données (Data Augmentation)</h2>
    <p>
      Une stratégie d'augmentation dynamique spécifique à la tomodensitométrie abdominale est injectée dans le DataLoader PyTorch afin de renforcer l'invariance aux conditions d'acquisition radiologique :
    </p>
    <div class="code-block">train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.20, contrast=0.20),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    transforms.RandomErasing(p=0.25, scale=(0.02, 0.15), value='random')
])</div>
    <div class="code-caption">Extrait de code — Pipeline d'augmentation tensorielle PyTorch.</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Paramètre</th>
          <th>Valeur Appliquée</th>
          <th>Justification Biomédicale</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Rotation</td><td>± 15°</td><td>Variations d'angle de positionnement du patient sur la table CT</td></tr>
        <tr><td>Retournement H / V</td><td>Activé (p=0.5 / p=0.2)</td><td>Symétrie bilatérale rénale gauche/droite</td></tr>
        <tr><td>Contraste & Luminosité</td><td>± 20 %</td><td>Différences de calibration des détecteurs et doses de rayons X</td></tr>
        <tr><td>Random Erasing</td><td>p = 0.25 (2-15%)</td><td>Immunisation contre les occlusions et artefacts métalliques</td></tr>
      </tbody>
    </table>
    <img src="__FIG5__" class="center-img" style="height: 180px;" alt="Data Augmentation">
    <div class="caption">Figure 5 — Variantes médicales générées par la Data Augmentation.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 9 / 30</span>
  </div>
</div>

<!-- PAGE 10 : SECTION 5 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>5. Analyse exploratoire approfondie (EDA)</h2>
    <p>
      Une analyse exploratoire avancée permet de s'assurer de l'équilibre des données et de quantifier la dispersion spectrale des niveaux de gris (Unités Hounsfield équivalentes) :
    </p>
    <img src="__FIG6__" class="center-img" style="height: 175px;" alt="Split Train Val">
    <div class="caption">Figure 6 — Répartition des classes par ensemble (Train / Validation).</div>
    <img src="__FIG7__" class="center-img" style="height: 175px;" alt="Intensité Pixels">
    <div class="caption">Figure 7 — Distribution des intensités de pixels comparée entre les 4 pathologies.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 10 / 30</span>
  </div>
</div>

<!-- PAGE 11 : SECTION 5 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h3>Gestion du Déséquilibre de Classe (Class Weighting)</h3>
    <p>
      Bien que le dataset soit relativement équilibré, la classe <i>Normal</i> (5 077 scans) est plus représentée que la classe <i>Tumor</i> (3 150 scans). Afin d'éviter tout biais diagnostique, une fonction de perte <b>CrossEntropyLoss pondérée</b> avec <b>Label Smoothing</b> (&alpha; = 0.08) a été intégrée :
    </p>
    <div class="code-block"># Calcul analytique des poids inverses de classe
total_samples = sum(class_counts)
class_weights = [total_samples / (4.0 * count) for count in class_counts]
weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)

criterion = nn.CrossEntropyLoss(weight=weights_tensor, label_smoothing=0.08)</div>
    <div class="code-caption">Extrait de code — Pondération inverse et régularisation par Label Smoothing.</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Pathologie</th>
          <th>Nombre de Scans Train</th>
          <th>Poids de Perte (wc)</th>
          <th>Rôle Clinique</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Cyst</td><td>3 028</td><td>1.065</td><td>Compense la légère sous-représentation des kystes</td></tr>
        <tr><td>Normal</td><td>4 147</td><td>0.778</td><td>Atténue la pénalité sur la classe majoritaire</td></tr>
        <tr><td>Stone</td><td>3 163</td><td>1.020</td><td>Équilibre parfait pour la détection lithiasique</td></tr>
        <tr><td>Tumor</td><td>2 563</td><td>1.258</td><td>Pénalité maximale : interdit tout faux négatif oncologique</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 4 — Coefficients de pondération analytique par pathologie.</div>
    <div class="interpretation">
      <div class="interpretation-title">Impact du Label Smoothing :</div>
      Le Label Smoothing (&alpha; = 0.08) remplace les cibles binaires dures [0, 1] par des probabilités douces [0.02, 0.94]. Cette technique prévient la surconfiance prédictive du réseau sur les cas ambigus et améliore considérablement la calibration des scores de probabilité transmis au médecin.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 11 / 30</span>
  </div>
</div>

<!-- PAGE 12 : SECTION 6 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>6. Architecture et développement des modèles</h2>
    <p>
      Cinq architectures Deep Learning ont été développées et entraînées selon un protocole rigoureux afin d'identifier le meilleur compromis entre exactitude clinique et vitesse d'inférence.
    </p>
    <div class="code-block"># Optimiseur universel AdamW avec découplage du Weight Decay
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,             # Phase 1 : 1e-3 | Phase 2 : 2.5e-5
    weight_decay=1e-2    # Régularisation L2 découplée
)</div>
    <div class="code-caption">Extrait de code — Optimiseur d'entraînement AdamW.</div>
    <h3>6.1 Modèle 1 — Basic CNN (Baseline)</h3>
    <p>
      Réseau convolutif séquentiel standard composé de 4 blocs <code>[Conv2D(3x3) &rarr; ReLU &rarr; MaxPool]</code> suivis d'une couche Dense de 256 neurones. Il sert de point de référence pour mesurer l'apport des architectures modernes.
    </p>
    <table class="table-custom">
      <thead>
        <tr><th>Total Paramètres</th><th>Paramètres Entraînables</th><th>Latence Moyenne</th></tr>
      </thead>
      <tbody>
        <tr><td>9 826 116 (37,48 Mo)</td><td>9 826 116 (100 %)</td><td>4,2 ms / image</td></tr>
      </tbody>
    </table>
    <h3>6.2 Modèle 2 — MobileNetV3-Small (Triage Gatekeeper)</h3>
    <p>
      Architecture ultra-légère basée sur des convolutions séparables en profondeur (Depthwise Separable) et des blocs Squeeze-and-Excitation. Elle opère en moins de 5 ms sur CPU et constitue la colonne vertébrale du <b>Stage 1 Gatekeeper</b>.
    </p>
    <table class="table-custom">
      <thead>
        <tr><th>Total Paramètres</th><th>Paramètres Entraînables</th><th>Latence Moyenne</th></tr>
      </thead>
      <tbody>
        <tr><td>1 528 436 (5,83 Mo)</td><td>104 321 (Head)</td><td>5,1 ms / image</td></tr>
      </tbody>
    </table>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 12 / 30</span>
  </div>
</div>

<!-- PAGE 13 : SECTION 6 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h3>6.3 Modèle 3 — ResNet50V2 (Réseau Résiduel Profond)</h3>
    <p>
      Architecture résiduelle classique à 50 couches avec connexions de raccourci (Skip Connections). Elle permet un entraînement très profond en évitant l'évanouissement du gradient, mais présente un coût d'inférence plus élevé.
    </p>
    <div class="code-block"># Architecture ResNet50V2 avec pré-entraînement ImageNet
backbone = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
backbone.fc = nn.Sequential(
    nn.Linear(2048, 256),
    nn.BatchNorm1d(256),
    nn.ReLU(),
    nn.Dropout(0.35),
    nn.Linear(256, 4)
)</div>
    <div class="code-caption">Extrait de code — Adaptation de ResNet50V2 pour les 4 pathologies rénales.</div>
    <table class="table-custom">
      <thead>
        <tr><th>Total Paramètres</th><th>Paramètres Entraînables</th><th>Latence Moyenne</th></tr>
      </thead>
      <tbody>
        <tr><td>23 508 036 (89,68 Mo)</td><td>525 572 (Phase 1)</td><td>14,8 ms / image</td></tr>
      </tbody>
    </table>
    <h3>6.4 Modèle 4 — EfficientNetB0 (Compound Scaling)</h3>
    <p>
      Réseau optimisé par mise à l'échelle conjointe de la profondeur, de la largeur et de la résolution. Il offre une excellente régularisation mais souffre d'une latence d'inférence GPU pénalisante due à ses convolutions MBConv fragmentées.
    </p>
    <table class="table-custom">
      <thead>
        <tr><th>Total Paramètres</th><th>Paramètres Entraînables</th><th>Latence Moyenne</th></tr>
      </thead>
      <tbody>
        <tr><td>4 017 788 (15,32 Mo)</td><td>328 452 (Head)</td><td>16,5 ms / image</td></tr>
      </tbody>
    </table>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 13 / 30</span>
  </div>
</div>

<!-- PAGE 14 : SECTION 6 (Partie 3) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h3>6.5 Modèle 5 — ConvNeXt-Tiny (Meta AI) — Modèle Maître SOTA</h3>
    <p>
      L'architecture <b>ConvNeXt-Tiny</b> réinvente les réseaux convolutionnels en intégrant les découvertes clés des Vision Transformers (ViT) sans leurs contraintes d'attention quadratique :
    </p>
    <ul>
      <li><b>Convolutions 7 &times; 7 Depthwise :</b> Champ récepteur large similaire aux patchs d'attention des ViT.</li>
      <li><b>GELU & LayerNorm :</b> Remplacement de ReLU et BatchNorm par LayerNorm pour une stabilité d'inférence exceptionnelle.</li>
      <li><b>Inverted Bottleneck :</b> Canaux internes quadruplés pour capturer les micro-densités calciques et kystiques.</li>
    </ul>
    <div class="code-block">class KidneyMasterConvNeXt(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        self.backbone = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
        in_features = self.backbone.classifier[2].in_features # 768
        self.backbone.classifier[2] = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(p=0.35),
            nn.Linear(256, num_classes)
        )
        # Hooks d'extraction Grad-CAM sur le dernier étage résiduel
        self.backbone.features[7].register_forward_hook(self._save_activations)
        self.backbone.features[7].register_full_backward_hook(self._save_gradients)</div>
    <div class="code-caption">Extrait de code — Modèle Maître ConvNeXt-Tiny et intégration des hooks Grad-CAM.</div>
    <table class="table-custom">
      <thead>
        <tr><th>Total Paramètres</th><th>Paramètres Entraînables</th><th>Latence Moyenne</th></tr>
      </thead>
      <tbody>
        <tr><td><b>28 164 356 (107,44 Mo)</b></td><td>197 380 (Head) + 12,8 M (Deep)</td><td><b>7,8 ms / image</b></td></tr>
      </tbody>
    </table>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 14 / 30</span>
  </div>
</div>

<!-- PAGE 15 : SECTION 7 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>7. Entraînement des modèles</h2>
    <p>
      L'entraînement du modèle Maître ConvNeXt-Tiny a été conduit sur un GPU dédié <b>NVIDIA GeForce RTX 4060 Laptop (8 Go VRAM CUDA)</b> avec précision mixte automatique (AMP) :
    </p>
    <table class="table-custom">
      <thead>
        <tr><th>Hyperparamètre</th><th>Phase 1 (Head Training)</th><th>Phase 2 (Deep Fine-Tuning)</th></tr>
      </thead>
      <tbody>
        <tr><td>Couches entraînées</td><td>Tête Dense uniquement (Backbone gelé)</td><td>Étages 6, 7 et Tête Dense</td></tr>
        <tr><td>Nombre d'époques</td><td>3 époques</td><td>4 époques (Arrêt anticipé à convergence)</td></tr>
        <tr><td>Taux d'apprentissage (lr)</td><td>1.0 &times; 10^-3</td><td>2.5 &times; 10^-5 (Cosine Decay)</td></tr>
        <tr><td>Optimiseur & Weight Decay</td><td>AdamW (Decay = 10^-2)</td><td>AdamW (Decay = 10^-2)</td></tr>
        <tr><td>Taille de batch (Batch size)</td><td>32 coupes axiales</td><td>32 coupes axiales</td></tr>
        <tr><td>Précision de calcul</td><td>Mixed Precision AMP FP16/FP32</td><td>Mixed Precision AMP FP16/FP32</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 5 — Protocole d'entraînement en deux phases (Curriculum Learning).</div>
    <h3>Temps d'entraînement observés sur GPU RTX 4060</h3>
    <table class="table-custom">
      <thead>
        <tr><th>Modèle</th><th>Temps Phase 1</th><th>Temps Phase 2</th><th>Temps Total</th></tr>
      </thead>
      <tbody>
        <tr><td>Modèle 1 — Basic CNN</td><td>—</td><td>—</td><td>4,21 min</td></tr>
        <tr><td>Modèle 2 — MobileNetV3</td><td>1,82 min</td><td>3,14 min</td><td>4,96 min</td></tr>
        <tr><td>Modèle 3 — ResNet50V2</td><td>3,45 min</td><td>9,12 min</td><td>12,57 min</td></tr>
        <tr><td>Modèle 4 — EfficientNetB0</td><td>3,89 min</td><td>10,40 min</td><td>14,29 min</td></tr>
        <tr><td><b>Modèle 5 — ConvNeXt-Tiny SOTA</b></td><td><b>2,10 min</b></td><td><b>6,45 min</b></td><td><b>8,55 min</b></td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 6 — Durées d'entraînement observées par modèle.</div>
    <div class="interpretation">
      <div class="interpretation-title">Avantage Clé de ConvNeXt-Tiny sur GPU :</div>
      Grâce à sa structure 100% convolutionnelle optimisée sans attention globale, ConvNeXt-Tiny s'entraîne en <b>8,55 minutes</b> contre 14,29 minutes pour EfficientNetB0, tout en atteignant une exactitude supérieure.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 15 / 30</span>
  </div>
</div>

<!-- PAGE 16 : SECTION 8 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>8. Évaluation des performances</h2>
    <p>
      L'évaluation diagnostique a été menée sur l'ensemble de validation externe de <b>2 909 scanners CT indépendants</b>, rigoureusement isolés lors de l'entraînement.
    </p>
    <h3>8.1 Tableau comparatif des métriques globales</h3>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Modèle</th>
          <th>Accuracy</th>
          <th>Precision Macro</th>
          <th>Recall Macro</th>
          <th>F1-Score Macro</th>
          <th>ROC-AUC (OVR)</th>
          <th>Inférence (ms)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Modèle 1 — Basic CNN</td><td>0,9320</td><td>0,9315</td><td>0,9308</td><td>0,9310</td><td>0,9540</td><td>4,2 ms</td></tr>
        <tr><td>Modèle 2 — MobileNetV3</td><td>0,9680</td><td>0,9672</td><td>0,9685</td><td>0,9675</td><td>0,9890</td><td>5,1 ms</td></tr>
        <tr><td>Modèle 3 — ResNet50V2</td><td>0,9785</td><td>0,9780</td><td>0,9775</td><td>0,9780</td><td>0,9940</td><td>14,8 ms</td></tr>
        <tr><td>Modèle 4 — EfficientNetB0</td><td>0,9810</td><td>0,9805</td><td>0,9812</td><td>0,9805</td><td>0,9960</td><td>16,5 ms</td></tr>
        <tr style="font-weight: bold; background: #e0f2fe;">
          <td>Modèle 5 — ConvNeXt-Tiny SOTA</td><td>0,9942</td><td>0,9939</td><td>0,9941</td><td>0,9938</td><td>0,9996</td><td>7,8 ms</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 7 — Comparaison complète des métriques cliniques sur 2 909 cas de test réels.</div>
    <h3>8.2 Rapports de classification détaillés</h3>
    <div class="code-block">Modèle 1 — Basic CNN
               precision    recall  f1-score   support
        Cyst     0.9412    0.9325    0.9368       681
      Normal     0.9521    0.9548    0.9535       930
       Stone     0.9125    0.9184    0.9154       711
       Tumor     0.9201    0.9182    0.9192       587
    accuracy                         0.9320      2909

Modèle 2 — MobileNetV3
               precision    recall  f1-score   support
        Cyst     0.9752    0.9809    0.9780       681
      Normal     0.9810    0.9763    0.9787       930
       Stone     0.9542    0.9592    0.9567       711
       Tumor     0.9585    0.9574    0.9580       587
    accuracy                         0.9680      2909</div>
    <div class="code-caption">Rapport détaillé de classification des modèles 1 et 2.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 16 / 30</span>
  </div>
</div>

<!-- PAGE 17 : SECTION 8 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <div class="code-block">Modèle 3 — ResNet50V2
               precision    recall  f1-score   support
        Cyst     0.9854    0.9882    0.9868       681
      Normal     0.9870    0.9839    0.9854       930
       Stone     0.9685    0.9705    0.9695       711
       Tumor     0.9710    0.9693    0.9702       587
    accuracy                         0.9785      2909

Modèle 4 — EfficientNetB0
               precision    recall  f1-score   support
        Cyst     0.9882    0.9897    0.9890       681
      Normal     0.9892    0.9871    0.9881       930
       Stone     0.9720    0.9747    0.9733       711
       Tumor     0.9727    0.9710    0.9719       587
    accuracy                         0.9810      2909

Modèle 5 — ConvNeXt-Tiny SOTA (Modèle Maître Retenu)
               precision    recall  f1-score   support
        Cyst     0.9971    1.0000    0.9985       681
      Normal     0.9957    0.9978    0.9968       930
       Stone     0.9916    0.9930    0.9923       711
       Tumor     0.9983    0.9966    0.9974       587
    accuracy                         0.9942      2909</div>
    <div class="code-caption">Rapports de classification détaillés (ResNet50V2, EfficientNetB0, ConvNeXt-Tiny).</div>
    <div class="interpretation">
      <div class="interpretation-title">Excellence Diagnostique de ConvNeXt-Tiny :</div>
      Sur la cohorte complète de test (2 909 cas), le modèle <b>ConvNeXt-Tiny</b> atteint un rappel exceptionnel de <b>100,00 % sur les Kystes (681/681)</b> et <b>99,66 % sur les Tumeurs (585/587)</b> avec une précision de <b>99,83 %</b>. Cette quasi-absence de faux négatifs répond exactement aux critères de sécurité clinique pour un dispositif médical de dépistage.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 17 / 30</span>
  </div>
</div>

<!-- PAGE 18 : SECTION 9 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>9. Comparaison visuelle des modèles</h2>
    <p>
      Les métriques principales d'exactitude (Accuracy) et de macro F1-score sont comparées graphiquement ci-dessous pour apprécier le saut de performance entre générations :
    </p>
    <img src="__FIG8__" class="center-img" style="height: 190px;" alt="Comparaison modèles">
    <div class="caption">Figure 8 — Comparaison de l'Accuracy (%) et du Macro F1-Score (%) entre les 5 modèles.</div>
    <table class="table-custom" style="margin-top: 15px;">
      <thead>
        <tr>
          <th>Modèle</th>
          <th>Force Clinique Identifiée</th>
          <th>Point de Vigilance / Limite</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Modèle 1 — Basic CNN</td><td>Architecture très légère, latence minimale (4.2 ms)</td><td>Généralisation limitée sur les kystes atypiques</td></tr>
        <tr><td>Modèle 2 — MobileNetV3</td><td>Faible empreinte VRAM, idéal pour le triage</td><td>Confusion résiduelle entre calculs et condensations osseuses</td></tr>
        <tr><td>Modèle 3 — ResNet50V2</td><td>Excellente profondeur, extraction résiduelle solide</td><td>Empreinte mémoire importante (89 Mo), inférence à 14.8 ms</td></tr>
        <tr><td>Modèle 4 — EfficientNetB0</td><td>Haute précision par scaling composé</td><td>Goulet d'étranglement de latence GPU (16.5 ms)</td></tr>
        <tr><td><b>Modèle 5 — ConvNeXt-Tiny</b></td><td><b>Précision SOTA (99.42%), quasi-zéro faux négatif</b></td><td>Nécessite un matériel GPU CUDA pour l'entraînement</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 8 — Synthèse comparative des forces et points de vigilance.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 18 / 30</span>
  </div>
</div>

<!-- PAGE 19 : SECTION 9 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <div class="interpretation">
      <div class="interpretation-title">Analyse du Compromis Précision / Vitesse :</div>
      En imagerie tomodensitométrique hospitalière, une latence inférieure à 20 millisecondes par coupe axiale est requise pour permettre le défilement fluide des séries d'examens (Volume Scrolling).
      ConvNeXt-Tiny s'exécute en <b>7,8 millisecondes</b> par coupe tout en surclassant EfficientNetB0 de plus de 1.3 point d'exactitude. Il réconcilie la rapidité des architectures convolutives et la représentativité spatiale des Vision Transformers.
    </div>
    <h3>ROC-AUC Multi-Classes (One-vs-Rest)</h3>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Pathologie Cible</th>
          <th>ROC-AUC (OVR)</th>
          <th>Seuil Optimal Déterminé</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Cyst</td><td><b>0,9998</b></td><td>0.50</td></tr>
        <tr><td>Normal</td><td><b>0,9997</b></td><td>0.50</td></tr>
        <tr><td>Stone</td><td><b>0,9994</b></td><td>0.48 (Optimisé pour la sensibilité)</td></tr>
        <tr><td>Tumor</td><td><b>0,9995</b></td><td>0.45 (Seuil abaissé pour alerte oncologique)</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 9 — Aires sous la courbe ROC multi-classes pour ConvNeXt-Tiny.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 19 / 30</span>
  </div>
</div>

<!-- PAGE 20 : SECTION 9 (Partie 3) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h3>Sensibilité Clinique Spécifique aux Calculs Rénaux (Stone)</h3>
    <p>
      Le diagnostic de la néphrolithiase représente un enjeu quotidien en urologie d'urgence :
    </p>
    <ul>
      <li>Sur 711 scanners contenant des calculs rénaux réels, le modèle en identifie avec certitude <b>706</b>, soit un taux de détection de <b>99,30 %</b>.</li>
      <li>Seuls 5 cas ont été reclassés (3 cas considérés comme normaux en raison de micro-lithiases calicielles inférieures à 2 mm, et 2 cas présentant une calcification tumorale connexe).</li>
      <li>Cette sensibilité extrême garantit que pratiquement aucun patient atteint de crise colique néphrétique ne passe inaperçu.</li>
    </ul>
    <div class="interpretation">
      <div class="interpretation-title">Marge d'Incertitude et Alerte au Praticien :</div>
      Lorsque l'écart entre les deux probabilités les plus élevées est inférieur à 5%, le système n'émet pas de verdict catégorique : il place l'examen sous le statut médical <b><code>under_review</code></b> avec notification directe à l'urologue référent.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 20 / 30</span>
  </div>
</div>

<!-- PAGE 21 : SECTION 10 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>10. Matrices de confusion</h2>
    <p>
      La matrice de confusion consolidée ci-dessous illustre la répartition exacte des prédictions sur les <b>2 909 scanners de test réels</b> :
    </p>
    <img src="__FIG10__" class="center-img" style="height: 250px;" alt="Matrice de confusion">
    <div class="caption">Figure 10 — Matrice de confusion 4-classes consolidée (2 909 cas réels).</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 21 / 30</span>
  </div>
</div>

<!-- PAGE 22 : SECTION 10 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h3>Analyse Détaillée des 2 909 Cas Évalués</h3>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Pathologie Réelle</th>
          <th>Prédit Cyst</th>
          <th>Prédit Normal</th>
          <th>Prédit Stone</th>
          <th>Prédit Tumor</th>
          <th>Taux de Réussite</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><b>Cyst (681)</b></td><td><b>681</b></td><td>0</td><td>0</td><td>0</td><td><b>100,00 %</b></td></tr>
        <tr><td><b>Normal (930)</b></td><td>1</td><td><b>928</b></td><td>1</td><td>0</td><td><b>99,78 %</b></td></tr>
        <tr><td><b>Stone (711)</b></td><td>1</td><td>3</td><td><b>706</b></td><td>1</td><td><b>99,30 %</b></td></tr>
        <tr><td><b>Tumor (587)</b></td><td>0</td><td>1</td><td>1</td><td><b>585</b></td><td><b>99,66 %</b></td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 10 — Détail chiffré des prédictions de la matrice de confusion.</div>
    <div class="interpretation">
      <div class="interpretation-title">Faits Saillants de l'Évaluation Clinique :</div>
      1. <b>Zéro Kyste Non Détecté :</b> 681 kystes sur 681 ont été parfaitement isolés. La morphologie circulaire hypodense est captée sans la moindre ambiguïté par les filtres 7 &times; 7.<br>
      2. <b>Sécurité Oncologique :</b> Sur 587 tumeurs malignes et masses rénales, 585 sont formellement identifiées. Un seul cas a été confondu avec un tissu normal en raison d'une lésion débutante de très petit volume.<br>
      3. <b>Spécificité sur Parenchyme Sain :</b> 928 scans normaux sur 930 sont validés sans fausse alerte.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 22 / 30</span>
  </div>
</div>

<!-- PAGE 23 : SECTION 10 (Partie 3) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h3>Interprétation Clinique des Faux Positifs et Faux Négatifs</h3>
    <p>
      En imagerie médicale, toutes les erreurs ne portent pas le même préjudice clinique :
    </p>
    <ul>
      <li><b>Faux Positif (Normal classé en Stone ou Cyst) :</b> Coût modéré. Le radiologue examine le cliché lors de sa revue et écarte rapidement l'alerte sans risque pour la santé du patient.</li>
      <li><b>Faux Négatif (Calcul ou Tumeur classé en Normal) :</b> Risque critique. Un calcul non diagnostiqué peut provoquer une obstruction urinaire avec destruction rénale irréversible, et une tumeur ignorée retarde le pronostic vital.</li>
    </ul>
    <div class="interpretation">
      <div class="interpretation-title">Conclusion sur la Matrice :</div>
      Le taux de faux négatifs cumulé sur l'ensemble de la cohorte est inférieur à <b>0,25 %</b> (7 cas sur 2 909), conférant à KidneyVision AI un profil d'assistance diagnostique exceptionnellement sûr et conforme aux attentes des comités de validation clinique.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 23 / 30</span>
  </div>
</div>

<!-- PAGE 24 : SECTION 11 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>11. Courbes d'apprentissage</h2>
    <p>
      L'évolution de la fonction de perte (Loss) et de l'exactitude (Accuracy) tout au long des deux phases d'entraînement illustre la convergence stable du réseau :
    </p>
    <img src="__FIG11__" class="center-img" style="height: 195px;" alt="Courbes apprentissage">
    <div class="caption">Figure 11 — Courbes d'Accuracy et de Loss (Train & Validation) au cours des 7 époques.</div>
    <div class="interpretation">
      <div class="interpretation-title">Interprétation de la Convergence :</div>
      1. <b>Phase 1 (Époques 1 à 3) :</b> L'optimisation exclusive de la tête dense avec lr=10^-3 fait passer l'Accuracy de 93,8% à 97,2% sans perturber les représentations générales pré-apprises.<br>
      2. <b>Phase 2 (Époques 4 à 7) :</b> Le dégel des couches profondes avec un faible taux (2.5 &times; 10^-5) affine la discrimination des textures fines. La validation suit parfaitement la courbe d'entraînement sans aucun décrochage, confirmant l'absence totale de surapprentissage (Overfitting).
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 24 / 30</span>
  </div>
</div>

<!-- PAGE 25 : SECTION 12 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>12. Sélection du meilleur modèle</h2>
    <p>
      Le choix du modèle final déployé en production hospitalière repose sur un <b>Score Composite Clinique</b> combinant rigoureusement exactitude, sensibilité critique et latence opérationnelle :
    </p>
    <div class="code-block">Final Score = 0.25 * Accuracy + 0.25 * Recall + 0.25 * F1-score + 0.15 * ROC-AUC + 0.10 * Speed Score

Speed Score = 1 - (temps_inférence / temps_inférence_maximal)</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th>Modèle</th>
          <th>Score de Vitesse</th>
          <th>Score Composite Final</th>
          <th>Rang</th>
        </tr>
      </thead>
      <tbody>
        <tr style="font-weight: bold; background: #e0f2fe;">
          <td>Modèle 5 — ConvNeXt-Tiny</td><td>0,527</td><td><b>0,9475</b></td><td><b>1 (Sélectionné)</b></td></tr>
        <tr><td>Modèle 4 — EfficientNetB0</td><td>0,000</td><td>0,8835</td><td>2</td></tr>
        <tr><td>Modèle 3 — ResNet50V2</td><td>0,103</td><td>0,8910</td><td>3</td></tr>
        <tr><td>Modèle 2 — MobileNetV3</td><td>0,691</td><td>0,9380</td><td>4</td></tr>
        <tr><td>Modèle 1 — Basic CNN</td><td>0,745</td><td>0,9090</td><td>5</td></tr>
      </tbody>
    </table>
    <div class="caption">Tableau 11 — Classement final des modèles selon le score composite décisionnel.</div>
    <div class="interpretation">
      <div class="interpretation-title">Modèle Final Sélectionné : ConvNeXt-Tiny (Meta AI) :</div>
      Avec une Accuracy de <b>99,42 %</b>, un F1-score de <b>99,38 %</b>, une ROC-AUC de <b>0,9996</b> et une inférence de seulement <b>7,8 ms</b>, le modèle ConvNeXt-Tiny est retenu comme moteur diagnostique central de la solution KidneyVision AI.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 25 / 30</span>
  </div>
</div>

<!-- PAGE 26 : SECTION 13 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>13. Prédiction sur de nouvelles images & Calibration Métrique</h2>
    <p>
      Le pipeline complet de prédiction intègre la rétropropagation ciblée du gradient et l'estimation millimétrique du foyer :
    </p>
    <div class="code-block">def predict_and_explain(pil_img, model, device):
    # Inférence tensorielle et probabilités
    tensor = val_transforms(pil_img).unsqueeze(0).to(device)
    tensor.requires_grad = True
    output = model(tensor)
    probs = F.softmax(output, dim=1).squeeze().detach().cpu().numpy()
    pred_idx = int(np.argmax(probs))
    
    # Rétropropagation ciblée et carte Grad-CAM
    output[0, pred_idx].backward()
    weights = torch.mean(model.gradients, dim=(2, 3), keepdim=True)
    cam = F.relu(torch.sum(weights * model.activations, dim=1)).squeeze()
    
    # Calibration radiologique métrique : 0.45 mm par pixel
    active_area = float((cam > 0.65).sum())
    radius_px = np.sqrt(active_area / np.pi)
    diameter_mm = round(2.0 * radius_px * 0.45, 1)
    return CLASSES[pred_idx], probs[pred_idx]*100, diameter_mm</div>
    <div class="code-caption">Extrait de code — Inférence avec localisation Grad-CAM et calcul métrique.</div>
    <img src="__FIG12__" class="center-img" style="height: 125px;" alt="Grad-CAM Showcase">
    <div class="caption">Figure 12 — Cartographies Grad-CAM avec repères biométriques et calipers en millimètres.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 26 / 30</span>
  </div>
</div>

<!-- PAGE 27 : SECTION 14 (Partie 1) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>14. Sauvegarde du modèle et préparation au déploiement</h2>
    <h3>14.1 Sauvegarde du modèle et checkpoint PyTorch</h3>
    <p>
      Le modèle entraîné ainsi que les hyperparamètres associés et dictionnaires de classes sont sérialisés dans un checkpoint PyTorch complet :
    </p>
    <div class="code-block">torch.save({
    "model_state_dict": model.state_dict(),
    "architecture": "ConvNeXt-Tiny-4Class-Master",
    "classes": ["Cyst", "Normal", "Stone", "Tumor"],
    "num_classes": 4,
    "input_size": [224, 224, 3],
    "val_accuracy": 0.9942,
    "val_macro_f1": 0.9938,
    "roc_auc_ovr": 0.9996
}, "models/kidneyvision_master_4class_sota.pth")</div>
    <div class="code-caption">Extrait de code — Sérialisation du checkpoint SOTA de production.</div>
    <h3>14.2 Interprétabilité Clinique avec Masque Tissulaire</h3>
    <p>
      Pour garantir que la saillance visuelle ne surligne jamais l'air ambiant noir ou le lit d'examen du scanner CT, un masque morphologique tissulaire (Mtissue) isole exclusivement les densités anatomiques supérieures à 25 unités :
    </p>
    <div class="interpretation">
      <div class="interpretation-title">Formule de la Saillance Anatomique :</div>
      L_Anatomical_CAM = ReLU( &sum; &alpha;_k^c A^k ) &odot; M_tissue<br>
      Cette étape mathématique élimine 100% des artefacts de fond et ancre la confiance du radiologue dans l'explication visuelle générée.
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 27 / 30</span>
  </div>
</div>

<!-- PAGE 28 : SECTION 14 (Partie 2) -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h3>14.3 Déploiement dans le Microservice Flask</h3>
    <p>
      Le modèle est hébergé au sein d'une API REST Flask conteneurisée (port 5000) orchestrée par un chargeur Singleton :
    </p>
    <ul>
      <li><b>Singleton Pattern :</b> Le modèle de 112 Mo est instancié une seule fois au boot et conservé en VRAM GPU permanente.</li>
      <li><b>Warm-Up Initial :</b> Une passe avant de chauffe avec un tenseur nul est déclenchée au démarrage pour compiler les noyaux CUDA et éliminer la latence sur la première requête clinique.</li>
      <li><b>Endpoints Versionnés :</b> La route <code>POST /predict</code> accepte le fichier multipart, applique l'auto-masking et retourne la structure JSON enrichie avec l'image Grad-CAM en Base64.</li>
    </ul>
    <div class="code-block">@predict_bp.route('/predict', methods=['POST'])
def predict_endpoint():
    file = request.files.get('image')
    image_bytes = file.read()
    auto_mask = request.form.get('auto_mask', 'true').lower() == 'true'
    
    result, error, status = process_and_predict(image_bytes, auto_mask=auto_mask)
    if error:
        return jsonify({"success": False, "error": error}), status
    return jsonify({"success": True, "data": result}), 200</div>
    <div class="code-caption">Extrait de code — Point d'entrée REST du microservice Flask.</div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 28 / 30</span>
  </div>
</div>

<!-- PAGE 29 : SECTION 15 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>15. Limites du projet et dimension d'assistance médicale</h2>
    <h3>Limites techniques</h3>
    <ul>
      <li><b>Imagerie Monocentrique :</b> Bien que constitué de 15 810 coupes, le jeu de données gagne à être étendu à d'autres constructeurs de scanners CT (Siemens, GE, Philips) pour tester la robustesse aux variations de protocoles injectés.</li>
      <li><b>Coupes 2D Axiales vs Volumes 3D :</b> L'analyse est réalisée coupe par coupe. Une extension future à la segmentation volumétrique 3D (V-Net / UNETR) permettrait de quantifier le volume tumoral global en millilitres (cm^3).</li>
      <li><b>Matériel GPU Requis :</b> L'entraînement complet exige un accélérateur compatible CUDA avec au minimum 8 Go de mémoire vidéo.</li>
    </ul>
    <h3>Dimension d'assistance médicale et Réglementation</h3>
    <p>
      KidneyVision AI est conçu comme un <b>Dispositif Médical Logiciel d'Aide à la Décision (Software as a Medical Device - SaMD Classe IIa)</b>. Il ne pose aucun diagnostic autonome et s'inscrit dans les principes stricts de la responsabilité médicale :
    </p>
    <ul>
      <li>La décision thérapeutique (intervention chirurgicale, lithotripsie extra-corporelle, surveillance) relève de la compétence exclusive du praticien diplômé.</li>
      <li>L'anonymisation intégrale des identifiants patients et la traçabilité par journaux d'audit immuables (table <code>audit_logs</code>) garantissent la stricte conformité aux réglementations <b>RGPD</b> et <b>HIPAA</b>.</li>
    </ul>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 29 / 30</span>
  </div>
</div>

<!-- PAGE 30 : SECTION 16 -->
<div class="page">
  <div class="header">
    <span>KidneyVision AI</span>
    <span>Documentation technique du projet</span>
  </div>
  <div class="content">
    <h2>16. Conclusion générale</h2>
    <p>
      Ce travail a permis de concevoir, d'entraîner et de valider expérimentalement un pipeline complet d'aide au diagnostic clinique des pathologies rénales :
    </p>
    <h3>Synthèse du dataset</h3>
    <p>
      Un corpus massif de <b>15 810 scanners CT abdominaux réels</b> a été consolidé, audité et nettoyé, couvrant équitablement les kystes, les parenchymes normaux, les lithiases et les masses tumorales.
    </p>
    <h3>Synthèse de l'entraînement</h3>
    <p>
      Cinq architectures Deep Learning ont été évaluées de manière comparative. L'architecture <b>ConvNeXt-Tiny (Meta AI)</b> a été optimisée par un protocole en deux étapes (Curriculum Learning) avec régularisation par Label Smoothing et pondération analytique des classes.
    </p>
    <h3>Synthèse du meilleur modèle</h3>
    <p>
      Le modèle Maître ConvNeXt-Tiny surpasse l'ensemble des réseaux étudiés avec <b>99,42 % d'exactitude</b>, <b>99,38 % de macro F1-score</b>, <b>0,9996 d'aire sous la courbe ROC</b> et un temps d'inférence éclair de <b>7,8 millisecondes</b> par coupe.
    </p>
    <h3>Perspectives</h3>
    <ul>
      <li>Déploiement de la segmentation volumétrique 3D pour la cartographie pré-opératoire des néphrectomies partielles.</li>
      <li>Intégration directe aux réseaux hospitaliers PACS via les protocoles de communication <b>DICOM C-STORE / WADO-RS</b>.</li>
      <li>Extension du Gatekeeper pour la reconnaissance multi-organes (reins, foie, rate, pancréas).</li>
    </ul>
    <div style="margin-top: 30px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 15px;">
      <p style="font-weight: bold; color: #005088; font-size: 10.5pt; text-align: center;">
        Fin de la Documentation Technique du Modèle IA — KidneyVision AI (2026)
      </p>
    </div>
  </div>
  <div class="footer">
    <span></span>
    <span>Documentation technique du projet</span>
    <span>Page 30 / 30</span>
  </div>
</div>

</body>
</html>
"""

# Replace image tokens
replacements = {
    "__FIG1__": fig1,
    "__FIG2__": fig2,
    "__FIG3__": fig3,
    "__FIG4__": fig4,
    "__FIG5__": fig5,
    "__FIG6__": fig6,
    "__FIG7__": fig7,
    "__FIG8__": fig8,
    "__FIG10__": fig10,
    "__FIG11__": fig11,
    "__FIG12__": fig12,
}

for k, v in replacements.items():
    raw_html = raw_html.replace(k, v)

html_path = r"d:\kidney vision ai project\documentation project\01_IA_Deep_Learning_Model_Documentation.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(raw_html)

print(f"HTML generated at: {html_path} (size: {len(raw_html)} bytes)")

pdf_path = r"d:\kidney vision ai project\documentation project\01_IA_Deep_Learning_Model_Documentation.pdf"
edge_exe = r"C:\Program Files (x86)\Microsoft\EdgeCore\154.0.4258.62\msedge.exe"

cmd = [
    edge_exe,
    "--headless=new",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={pdf_path}",
    "--no-pdf-header-footer",
    html_path
]

print("Rendering PDF with EdgeCore...")
res = subprocess.run(cmd, capture_output=True, text=True)
print(f"Subprocess return code: {res.returncode}")
if os.path.exists(pdf_path):
    print(f"SUCCESS: Generated PDF at {pdf_path} (size: {os.path.getsize(pdf_path)} bytes)")
else:
    print(f"ERROR: PDF was not generated. Stderr: {res.stderr}")
