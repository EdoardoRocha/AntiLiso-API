import jwt from "jsonwebtoken";
import { getToken } from "../helpers/get-token.js";

export const authToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ message: "Acesso negado!" });
    return;
  }
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ message: "Acesso negado!" });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.AUTH_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido!" });
  }
};
