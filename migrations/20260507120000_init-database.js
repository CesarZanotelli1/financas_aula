exports.shorthands = undefined;

exports.up = (pgm) => {
  // Criar tabela usuario
  pgm.createTable('usuario', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    nome: {
      type: 'varchar(100)',
      notNull: true,
    },
    login: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    email: {
      type: 'varchar(150)',
    },
    senha: {
      type: 'varchar(100)',
      notNull: true,
    },
    situacao: {
      type: 'varchar(20)',
      notNull: true,
      default: 'ativo',
    },
  }, { ifNotExists: true });

  // Criar tabela lancamento
  pgm.createTable('lancamento', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    descricao: {
      type: 'varchar(200)',
      notNull: true,
    },
    data_lancamento: {
      type: 'date',
      notNull: true,
    },
    valor: {
      type: 'numeric(12, 2)',
      notNull: true,
    },
    tipo_lancamento: {
      type: 'varchar(20)',
      notNull: true,
      check: 'tipo_lancamento IN (\'Receita\', \'Despesa\')',
    },
    situacao: {
      type: 'varchar(20)',
      notNull: true,
      default: 'ativo',
    },
  }, { ifNotExists: true });

  // Inserir usuário administrador
  pgm.sql(`
    INSERT INTO usuario (nome, login, email, senha, situacao)
    VALUES ('Administrador', 'admin', 'cesar.zanotelli@universo.univates.br', '123', 'ativo')
    ON CONFLICT (login) DO NOTHING;
  `);

  // Inserir dados de lançamentos iniciais apenas se a tabela estiver vazia
  pgm.sql(`
    INSERT INTO lancamento (descricao, data_lancamento, valor, tipo_lancamento, situacao)
    SELECT v.descricao, v.data_lancamento::date, v.valor::numeric, v.tipo_lancamento, v.situacao
    FROM (VALUES
      ('Salario Mensal', '2026-03-01', 5000.00, 'Receita', 'ativo'),
      ('Aluguel Apartamento', '2026-03-05', 1200.00, 'Despesa', 'ativo'),
      ('Freelance Projeto Web', '2026-03-08', 1500.00, 'Receita', 'ativo'),
      ('Contas de Luz e Agua', '2026-03-10', 350.00, 'Despesa', 'ativo'),
      ('Compras Supermercado', '2026-03-12', 450.00, 'Despesa', 'ativo'),
      ('Consulta Medica', '2026-03-15', 200.00, 'Despesa', 'ativo'),
      ('Bonus Empresa', '2026-03-18', 2000.00, 'Receita', 'ativo'),
      ('Internet e Telefone', '2026-03-20', 120.00, 'Despesa', 'ativo'),
      ('Venda de Produto Antigo', '2026-03-22', 300.00, 'Receita', 'ativo'),
      ('Compra de Equipamento', '2026-03-25', 800.00, 'Despesa', 'ativo')
    ) AS v(descricao, data_lancamento, valor, tipo_lancamento, situacao)
    WHERE NOT EXISTS (SELECT 1 FROM lancamento);
  `);
};

exports.down = (pgm) => {
  // Dropar tabelas na ordem correta (lancamento primeiro, depois usuario)
  pgm.dropTable('lancamento', { ifExists: true });
  pgm.dropTable('usuario', { ifExists: true });
};
