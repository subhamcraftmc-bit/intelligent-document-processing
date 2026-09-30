import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validateBody } from '../middleware/validate.js';
import { AuthRegisterSchema, AuthLoginSchema } from '../schemas/documentSchemas.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', validateBody(AuthRegisterSchema), authController.register);
router.post('/login', validateBody(AuthLoginSchema), authController.login);
router.post('/demo', authController.demoLogin);
router.get('/demo', authController.demoLogin);
router.get('/me', requireAuth, authController.getMe);

export default router;
