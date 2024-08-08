const mongoose = require("mongoose");
const Post = require("../model/Post");
const MeetUp = require("../model/MeetUp");
const QnA = require("../model/QnA");
const adminController = {};

adminController.getPostList = async (req, res) => {
    try {
        const adminPostList = await Post.find({})
            .sort({ createAt: -1 })
            .populate({
                path: "author",
                select: "nickName"
            })

        res.status(200).json({ status: "success", data: { adminPostList } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

adminController.getMeetUpList = async (req, res) => {
    try {
        const adminMeetUpList = await MeetUp.find({})
            .sort({ createAt: -1 })
            .populate({
                path: "organizer",
                select: "nickName"
            }).populate({
                path: "participants",
                select: "nickName"
            });

        res.status(200).json({ status: "success", data: { adminMeetUpList } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

adminController.getQnaList = async (req, res) => {
    try {
        const adminQnaList = await QnA.find({})
            .sort({ createAt: -1 })
            .populate({
                path: "author",
                select: "nickName",
            }).populate({
                path: "answers",
                populate: { path: "author", select: "nickName" },
            });

        res.status(200).json({ status: "success", data: { adminQnaList } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};



module.exports = adminController;