import express from 'express'
import { getUserBookings, removeFavorite, updateFavorite } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/bookings', getUserBookings);
userRouter.post('/update-favorite', updateFavorite);
userRouter.get('/remove-favorite', removeFavorite);
// Add a clearer route to fetch favorites (keeps existing controller implementation)
userRouter.get('/favorites', removeFavorite);

// Debug endpoint to return current user id and role (helps troubleshoot admin access)
userRouter.get('/me', async (req, res) => {
    try {
        const auth = req.auth && typeof req.auth === 'function' ? req.auth() : req.auth;
        const userId = auth?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Not Authorised' });
        const { clerkClient } = await import('@clerk/express');
        const user = await clerkClient.users.getUser(userId);
        res.json({ success: true, userId, role: user.publicMetadata?.role || null });
    } catch (error) {
        console.error('GET /api/user/me error', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default userRouter;