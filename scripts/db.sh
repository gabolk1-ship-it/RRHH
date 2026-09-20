#!/bin/bash

# Database Management Script for RRHH Project

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   RRHH Database Management Tool${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Functions
start_db() {
  echo -e "${GREEN}🚀 Iniciando base de datos...${NC}"
  docker-compose up -d
  echo -e "${GREEN}✅ Base de datos iniciada${NC}"
  echo -e "${BLUE}PostgreSQL: localhost:5432${NC}"
  echo -e "${BLUE}pgAdmin: http://localhost:5050${NC}"
}

stop_db() {
  echo -e "${GREEN}⏹️  Deteniendo base de datos...${NC}"
  docker-compose down
  echo -e "${GREEN}✅ Base de datos detenida${NC}"
}

restart_db() {
  echo -e "${GREEN}🔄 Reiniciando base de datos...${NC}"
  docker-compose restart
  echo -e "${GREEN}✅ Base de datos reiniciada${NC}"
}

status_db() {
  echo -e "${GREEN}📊 Estado de contenedores:${NC}"
  docker-compose ps
}

logs_db() {
  echo -e "${GREEN}📋 Logs de PostgreSQL:${NC}"
  docker logs -f rrhh-postgres
}

psql_cli() {
  echo -e "${GREEN}💬 Accediendo a PostgreSQL CLI...${NC}"
  docker exec -it rrhh-postgres psql -U rrhh_user -d rrhh_db
}

backup_db() {
  BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
  echo -e "${GREEN}💾 Creando backup...${NC}"
  docker exec rrhh-postgres pg_dump -U rrhh_user -d rrhh_db > "$BACKUP_FILE"
  echo -e "${GREEN}✅ Backup creado: $BACKUP_FILE${NC}"
}

restore_db() {
  if [ -z "$1" ]; then
    echo -e "${RED}❌ Especifica archivo de backup${NC}"
    echo "Uso: $0 restore <archivo.sql>"
    exit 1
  fi

  if [ ! -f "$1" ]; then
    echo -e "${RED}❌ Archivo no encontrado: $1${NC}"
    exit 1
  fi

  echo -e "${GREEN}📥 Restaurando base de datos...${NC}"
  docker exec -i rrhh-postgres psql -U rrhh_user -d rrhh_db < "$1"
  echo -e "${GREEN}✅ Backup restaurado${NC}"
}

reset_db() {
  echo -e "${RED}⚠️  ADVERTENCIA: Esto eliminará TODOS los datos${NC}"
  read -p "¿Continuar? (yes/no): " confirmation

  if [ "$confirmation" != "yes" ]; then
    echo "Cancelado"
    exit 0
  fi

  echo -e "${GREEN}🗑️  Reseteando base de datos...${NC}"
  docker-compose down -v
  docker-compose up -d
  echo -e "${GREEN}✅ Base de datos reseteada${NC}"
}

show_usage() {
  cat << EOF
Uso: $0 [comando]

Comandos:
  start      - Iniciar base de datos
  stop       - Detener base de datos
  restart    - Reiniciar base de datos
  status     - Ver estado de contenedores
  logs       - Ver logs de PostgreSQL
  cli        - Acceder a PostgreSQL CLI
  backup     - Crear backup de la BD
  restore    - Restaurar desde backup (uso: $0 restore archivo.sql)
  reset      - Reset completo de la BD (⚠️  elimina datos)
  help       - Mostrar esta ayuda

Ejemplos:
  $0 start
  $0 logs
  $0 backup
  $0 restore backup_20260920_120000.sql
  $0 reset
EOF
}

# Main command handling
COMMAND=${1:-help}

case "$COMMAND" in
  start)
    start_db
    ;;
  stop)
    stop_db
    ;;
  restart)
    restart_db
    ;;
  status)
    status_db
    ;;
  logs)
    logs_db
    ;;
  cli)
    psql_cli
    ;;
  backup)
    backup_db
    ;;
  restore)
    restore_db "$2"
    ;;
  reset)
    reset_db
    ;;
  help|--help|-h)
    show_usage
    ;;
  *)
    echo -e "${RED}❌ Comando desconocido: $COMMAND${NC}"
    show_usage
    exit 1
    ;;
esac

echo ""
