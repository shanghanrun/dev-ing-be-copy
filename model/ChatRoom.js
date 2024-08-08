const mongoose = require("mongoose");
const { Schema } = mongoose;
const formatDateTime = require("../utils/formatDateTime");
require("dotenv").config();
const USER_DEFAULT_IMAGE = process.env.USER_DEFAULT_IMAGE;
const chatSchema = Schema({
    userName: { type: String, required: true },
    userProfileImage: { type: String, default: USER_DEFAULT_IMAGE },
    message: { type: String, required: true },
    image: { type: String },
    createAt: { type: Date, default: Date.now },
});

const chatRoomSchema = Schema({
    roomId: { type: mongoose.Types.ObjectId, ref: "MeetUp", required: true },
    // organizer: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    chat: [chatSchema],
});

//chatSchema 를 저장하기 전 미들웨어로 organizer를 participants에 넣음
chatRoomSchema.pre("save", function (next) {
    if (!this.participants.includes(this.organizer)) {
        this.participants.push(this.organizer);
    }
    next();
});

chatRoomSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.chat.map((chat) => {
        chat.createAt = formatDateTime(chat.createAt);
    });
    delete obj.__v;
    return obj;
};

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = ChatRoom;
