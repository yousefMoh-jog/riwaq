import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { mockPay, fakeSuccess, confirm } from "../controllers/payments.controller.js";

const router = Router();

router.post("/payments/mock-pay", authMiddleware, mockPay);
router.post("/payments/fake-success", authMiddleware, fakeSuccess);
router.post("/payments/confirm", authMiddleware, confirm);

export default router;
