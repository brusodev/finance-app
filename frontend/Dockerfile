FROM node:22-alpine AS build

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Receber variável de build (após COPY para invalidar cache quando mudar)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Estágio de produção com nginx
FROM nginx:alpine

# Copiar build do React
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx (se necessário)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
