# 🚀 Déploiement Kubernetes pour Santé Application

Ce répertoire contient les manifestes Kubernetes pour déployer l'application Santé sur un cluster k3s.

## 📋 Prérequis

- Un cluster k3s fonctionnel
- `kubectl` installé et configuré
- (Optionnel) `kustomize` pour un déploiement simplifié
- Accès à un registre Docker pour héberger les images (Docker Hub, GitLab Registry, etc.)

## 🏗️ Architecture de Déploiement

L'application est composée des services suivants :

1. **PostgreSQL** - Base de données principale (StatefulSet)
2. **Redis** - Cache et message broker (StatefulSet)
3. **Backend** - API FastAPI (Deployment avec 2 replicas)
4. **Celery Worker** - Workers de tâches asynchrones (Deployment avec 2 replicas)
5. **Celery Beat** - Scheduler de tâches (Deployment avec 1 replica)
6. **Frontend** - Application Next.js (Deployment avec 2 replicas)
7. **Ingress** - Routage des requêtes HTTP/HTTPS

## 📦 Structure des Manifestes

```
infrastructure/k8s/
├── 00-namespace.yaml              # Namespace 'sante'
├── 01-configmap.yaml              # Configuration non-sensible
├── 02-secrets.yaml                # Configuration sensible (à modifier!)
├── 03-pvc.yaml                    # Volumes persistants
├── 04-postgres-deployment.yaml    # Déploiement PostgreSQL
├── 05-redis-deployment.yaml       # Déploiement Redis
├── 06-backend-deployment.yaml     # Déploiement Backend API
├── 07-celery-worker-deployment.yaml  # Déploiement Celery Workers
├── 08-celery-beat-deployment.yaml    # Déploiement Celery Beat
├── 09-frontend-deployment.yaml    # Déploiement Frontend
├── 10-ingress.yaml                # Configuration Ingress
├── kustomization.yaml             # Configuration Kustomize
└── README.md                      # Ce fichier
```

## 🔧 Préparation

### 1. Construire et Publier les Images Docker

Avant de déployer, vous devez construire et publier vos images Docker :

```bash
# Backend
cd backend
docker build -t votre-registry/sante-backend:latest .
docker push votre-registry/sante-backend:latest

# Frontend
cd ../frontend
docker build -t votre-registry/sante-frontend:latest .
docker push votre-registry/sante-frontend:latest
```

**Important :** Mettez à jour les références d'images dans les fichiers suivants :
- `06-backend-deployment.yaml` (ligne 57)
- `07-celery-worker-deployment.yaml` (ligne 50)
- `08-celery-beat-deployment.yaml` (ligne 43)
- `09-frontend-deployment.yaml` (ligne 34)

### 2. Configurer les Secrets

**⚠️ IMPORTANT :** Le fichier `02-secrets.yaml` contient des valeurs par défaut. **Vous DEVEZ les modifier** avant le déploiement en production !

```bash
# Éditez le fichier des secrets
nano infrastructure/k8s/02-secrets.yaml

# Ou générez des secrets sécurisés avec :
kubectl create secret generic sante-secrets \
  --from-literal=POSTGRES_USER=votre_utilisateur \
  --from-literal=POSTGRES_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=SECRET_KEY=$(openssl rand -base64 64) \
  --namespace=sante \
  --dry-run=client -o yaml > 02-secrets-custom.yaml
```

Modifiez les valeurs suivantes au minimum :
- `POSTGRES_PASSWORD`
- `SECRET_KEY`
- Credentials SMTP, Twilio, Stripe, AWS, Google OAuth

### 3. Configurer le ConfigMap

Éditez `01-configmap.yaml` pour adapter :
- Les URLs de l'application (`NEXT_PUBLIC_API_URL`, etc.)
- Les paramètres SMTP
- Les politiques CORS

### 4. Configurer l'Ingress

Éditez `10-ingress.yaml` pour :
- Modifier les domaines (`sante.local`, `api.sante.local`)
- Activer HTTPS si nécessaire
- Configurer cert-manager pour Let's Encrypt (optionnel)

Ajoutez les domaines à votre fichier `/etc/hosts` pour le test local :
```bash
echo "127.0.0.1 sante.local api.sante.local" | sudo tee -a /etc/hosts
```

