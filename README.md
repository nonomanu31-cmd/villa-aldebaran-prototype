# Prototype Villa Aldebaran

Ce dossier contient la base technique minimale du prototype prompts.

## Agents branches en V1

- `EKT`
- `Vie`
- `Juridique`
- `Conseil 3 IA`

## Etat actuel

- structure de projet en place ;
- cockpit minimal ;
- route API OpenAI branchee ;
- historique local JSON ;
- registre d'agents ;
- prompts de base stockes dans `/prompts`.

## Suite recommandee

1. installer Node.js et npm
2. lancer `npm install`
3. creer `.env.local` a partir de `.env.example`
4. renseigner `OPENAI_API_KEY`
5. lancer `npm run dev`

## Deploiement cible

Le prototype est maintenant prepare pour :
- un acces web partout ;
- une installation telephone via ajout a l'ecran d'accueil.

Voir aussi :
- `../DEPLOIEMENT_WEB_TELEPHONE.md`

## Configuration environnement

Copiez `.env.example` en `.env.local` puis renseignez :

```text
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.2
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Vous pouvez changer `OPENAI_MODEL` si vous voulez utiliser un autre modele.
L'agent `Conseil 3 IA` fonctionne meme si une ou deux cles manquent, mais il compare mieux quand les trois connecteurs sont renseignes.
