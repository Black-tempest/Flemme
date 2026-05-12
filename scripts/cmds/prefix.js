const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "2.5",
    author: "Ivdra Uchiwa",
    countDown: 5,
    role: 0,
    description: "Prefix system + user panel image",
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
        form.messageID = info.messageID;
        global.GoatBot.onReaction.set(info.messageID, form);
      }
    );
  },

  onReaction: async function ({ message, event, Reaction, getLang }) {
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
      await global.db.threads.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  onChat: function ({ event, message, usersData, api }) {

    (async () => {
      if (!event.body || event.body.toLowerCase() !== "prefix") return;

      try {
        const uid = event.senderID;
        const userName = await usersData.getName(uid);

        const systemPrefix = global.GoatBot.config.prefix;
        const threadPrefix = global.utils.getPrefix(event.threadID);

        let userNameFull = userName;

        try {
          const info = await api.getUserInfo(uid);
          userNameFull = info?.[uid]?.name || userName;
        } catch {}

        // ───────── TEXTE EXACT DEMANDÉ ─────────
        const textInfo =
`╭════════════╮
 ┃
 ┃ 💠 Current bot prefix : ${threadPrefix}
 ┃ 🗝️  System prefix : ${systemPrefix}
 ┃ 🫡 I am at your service ${userNameFull}
 ┃ 📌 Type ${threadPrefix}help to see command list
 ┃ 👑 Creator: Ivdra Uchiwa
 ┃ 🔗 Facebook: https://www.facebook.com/kakashi.cmr
 ┃
 ╰════════════╯`;

        // ───────── CANVAS SIMPLE STABLE ─────────
        const W = 700, H = 420;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext("2d");

        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#0a0a1a");
        bg.addColorStop(1, "#12121e");

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // titre
        ctx.fillStyle = "#ff4d4d";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚙ PREFIX INFO PANEL", W / 2, 40);

        function box(x, y, w, h, title, value, color) {
          ctx.fillStyle = "rgba(20,20,30,0.95)";
          ctx.fillRect(x, y, w, h);

          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = color;
          ctx.font = "bold 13px Arial";
          ctx.textAlign = "left";
          ctx.fillText(title, x + 12, y + 20);

          ctx.fillStyle = "#fff";
          ctx.font = "bold 14px Arial";

          const text = String(value);
          const lines = text.length > 28
            ? [text.slice(0, 28), text.slice(28, 60)]
            : [text];

          lines.forEach((line, i) => {
            ctx.fillText(line, x + 12, y + 45 + (i * 16));
          });
        }

        box(40, 80, 300, 90, "💠 SYSTEM PREFIX", systemPrefix, "#ff4040");
        box(360, 80, 300, 90, "📌 GROUP PREFIX", threadPrefix, "#50b4ff");

        box(40, 200, 300, 90, "👤 USER", userNameFull, "#50ffa0");
        box(360, 200, 300, 90, "🆔 UID", uid, "#c850ff");

        box(200, 310, 300, 80, "📌 COMMAND", `${threadPrefix}help`, "#ffc83c");

        const filePath = path.join(__dirname, "cache", `prefix_${event.threadID}.png`);
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

        return message.reply({
          body: textInfo,
          attachment: fs.createReadStream(filePath)
        });

      } catch (e) {
        console.log("PREFIX ERROR:", e);
        return message.reply("❌ Error prefix command");
      }
    })();
  }
};
