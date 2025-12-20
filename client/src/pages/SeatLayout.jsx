import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContextCore";

const SeatLayout = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"]
  ];

  const { id, date } = useParams();
  const [selectedSeats, setSlectedSeats] = useState([]);
  const [selectedTime, setSlectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  // const navigate = useNavigate();

  const { axios, getToken, user } = useAppContext();

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      console.log('getShow response:', data);
      if (data.success) {
        setShow(data);
      } else {
        toast.error(data.message || 'Failed to load show');
      }
    } catch (error) {
      console.error('getShow error:', error);
      toast.error(error.message || 'Failed to load show');
    }
  }

  const handelSeatClick = (seatId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Seat clicked:', seatId);
    if (!selectedTime) {
      return toast("Please Select time first");
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast("You can only Select 5 Seats");
    }
    if (occupiedSeats.includes(seatId)) {
      return toast.error('Seat already occupied, please select another seat');
    }
    setSlectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const renderSeats = (row, count = 9) => {
    return (
      <div key={row} className="flex gap-2 mt-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`;
            return (
              <button
                key={seatId}
                onClick={(e) => handelSeatClick(seatId, e)}
                disabled={occupiedSeats.includes(seatId)}
                title={occupiedSeats.includes(seatId) ? 'Occupied' : seatId}
                className={`h-8 w-8 rounded border border-primary/60
                  ${occupiedSeats.includes(seatId) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
                    selectedSeats.includes(seatId) && "bg-primary text-white"
                  }`}
              >
                {seatId}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

    const getOccupiedSeats = async () => {
    try {
      if (!selectedTime || !selectedTime.showId) {
      setOccupiedSeats([]);
      return;
    }

    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats || []);
      } else {
        toast.error(data.message || 'Failed to fetch occupied seats');
        setOccupiedSeats([]);
      }
    } catch (error) {
      console.error('getOccupiedSeats error:', error);
      toast.error(error.message || 'Failed to fetch occupied seats');
      setOccupiedSeats([]);
    }
    } catch (error) {
      console.log(error)
    }
  }

  const bookTickets = async () => {
    try {
      if(!user){
        return toast.error('Please login to proceed');
      }
      if(!selectedTime || !selectedSeats.length){
        return toast.error('Please select show time and seats');
      }

      console.log('selectedTime:', selectedTime);
      console.log('selectedTime.showId:', selectedTime.showId);
      console.log('selectedSeats:', selectedSeats);

      if(!selectedTime.showId) {
        return toast.error('Show ID not found. Please refresh and try again.');
      }

      const { data } = await axios.post('/api/booking/create', { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      console.log('bookTickets response:', data);
      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || 'Failed to book tickets');
      }
    } catch (error) {
      console.error('bookTickets error:', error);
      toast.error(error.response?.data?.message || error.message || "An error occurred while booking tickets");
    }
  }

  useEffect(() => {
    getShow();
  }, [id]);

  useEffect(() => {
    if(selectedTime){
      getOccupiedSeats()
    }
  }, [selectedTime])

  return show ? (
    <div
      className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30
    md:pt-50"
    >
      {/*Available Timings */}
      <div
        className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10
      h-max md:sticky md:top-30"
      >
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {show.dateTime && show.dateTime[date] ? (
            show.dateTime[date].map((item) => (
              <div
                key={item.time}
                onClick={() => setSlectedTime(item)}
                className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md
            cursor-pointer transition ${
              selectedTime?.time === item.time
                ? "bg-primary text-white"
                : "hover:bg-primary/20"
            }`}
            >
              <ClockIcon className="w-4 h-4" />
              <p className="text-sm">{isoTimeFormat(item.time)}</p>
            </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-6">No timings available for this date</p>
          )}
        </div>
      </div>
      {/*Seat Layout */}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="100px" left="100px" />
        <BlurCircle bottom="0" right="0" />
        <h1 className="text-2xl font-semibold mb-4">Select Your Seat</h1>
        <img src={assets.screenImage} alt="screen" className="w-full max-w-2xl" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>
        <div className="flex flex-col items-center mt-10 text-x5 text-gray-300">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
            {groupRows[0].map((row) => renderSeats(row))}
          </div>
          <div className="grid grid-cols-2 gap-11">
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2">
                {group.map((row) => renderSeats(row))}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={bookTickets}
          disabled={!selectedTime || selectedSeats.length === 0}
          className={`flex 
          items-center gap-1 mt-20 px-10 py-3 text-sm rounded-full font-medium ${!selectedTime || selectedSeats.length === 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary hover:bg-primary-dull transition cursor-pointer'}
          active:scale-95`}
        >
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
