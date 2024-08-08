const User = require("../model/User");
const bcrypt = require("bcryptjs");
const userController = {};
const Post = require("../model/Post");
const MeetUp = require('../model/MeetUp');
const QnA = require('../model/QnA');

userController.createUser = async (req, res) => {
    try {
        const { email, userName, password, gender, nickName } = req.body;

        // 데이터 검증
        if (!userName || !email || !password || !gender || !nickName) {
            throw new Error("필수 입력 항목이 누락되었습니다");
        }

        //이메일 중복 확인
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            throw new Error("이미 존재하는 이메일입니다");
        }

        //닉네임 중복 확인
        const existingNickName = await User.findOne({ nickName });
        if (existingNickName) {
            throw new Error("이미 존재하는 닉네임입니다");
        }

        // 비밀번호 해시 처리
        const salt = bcrypt.genSaltSync(10);
        const hash = await bcrypt.hash(password, salt);

        // 새로운 유저 생성
        const newUser = new User({
            userName,
            email,
            password: hash,
            gender,
            nickName
        });

        await newUser.save();

        res.status(200).json({ status: "success", message: "유저 생성 완료" });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

userController.getUser = async (req, res) => {
    try {
        const { userId } = req;
        const user = await User.findById(userId)
            .populate({
                path: 'scrap',
                populate: { path: 'post', select: 'title author image', populate: { path: 'author', select: 'nickName' } }
            });

        if (!user) {
            throw new Error("사용자를 찾을 수 없습니다.");
        }

        res.status(200).json({ status: "success", data: { user } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

userController.getAllUser = async (req, res) => {
    try {
        const allUser = await User.find({});
        res.status(200).json({ status: "success", data: { allUser } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

userController.updateUser = async (req, res) => {
    try {
        const { userId } = req;
        const { userName, stacks, originalPassword, newPassword, profileImage, description, nickName, gender } = req.body;
        const user = await User.findById(userId);

        if (!originalPassword) {
            throw new Error("비밀번호를 입력해주세요.");
        }

        const isMatch = await bcrypt.compare(originalPassword, user.password);

        if (!isMatch) {
            throw new Error("비밀번호가 틀렸습니다.");
        }

        if (!userName || userName === "") {
            throw new Error("이름을 입력해주세요.");
        }

        if (stacks.length !== 0) {
            user.stacks = stacks;
        } else {
            user.stacks = ['none'];
        }

        user.userName = userName;
        user.profileImage = profileImage;
        user.description = description;

        if (newPassword) {
            // 비밀번호 해시 처리
            const salt = bcrypt.genSaltSync(10);
            const hash = await bcrypt.hash(newPassword, salt);
            user.password = hash;
        }

        await user.save();

        res.status(200).json({ status: "success", data: { user } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

userController.updateGoogleUser = async (req, res) => {
    try {
        const { userId } = req;
        const { userName, stacks, profileImage, description, nickName, gender } = req.body;
        const user = await User.findById(userId);

        //닉네임 중복 확인
        if (user.nickName !== nickName) {
            const existingNickName = await User.findOne({ nickName });
            if (existingNickName) {
                throw new Error("이미 존재하는 닉네임입니다");
            }
        }

        if (!userName || userName === "") {
            throw new Error("이름을 입력해주세요.");
        }

        if (stacks.length !== 0) {
            user.stacks = stacks;
        } else {
            user.stacks = ['none'];
        }

        user.userName = userName;
        user.profileImage = profileImage;
        user.description = description;
        user.gender = gender;
        user.nickName = nickName;
        user.isNicknameAndGenderChange = true;

        await user.save();

        res.status(200).json({ status: "success", data: { user } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

userController.getUserInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const userPost = await Post.find({ author: id });
        const user = await User.findById(id);

        if (!userPost) throw new Error("포스트를 찾을 수 없습니다");

        res.status(200).json({ status: "success", data: { user, userPost } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

userController.blockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        console.log(user)

        if (user.level === 'admin') {
            throw new Error("관리자는 삭제할 수 없습니다");
        }

        if (!user) throw new Error("유저를 찾을 수 없습니다");

        user.isBlock = !user.isBlock;
        const userBlockState = user.isBlock;

        await user.save();

        res.status(200).json({
            status: "success",
            message: userBlockState ? '사용자의 활동이 제한되었습니다' : '사용자의 활동 제한이 풀렸습니다'
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

userController.getUserByNickName = async (req, res) => {
    try {
        const { nickName } = req.params;
        const uniqueUser = await User.findOne({ nickName })
        if (!uniqueUser) {
            throw new Error("사용자를 찾을 수 없습니다")
        }
        const uniqueUserPost = await Post.find({ author: uniqueUser._id, isDelete: false })
        const uniqueUserMeetUp = await MeetUp.find({ organizer: uniqueUser._id, isDelete: false })
        const uniqueUserQna = await QnA.find({ author: uniqueUser._id, isDelete: false })
        const scrapedPostIds = uniqueUser.scrap
            .filter(scrapItem => !scrapItem.isDelete)
            .map(scrapItem => scrapItem.post);
        const uniqueUserScrap = await Post.find({ _id: { $in: scrapedPostIds } });
        const uniqueUserLikes = await Post.find({ userLikes: uniqueUser._id });
        const uniqueUserPostComments = await Post.find({ 'comments.author': uniqueUser._id, isDelete: false })
            .populate('author', '_id nickName profileImage createAt')
            .sort({ createAt: -1 })
            .lean();

            uniqueUserPostComments.forEach(post => {
                post.userComments = post.comments.filter(comment => !comment.isDelete && comment.author.toString() === uniqueUser._id.toString());
                post.comments = undefined;
            });
        
        const uniqueUserQnaComments = await QnA.find({ 'answers.author': uniqueUser._id, isDelete: false })
            .populate('author', '_id nickName profileImage createAt')
            .sort({ createAt: -1 })
            .lean()

            uniqueUserQnaComments.forEach(qna => {
                qna.userComments = qna.answers.filter(answer => !answer.isDelete && answer.author.toString() === uniqueUser._id.toString());
            });
        const following = await User.find({ _id: { $in: uniqueUser.following } });
        const followers = await User.find({ _id: { $in: uniqueUser.followers } });
        res.status(200).json({
            status: "success",
            data: {
                uniqueUser,
                uniqueUserPost,
                uniqueUserMeetUp,
                uniqueUserQna,
                uniqueUserScrap,
                uniqueUserLikes,
                uniqueUserPostComments,
                uniqueUserQnaComments,
                following,
                followers
            }
        })
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message })
    }
}

userController.followUser = async (req, res) => {
    try {
        const { userId } = req;
        const { nickName } = req.params;

        const user = await User.findById(userId);
        const targetUser = await User.findOne({ nickName })

        if (!user || !targetUser) {
            throw new Error("유저를 찾을 수 없습니다.");
        }

        if (user.following.includes(targetUser._id)) {
            throw new Error("이미 팔로우 중입니다");
        }

        await user.follow(targetUser._id);
        targetUser.followers.push(userId);
        await targetUser.save();

        res.status(200).json({ status: "success" })
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message })
    }
}

userController.unfollowUser = async (req, res) => {
    try {
        const { userId } = req;
        const { nickName } = req.params;

        const user = await User.findById(userId);
        const targetUser = await User.findOne({ nickName })

        if (!user || !targetUser) {
            throw new Error("유저를 찾을 수 없습니다")
        }

        if (!user.following.includes(targetUser._id)) {
            throw new Error("팔로우 중이 아닙니다");
        }

        await user.unfollow(targetUser._id);
        targetUser.followers = targetUser.followers.filter(
            (followerId) => followerId.toString() !== userId.toString()
        )
        await targetUser.save();

        res.status(200).json({ status: "success" })
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message })
    }
}

userController.forgetPassword = async (req, res) => {
    try {
        const { nickName, userName, email } = req.body;

        let findUser;

        if(nickName && userName) {
            findUser = await User.findOne({ nickName, userName });
        }
        if (email) {
            findUser = await User.findOne({ email });
        }

        if (!findUser) {
            throw new Error(`해당 유저가 존재하지 않습니다`)
        }

        if(findUser.googleUser) {
            throw new Error(`구글로 로그인한 계정은 비밀번호를 설정할 수 없습니다`)
        }

        res.status(200).json({ 
            status: "success", 
            message: '새로 변경할 비밀번호를 입력해주세요', 
            data: findUser 
        })
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message })
    }
}

userController.resetPassword = async (req, res) => {
    try {
        const { userId, password } = req.body;

        const findUser = await User.findById(userId);

        if (password) {
            const salt = bcrypt.genSaltSync(10);
            const hash = await bcrypt.hash(password, salt);
            findUser.password = hash;
        }

        await findUser.save();

        res.status(200).json({ status: "success", message: '비밀번호가 변경되었습니다' })
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message })
    }
}

userController.userOnlineState = async ({ userId, socketId, online }) => {
    try {
        if(userId && socketId && online) {
            const user = await User.findById(userId)
            if(!user) throw new Error('유저가 존재하지 않습니다')
    
            user.online = {
                socketId,
                online
            };
            await user.save();
    
            return user;
        } else if(!userId && socketId && !online) {
            const user = await User.findOne({ 'online.socketId': socketId })
            if(!user) throw new Error('소켓 ID에 해당하는 유저가 존재하지 않습니다');

            user.online = {
                socketId,
                online
            };
            await user.save();
        }
        console.log(userId, socketId, online)
        
    } catch (error) {
        return error.message
    }
}

module.exports = userController;
