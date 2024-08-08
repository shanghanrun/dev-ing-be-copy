const chatController = {};
const ChatRoom = require("../model/ChatRoom");

chatController.createChatRoom = async ({ roomId, participants }) => {
    try {

        if (!roomId || !participants || participants.length === 0) {
            throw new Error("roomId 또는 participants가 유효하지 않습니다");
        }

        // participants가 배열인지 확인
        if (!Array.isArray(participants)) {
            throw new Error("participants는 배열이어야 합니다");
        }

        const chatRoom = new ChatRoom({
            roomId,
            participants: participants, // participants를 배열로 정확히 저장
        });

        await chatRoom.save();
        console.log("채팅방 생성 성공");

        return chatRoom; // 필요시 생성된 chatRoom 객체 반환
    } catch (error) {
        console.error("채팅방 생성 오류:", error.message);
        throw error; // 에러를 상위 호출자에게 전파
    }
};

chatController.getChatRoomList = async (req, res) => {
    try {
        const { userId } = req;

        let chatRooms = await ChatRoom.find({
            participants: { $elemMatch: { $eq: userId } },
        });

        if (chatRooms.length === 0) {
            throw new Error("생성된 채팅방이 없습니다");
        }

        chatRooms = await Promise.all(
            chatRooms.map(async (chatRoom) => {
                await chatRoom.populate({ path: "roomId", select: "title category image" });
                // await chatRoom.populate({ path: "organizer", select: "_id" });
                await chatRoom.populate({
                    path: "participants",
                    select: "nickName profileImage",
                });
                return chatRoom;
            })
        );

        res.status(200).json({ status: "success", data: { chatRooms } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

chatController.getChatRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const chatRoom = await ChatRoom.findOne({ roomId: id }).populate({
            path: "roomId",
            select: "title",
        });

        if (!chatRoom) {
            throw new Error("채팅방을 찾을 수 없습니다");
        }

        res.status(200).json({ status: "success", data: { chatRoom } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

chatController.saveChatMessage = async ({
    userName,
    userProfileImage,
    roomId,
    message,
}) => {
    try {
        const chatRoom = await ChatRoom.findOne({ roomId });

        if (!chatRoom) {
            throw new Error(`Chat room with id ${roomId} not found`);
        }

        const newChat = {
            userName,
            userProfileImage,
            message,
        };

        chatRoom.chat.push(newChat);

        await chatRoom.save();

        return newChat;
    } catch (error) {
        return error.message;
    }
};

chatController.addParticipants = async ({ userId, roomId }) => {
    try {
        const chatRoom = await ChatRoom.findOne({ roomId });

        if (!chatRoom) {
            throw new Error("채팅 방을 찾을 수 없습니다"); // 예외 처리를 반환하는 방식으로 수정
        }

        // 이미 참여자인지 확인 (중복 추가 방지)
        if (chatRoom.participants.includes(userId)) {
            throw new Error("이미 참가한 사용자 입니다"); // 예외 처리를 반환하는 방식으로 수정
        }

        // participants 배열에 userId 추가
        chatRoom.participants.push(userId);
        await chatRoom.save();

        return; // 성공 시 업데이트된 채팅방 정보 반환
    } catch (error) {
        console.log(error.message); // 에러 발생 시 메시지 반환
    }
};

chatController.removeParticipant = async ({ userId, roomId }) => {
    try {
        const chatRoom = await ChatRoom.findOne({ roomId });

        if (!chatRoom) {
            throw new Error("채팅방을 찾을 수 없습니다.");
        }

        // 참가자 목록에서 userId를 제거
        chatRoom.participants = chatRoom.participants.filter((participant) => {
            // participant가 null이 아니고, userId와 다른 경우에만 유지합니다.
            return participant !== null && participant.toString() !== userId;
        });

        // const message = {
        //     userName: "시스템",
        //     message: `사용자 ${userId}가 방을 나갔습니다.`,
        //     roomId: roomId,
        // };

        // // 채팅 메시지 저장 및 브로드캐스트
        // await chatController.saveChatMessage(message);

        await chatRoom.save();
    } catch (error) {
        console.error("참가자 제거 오류:", error.message);
        throw error;
    }
};

module.exports = chatController;
