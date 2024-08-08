const mongoose = require("mongoose");
const reportController = {};
const formatDateTime = require("../utils/formatDateTime");
const User = require("../model/User");
const Report = require("../model/Report");
const Post = require("../model/Post");
const MeetUp = require("../model/MeetUp");
const QnA = require("../model/QnA");

reportController.createReport = async (req, res) => {
    try {
        const { userId } = req;
        const { reportedUserId, postId, meetUpId, qnaId, contentType, reasons } = req.body;

        const reporterUser = await User.findById(userId);
        if(!reporterUser) throw new Error('신고 권한이 없습니다. 로그인해주세요.');

        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) throw new Error('신고 대상 사용자가 존재하지 않습니다.');

        //Report에서 reporter가 userId이고, 각 id 카테고리별로 이전에 신고된 게시글인지 하나라도 일치하는 문서를 반환
        let previousReport;

        if(postId) previousReport = await Report.findOne({ reporter: userId, $or: { postId }});
        if(meetUpId) previousReport = await Report.findOne({ reporter: userId, $or: { meetUpId }});
        if(qnaId) previousReport = await Report.findOne({ reporter: userId, $or: { qnaId }});
        
        if(previousReport) throw new Error('이미 신고한 게시글입니다.')

        const newReport = new Report({
            reporter: userId,
            reported: reportedUserId,
            postId: postId || undefined,
            meetUpId: meetUpId || undefined,
            qnaId: qnaId || undefined,
            contentType: contentType,
            reasons: reasons,
            isConfirmed: false
        });

        await newReport.save();

        res.status(200).json({ status: 'success', message: '신고가 성공적으로 접수되었습니다.', data: { report: newReport } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

reportController.getAllReport = async (req, res) => {
    try {
        const reportList = await Report.find({})
            .populate({
                path: "reported",
                select: "nickName"
            })
            .populate({
                path: "reporter",
                select: "nickName"
            })
            .populate({
                path: "postId",
                select: "title content",
            })
            .populate({
                path: "meetUpId",
                select: "title description",
            })
            .populate({
                path: "qnaId",
                select: "title content",
            });

        if(reportList.length === 0) {
            throw new Error("신고 내역이 없습니다.");
        }

        res.status(200).json({ status: 'success', data: { reportList } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

reportController.updateReport = async (req, res) => {
    try {
        const { reportId } = req.body;
        const report = await Report.findById(reportId);
        
        if(!report) throw new Error('해당 신고내역을 찾을 수 없습니다.')
        report.isConfirmed = !report.isConfirmed;
        const confirmState = report.isConfirmed;

        await report.save();

        //신고된 게시글을 찾아서 block처리
        const updateBlockStatus = async (model, id, status) => {
            if (id) {
                const item = await model.findById(id);
                if (item) {
                    item.isBlock = status;
                    await item.save();
                } 
            }
        };

        await updateBlockStatus(Post, report.postId, confirmState);
        await updateBlockStatus(MeetUp, report.meetUpId, confirmState);
        await updateBlockStatus(QnA, report.qnaId, confirmState);

        //신고당한 유저의 report +- 처리
        const user = await User.findById(report.reported);

        if (!user) throw new Error('해당 사용자를 찾을 수 없습니다.');
        if (user.isDelete) throw new Error('회원 리스트에서 삭제 처리된 사용자입니다.');

        user.report += confirmState ? 1 : -1;

        await user.save();

        res.status(200).json({ 
            status: 'success', 
            message: confirmState ? '신고 승인이 완료되었습니다.' : '신고 승인을 취소하였습니다.', 
            data: { user, report } 
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

module.exports = reportController;