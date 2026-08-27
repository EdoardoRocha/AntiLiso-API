//Dependencies
import { styleText } from "node:util";
import axios from "axios";
import fs from "fs";

export default class ConversationController {
  static async antilisoAI(content, userId, phoneNumber, imgUrl = null) {
    try {
      const url = process.env.BASE_URL;
      const payload = {
        user_id: userId,
        phoneNumber,
        text: content || "",
        img_url: imgUrl,
      };
      const response = await axios.post(`${url}/antiliso/invoke`, payload);
      let textAi = response.data.text;

      if (typeof textAi === "string") {
        textAi = textAi.replace(/^"|"$/g, "");
        textAi = textAi.replace(/\\n/g, "\n");
      }

      return textAi;
    } catch (error) {
      console.error(
        styleText(
          ["red", "bold"],
          "Erro crítico ao tentar processar mensagem: " + error.message,
        ),
      );
      return;
    }
  }
}
