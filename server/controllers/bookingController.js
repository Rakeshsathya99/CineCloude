import Booking from '../models/Booking.js';
import Show from '../models/show.js';
import Stripe from 'stripe'
import { inngest } from '../inngest/index.js';

// function to check availability of seats for the movie

const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats || {};
    const isAnySeatTaken = selectedSeats.some(seat => Boolean(occupiedSeats[seat]));
    return !isAnySeatTaken;
  } catch (error) {
    console.log('checkSeatsAvailability error:', error.message || error);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    const { userId } = auth || {};
    if (!userId) return res.status(401).json({ success: false, message: 'Not authorised' });

    const { showId, selectedSeats } = req.body;
    console.log('createBooking request body:', JSON.stringify(req.body));
    console.log('showId:', showId, 'selectedSeats:', selectedSeats);
    
    if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      console.log('Validation failed - showId:', !!showId, 'isArray:', Array.isArray(selectedSeats), 'length:', selectedSeats?.length);
      return res.status(400).json({ success: false, message: 'showId and selectedSeats are required. Received: ' + JSON.stringify({showId, selectedSeats}) });
    }

    // check if seats are available
    const areSeatsAvailable = await checkSeatsAvailability(showId, selectedSeats);
    if (!areSeatsAvailable) {
      return res.status(400).json({ success: false, message: 'Selected Seats Are Not Available' });
    }

    // Get the Show Details 
    const showData = await Show.findById(showId).populate('movie');
    if (!showData) return res.status(404).json({ success: false, message: 'Show not found' });

    // create a new booking
    const booking = await Booking.create({
      user: userId,
      show: String(showData._id),
      amount: Number(showData.showPrice) * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    // mark seats as taken
    selectedSeats.forEach((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified('occupiedSeats');
    await showData.save();

    // Stripe Gateway Initializer

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create a Payment Intent

    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data:{
          name: showData.movie.title
        },
        unit_amount: Math.round(booking.amount * 100)
      },
      quantity: 1
    }]

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${frontendUrl}/my-bookings`,
      cancel_url: `${frontendUrl}/my-bookings`,
      line_items: line_items,
      mode: 'payment',
      metadata: {
        bookingId: booking._id.toString(),
      }, 
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60 // 30 minutes expiration
    })

    booking.paymentLink = session.url
    await booking.save();

    // Run ingest fuction sheduler function to check paymnet status afetr 10 minutes

    await inngest.sendEvent({
      name: "app/checkpayment",
      data: {
        bookingId: booking._id.toString(),
      },
    });

    return res.json({ success: true, message: 'Ticket Booked Successfully', booking, url: session.url });
  } catch (error) {
    console.log('createBooking error:', error.message || error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    if (!showId) return res.status(400).json({ success: false, message: 'showId is required' });

    const showData = await Show.findById(showId);
    if (!showData) return res.status(404).json({ success: false, message: 'Show not found' });

    const occupiedSeats = Object.keys(showData.occupiedSeats || {});
    return res.json({ success: true, occupiedSeats });
  } catch (error) {
    console.log('getOccupiedSeats error:', error.message || error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}