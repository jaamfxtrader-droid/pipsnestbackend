import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { WebSocketServer, type WebSocket } from "ws";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { apiRouter } from "./routes/index.js";
import { supportLiveEvents } from "./services/support-live.service.js";
import { verifyToken } from "./utils/jwt.js";

const app = express();
const allowedOrigins = new Set(
  [
    env.NEXT_PUBLIC_APP_URL,
    ...(env.CORS_ORIGINS?.split(",") ?? []),
    "http://localhost:3000",
    "http://localhost:3001"
  ]
    .map((origin) => origin?.trim())
    .filter(Boolean)
);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "16mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Pipnest API listening on http://localhost:${env.PORT}`);
});

type SupportSocket = WebSocket & {
  ticketId?: string;
};

const supportWss = new WebSocketServer({ server, path: "/api/support/live" });

supportWss.on("connection", async (socket: SupportSocket, request) => {
  try {
    const requestUrl = new URL(request.url ?? "", `http://${request.headers.host ?? "localhost"}`);
    const token = requestUrl.searchParams.get("token");
    const ticketId = requestUrl.searchParams.get("ticketId");
    if (!token || !ticketId) throw new Error("Missing support live auth");

    const payload = verifyToken(token);
    if (payload.purpose === "2fa") throw new Error("2FA session cannot open support live");

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    const isStaff = payload.role === "ADMIN" || payload.role === "SUPER_ADMIN";
    if (!ticket || (!isStaff && ticket.userId !== payload.id)) throw new Error("Ticket access denied");

    socket.ticketId = ticketId;
    socket.send(JSON.stringify({ type: "support.connected", ticketId }));
  } catch {
    socket.close(1008, "Unauthorized");
  }
});

supportLiveEvents.on("support:event", ({ ticketId, payload }) => {
  const message = JSON.stringify(payload);
  for (const client of supportWss.clients) {
    const socket = client as SupportSocket;
    if (socket.readyState === 1 && socket.ticketId === ticketId) {
      socket.send(message);
    }
  }
});

async function shutdown() {
  await prisma.$disconnect();
  supportWss.close();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
