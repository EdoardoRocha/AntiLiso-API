import axios from "axios";
import fs from "fs";
import path from "path";

export default async function downloadWhatsAppMedia(imageId) {
  try {
    const urlResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${imageId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
      },
    );

    const mediaUrl = urlResponse.data.url;

    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      responseType: "arraybuffer",
    });

    const fileName = `${Date.now() + String(Math.floor(Math.random() * 1000))}.jpg`;
    const filePath = path.join(process.cwd(), "src", "uploads", fileName);

    fs.writeFileSync(filePath, mediaResponse.data);

    const publicUrl = `${process.env.PUBLIC_SERVER_URL}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error(
      "Erro ao baixar imagem do WhatsApp:",
      error?.response?.data || error.message,
    );
    return null;
  }
}
