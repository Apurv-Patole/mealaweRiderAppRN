import type { RiderProfile } from './riderProfile';

/** Pure auth state and transitions (no storage or React Native imports). */
export type AuthStatus = 'booting' | 'signedOut' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  token: string | null;
  rider: RiderProfile | null;
}

export const INITIAL_AUTH_STATE: AuthState = {
  status: 'booting',
  token: null,
  rider: null,
};

export function signedIn(token: string, rider: RiderProfile | null): AuthState {
  return { status: 'signedIn', token, rider };
}

export function signedOut(): AuthState {
  return { status: 'signedOut', token: null, rider: null };
}

/** Result of reading persisted credentials at startup. */
export function restoreState(token: string | null, rider: RiderProfile | null): AuthState {
  return token ? signedIn(token, rider) : signedOut();
}

/** Returns a new state with the rider profile replaced, only while signed in. */
export function withRider(state: AuthState, rider: RiderProfile | null): AuthState {
  return state.status === 'signedIn' ? { ...state, rider } : state;
}
