const axios = require("axios");

module.exports = {
  name: "copilot",
  description: "Pose une question à Copilot IA en temps réel",
  usage: "copilot <question>",
  author: "Ivdra",

  async execute(api, event, args) {
    const { threadID, messageID } = event;

    if (!args.length) {
      return api.sendMessage(
        "❓ Pose-moi une question !\nExemple : copilot Actualité d'aujourd'hui ?",
        threadID,
        messageID
      );
    }

    const question = args.join(" ");
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      // Étape 1 : obtenir le token VQD
      const init = await axios.get("https://duckduckgo.com/duckchat/v1/status", {
        headers: { "x-vqd-accept": "1" },
        timeout: 10000,
      });

      const vqd = init.headers["x-vqd-4"];

      if (!vqd) throw new Error("Impossible d'obtenir le token VQD");

      // Étape 2 : envoyer la question
      const chat = await axios.post(
        "https://duckduckgo.com/duckchat/v1/chat",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: question }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-vqd-4": vqd,
          },
          timeout: 30000,
          responseType: "text",
        }
      );

      // Étape 3 : parser le stream SSE
      const lines = chat.data.split("\n");
      let reponse = "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            if (parsed.message) reponse += parsed.message;
          } catch (_) {}
        }
      }

      if (!reponse) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("⚠️ Pas de réponse. Réessaie.", threadID, messageID);
      }

      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage(
        `🤖 Copilot\n❓ ${question}\n\n💬 ${reponse}`,
        threadID,
        messageID
      );

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ Erreur : ${err.message}`, threadID, messageID);
    }
  },
};

