const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

let bgToggle = 0;
const bgUrls = [
  "https://i.ibb.co/VWG8RRp2/8f7c19943000.jpg",
  "https://i.ibb.co/jk6X8mZk/a0b497962141.jpg",
  "https://files.catbox.moe/e7rojn",
  "https://files.catbox.moe/h4e583",
  "https://files.catbox.moe/0bz32x",
  "https://files.catbox.moe/nb99w2"
];

function toBold(text) {
  const map = {
    A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",
    K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",
    U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
    a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",
    k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",
    u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳"
  };
  return text.split('').map(c => map[c] || c).join('');
}

function normalizeCategory(cat) {
  if (!cat) return "other";
  return cat.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "").trim();
}

function cleanCategoryName(cat) {
  if (!cat) return "OTHER";
  return cat.trim().toUpperCase();
}

function roleText(role) {
  if (role == 0) return "All users";
  if (role == 1) return "Group admin";
  if (role == 2) return "Bot admin";
  return "Unknown";
}

function drawCircleImage(ctx, img, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function drawOutlinedText(ctx, text, x, y, font, fillColor, strokeColor = "#000000", lineWidth = 4) {
  ctx.save();
  ctx.font = font;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}

async function generateProfileCard({ name, uid, totalCmds, prefix, avatarBuffer, bgUrl }) {
  const W = 960, H = 440;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  try {
    const res = await axios.get(bgUrl, { responseType: "arraybuffer", timeout: 10000 });
    const bg = await loadImage(Buffer.from(res.data));
    ctx.drawImage(bg, 0, 0, W, H);
  } catch {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#080814");
    grad.addColorStop(1, "#0f0f28");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, W, H);

  const AX = 150, AY = 200, AR = 100;
  if (avatarBuffer) {
    try {
      const img = await loadImage(avatarBuffer);
      drawCircleImage(ctx, img, AX, AY, AR);
    } catch {
      ctx.fillStyle = "#12122e";
      ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      drawOutlinedText(ctx, name.slice(0,2).toUpperCase(), AX, AY, "bold 48px sans-serif", "#00ff9d", "#000000", 5);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
    }
  } else {
    ctx.fillStyle = "#12122e";
    ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawOutlinedText(ctx, name.slice(0,2).toUpperCase(), AX, AY, "bold 48px sans-serif", "#00ff9d", "#000000", 5);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  ctx.beginPath();
  ctx.arc(AX, AY, AR, 0, Math.PI * 2);
  ctx.strokeStyle = "#00ff9d";
  ctx.lineWidth = 4;
  ctx.stroke();

  const TX = AX + AR + 60;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.font = "bold 40px sans-serif";
  const maxNameWidth = W - TX - 20;
  let displayName = name;
  if (ctx.measureText(displayName).width > maxNameWidth) {
    while (ctx.measureText(displayName + "…").width > maxNameWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    displayName += "…";
  }
  drawOutlinedText(ctx, displayName, TX, 70, "bold 40px sans-serif", "#ffffff", "#000000", 5);

  const nameW = ctx.measureText(displayName).width;
  ctx.fillStyle = "#00ff9d";
  ctx.fillRect(TX, 115, Math.min(nameW, maxNameWidth), 3);

  const col1 = TX;
  const col2 = TX + 280;
  const lineHeight = 45;
  let y = 145;

  const infoLines = [
    { label: "🆔 UID",        value: uid,                  labelColor: "#c850ff", valueColor: "#ffffff" },
    { label: "⚙️ Cmds",      value: `${totalCmds} dispo`, labelColor: "#7b61ff", valueColor: "#ffffff" },
    { label: "💠 Prefixe",   value: prefix,               labelColor: "#ffd60a", valueColor: "#ffffff" },
    { label: "🤖 Bot",       value: "GoatBot v2",      labelColor: "#ff3cac", valueColor: "#ffffff" }
  ];

  for (const line of infoLines) {
    drawOutlinedText(ctx, line.label, col1, y, "bold 24px sans-serif", line.labelColor, "#000000", 4);
    drawOutlinedText(ctx, line.value, col2, y, "bold 24px sans-serif", line.valueColor, "#000000", 4);
    y += lineHeight;
  }

  ctx.fillStyle = "#050510";
  ctx.fillRect(0, H - 40, W, 40);
  ctx.fillStyle = "#1a1a38";
  ctx.fillRect(0, H - 40, W, 1);

  ctx.font = "14px monospace";
  ctx.fillStyle = "#aaaacc";
  ctx.fillText(`Tape  ${prefix}help <commande>  pour plus de details`, TX, H - 26);

  return canvas.toBuffer("image/png");
}

async function downloadAvatar(senderID) {
  const url = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

module.exports = {
  config: {
    name: "help",
    version: "10.5",
    author: "Ivdra Uchiwa",
    role: 0,
    category: "info"
  },

  onStart: async function ({ message, args, event, usersData, api }) {
    const { getPrefix } = global.utils;
    const prefix = await getPrefix(event.threadID);
    const userName = (await usersData.getName(event.senderID)) || "User";
    const senderID = event.senderID;
    const { commands, aliases } = global.GoatBot;

    const categories = {};
    for (const [name, value] of commands) {
      const rawCat = value.config?.category || "OTHER";
      const key = normalizeCategory(rawCat);
      if (!categories[key]) {
        categories[key] = { displayName: cleanCategoryName(rawCat), cmds: new Set() };
      }
      categories[key].cmds.add(name);
    }

    const allCmds = [];
    Object.values(categories)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .forEach(cat => {
        const sorted = [...cat.cmds].sort((a, b) => a.localeCompare(b));
        sorted.forEach(cmd => allCmds.push({ name: cmd, category: cat.displayName }));
      });

    const perPage = 10;
    const pages = [];
    for (let i = 0; i < allCmds.length; i += perPage) {
      const chunk = allCmds.slice(i, i + perPage);
      let text = `📄 Page ${pages.length + 1}/${Math.ceil(allCmds.length / perPage)}\n`;
      const byCat = {};
      chunk.forEach(cmd => {
        if (!byCat[cmd.category]) byCat[cmd.category] = [];
        byCat[cmd.category].push(cmd.name);
      });
      for (const [cat, names] of Object.entries(byCat)) {
        text += `\n【 ${toBold(cat)} 】\n`;
        names.forEach(n => text += `➩ ${toBold(n)} 🌹\n`);
      }
      text += `\n✨ Total: ${commands.size} commandes\n`;
      text += `📌 Use: ${prefix}help <commande>`;
      pages.push(text);
    }

    let targetPage = 0;
    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        const pageNum = parseInt(args[0]);
        if (pageNum < 1 || pageNum > pages.length) {
          return message.reply(`❌ Page ${pageNum} invalide. Il y a ${pages.length} page(s).`);
        }
        targetPage = pageNum - 1;
      } else {
        const cmdName = args[0].toLowerCase();
        const cmd = commands.get(cmdName) || commands.get(aliases.get(cmdName));
        if (!cmd) return message.reply(`❌ Commande "${cmdName}" introuvable.`);

        const cfg = cmd.config;
        return message.reply(
`╔『 📌ℂ𝕆𝕄𝕄𝔸𝔻 𝕀ℕ𝔽𝕆』╗

➩ Name: ${toBold(cfg.name)}
➩ Description: ${cfg.longDescription?.en || "Aucune description"}
➩ Aliases: ${cfg.aliases?.join(", ") || "Aucun"}
➩ Version: ${cfg.version || "1.0"}
➩ Role: ${roleText(cfg.role)}
➩ Cooldown: ${cfg.countDown || 2}s
➩ Author: ${cfg.author || "Unknown"}

📖 Usage:
${toBold((cfg.guide?.en || "Aucun guide")
  .replace(/{pn}/g, prefix)
  .replace(/{n}/g, cfg.name))}

╚═══════════════╝`
        );
      }
    }

    bgToggle = (bgToggle + 1) % bgUrls.length;
    const bgUrl = bgUrls[bgToggle];

    let imgBuffer = null;
    try {
      const avatarBuffer = await downloadAvatar(senderID);
      imgBuffer = await generateProfileCard({
        name: userName,
        uid: senderID,
        totalCmds: commands.size,
        prefix,
        avatarBuffer,
        bgUrl
      });
    } catch (e) {
      console.error("[help] image error:", e.message);
    }

    const tmpDir = path.join(__dirname, "../tmp");
    fs.ensureDirSync(tmpDir);
    const tmpPath = path.join(tmpDir, `help_${senderID}.png`);
    if (imgBuffer) fs.writeFileSync(tmpPath, imgBuffer);

    let sent;
    try {
      sent = await message.reply({
        body: pages[targetPage],
        attachment: imgBuffer ? fs.createReadStream(tmpPath) : undefined
      });
    } catch {
      sent = await message.reply({
        body: pages[targetPage],
        attachment: imgBuffer ? [fs.createReadStream(tmpPath)] : undefined
      });
    }

    if (imgBuffer) {
      setTimeout(() => { try { fs.unlinkSync(tmpPath); } catch {} }, 15000);
    }

    const msgID = sent.messageID;
    if (pages.length > 1) {
      try {
        await message.react("◀️");
        const numEmojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
        for (let i = 0; i < Math.min(pages.length, 10); i++) {
          await message.react(numEmojis[i]);
        }
        await message.react("▶️");
      } catch {}
    }

    global.GoatBot.onReaction.set(msgID, {
      commandName: "help",
      pages,
      currentPage: targetPage,
      userID: senderID,
      messageID: msgID
    });

    setTimeout(() => {
      global.GoatBot.onReaction.delete(msgID);
    }, 300000);
  },

  onReaction: async function ({ message, event, Reaction, api }) {
    const { pages, currentPage, userID, messageID } = Reaction;
    if (event.userID !== userID) return;

    const emoji = event.reaction;
    let newPage = currentPage;

    if (emoji === "▶️") {
      newPage = Math.min(currentPage + 1, pages.length - 1);
    } else if (emoji === "◀️") {
      newPage = Math.max(currentPage - 1, 0);
    } else {
      const idx = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"].indexOf(emoji);
      if (idx !== -1 && idx < pages.length) newPage = idx;
    }

    if (newPage !== currentPage) {
      try {
        await api.editMessage(pages[newPage], messageID);
        Reaction.currentPage = newPage;
        global.GoatBot.onReaction.set(messageID, Reaction);
      } catch (err) {
        console.error("[help] edit error:", err.message);
      }
    }

    try {
      await api.setMessageReaction(event.messageID, "🗑️", false);
    } catch {}
  }
};
