import "dotenv/config";
import express from "express";
import cors from "cors";
import { styleText } from "node:util";
import { initAgent } from "./src/ai/agent.js";

//Init Agent AI
initAgent().catch((err) => {
  console.error("Falha crítica na inicialização:" + err);
});

//Make APP
const app = express();

app.use(express.json());

//Solve cors
app.use(cors());

//Main routes
import UserRoutes from "./src/routes/UserRoutes.js";
import ConversationRoutes from "./src/routes/ConversationRoutes.js";

app.use("/api/v1", UserRoutes);
app.use("/api/v1", ConversationRoutes);

app.listen(process.env.PORT, () => {
  const msgServidor = `Servidor de ${process.env.NODE_ENV} rodando na porta ${styleText(["cyan", "bold", "underline"], `${process.env.PORT}`)}`;
  console.log(styleText("blue", msgServidor));
});
