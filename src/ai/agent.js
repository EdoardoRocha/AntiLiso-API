import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { getAntiLisoSystemPrompt } from "./prompts.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error(
    "\x1b[31mErro:\x1b[0m A variável GEMINI_API_KEY não está definida no arquivo .env",
  );
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const toolClientMap = new Map();
let allMcpTools = [];
let geminiTools = [];

const chatConfig = {
  systemInstruction: getAntiLisoSystemPrompt(),
  temperature: 0.2,
};

function formatSchemaForGemini(schema) {
  if (!schema) return undefined;
  const jsonClone = JSON.parse(JSON.stringify(schema));

  const convertTypesToUpperCase = (obj) => {
    if (obj.type && typeof obj.type === "string") {
      obj.type = obj.type.toUpperCase();
    }

    if (obj.properties) {
      for (const key in obj.properties) {
        convertTypesToUpperCase(obj.properties[key]);
      }
    }
  };

  convertTypesToUpperCase(jsonClone);
  return jsonClone;
}

export async function initAgent() {
  console.error("⏳ Inicializando o ecossistema MCP...");

  const serverFiles = ["src/ai/tools/transaction-server.js"];

  for (const serverFile of serverFiles) {
    const transport = new StdioClientTransport({
      command: "node",
      args: [serverFile],
    });

    const mcpClient = new Client(
      {
        name: `anti-liso-${serverFile}`,
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    await mcpClient.connect(transport);
    console.error(`✅ ${serverFile} conectado com sucesso ao servidor MCP.`);

    const mcpToolsResponse = await mcpClient.listTools();
    const mcpTools = mcpToolsResponse.tools || [];

    mcpTools.forEach((tool) => {
      toolClientMap.set(tool.name, mcpClient);
    });

    allMcpTools = allMcpTools.concat(mcpTools);
  }

  geminiTools = allMcpTools.map((tool) => {
    const schemaForGemini = formatSchemaForGemini(tool.inputSchema);

    if (schemaForGemini && schemaForGemini.properties) {
      delete schemaForGemini.properties.userId;

      if (schemaForGemini.required) {
        schemaForGemini.required = schemaForGemini.required.filter(
          (req) => req !== "userId",
        );
      }
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: schemaForGemini,
    };
  });

  if (geminiTools.length > 0) {
    chatConfig.tools = [{ functionDeclarations: geminiTools }];
  }

  console.error(
    `🤖 Ferramentas MCP carregadas: ${geminiTools.map((t) => t.name).join(", ")}`,
  );
}

export async function runAgent(message, history = [], userId) {
  const chat = ai.chats.create({
    model: "gemini-3.5-flash",
    config: chatConfig,
    history,
  });

  let response = await chat.sendMessage({ message });

  while (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];

    const targetClient = toolClientMap.get(call.name);

    if (!targetClient) {
      throw new Error(
        `Servidor para a ferramenta ${call.name} não encontrado.`,
      );
    }

    const argsWithUserId = {
      ...call.args,
      userId,
    };
    const mcpResult = await targetClient.callTool({
      name: call.name,
      arguments: argsWithUserId,
    });

    const contextText =
      mcpResult.content?.[0]?.text || "Nenhum dado retornado.";

    response = await chat.sendMessage({
      message: {
        functionResponse: {
          name: call.name,
          response: { result: contextText },
        },
      },
    });
  }
  return response.text;
}
