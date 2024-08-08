const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const formatDateTime = require("../utils/formatDateTime");
const User = require("./User");
require("dotenv").config();
const MEETUP_DEFAULT_IMAGE = process.env.MEETUP_DEFAULT_IMAGE;

const meetUpSchema = Schema({
    organizer: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, required: true },
    image: { type: String, default: MEETUP_DEFAULT_IMAGE },
    participants: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    maxParticipants: { type: Number, required: true },
    currentParticipants: { type: Number },
    location: { type: String },
    isClosed: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
    createAt: { type: Date, default: Date.now },
});

meetUpSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.updateAt;
    delete obj.__v;
    obj.createAt = formatDateTime(obj.createAt);
    obj.date = formatDateTime(obj.date);
    obj.currentParticipants = obj.participants.length;
    return obj;
};

meetUpSchema.methods.checkIsClosed = async function () {
    // 현재 인원이랑 최대 인원이랑 같아지면 마감
    if (this.participants.length === this.maxParticipants) {
        this.isClosed = true;
    }
    // 시작 예정 날짜가 오늘 날짜보다 전이면
    else if (this.date < new Date()) {
        this.isClosed = true;
    }
    else {
        this.isClosed = false;
    }
    
    await this.save();
};

const MeetUp = mongoose.model("MeetUp", meetUpSchema);

module.exports = MeetUp;
