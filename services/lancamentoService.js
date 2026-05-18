const { pool } = require('../config/db');

function normalizarFiltros(filtros = {}) {
  return {
    dataInicio: filtros.dataInicio || null,
    dataFim: filtros.dataFim || null,
    situacao: filtros.situacao || null,
  };
}

function construirQueryListagem(filtros = {}) {
  const filtrosNormalizados = normalizarFiltros(filtros);
  const where = [];
  const params = [];

  if (filtrosNormalizados.dataInicio) {
    params.push(filtrosNormalizados.dataInicio);
    where.push(`data_lancamento >= $${params.length}`);
  }

  if (filtrosNormalizados.dataFim) {
    params.push(filtrosNormalizados.dataFim);
    where.push(`data_lancamento <= $${params.length}`);
  }

  if (filtrosNormalizados.situacao) {
    params.push(filtrosNormalizados.situacao);
    where.push(`situacao = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const text = `
    SELECT id, descricao, data_lancamento, valor, tipo_lancamento, situacao
    FROM lancamento
    ${whereSql}
    ORDER BY data_lancamento DESC, id DESC
  `;

  return { text, params, filtrosNormalizados };
}

async function listarLancamentos(filtros = {}) {
  const { text, params, filtrosNormalizados } = construirQueryListagem(filtros);
  const result = await pool.query(text, params);
  return {
    lancamentos: result.rows,
    filtrosAplicados: filtrosNormalizados,
  };
}

function calcularResumoLancamentos(lancamentos = []) {
  return lancamentos.reduce(
    (acc, item) => {
      const valor = Number(item.valor) || 0;
      const tipo = String(item.tipo_lancamento || '').toLowerCase();

      if (tipo === 'receita') {
        acc.totalReceitas += valor;
      } else if (tipo === 'despesa') {
        acc.totalDespesas += valor;
      }

      acc.saldo = acc.totalReceitas - acc.totalDespesas;
      return acc;
    },
    { totalReceitas: 0, totalDespesas: 0, saldo: 0 },
  );
}

function validarLancamento(payload = {}, isUpdate = false) {
  const erros = [];
  const {
    descricao,
    data_lancamento: dataLancamento,
    valor,
    tipo_lancamento: tipoLancamento,
    situacao,
  } = payload;

  if (!isUpdate || descricao !== undefined) {
    if (!descricao || String(descricao).trim().length < 3) {
      erros.push('Descricao e obrigatoria e deve ter ao menos 3 caracteres.');
    }
  }

  if (!isUpdate || dataLancamento !== undefined) {
    if (!dataLancamento || Number.isNaN(new Date(dataLancamento).getTime())) {
      erros.push('Data de lancamento invalida.');
    }
  }

  if (!isUpdate || valor !== undefined) {
    if (
      valor === undefined ||
      valor === null ||
      Number.isNaN(Number(valor)) ||
      Number(valor) <= 0
    ) {
      erros.push('Valor deve ser numerico e maior que zero.');
    }
  }

  if (!isUpdate || tipoLancamento !== undefined) {
    const tiposValidos = ['Receita', 'Despesa'];
    if (!tiposValidos.includes(tipoLancamento)) {
      erros.push('Tipo de lancamento deve ser Receita ou Despesa.');
    }
  }

  if (situacao !== undefined) {
    const situacoesValidas = ['ativo', 'inativo'];
    if (!situacoesValidas.includes(situacao)) {
      erros.push('Situacao deve ser ativo ou inativo.');
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

async function criarLancamento(payload) {
  const validacao = validarLancamento(payload);
  if (!validacao.valido) {
    const error = new Error('Falha de validacao');
    error.statusCode = 400;
    error.validationErrors = validacao.erros;
    throw error;
  }

  const query = `
    INSERT INTO lancamento (descricao, data_lancamento, valor, tipo_lancamento, situacao)
    VALUES ($1, $2, $3, $4, COALESCE($5, 'ativo'))
    RETURNING id, descricao, data_lancamento, valor, tipo_lancamento, situacao
  `;
  const values = [
    payload.descricao,
    payload.data_lancamento,
    Number(payload.valor),
    payload.tipo_lancamento,
    payload.situacao || 'ativo',
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function buscarLancamentoPorId(id) {
  const result = await pool.query(
    `SELECT id, descricao, data_lancamento, valor, tipo_lancamento, situacao
     FROM lancamento
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

async function atualizarLancamento(id, payload) {
  const validacao = validarLancamento(payload, true);
  if (!validacao.valido) {
    const error = new Error('Falha de validacao');
    error.statusCode = 400;
    error.validationErrors = validacao.erros;
    throw error;
  }

  const campos = [];
  const valores = [];

  if (payload.descricao !== undefined) {
    valores.push(payload.descricao);
    campos.push(`descricao = $${valores.length}`);
  }
  if (payload.data_lancamento !== undefined) {
    valores.push(payload.data_lancamento);
    campos.push(`data_lancamento = $${valores.length}`);
  }
  if (payload.valor !== undefined) {
    valores.push(Number(payload.valor));
    campos.push(`valor = $${valores.length}`);
  }
  if (payload.tipo_lancamento !== undefined) {
    valores.push(payload.tipo_lancamento);
    campos.push(`tipo_lancamento = $${valores.length}`);
  }
  if (payload.situacao !== undefined) {
    valores.push(payload.situacao);
    campos.push(`situacao = $${valores.length}`);
  }

  if (campos.length === 0) {
    const error = new Error('Nenhum campo para atualizar.');
    error.statusCode = 400;
    throw error;
  }

  valores.push(id);
  const result = await pool.query(
    `
      UPDATE lancamento
      SET ${campos.join(', ')}
      WHERE id = $${valores.length}
      RETURNING id, descricao, data_lancamento, valor, tipo_lancamento, situacao
    `,
    valores,
  );

  return result.rows[0] || null;
}

async function excluirLancamento(id) {
  const result = await pool.query(
    'DELETE FROM lancamento WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rowCount > 0;
}

module.exports = {
  listarLancamentos,
  calcularResumoLancamentos,
  validarLancamento,
  criarLancamento,
  buscarLancamentoPorId,
  atualizarLancamento,
  excluirLancamento,
  construirQueryListagem,
};
