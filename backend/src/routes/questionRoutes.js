import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getProductQuestions,
  askQuestion,
  answerQuestion,
  deleteQuestion,
  upvoteQuestion,
  getSellerQuestions,
} from "../controllers/questionController.js";

const router = Router();

// Public — get questions for a product
router.get("/product/:productId", getProductQuestions);

// Authenticated routes
router.use(authMiddleware);

// Seller — manage their Q&A
router.get("/seller", roleMiddleware("seller"), getSellerQuestions);
router.put("/:id/answer", roleMiddleware("seller"), answerQuestion);

// Buyer — ask and upvote
router.post("/product/:productId", askQuestion);
router.post("/:id/upvote", upvoteQuestion);

// Either party — delete
router.delete("/:id", deleteQuestion);

export default router;
