const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'financas_db',
  port: process.env.DB_PORT || 5432,
});

pool.connect()
  .then((client) => {
    console.log('Conexao com PostgreSQL estabelecida com sucesso.');
    client.release();
  })
  .catch((error) => {
    console.error('Falha ao conectar ao PostgreSQL:', error.message);
  });

// Configurar EJS como view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'financas-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60,
  },
}));

function autenticarSessao(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  return next();
}

const listarLancamentos = async (req, res) => {
  try {
    // Executar SELECT * FROM lancamento
    const result = await pool.query('SELECT * FROM lancamento ORDER BY data_lancamento DESC');

    // Enviar dados para a view de listagem
    res.render('listagem', {
      lancamentos: result.rows,
      totalLancamentos: result.rows.length,
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    res.status(500).render('listagem', {
      lancamentos: [],
      totalLancamentos: 0,
      usuario: req.session.usuario,
      erro: 'Erro ao buscar dados do banco de dados',
    });
  }
};

app.get('/login', (req, res) => {
  if (req.session.usuario) {
    return res.redirect('/lancamentos');
  }
  return res.render('login', { erro: null });
});

app.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  try {
    const query = `
      SELECT id, nome, login
      FROM usuario
      WHERE login = $1 AND senha = $2 AND situacao = 'ativo'
      LIMIT 1
    `;
    const result = await pool.query(query, [login, senha]);

    if (result.rows.length === 0) {
      return res.status(401).render('login', {
        erro: 'Login ou senha inválidos.',
      });
    }

    req.session.usuario = result.rows[0];
    return res.redirect('/lancamentos');
  } catch (error) {
    console.error('Erro ao validar login:', error);
    return res.status(500).render('login', {
      erro: 'Erro interno ao validar login.',
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Rotas principais
app.get('/', autenticarSessao, listarLancamentos);
app.get('/lancamentos', autenticarSessao, listarLancamentos);

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
