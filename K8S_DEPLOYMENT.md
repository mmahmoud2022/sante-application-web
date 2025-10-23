# 🚀 Déploiement Kubernetes (k3s) - Santé Application

## 📋 Vue d'Ensemble

L'application Santé peut maintenant être déployée sur un cluster Kubernetes (k3s) en production. Tous les manifestes et scripts nécessaires sont disponibles dans le répertoire `infrastructure/k8s/`.

## ✨ Nouveautés

### Manifestes Kubernetes Complets

- ✅ **11 manifestes YAML** pour tous les composants
- ✅ **Configuration via ConfigMaps** et Secrets
- ✅ **Volumes persistants** pour PostgreSQL, Redis et fichiers
- ✅ **Health checks** et readiness probes
- ✅ **Ingress configuré** avec Traefik (par défaut dans k3s)
- ✅ **Haute disponibilité** avec plusieurs replicas
- ✅ **Limites de ressources** configurées

### Scripts d'Automatisation

- 🚀 **deploy.sh** - Déploiement automatique complet
- 🔍 **check-status.sh** - Vérification de l'état du cluster
- ✅ **validate.sh** - Validation des manifestes
- 🧹 **cleanup.sh** - Nettoyage des ressources

### Documentation

- 📚 **README.md détaillé** (12KB) avec toutes les instructions
- 🎯 **DEPLOYMENT_GUIDE.md** - Guide de déploiement rapide
- 🏗️ **Architecture diagrams** et explications

## 🏗️ Architecture de Déploiement

```
Internet
   │
   ▼
┌─────────────────────┐
│   Ingress/Traefik   │  ← Point d'entrée HTTP/HTTPS
│   (k3s built-in)    │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌───▼────┐
│Frontend│   │Backend │  ← Services applicatifs
│(Next.js)│   │(FastAPI)│
│2 pods  │   │2 pods  │
└────────┘   └───┬────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼───┐      ┌─────▼─────┐
    │Celery │      │PostgreSQL │  ← Services de données
    │Worker │      │  + Redis  │
    │2 pods │      │  1 pod ea │
    └───────┘      └───────────┘
                         │
                    ┌────┴────┐
                    │   PVCs  │  ← Stockage persistant
                    │ 17 GB   │
                    └─────────┘
```

## 📦 Composants Déployés

### Services Applicatifs
- **Frontend (Next.js)**: 2 replicas - Interface utilisateur
- **Backend (FastAPI)**: 2 replicas - API REST
- **Celery Worker**: 2 replicas - Traitement asynchrone
- **Celery Beat**: 1 replica - Planificateur de tâches

### Services de Données
- **PostgreSQL 16**: Base de données principale (10 GB)
- **Redis 7**: Cache et message broker (2 GB)

### Stockage
- **Backend Uploads**: 5 GB pour les fichiers téléversés

### Réseau
- **Ingress Traefik**: Routage HTTP/HTTPS
- **Services ClusterIP**: Communication interne
- **NetworkPolicies**: Isolation réseau (optionnel)

## 🚀 Déploiement Rapide

### Prérequis

- Cluster k3s installé et fonctionnel
- `kubectl` configuré
- Images Docker disponibles dans un registre

### Déploiement en 3 Commandes

```bash
# 1. Préparer les secrets (obligatoire!)
cd infrastructure/k8s
nano 02-secrets.yaml  # Modifier les mots de passe

# 2. Déployer
./deploy.sh

# 3. Vérifier
./check-status.sh
```

### Accès à l'Application

Une fois déployé, l'application est accessible via :

- **Frontend**: http://sante.local
- **API Backend**: http://api.sante.local
- **Documentation API**: http://api.sante.local/docs

> **Note**: Ajoutez les domaines à votre fichier `/etc/hosts` ou configurez un DNS.

## 📊 Ressources Requises

### Minimum Recommandé

