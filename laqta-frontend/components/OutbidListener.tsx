"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { API } from "../lib/api";
import { showToast } from "./Toast";

function decodeJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function OutbidListener() {
  useEffect(() => {
    const token = localStorage.getItem("laqta_token");
    if (!token) return;

    const payload = decodeJwt(token);
    if (!payload?.sub) return;

    const socket = io(API);

    // join personal user room
    socket.emit("user:join", { userId: payload.sub });

    // listen for outbid event
    socket.on("auction:outbid", (data: any) => {
      showToast(
        `You have been outbid! New bid: ${Number(data.newAmount).toLocaleString()} JOD`,
        "warning"
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null;
}
