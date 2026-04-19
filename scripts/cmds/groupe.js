module.exports = {
  config: {
    name: "groupe",
    aliases: ["gp"],
    version: "3.0",
    author: "Ivdra Uchiwa",
    role: 2,
    category: "admin"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, mentions } = event;
    const cmd = args[0];

    // =========================
    // 📜 LISTE GROUPES (SANS CACHE BUG)
    // =========================
    if (!cmd || cmd === "list") {
      try {
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        let msg = "📜 GROUPES ACTUELS :\n\n";
        let list = [];
        let index = 1;

        for (const t of threads) {
          if (t.isGroup && t.participantIDs.includes(api.getCurrentUserID())) {
            msg += `${index}. ${t.name || "Sans nom"}\n🆔 ${t.threadID}\n\n`;
            list.push({ index, threadID: t.threadID });
            index++;
          }
        }

        global.groupList = list;

        return api.sendMessage(msg, threadID, messageID);

      } catch {
        return api.sendMessage("❌ Erreur récupération groupes.", threadID);
      }
    }

    // =========================
    // 📊 INFO
    // =========================
    if (cmd === "info") {
      const index = parseInt(args[1]);
      const group = global.groupList?.find(g => g.index === index);

      if (!group) return api.sendMessage("❌ Groupe invalide.", threadID);

      try {
        const info = await api.getThreadInfo(group.threadID);

        return api.sendMessage(
`📊 INFO

📛 Nom : ${info.threadName}
👥 Membres : ${info.participantIDs.length}
🆔 UID : ${group.threadID}`,
          threadID
        );

      } catch {
        return api.sendMessage("❌ Erreur info.", threadID);
      }
    }

    // =========================
    // ➕ ADD USER (FIX)
    // =========================
    if (cmd === "add") {
      const index = parseInt(args[1]);
      const group = global.groupList?.find(g => g.index === index);

      const userID = Object.keys(mentions)[0] || args[2];

      if (!group || !userID) {
        return api.sendMessage("❌ gp add [num] @user / uid", threadID);
      }

      try {
        await api.addUserToGroup(userID, group.threadID);

        return api.sendMessage("✅ Ajouté avec succès.", threadID);

      } catch (e) {
        return api.sendMessage("❌ Ajout impossible (admin ? ami ?).", threadID);
      }
    }

    // =========================
    // 👑 AJOUT ADMIN DIRECT
    // =========================
    if (cmd === "admin") {
      const index = parseInt(args[1]);
      const group = global.groupList?.find(g => g.index === index);
      const userID = Object.keys(mentions)[0] || args[2];

      if (!group || !userID) {
        return api.sendMessage("❌ gp admin [num] @user / uid", threadID);
      }

      try {
        await api.changeAdminStatus(group.threadID, userID, true);

        return api.sendMessage("👑 Admin ajouté.", threadID);

      } catch {
        return api.sendMessage("❌ Impossible de mettre admin.", threadID);
      }
    }

    // =========================
    // 🚪 LEAVE
    // =========================
    if (cmd === "leave") {
      const index = parseInt(args[1]);
      const group = global.groupList?.find(g => g.index === index);

      if (!group) return api.sendMessage("❌ Groupe invalide.", threadID);

      try {
        const botID = api.getCurrentUserID();
        await api.removeUserFromGroup(botID, group.threadID);

        return api.sendMessage("🚪 Bot a quitté le groupe.", threadID);

      } catch {
        return api.sendMessage("❌ Impossible de quitter.", threadID);
      }
    }

    // =========================
    // 🔗 JOIN (VRAI FIX)
    // =========================
    if (cmd === "join") {
      return api.sendMessage(
`❌ Facebook bloque l'ajout par lien.

✅ Solution :
➡️ Ajoute le bot manuellement via le lien
➡️ Ou invite le bot directement

💡 Aucun bot ne peut rejoindre via lien automatiquement.`,
        threadID
      );
    }

    // =========================
    // ❓ HELP
    // =========================
    return api.sendMessage(
`📦 GP V3

📜 gp list
📊 gp info [num]
➕ gp add [num] @user
👑 gp admin [num] @user
🚪 gp leave [num]

⚠️ gp join impossible (bloqué par Facebook)`,
      threadID
    );
  }
};
