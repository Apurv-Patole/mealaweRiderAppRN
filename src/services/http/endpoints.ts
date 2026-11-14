/**
 * Rider API endpoints (MealaweServerApp). Paths are the ones the Ionic rider
 * app already uses; see RIDER_APP_SERVER_ARCHITECTURE.md. Only endpoints that
 * are wired into the app so far are listed; add the rest with their stage.
 */
export const ENDPOINTS = {
  auth: {
    sendOtp: '/authrider/loginRider',
    verifyOtp: '/authrider/verifyOTP',
    logout: '/authrider/logout',
  },
  profile: {
    me: '/api/rider/profile/me',
    update: '/api/rider/profile/update',
  },
  shift: {
    slotConfig: '/api/slot-config/me',
    today: '/api/rider/shift/today',
    todayAll: '/api/rider/shifts/today-all',
    start: '/api/rider/shift/start',
    end: '/api/rider/shift/end',
  },
  orders: {
    search: '/api/rider/searchRiderFoodOrderList',
    late: '/api/rider/pendingOrders',
  },
  wallet: {
    balance: '/api/rider/wallet/me',
    ledger: '/api/rider/wallet/ledger/me',
    salary: '/api/rider/monthly-salary/me',
    incentives: '/api/incentive/shift/me',
  },
  history: {
    shifts: '/api/rider/shift/history',
    orders: '/api/rider/orders/history',
  },
  tracking: {
    ping: '/api/rider/location/ping',
  },
  trip: {
    pickupProof: '/api/rider/pickup/proof',
    pickupComplete: '/api/rider/pickup/complete',
    deliveryProof: '/api/rider/delivery/proof',
    orderStatus: '/api/rider/order',
    startRoute: '/api/rider/route/start-delivery',
    startRide: '/api/rider/startDelivery',
    cancelRequest: '/api/riderCancelRequest',
  },
  appUpdate: {
    /** GET /api/getAppVersionByName/:appName -> { appName, appVersion } | null. No auth. */
    getAppVersionByName: '/api/getAppVersionByName',
  },
  push: {
    saveToken: '/api/saveFcmToken',
  },
  lead: {
    submit: '/api/saveRiderLead',
  },
} as const;
