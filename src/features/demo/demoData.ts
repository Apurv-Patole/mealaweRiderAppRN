import type { LatLng } from '@/lib/geo';

import { DEMO_PHONE, DEMO_RIDER_ID } from './demoSession';

/** Seed data for the demo server: a small Pune run with two kitchens and five customers. */

export interface DemoKitchen {
  key: 'A' | 'B';
  name: string;
  phone: string;
  address1: string;
  address2: string;
  landmark: string;
  location: LatLng;
  /** Seconds after the shift starts before this kitchen marks its orders ready (0 = ready at once). */
  readyAfterSec: number;
}

export const DEMO_KITCHENS: readonly DemoKitchen[] = [
  {
    key: 'A',
    name: 'Spice Route Kitchen',
    phone: '9800000001',
    address1: '21, Baner Road',
    address2: 'Baner, Pune',
    landmark: 'Near Baner Gaon Chowk',
    location: { lat: 18.5590, lng: 73.7868 },
    readyAfterSec: 0,
  },
  {
    key: 'B',
    name: 'Green Bowl Kitchen',
    phone: '9800000002',
    address1: '5, High Street',
    address2: 'Balewadi, Pune',
    landmark: 'Near Balewadi Stadium',
    location: { lat: 18.5720, lng: 73.7790 },
    readyAfterSec: 40,
  },
];

export interface DemoCustomerSpec {
  n: number;
  name: string;
  phone: string;
  kitchen: DemoKitchen['key'];
  address: string;
  area: string;
  landmark: string;
  location: LatLng;
  items: readonly { name: string; count: number; price: number }[];
}

export const DEMO_CUSTOMERS: readonly DemoCustomerSpec[] = [
  {
    n: 1, name: 'Asha Deshmukh', phone: '9811100001', kitchen: 'A',
    address: 'Flat 402, Shree Apartments', area: 'Aundh', landmark: 'Near Aundh Gaon Chowk',
    location: { lat: 18.5580, lng: 73.8075 },
    items: [{ name: 'Veg Thali', count: 1, price: 140 }, { name: 'Buttermilk', count: 1, price: 25 }],
  },
  {
    n: 2, name: 'Rahul Kulkarni', phone: '9811100002', kitchen: 'A',
    address: '17, Pashan Link Society', area: 'Pashan', landmark: 'Behind Sutarwadi Garden',
    location: { lat: 18.5395, lng: 73.7900 },
    items: [{ name: 'Paneer Meal Box', count: 2, price: 160 }],
  },
  {
    n: 3, name: 'Priya Joshi', phone: '9811100003', kitchen: 'A',
    address: 'B-21, Lotus Residency', area: 'Sus Road', landmark: 'Near Sus Gaon Bus Stop',
    location: { lat: 18.5560, lng: 73.7640 },
    items: [{ name: 'Dal Khichdi Bowl', count: 1, price: 110 }, { name: 'Sweet Curd', count: 1, price: 30 }],
  },
  {
    n: 4, name: 'Imran Sheikh', phone: '9811100004', kitchen: 'B',
    address: '9, Balewadi Phata Road', area: 'Balewadi Phata', landmark: 'Opposite Sakal Nagar Chowk',
    location: { lat: 18.5800, lng: 73.7770 },
    items: [{ name: 'Chicken Rice Bowl', count: 1, price: 180 }],
  },
  {
    n: 5, name: 'Neha Patil', phone: '9811100005', kitchen: 'B',
    address: 'Flat 12, Wakad Heights', area: 'Wakad', landmark: 'Near Wakad Bridge',
    location: { lat: 18.5990, lng: 73.7600 },
    items: [{ name: 'Millet Salad Bowl', count: 1, price: 130 }, { name: 'Cold Press Juice', count: 2, price: 60 }],
  },
];

export const DEMO_CLUSTER = { clusterId: 'demo-cluster-1', clusterName: 'Baner', allowed: true };

/** The rider document the server would send (shape read by `normalizeRiderProfile`). */
export function demoRiderDoc(name = 'Demo Rider'): Record<string, unknown> {
  return {
    _id: DEMO_RIDER_ID,
    phoneNo: DEMO_PHONE,
    name,
    routeNo: 'DEMO-1',
    clusters: [DEMO_CLUSTER],
    isActive: true,
    email: 'demo.rider@mealawe.com',
    emergencyContactNo: '9876500000',
    bloodGroup: 'B+',
    bankAccountHolder: name,
    bankName: 'State Bank of India',
    bankAccountNo: '123456789012',
    bankIfscCode: 'SBIN0000001',
    bankBranch: 'Pune Main',
    upiId: 'demo@sbi',
    residenceAddress: { line1: '21, Demo Colony', line2: 'Baner', city: 'Pune', state: 'Maharashtra', pincode: '411038' },
  };
}

export type DemoOrderStatus = 'preparing' | 'readyToDelivery' | 'handedOverToDeliveryBoy' | 'onTheWay' | 'delivered';

export interface DemoOrder {
  _id: string;
  orderNo: string;
  mealType: string;
  orderstatus: DemoOrderStatus;
  kitchenKey: DemoKitchen['key'];
  kitchenName: string;
  kitchenPhoneNo: string;
  kitchenAddress: { address1: string; address2: string; landmark: string };
  kitchenGeolocation: LatLng;
  customerName: string;
  customerPhoneNo: string;
  customerLocation: { address: string; location: string; landmark: string; geolocation: LatLng };
  itemList: { itemName: string; count: number; mealawePrice: number }[];
  addOns: never[];
  statusHistory: { orderstatus: string; updatedOn: string }[];
  mealPackage: { packageName: string };
  totalAmount: number;
  orderType: string;
  orderDate: string;
  slotStartTime: string;
  slotEndTime: string;
  pickupProofUrl: string;
  proofImageUrl: string;
  handOverTo: string;
  proofCapturedAt: string | null;
}

/** One order document for a customer, in the given status. */
export function buildOrder(spec: DemoCustomerSpec, mealType: string, now: Date, status: DemoOrderStatus = 'preparing'): DemoOrder {
  const kitchen = DEMO_KITCHENS.find((candidate) => candidate.key === spec.kitchen) ?? DEMO_KITCHENS[0]!;
  const start = new Date(now.getTime() - 30 * 60_000);
  const end = new Date(now.getTime() + 3 * 3_600_000);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    _id: `demo-order-${spec.n}`,
    orderNo: `DM${1000 + spec.n}`,
    mealType,
    orderstatus: status,
    kitchenKey: kitchen.key,
    kitchenName: kitchen.name,
    kitchenPhoneNo: kitchen.phone,
    kitchenAddress: { address1: kitchen.address1, address2: kitchen.address2, landmark: kitchen.landmark },
    kitchenGeolocation: kitchen.location,
    customerName: spec.name,
    customerPhoneNo: spec.phone,
    customerLocation: { address: spec.address, location: spec.area, landmark: spec.landmark, geolocation: spec.location },
    itemList: spec.items.map((item) => ({ itemName: item.name, count: item.count, mealawePrice: item.price })),
    addOns: [],
    statusHistory: [{ orderstatus: 'placed', updatedOn: new Date(now.getTime() - 3_600_000).toISOString() }],
    mealPackage: { packageName: 'Daily Meal Plan' },
    totalAmount: spec.items.reduce((sum, item) => sum + item.count * item.price, 0),
    orderType: 'allDay',
    orderDate: midnight.toISOString(),
    slotStartTime: start.toISOString(),
    slotEndTime: end.toISOString(),
    pickupProofUrl: '',
    proofImageUrl: '',
    handOverTo: '',
    proofCapturedAt: null,
  };
}
