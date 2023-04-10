const express = require("express");
const app = express();
const socketio = require("socket.io");
const mongoose = require("mongoose");

const expressServer = app.listen(3001);
const io = socketio(expressServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const Game = require("./Models/Game");
const QuotableAPI = require("./QuotableAPI");

mongoose
  .connect("mongodb://0.0.0.0:27017/typeracer", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("successfully connected to database");
  })
  .catch((error) => console.log(error));

io.on("connect", (socket) => {
  socket.on("create-game", async (nickName) => {
    try {
      const quotableData = await QuotableAPI();
      let game = new Game();
      game.words = quotableData;
      let player = {
        socketID: socket.id,
        isPartyLeader: true,
        nickName,
      };
      game.players.push(player);
      game = await game.save();

      const gameID = game._id.toString();
      socket.join(gameID);
      io.to(gameID).emit("update-game", game);
    } catch (error) {
      console.log(error);
    }
  });
});
