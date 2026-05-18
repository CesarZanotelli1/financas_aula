const request = require('supertest');

jest.mock('../config/db', () => {
  const query = jest.fn();
  return {
    pool: {
      query,
      connect: jest.fn().mockResolvedValue({ release: jest.fn() }),
      end: jest.fn().mockResolvedValue(),
    },
    testConnection: jest.fn().mockResolvedValue(),
    closePool: jest.fn().mockResolvedValue(),
  };
});

jest.mock('../services/emailService', () => ({
  enviarNotificacaoLancamento: jest
    .fn()
    .mockResolvedValue({ messageId: 'abc' }),
}));

jest.mock('../services/pdfService', () => ({
  gerarRelatorioLancamentosPdf: jest
    .fn()
    .mockResolvedValue(Buffer.from('%PDF-1.4 fake')),
}));

const { pool } = require('../config/db');
const emailService = require('../services/emailService');
const app = require('../app');

describe('rotas da aplicacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    pool.query.mockImplementation((text, params = []) => {
      const sql = String(text);

      if (sql.includes('FROM usuario')) {
        if (params[0] === 'admin' && params[1] === '123') {
          return Promise.resolve({
            rows: [{ id: 1, nome: 'Admin', login: 'admin' }],
          });
        }
        return Promise.resolve({ rows: [] });
      }

      if (sql.includes('INSERT INTO lancamento')) {
        return Promise.resolve({
          rows: [
            {
              id: 10,
              descricao: 'Novo',
              data_lancamento: '2026-04-10',
              valor: 120,
              tipo_lancamento: 'Receita',
              situacao: 'ativo',
            },
          ],
        });
      }

      if (
        sql.includes('SELECT') &&
        sql.includes('FROM lancamento') &&
        sql.includes('WHERE id = $1')
      ) {
        if (params[0] === 999) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({
          rows: [
            {
              id: params[0],
              descricao: 'Registro',
              data_lancamento: '2026-04-10',
              valor: 80,
              tipo_lancamento: 'Despesa',
              situacao: 'ativo',
            },
          ],
        });
      }

      if (sql.includes('UPDATE lancamento')) {
        return Promise.resolve({
          rows: [
            {
              id: params[params.length - 1],
              descricao: 'Atualizado',
              data_lancamento: '2026-04-11',
              valor: 90,
              tipo_lancamento: 'Despesa',
              situacao: 'ativo',
            },
          ],
        });
      }

      if (sql.includes('DELETE FROM lancamento')) {
        return Promise.resolve({
          rowCount: params[0] === 999 ? 0 : 1,
          rows: [{ id: params[0] }],
        });
      }

      if (sql.includes('FROM lancamento')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              descricao: 'Salario',
              data_lancamento: '2026-04-01',
              valor: 5000,
              tipo_lancamento: 'Receita',
              situacao: 'ativo',
            },
          ],
        });
      }

      return Promise.resolve({ rows: [] });
    });
  });

  test('deve redirecionar usuario nao autenticado para login', async () => {
    const res = await request(app).get('/lancamentos');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('deve abrir pagina de login', async () => {
    const res = await request(app).get('/login');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Acesso ao Sistema');
  });

  test('deve rejeitar login invalido', async () => {
    const res = await request(app)
      .post('/login')
      .send({ login: 'x', senha: 'y' });
    expect(res.status).toBe(401);
    expect(res.text).toContain('Login ou senha inv');
  });

  test('deve autenticar login valido', async () => {
    const res = await request(app)
      .post('/login')
      .send({ login: 'admin', senha: '123' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/lancamentos');
  });

  test('deve listar lancamentos para usuario autenticado', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ login: 'admin', senha: '123' });

    const res = await agent.get('/lancamentos');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Listagem de Lancamentos');
  });

  test('deve aplicar filtros na query de listagem', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ login: 'admin', senha: '123' });

    await agent.get(
      '/lancamentos?dataInicio=2026-04-01&dataFim=2026-04-30&situacao=ativo',
    );

    const chamadaListagem = pool.query.mock.calls.find((call) =>
      String(call[0]).includes('FROM lancamento'),
    );

    expect(chamadaListagem).toBeTruthy();
    expect(String(chamadaListagem[0])).toContain('data_lancamento >= $1');
    expect(String(chamadaListagem[0])).toContain('data_lancamento <= $2');
    expect(String(chamadaListagem[0])).toContain('situacao = $3');
    expect(chamadaListagem[1]).toEqual(['2026-04-01', '2026-04-30', 'ativo']);
  });

  test('deve carregar formulario de novo lancamento', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ login: 'admin', senha: '123' });

    const res = await agent.get('/lancamentos/novo');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Novo Lancamento');
  });

  test('deve validar campos no create de lancamento', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ login: 'admin', senha: '123' });

    const res = await agent.post('/lancamentos').send({
      descricao: 'ab',
      data_lancamento: '',
      valor: '0',
      tipo_lancamento: 'Outro',
      situacao: 'ativo',
    });

    expect(res.status).toBe(400);
    expect(res.text).toContain('obrigatoria');
  });

  test('deve atualizar lancamento existente', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ login: 'admin', senha: '123' });

    const res = await agent.post('/lancamentos/1').send({
      descricao: 'Conta de agua',
      data_lancamento: '2026-04-12',
      valor: '95',
      tipo_lancamento: 'Despesa',
      situacao: 'ativo',
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/lancamentos');
    expect(emailService.enviarNotificacaoLancamento).toHaveBeenCalled();
  });

  test('deve excluir lancamento existente', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ login: 'admin', senha: '123' });

    const res = await agent.post('/lancamentos/1/excluir');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/lancamentos');
  });

  test('deve gerar relatorio PDF', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ login: 'admin', senha: '123' });

    const res = await agent.get('/lancamentos/relatorio');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});
