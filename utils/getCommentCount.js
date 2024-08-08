function getCommentCount(comments) {
    var commentsLength = 0;
    console.log('comments', comments)
    comments.map((comment) => {
        if (!comment.isDelete) commentsLength += 1;
    });
    return commentsLength;
}

module.exports = getCommentCount;
