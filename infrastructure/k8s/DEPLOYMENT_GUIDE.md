# 🎯 Guide de Déploiement Rapide - Santé Application sur K3s

## 📦 Contenu du Package

Ce package contient tous les manifestes Kubernetes nécessaires pour déployer l'application Santé sur un cluster k3s.

### Manifestes Kubernetes (17 fichiers)

| Fichier | Description |
|---------|-------------|
| `00-namespace.yaml` | Création du namespace 'sante' |
| `01-configmap.yaml` | Configuration de l'application (non-sensible) |
| `02-secrets.yaml` | Secrets et données sensibles (⚠️ À MODIFIER!) |
| `03-pvc.yaml` | Volumes persistants (PostgreSQL, Redis, uploads) |
| `04-postgres-deployment.yaml` | Base de données PostgreSQL 16 |
| `05-redis-deployment.yaml` | Cache et message broker Redis 7 |
| `06-backend-deployment.yaml` | API Backend FastAPI (2 replicas) |
| `07-celery-worker-deployment.yaml` | Workers Celery (2 replicas) |
| `08-celery-beat-deployment.yaml` | Scheduler Celery Beat (1 replica) |
| `09-frontend-deployment.yaml` | Application Frontend Next.js (2 replicas) |
| `10-ingress.yaml` | Routage HTTP/HTTPS avec Traefik |
| `kustomization.yaml` | Configuration Kustomize |

### Scripts Utilitaires (4 scripts)

| Script | Description |
|--------|-------------|
| `deploy.sh` | 🚀 Déploiement automatique complet |
| `check-status.sh` | 🔍 Vérification de l'état du déploiement |
| `validate.sh` | ✅ Validation des manifestes YAML |
| `cleanup.sh` | 🧹 Nettoyage et suppression des ressources |

### Documentation

- `README.md` - Documentation complète et détaillée (12KB)
- `DEPLOYMENT_GUIDE.md` - Ce guide de déploiement rapide

## 🚀 Déploiement en 3 Étapes

### Étape 1 : Préparation

```bash
# 1. Construire et publier les images Docker
cd backend
docker build -t votre-registry/sante-backend:latest .
docker push votre-registry/sante-backend:latest

cd ../frontend
docker build -t votre-registry/sante-frontend:latest .
docker push votre-registry/sante-frontend:latest

# 2. Mettre à jour les références d'images dans les manifestes
# Éditez les fichiers suivants et remplacez 'mmahmoud2022/sante-*' par votre registry :
# - 06-backend-deployment.yaml (ligne 57)
# - 07-celery-worker-deployment.yaml (ligne 50)
# - 08-celery-beat-deployment.yaml (ligne 43)
# - 09-frontend-deployment.yaml (ligne 34)

# 3. ⚠️ IMPORTANT : Mettre à jour les secrets
nano infrastructure/k8s/02-secrets.yaml
# Changez au minimum :
# - POSTGRES_PASSWORD
# - SECRET_KEY (générez avec : openssl rand -base64 64)
# - Credentials SMTP, Stripe, AWS, etc.
```

### Étape 2 : Déploiement

```bash
# Méthode automatique (recommandée)
cd infrastructure/k8s
./deploy.sh

# OU Méthode avec Kustomize
kubectl apply -k infrastructure/k8s/

# OU Méthode manuelle
kubectl apply -f infrastructure/k8s/00-namespace.yaml
kubectl apply -f infrastructure/k8s/01-configmap.yaml
kubectl apply -f infrastructure/k8s/02-secrets.yaml
kubectl apply -f infrastructure/k8s/03-pvc.yaml
kubectl apply -f infrastructure/k8s/04-postgres-deployment.yaml
kubectl apply -f infrastructure/k8s/05-redis-deployment.yaml
kubectl apply -f infrastructure/k8s/06-backend-deployment.yaml
kubectl apply -f infrastructure/k8s/07-celery-worker-deployment.yaml
kubectl apply -f infrastructure/k8s/08-celery-beat-deployment.yaml
kubectl apply -f infrastructure/k8s/09-frontend-deployment.yaml
kubectl apply -f infrastructure/k8s/10-ingress.yaml
```

### Étape 3 : Vérification

```bash
# Vérifier le statut
./check-status.sh

# Ou manuellement
kubectl get pods -n sante
kubectl get svc -n sante
kubectl get ingress -n sante

# Accéder à l'application
# Ajoutez à /etc/hosts :
# <NODE-IP> sante.local api.sante.local

# Puis accédez à :
# - Frontend: http://sante.local
# - API: http://api.sante.local
# - Docs: http://api.sante.local/docs
```

## 🎯 Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                        Ingress (Traefik)                      │
│                    sante.local / api.sante.local             │
└──────────────────┬──────────────────┬───────────────────────┘
                   │                   │
         ┌─────────▼──────────┐  ┌───▼────────────────┐
         │  Frontend Service  │  │  Backend Service   │
         │    (Port 3000)     │  │   (Port 8000)      │
         └─────────┬──────────┘  └───┬────────────────┘
                   │                   │
         ┌─────────▼──────────┐  ┌───▼────────────────┐
         │  Frontend Pods     │  │  Backend Pods      │
         │   (2 replicas)     │  │   (2 replicas)     │
         └────────────────────┘  └───┬────────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
      ┌─────────▼──────┐  ┌─────────▼──────┐  ┌────────▼────────┐
      │ Celery Worker  │  │  Celery Beat   │  │   PostgreSQL    │
      │ (2 replicas)   │  │  (1 replica)   │  │  (StatefulSet)  │
      └────────┬───────┘  └────────┬───────┘  └─────────────────┘
               │                    │
               └────────┬───────────┘
                        │
                 ┌──────▼──────┐
                 │    Redis    │
                 │ (Cache/MQ)  │
                 └─────────────┘

