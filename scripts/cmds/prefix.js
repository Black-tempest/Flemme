const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "2.1",
    author: "Ivdra Uchiwa",
    countDown: 5,
    role: 0,
    description: "Change bot prefix + affiche les infos en image",
    category: "config",
    guide: {
      en:
        "   {pn} <new prefix>: change prefix\n" +
        "   Example: {pn} #\n\n" +
        "   {pn} <new prefix> -g: system prefix (admin only)\n" +
        "   Example: {pn} # -g\n\n" +
        "   {pn} reset: reset prefix to default"
    }
  },

  langs: {
    en: {
      reset: "Your prefix has been reset: %1",
      onlyAdmin: "Only admin can change the system prefix",
      confirmGlobal: "React to confirm the system prefix change",
      confirmThisThread: "React to confirm the group prefix change",
      successGlobal: "✅ System prefix changed to: %1",
      successThisThread: "✅ Group prefix changed to: %1"
    }
  },

  // ─────────────────────────────────────────────────────────────
  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet = { commandName, author: event.senderID, newPrefix };

    if (args[1] === "-g") {
      if (role < 2) return message.reply(getLang("onlyAdmin"));
      formSet.setGlobal = true;
    } else {
      formSet.setGlobal = false;
    }

    return message.reply(
      args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"),
      (err, info) => {
        formSet.messageID = info.messageID;
        global.GoatBot.onReaction.set(info.messageID, formSet);
      }
    );
  },

  // ─────────────────────────────────────────────────────────────
  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
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

  // ─────────────────────────────────────────────────────────────
  onChat: async function ({ event, message, usersData }) {
    if (!event.body || event.body.toLowerCase() !== "prefix") return;

    const userName     = await usersData.getName(event.senderID);
    const systemPrefix = global.GoatBot.config.prefix;
    const threadPrefix = utils.getPrefix(event.threadID);

    // ── Texte stylé ────────────────────────────────────────────
    const textInfo =
      ` ╭════════════╮\n` +
      ` ┃\n` +
      ` ┃ 💠 Current bot prefix : ${threadPrefix}\n` +
      ` ┃ 🗝️  System prefix : ${systemPrefix}\n` +
      ` ┃ 🫡 I am at your service ${userName}\n` +
      ` ┃ 📌 Type ${threadPrefix}help to see command list\n` +
      ` ┃ 👑 Creator: Ivdra Uchiwa\n` +
      ` ┃ 🔗 Facebook: https://www.facebook.com/kakashi.cmr\n` +
      ` ┃\n` +
      ` ╰════════════╯`;

    // ── Génération de l'image ──────────────────────────────────
    const W = 700, H = 520;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Fond dégradé sombre
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#0a0a1a");
    bgGrad.addColorStop(1, "#12121e");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Titre ──────────────────────────────────────────────────
    ctx.textAlign = "center";
    ctx.font = "bold 22px DejaVu Sans, Arial";
    ctx.shadowColor = "#cc0000";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ff5555";
    ctx.fillText("⚙  INFORMATIONS BOT", W / 2, 40);
    ctx.shadowBlur = 0;

    // Ligne déco titre
    ctx.strokeStyle = "rgba(200,40,40,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40, 55); ctx.lineTo(W - 40, 55); ctx.stroke();

    // ── Fonction badge ─────────────────────────────────────────
    function drawBadge(cx, cy, rw, rh, borderColor, bgColor, label, value) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3 - i;
        ctx.globalAlpha = 1 - i * 0.25;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rw - i, rh - i, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = borderColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - rw + 18, cy + 3);
      ctx.lineTo(cx + rw - 18, cy + 3);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.font = "bold 13px DejaVu Sans, Arial";
      ctx.fillStyle = borderColor;
      ctx.fillText(label, cx, cy - rh / 2 + 14);

      ctx.font = "bold 17px DejaVu Sans, Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(value, cx, cy + rh / 2 - 10);
    }

    // ── Lignes de connexion centre → satellites ────────────────
    const ccx = W / 2, ccy = H / 2 + 10;
    const lineTargets = [
      { x: 120,     y: 145,     col: "rgba(80,180,255,0.4)" },
      { x: W - 120, y: 145,     col: "rgba(255,80,80,0.4)" },
      { x: 80,      y: ccy,     col: "rgba(80,255,160,0.4)" },
      { x: W - 80,  y: ccy,     col: "rgba(200,80,255,0.4)" },
      { x: 155,     y: H - 108, col: "rgba(255,200,60,0.4)" },
      { x: W - 155, y: H - 108, col: "rgba(60,230,255,0.4)" },
    ];
    lineTargets.forEach(t => {
      ctx.strokeStyle = t.col;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(ccx, ccy);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // ── Badge central ──────────────────────────────────────────
    drawBadge(ccx, ccy, 82, 52, "#ff4040", "#3c0a0a", "🔴  SYSTEME", systemPrefix);

    // ── Badges satellites ──────────────────────────────────────
    const badges = [
      { x: 120,     y: 145,     rw: 92, rh: 46, border: "#50b4ff", bg: "#08193a", label: "💠 Prefix groupe",   val: threadPrefix },
      { x: W - 120, y: 145,     rw: 92, rh: 46, border: "#ff5050", bg: "#3a0808", label: "🗝️  Prefix système", val: systemPrefix },
      { x: 80,      y: ccy,     rw: 84, rh: 42, border: "#50ffa0", bg: "#083219", label: "👤 Utilisateur",      val: userName.length > 14 ? userName.slice(0, 13) + "…" : userName },
      { x: W - 80,  y: ccy,     rw: 84, rh: 42, border: "#c850ff", bg: "#230838", label: "👑 Créateur",         val: "Ivdra Uchiwa" },
      { x: 155,     y: H - 108, rw: 90, rh: 46, border: "#ffc83c", bg: "#322500", label: "📌 Help",             val: `${threadPrefix}help` },
      { x: W - 155, y: H - 108, rw: 90, rh: 46, border: "#3ce6ff", bg: "#052830", label: "🔗 Facebook",         val: "kakashi.cmr" },
    ];
    badges.forEach(b => drawBadge(b.x, b.y, b.rw, b.rh, b.border, b.bg, b.label, b.val));

    // ── Bas de page ───────────────────────────────────────────
    ctx.strokeStyle = "rgba(200,40,40,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, H - 36); ctx.lineTo(W - 40, H - 36); ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "12px DejaVu Sans, Arial";
    ctx.fillStyle = "rgba(160,160,190,0.85)";
    ctx.fillText(`Je suis à votre service, ${userName}  •  GoatBot`, W / 2, H - 16);

    // ── Sauvegarde et envoi ───────────────────────────────────
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const imgPath = path.join(cacheDir, `prefix_${event.threadID}.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(imgPath, buffer);

    // ── Envoi : texte + image ensemble ────────────────────────
    return message.reply({
      body: textInfo,
      attachment: fs.createReadStream(imgPath)
    });
  }
};
