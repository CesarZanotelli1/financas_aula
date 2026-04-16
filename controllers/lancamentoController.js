const lancamentoService = require("../services/lancamentoService");
const emailService = require("../services/emailService");
const pdfService = require("../services/pdfService");

function extrairFiltros(req) {
  return {
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
    situacao: req.query.situacao,
  };
}

function obterIdParam(req) {
  const id = Number(req.params.id);
  return Number.isNaN(id) ? null : id;
}

function tratarErroValidacao(error) {
  return error?.statusCode === 400;
}

async function listarLancamentos(req, res) {
  try {
    const { lancamentos, filtrosAplicados } =
      await lancamentoService.listarLancamentos(extrairFiltros(req));

    const resumo = lancamentoService.calcularResumoLancamentos(lancamentos);

    return res.render("listagem", {
      lancamentos,
      totalLancamentos: lancamentos.length,
      usuario: req.session.usuario,
      filtros: filtrosAplicados,
      resumo,
      mensagem: req.query.sucesso || null,
      erro: null,
    });
  } catch (error) {
    console.error("Erro ao buscar lancamentos:", error);
    return res.status(500).render("listagem", {
      lancamentos: [],
      totalLancamentos: 0,
      usuario: req.session.usuario,
      filtros: {
        dataInicio: req.query.dataInicio || null,
        dataFim: req.query.dataFim || null,
        situacao: req.query.situacao || null,
      },
      resumo: {
        totalReceitas: 0,
        totalDespesas: 0,
        saldo: 0,
      },
      mensagem: null,
      erro: "Erro ao buscar dados do banco de dados",
    });
  }
}

async function formNovoLancamento(req, res) {
  return res.render("lancamento-form", {
    titulo: "Novo Lancamento",
    acao: "/lancamentos",
    modoEdicao: false,
    usuario: req.session.usuario,
    lancamento: {
      descricao: "",
      data_lancamento: "",
      valor: "",
      tipo_lancamento: "Receita",
      situacao: "ativo",
    },
    erros: [],
  });
}

async function criarLancamento(req, res) {
  try {
    const novoLancamento = await lancamentoService.criarLancamento(req.body);

    try {
      await emailService.enviarNotificacaoLancamento({
        acao: "criado",
        lancamento: novoLancamento,
        usuario: req.session.usuario,
      });
    } catch (error) {
      console.error("Falha no envio de e-mail de criacao:", error.message);
    }

    return res.redirect("/lancamentos?sucesso=Lancamento criado com sucesso");
  } catch (error) {
    if (tratarErroValidacao(error)) {
      return res.status(400).render("lancamento-form", {
        titulo: "Novo Lancamento",
        acao: "/lancamentos",
        modoEdicao: false,
        usuario: req.session.usuario,
        lancamento: req.body,
        erros: error.validationErrors || ["Dados invalidos"],
      });
    }

    console.error("Erro ao criar lancamento:", error);
    return res.status(500).render("lancamento-form", {
      titulo: "Novo Lancamento",
      acao: "/lancamentos",
      modoEdicao: false,
      usuario: req.session.usuario,
      lancamento: req.body,
      erros: ["Erro interno ao criar lancamento."],
    });
  }
}

async function formEditarLancamento(req, res) {
  const id = obterIdParam(req);
  if (!id) {
    return res.status(400).send("ID invalido.");
  }

  const lancamento = await lancamentoService.buscarLancamentoPorId(id);
  if (!lancamento) {
    return res.status(404).send("Lancamento nao encontrado.");
  }

  return res.render("lancamento-form", {
    titulo: "Editar Lancamento",
    acao: `/lancamentos/${id}`,
    modoEdicao: true,
    usuario: req.session.usuario,
    lancamento,
    erros: [],
  });
}

async function atualizarLancamento(req, res) {
  const id = obterIdParam(req);
  if (!id) {
    return res.status(400).send("ID invalido.");
  }

  try {
    const lancamentoAtualizado = await lancamentoService.atualizarLancamento(
      id,
      req.body,
    );

    if (!lancamentoAtualizado) {
      return res.status(404).send("Lancamento nao encontrado.");
    }

    try {
      await emailService.enviarNotificacaoLancamento({
        acao: "atualizado",
        lancamento: lancamentoAtualizado,
        usuario: req.session.usuario,
      });
    } catch (error) {
      console.error("Falha no envio de e-mail de atualizacao:", error.message);
    }

    return res.redirect(
      "/lancamentos?sucesso=Lancamento atualizado com sucesso",
    );
  } catch (error) {
    if (tratarErroValidacao(error)) {
      return res.status(400).render("lancamento-form", {
        titulo: "Editar Lancamento",
        acao: `/lancamentos/${id}`,
        modoEdicao: true,
        usuario: req.session.usuario,
        lancamento: { id, ...req.body },
        erros: error.validationErrors || ["Dados invalidos"],
      });
    }

    console.error("Erro ao atualizar lancamento:", error);
    return res.status(500).render("lancamento-form", {
      titulo: "Editar Lancamento",
      acao: `/lancamentos/${id}`,
      modoEdicao: true,
      usuario: req.session.usuario,
      lancamento: { id, ...req.body },
      erros: ["Erro interno ao atualizar lancamento."],
    });
  }
}

async function excluirLancamento(req, res) {
  const id = obterIdParam(req);
  if (!id) {
    return res.status(400).send("ID invalido.");
  }

  const removido = await lancamentoService.excluirLancamento(id);
  if (!removido) {
    return res.status(404).send("Lancamento nao encontrado.");
  }

  return res.redirect("/lancamentos?sucesso=Lancamento excluido com sucesso");
}

async function gerarRelatorioPdf(req, res) {
  try {
    const { lancamentos, filtrosAplicados } =
      await lancamentoService.listarLancamentos(extrairFiltros(req));
    const resumo = lancamentoService.calcularResumoLancamentos(lancamentos);

    const pdfBuffer = await pdfService.gerarRelatorioLancamentosPdf({
      lancamentos,
      resumo,
      filtros: filtrosAplicados,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=relatorio-lancamentos.pdf",
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Erro ao gerar relatorio PDF:", error);
    return res.status(500).send("Falha ao gerar relatorio PDF.");
  }
}

module.exports = {
  listarLancamentos,
  formNovoLancamento,
  criarLancamento,
  formEditarLancamento,
  atualizarLancamento,
  excluirLancamento,
  gerarRelatorioPdf,
};
