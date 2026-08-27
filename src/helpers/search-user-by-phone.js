import User from "../models/User.js";

async function searchByNumber(phoneNumber) {
  try {
    const user = await User.findOne({ phone: phoneNumber });

    if (!user) {
      return "Aparentemente você não está cadastrado em nosso sistema, faça seu cadastro agora e ganhe 30 dias gratuitos.";
    }

    return user;
  } catch (error) {
    console.log(`Erro ao buscar usuário no banco: ${error}`);
    throw error;
  }
}

export default searchByNumber;
