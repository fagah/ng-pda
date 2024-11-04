# Étape 1 : Construire l'application Angular
FROM node:alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --configuration=production 

# Étape 2 : Exécuter dans NGINX
FROM nginx:alpine

# Supprimer la configuration par défaut de NGINX et copier la configuration personnalisée
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# Copier les fichiers construits d'Angular vers le répertoire NGINX
COPY --from=build /app/dist/ng-pda/browser /usr/share/nginx/html

# Exposer le port 80 pour le trafic HTTP
EXPOSE 80

# Démarrer NGINX
CMD ["nginx", "-g", "daemon off;"]