Volumes Persistants:
├── postgres-data-pvc (10Gi)
├── redis-data-pvc (2Gi)
└── backend-uploads-pvc (5Gi)
```

## 📊 Ressources Déployées

### Services (9 pods au total)

- **PostgreSQL**: 1 pod (base de données)
- **Redis**: 1 pod (cache et message queue)
- **Backend**: 2 pods (API REST)
- **Celery Worker**: 2 pods (tâches asynchrones)
- **Celery Beat**: 1 pod (planificateur)
- **Frontend**: 2 pods (interface web)

### Stockage

- **PostgreSQL Data**: 10 GB (données de la base)
- **Redis Data**: 2 GB (cache persistant)
- **Backend Uploads**: 5 GB (fichiers téléversés)

### Ressources CPU/Mémoire

| Service | CPU Request | CPU Limit | Mémoire Request | Mémoire Limit |
|---------|-------------|-----------|-----------------|---------------|
| PostgreSQL | 250m | 1000m | 256Mi | 1Gi |
| Redis | 100m | 500m | 128Mi | 512Mi |
| Backend | 500m | 2000m | 512Mi | 2Gi |
| Celery Worker | 250m | 1000m | 256Mi | 1Gi |
| Celery Beat | 100m | 500m | 128Mi | 512Mi |
| Frontend | 500m | 2000m | 512Mi | 2Gi |

**Total (minimum)**: ~3.4 CPU cores, ~3 GB RAM

## 🔧 Commandes Utiles

### Gestion des Pods

```bash
# Voir les logs
kubectl logs -f deployment/backend -n sante
kubectl logs -f deployment/frontend -n sante
kubectl logs -f deployment/celery-worker -n sante

# Accéder à un pod
kubectl exec -it deployment/backend -n sante -- /bin/bash

# Redémarrer un déploiement
kubectl rollout restart deployment/backend -n sante
```

### Base de Données

```bash
# Exécuter les migrations
kubectl exec -it deployment/backend -n sante -- alembic upgrade head

# Accéder à PostgreSQL
kubectl exec -it deployment/postgres -n sante -- psql -U sante_user -d sante_db

# Backup de la base
kubectl exec deployment/postgres -n sante -- pg_dump -U sante_user sante_db > backup.sql

# Restaurer un backup
kubectl exec -i deployment/postgres -n sante -- psql -U sante_user sante_db < backup.sql
```

### Scaling

```bash
# Scaler manuellement
kubectl scale deployment/backend --replicas=3 -n sante
kubectl scale deployment/celery-worker --replicas=4 -n sante

# Auto-scaling (HPA)
kubectl autoscale deployment backend --cpu-percent=80 --min=2 --max=10 -n sante
```

### Debugging

```bash
# État détaillé d'un pod
kubectl describe pod/backend-xxxx -n sante

# Événements du namespace
kubectl get events -n sante --sort-by='.lastTimestamp'

# Utilisation des ressources
kubectl top pods -n sante
kubectl top nodes

# Tester la connectivité
kubectl exec -it deployment/backend -n sante -- nc -zv postgres 5432
kubectl exec -it deployment/backend -n sante -- nc -zv redis 6379
```

## 🔒 Checklist de Sécurité

Avant la mise en production, vérifiez :

- [ ] Tous les mots de passe ont été changés dans `02-secrets.yaml`
- [ ] La clé secrète `SECRET_KEY` est forte (64+ caractères)
- [ ] Les images Docker proviennent d'un registre privé sécurisé
- [ ] HTTPS est configuré avec des certificats valides
- [ ] Les limites de ressources sont appropriées
- [ ] Les backups automatiques sont configurés
- [ ] Le monitoring est en place (Prometheus/Grafana)
- [ ] Les logs sont centralisés
- [ ] Les NetworkPolicies sont configurées
- [ ] RBAC est activé avec les permissions minimales

## 🆘 Dépannage Rapide

### Pod en CrashLoopBackOff

```bash
kubectl logs pod/nom-du-pod -n sante --previous
kubectl describe pod/nom-du-pod -n sante
```

### Problèmes de connexion à la DB

```bash
# Vérifier les variables d'env
kubectl exec deployment/backend -n sante -- env | grep DATABASE

# Tester la connexion
kubectl exec -it deployment/backend -n sante -- nc -zv postgres 5432
```

### Image non trouvée

```bash
# Vérifier l'image
kubectl describe pod/backend-xxxx -n sante | grep -A 5 "Events:"

# Solution : mettre à jour l'image dans le deployment
kubectl set image deployment/backend backend=votre-registry/sante-backend:latest -n sante
```

### PVC bloqué en Pending

```bash
# Vérifier le PVC
kubectl describe pvc postgres-data-pvc -n sante

# Vérifier les storageClass disponibles
kubectl get storageclass

# Solution : k3s utilise 'local-path' par défaut
```

## 📚 Ressources

- **Documentation complète**: Voir `README.md`
- **Documentation k3s**: https://docs.k3s.io/
- **Documentation Kubernetes**: https://kubernetes.io/docs/
- **Traefik Ingress**: https://doc.traefik.io/traefik/providers/kubernetes-ingress/

## 🤝 Support

Pour toute question :
1. Consultez le `README.md` complet
2. Vérifiez les logs avec `./check-status.sh`
3. Ouvrez une issue sur GitHub

---

**Note**: Ce guide est un résumé. Consultez `README.md` pour la documentation complète et détaillée.
