const authController = {};
const User = require("../model/User");
const bcryptjs = require("bcryptjs");
const generateRandomNickname = require("../utils/generateRandomNickname");
const { OAuth2Client } = require('google-auth-library');
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const jwt = require("jsonwebtoken");

authController.loginWithEmail = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            if (user.isBlock || user.isDelete)
                throw new Error("차단됐거나 삭제된 계정입니다");

            const isMatch = await bcryptjs.compare(password, user.password);
            if (isMatch) {
                const token = await user.generateToken();
                return res
                    .status(200)
                    .json({ status: "success", data: { user, token } });
            } else {
                throw new Error("잘못된 이메일 또는 비밀번호 입니다");
            }
        } else {
            throw new Error("잘못된 이메일 또는 비밀번호 입니다");
        }
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

authController.loginWithGoogle = async (req, res) => {
    try {
        const { token } = req.body;
        // token 값 해석하기
        const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        })
        const { email, name } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            // 유저를 새로 생성 - password는 받지 않기 때문에 랜덤으로 지정해서 넣어두기
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = "";
            for (let i = 0; i < Math.random() * 20; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            const randomPassword = "" + result + Math.floor(Math.random() * 99999999);
            const salt = await bcryptjs.genSalt(10);
            const newPassword = await bcryptjs.hash(randomPassword, salt);
            user = new User({
                userName: name,
                email,
                password: newPassword,
                gender: "none",
                nickName: generateRandomNickname(),
                googleUser: true
            })
            await user.save();
        }

        // token 발행 및 리턴
        const sessionToken = await user.generateToken();
        res.status(200).json({ status: "success", user, token: sessionToken });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
}

authController.authenticate = async (req, res, next) => {
    try {
        const tokenString = req.headers.authorization;
        if (!tokenString) throw new Error("토큰이 존재하지 않습니다");

        const token = tokenString.replace("Bearer ", "");

        jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
            if (error) throw new Error("토큰값이 일치하지 않습니다");
            req.userId = payload._id;
        });
        next();
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

authController.checkAdminPermission = async (req, res, next) => {
    try {
        const { userId } = req;
        const user = await User.findById(userId);
        if (user.level !== "admin") {
            throw new Error("권한이 없습니다.");
        }
        next();
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

module.exports = authController;
