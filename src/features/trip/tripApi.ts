import type { LatLng } from '@/lib/geo';
import { appendPart } from '@/lib/formParts';
import { ENDPOINTS, http } from '@/services/http';

import type { QueuedAction } from './actionQueue';

/** The server calls behind pickup, delivery, start of the ride and a cancel request. */

interface ProofResponse {
  url?: string;
}

function proofForm(photoUri: string, location: LatLng | null): FormData {
  const form = new FormData();
  appendPart(form, 'image', { uri: photoUri, name: 'proof.jpg', type: 'image/jpeg' });
  if (location) {
    form.append('lat', String(location.lat));
    form.append('lng', String(location.lng));
  }
  return form;
}

/** Uploads the proof photo for an action and returns its public URL. */
export async function uploadProof(action: QueuedAction): Promise<string> {
  const base = action.kind === 'pickup' ? ENDPOINTS.trip.pickupProof : ENDPOINTS.trip.deliveryProof;
  const response = await http.post<ProofResponse>(`${base}/${encodeURIComponent(action.orderId)}`, proofForm(action.photoUri, action.location));
  if (!response?.url) throw new Error('The photo was not saved. Please try again.');
  return response.url;
}

/** Records the pickup (photo, place and time) against the shift. Also stamps the shift on the order. */
export async function completePickup(action: QueuedAction): Promise<void> {
  await http.post(ENDPOINTS.trip.pickupComplete, {
    orderId: action.orderId,
    riderId: action.riderId,
    shiftId: action.shiftId,
    proofUrl: action.proofUrl,
    latitude: action.location?.lat,
    longitude: action.location?.lng,
  });
}

interface StatusOptions {
  location: LatLng | null;
  proofImageUrl?: string | null;
  handOverTo?: string;
}

/**
 * Moves an order to its next status. The server appends to the order's history, treats a repeat as
 * a no-op, and answers 409 if the order was cancelled or already delivered.
 */
export async function setOrderStatus(
  orderId: string,
  status: 'handedOverToDeliveryBoy' | 'onTheWay' | 'delivered',
  options: StatusOptions,
): Promise<void> {
  await http.patch(`${ENDPOINTS.trip.orderStatus}/${encodeURIComponent(orderId)}/status`, {
    status,
    lat: options.location?.lat,
    lng: options.location?.lng,
    proofImageUrl: options.proofImageUrl ?? undefined,
    handOverTo: options.handOverTo || undefined,
  });
}

interface StartRideInput {
  riderId: string;
  shiftId: string;
  routeNo: string;
  location: LatLng | null;
}

/**
 * Starts the delivery ride: every picked-up order on the route becomes "on the way" (customers are
 * told), and the shift moves to the delivery stage. The first call is the one that matters and its
 * failure is returned as an error. If only the shift-stage call fails the ride still starts, as in
 * the Ionic app, so a flaky connection never blocks the rider.
 */
export async function startDeliveryRide(input: StartRideInput): Promise<void> {
  const [orders, shift] = await Promise.allSettled([
    http.put(ENDPOINTS.trip.startRide, { riderId: input.riderId, routeNo: input.routeNo }),
    http.post(ENDPOINTS.trip.startRoute, {
      shiftId: input.shiftId,
      latitude: input.location?.lat,
      longitude: input.location?.lng,
    }),
  ]);
  if (orders.status === 'rejected') throw orders.reason;
  // The shift-stage result is intentionally not an error: see the doc comment.
  void shift;
}

export interface CancelRequestInput {
  orderId: string;
  orderNo: string;
  reason: string;
  kitchenName: string;
  customerName: string;
  customerPhoneNo: string;
}

/** Asks admin to cancel or reassign an order the rider cannot deliver. Admin's decision comes back by push. */
export async function submitCancelRequest(input: CancelRequestInput): Promise<void> {
  await http.post(ENDPOINTS.trip.cancelRequest, input);
}
