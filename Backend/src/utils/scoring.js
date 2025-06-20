const computeVideoScore = (video) => {
    const now = Date.now();
    const ageInDays = (now - new Date(video.uploadDate)) / (1000 * 60 * 60 * 24);

    const viewScore = video.views / 1000; // 1000 views = 1 point
    const likeScore = video.likes.length / 100; // 100 likes = 1 point
    const recencyScore = Math.max(0, 30 - ageInDays); // Newer = better

    return viewScore + likeScore + recencyScore;
}

export { computeVideoScore }