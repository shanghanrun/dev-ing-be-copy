const MeetUp = require("../model/MeetUp");
const Post = require("../model/Post");

const homeController = {};

homeController.getHomeData = async (req, res) => {
    try {
        const homePost = await Post.find({ isDelete: false })
            .sort({ likes: -1 })
            .limit(3)
            .populate("author")

        if (!homePost.length) {
            throw new Error("포스트가 존재하지 않습니다");
        }

        return res.status(200).json({ status: "success", data: { homePost } })
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
}

homeController.getHomeMeetUpData = async (req, res) => {
    try {
        let homeMeetUp = [];
        const readPost = await MeetUp.find({ category: "독서", isClosed: false, isDelete: false, isBlock: false })
            .sort({ createAt: -1 })
            .limit(1)
            .populate({
                path: "organizer",
                select: "nickName profileImage"
            }).populate({
                path: "participants",
                select: "nickName"
            });
        homeMeetUp = homeMeetUp.concat(readPost);

        const lecturePost = await MeetUp.find({ category: "강의", isClosed: false, isDelete: false, isBlock: false })
            .sort({ createAt: -1 })
            .limit(1)
            .populate({
                path: "organizer",
                select: "nickName profileImage"
            }).populate({
                path: "participants",
                select: "nickName"
            });
        homeMeetUp = homeMeetUp.concat(lecturePost);

        const projectPost = await MeetUp.find({ category: "프로젝트", isClosed: false, isDelete: false, isBlock: false })
            .sort({ createAt: -1 })
            .limit(1)
            .populate({
                path: "organizer",
                select: "nickName profileImage"
            }).populate({
                path: "participants",
                select: "nickName"
            });
        homeMeetUp = homeMeetUp.concat(projectPost);

        const studyPost = await MeetUp.find({ category: "스터디", isClosed: false, isDelete: false, isBlock: false })
            .sort({ createAt: -1 })
            .limit(1)
            .populate({
                path: "organizer",
                select: "nickName profileImage"
            }).populate({
                path: "participants",
                select: "nickName"
            });
        homeMeetUp = homeMeetUp.concat(studyPost);

        if (!homeMeetUp.length) {
            throw new Error("포스트가 존재하지 않습니다");
        }

        return res.status(200).json({ status: "success", data: { homeMeetUp } })
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
}

module.exports = homeController;