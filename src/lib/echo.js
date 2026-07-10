import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echoInstance = null;

export const getEcho = (token) => {
  if (echoInstance) return echoInstance;
  if (typeof window === "undefined") return null;
  if (!import.meta.env.VITE_REVERB_APP_KEY) return null;

  window.Pusher = Pusher;
  echoInstance = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
  return echoInstance;
};

export const getCurrentToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');