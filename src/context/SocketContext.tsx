import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

type SocketContextType = {
  socket: Socket | null;
  onlineUsers: any[];
  connected: boolean;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user?.id) {
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        return;
    }

    const socketUrl = "https://gearxpert-production.up.railway.app";
    console.log("[SOCKET] Attempting connection to:", socketUrl);

    const newSocket = io(socketUrl, {
      transports: ["websocket"], // WebSocket is preferred for mobile
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[SOCKET] Connected successfully! ID:", newSocket.id);
      newSocket.emit("addUser", user.id);
    });

    newSocket.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected:", reason);
      setOnlineUsers([]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connected: !!socket }}>
      {children}
    </SocketContext.Provider>
  );
};
