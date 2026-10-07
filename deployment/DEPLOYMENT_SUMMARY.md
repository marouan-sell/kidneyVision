# 🏥 KidneyVision AI — Guide Complet & Résumé de Déploiement Production (Azure)

Ce document récapitule l'architecture, la configuration de production, les correctifs critiques appliqués, ainsi que la procédure opérationnelle pour maintenir et mettre à jour la plateforme **KidneyVision AI** hébergée sur **Microsoft Azure**.

---

## 📌 1. Informations Générales de l'Infrastructure

| Paramètre | Valeur de Production |
| :--- | :--- |
| **Fournisseur Cloud** | Microsoft Azure |
| **Région** | Denmark East |
| **Machine Virtuelle** | `kidneyvision-vm` (`Standard_B2als_v2` — 2 vCPU, 4 GiB RAM) |
| **Système d'Exploitation** | Ubuntu Server 24.04 LTS x64 |
| **Adresse IP Publique** | `9.205.29.254` |
| **Accès SSH Sécurisé** | `azureuser@9.205.29.254` (Clé privée : `kidneyvision-key.pem`) |
| **Dépôt GitHub** | [https://github.com/marouan-sell/kidneyVision](https://github.com/marouan-sell/kidneyVision) |
| **Branches de Production** | `main` & `mossaab-nm` |

---

## 🏛️ 2. Architecture des Microservices & Sécurité

L'application est orchestrée avec **Docker Compose** en 3 conteneurs isolés sur un réseau interne :

```text
[ Navigateur Client / Clinique ]
                │  Port 80 (HTTP) & 443 (HTTPS)
                ▼
┌─────────────────────────── Azure VM (9.205.29.254) ───────────────────────────┐
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    Conteneur 1 : kidneyvision-frontend                  │  │
│  │      Nginx Reverse Proxy Gateway + SPA React 19 (Dist Vite minifiée)     │  │
│  └────────────────────────────────────┬────────────────────────────────────┘  │
│                                       │ (Réseau Interne Docker)               │
│                   ┌───────────────────┴───────────────────┐                   │
│                   ▼                                       ▼                   │
│  ┌─────────────────────────────────┐   ┌───────────────────────────────────┐  │
│  │ Conteneur 2 : backend           │   │ Conteneur 3 : ai-service          │  │
│  │ Laravel 12 API (PHP 8.2-FPM)   │◄─►│ Flask / PyTorch Deep Learning     │  │
│  │ Port 8000 (Non exposé à Internet│   │ Port 5000 (Non exposé à Internet) │  │
│  │ SQLite Database & Local Storage │   │ ConvNeXt-Tiny + MobileNetV3 Gate  │  │
│  └─────────────────────────────────┘   └───────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 🔒 Règles de Sécurité Appliquées :
1. **Ports Publics Ouverts** : Uniquement `80` (HTTP), `443` (HTTPS), et `22` (SSH protégé par clé).
2. **Ports Internes Isolés** : Les ports `8000` (Laravel) et `5000` (Flask AI) sont strictement fermés au public (`expose` uniquement, aucun mapping d'hôte direct).
3. **Firewall UFW & Fail2ban** : Activés sur l'OS hôte pour prévenir les attaques par force brute.
4. **Sauvegarde Automatisée Quotidienne** : Un script de sauvegarde `deployment/backup.sh` s'exécute automatiquement chaque nuit à 02:00 via un cron job (`0 2 * * * /home/azureuser/backup.sh`) et archive la base SQLite ainsi que le stockage des échographies.

---

## 🛠️ 3. Résumé des Correctifs Critiques Résolus en Production

### 1. Correctif du Bug des 35 Scans à l'Inscription
* **Symptôme** : Tout nouvel utilisateur inscrit voyait immédiatement **Total Scans = 35** dans le tableau de bord avant même d'avoir importé un scanner. Dès le premier scan réel, le compteur chutait à 1.
* **Origine / Cause Racine** :
  * Dans `frontend-react/src/pages/Dashboard.tsx`, le code exécutait un fallback ternaire : `backendScans.length > 0 ? backendScans : MOCK_SCANS`.
  * Pour un nouvel utilisateur avec 0 scan, `backendScans` était vide (`[]`), déclenchant le jeu de données de test `MOCK_SCANS`.
  * Filtré par la plage par défaut de 30 jours (`filterScansByDateRange`), ce mock contenait **exactement 35 analyses**.
* **Résolution** :
  * Suppression définitive du fallback vers `MOCK_SCANS` pour les utilisateurs authentifiés.
  * Le Dashboard affiche désormais strictement les données réelles de la base de données.
  * Ajout d'un état vide explicite : *"No scans recorded yet. Upload an ultrasound scan to begin analysis."*.
  * Neutralisation des badges d'évolution ("+12.5% vs previous 30d") lorsque le total est égal à 0.

### 2. Permissions Docker Backend
* Configuration des droits d'écriture sur `bootstrap/cache` et `storage` dans `Dockerfile.backend` pour éviter les erreurs `500 Internal Server Error` lors de l'exécution de Composer.

### 3. Factory WSGI du Microservice IA
* Synchronisation de l'application factory Gunicorn (`app:create_app()`) avec `ai-flask-service/app/__init__.py` pour garantir le démarrage en mode production multi-workers.

---

## 🔄 4. Procédure Opérationnelle : Comment Déployer des Modifications ?

Pour mettre à jour le projet en production sans interruption de service :

### Étape 1 : Modification & Validation Locale (Sur votre PC)
```bash
# 1. Effectuer vos modifications de code
# 2. Tester le build frontend en local
npm --prefix frontend-react run build
```

### Étape 2 : Sauvegarde sur GitHub
```bash
git add .
git commit -m "feat/fix: description claire du changement"
git push origin mossaab-nm
```

### Étape 3 : Récupération sur le Serveur Azure
Connectez-vous en SSH à la machine virtuelle :
```bash
ssh -i kidneyvision-key.pem azureuser@9.205.29.254
cd ~/kidneyVision
git pull origin mossaab-nm
```

### Étape 4 : Reconstruction du Conteneur Concerné (Zéro Downtime)

* **Si la modification concerne le Frontend (React / Nginx) :**
  ```bash
  sudo docker compose build frontend
  sudo docker compose up -d --no-deps frontend
  ```

* **Si la modification concerne le Backend (Laravel / Migrations) :**
  ```bash
  sudo docker exec kidneyvision-backend php artisan migrate --force
  sudo docker exec kidneyvision-backend php artisan config:clear
  ```

* **Si la modification concerne l'Intelligence Artificielle (Flask / PyTorch) :**
  ```bash
  sudo docker compose build ai-service
  sudo docker compose up -d --no-deps ai-service
  ```

---

## 📋 5. Antisèche des Commandes Utiles (Cheatsheet)

| Action | Commande sur le Serveur Azure |
| :--- | :--- |
| **Vérifier l'état des conteneurs** | `sudo docker ps` |
| **Voir les logs en direct** | `sudo docker compose logs -f --tail=100` |
| **Voir les logs du Backend** | `sudo docker logs -f kidneyvision-backend` |
| **Voir les logs de l'IA** | `sudo docker logs -f kidneyvision-ai-service` |
| **Redémarrer la pile complète** | `sudo docker compose restart` |
| **Exécuter un backup manuel** | `sudo /home/azureuser/backup.sh` |
| **Consulter les backups existants** | `ls -lh /home/azureuser/backups/` |

---

## ✅ 6. Rapport de Validation des Tests (Live sur Azure)

Tests automatisés exécutés sur `http://9.205.29.254/api` :

| Test | Action | Résultat Attendu | Résultat Obtenu | Statut |
| :---: | :--- | :---: | :---: | :---: |
| **Test 1** | Inscription d'un nouveau radiologue | `Total Scans = 0` | `0` (Analyses: 0, Stats: 0) | **PASSÉ ✅** |
| **Test 2** | Première prédiction IA réussie | `Total Scans = 1` | `1` (+1 incrémenté) | **PASSÉ ✅** |
| **Test 3** | Deuxième prédiction IA réussie | `Total Scans = 2` | `2` (+1 incrémenté) | **PASSÉ ✅** |
| **Test 4** | Quota Guest (5 scans gratuits) | Fonctionnel | Scan invité exécuté avec succès | **PASSÉ ✅** |
| **Test 5** | Sécurité Ports Internes | `8000` & `5000` bloqués | Inaccessibles depuis l'extérieur | **PASSÉ ✅** |

---
*Dernière mise à jour : 07 Octobre 2026 — Plateforme validée et active en production.*
