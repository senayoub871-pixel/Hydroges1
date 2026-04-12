import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import usersRouter from "./users";
import authRouter from "./auth";
import profileRouter from "./profile";
import externalRouter from "./external";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/documents", documentsRouter);
router.use("/users", usersRouter);
router.use("/profile", profileRouter);
router.use("/external", externalRouter);

export default router;
