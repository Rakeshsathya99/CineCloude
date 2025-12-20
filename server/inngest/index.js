import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/show.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "Movie-Ticket-Booking" });

// Inngest Function to save user to database

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    console.log('syncUserCreation event received:', JSON.stringify(event));
    try {
      // Clerk payload can be nested; try multiple places
      const payload = event?.data?.user || event?.data?.attributes || event?.data || {};
      const id = payload.id || payload.user_id || payload.user?.id;
      const first_name = payload.first_name || payload.firstName || payload.name?.first;
      const last_name = payload.last_name || payload.lastName || payload.name?.last;
      const email_addresses = payload.email_addresses || payload.emails || (payload.email ? [{ email_address: payload.email }] : []);
      const image_url = payload.image_url || payload.avatar_url || payload.image;

      if (!id) throw new Error('No user id found in event payload: ' + JSON.stringify(payload));

      // Build an update object only with defined fields to avoid setting undefined values (which can trigger unique index errors)
      const update = {};
      if (email_addresses && email_addresses[0]) {
        update.email = email_addresses[0].email_address || email_addresses[0].email;
      }
      const name = [first_name, last_name].filter(Boolean).join(' ').trim();
      if (name) update.name = name;
      if (image_url) update.image = image_url;

      try {
        // Use upsert to create or update; runValidators ensures schema constraints are checked
        await User.findByIdAndUpdate(id, update, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
        console.log('syncUserCreation success for user (upsert):', id);
      } catch (dbErr) {
        // Handle duplicate key errors specially for clarity
        if (dbErr && dbErr.code === 11000) {
          console.error('syncUserCreation duplicate key error:', dbErr.keyValue || dbErr.message);
        } else {
          console.error('syncUserCreation db error:', dbErr);
        }
        throw dbErr;
      }
    } catch (err) {
      console.error('syncUserCreation error:', err);
      throw err;
    }
  },
);

// Inngest Function to delete user from database

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    console.log('syncUserDeletion event received:', JSON.stringify(event));
    try {
      const payload = event?.data?.user || event?.data?.attributes || event?.data || {};
      const id = payload.id || payload.user_id || payload.user?.id;
      if (!id) throw new Error('No user id found in deletion payload: ' + JSON.stringify(payload));
      await User.findByIdAndDelete(id);
      console.log('syncUserDeletion success for user:', id);
    } catch (err) {
      console.error('syncUserDeletion error:', err);
      throw err;
    }
  },
);

//i=Inngest Function to update user from database

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    console.log('syncUserUpdation event received:', JSON.stringify(event));
    try {
      const payload = event?.data?.user || event?.data?.attributes || event?.data || {};
      const id = payload.id || payload.user_id || payload.user?.id;
      const first_name = payload.first_name || payload.firstName || payload.name?.first;
      const last_name = payload.last_name || payload.lastName || payload.name?.last;
      const email_addresses = payload.email_addresses || payload.emails || (payload.email ? [{ email_address: payload.email }] : []);
      const image_url = payload.image_url || payload.avatar_url || payload.image;

      if (!id) throw new Error('No user id found in update payload: ' + JSON.stringify(payload));

      const userData = {
        email: email_addresses && email_addresses[0] ? (email_addresses[0].email_address || email_addresses[0].email) : undefined,
        name: [first_name, last_name].filter(Boolean).join(' '),
        image: image_url,
      };

      await User.findByIdAndUpdate(id, userData);
      console.log('syncUserUpdation success for user:', id);
    } catch (err) {
      console.error('syncUserUpdation error:', err);
      throw err;
    }
  },
);

// ingest function to cancel booking and release seats of show after 10 minutes booking created if paymetn is not made

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-after-booking-created" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000)
    await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId)

      //if the payment is not made, release seats and delete booking

      if(!booking.isPaid){
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach(() =>{
          delete show.occupiedSeats[seat];
        });
        show.markModified('occupiedSeats');
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    })
  },
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation, 
    syncUserDeletion, 
    syncUserUpdation,
    releaseSeatsAndDeleteBooking];
