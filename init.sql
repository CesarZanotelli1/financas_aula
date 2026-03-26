CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  login VARCHAR(50) NOT NULL UNIQUE,
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

INSERT INTO usuario (nome, login, senha, situacao)
VALUES ('Administrador', 'admin', '123', 'ativo')
ON CONFLICT (login) DO NOTHING;

INSERT INTO lancamento (descricao, data_lancamento, valor, tipo_lancamento, situacao)
VALUES
  ('Salario Mensal', '2026-03-01', 5000.00, 'Receita', 'ativo'),
  ('Aluguel Apartamento', '2026-03-05', 1200.00, 'Despesa', 'ativo'),
  ('Freelance Projeto Web', '2026-03-08', 1500.00, 'Receita', 'ativo'),
  ('Contas de Luz e Agua', '2026-03-10', 350.00, 'Despesa', 'ativo'),
  ('Compras Supermercado', '2026-03-12', 450.00, 'Despesa', 'ativo'),
  ('Consulta Medica', '2026-03-15', 200.00, 'Despesa', 'ativo'),
  ('Bonus Empresa', '2026-03-18', 2000.00, 'Receita', 'ativo'),
  ('Internet e Telefone', '2026-03-20', 120.00, 'Despesa', 'ativo'),
  ('Venda de Produto Antigo', '2026-03-22', 300.00, 'Receita', 'ativo'),
  ('Compra de Equipamento', '2026-03-25', 800.00, 'Despesa', 'ativo');
