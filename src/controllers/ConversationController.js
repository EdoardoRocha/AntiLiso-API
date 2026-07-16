//Models
import Conversation from "../models/Conversation.js";

//Dependencies
import { styleText } from "node:util";
import { runAgent } from "../ai/agent.js";
import Transaction from "../models/Transaction.js";

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

    if (!message) {
      return res.status(400).json({ message: "A mensagem é obrigatória." });
    }

    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversa não encontrada." });
      }

      const clearHistory = conversation.messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      let aiReply = await runAgent(message, clearHistory, userId);

      if (!aiReply || aiReply.trim() == "") {
        aiReply = "Feito! Ação processada com sucesso no banco de dados.";
      }

      conversation.messages.push({ role: "user", parts: message });
      conversation.messages.push({ role: "model", parts: aiReply });

      await conversation.save();

      return res.status(200).json({
        reply: aiReply,
      });
    } catch (error) {
      console.error(
        styleText(
          ["red", "bold"],
          "Erro crítico ao tentar persistir mensagem no banco: " +
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
