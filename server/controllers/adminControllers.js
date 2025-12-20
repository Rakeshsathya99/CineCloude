import Booking from '../models/Booking.js'
import Show from '../models/show.js'
import User from '../models/User.js'

// API to check if user is admin
export const isAdmin = async (req, res) => {
    try {
        const auth = req.auth && typeof req.auth === 'function' ? req.auth() : req.auth;
        const userId = auth?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Not Authorised' });

        const { clerkClient } = await import('@clerk/express');
        const user = await clerkClient.users.getUser(userId);
        const role = user?.publicMetadata?.role;
        const isAdmin = role === 'admin';
        console.log('isAdmin check - userId:', userId, 'role:', role, 'isAdmin:', isAdmin);
        return res.json({ success: true, isAdmin });
    } catch (error) {
        console.error('isAdmin error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

//API to get dashbord Users

export const getDashboardUsers = async(req, res) => {   
    try{
        const bookings = await Booking.find({isPaid: true})
        const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie')
        const totalUsers = await User.countDocuments()

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUsers
        }
        return res.json({success: true, dashboardData})
    } catch(error){
        console.error('getDashboardUsers error:', error.message || error);
        return res.status(500).json({success: false, message: error.message || 'Server error'})
    }
}

// API to get All Shows 

export const getAllShows = async(req, res) => {
    try{
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1})
        res.json({success: true, shows})
    }catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get All Bookings

export const getAllBookings = async(req, res) => {
    try {
        const bookings = await Booking.find().populate('user').populate({
            path: 'show',
            populate: {path:'movie'}
        }).sort({createdAt: -1})
        res.json({success: true, bookings})
    }catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
