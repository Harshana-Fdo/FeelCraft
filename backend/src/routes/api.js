import { Router } from 'express';
import { health } from '../controllers/health.js';

export const api = Router();
api.get('/health', health);
