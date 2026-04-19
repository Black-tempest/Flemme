const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "botconfig.json");

// 🔹 Charger config
function getConfig() {
  if (!fs.existsSync(configPath)) {
    return { name: "BOT", prefix: "!" };
  }
  return JSON.parse(fs.readFileSync(configPath));
}

// 🔹 Sauvegarder config
function setConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "ordre",
    version: "6.0",
    author: "Ivdra Uchiwa",
    role: 2,
    category: "admin",
    shortDescription: "Contrôle total du bot"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, mentions } = event;
    const input = args.join(" ");
    const text = input.toLowerCase();
    const mentionID = Object.keys(mentions)[0];

    let config = getConfig();

    if (!input) {
      return api.sendMessage("❌ Donne un ordre.", threadID, messageID);
    }

    // =========================
    // 🤖 NOM BOT GLOBAL
    // =========================
    if (text.startsWith("nom du bot")) {
      const newName = input.replace(/nom du bot/gi, "").trim();

      if (!newName) {
        return api.sendMessage("❌ Donne un nom.", threadID, messageID);
      }

      try {
        const botID = api.getCurrentUserID();
        const threads = await api.getThreadList(100, null, ["INBOX"]);

        for (const t of threads) {
          try {
            await api.changeNickname(newName, t.threadID, botID);
          } catch {}
        }

        config.name = newName;
        setConfig(config);

        return api.sendMessage(
          `🌍 Nom du bot changé partout : ${newName}`,
          threadID,
          messageID
        );

      } catch (e) {
        return api.sendMessage("❌ Erreur changement global.", threadID, messageID);
      }
    }

    // =========================
    // ⚡ PREFIX
    // =========================
    if (text.startsWith("prefix")) {
      const newPrefix = args[1];

      if (!newPrefix) {
        return api.sendMessage("❌ Donne un prefix.", threadID, messageID);
      }

      config.prefix = newPrefix;
      setConfig(config);

      return api.sendMessage(`⚡ Prefix changé : ${newPrefix}`, threadID);
    }

    // =========================
    // 🔥 EXECUTE CMD
    // =========================
    if (text.startsWith("execute") || text.startsWith("lance")) {
      const cmdName = args[1];
      const cmdArgs = args.slice(2);

      const command = global.GoatBot.commands.get(cmdName);

      if (!command) {
        return api.sendMessage("❌ Commande introuvable.", threadID);
      }

      try {
        const fakeEvent = {
          ...event,
          body: cmdName + " " + cmdArgs.join(" "),
          args: cmdArgs
        };

        const context = {
          api,
          event: fakeEvent,
          args: cmdArgs,
          message: {
            reply: (msg) => api.sendMessage(msg, threadID)
          }
        };

        if (command.onStart) await command.onStart(context);
        if (command.onChat) await command.onChat(context);

        return api.sendMessage(`⚡ ${config.name} a exécuté ${cmdName}`, threadID);

      } catch (e) {
        return api.sendMessage("❌ Erreur.", threadID);
      }
    }

    // =========================
    // 📢 NOTIFY GLOBAL
    // =========================
    if (text.startsWith("notify")) {
      const msg = input.replace(/notify/gi, "").trim();

      if (!msg) {
        return api.sendMessage("❌ Message vide.", threadID);
      }

      const threads = await api.getThreadList(100, null, ["INBOX"]);

      for (const t of threads) {
        api.sendMessage(`📢 ${config.name} : ${msg}`, t.threadID);
      }

      return api.sendMessage("✅ Envoyé partout.", threadID);
    }

    // =========================
    // 👑 ADMIN
    // =========================
    if (text.includes("admin")) {
      if (!mentionID) return api.sendMessage("❌ Mentionne.", threadID);

      try {
        if (text.includes("ajoute") || text.includes("met")) {
          await api.changeAdminStatus(threadID, mentionID, true);
          return api.sendMessage("👑 Admin ajouté.", threadID);
        }

        if (text.includes("retire")) {
          await api.changeAdminStatus(threadID, mentionID, false);
          return api.sendMessage("🚫 Admin retiré.", threadID);
        }
      } catch {
        return api.sendMessage("❌ Erreur admin.", threadID);
      }
    }

    // =========================
    // 👢 KICK
    // =========================
    if (text.includes("kick") || text.includes("expulse")) {
      if (!mentionID) return api.sendMessage("❌ Mentionne.", threadID);

      try {
        await api.removeUserFromGroup(mentionID, threadID);
        return api.sendMessage("👢 Expulsé.", threadID);
      } catch {
        return api.sendMessage("❌ Impossible de kick.", threadID);
      }
    }

    // =========================
    // ✏️ NOM DU GROUPE
    // =========================
    if (
      text.includes("nom du groupe") ||
      text.includes("renomme groupe") ||
      text.includes("change groupe")
    ) {
      const newName = input
        .replace(/change|nom du groupe|renomme groupe|change groupe/gi, "")
        .trim();

      if (!newName) {
        return api.sendMessage("❌ Donne un nom pour le groupe.", threadID);
      }

      try {
        await api.setTitle(newName, threadID);
        return api.sendMessage(`✏️ Nom du groupe changé : ${newName}`, threadID);
      } catch {
        return api.sendMessage("❌ Impossible de changer le nom du groupe.", threadID);
      }
    }

    // =========================
    // 💬 PARLER
    // =========================
    if (text.startsWith("dit")) {
      const msg = input.replace(/dit/gi, "").trim();
      return api.sendMessage(`💬 ${config.name} : ${msg}`, threadID);
    }

    // =========================
    // 📜 HELP
    // =========================
    return api.sendMessage(
`🤖 ${config.name}

⚡ ${config.prefix}ordre lance help
🌍 ${config.prefix}ordre nom du bot Shadow
⚡ ${config.prefix}ordre prefix $
📢 ${config.prefix}ordre notify Bonjour
👑 ${config.prefix}ordre ajoute @user admin
👢 ${config.prefix}ordre kick @user
✏️ ${config.prefix}ordre change nom du groupe Elite
💬 ${config.prefix}ordre dit salut

🔥 CONTRÔLE TOTAL ACTIVÉ`,
      threadID
    );
  }
};
