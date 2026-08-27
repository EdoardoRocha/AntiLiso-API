import "dotenv/config";
import express from "express";
import cors from "cors";
import { styleText } from "node:util";

//Make APP
const app = express();
app.use(express.json());
app.use(express.static("src/uploads"));

//Solve cors
app.use(cors());

//Import helpers
import searchByNumber from "./src/helpers/search-user-by-phone.js";
import verifyTrialDate from "./src/helpers/verify-trial-status.js";
import standardResponse from "./src/helpers/standard-response.js";
import verifyLastPayment from "./src/helpers/verify-last-payment.js";
import downloadWhatsAppMedia from "./src/helpers/download-image.js";

//Import Controllers
import ConversationController from "./src/controllers/MessageController.js";

//Global variables
let PHONE_NUMBER = null;

// ==========================================
// HANDSHAKE META
// ==========================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode == "subscribe" && token == process.env.VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  const body = req.body;

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      const messageData = value.messages[0];

      const senderPhone = messageData.from;
      // const messageText = messageData.text?.body;
      PHONE_NUMBER = senderPhone;

      let messageText = "";
      let localImgUrl = null;

      if (messageData.type === "text") {
        messageText = messageData.text?.body || "";
      } else if (messageData.type === "image") {
        messageText = messageData.image?.caption || "";
        const imageId = messageData.image.id;

        localImgUrl = await downloadWhatsAppMedia(imageId);
      } else {
        res.status(200).send("EVENT_RECEIVED");
        return;
      }

      const currentUser = await searchByNumber(senderPhone);

      if (!currentUser || typeof currentUser === "string") {
        console.log(currentUser || "Usuário não encontrado");
        standardResponse(currentUser, senderPhone);
        return;
      }

      const isTrial = await verifyTrialDate(currentUser);
      const lastPayment = await verifyLastPayment(currentUser);

      if (!isTrial.active && !lastPayment.isPaid) {
        standardResponse(
          "Seu período de teste expirou e não encontramos um pagamento ativo.",
          senderPhone,
        );
        return;
      }

      const reply = await ConversationController.antilisoAI(
        messageText,
        currentUser._id,
        senderPhone,
        localImgUrl,
      );
      standardResponse(reply, senderPhone);
    }
  } catch (error) {
    console.error("Erro interno:", error);
  } finally {
    res.status(200).send("EVENT_RECEIVED");
  }
});

app.listen(process.env.PORT, () => {
  const msgServidor = `Servidor de ${process.env.NODE_ENV} rodando na porta ${styleText(["cyan", "bold", "underline"], `${process.env.PORT}`)}`;
  console.log(styleText("blue", msgServidor));
});
