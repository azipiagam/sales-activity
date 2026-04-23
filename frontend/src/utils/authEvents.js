export const AUTH_UPDATED_EVENT = 'auth:updated';

export const notifyAuthUpdated = () => {
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
};