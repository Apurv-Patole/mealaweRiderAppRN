import { toLatLng, type LatLng } from '@/lib/geo';
import type { StatusTone } from '@/theme/statusColors';

import { lifecycleOfKey, statusKeyOf, type OrderLifecycle } from './lifecycle';

/** A rider's order, normalised from the server's `FoodOrder` (pure, no React Native imports). */
export interface OrderItem {
  name: string;
  count: number;
}

/** One billed line (an item or an add-on): what it is, how many, and what it comes to. */
export interface OrderLine {
  name: string;
  count: number;
  total: number;
}

/** One entry of the order's status history: a normalised status and when it was set (ISO). */
export interface StatusStep {
  statusKey: string;
  at: string;
}

export interface OrderParty {
  name: string;
  phone: string;
  address: string;
  landmark: string;
  /** Null when the server has no usable coordinates for this address. */
  location: LatLng | null;
}

export interface RiderOrder {
  id: string;
  orderNo: string;
  mealType: string;
  /** Lower-case status without separators, for comparisons. */
  statusKey: string;
  lifecycle: OrderLifecycle;
  kitchen: OrderParty;
  customer: OrderParty;
  items: OrderItem[];
  /** The same items with their prices, for the detail screen. */
  itemLines: OrderLine[];
  addOns: OrderLine[];
  addOnCount: number;
  /** Type of order, for example "allDay" or "advance". Empty when the server did not say. */
  orderType: string;
  statusHistory: StatusStep[];
  /** Photo taken at the kitchen when the order was picked up, or an empty string. */
  pickupProofUrl: string;
  /** Photo taken at delivery, or an empty string. */
  deliveryProofUrl: string;
  /** Who the order was handed to (customer, security, neighbour...), or an empty string. */
  handOverTo: string;
  /** ISO time the delivery proof was captured, or null. */
  proofCapturedAt: string | null;
  packageName: string;
  specialRequest: string;
  totalAmount: number;
  /** The delivery date the server recorded (ISO), or an empty string. */
  orderDate: string;
  /** ISO timestamps of the delivery slot window, or null. */
  slotStart: string | null;
  slotEnd: string | null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value).trim();
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function isoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

function joinAddress(...parts: unknown[]): string {
  return parts.map(text).filter(Boolean).join(', ');
}

/** Maps a raw server order to `RiderOrder`. Returns null when it has no id. */
export function normalizeOrder(raw: unknown): RiderOrder | null {
  const order = record(raw);
  const id = text(order._id ?? order.orderId ?? order.id);
  if (!id) return null;

  const kitchenAddress = record(order.kitchenAddress);
  const customerLocation = record(order.customerLocation);
  const statusKey = statusKeyOf(order);
  const amount = Number(order.totalAmount ?? order.amount);

  const priceOf = (line: Record<string, unknown>) => Number(line.mealawePrice ?? line.itemPrice ?? 0) || 0;
  const lineOf = (nameKey: string) => (line: Record<string, unknown>): OrderLine => {
    const count = Math.max(1, Number(line.count) || 1);
    return { name: text(line[nameKey]), count, total: count * priceOf(line) };
  };
  const itemLines = (Array.isArray(order.itemList) ? order.itemList : [])
    .map(record)
    .filter((line) => text(line.itemName))
    .map(lineOf('itemName'));
  const addOns = (Array.isArray(order.addOns) ? order.addOns : [])
    .map(record)
    .filter((line) => text(line.addOnName))
    .map(lineOf('addOnName'));
  const statusHistory = (Array.isArray(order.statusHistory) ? order.statusHistory : [])
    .map(record)
    .map((entry) => ({ statusKey: text(entry.orderstatus).replace(/[\s_-]/g, '').toLowerCase(), at: isoOrNull(entry.updatedOn) ?? '' }))
    .filter((entry) => entry.statusKey !== '');

  const items = (Array.isArray(order.itemList) ? order.itemList : [])
    .map(record)
    .filter((item) => text(item.itemName))
    .map((item) => ({ name: text(item.itemName), count: Math.max(1, Number(item.count) || 1) }));

  return {
    id,
    orderNo: text(order.orderNo) || id,
    mealType: text(order.mealType),
    statusKey,
    lifecycle: lifecycleOfKey(statusKey),
    kitchen: {
      name: text(order.kitchenName) || 'Kitchen',
      phone: text(order.kitchenPhoneNo),
      address: joinAddress(kitchenAddress.address1, kitchenAddress.address2),
      landmark: text(kitchenAddress.landmark),
      location: toLatLng(order.kitchenGeolocation),
    },
    customer: {
      name: text(order.customerName) || 'Customer',
      phone: text(order.customerPhoneNo),
      address: joinAddress(customerLocation.address, customerLocation.location),
      landmark: text(customerLocation.landmark),
      location: toLatLng(customerLocation.geolocation),
    },
    items,
    itemLines,
    addOns,
    orderType: text(order.orderType),
    statusHistory,
    pickupProofUrl: text(order.pickupProofUrl),
    deliveryProofUrl: text(order.proofImageUrl),
    handOverTo: text(order.handOverTo),
    proofCapturedAt: isoOrNull(order.proofCapturedAt) ?? isoOrNull(order.orderComplitionDate),
    addOnCount: Array.isArray(order.addOns) ? order.addOns.length : 0,
    packageName: text(record(order.mealPackage).packageName),
    specialRequest: text(order.specialRequest),
    totalAmount: Number.isFinite(amount) ? amount : 0,
    orderDate: isoOrNull(order.orderDate) ?? '',
    slotStart: isoOrNull(order.slotStartTime),
    slotEnd: isoOrNull(order.slotEndTime),
  };
}

/** Normalises a list of raw orders, dropping any that cannot be identified. */
export function normalizeOrders(raw: unknown): RiderOrder[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeOrder).filter((order): order is RiderOrder => order !== null);
}

const LABELS: Record<string, string> = {
  placed: 'Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  readytodelivery: 'Ready for pickup',
  readyfordelivery: 'Ready for pickup',
  deliveryboyassigned: 'Assigned',
  handedovertodeliveryboy: 'Picked up',
  outfordelivery: 'On the way',
  ontheway: 'On the way',
  delivered: 'Delivered',
  deliverycompleted: 'Delivered',
};

/** Rider-facing status text. */
export function statusLabel(order: Pick<RiderOrder, 'statusKey' | 'lifecycle'>): string {
  if (order.lifecycle === 'cancelled') return 'Cancelled';
  return LABELS[order.statusKey] ?? 'In progress';
}

/** Status colour tone (plan section 8.3): blue assigned, amber ready, mint on the way, green done, red cancelled. */
export function statusTone(order: Pick<RiderOrder, 'statusKey' | 'lifecycle'>): StatusTone {
  if (order.lifecycle === 'cancelled') return 'cancelled';
  if (order.lifecycle === 'done') return 'done';
  if (order.lifecycle === 'postPickup') return 'onTheWay';
  if (order.statusKey === 'readytodelivery' || order.statusKey === 'readyfordelivery') return 'ready';
  if (order.lifecycle === 'prePickup') return 'assigned';
  return 'offline';
}

/** Whole rupees with Indian digit grouping: "₹1,250", "₹1,25,000". */
export function formatRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
