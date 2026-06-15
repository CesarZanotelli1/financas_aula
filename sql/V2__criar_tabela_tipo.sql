-- Tabela auxiliar para classificação de tipos.

CREATE TABLE IF NOT EXISTS tipo (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT
);