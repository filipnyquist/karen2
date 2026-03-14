import { useState, useRef } from "react";
import { eden } from "../eden";
import { QrCode, Camera, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface TicketRedeemerProps {
  eventId: string;
  canRedeem: boolean;
}

interface ValidationResult {
  valid: boolean;
  ticket?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    originalEvent: {
      id: string;
      title: string;
    };
    createdAt: string;
  };
}

export function TicketRedeemer({ eventId, canRedeem }: TicketRedeemerProps) {
  const [qrCode, setQrCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function validateTicket() {
    if (!qrCode.trim()) return;

    setIsValidating(true);
    setError("");
    setValidationResult(null);
    setRedeemSuccess(false);

    const { data, error: apiError } = await eden.tickets.redeem.post({
      qrCode: qrCode.trim(),
    });

    if (apiError) {
      setError("Invalid ticket or already redeemed");
    } else if (data) {
      setValidationResult(data as ValidationResult);
    }

    setIsValidating(false);
  }

  async function redeemTicket() {
    if (!qrCode.trim()) return;

    setIsValidating(true);
    setError("");

    const { data, error: apiError } = await eden.tickets.redeem.post({
      qrCode: qrCode.trim(),
      eventId,
    });

    if (apiError) {
      setError("Failed to redeem ticket");
    } else if (data) {
      setRedeemSuccess(true);
      setQrCode("");
      setValidationResult(null);
    }

    setIsValidating(false);
  }

  function reset() {
    setQrCode("");
    setValidationResult(null);
    setRedeemSuccess(false);
    setError("");
    inputRef.current?.focus();
  }

  if (!canRedeem) {
    return null;
  }

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h3 className="card-title flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Redeem Skip Queue Ticket
        </h3>

        {error && (
          <div className="alert alert-error">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {redeemSuccess ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <p className="text-xl font-semibold text-success">Ticket Redeemed!</p>
            <p className="text-base-content/70 mt-2">
              The guest can now skip the queue.
            </p>
            <button className="btn btn-primary mt-4" onClick={reset}>
              <RefreshCw className="w-4 h-4" />
              Redeem Another
            </button>
          </div>
        ) : validationResult ? (
          <div className="space-y-4">
            <div className="alert alert-success">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Valid Ticket</p>
                <p className="text-sm">
                  Owner: {validationResult.ticket?.user.name}
                </p>
                <p className="text-sm">
                  Earned at: {validationResult.ticket?.originalEvent.title}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-primary flex-1"
                onClick={redeemTicket}
                disabled={isValidating}
              >
                {isValidating ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Redeeming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Redemption
                  </>
                )}
              </button>
              <button className="btn btn-ghost" onClick={reset}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Enter QR Code or Scan</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                className="input input-bordered w-full font-mono"
                placeholder="Paste QR code data here..."
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && validateTicket()}
              />
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={validateTicket}
              disabled={!qrCode.trim() || isValidating}
            >
              {isValidating ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  Validating...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Validate Ticket
                </>
              )}
            </button>

            <p className="text-sm text-base-content/70 text-center">
              Scan the guest&apos;s QR code or ask them to paste the code here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
