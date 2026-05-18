#!/bin/bash

# Cores para o terminal
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
NC='\033[0m' # Sem cor

echo -e "${AZUL}=== [Pipeline Semi-Automatizado de CI/CD] ===${NC}"

# 1. Git Pull
echo -e "\n${AZUL}1. Atualizando o código fonte (Git Pull)...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${VERMELHO}Erro ao atualizar o repositório.${NC}"
    exit 1
fi

# 2. Instalar Dependências
echo -e "\n${AZUL}2. Instalando dependências (npm install)...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${VERMELHO}Erro ao instalar dependências.${NC}"
    exit 1
fi

# 3. Análise de Qualidade (Lint)
echo -e "\n${AZUL}3. Executando Revisão de Qualidade de Código (ESLint)...${NC}"
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${VERMELHO}Falha na análise de qualidade de código. Corrija os erros antes do deploy.${NC}"
    exit 1
fi
echo -e "${VERDE}Qualidade de código validada com sucesso!${NC}"

# 4. Testes Automatizados (Exibir Estatísticas)
echo -e "\n${AZUL}4. Executando Testes Automatizados e Cobertura...${NC}"
npm test
if [ $? -ne 0 ]; then
    echo -e "${VERMELHO}Alguns testes falharam. Deploy cancelado para proteger o ambiente.${NC}"
    exit 1
fi
echo -e "${VERDE}Todos os testes passaram com sucesso!${NC}"

# 5. Seleção do Ambiente
echo -e "\n${AZUL}=============================================${NC}"
echo -e "Deseja atualizar qual ambiente na VM?"
echo -e "1) ${VERDE}Homologação (Porta 3001)${NC}"
echo -e "2) ${AZUL}Produção (Porta 3000)${NC}"
echo -e "3) Sair"
echo -e "${AZUL}=============================================${NC}"
read -p "Escolha uma opção (1-3): " opcao

case $opcao in
    1)
        echo -e "\n${AZUL}Iniciando deploy em HOMOLOGAÇÃO...${NC}"
        echo -e "${AZUL}Atualizando contêineres do Docker...${NC}"
        docker-compose -f docker-compose.homolog.yml up -d --build
        sleep 5
        # Força a migration local a apontar para a porta exposta de homologação (5433)
        export DATABASE_URL="postgres://postgres:123@127.0.0.1:5433/financas_db"
        echo -e "${AZUL}Rodando Versionamento do Banco de Dados (Migrations)...${NC}"
        npm run migrate
        echo -e "${VERDE}Ambiente de Homologação atualizado com sucesso!${NC}"
        ;;
    2)
        echo -e "\n${AZUL}Iniciando deploy em PRODUÇÃO...${NC}"
        echo -e "${AZUL}Atualizando contêineres do Docker...${NC}"
        docker-compose -f docker-compose.prod.yml up -d --build
        sleep 5
        # Força a migration local a apontar para a porta exposta de produção (5432)
        export DATABASE_URL="postgres://postgres:123@127.0.0.1:5432/financas_db"
        echo -e "${AZUL}Rodando Versionamento do Banco de Dados (Migrations)...${NC}"
        npm run migrate
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
