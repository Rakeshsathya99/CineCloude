import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContextCore";

const ListBookings = () => {

   const { axios, getToken, user } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  const getAllBookings = async () => {
    try {
     const { data } = await axios.get('/api/admin/all-bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      setIsLoading(false); 
      if (data?.success) {
        setBookings(data.bookings);
      } else {
        console.error('Error fetching bookings:', data.message);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if(user){
      getAllBookings();
    }
  }, [user]);

  const filteredBookings = bookings.filter((item) => {
    if (!filterDate) return true;
    const itemDate = new Date(item.show.showDateTime).toISOString().split("T")[0];
    return itemDate === filterDate;
  });

  const totalAmount = filteredBookings.reduce((sum, item) => sum + item.amount, 0);

  return !isLoading ? (
    <>
      <Title textl="List" text2="Bookings" />

      <div className="flex flex-wrap justify-between items-center my-6 gap-4">
        <div className="flex items-center gap-3">
          <p className="text-gray-400">Filter by Date:</p>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 outline-none" />
        </div>
        <p className="text-lg font-medium">
          Total Earnings: <span className="text-primary">{currency} {totalAmount}</span>
        </p>
      </div>

      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table
          className="w-full border-collapse rounded-md overflow-hidden
text-nowrap"
        >
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">User Name</th>
              <th className="p-2 font-medium">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {filteredBookings.map((item, index) => (
              <tr
                key={index}
                className="border-b border-primary/20
                bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 min-w-45 pl-5">{item.user.name}</td>
                <td className="p-2">{item.show.movie.title}</td>
                <td className="p-2">{dateFormat(item.show.showDateTime)}</td>
                <td className="p-2">
                  {Object.keys(item.bookedSeats)
                    .map((seat) => item.bookedSeats[seat])
                    .join(", ")}
                </td>
                <td className="p-2">
                  {currency} {item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListBookings;
