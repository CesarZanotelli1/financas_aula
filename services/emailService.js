const nodemailer = require("nodemailer");

let transporterPromise;

async function criarTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = criarTransporter();
  }
  return transporterPromise;
}

async function enviarNotificacaoLancamento({ acao, lancamento, usuario }) {
  if (process.env.NODE_ENV === "test") {
    return { skipped: true };
  }

  const transporter = await getTransporter();
  const subject =
    acao === "criado" ? "Novo lancamento criado" : "Lancamento atualizado";

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Financas App <no-reply@financas.local>",
    to: process.env.EMAIL_TO || "financeiro@empresa.local",
    subject,
    html: `
      <h3>${subject}</h3>
      <p><strong>Usuario:</strong> ${usuario?.nome || "Nao informado"}</p>
      <p><strong>ID:</strong> ${lancamento.id}</p>
      <p><strong>Descricao:</strong> ${lancamento.descricao}</p>
      <p><strong>Data:</strong> ${lancamento.data_lancamento}</p>
      <p><strong>Valor:</strong> R$ ${Number(lancamento.valor).toFixed(2)}</p>
      <p><strong>Tipo:</strong> ${lancamento.tipo_lancamento}</p>
      <p><strong>Situacao:</strong> ${lancamento.situacao}</p>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("Preview Ethereal:", previewUrl);
  }

  return info;
}

module.exports = {
  enviarNotificacaoLancamento,
};