- **CPU**: 3.5 cores minimum
- **RAM**: 4 GB minimum
- **Stockage**: 20 GB minimum (pour les volumes persistants)

### Production Recommandée

- **CPU**: 8+ cores
- **RAM**: 16 GB
- **Stockage**: 100 GB SSD
- **Nodes**: 3+ pour la haute disponibilité

## 🔐 Sécurité

### Checklist Pré-Production

- [ ] Changer tous les mots de passe dans `02-secrets.yaml`
- [ ] Générer une clé secrète forte (`SECRET_KEY`)
- [ ] Configurer HTTPS avec des certificats valides
- [ ] Utiliser un registre Docker privé
- [ ] Configurer les NetworkPolicies
- [ ] Activer RBAC avec permissions minimales
- [ ] Mettre en place le monitoring (Prometheus/Grafana)
- [ ] Configurer les backups automatiques
- [ ] Activer les logs centralisés

### Secrets à Configurer

Les secrets suivants **DOIVENT** être modifiés avant la production :

```yaml
# Dans 02-secrets.yaml :
- POSTGRES_PASSWORD      # Mot de passe PostgreSQL
- SECRET_KEY            # Clé secrète backend (64+ caractères)
- SMTP_USER/PASSWORD    # Credentials email
- TWILIO_*              # Configuration SMS
- STRIPE_*              # Configuration paiements
- AWS_*                 # Configuration stockage cloud
- GOOGLE_CLIENT_*       # OAuth2 Google
```

## 📚 Documentation Complète

Pour plus de détails, consultez :

1. **[infrastructure/k8s/README.md](infrastructure/k8s/README.md)** - Documentation complète (12KB)
   - Instructions détaillées étape par étape
   - Commandes kubectl avancées
   - Guide de dépannage complet
   - Configuration du monitoring
   - Gestion des backups

2. **[infrastructure/k8s/DEPLOYMENT_GUIDE.md](infrastructure/k8s/DEPLOYMENT_GUIDE.md)** - Guide rapide
   - Déploiement en 3 étapes
   - Architecture visuelle
   - Commandes essentielles
   - Dépannage rapide

## 🔧 Scripts Disponibles

### deploy.sh
Déploiement automatique complet avec :
- Création du namespace
- Application des ConfigMaps et Secrets
- Déploiement des services dans l'ordre
- Attente de la disponibilité
- Exécution des migrations
- Affichage du statut

```bash
./infrastructure/k8s/deploy.sh
```

### check-status.sh
Vérification complète de l'état :
- Statut de tous les pods
- État des déploiements
- Services et ingress
- Tests de connectivité
- Événements récents
- Utilisation des ressources

```bash
./infrastructure/k8s/check-status.sh
```

### validate.sh
Validation des manifestes :
- Vérification de la syntaxe YAML
- Validation avec kubectl (si cluster disponible)
- Détection des erreurs

```bash
./infrastructure/k8s/validate.sh
```

### cleanup.sh
Nettoyage sécurisé :
- Suppression des déploiements
- Option de conservation des données
- Confirmation interactive

```bash
./infrastructure/k8s/cleanup.sh
```

## 🎯 Cas d'Usage

### Développement Local

```bash
# Installer k3s localement
curl -sfL https://get.k3s.io | sh -

# Déployer l'application
cd infrastructure/k8s
./deploy.sh

# Accéder avec port-forward
kubectl port-forward svc/frontend 3000:3000 -n sante
kubectl port-forward svc/backend 8000:8000 -n sante
```

### Staging/Production

```bash
# 1. Préparer les images
docker build -t registry.example.com/sante-backend:v1.0.0 ./backend
docker push registry.example.com/sante-backend:v1.0.0

docker build -t registry.example.com/sante-frontend:v1.0.0 ./frontend
docker push registry.example.com/sante-frontend:v1.0.0

# 2. Mettre à jour les manifestes
# Éditer les fichiers *-deployment.yaml avec les nouvelles images

# 3. Configurer les secrets de production
nano infrastructure/k8s/02-secrets.yaml

# 4. Déployer
kubectl apply -k infrastructure/k8s/

# 5. Configurer HTTPS
# Ajouter les certificats TLS dans 10-ingress.yaml
```

