const nicknameWords = [
    "awesome",
    "happy",
    "cool",
    "brave",
    "dreamy",
    "magic",
    "sunny",
    "vivid",
    "wild",
    "gentle",
    "bright",
    "spark",
    "shiny",
    "breezy",
    "swift",
    "pure",
    "calm",
    "epic",
    "jolly",
    "merry",
    "lucky",
    "stellar",
    "vibrant",
    "daring",
    "golden",
    "harmony",
    "serene",
    "cosmic",
    "playful",
    "radiant",
    "charming",
    "glorious",
    "jubilant",
    "kindred",
    "serendipity",
    "tranquil",
    "whimsical",
    "zen",
    "blissful",
    "chirpy",
    "divine",
    "elegant",
    "graceful",
    "joyful",
    "mystic",
    "peaceful",
    "rhythmic",
    "soothing",
    "vital",
];

function generateRandomNickname() {
    const randomIndex = Math.floor(Math.random() * nicknameWords.length);
    const randomWord = nicknameWords[randomIndex];
    const randomIndex2 = Math.floor(Math.random() * nicknameWords.length);
    const randomWord2 = nicknameWords[randomIndex2];

    // 랜덤 숫자 생성 (100부터 999까지)
    const randomNumber = Math.floor(Math.random() * (900)) + 100;
    //Math.floor(Math.random()*100) 하면 0~99까지
    //Math.floor(Math.random()*900)하면 0~899까지

    const nickname = `${randomWord}_${randomWord2}${randomNumber}`;
    return nickname;
}

module.exports = generateRandomNickname;