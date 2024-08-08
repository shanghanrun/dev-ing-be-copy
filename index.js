const { createServer } = require("http");
const app = require("./app");
const { Server } = require("socket.io");
require("dotenv").config();

const SOCKET_PORT = process.env.SOCKET_PORT || 5001; // 기본값을 설정할 수 있습니다.
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});

require("./utils/io")(io);
httpServer.listen(SOCKET_PORT, () => {
    console.log("Socket server listening on port", SOCKET_PORT);
});
