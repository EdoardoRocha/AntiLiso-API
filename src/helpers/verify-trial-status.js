import User from "../models/User.js";
import searchByNumber from "./search-user-by-phone.js";

async function verifyTrialDate(user) {
  try {
    const trialData = user.trial[0];

    if (!trialData.isTrial) {
      return {
        active: false,
        remainingDays: 0,
        message: "O período de teste já acabou ou não está ativo.",
      };
    }

    const nowDate = new Date();
    const dueDate = new Date(trialData.untilValid);

    const msDifference = dueDate.getTime() - nowDate.getTime();

    const remaining = Math.ceil(msDifference / (1000 * 60 * 60 * 24));

    if (remaining <= 0) {
      trialData.isTrial = false;
      await user.save();

      return {
        active: false,
        remainingDays: 0,
        message: "Seu período de teste de 30 dias expirou.",
      };
    }

    return {
      active: true,
      remainingDays: remaining,
      message: `Você ainda tem ${remaining} dia(s) de teste grátis.`,
    };
  } catch (erro) {
    console.error("Erro ao verificar trial:", erro);
    throw erro;
  }
}

export default verifyTrialDate;
