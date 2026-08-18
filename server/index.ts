import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./socket";

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
  },
});

//Socket.io
initSocket(io);
// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
}));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
