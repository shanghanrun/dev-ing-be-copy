const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const formatDateTime = require("../utils/formatDateTime");
const getCommentCount = require("../utils/getCommentCount");

const answerSchema = Schema({
    author: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    image: { type: String },
    likes: { type: Number, default: 0 },
    userLikes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    isUpdated: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    createAt: { type: Date, default: Date.now },
});

const QnASchema = Schema({
    author: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    answers: [answerSchema],
    category: { type: String, required: true },
    answerCount: { type: Number, default: 0 },
    createAt: { type: Date, default: Date.now },
    isDelete: { type: Boolean, default: false },
    isBlock: { type: Boolean, default: false },
});

QnASchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.updateAt;
    delete obj.__v;
    obj.createAt = formatDateTime(obj.createAt);
    obj.answers = obj.answers.map((answer) => {
        answer.createAt = formatDateTime(answer.createAt);
        return answer;
    });
    obj.answerCount = getCommentCount(obj.answers);
    return obj;
};

answerSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.updateAt;
    delete obj.__v;
    return obj;
};

const QnA = mongoose.model("QnA", QnASchema);

module.exports = QnA;
