const chatController = require("../controllers/chat.controller");
const userController = require("../controllers/user.controller");

function ioFunction(io) {
    io.on("connection", async (socket) => {
        // console.log("connected : ", socket.id);
        socket.on('user', async (userId, callback) => {
            try {
                const findUser = await userController.userOnlineState({ userId, socketId: socket.id, online: true })
                callback({ ok: true, data: findUser })
            } catch (error) {
                callback({ ok: false, error })
            }
        })

        socket.on("join room", (roomId) => {
            socket.join(roomId);
            // console.log(`User joined room: ${roomId}`);
        });

        socket.on(
            "chat message",
            async ({ userName, userProfileImage, roomId, message }) => {
                console.log(userName, userProfileImage, roomId, message);

                const savedMessage = await chatController.saveChatMessage({
                    userName,
                    userProfileImage,
                    roomId,
                    message,
                });

                io.to(roomId).emit("chat message", savedMessage);
            }
        );

        //socket을 받은 후에 socket의 연결이 끊길 경우 진행되는 로직
        socket.on('disconnect', async () => {
            console.log('user is disconnected', socket.id);
            await userController.userOnlineState({ userId: null, socketId: socket.id, online: false })
        })
    });
}

module.exports = ioFunction;
