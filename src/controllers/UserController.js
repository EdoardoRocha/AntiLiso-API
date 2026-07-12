//Models
import User from "../models/User.js";

//Dependencies
import bcrypt from "bcryptjs";
import { createUserToken } from "../helpers/create-user-token.js";
import { styleText } from "node:util";

export default class UserController {
  static async register(req, res) {
    const { name, phone, email, password } = req.body;

    //create password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      phone,
      email,
      password: passwordHash,
    });

    try {
      const newUser = await user.save();
      const createdUser = await createUserToken(newUser);

      res.status(201).json({
        message: "Vocês está autenticado",
        token: createdUser,
        userId: newUser._id,
      });
    } catch (error) {
      console.error(
        styleText(
          ["red", "bold"],
          "Erro critíco ao tentar criar novo usuário no banco " + error,
        ),
      );
      res.status(500).json({
        message: `Erro interno ao tentar fazer cadastro: ${error.message}`,
      });
    }
  }

  static async login(req, res) {
    const email = req.body.email;

    try {
      const user = await User.findOne({ email }).select("-password");
      const createdUser = await createUserToken(user);

      res.status(200).json({
        message: "Vocês está autenticado",
        token: createdUser,
        user,
      });
    } catch (error) {
      console.error(
        styleText(
          ["red", "bold"],
          "Erro critíco ao tentar fazer login de usuário no banco " + error,
        ),
      );
      res.status(500).json({
        message: `Erro interno ao tentar fazer login: ${error.message}`,
      });
    }
  }
}
