# ========== STAGE 1: Build Frontend ==========
FROM node:20-alpine as frontend-build

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para rodar o vite build)
# Usando --legacy-peer-deps para evitar conflitos de versão se houver
RUN npm ci --legacy-peer-deps

# Copia o código fonte
COPY . .

# Builda o React App (Gera pasta 'dist')
RUN npm run build


# ========== STAGE 2: Setup Backend ==========
FROM node:20-alpine

# Install wget for healthcheck if needed (usually in alpine, but ensuring)
# RUN apk add --no-cache wget

WORKDIR /app

# Copia o package.json do Backend
COPY server/package*.json ./

# Instala deps de produção do backend
RUN npm install --production

# Copia código do backend
COPY server/ ./

# Copia o build do frontend do Stage 1 para a pasta 'public' ou 'dist' do backend
# No server/index.js precisamos configurar app.use(express.static('dist'))
COPY --from=frontend-build /app/server/dist ./dist

# Expõe porta do backend
EXPOSE 3001

# Inicia servidor
CMD ["node", "index.js"]
