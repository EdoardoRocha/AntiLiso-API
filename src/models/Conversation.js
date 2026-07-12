import mongoose from "mongoose";

// Schema individual para cada mensagem dentro da conversa
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"], // Padrão usado pelas IAs
      required: true,
    },
    parts: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "Nova Conversa",
    },
    messages: [messageSchema],
  },
  {
    timestamps: true
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;