#!/bin/bash

# Cores para o terminal.
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
NC='\033[0m'

echo -e "${AZUL}=== [Deploy Manual da VM] ===${NC}"

# Etapa 1: atualiza o código com a branch principal.
echo -e "\n${AZUL}1. Atualizando o código fonte (Git Pull)...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${VERMELHO}Erro ao atualizar o repositório.${NC}"
    exit 1
fi

# O CI pesado já foi executado no GitHub Actions.
echo -e "${VERDE}CI concluída com sucesso no GitHub Actions. Pronto para selecionar o ambiente.${NC}"

echo -e "\n${AZUL}=============================================${NC}"
echo -e "Selecione o ambiente para atualização na VM:"
echo -e "1) ${VERDE}Homologação (Porta 3001)${NC}"
echo -e "2) ${AZUL}Produção (Porta 3000)${NC}"
echo -e "3) Sair"
echo -e "${AZUL}=============================================${NC}"
read -p "Escolha uma opção (1-3): " opcao

case $opcao in
    1)
        echo -e "\n${AZUL}Iniciando deploy em HOMOLOGAÇÃO...${NC}"
        echo -e "${AZUL}Atualizando contêineres do Docker...${NC}"
        sudo docker-compose -p homolog -f docker-compose.homolog.yml up -d --build
        sleep 5
        echo -e "${AZUL}Rodando Versionamento do Banco de Dados (Migrations)...${NC}"
        sudo docker run --rm --network homolog_default -v "$(pwd)":/app -w /app -e DATABASE_URL="postgres://postgres:123@db:5432/financas_db" node:18-alpine npm run migrate
        echo -e "${VERDE}Ambiente de Homologação atualizado com sucesso!${NC}"
        ;;
    2)
        echo -e "\n${AZUL}Iniciando deploy em PRODUÇÃO...${NC}"
        echo -e "${AZUL}Atualizando contêineres do Docker...${NC}"
        sudo docker-compose -p prod -f docker-compose.prod.yml up -d --build
        sleep 5
        echo -e "${AZUL}Rodando Versionamento do Banco de Dados (Migrations)...${NC}"
        sudo docker run --rm --network prod_default -v "$(pwd)":/app -w /app -e DATABASE_URL="postgres://postgres:123@db:5432/financas_db" node:18-alpine npm run migrate
        echo -e "${VERDE}Ambiente de Produção atualizado com sucesso!${NC}"
        ;;
    3)
        echo -e "Deploy cancelado pelo usuário."
        exit 0
        ;;
    *)
        echo -e "${VERMELHO}Opção inválida.${NC}"
        exit 1
        ;;
esac
