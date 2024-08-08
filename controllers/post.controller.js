const mongoose = require("mongoose");
const postController = {};
const Post = require("../model/Post");
const formatDateTime = require("../utils/formatDateTime");
const User = require("../model/User");

postController.createPost = async (req, res) => {
    try {
        const { userId } = req;
        const { title, content, image, tags } = req.body;

        if (!title || !content) {
            throw new Error("필수 입력 항목이 누락되었습니다");
        }

        if (tags.length > 10) {
            throw new Error("태그는 10개까지 입력 가능합니다");
        }

        const newPost = new Post({
            author: userId,
            title,
            content,
            image,
            tags,
        });

        await newPost.save();

        const user = await User.findById(userId);
        await user.addActivity(userId);

        res.status(200).json({ status: "success", data: { newPost } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id)
            .populate({
                path: "author",
                select: "nickName profileImage"
            })
            .populate({
                path: "comments",
                populate: {
                    path: "author",
                    select: "nickName profileImage"
                },
            })
            .populate({
                path: "userLikes",
                select: "nickName profileImage",
            });

        if (!post) {
            throw new Error("포스트가 존재하지 않습니다");
        } else if(post.isDelete) {
            throw new Error("삭제된 포스트입니다");
        } else if(post.isBlock) {
            throw new Error("신고되어 제한된 포스트입니다");
        }

        res.status(200).json({ status: "success", data: { post } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image, tags } = req.body;

        const updateData = {
            title,
            content,
            image,
            tags,
        };

        const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        if (!updatedPost) {
            throw new Error("포스트 수정을 실패했습니다");
        }

        res.status(200).json({ status: "success", data: { updatedPost } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.deletePost = async (req, res) => {
    try {
        const { userId } = req;
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) throw new Error("포스트가 존재하지 않습니다");

        post.isDelete = true;
        await post.save();

        const user = await User.findById(userId);
        await user.substractActivity(userId);

        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.getAllPost = async (req, res) => {
    try {
        const { userId } = req;
        const user = await User.findById(userId);

        if (!user) throw new Error("사용자를 찾을 수 없습니다");

        const { tag, keyword, type, isFollowing } = req.query;

        let query = { isDelete: false, isBlock: false };

        if (tag) {
            query.tags = { $in: [tag] };
        }

        if (keyword) {
            const keywordRegex = new RegExp(keyword, "i");
            query.$or = [
                { title: { $regex: keywordRegex } },
                { content: { $regex: keywordRegex } },
            ];
        }

        if (isFollowing === "true") {
            query.author = { $in: user.following }; // 팔로우한 사용자의 게시물만 포함
        }

        const sortOptions = {
            comments: { sortBy: { commentCount: -1 } },
            popularity: { sortBy: { likes: -1 } },
            scrap: { sortBy: { scrapCount: -1 } },
            latest: { sortBy: { createAt: -1 } },
            default: { sortBy: { createAt: -1 } }, // 기본적으로 최신순으로 정렬
        };

        const { sortBy } = sortOptions[type] || sortOptions.default;

        const allPost = await Post.find(query, "-isDelete -isUpdated")
            .sort(sortBy)
            .populate({
                path: "author",
                select: "nickName profileImage"
            });

        if (!allPost.length) {
            throw new Error("포스트가 존재하지 않습니다");
        }

        return res.status(200).json({ status: "success", data: { allPost } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.incrementLikesAndAddUser = async (req, res) => {
    try {
        const { userId } = req;
        const { postId } = req.body;

        const post = await Post.findById(postId).populate("author");

        if (!post) throw new Error("포스트가 존재하지 않습니다");

        await post.addLike(userId);

        res.status(200).json({ status: "success", data: { post } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.createComment = async (req, res) => {
    try {
        const { userId } = req;
        const { postId, content } = req.body;

        const post = await Post.findById(postId);

        if (!post) throw new Error("포스트가 존재하지 않습니다");

        const newComment = {
            author: userId,
            content,
        };
        post.comments.push(newComment);

        await post.save();

        res.status(200).json({ status: "success", data: { post } });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.updateComment = async (req, res) => {
    try {
        const { userId } = req;
        const { content } = req.body;
        const { postId, commentId } = req.params;

        const updateData = {
            content,
            isUpdated: true,
        };

        const post = await Post.findById(postId);

        if (!post || post.isDelete) {
            throw new Error("존재하지 않거나 삭제된 포스트입니다");
        }

        const comment = post.comments.id(commentId);

        if (!comment || comment.isDelete) {
            throw new Error("존재하지 않거나 삭제된 답변입니다");
        }

        if (comment.author.toString() !== userId) {
            throw new Error("수정 권한이 없습니다");
        }

        comment.set(updateData);

        await post.save();

        res.status(200).json({
            status: "success",
            message: "댓글 수정에 성공했습니다",
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.deleteComment = async (req, res) => {
    try {
        const { userId } = req;
        const { postId, commentId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            throw new Error("해당 질문이 존재하지 않습니다");
        }

        const comment = post.comments.id(commentId);

        if (!comment) {
            throw new Error("해당 답변이 존재하지 않습니다");
        }

        if (comment.author.toString() !== userId) {
            throw new Error("삭제 권한이 없습니다");
        }

        // 답변을 삭제 상태로 표시
        comment.isDelete = true;

        await post.save();

        res.status(200).json({
            status: "success",
            message: "댓글 삭제를 성공했습니다",
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.addScrap = async (req, res) => {
    try {
        const { userId } = req;
        const { postId, isPrivate } = req.body;

        const user = await User.findById(userId);

        const post = await Post.findById(postId);
        if (user && !post) throw new Error("포스트가 존재하지 않습니다");

        if (user.scrap.some((i) => i.post.equals(post._id) && !i.isDelete)) {
            throw new Error("이미 스크랩된 포스트입니다");
        }

        const newScrap = {
            post: post,
            isPrivate: isPrivate,
        };

        user.scrap.push(newScrap);
        post.scrapCount += 1;

        await user.save();
        await post.save();

        res.status(200).json({ status: "success" });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.toggleScrapPrivate = async (req, res) => {
    try {
        const { userId } = req;
        const { postId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("사용자가 존재하지 않습니다");
        }

        const scrapItem = user.scrap.find(i => i.post.toString() === postId.toString());
        if (!scrapItem) {
            throw new Error("해당 포스트를 스크랩한 기록이 없습니다");
        }

        scrapItem.isPrivate = !scrapItem.isPrivate;
        await user.save();


        res.status(200).json({ 
            status: "success",
            message: scrapItem.isPrivate ? '비공개로 전환되었습니다' : '공개로 전환되었습니다'
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
};

postController.deleteScrap = async (req, res) => {
    try {
        const { userId } = req;
        const { postId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("사용자가 존재하지 않습니다");
        }

        console.log(postId)

        const scrapItem = user.scrap.find(i => i.post.toString() === postId.toString());
        if (!scrapItem) {
            throw new Error("해당 포스트를 스크랩한 기록이 없습니다");
        }

        scrapItem.isDelete = true;
        await user.save();

        res.status(200).json({ 
            status: "success",
            message: '해당 포스트가 스크랩에서 삭제되었습니다'
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
}

postController.blockPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        if (!post) throw new Error('포스트가 존재하지 않습니다.')

        post.isBlock = !post.isBlock;
        const postStatus = post.isBlock;

        await post.save();

        res.status(200).json({ 
            status: "success", 
            message: postStatus ? "포스트를 비공개 처리하였습니다." : "포스트를 공개로 전환하였습니다." 
        });
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message });
    }
}

module.exports = postController;