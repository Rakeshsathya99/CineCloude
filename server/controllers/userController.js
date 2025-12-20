import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/movie.js";

// API controller Fuction to get User Booking 

export const getUserBookings = async(req, res) => {
    try {
        const auth = req.auth && typeof req.auth === 'function' ? req.auth() : req.auth;
        const user = auth?.userId;
        if (!user) return res.status(401).json({ success: false, message: 'Not Authorised' });

        const bookings = await Booking.find({user}).populate({
            path: 'show',
            populate: {path: 'movie'}
        }).sort({createdAt: -1})
        res.json({success: true, bookings})
    } catch (error) {
        console.error('getUserBookings error:', error?.message || error);
        res.status(500).json({success: false, message: error.message})
    }
}

// API controller Fuction to update favorite Movie in the Clerk User Metdata

export const updateFavorite = async(req, res) => {
    try {
        const {movieId} = req.body;
        const userId = req.auth().userId;

        const user= await clerkClient.users.getUser(userId);
       
        if (!user.privateMetadata.favoriteitems) {
            user.privateMetadata.favoriteitems = [];
        }
        if (!user.privateMetadata.favoriteitems.includes(movieId)) {
            user.privateMetadata.favoriteitems.push(movieId);
        }else{
            user.privateMetadata.favoriteitems = user.privateMetadata.favoriteitems.filter
            (item => item !== movieId);
        }   
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: {
                ...user.privateMetadata,
            }
        });

        res.json({success: true, message: "Favorite Movie Updated Successfully"});

    } catch (error) {
         console.log(error.message)
        res.status(500).json({message: error.message})
    }
}

// API to remove favorite movie from Clerk User Metadata

export const removeFavorite = async(req, res) => {
    try {
        const user = await clerkClient.users.getUser(req.auth().userId);
        const favoriteitems = user.privateMetadata.favoriteitems;

        //Getting movies from database
        const movies = await Movie.find({ _id: { $in: favoriteitems } });
        res.json({success: true, movies})
    } catch (error) {
         console.log(error.message)
         res.status(500).json({message: error.message})
    }
}