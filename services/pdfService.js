const PDFDocument = require("pdfkit");

function formatarMoeda(valor) {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

function gerarRelatorioLancamentosPdf({ lancamentos, resumo, filtros }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Relatorio de Lancamentos", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
    doc.text(
      `Filtros -> Data inicio: ${filtros.dataInicio || "-"} | Data fim: ${filtros.dataFim || "-"} | Situacao: ${filtros.situacao || "-"}`,
    );

    doc.moveDown(1);
    doc.fontSize(12).text("Lancamentos:", { underline: true });
    doc.moveDown(0.5);

    if (lancamentos.length === 0) {
      doc.fontSize(11).text("Nenhum lancamento encontrado para os filtros.");
    } else {
      lancamentos.forEach((item, index) => {
        doc
          .fontSize(10)
          .text(
            `${index + 1}. ${item.descricao} | ${new Date(item.data_lancamento).toLocaleDateString("pt-BR")} | ${item.tipo_lancamento} | ${formatarMoeda(item.valor)} | ${item.situacao}`,
          );
      });
    }

    doc.moveDown(1);
    doc.fontSize(12).text("Resumo:", { underline: true });
    doc
      .fontSize(10)
      .text(`Total de receitas: ${formatarMoeda(resumo.totalReceitas)}`);
    doc
      .fontSize(10)
      .text(`Total de despesas: ${formatarMoeda(resumo.totalDespesas)}`);
    doc.fontSize(10).text(`Saldo total: ${formatarMoeda(resumo.saldo)}`);

    doc.end();
  });
}

module.exports = {
  gerarRelatorioLancamentosPdf,
};
