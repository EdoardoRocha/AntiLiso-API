//Models
import Conversation from "../models/Conversation.js";

//Dependencies
import { styleText } from "node:util";
import Transaction from "../models/Transaction.js";
import axios from "axios";
import fs from "fs"

export default class ConversationController {
  static async createConversation(req, res) {
    const userId = req.user.id;
    const { title, status, messages } = req.body;

    try {
      const newConversation = new Conversation({
        userId,
        title,
        status,
        messages,
      });

      const conversation = await newConversation.save();
      res.status(201).json({
        message: "Conversa criada com sucesso",
        conversation,
      });
    } catch (error) {
      console.error(
        styleText(
          ["red", "bold"],
          "Erro critíco ao tentar criar conversa no banco " + error,
        ),
      );
      res.status(500).json({
        message: `Erro interno ao tentar criar conversa: ${error.message}`,
      });
    }
  }

  static async sendMessageInConversation(req, res) {
    const conversationId = req.params.conversation_id;
    const userId = req.user.id;
    const { message } = req.body;
    const imageUrl = req.file ? `http://localhost:3000/${req.file.filename}` : null

    if (!message && !imageUrl) {
      return res.status(400).json({ message: "É necessário enviar uma mensagem de texto ou uma imagem." });
    }

    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada." });
      }

      const url = process.env.BASE_URL;
      const payload = {
        user_id: userId,
        conversation_id: conversationId,
        text: message || "",
        img_url: imageUrl
      };
      const response = await axios.post(`${url}/antiliso/invoke`, payload);
      let textAi = response.data.text

      if (typeof textAi === "string") {
        textAi = textAi.replace(/^"|"$/g, '');
        textAi = textAi.replace(/\\n/g, '\n');
      }

      const userMessage = {
        role: "user",
        parts: message || "",
        imageUrl
      }

      conversation.messages.push(userMessage);
      conversation.messages.push({ role: "model", parts: textAi });

      await conversation.save();

      return res.status(200).json({
        reply: textAi,
        imageUrl: imageUrl
      });
    } catch (error) { 

      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if(err) {
            console.error("Falha ao deletar a imagem após erro no controller:", err);
          } else {
            console.log("Imagem deletada com sucesso após erro na requisição.");
          }
        })
      }

      console.error(
        styleText(
          ["red", "bold"],
          "Erro crítico ao tentar processar mensagem: " +
            error.message,
        ),
      );

      await Transaction.deleteMany({
        userId,
        createdAt: { $gte: new Date(Date.now() - 60000) },
      });
      return res.status(500).json({
        message: `Erro interno ao tentar processar mensagem: ${error.message}`,
      });
    }
  }

  static async getAllConversations(req, res) {
    const userId = req.user.id;

    try {
      const conversations = await Conversation.find({ userId })
        .select("-messages")
        .sort({
          updatedAt: -1,
        });

      res.status(200).json(conversations);
    } catch (error) {
      console.error(
        styleText(
          ["red", "bold"],
          "Erro critíco ao tentar persistir mensagem no banco " + error,
        ),
      );
      res.status(500).json({
        message: `Erro interno ao tentar processar mensagem: ${error.message}`,
      });
    }
  }

  static async getAllMessagesInConversation(req, res) {
    const conversationId = req.params.conversation_id;

    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(400).json({
          message: "Conversa inexistente.",
        });
      }

      res.status(200).json(conversation.messages);
    } catch (error) {
      console.error(
        styleText(
          ["red", "bold"],
          "Erro critíco ao tentar acessar mensagens da conversa " + error,
        ),
      );
      res.status(500).json({
        message: `Erro interno ao tentar acessar mensagens internas da conversa: ${error.message}`,
      });
    }
  }
}
