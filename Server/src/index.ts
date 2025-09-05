import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
let room: any = {};
app.use("/", (req: Request, res: Response) => {
  res.send("Hello World");
});
io.on("connection", (socket) => {
  socket.on("join-room", (userData) => {
    const socketRoomSize =
      io.sockets.adapter.rooms.get(userData.room)?.size || 0;
    if (socketRoomSize && socketRoomSize >= 2) {
      return socket.emit("joinLimit", {
        status: false,
        message: "Room is already full",
      });
    }
    socket.join(userData.room);

    if (!room[userData.room]) {
      room[userData.room] = [];
    }
    room[userData.room].push({
      name: userData.name,
      socketId: socket.id,
      userId: userData.userId,
      points: 100,
    });
    let selectedUser = room[userData.room].find(
      (user: any) => user?.socketId === socket.id
    );
    socket.on("inputValue", (data) => {
      io.to(userData.room).emit("inputResponse", {
        status: true,
        message: `New Message`,
        data: {
          user: selectedUser.userId,
          message: data,
          points: selectedUser.points + 5,
        },
      });
      selectedUser.points = selectedUser?.points + 5;
      return;
    });
    socket.on("steam", (text) => {
      return io.to(userData.room).emit("steamResponse", {
        status: true,
        placeholder: text,
        id: selectedUser.userId,
      });
    });
    socket.on("worngWord", () => {
      io.to(userData.room).emit("worngWordResponse", {
        status: false,
        message: `Worng word`,
        data: {
          user: selectedUser.userId,
          points: selectedUser.points - 5,
        },
      });
      selectedUser.points = selectedUser?.points - 5;
      return;
    });

    return io.to(userData.room).emit("response", {
      status: true,
      message: `${userData.name} joined this room`,
      id: selectedUser.userId,
      member: room[userData.room],
    });
  });

  socket.on("disconnect", () => {
    for (const groupName in room) {
      const updatedData = room[groupName].filter(
        (user: any) => user?.socketId !== socket.id
      );
      const disconnectedUser = room[groupName].find(
        (user: any) => user?.socketId === socket.id
      );
      if (!updatedData.length) {
        delete room[groupName];
      } else {
        io.to(groupName).emit("response", {
          status: true,
          message: `${disconnectedUser?.name} left this room`,
          member: updatedData,
        });
        room[groupName] = updatedData;
      }
    }
  });
});
server.listen(3000, () => {
  console.log("Server is running port 3000");
});
 