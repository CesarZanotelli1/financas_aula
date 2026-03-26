-- Criar banco de dados
CREATE DATABASE financas_db;

-- Conectar ao banco de dados
\c financas_db;

-- Tabela usuario
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  login VARCHAR(50) NOT NULL UNIQUE,
  senha VARCHAR(100) NOT NULL,
  situacao VARCHAR(20) NOT NULL DEFAULT 'ativo'
);

-- Tabela lancamento
CREATE TABLE lancamento (
  id SERIAL PRIMARY KEY,
  descricao VARCHAR(200) NOT NULL,
  data_lancamento DATE NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  tipo_lancamento VARCHAR(20) NOT NULL,
  situacao VARCHAR(20) NOT NULL DEFAULT 'ativo'
);

-- INSERT para usuario
INSERT INTO usuario (nome, login, senha, situacao) 
VALUES ('Administrador', 'admin', 'senha123', 'ativo');

-- INSERT para lancamentos (10 registros - mesclando receitas e despesas)
INSERT INTO lancamento (descricao, data_lancamento, valor, tipo_lancamento, situacao) 
VALUES 
  ('Salário Mensal', '2026-03-01', 5000.00, 'receita', 'ativo'),
  ('Aluguel Apartamento', '2026-03-05', -1200.00, 'despesa', 'ativo'),
  ('Freelance - Projeto Web', '2026-03-08', 1500.00, 'receita', 'ativo'),
  ('Contas de Luz e Água', '2026-03-10', -350.00, 'despesa', 'ativo'),
  ('Compras Supermercado', '2026-03-12', -450.00, 'despesa', 'ativo'),
  ('Consulta Médica', '2026-03-15', -200.00, 'despesa', 'ativo'),
  ('Bônus Empresa', '2026-03-18', 2000.00, 'receita', 'ativo'),
  ('Internet e Telefone', '2026-03-20', -120.00, 'despesa', 'ativo'),
  ('Venda de Produto Antigo', '2026-03-22', 300.00, 'receita', 'ativo'),
  ('Compra de Equipamento', '2026-03-25', -800.00, 'despesa', 'ativo');