## 🚀 Déploiement

### Méthode 1 : Avec Kustomize (Recommandé)

```bash
# Déployer tous les manifestes
kubectl apply -k infrastructure/k8s/

# Ou avec kustomize installé séparément
kustomize build infrastructure/k8s/ | kubectl apply -f -
```

### Méthode 2 : Déploiement Manuel

```bash
# Appliquer les manifestes dans l'ordre
kubectl apply -f infrastructure/k8s/00-namespace.yaml
kubectl apply -f infrastructure/k8s/01-configmap.yaml
kubectl apply -f infrastructure/k8s/02-secrets.yaml
kubectl apply -f infrastructure/k8s/03-pvc.yaml
kubectl apply -f infrastructure/k8s/04-postgres-deployment.yaml
kubectl apply -f infrastructure/k8s/05-redis-deployment.yaml

# Attendre que la base de données soit prête
kubectl wait --for=condition=ready pod -l app=postgres -n sante --timeout=120s

# Exécuter les migrations
kubectl exec -it deployment/backend -n sante -- alembic upgrade head

# Déployer le reste des services
kubectl apply -f infrastructure/k8s/06-backend-deployment.yaml
kubectl apply -f infrastructure/k8s/07-celery-worker-deployment.yaml
kubectl apply -f infrastructure/k8s/08-celery-beat-deployment.yaml
kubectl apply -f infrastructure/k8s/09-frontend-deployment.yaml
kubectl apply -f infrastructure/k8s/10-ingress.yaml
```

## 🔍 Vérification du Déploiement

```bash
# Vérifier tous les pods
kubectl get pods -n sante

# Vérifier les services
kubectl get svc -n sante

# Vérifier l'ingress
kubectl get ingress -n sante

# Voir les logs d'un service
kubectl logs -f deployment/backend -n sante

# Vérifier l'état détaillé
kubectl get all -n sante
```

Tous les pods doivent être en état `Running` :
```
NAME                              READY   STATUS    RESTARTS   AGE
postgres-xxxx                     1/1     Running   0          5m
redis-xxxx                        1/1     Running   0          5m
backend-xxxx                      1/1     Running   0          3m
backend-yyyy                      1/1     Running   0          3m
celery-worker-xxxx                1/1     Running   0          3m
celery-worker-yyyy                1/1     Running   0          3m
celery-beat-xxxx                  1/1     Running   0          3m
frontend-xxxx                     1/1     Running   0          2m
frontend-yyyy                     1/1     Running   0          2m
```

## 📝 Exécuter les Migrations

Après le premier déploiement, exécutez les migrations :

```bash
kubectl exec -it deployment/backend -n sante -- alembic upgrade head
```

## 🌐 Accès à l'Application

Une fois déployé, accédez à :

- **Frontend** : http://sante.local (ou votre domaine configuré)
- **Backend API** : http://api.sante.local (ou votre domaine configuré)
- **Documentation API** : http://api.sante.local/docs

Si vous utilisez le routage sur un seul hôte (`sante-ingress-single-host`) :
- **Frontend** : http://sante.local
- **Backend API** : http://sante.local/api
- **Documentation API** : http://sante.local/docs

## 🔄 Mise à Jour de l'Application

### Mise à jour d'une image

```bash
# Construire et publier la nouvelle image
docker build -t votre-registry/sante-backend:v1.1.0 ./backend
docker push votre-registry/sante-backend:v1.1.0

# Mettre à jour le deployment
kubectl set image deployment/backend backend=votre-registry/sante-backend:v1.1.0 -n sante

# Suivre le rollout
kubectl rollout status deployment/backend -n sante
```

### Mise à jour de la configuration

```bash
# Éditer le ConfigMap
kubectl edit configmap sante-config -n sante

# Redémarrer les pods pour appliquer les changements
kubectl rollout restart deployment/backend -n sante
kubectl rollout restart deployment/frontend -n sante
```

## 🔐 Gestion des Secrets

### Créer un nouveau secret

```bash
kubectl create secret generic mon-secret \
  --from-literal=cle=valeur \
  -n sante
```

### Mettre à jour un secret existant

