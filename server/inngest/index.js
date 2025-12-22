import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/show.js";
import Movie from "../models/movie.js";
import sendEmail from "../configs/nodeMailer.js";

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

      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });
        show.markModified('occupiedSeats');
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    })
  },
);


// inngest function to send email when usrr books a show 

const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    const booking = await step.run("fetch-booking-details", async () => {
      return await Booking.findById(bookingId).populate('user').populate({
        path: 'show',
        populate: { path: 'movie', model: 'Movie' }
      })
    })

    await step.run("send-confirmation-email", async () => {
      await sendEmail({
        to: booking.user.email,
        subject: `Ticket Booking Confirmation:"${booking.show.movie.title}" booked!`,
        body: `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
                  <h2>Hi ${booking.user.name},</h2>
                <p>Your booking for <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> is confirmed.</p>
                <p>
                    <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}<br/>
                    <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
                </p>
                <p>Enjoy the show!🍿 </p>
                <p>Thanks for booking with us! <br/> Cine-Cloud Team</p>
                  </div>`
      })
    })
  }
)

// ingest function to send email to remind user about upcoming shows

const sendShowReminderEmail = inngest.createFunction(
  { id: "send-show-reminder-email" },
  { cron: "0 */8 * * *" },// Every 8 hours
  async ({ step }) => {
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours to current time
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000); // Subtract 10 minutes from the end of the window
    // const windowEnd = new Date(in8Hours.getTime()); // End of the window

    // prepare to 
    const remainderTask = await step.run("Prepare-Reminder-Task", async () => {
      const shows = await Show.find({
        showTime: { $gte: windowStart, $lte: in8Hours },
      }).populate('movie');

      const tasks = [];

      for (const show of shows) {
        if (!show.movie || !show.occupiedSeats) continue;

        const userId = [...new Set(Object.values(show.occupiedSeats))];
        if (userId.length === 0) continue;

        const users = await User.find({ _id: { $in: userId } }).select("name email")

        for (const user of users) {
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showTime
          })
        }
      }
      return tasks;
    })

    if (remainderTask.length === 0) {
      return { sent: 0, message: "No remainder to send " }
    }

    // send remiander email

    const results = await step.run('send-all-reminder', async () => {
      return await Promise.allSettled(
        remainderTask.map(task => sendEmail({
          to: task.userEmail,
          subject: `Remainder: your movie "${task.movieTitle}" starts Soon!`,
          body: `<div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f9fafb; color: #111827;">
  
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    
    <h2 style="margin-top: 0; color: #111827;">
      🎬 Hello ${task.userName},
    </h2>

    <p style="font-size: 15px; line-height: 1.6; color: #374151;">
      This is a friendly reminder that your movie booking is coming up soon.
    </p>

    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Movie</p>
      <h3 style="margin: 6px 0 12px; color: #F84565;">
        ${task.movieTitle}
      </h3>

      <p style="margin: 0; font-size: 14px; color: #6b7280;">Show Time</p>
      <p style="margin: 6px 0 0; font-size: 15px; color: #111827;">
        📅 <strong>
          ${new Date(task.showTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}
        </strong><br/>
        ⏰ <strong>
          ${new Date(task.showTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
        </strong>
      </p>
    </div>

    <p style="font-size: 15px; color: #374151;">
      ⏳ Your show starts in approximately <strong>8 hours</strong>.
      Make sure you reach the theatre on time and enjoy the experience!
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

    <p style="font-size: 14px; color: #6b7280; text-align: center;">
      Enjoy the show 🍿<br/>
      <strong>Cine-Cloud Team</strong>
    </p>

  </div>
    </div>`
        })
        ))
    })

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return {
      sent,
      failed,
      message: `Sent ${sent} emails, failed to send ${failed}.}`
    }
  }
)

const sendNewShowsNotifications = inngest.createFunction(
  { id: "send-new-show-notifications" },
  { event: "app/new-show-added" },// Every 8 hours
  async ({ event }) => {
    const {movieTitle, movieId} = event.data;

    const users = await User.find({})

      for (const user of users){
        const userEmail = user.email;
        const userName= user.name;

        const subject = `new Show Added : ${movieTitle}`;
        const body = `<div style= 'font-family: Arial, sans-serif; padding: 24px'>
        <h2>Hi ${userName},</h2>
        <p> We've just added a new show to our library:</p>
        <p> Visit our website</p>
        <br/>
        <p>Thanks. <br/> Cine-Cloud Team </p>
        </div>`;

        
        await sendEmail({
        to: userEmail,
        subject,
        body
      })
      }
      return {message:'notification sent'}
  }
)


// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminderEmail,
  sendNewShowsNotifications,
];