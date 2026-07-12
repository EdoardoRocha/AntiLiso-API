import { Router } from "express";
const router = Router();

//Controllers
import UserController from "../controllers/UserController.js";

//Middlewares
import { validateNewUser, validateUser } from "../middlewares/validateUser.js";

router.post("/auth/register", validateNewUser, UserController.register);
router.post("/auth/login", validateUser, UserController.login);

export default router;
