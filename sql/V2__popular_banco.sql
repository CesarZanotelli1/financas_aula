-- 1. Inserir o Usuário Administrador de Teste mapeado nas credenciais originais
INSERT INTO usuario (id, nome, login, email, senha, situacao) 
VALUES (1, 'Usuario Inicial Teste', 'admin', 'admin@teste.com', '123456', 'ativo')
ON CONFLICT (login) DO NOTHING;

-- 2. Inserir exatamente 10 Lançamentos válidos com valores equilibrados
INSERT INTO lancamento (descricao, data_lancamento, valor, tipo_lancamento, situacao) 
VALUES 
('Salário Mensal', CURRENT_DATE - INTERVAL '15 days', 5200.00, 'Receita', 'ativo'),
('Rendimento Poupança', CURRENT_DATE - INTERVAL '14 days', 150.50, 'Receita', 'ativo'),
('Aluguel Residencial', CURRENT_DATE - INTERVAL '12 days', 1400.00, 'Despesa', 'ativo'),
('Fatura de Luz', CURRENT_DATE - INTERVAL '10 days', 185.30, 'Despesa', 'ativo'),
('Fatura de Água', CURRENT_DATE - INTERVAL '10 days', 75.20, 'Despesa', 'ativo'),
('Rancho Supermercado', CURRENT_DATE - INTERVAL '8 days', 650.45, 'Despesa', 'ativo'),
('Venda de Monitor Antigo', CURRENT_DATE - INTERVAL '6 days', 300.00, 'Receita', 'ativo'),
('Abastecimento Carro', CURRENT_DATE - INTERVAL '5 days', 220.00, 'Despesa', 'ativo'),
('Cinema e Jantar', CURRENT_DATE - INTERVAL '3 days', 140.00, 'Despesa', 'ativo'),
('Assinatura Netflix', CURRENT_DATE - INTERVAL '1 day', 55.90, 'Despesa', 'ativo');