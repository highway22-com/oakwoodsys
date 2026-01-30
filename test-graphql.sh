#!/bin/bash

echo "🔌 Test de Conexión GraphQL"
echo "============================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

GRAPHQL_URL="https://oakwoodsys.com/graphql"
PROXY_URL="http://localhost:4200/api/graphql"

QUERY='{"query":"query { posts { nodes { id title slug } } }"}'

echo "1️⃣ Probando conexión directa a WordPress..."
echo "   URL: $GRAPHQL_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d "$QUERY" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Conexión directa exitosa!${NC}"
    echo "$BODY" | head -c 200
    echo "..."
else
    echo -e "${RED}❌ Error en conexión directa (HTTP $HTTP_CODE)${NC}"
    echo "   Esto es normal si WordPress no tiene CORS configurado"
    echo ""
fi

echo ""
echo "2️⃣ Probando conexión a través del proxy..."
echo "   URL: $PROXY_URL"
echo "   (Asegúrate de que el servidor Angular esté corriendo: ng serve)"
echo ""

PROXY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROXY_URL" \
  -H "Content-Type: application/json" \
  -d "$QUERY" 2>&1)

PROXY_HTTP_CODE=$(echo "$PROXY_RESPONSE" | tail -n1)
PROXY_BODY=$(echo "$PROXY_RESPONSE" | sed '$d')

if [ "$PROXY_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Conexión con proxy exitosa!${NC}"
    echo "$PROXY_BODY" | head -c 200
    echo "..."
else
    echo -e "${YELLOW}⚠️  Error en proxy (HTTP $PROXY_HTTP_CODE)${NC}"
    echo "   Asegúrate de que:"
    echo "   1. El servidor Angular esté corriendo (ng serve)"
    echo "   2. El endpoint /api/graphql esté configurado en server.ts"
    echo ""
    echo "Respuesta:"
    echo "$PROXY_BODY"
fi

echo ""
echo "============================"
echo "✅ Test completado"
