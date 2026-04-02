# Pokémon Deal Hunter IA

Application exploitable pour détecter des deals Pokémon en comparant des annonces à une référence Cardmarket.

## Ce qui est réellement pris en charge

- **eBay France** via l'API officielle Browse d'eBay.
- **Cardmarket** via l'API officielle 2.0 de Cardmarket.
- Interface web locale prête à lancer.
- Déduplication, scoring, seuil minimum, rapport synthétique.

## Ce qui n'est pas activé par défaut

- **Vinted** : l'API officielle Vinted Pro est réservée à des comptes professionnels allowlistés et documentée comme une API d'intégration d'inventaire, pas comme une API publique de recherche globale. Il faut donc un accès Pro allowlisté ou un prestataire externe autorisé.
- **Le Bon Coin** : aucun endpoint officiel public de recherche n'est fourni ici. L'adaptateur est laissé désactivé.

## Prérequis

- Node.js 20+
- Un compte eBay Developers Program
- Des identifiants Cardmarket API

## Installation

```bash
npm install
cp .env.example .env
npm start
```

Puis ouvrir `http://localhost:3000`

## Variables d'environnement

Renseigne `.env` :

- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`
- `CARDMARKET_APP_TOKEN`
- `CARDMARKET_APP_SECRET`
- `CARDMARKET_ACCESS_TOKEN`
- `CARDMARKET_ACCESS_SECRET`

## Mode démo

Si tu laisses `ALLOW_DEMO_MODE=true`, l'application fonctionne sans clés mais avec données simulées. Cela permet de tester l'interface, pas de produire des vrais deals.

## Architecture

- `public/index.html` : interface utilisateur
- `src/server.js` : API Express
- `src/services/ebay.js` : recherche eBay officielle
- `src/services/cardmarket.js` : recherche Cardmarket officielle + OAuth 1.0
- `src/services/hunt.js` : orchestration
- `src/services/demo.js` : fallback local

## Endpoints

- `GET /api/health`
- `POST /api/hunt`
- `POST /api/report`

## Note importante

Cette version est **vraiment exploitable** pour le couple **eBay + Cardmarket**, à condition de fournir tes clés officielles.  
Pour **Vinted** et **Le Bon Coin**, j'ai volontairement laissé des drapeaux désactivés plutôt que d'ajouter un scraping fragile ou juridiquement incertain.
