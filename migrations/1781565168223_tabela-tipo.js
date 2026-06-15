exports.up = (pgm) => {
  pgm.createTable('tipo', {
    id: 'id',
    nome: { type: 'varchar(255)', notNull: true },
    descricao: { type: 'text' }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('tipo');
};