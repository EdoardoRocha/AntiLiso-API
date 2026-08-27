import mongoose from "../config/db.js";
import { Schema } from "mongoose";

const User = mongoose.model(
  "User",
  new Schema(
    {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      trial: [
        {
          isTrial: {
            type: Boolean,
            default: true,
          },
          untilValid: {
            type: Date,
            default: () => {
              const now = new Date();
              now.setDate(now.getDate() + 30);
              return now;
            },
          },
        },
      ],
      paymentHistory: [
        {
          isPay: {
            type: Boolean,
            required: true,
            default: false,
          },
          paymentDate: {
            type: Date,
            default: null,
          },
        },
      ],
    },
    {
      timestamps: true,
    },
  ),
);

export default User;
