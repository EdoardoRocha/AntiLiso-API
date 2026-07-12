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
    },
    {
      timestamps: true,
    },
  ),
);

export default User;