```bash
kubectl delete secret sante-secrets -n sante
kubectl apply -f infrastructure/k8s/02-secrets.yaml
kubectl rollout restart deployment/backend -n sante
```

## 📊 Monitoring et Logs

### Voir les logs

```bash
# Logs d'un service spécifique
kubectl logs -f deployment/backend -n sante

# Logs de tous les pods d'un deployment
kubectl logs -f deployment/backend --all-containers=true -n sante

# Logs d'un pod spécifique
kubectl logs -f pod/backend-xxxx -n sante

# Logs Celery
kubectl logs -f deployment/celery-worker -n sante
```

### Surveiller les ressources

```bash
# Utilisation des ressources
kubectl top pods -n sante
kubectl top nodes

# Événements du cluster
kubectl get events -n sante --sort-by='.lastTimestamp'
```

### Accéder à un pod

```bash
# Shell interactif dans le backend
kubectl exec -it deployment/backend -n sante -- /bin/bash

# Exécuter une commande
kubectl exec deployment/backend -n sante -- python -c "print('Hello')"
```

## 🐛 Dépannage

### Pod en erreur CrashLoopBackOff

```bash
# Voir les logs
kubectl logs pod/nom-du-pod -n sante --previous

# Décrire le pod
kubectl describe pod/nom-du-pod -n sante
```

### Problèmes de connexion à la base de données

```bash
# Vérifier que PostgreSQL est accessible
kubectl exec -it deployment/backend -n sante -- nc -zv postgres 5432

# Vérifier les variables d'environnement
kubectl exec deployment/backend -n sante -- env | grep DATABASE
```

### Problèmes de volumes persistants

```bash
# Vérifier les PVC
kubectl get pvc -n sante

# Vérifier les PV
kubectl get pv

# Décrire un PVC
kubectl describe pvc postgres-data-pvc -n sante
```

### Redémarrer un service

```bash
kubectl rollout restart deployment/backend -n sante
```

## 🧹 Nettoyage

### Supprimer tous les ressources

```bash
# Avec Kustomize
kubectl delete -k infrastructure/k8s/

# Ou manuellement
kubectl delete namespace sante

# Supprimer les PV (si nécessaire)
kubectl delete pv --all
```

### Supprimer uniquement l'application (garder les données)

```bash
kubectl delete deployment --all -n sante
kubectl delete service --all -n sante
kubectl delete ingress --all -n sante
```

## 🔒 Sécurité en Production

### Checklist de sécurité

- [ ] Modifier tous les mots de passe par défaut dans `02-secrets.yaml`
- [ ] Générer une clé secrète forte pour `SECRET_KEY`
- [ ] Configurer HTTPS avec cert-manager ou certificats manuels
- [ ] Limiter l'accès aux services avec NetworkPolicies
- [ ] Activer RBAC et limiter les permissions
- [ ] Configurer les limites de ressources appropriées
- [ ] Activer le monitoring avec Prometheus/Grafana
- [ ] Configurer les backups automatiques de la base de données
- [ ] Utiliser un registre privé pour les images Docker
- [ ] Activer les politiques de sécurité des pods (PSP/PSA)

### NetworkPolicy exemple

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: sante
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8000
```

## 📚 Ressources Supplémentaires

- [Documentation k3s](https://docs.k3s.io/)
- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Traefik Ingress Controller](https://doc.traefik.io/traefik/providers/kubernetes-ingress/)

## 💡 Astuces

### Scale horizontal

```bash
# Augmenter le nombre de replicas
kubectl scale deployment/backend --replicas=3 -n sante

# Auto-scaling (HPA)
kubectl autoscale deployment backend --cpu-percent=80 --min=2 --max=10 -n sante
```

### Port-forward pour tests locaux

```bash
# Accéder au backend localement
kubectl port-forward svc/backend 8000:8000 -n sante

# Accéder à PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n sante
```

### Backup de la base de données

```bash
# Créer un backup
kubectl exec deployment/postgres -n sante -- pg_dump -U sante_user sante_db > backup.sql

# Restaurer un backup
kubectl exec -i deployment/postgres -n sante -- psql -U sante_user sante_db < backup.sql
```

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez les logs avec `kubectl logs`
2. Consultez les événements avec `kubectl get events`
3. Ouvrez une issue sur GitHub
