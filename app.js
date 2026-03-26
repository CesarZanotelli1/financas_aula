const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'financas_db',
  port: process.env.DB_PORT || 5432,
});

// Configurar EJS como view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rota principal - GET '/'
app.get('/', async (req, res) => {
  try {
    // Executar SELECT * FROM lancamento
    const result = await pool.query('SELECT * FROM lancamento ORDER BY data_lancamento DESC');
    
    // Enviar dados para a view
    res.render('index', {
      lancamentos: result.rows,
      totalLancamentos: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    res.status(500).render('index', {
      lancamentos: [],
      totalLancamentos: 0,
      erro: 'Erro ao buscar dados do banco de dados'
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Pressione Ctrl+C para parar...');
});

// Tratador de erro para fechar conexões corretamente
process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor...');
  await pool.end();
  process.exit(0);
});
