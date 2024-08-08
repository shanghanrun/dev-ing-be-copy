const mongoose = require("mongoose");
const formatDateTime = require("../utils/formatDateTime");
const Schema = mongoose.Schema;

const commentSchema = Schema({
    author: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isDelete: { type: Boolean, default: false },
    createAt: { type: Date, default: Date.now },
});

commentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.updateAt;
    delete obj.__v;
    obj.createAt = formatDateTime(obj.createAt);
    return obj;
};

module.exports = commentSchema;
