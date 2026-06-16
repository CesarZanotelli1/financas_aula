INSERT INTO usuarios (id, nome, email, senha) 
VALUES (1, 'Usuario Inicial Teste', 'admin@teste.com', '123456')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lancamentos (descricao, valor, tipo, data, usuario_id) 
VALUES 
('Salário Mensal', 5200.00, 'receita', CURRENT_DATE - INTERVAL '15 days', 1),
('Rendimento Investimentos', 150.50, 'receita', CURRENT_DATE - INTERVAL '14 days', 1),
('Aluguel Residencial', 1400.00, 'despesa', CURRENT_DATE - INTERVAL '12 days', 1),
('Fatura de Luz (CEEE)', 185.30, 'despesa', CURRENT_DATE - INTERVAL '10 days', 1),
('Fatura de Água (Corsan)', 75.20, 'despesa', CURRENT_DATE - INTERVAL '10 days', 1),
('Supermercado do Mês', 650.45, 'despesa', CURRENT_DATE - INTERVAL '8 days', 1),
('Venda de Objeto Antigo', 300.00, 'receita', CURRENT_DATE - INTERVAL '6 days', 1),
('Abastecimento Carro', 220.00, 'despesa', CURRENT_DATE - INTERVAL '5 days', 1),
('Cinema e Jantar', 140.00, 'despesa', CURRENT_DATE - INTERVAL '3 days', 1),
('Serviço Streaming (Netflix)', 55.90, 'despesa', CURRENT_DATE - INTERVAL '1 day', 1)
ON CONFLICT DO NOTHING;