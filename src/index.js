const express = require("express");
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");

const dotenv = require("dotenv");
dotenv.config();

const httpServer = createServer(app);

app.use(function (req, res, next) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://" + req.headers.host + ":8900"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

const port = process.env.PORT | 8900;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

io.on("connection", (socket) => {
  console.log("connected");
  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (!user) return;
    io.to(user.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  //disconnect
  socket.on("disconnect", () => {
    console.log("disconnected");
    removeUser(socket.id);
    socket.emit("getUsers", users);
  });
});

httpServer.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
