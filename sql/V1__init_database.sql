-- Schema base do sistema financeiro.

CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  login VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150),
  senha VARCHAR(100) NOT NULL,
  situacao VARCHAR(20) NOT NULL DEFAULT 'ativo'
);

CREATE TABLE IF NOT EXISTS lancamento (
  id SERIAL PRIMARY KEY,
  descricao VARCHAR(200) NOT NULL,
  data_lancamento DATE NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  tipo_lancamento VARCHAR(20) NOT NULL CHECK (tipo_lancamento IN ('Receita', 'Despesa')),
  situacao VARCHAR(20) NOT NULL DEFAULT 'ativo'
);