import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function getSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin + "/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

export function useLiveMarket(token) {
  const [ticks, setTicks] = useState({});
  const [status, setStatus] = useState({ connected: false, instrumentCount: 0 });

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(getSocketUrl(), { auth: { token }, transports: ["websocket", "polling"] });
    socket.on("market:status", setStatus);
    socket.on("market:tick", (tick) => setTicks((current) => ({ ...current, [tick.instrumentKey]: tick })));
    socket.on("connect_error", () => setStatus((current) => ({ ...current, connected: false })));
    return () => socket.disconnect();
  }, [token]);

  return { ticks, status };
}
