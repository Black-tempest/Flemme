const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz", "quiz"],
    version: "3.1",
    author: "Mashrafi",
    countDown: 0,
    role: 0,
    category: "game",
    guide: "{p}quiz\n{p}quiz bn\n{p}quiz en"
  },

  onStart: async function ({ api, event, usersData, args }) {
    const input = args.join("").toLowerCase() || "bn";
    let timeout = 300;
    let category = input === "en" ? "english" : "bangla";

    try {
      const quizData = (
        await axios.get(`${await baseApiUrl()}/quiz?category=${category}&q=random`)
      ).data.question;

      const { question, correctAnswer, options } = quizData;
      const { a, b, c, d } = options;
      const namePlayer = await usersData.getName(event.senderID);

      const quizMsg = {
        body:
          `📝 QUIZ TIME, ${namePlayer}!\n\n` +
          `${question}\n\n` +
          `A) ${a}\n` +
          `B) ${b}\n` +
          `C) ${c}\n` +
          `D) ${d}\n\n` +
          `👉 Reply with A / B / C / D`
      };

      api.sendMessage(
        quizMsg,
        event.threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            type: "reply",
            commandName: this.config.name,
            author: event.senderID,
            messageID: info.messageID,
            correctAnswer,
            quizData,
            nameUser: namePlayer
          });

          setTimeout(() => {
            try {
              api.unsendMessage(info.messageID);
            } catch { }
          }, timeout * 1000);
        },
        event.messageID
      );
    } catch (error) {
      console.error("API ERROR:", error);
      api.sendMessage("❌ API Error. Try again later.", event.threadID);
    }
  },

  onReply: async ({ event, api, Reply, usersData }) => {
    if (event.senderID !== Reply.author)
      return api.sendMessage("This is not your quiz.", event.threadID, event.messageID);

    const userReply = event.body.trim().toLowerCase();
    const correct = Reply.correctAnswer.toLowerCase();

    try {
      api.unsendMessage(Reply.messageID);
    } catch { }

    if (userReply === correct) {
      // Reward system
      const rewardCoins = 300;
      const rewardExp = 100;

      const user = await usersData.get(Reply.author);
      await usersData.set(Reply.author, {
        money: user.money + rewardCoins,
        exp: user.exp + rewardExp,
        data: user.data
      });

      return api.sendMessage(
        `📘 Correct Answer!\n` +
        `✔ Answer: ${Reply.correctAnswer}\n\n` +
        `🎓 Rewards:\n` +
        `+${rewardCoins} Coins\n` +
        `+${rewardExp} EXP`,
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(
        `📕 Wrong Answer\n` +
        `✔ Correct Answer: ${Reply.correctAnswer}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
