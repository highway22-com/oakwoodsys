# ============================================================
# Stage 1: Build Angular SSR (production bundle)
# ============================================================
FROM node:20-alpine AS build

WORKDIR /app

# Instalar todas las dependencias (incl. devDependencies para el build)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
  && npm cache clean --force

# Código fuente y build de producción
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Production runtime (imagen mínima y segura)
# ============================================================
FROM node:20-alpine AS production

# Usuario no root (seguridad)
RUN addgroup -g 1001 -S nodejs \
  && adduser -S angular -u 1001 -G nodejs

# Variables de entorno para Node en producción
ENV NODE_ENV=production
ENV PORT=4000

# Solo los artefactos necesarios del build
WORKDIR /app

COPY --from=build --chown=angular:nodejs /app/dist/oaw/server ./server
COPY --from=build --chown=angular:nodejs /app/dist/oaw/browser ./browser
COPY --from=build --chown=angular:nodejs /app/package.json ./

# Dependencias de producción por si server.mjs requiere módulos en runtime
RUN npm ci --omit=dev --ignore-scripts \
  && npm cache clean --force

USER angular

EXPOSE ${PORT}

# Health check (opcional; ajusta path si tu app expone /health)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+process.env.PORT+'/', (r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" || exit 1

# Angular SSR sirve estáticos desde ./browser y SSR desde ./server
CMD ["node", "server/server.mjs"]
