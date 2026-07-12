import mongoose, { Schema } from "mongoose";

const Transaction = mongoose.model(
  "Transaction",
  new Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ["income", "expense"],
        required: true,
      },
      category: {
        type: String,
        required: true,
        index: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      date: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: true,
    },
  ),
);

export default Transaction;
