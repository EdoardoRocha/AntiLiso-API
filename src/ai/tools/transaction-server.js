import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

//Models
import mongoose from "mongoose";
import Transaction from "../../models/Transaction.js";

const server = new Server(
  {
    name: "transaction-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_transaction",
        description:
          "Registra uma transação financeira no banco de dados. Use para registrar gastos, pagamentos ou receitas do usuário.",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description:
                "ID do usuário dono da transação (injetado pelo sistema).",
            },
            amount: { type: "number", description: "O valor da transação." },
            type: {
              type: "string",
              enum: ["income", "expense"],
              description: "'income' (entrada) ou 'expense' (saída)",
            },
            category: {
              type: "string",
              description:
                "A  categoria. Ex: Alimentação, Lazer, Contas, Salário.",
            },
            description: {
              type: "string",
              description: "Resumo curto do que foi.",
            },
          },
          required: ["userId", "amount", "type", "category", "description"],
        },
      },
      {
        name: "consult_transactions",
        description:
          "Acessa o histórico das transações feitas que estão registradas no banco de dados. Use para consultar o histórico de gastos, pagamentos ou receitas do usuário.",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description:
                "ID do usuário dono da transação (injetado pelo sistema).",
            },
          },
          required: ["userId"],
        },
      },
      {
        name: "delete_transaction",
        description:
          "Use para deletar uma transação especifica ou várias no banco de dados.",
        inputSchema: {
          type: "object",
          properties: {
            transactionId: {
              type: "string",
              description:
                "ID da transação (Que vai ser recuperado usando a função de consultar transações).",
            },
            userId: {
              type: "string",
              description:
                "ID do usuário dono da transação (injetado pelo sistema).",
            },
          },
          required: ["transactionId", "userId"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "add_transaction") {
    const session = await mongoose.startSession();
    const { userId, amount, type, category, description } = args;

    try {
      const result = await session.withTransaction(async () => {
        const newTransaction = new Transaction({
          userId,
          amount,
          type,
          category,
          description,
        });

        await newTransaction.save({ session });

        return `Sucesso! R$ ${amount} (${description}) salvo na categoria '${category}'.`;
      });

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error(error);
      return {
        content: [
          {
            type: "text",
            text: `Erro de requisição: ${error.message}. Transação foi desfeita e não registrada no banco.`,
          },
        ],
      };
    } finally {
      session.endSession();
    }
  } else if (name === "consult_transactions") {
    const userId = args.userId;
    try {
      const transactions = await Transaction.find({ userId });

      return {
        content: [
          {
            type: "text",
            text: `Transações feitas: ${transactions}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Erro de requisição: ${error.message}`,
          },
        ],
      };
    }
  } else if (name === "delete_transaction") {
    const { transactionId, userId } = args;
    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const transactionDeleted = await Transaction.findOneAndDelete(
          { _id: transactionId, userId: userId },
          { session },
        );
        return transactionDeleted
          ? "Transação deletada com sucesso"
          : "Transação não encontrada.";
      });

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      console.error("[ERRO] " + error);
      return {
        content: [
          {
            type: "text",
            text: `Erro de requisição: ${error.message}. Transação não foi deletada, tente novamente.`,
          },
        ],
      };
    } finally {
      session.endSession();
    }
  } else {
    return {
      content: [
        {
          type: "text",
          text: `Ferramenta não encontrada no sistema.`,
        },
      ],
    };
  }

  throw new Error(`Ferramenta desconhecida: ${request.params.name}`);
});

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.error("📦 MongoDB conectado internamente no Servidor MCP.");
  } catch (error) {
    console.error("❌ Falha ao conectar o MongoDB no MCP:", error);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Servidor MCP de controle de transações rodando via stdio.");
}

run().catch((error) => console.error("Erro fatal no servidor:", error));
