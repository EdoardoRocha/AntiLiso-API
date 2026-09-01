function standardResponse(message, senderPhone) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: senderPhone,
    type: "text",
    text: {
      body: message,
    },
  };

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((resposta) => resposta.json())
    .then((dados) => {
      if (dados.error) {
        console.log("Não foi possível enviar a mensagem: ", dados);
        standardResponse(
          "Tive um pequeno imprevisto para te responder agora, tenta de novo jajá, certo?",
          senderPhone,
        );
        return
      }

      console.log("✅ Mensagem enviada com sucesso!", dados);
    })
    .catch((error) =>
      console.log("Não foi possível enviar a mensagem: ", error),
    );
}

export default standardResponse;
