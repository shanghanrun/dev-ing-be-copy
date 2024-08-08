const mongoose = require("mongoose");
const MeetUp = require("../model/MeetUp");
const meetUpController = {};
const parseDate = require("../utils/parseDate");
const formatDateTime = require("../utils/formatDateTime");
const User = require("../model/User");
const { getUserByNickName } = require("./user.controller");
const chatController = require("./chat.controller");

meetUpController.createMeetUp = async (req, res) => {
    try {
        const { userId } = req;
        const {
            title,
            description,
            date,
            category,
            image,
            location,
            maxParticipants,
        } = req.body;

        if (!title || !description || !date || !location || !maxParticipants) {
            throw new Error("필수 항목이 누락되었습니다");
        }

        const newMeetUp = new MeetUp({
            organizer: userId,
            title,
            description,
            date: parseDate(date),
            category,
            image,
            location,
            maxParticipants,
        });
        newMeetUp.participants.push(userId);

        await newMeetUp.save();

        const meetUpId = newMeetUp._id.toString();

        console.log(
            "roomId",   
            meetUpId,
            "participants: ",
            newMeetUp.participants,
            "length :",
            newMeetUp.participants.length
        );

        chatController.createChatRoom({
            roomId: meetUpId,
            participants: newMeetUp.participants,
        });

        const user = await User.findById(userId);
        await user.addActivity(userId);

        res.status(200).json({ status: "success", data: { newMeetUp } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

meetUpController.getMeetUp = async (req, res) => {
    try {
        const { id } = req.params;
        const meetUp = await MeetUp.findById(id).populate([
            {
                path: "organizer",
                select: "nickName profileImage",
            },
            {
                path: "participants",
                select: "nickName profileImage",
            },
        ]);

        if (!meetUp) throw new Error("meetUp 찾기를 실패했습니다");

        res.status(200).json({ status: "success", data: { meetUp } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

meetUpController.updateMeetUp = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            date,
            category,
            image,
            maxParticipants,
            location,
        } = req.body;

        const updateData = {
            title,
            description,
            date,
            category,
            image,
            maxParticipants,
            location,
        };

        const updatedMeetUp = await MeetUp.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        if (!updatedMeetUp) {
            throw new Error("meetUp 수정을 실패했습니다");
        }

        res.status(200).json({ status: "success", data: { updatedMeetUp } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

meetUpController.getAllMeetUp = async (req, res) => {
    try {
        const { keyword, type, category, isRecruit } = req.query;

        let query = { isDelete: false, isBlock: false };

        if (keyword) {
            const keywordRegex = new RegExp(keyword, "i");
            query.$or = [{ title: { $regex: keywordRegex } }];
        }

        if (category) {
            if (category !== "전체") {
                query.category = { $in: [category] };
            }
        }

        if (isRecruit === "true") {
            query.isClosed = { $in: ["false"] };
        }

        const sortOptions = {
            latest: { sortBy: { createAt: -1 } },
            closed: { sortBy: { date: 1 } },
            default: { sortBy: { createAt: -1 } }, // 기본적으로 최신순으로 정렬
        };

        const { sortBy } = sortOptions[type] || sortOptions.default;

        const allMeetUp = await MeetUp.find(query)
            .sort(sortBy)
            .populate({
                path: "organizer",
                select: "nickName profileImage",
            })
            .populate({
                path: "participants",
                select: "nickName",
            });

        // if (allMeetUp.length === 0) {
        //     throw new Error("모임이 존재하지 않습니다");
        // }

        // 마감 여부 확인하기
        allMeetUp.map(async (meetup) => await meetup.checkIsClosed());

        res.status(200).json({ status: "success", data: { allMeetUp } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

meetUpController.deleteMeetUp = async (req, res) => {
    try {
        const { userId } = req;
        const { id } = req.params;
        const meetUp = await MeetUp.findById(id);

        if (!meetUp) throw new Error("meetUp 삭제를 실패했습니다");

        meetUp.isDelete = true;

        await meetUp.save();

        const user = await User.findById(userId);
        await user.substractActivity(userId);

        // chatController.deleteChatRoom({ roomId: id });
        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

meetUpController.joinMeetUp = async (req, res) => {
    try {
        const { userId } = req;
        const { meetUpId } = req.body;

        const meetUp = await MeetUp.findById(meetUpId).populate("organizer");

        if (!meetUp) {
            throw new Error("MeetUp이 존재하지 않습니다");
        }

        if (meetUp.organizer === userId) {
            throw new Error("자신의 모임에는 참여할 수 없습니다");
        }

        if (meetUp.participants.length >= meetUp.maxParticipants) {
            throw new Error("참가 인원이 가득 찼습니다");
        }

        if (!meetUp.participants.includes(userId)) {
            meetUp.participants.push(userId);
        } else {
            throw new Error("이미 참가한 유저입니다");
        }

        await meetUp.save();
        await meetUp.checkIsClosed();

        await MeetUp.populate(meetUp, {
            path: "participants",
            select: "nickName profileImage",
        });

        // 참가자가 들어올때마다 chatRoom에 추가한다.
        chatController.addParticipants({ userId, roomId: meetUpId });

        res.status(200).json({ status: "success", data: { meetUp } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

meetUpController.leaveMeetUp = async (req, res) => {
    try {
        const { userId } = req;
        const { meetUpId } = req.body;

        const meetUp = await MeetUp.findById(meetUpId).populate("organizer");

        if (!meetUp) {
            throw new Error("MeetUp이 존재하지 않습니다");
        }

        if (meetUp.organizer === userId) {
            throw new Error("자신이 만든 모임은 나갈 수 없습니다");
        }

        if (!meetUp.participants.includes(userId)) {
            throw new Error("참가하지 않은 유저입니다");
        } else {
            const newParticipants = meetUp.participants.filter(
                (participant) => participant.toString() !== userId
            );
            meetUp.participants = newParticipants;
        }

        await meetUp.save();

        await MeetUp.populate(meetUp, {
            path: "participants",
            select: "nickName profileImage",
        });

        chatController.removeParticipant({ userId, roomId: meetUp._id });

        res.status(200).json({ status: "success", data: { meetUp } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

meetUpController.blockMeetUp = async (req, res) => {
    try {
        const { id } = req.params;
        const meetUp = await MeetUp.findById(id);
        if (!meetUp) throw new Error("해당 모임이 존재하지 않습니다.");

        meetUp.isBlock = !meetUp.isBlock;
        const meetUpStatus = meetUp.isBlock;

        await meetUp.save();

        res.status(200).json({
            status: "success",
            message: meetUpStatus
                ? "모임을 비공개 처리하였습니다."
                : "모임을 공개로 전환하였습니다.",
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

module.exports = meetUpController;
