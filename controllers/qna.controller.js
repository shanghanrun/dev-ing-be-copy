const QnA = require("../model/QnA");
const User = require("../model/User");
const { getUserByNickName } = require("./user.controller");
const mongoose = require("mongoose");

const qnaController = {};

qnaController.createQnA = async (req, res) => {
    try {
        const { userId } = req;
        const { title, content, category } = req.body;

        if (!title || !content) {
            throw new Error("필수 항목이 누락되었습니다");
        }

        const newQnA = new QnA({
            author: userId,
            title,
            content,
            category
        });

        await newQnA.save();

        const user = await User.findById(userId);
        console.log(userId);
        await user.addActivity(userId);

        res.status(200).json({ status: "success", data: { newQnA } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.getQnA = async (req, res) => {
    try {
        const { id } = req.params;
        const qna = await QnA.findById(id)
            .populate({ path: "author", select: "nickName profileImage" })
            .populate({
                path: "answers.author",
                select: "nickName profileImage",
            });

        if (!qna || qna.isDelete) {
            throw new Error("QnA가 존재하지 않습니다");
        }

        //isDelete 댓글 필터링
        qna.answers = qna.answers.filter((answer) => {
            return !answer.isDelete;
        });

        res.status(200).json({ status: "success", data: { qna } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.getAllQnA = async (req, res) => {
    try {
        const { keyword, category } = req.query;

        let query = { isDelete: false, isBlock: false };

        if (keyword) {
            const keywordRegex = new RegExp(keyword, "i");
            query.$or = [
                { title: { $regex: keywordRegex } },
                { content: { $regex: keywordRegex } },
            ];
        }

        if (category && category !== 'all') {
            query.category = { $in: [category] };
        }

        const allQnA = await QnA.find(query)
            .sort({ createAt: -1 })
            .populate({
                path: "author",
                select: "nickName profileImage",
            }).populate({
                path: "answers",
                populate: { 
                    path: "author", 
                    select: "nickName"
                },
            });

        if (!allQnA.length) {
            throw new Error("질문이 존재하지 않습니다");
        }

        res.status(200).json({ status: "success", data: { allQnA } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.updateQnA = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category } = req.body;

        const updateData = {
            title,
            content,
            category
        };

        const updatedQnA = await QnA.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        if (!updatedQnA) {
            throw new Error("QnA 수정을 실패했습니다");
        }

        res.status(200).json({ status: "success", data: { updatedQnA } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.deleteQnA = async (req, res) => {
    try {
        const { userId } = req;
        const { id } = req.params;
        const qna = await QnA.findById(id);

        if (!qna) throw new Error("포스트가 존재하지 않습니다");

        qna.isDelete = true;
        await qna.save();

        const user = await User.findById(userId);
        await user.substractActivity(userId);

        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.createAnswer = async (req, res) => {
    try {
        const { userId } = req;
        const { qnaId, content, image } = req.body;

        const qna = await QnA.findById(qnaId);

        if (!qna) throw new Error("포스트가 존재하지 않습니다");

        const newAnswer = {
            author: userId,
            content,
            image,
        };
        qna.answers.push(newAnswer);
        qna.answerCount = qna.answers.length;

        await qna.save();
        res.status(200).json({ status: "success", data: { newAnswer } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.updateAnswer = async (req, res) => {
    try {
        const { userId } = req;
        const { content, image } = req.body;
        const { qnaId, answerId } = req.params;

        // 구조 분해 할당을 통해 업데이트할 데이터 정의
        const updateData = {
            content,
            image,
            isUpdated: true,
        };

        // QnA ID로 해당 QnA 문서를 찾음
        const qna = await QnA.findById(qnaId);

        // QnA가 존재하지 않거나 삭제된 상태라면 에러
        if (!qna || qna.isDelete) {
            throw new Error("존재하지 않거나 삭제된 질문입니다");
        }

        // QnA에서 해당 댓글을 찾음
        const answer = qna.answers.id(answerId);

        if (!answer || answer.isDelete) {
            throw new Error("존재하지 않거나 삭제된 답변입니다");
        }

        if (answer.author.toString() !== userId) {
            throw new Error("수정 권한이 없습니다");
        }

        answer.set(updateData);
        await qna.save();

        await qna.save();

        res.status(200).json({
            status: "success",
            message: "댓글 수정에 성공했습니다",
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.deleteAnswer = async (req, res) => {
    try {
        const { userId } = req;
        const { qnaId, answerId } = req.params;

        const qna = await QnA.findById(qnaId);

        if (!qna) {
            throw new Error("해당 질문이 존재하지 않습니다");
        }

        const answer = qna.answers.id(answerId);

        if (!answer) {
            throw new Error("해당 답변이 존재하지 않습니다");
        }

        if (answer.author.toString() !== userId) {
            throw new Error("삭제 권한이 없습니다");
        }

        // 답변을 삭제 상태로 표시
        answer.isDelete = true;

        await qna.save();

        res.status(200).json({
            status: "success",
            message: "댓글 삭제를 성공했습니다",
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.likesAnswer = async (req, res) => {
    try {
        const { userId } = req;
        const { qnaId, answerId } = req.params;

        const qna = await QnA.findById(qnaId);

        if (!qna) {
            throw new Error("해당 질문이 존재하지 않습니다");
        }

        const answer = qna.answers.id(answerId);

        if (!answer) {
            throw new Error("해당 답변이 존재하지 않습니다");
        }

        if (answer.userLikes.includes(userId)) {
            answer.likes -= 1;
            answer.userLikes = answer.userLikes.filter(
                (id) => id.toString() !== userId.toString()
            );
        } else {
            answer.likes += 1;
            answer.userLikes.push(userId);
        }

        await qna.save();
        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

qnaController.blockQnA = async (req, res) => {
    try {
        const { id } = req.params;
        const qna = await QnA.findById(id);
        if (!qna) throw new Error('QnA가 존재하지 않습니다.')

        qna.isBlock = !qna.isBlock;
        const qnaStatus = qna.isBlock;

        await qna.save();

        res.status(200).json({ 
            status: "success", 
            message: qnaStatus ? "QnA를 비공개 처리하였습니다." : "QnA를 공개로 전환하였습니다." 
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
}

module.exports = qnaController;
