const nodemailer = require('nodemailer');
require('dotenv').config();

const SMTP_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

const EMAIL_FROM = process.env.EMAIL_FROM;
const transporter = nodemailer.createTransport(SMTP_CONFIG);

async function enviarNotificacaoLancamento({ acao, lancamento, usuario }) {
  if (process.env.NODE_ENV === 'test') {
    return { skipped: true };
  }

  const destinatario = usuario?.email || usuario?.login;

  if (!destinatario) {
    throw new Error('Usuario logado sem e-mail para envio de notificacao.');
  }

  const subject =
    acao === 'criado' ? 'Novo lancamento criado' : 'Lancamento atualizado';

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: destinatario,
    subject,
    html: `
      <h3>${subject}</h3>
      <p><strong>Usuario:</strong> ${usuario?.nome || 'Nao informado'}</p>
      <p><strong>ID:</strong> ${lancamento.id}</p>
      <p><strong>Descricao:</strong> ${lancamento.descricao}</p>
      <p><strong>Data:</strong> ${lancamento.data_lancamento}</p>
      <p><strong>Valor:</strong> R$ ${Number(lancamento.valor).toFixed(2)}</p>
      <p><strong>Tipo:</strong> ${lancamento.tipo_lancamento}</p>
      <p><strong>Situacao:</strong> ${lancamento.situacao}</p>
    `,
  });

  console.log('[Email] status=ENVIADO');
  console.log(`[Email] messageId=${info.messageId}`);
  console.log(`[Email] to=${destinatario || 'nao definido'}`);
  console.log('[Email] provider=SMTP_REAL');

  return info;
}

module.exports = {
  enviarNotificacaoLancamento,
};