## 🔄 Mise à Jour de l'Application

### Rolling Update

```bash
# Construire la nouvelle version
docker build -t registry/sante-backend:v1.1.0 ./backend
docker push registry/sante-backend:v1.1.0

# Mettre à jour
kubectl set image deployment/backend backend=registry/sante-backend:v1.1.0 -n sante

# Suivre le déploiement
kubectl rollout status deployment/backend -n sante

# Rollback si nécessaire
kubectl rollout undo deployment/backend -n sante
```

## 📈 Monitoring et Observabilité

### Logs

```bash
# Logs en temps réel
kubectl logs -f deployment/backend -n sante
kubectl logs -f deployment/frontend -n sante

# Logs de tous les pods
kubectl logs -l app=backend -n sante --all-containers=true
```

### Métriques

```bash
# Utilisation des ressources
kubectl top pods -n sante
kubectl top nodes

# Déployer Prometheus/Grafana (optionnel)
# Voir infrastructure/monitoring/
```

### Health Checks

Tous les services disposent de :
- **Liveness probes** - Redémarrage automatique si le service est bloqué
- **Readiness probes** - Trafic routé uniquement vers les pods prêts
- **Startup probes** - Temps de démarrage suffisant

## 🆘 Support et Dépannage

### Problèmes Courants

1. **Pods en CrashLoopBackOff**
   ```bash
   kubectl logs pod/nom-du-pod -n sante --previous
   kubectl describe pod/nom-du-pod -n sante
   ```

2. **Connexion à la base de données**
   ```bash
   kubectl exec -it deployment/backend -n sante -- nc -zv postgres 5432
   ```

3. **Images non trouvées**
   - Vérifier que les images sont publiées dans le registre
   - Mettre à jour les références dans les manifestes

4. **Volumes en Pending**
   - k3s utilise le storageClass `local-path` par défaut
   - Vérifier avec `kubectl get storageclass`

### Obtenir de l'Aide

1. Consultez la documentation complète : `infrastructure/k8s/README.md`
2. Exécutez le script de diagnostic : `./check-status.sh`
3. Vérifiez les événements : `kubectl get events -n sante`
4. Ouvrez une issue sur GitHub avec les logs

## 🔗 Ressources Utiles

- **Documentation k3s**: https://docs.k3s.io/
- **Documentation Kubernetes**: https://kubernetes.io/docs/
- **Kustomize**: https://kustomize.io/
- **Traefik Ingress**: https://doc.traefik.io/traefik/

## 📝 Notes de Version

### v1.0.0 - Déploiement Initial

- ✅ Manifestes Kubernetes complets pour tous les composants
- ✅ Scripts d'automatisation (deploy, check-status, cleanup, validate)
- ✅ Documentation complète en français
- ✅ Support k3s avec configuration Traefik
- ✅ Volumes persistants pour PostgreSQL, Redis et uploads
- ✅ Health checks et resource limits configurés
- ✅ Support multi-replicas pour haute disponibilité
- ✅ Configuration via ConfigMaps et Secrets

## 🤝 Contribution

Pour améliorer le déploiement Kubernetes :

1. Testez les manifestes sur votre cluster
2. Signalez les problèmes via GitHub Issues
3. Proposez des améliorations via Pull Requests
4. Partagez vos configurations de production (sans secrets!)

---

**🎉 L'application Santé est maintenant prête pour le déploiement en production sur Kubernetes!**

Pour commencer, consultez : [infrastructure/k8s/DEPLOYMENT_GUIDE.md](infrastructure/k8s/DEPLOYMENT_GUIDE.md)
