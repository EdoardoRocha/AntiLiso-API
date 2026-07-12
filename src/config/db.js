import mongoose, { mongo } from "mongoose";
import { styleText } from "node:util";

const urlConnection = process.env.MONGO_URL;

async function main() {
  try {
    console.log(styleText(["dim", "bold"], "Conectando banco de dados..."));
    await mongoose.connect(urlConnection);
    console.log(styleText(["greenBright", "bold"], "✔ Mongo conectado."));
  } catch (error) {
    console.error(
      styleText(
        ["red", "bold"],
        "Erro critíco ao tentar conectar com o MongoDB.",
      ),
    );
  }
}

main();

export default mongoose;
