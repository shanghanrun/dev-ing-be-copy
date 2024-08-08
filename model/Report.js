const mongoose = require("mongoose");
const formatDateTime = require("../utils/formatDateTime");
const Schema = mongoose.Schema;

const reportSchema = Schema({
    reporter: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    reported: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose.Types.ObjectId, ref: "Post" },
    meetUpId: { type: mongoose.Types.ObjectId, ref: "MeetUp" },
    qnaId: { type: mongoose.Types.ObjectId, ref: "QnA" },
    contentType: { type: String, enum: ["Post", "MeetUp", "QnA"], required: true },
    reasons: [{ type: String, required: true }],
    isConfirmed: { type: Boolean, default: false },
    createAt: { type: Date, default: Date.now },
});

reportSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.updateAt;
    delete obj.__v;
    obj.createAt = formatDateTime(obj.createAt);
    return obj;
};

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;