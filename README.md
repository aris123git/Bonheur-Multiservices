# 🤖 Bonheur Multiservices — Bot WhatsApp 1xBet

Assistant WhatsApp intelligent pour la gestion des dépôts et retraits 1xBet. Propulsé par Claude (Anthropic) et déployé sur une infrastructure Node.js/Express avec tableau de bord d'administration intégré.

---

## ✨ Fonctionnalités

### 💬 Bot WhatsApp (Awa)
- Persona naturelle et chaleureuse en français informel ouest-africain
- Collecte guidée des informations étape par étape (une question à la fois)
- Gestion des **dépôts** et **retraits** 1xBet via mobile money (Orange, Moov, Wave)
- Récapitulatif de la demande avant validation
- Historique de conversation par utilisateur (mémoire persistante en base de données)
- Commande `/reset` pour effacer l'historique et repartir de zéro

### 🎙️ Messages vocaux
- Transcription automatique des notes vocales WhatsApp via OpenAI Whisper
- Le message vocal est converti en texte et traité comme un message normal
- Réponse toujours en texte français, quel que soit le format d'entrée
- Formats supportés : OGG, MP3, MP4, WebM, WAV, AMR

### 💸 Gestion des transactions
- Enregistrement automatique en base de données dès que le client confirme
- Notification WhatsApp instantanée à l'agent à chaque nouvelle demande
- Statuts : **En attente** → **Confirmé** / **Annulé**
- Message de confirmation automatique envoyé au client lors de la validation

### 🖥️ Tableau de bord admin (`/admin`)
- Authentification par mot de passe (stocké hashé en base de données)
- Possibilité de changer le mot de passe depuis le dashboard
- **File d'attente** : transactions en attente avec boutons Confirmer / Annuler
- **Historique complet** : toutes les transactions avec statuts colorés
- Recherche et filtrage par statut, client, opérateur, montant, ID 1xBet
- Rafraîchissement automatique toutes les 15 secondes

---

## 🛠️ Stack technique

| Composant | Technologie |
|---|---|
| Serveur | Node.js + Express 5 |
| IA conversationnelle | Anthropic Claude (`claude-sonnet-4-6`) |
| Transcription vocale | OpenAI Whisper (`gpt-4o-mini-transcribe`) |
| WhatsApp | Twilio WhatsApp Business API |
| Base de données | PostgreSQL + Drizzle ORM |
| Authentification admin | Cookie signé (scrypt hash) |
| Monorepo | pnpm workspaces |
| Déploiement | Replit Reserved VM |

---

## ⚙️ Variables d'environnement

Toutes les variables sensibles sont stockées dans les **Secrets Replit** et ne doivent jamais être commitées dans le code.

### Twilio

| Variable | Description | Exemple |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | SID de votre compte Twilio | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Token d'authentification Twilio | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_WHATSAPP_NUMBER` | Numéro WhatsApp Twilio (avec préfixe) | `whatsapp:+14155238886` |

### Agent & Sécurité

| Variable | Description | Exemple |
|---|---|---|
| `AGENT_PHONE_NUMBER` | Numéro WhatsApp de l'agent (notifications) | `+22507000000` |
| `ADMIN_PASSWORD` | Mot de passe initial du tableau de bord admin | `bonheur2024` |
| `SESSION_SECRET` | Clé secrète pour signer les cookies de session | Chaîne aléatoire longue |

> **Note :** `ADMIN_PASSWORD` n'est utilisé qu'au premier login. Dès la première connexion, le mot de passe est hashé et stocké en base de données. Pour réinitialiser, supprimez la ligne `admin_password_hash` de la table `admin_config`.

### IA (auto-configurées par Replit)

| Variable | Description |
|---|---|
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | URL proxy OpenAI (configurée automatiquement) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Clé proxy OpenAI (configurée automatiquement) |

---

## 🚀 Déploiement

Ce projet tourne sur **Replit Reserved VM** pour garantir une disponibilité 24h/24.

### URL du webhook Twilio

Après déploiement, configurez Twilio avec l'URL suivante :

```
https://<votre-domaine>.replit.app/api/whatsapp/webhook
```

Méthode : **HTTP POST**

### Configuration Twilio

1. Connectez-vous à [console.twilio.com](https://console.twilio.com)
2. Allez dans **Messaging → Senders → WhatsApp senders**
3. Sélectionnez votre numéro WhatsApp Sandbox ou Business
4. Dans **Webhook**, collez l'URL ci-dessus
5. Sauvegardez

---

## 📁 Structure du projet

```
/
├── artifacts/
│   └── api-server/          # Serveur Express principal
│       └── src/
│           ├── lib/
│           │   ├── claudeBot.ts      # Logique IA + outil create_transaction
│           │   ├── twilio.ts         # Client Twilio + envoi messages
│           │   ├── transcription.ts  # Transcription vocale Whisper
│           │   └── adminAuth.ts      # Hash/vérification mot de passe admin
│           ├── routes/
│           │   ├── whatsapp.ts       # Webhook Twilio + détection vocale
│           │   └── admin.ts          # API transactions (liste/confirmer/annuler)
│           └── pages/
│               ├── admin.ts          # Dashboard HTML
│               ├── adminLogin.ts     # Page de connexion
│               └── changePassword.ts # Page changement de mot de passe
└── lib/
    └── db/                  # Schéma PostgreSQL + Drizzle ORM
        └── src/schema/
            ├── whatsappConversations.ts
            ├── whatsappMessages.ts
            ├── whatsappTransactions.ts
            └── adminConfig.ts
```

---

## 🔄 Flux de traitement d'une transaction

```
Client WhatsApp
     │
     ▼
Twilio Webhook → /api/whatsapp/webhook
     │
     ├─ Message vocal ? → Transcription Whisper → Texte
     │
     ▼
Claude (Awa) — collecte les informations une par une
     │
     ▼
Récapitulatif envoyé au client
     │
     ▼ (client confirme)
create_transaction() → PostgreSQL
     │
     ├─ Notification WhatsApp → Agent (AGENT_PHONE_NUMBER)
     │
     ▼
Agent consulte /admin → Confirme la transaction
     │
     ▼
Message de confirmation WhatsApp → Client 🙏
```

---

## 🔐 Sécurité

- Les mots de passe admin sont hashés avec **scrypt** (sel aléatoire 16 octets, dérivation 64 octets)
- Les cookies de session sont signés avec `SESSION_SECRET`
- Les routes `/admin` et `/api/admin/*` sont protégées — redirection ou `401` si non authentifié
- La signature Twilio est vérifiée sur chaque webhook en production
- Aucun secret n'est stocké en clair dans le code ou les fichiers

---

*Développé pour Bonheur Multiservices · Propulsé par Replit*
