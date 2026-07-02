# APEX Project Kanban & Roadmap

## 🚀 Étape 1 : Initialisation de l'écosystème (Monorepo)
- [x] Initialiser le monorepo avec Nx (`apex-workspace`)
- [x] Générer l'application backend NestJS (`apex-core`)
- [x] Générer l'application frontend Angular (`apex-hud`)
- [x] Créer la librairie de types partagés (`shared-interfaces`) et définir les premiers types (`ApexState`, `ApexStreamChunk`, `SystemMetrics`)

## ⚡ Étape 2 : Le Back-End NestJS (Orchestrateur & IA)
- [x] Installer les dépendances WebSockets (`@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `systeminformation`)
- [x] Créer le `JarvisGateway` (ou `ApexGateway`) pour gérer les connexions temps réel
- [x] Configurer le pipeline de streaming RxJS pour le serveur
- [x] Intégrer le moteur d'IA (Mise en place d'Ollama en local ou SDK API Cloud)
- [x] Créer le service de monitoring système (`systeminformation`)


## 🌀 Étape 3 : Le Front-End Angular (La Structure & RxJS)
- [x] Configurer l'application Angular en mode Standalone
- [x] Créer le service de communication WebSocket (`ApexWebSocketService`) via RxJS
- [x] Mettre en place la gestion d'état globale avec les Angular Signals (`state`, `currentResponse`, `systemMetrics`)
- [x] Implémenter le service de reconnaissance vocale via l'API Web Speech du navigateur

## 🎨 Étape 4 : L'Interface Graphique (Style HUD / FUI)
- [x] Créer le layout principal en CSS Grid (Dashboard immersif en mode sombre)
- [x] Concevoir le composant "Central Core" (L'orbe réactif) en SVG avec animations CSS
- [x] Connecter les animations du Core aux signaux d'état d'APEX (`IDLE`, `THINKING`, `LISTENING`)
- [x] Développer le widget de monitoring système (Graphiques / Jauges numériques)
- [x] Développer le widget de flux de texte (Effet machine à écrire pour le streaming du LLM)



## 🔊 Étape 5 : Peaufinage & Immersion
- [x] Intégrer la synthèse vocale (Text-to-Speech) dans Angular pour faire parler APEX en temps réel
- [x] Ajouter des effets sonores futuristes discrets lors des changements d'état


- [x] *Optionnel :* Configurer Electron pour encapsuler l'application Angular dans une fenêtre de bureau transparente

## 🛠️ Étape 6 : Modularisation, Métriques Réelles & Mémoire Évolutive
- [x] Réorganiser le frontend en 6 widgets standalone (`widgets/`) via sélecteurs d'attributs pour conserver la grille CSS d'origine.
- [x] Résoudre les désynchronisations de rendu Angular (`NgZone.run()`) sur les flux WebSocket et les événements micro.
- [x] Stabiliser la synthèse vocale (gestion de la file d'attente contre le garbage collection et les blocages).
- [x] Filtrer les astérisques Markdown et les métadonnées pour éviter que l'IA ne les lise à haute voix.
- [x] Ajouter un bouton de coupure globale de la voix (`MUTE_VOICE`) dans le panneau de commande.
- [x] Connecter les métriques système à des sondes matérielles réelles (vitesse, température, charge CPU et RAM en Go).
- [x] Développer le widget `ACTIVE_PROCESS_MONITOR` (top 5 des processus consommant le plus de CPU en temps réel).
- [x] Implémenter la mémoire persistante locale (`memory.json`) de l'IA (commandes `souviens-toi de : ...`).
- [x] Injecter la mémoire et les compétences (skills) d'APEX dans le prompt système d'Ollama.
- [x] Corriger et mockér les suites de tests unitaires Jest pour qu'elles passent toutes au vert (100% OK).
