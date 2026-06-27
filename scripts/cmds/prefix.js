const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

module.exports = {
  config: {
    name: "prefix",
    version: "2.6",
    author: "Ivdra Uchiwa",
    countDown: 5,
    role: 0,
    description: "Prefix system + user panel image with stats",
    category: "config"
  },

  langs: {
    en: {
      reset: "Your prefix has been reset: %1",
      onlyAdmin: "Only admin can change system prefix",
      confirmGlobal: "React to confirm system prefix change",
      confirmThisThread: "React to confirm group prefix change",
      successGlobal: "✅ System prefix changed: %1",
      successThisThread: "✅ Group prefix changed: %1"
    }
  },

  onStart: async function ({ message, event, args, role, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const form = {
      commandName: "prefix",
      author: event.senderID,
      newPrefix
    };

    if (args[1] === "-g") {
      if (role < 2) return message.reply(getLang("onlyAdmin"));
      form.setGlobal = true;
    } else {
      form.setGlobal = false;
    }

    return message.reply(
      form.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread"),
      (err, info) => {
        if (err) return;
        form.messageID = info.messageID;
        global.GoatBot.onReaction.set(info.messageID, form);
      }
    );
  },

  onReaction: async function ({ message, event, Reaction, getLang, threadsData }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(
        global.client.dirConfig,
        JSON.stringify(global.GoatBot.config, null, 2)
      );
      return message.reply(getLang("successGlobal", newPrefix));
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  onChat: async function ({ event, message, usersData, api }) {
    if (!event.body || event.body.toLowerCase() !== "prefix") return;

    try {
      const uid = event.senderID;
      const threadID = event.threadID;

      const systemPrefix = global.GoatBot.config.prefix;
      const threadPrefix = global.utils.getPrefix(threadID);

      let userName = await usersData.getName(uid);
      try {
        const info = await api.getUserInfo(uid);
        userName = info?.[uid]?.name || userName;
      } catch {}

      const allUsers = global.db.allUserData.length;
      const allThreads = global.db.allThreadData.length;
      const allCmds = global.GoatBot.commands.size;
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

      const textInfo =
`╭════════════╮
 ┃
 ┃ 💠 Current bot prefix : ${threadPrefix}
 ┃ 🗝️  System prefix : ${systemPrefix}
 ┃ 🫡 I am at your service ${userName}
 ┃ 📌 Type ${threadPrefix}help to see command list
 ┃ 👑 Creator: Ivdra Uchiwa
 ┃ 🔗 Facebook: https://www.facebook.com/kakashi.cmr
 ┃
 ╰════════════╯`;

      const W = 1200, H = 900;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      const bgUrl = "https://i.ibb.co/7xBLftFK/6e641ea56e7b.jpg";
      try {
        const response = await axios.get(bgUrl, { responseType: "arraybuffer" });
        const bgImage = await loadImage(Buffer.from(response.data));
        ctx.drawImage(bgImage, 0, 0, W, H);
      } catch {
        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 42px 'Segoe UI', Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 12;
      ctx.fillText("📊 BOT STATISTICS", W / 2, 100);
      ctx.shadowBlur = 0;

      const leftX = 150;
      const rightX = 750;
      let y = 200;
      const lineHeight = 70;

      function drawLine(label, value, labelColor, valueColor = "#ffffff") {
        ctx.textAlign = "left";
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = labelColor;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 6;
        ctx.fillText(label, leftX, y);

        ctx.font = "bold 28px Arial";
        ctx.fillStyle = valueColor;
        ctx.fillText(value, leftX + 380, y);
        ctx.shadowBlur = 0;
        y += lineHeight;
      }

      drawLine("💠 SYSTEM PREFIX", systemPrefix, "#ff4040");
      drawLine("📌 GROUP PREFIX", threadPrefix, "#50b4ff");
      y += 20;

      drawLine("👤 USER", userName, "#50ffa0");
      drawLine("🆔 UID", uid, "#c850ff");
      y += 20;

      drawLine("👥 TOTAL USERS", allUsers.toString(), "#f0a500");
      drawLine("💬 TOTAL GROUPS", allThreads.toString(), "#00bcd4");
      drawLine("⚙️  COMMANDS", allCmds.toString(), "#e91e63");
      y += 20;

      drawLine("⏱️  UPTIME", uptimeStr, "#ffaa00");

      y += 40;
      ctx.textAlign = "center";
      ctx.font = "italic 24px Arial";
      ctx.fillStyle = "#cccccc";
      ctx.fillText("Creator: Ivdra Uchiwa", W / 2, y);
      ctx.fillText("fb.com/kakashi.cmr", W / 2, y + 30);

      const dirCache = path.join(__dirname, "cache");
      fs.ensureDirSync(dirCache);
      const filePath = path.join(dirCache, `prefix_${threadID}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer("image/png", { compressionLevel: 0 }));

      return message.reply({
        body: textInfo,
        attachment: fs.createReadStream(filePath)
      });

    } catch (e) {
      console.error("PREFIX IMAGE ERROR:", e);
      return message.reply("❌ Erreur lors de la génération de l'image des statistiques.");
    }
  }
};
