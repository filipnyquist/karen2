import { useState, useEffect } from "react";
import { eden } from "../eden";
import { Ticket, CheckCircle, Clock, Gift, QrCode, X } from "lucide-react";

interface TicketData {
  id: string;
  qrCodeData: string;
  createdAt: string;
  redeemedAt: string | null;
  event: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  };
  givenBy: {
    id: string;
    name: string;
  } | null;
  redeemedAtEvent: {
    id: string;
    title: string;
    startTime: string;
  } | null;
  isRedeemed: boolean;
}

export function MyTickets() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setIsLoading(true);
    const { data } = await eden.tickets["my-tickets"].get();
    if (data?.tickets) {
      setTickets(data.tickets);
    }
    setIsLoading(false);
  }

  // Generate QR code URL using a public API
  function getQRCodeUrl(data: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  }

  const activeTickets = tickets.filter((t) => !t.isRedeemed);
  const redeemedTickets = tickets.filter((t) => t.isRedeemed);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Skip Queue Tickets</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center py-12">
            <Ticket className="w-16 h-16 text-base-content/30 mb-4" />
            <h2 className="card-title">No tickets yet</h2>
            <p className="text-base-content/70">
              Tickets are given to workers after completing events. Work at pub
              or club events to earn skip queue tickets!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Active Tickets */}
          {activeTickets.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Active Tickets ({activeTickets.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-primary"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="card-body">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">
                            {ticket.event.title}
                          </h3>
                          <p className="text-sm text-base-content/70">
                            Earned on{" "}
                            {new Date(ticket.createdAt).toLocaleDateString(
                              "sv-SE"
                            )}
                          </p>
                        </div>
                        <div className="bg-primary text-primary-content p-2 rounded-lg">
                          <QrCode className="w-6 h-6" />
                        </div>
                      </div>

                      {ticket.givenBy && (
                        <p className="text-sm mt-2">
                          <Gift className="w-4 h-4 inline mr-1" />
                          Given by {ticket.givenBy.name}
                        </p>
                      )}

                      <div className="mt-4 pt-4 border-t border-base-200">
                        <p className="text-sm text-center text-base-content/70">
                          Click to show QR code
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Redeemed Tickets */}
          {redeemedTickets.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Redeemed Tickets ({redeemedTickets.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {redeemedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="card bg-base-200 shadow"
                  >
                    <div className="card-body">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">
                            {ticket.event.title}
                          </h3>
                          <p className="text-sm">
                            Used at {ticket.redeemedAtEvent?.title}
                          </p>
                        </div>
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>

                      <p className="text-sm text-base-content/70 mt-2">
                        Redeemed on{" "}
                        {ticket.redeemedAt &&
                          new Date(ticket.redeemedAt).toLocaleDateString(
                            "sv-SE"
                          )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* QR Code Modal */}
      {selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setSelectedTicket(null)}
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-lg text-center mb-4">
              {selectedTicket.event.title}
            </h3>

            <div className="bg-white p-4 rounded-xl">
              <img
                src={getQRCodeUrl(selectedTicket.qrCodeData)}
                alt="QR Code"
                className="w-full h-auto"
              />
            </div>

            <p className="text-center text-sm text-base-content/70 mt-4">
              Show this QR code at the entrance to skip the queue
            </p>

            <div className="text-center mt-2">
              <p className="text-xs text-base-content/50 font-mono">
                {selectedTicket.qrCodeData.slice(0, 16)}...
              </p>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setSelectedTicket(null)}
          ></div>
        </div>
      )}
    </div>
  );
}
