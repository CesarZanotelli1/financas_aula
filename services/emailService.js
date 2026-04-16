const nodemailer = require("nodemailer");

let transporterPromise;

function obterConfiguracaoSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Configuracao SMTP incompleta. Defina SMTP_HOST, SMTP_USER e SMTP_PASS.",
    );
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  };
}

async function criarTransporter() {
  const transporter = nodemailer.createTransport(obterConfiguracaoSmtp());
  await transporter.verify();
  return transporter;
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

  const destinatario = usuario?.email || usuario?.login;

  if (!destinatario) {
    throw new Error("Usuario logado sem e-mail para envio de notificacao.");
  }

  const transporter = await getTransporter();
  const subject =
    acao === "criado" ? "Novo lancamento criado" : "Lancamento atualizado";

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Financas App <no-reply@financas.local>",
    to: destinatario,
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

  console.log("[Email] status=ENVIADO");
  console.log(`[Email] messageId=${info.messageId}`);
  console.log(`[Email] to=${destinatario || "nao definido"}`);
  console.log("[Email] provider=SMTP_REAL");

  return {
    ...info,
  };
}

module.exports = {
  enviarNotificacaoLancamento,
};
