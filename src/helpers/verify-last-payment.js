import User from "../models/User.js";

async function verifyLastPayment(user) {
  try {

    if (!user.paymentHistory || user.paymentHistory.length === 0) {
      return {
        isPaid: false,
        lastPaymentDate: null,
        message: "Nenhum pagamento registrado no histórico.",
      };
    }

    // Pega o último item do array (o pagamento mais recente)
    const indexLastPayment = user.paymentHistory.length - 1;
    const lastPayment = user.paymentHistory[indexLastPayment];

    let formattedDate = null;
    if (lastPayment.paymentDate) {
      formattedDate = new Date(lastPayment.paymentDate).toLocaleDateString(
        "pt-BR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      );
    }

    return {
      isPaid: lastPayment.isPay,
      dateLastPayment: lastPayment.paymentDate, // Data original do banco
      formattedDate, // Ex: "21/08/2026"
      message: lastPayment.isPay
        ? `Pagamento ativo. Último pagamento em: ${formattedDate}`
        : "Pagamento pendente ou recusado.",
    };
  } catch (erro) {
    console.error("Erro ao verificar pagamento:", erro);
    throw erro;
  }
}

export default verifyLastPayment;
