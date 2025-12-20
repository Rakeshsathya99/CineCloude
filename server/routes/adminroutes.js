import express from 'express'
import { getAllBookings, getAllShows, getDashboardUsers, isAdmin } from '../controllers/adminControllers.js';
import { protectAdmin } from '../middleware/auth.js';

const adminRouter = express.Router();

// Public endpoint any logged-in user can call to check if they are admin
adminRouter.get('/is-admin', isAdmin)

// The following routes require admin access
adminRouter.get('/dashboard-users', protectAdmin, getDashboardUsers)
adminRouter.get('/all-shows', protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)

export default adminRouter;