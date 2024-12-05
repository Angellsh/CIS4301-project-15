import {Router } from 'express'
import {register, login, logout, resetPassword, verifyCode, setNewPassword} from '../controllers/authController'
import { getStockById } from '../stock';
import { getStockPerf } from '../stockperf';
import { getTrendingStocks } from "../trending"
import { refreshToken } from "../controllers/refreshToken";
import {processQuery} from "../query"

const router = Router();
router.post('/register',  register);
router.post('/login',  login);
router.post('/refresh-token',  refreshToken)
router.post('/reset-password', resetPassword);
router.post('/logout',login );
router.post('/verify-code', verifyCode);
router.post('/new-password', setNewPassword);
router.post('/lookup-stock',getStockById);
router.post('/lookup-stock-performance',getStockPerf);
router.post("/trending-stocks",getTrendingStocks);
router.get('/trending-stocks', getTrendingStocks);
router.post('/process-query', processQuery);
export default router;