import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormate from "../lib/TimeFormate";
import { dateFormat } from "../lib/dateFormat";
import { useAppContext } from "../context/AppContextCore";
import { useLocation } from 'react-router-dom';
import toast from "react-hot-toast";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;

   const { axios, getToken, user, image_base_url} = useAppContext()
   const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const getMyBookings = async () => {
    try {
      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      console.log('getMyBookings response:', data);
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        toast.error(data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.log('getMyBookings error:', error);
      toast.error(error?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getMyBookings();
    }
  }, [user]);

  // If navigated to with { state: { booked: true } } (immediately after booking), refetch to reflect new booking
  useEffect(() => {
    if (location.state?.booked && user) {
      getMyBookings();
    }
  }, [location.state, user]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <div>
        <BlurCircle top="0px" left="600px" />
      </div>
      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-center text-gray-400 mt-6">You have no bookings yet.</p>
      ) : (
        bookings.map((item, index) => (
          <div
            key={item._id || index}
            className="flex flex-col md:flex-row justify-between 
      bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
          >
            <div className="flex flex-col md:flex-row">
              <img
                src={image_base_url + (item.show?.movie?.poster_path || '')}
                alt={item.show?.movie?.title || ''}
                className="md:max-w-45
      aspect-video h-auto object-cover object-bottom rounded"
              />
              <div className="flex flex-col p-4">
                <p className="text-lg font-semibold">{item.show?.movie?.title || 'Untitled'}</p>
                <p className="text-gray-400 text-sm">{timeFormate(item.show?.movie?.runtime)}</p>
                <p className="text-gray-400 text-sm mt-auto">{dateFormat(item.show?.showDateTime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className = "text-2xl font-semibold mb-3 ">{currency}{item.amount}</p>
              {!item.isPaid && <button className="bg-primary px-4 py-1.5 mb-3 
              text-sm rounded-full font-medium cursor-pointer">Pay Now</button>}
            </div>
            <div className="text-sm">
              <p><span className="text-gray-400">Total Tickets: </span>{item.bookedSeats.length}</p>
              <p><span className="text-gray-400">Seat Number: </span>{item.bookedSeats.join(", ")}</p>
            </div>
          </div>
        ))
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
