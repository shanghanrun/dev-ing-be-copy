const mongoose = require("mongoose");
const formatDateTime = require("../utils/formatDateTime");
const Schema = mongoose.Schema;

const scrapSchema = Schema({
    post: { type: mongoose.Types.ObjectId, ref: "Post", required: true },
    isPrivate: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    scrapedAt: { type: Date, default: Date.now },
});

scrapSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    obj.scrapedAt = formatDateTime(obj.scrapedAt);
    return obj;
};

module.exports = scrapSchema;
