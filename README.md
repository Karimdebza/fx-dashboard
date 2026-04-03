# 📈 FX Predictor

> Prédiction du taux de change EUR → MAD, USD, GBP, JPY alimentée par un modèle de machine learning (Prophet).

🔗 **[Live Demo](https://fx-dashboard-beta.vercel.app/)**

---

## ✨ Fonctionnalités

- 📊 **Graphe interactif** — historique 60 jours + prédiction avec intervalle de confiance
- 🔄 **4 devises supportées** — MAD, USD, GBP, JPY
- 🎚️ **Horizon configurable** — prédiction de 1 à 30 jours
- 📉 **KPIs en temps réel** — taux actuel, tendance J+1, prédiction finale
- 📋 **Tableau de prédictions** — détail jour par jour avec min/max

---

## 🏗️ Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│   Frontend Angular  │ ──────▶│   Backend Flask      │
│   Vercel            │  HTTP  │   Render             │
│                     │◀────── │                      │
│  - Angular 17+      │  JSON  │  - Prophet (ML)      │
│  - Chart.js         │        │  - Frankfurter API   │
│  - TypeScript       │        │  - Cache modèles     │
└─────────────────────┘        └──────────────────────┘
```

---

## 🧠 Fonctionnement du modèle

1. **Données** — récupération de l'historique EUR/devise via [Frankfurter API](https://frankfurter.dev) (365 derniers jours)
2. **Features** — calcul de la moyenne mobile 7 jours (`ma7`) et de la volatilité (`volatility7`)
3. **Modèle** — entraînement [Prophet](https://facebook.github.io/prophet/) avec saisonnalité hebdomadaire et annuelle
4. **Cache** — le modèle est entraîné une seule fois par devise et mis en cache côté serveur
5. **Prédiction** — génération des prédictions avec intervalle de confiance (yhat_lower / yhat_upper)

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Angular 17, TypeScript, Chart.js, SCSS |
| Backend | Python, Flask, Flask-CORS |
| ML | Prophet (Meta), Pandas |
| Data | Frankfurter API (taux BCE) |
| Déploiement Frontend | Vercel |
| Déploiement Backend | Render |

---

## 🚀 Lancer en local

### Backend

```bash
git clone https://github.com/Karimdebza/ai_predictor
cd ai_predictor
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

L'API est disponible sur `http://localhost:5000`

### Frontend

```bash
git clone https://github.com/Karimdebza/fx-dashboard
cd fx-dashboard
npm install
ng serve
```

L'app est disponible sur `http://localhost:4200`

---

## 📡 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/predict?devise=USD&days=5` | GET | Prédiction pour une devise |
| `/health` | GET | Statut de l'API |

**Exemple de réponse `/predict` :**
```json
{
  "dates": ["2026-01-01", "..."],
  "historic": [1.18, "..."],
  "pred_dates": ["2026-04-04", "..."],
  "predictions": [1.156, "..."],
  "lower": [1.150, "..."],
  "upper": [1.161, "..."]
}
```

---

## 📁 Structure du projet

```
ai_predictor/          # Backend
├── app.py             # Routes Flask + cache
├── model.py           # Entraînement Prophet + prédiction
├── data.py            # Récupération données Frankfurter
└── requirements.txt

fx-dashboard/          # Frontend
├── src/
│   ├── app/
│   │   ├── components/dashboard/
│   │   └── services/fx.service.ts
│   └── environments/
│       ├── environment.ts        # Dev
│       └── environment.prod.ts   # Prod
└── angular.json
```

---

## ⚠️ Limites connues

- Le modèle Prophet est entraîné sur 365 jours de données — les prédictions long terme (> 15 jours) sont moins fiables
- Les taux de change sont influencés par des facteurs macro-économiques non capturés par le modèle
- Le cold start sur Render peut prendre ~30 secondes après inactivité

---

## 👨‍💻 Auteur

**Karim Debza** — Mastère Ingénierie Avancée du Logiciel (Bac+5)

[![GitHub](https://img.shields.io/badge/GitHub-Karimdebza-181717?logo=github)](https://github.com/Karimdebza)
