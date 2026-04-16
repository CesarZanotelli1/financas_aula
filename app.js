const express = require("express");
const session = require("express-session");
const { pool, testConnection, closePool } = require("./config/db");
const lancamentoController = require("./controllers/lancamentoController");

const app = express();
const PORT = 3000;

testConnection()
  .then(() => {
    console.log("Conexao com PostgreSQL estabelecida com sucesso.");
  })
  .catch((error) => {
    console.error("Falha ao conectar ao PostgreSQL:", error.message);
  });

// Configurar EJS como view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "financas-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  }),
);

function autenticarSessao(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }
  return next();
}

app.get("/login", (req, res) => {
  if (req.session.usuario) {
    return res.redirect("/lancamentos");
  }
  return res.render("login", { erro: null });
});

app.post("/login", async (req, res) => {
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
      return res.status(401).render("login", {
        erro: "Login ou senha inválidos.",
      });
    }

    req.session.usuario = result.rows[0];
    return res.redirect("/lancamentos");
  } catch (error) {
    console.error("Erro ao validar login:", error);
    return res.status(500).render("login", {
      erro: "Erro interno ao validar login.",
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Rotas principais
app.get("/", autenticarSessao, lancamentoController.listarLancamentos);
app.get(
  "/lancamentos",
  autenticarSessao,
  lancamentoController.listarLancamentos,
);
app.get(
  "/lancamentos/novo",
  autenticarSessao,
  lancamentoController.formNovoLancamento,
);
app.post(
  "/lancamentos",
  autenticarSessao,
  lancamentoController.criarLancamento,
);
app.get(
  "/lancamentos/:id/editar",
  autenticarSessao,
  lancamentoController.formEditarLancamento,
);
app.post(
  "/lancamentos/:id",
  autenticarSessao,
  lancamentoController.atualizarLancamento,
);
app.post(
  "/lancamentos/:id/excluir",
  autenticarSessao,
  lancamentoController.excluirLancamento,
);
app.get(
  "/lancamentos/relatorio",
  autenticarSessao,
  lancamentoController.gerarRelatorioPdf,
);

// Iniciar servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log("Pressione Ctrl+C para parar...");
  });
}

// Tratador de erro para fechar conexões corretamente
process.on("SIGINT", async () => {
  console.log("\nEncerrando servidor...");
  await closePool();
  process.exit(0);
});

module.exports = app;
