jest.mock("../config/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

const lancamentoService = require("../services/lancamentoService");

describe("lancamentoService", () => {
  test("deve validar campos obrigatorios no create", () => {
    const result = lancamentoService.validarLancamento({});

    expect(result.valido).toBe(false);
    expect(result.erros.length).toBeGreaterThan(0);
  });

  test("deve invalidar data invalida", () => {
    const result = lancamentoService.validarLancamento({
      descricao: "Aluguel",
      data_lancamento: "data-ruim",
      valor: 100,
      tipo_lancamento: "Despesa",
      situacao: "ativo",
    });

    expect(result.valido).toBe(false);
    expect(result.erros).toContain("Data de lancamento invalida.");
  });

  test("deve invalidar valor menor ou igual a zero", () => {
    const result = lancamentoService.validarLancamento({
      descricao: "Aluguel",
      data_lancamento: "2026-04-10",
      valor: 0,
      tipo_lancamento: "Despesa",
      situacao: "ativo",
    });

    expect(result.valido).toBe(false);
    expect(result.erros).toContain("Valor deve ser numerico e maior que zero.");
  });

  test("deve invalidar tipo_lancamento fora do dominio", () => {
    const result = lancamentoService.validarLancamento({
      descricao: "Pix",
      data_lancamento: "2026-04-10",
      valor: 100,
      tipo_lancamento: "Outro",
      situacao: "ativo",
    });

    expect(result.valido).toBe(false);
    expect(result.erros).toContain(
      "Tipo de lancamento deve ser Receita ou Despesa.",
    );
  });

  test("deve invalidar situacao fora do dominio", () => {
    const result = lancamentoService.validarLancamento({
      descricao: "Pix",
      data_lancamento: "2026-04-10",
      valor: 100,
      tipo_lancamento: "Receita",
      situacao: "pendente",
    });

    expect(result.valido).toBe(false);
    expect(result.erros).toContain("Situacao deve ser ativo ou inativo.");
  });

  test("deve validar payload correto", () => {
    const result = lancamentoService.validarLancamento({
      descricao: "Salario",
      data_lancamento: "2026-04-10",
      valor: 5000,
      tipo_lancamento: "Receita",
      situacao: "ativo",
    });

    expect(result.valido).toBe(true);
    expect(result.erros).toHaveLength(0);
  });

  test("deve calcular saldo com receitas e despesas", () => {
    const resumo = lancamentoService.calcularResumoLancamentos([
      { tipo_lancamento: "Receita", valor: 3000 },
      { tipo_lancamento: "Despesa", valor: 750 },
      { tipo_lancamento: "Receita", valor: 200 },
    ]);

    expect(resumo.totalReceitas).toBe(3200);
    expect(resumo.totalDespesas).toBe(750);
    expect(resumo.saldo).toBe(2450);
  });

  test("deve montar query de listagem sem filtros", () => {
    const query = lancamentoService.construirQueryListagem({});

    expect(query.text).toContain("FROM lancamento");
    expect(query.text).not.toContain("WHERE");
    expect(query.params).toEqual([]);
  });

  test("deve montar query de listagem com filtros de data e situacao", () => {
    const query = lancamentoService.construirQueryListagem({
      dataInicio: "2026-01-01",
      dataFim: "2026-01-31",
      situacao: "ativo",
    });

    expect(query.text).toContain("data_lancamento >= $1");
    expect(query.text).toContain("data_lancamento <= $2");
    expect(query.text).toContain("situacao = $3");
    expect(query.params).toEqual(["2026-01-01", "2026-01-31", "ativo"]);
  });
});
