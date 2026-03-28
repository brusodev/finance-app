FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci

# Receber variável de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiar código e fazer build
COPY . .
RUN npm run build

# Estágio de produção com nginx
FROM nginx:alpine

# Copiar build do React
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx (se necessário)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
