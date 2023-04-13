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

  socket.on("timer", async ({ gameID, playerID }) => {
    let countDown = 5;
    let game = await Game.findById(gameID);
    let player = game.players.id(playerID);
    if (player.isPartyLeader) {
      let timerID = setInterval(async () => {
        if (countDown >= 0) {
          io.to(gameID).emit("timer", { countDown, msg: "Starting Game" });
          countDown--;
        } else {
          game.isOpen = false;
          game = await game.save();
          io.to(gameID).emit("update-game", game);
          startGameClock(gameID);
          clearInterval(timerID);
        }
      }, 1000);
    }
  });

  socket.on("join-game", async ({ nickName, gameID: _id }) => {
    try {
      let game = await Game.findById(_id);
      if (game.isOpen) {
        const gameID = game._id.toString();
        socket.join(gameID);

        let player = {
          socketID: socket.id,
          nickName,
        };

        game.players.push(player);
        game = await game.save();
        io.to(gameID).emit("update-game", game);
      }
    } catch (err) {
      console.log(err);
    }
  });
});

const startGameClock = async (gameID) => {
  let game = await Game.findById(gameID);
  game.startTime = new Date().getTime();
  game = await game.save();

  let time = 120;

  //Return an IIFE in order to ensure setInterval executes immediately without delay
  let timerID = setInterval(
    (function gameIntervalFunc() {
      const formatTime = calculateTime(time);
      if (time >= 0) {
        io.to(gameID).emit("timer", {
          countDown: formatTime,
          msg: "Time Remaining",
        });
        time--;
      }
      return gameIntervalFunc;
    })(),
    1000
  );
};

const calculateTime = (time) => {
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;

  return `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
};
