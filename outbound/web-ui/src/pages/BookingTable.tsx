import { api } from "@/utils/api";
import { AiOutlineReload } from "react-icons/ai";
import { Button } from "@/components/ui/button"; // Ensure this is styled properly
import { useState } from "react";

export default function BookingTable() {
  const {
    data: bookings,
    isLoading,
    isFetching,
    error,
    refetch,
  } = api.slots.getAllSlots.useQuery();

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading bookings.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">All Bookings</h2>
        <Button onClick={handleRefresh} disabled={isFetching}>
          {isFetching ? (
            <AiOutlineReload className="h-5 w-5 animate-spin" />
          ) : (
            <AiOutlineReload className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.map((booking) => (
              <tr key={booking.id} className="border-t">
                <td className="p-2 border">{booking.id}</td>
                <td className="p-2 border">{booking.name}</td>
                <td className="p-2 border">
                  {new Date(booking.date).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
