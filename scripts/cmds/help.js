const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// ═══════════════════════════════════════
//  BOLD UNICODE
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
//  CATÉGORIE — FIX RÉPÉTITION
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
//  RÔLE
// ═══════════════════════════════════════
function roleText(role) {
  if (role == 0) return "All users";
  if (role == 1) return "Group admin";
  if (role == 2) return "Bot admin";
  return "Unknown";
}

// ═══════════════════════════════════════
//  DESSIN CERCLE AVATAR (clip circulaire)
// ═══════════════════════════════════════
function drawCircleImage(ctx, img, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// ═══════════════════════════════════════
//  GÉNÉRATION CARTE IMAGE (canvas Node.js)
// ═══════════════════════════════════════
async function generateProfileCard({ name, uid, totalCmds, prefix, avatarBuffer }) {
  const W = 920, H = 440;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── Fond dégradé
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   "#080814");
  grad.addColorStop(1,   "#0f0f28");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Grille
  ctx.strokeStyle = "rgba(40,40,80,0.8)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // ── Glow vert autour de l'avatar
  const AX = 200, AY = 220, AR = 115;
  for (let i = 30; i > 0; i -= 3) {
    ctx.beginPath();
    ctx.arc(AX, AY, AR + i, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,157,${0.018 * (i / 30) ** 2})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // ── Photo de profil
  if (avatarBuffer) {
    try {
      const img = await loadImage(avatarBuffer);
      drawCircleImage(ctx, img, AX, AY, AR);
    } catch {
      // Fallback initiales
      ctx.fillStyle = "#12122e";
      ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#00ff9d";
      ctx.font = "bold 52px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name.slice(0,2).toUpperCase(), AX, AY);
    }
  } else {
    ctx.fillStyle = "#12122e";
    ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#00ff9d";
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.slice(0,2).toUpperCase(), AX, AY);
  }

  // Bordure verte autour de l'avatar
  ctx.beginPath();
  ctx.arc(AX, AY, AR, 0, Math.PI * 2);
  ctx.strokeStyle = "#00ff9d";
  ctx.lineWidth = 3;
  ctx.stroke();

  // ── Brackets coins
  const bDraw = (x, y, dx, dy, color) => {
    const s = 30, w = 3;
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx*s, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + dy*s); ctx.stroke();
  };
  bDraw(20, 20,   1,  1, "#00ff9d");
  bDraw(W-20, 20, -1,  1, "#7b61ff");
  bDraw(20, H-20,  1, -1, "#00ff9d");
  bDraw(W-20, H-20,-1,-1, "#7b61ff");

  // ── Séparateur vertical
  const TX = AX + AR + 50;
  const sepGrad = ctx.createLinearGradient(TX, 65, TX, H - 55);
  sepGrad.addColorStop(0,   "rgba(60,60,120,0)");
  sepGrad.addColorStop(0.5, "rgba(60,60,120,0.9)");
  sepGrad.addColorStop(1,   "rgba(60,60,120,0)");
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(TX, 65); ctx.lineTo(TX, H - 55); ctx.stroke();

  const TX2 = TX + 28;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // ── Nom
  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, TX2, 65);

  // Underline vert sous le nom
  const nw = ctx.measureText(name).width;
  ctx.fillStyle = "#00ff9d";
  ctx.fillRect(TX2, 115, Math.min(nw, 380), 2);

  // ── Lignes d'info
  const rows = [
    { label: "UID",       value: uid,                  color: "#00ff9d", icon: "ID" },
    { label: "Cmds",      value: `${totalCmds} dispo`, color: "#7b61ff", icon: "##" },
    { label: "Prefixe",   value: prefix,               color: "#ffd60a", icon: ">_" },
    { label: "Bot",       value: "GoatBot v10.4",      color: "#ff3cac", icon: "[]" },
  ];

  let yy = 136;
  for (const row of rows) {
    // Fond pill
    ctx.fillStyle = "rgba(14,14,36,0.85)";
    roundRect(ctx, TX2 - 5, yy - 5, 410, 38, 7);
    ctx.fill();

    // Icône + label
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = "#6666aa";
    ctx.fillText(`${row.icon} ${row.label}: `, TX2 + 8, yy + 4);
    const lw = ctx.measureText(`${row.icon} ${row.label}: `).width;

    // Valeur colorée
    ctx.font = "bold 19px monospace";
    ctx.fillStyle = row.color;
    ctx.fillText(row.value, TX2 + 8 + lw, yy + 5);

    yy += 50;
  }

  // ── Barre du bas
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, H - 44, W, 44);
  ctx.fillStyle = "#1a1a38";
  ctx.fillRect(0, H - 44, W, 1);

  ctx.font = "16px monospace";
  ctx.fillStyle = "#444466";
  ctx.fillText(`Tape  ${prefix}help <commande>  pour plus de details`, TX2, H - 28);
  ctx.textAlign = "right";
  ctx.fillText("• help v10.4", W - 20, H - 28);

  return canvas.toBuffer("image/png");
}

// Utilitaire roundRect compatible toutes versions canvas
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ═══════════════════════════════════════
//  TÉLÉCHARGER LA PHOTO DE PROFIL
// ═══════════════════════════════════════
async function downloadAvatar(senderID) {
  const url = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
    return Buffer.from(res.data); // retourne un Buffer directement
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════
//  MODULE PRINCIPAL
// ═══════════════════════════════════════
module.exports = {
  config: {
    name: "help",
    version: "10.4",
    author: "Ivdra Uchiwa",
    role: 0,
    category: "info"
  },

  onStart: async function ({ message, args, event, usersData }) {
    const prefix   = await getPrefix(event.threadID);
    const userName = (await usersData.getName(event.senderID)) || "User";
    const senderID = event.senderID;

    // ─────────── LISTE ───────────
    if (!args.length) {

      // Texte
      let msg =
`╔ ✓ ℂ𝕆𝕄𝕄𝔸ℕ𝔻 𝕃𝕀𝕊𝕋 ✓╗
║ 😉 hey ${toBold(userName)}, voici la liste des commandes dispo
╠═══════════════╝

`;

      // FIX RÉPÉTITION — clé normalisée unique
      const categories = {};
      for (const [name, value] of commands) {
        const rawCat = value.config?.category || "OTHER";
        const key    = normalizeCategory(rawCat);
        if (!categories[key]) {
          categories[key] = { displayName: cleanCategoryName(rawCat), cmds: new Set() };
        }
        categories[key].cmds.add(name);
      }

      Object.values(categories)
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .forEach(cat => {
          msg += `【 ${toBold(cat.displayName)} 】\n`;
          [...cat.cmds].sort((a, b) => a.localeCompare(b)).forEach(cmd => {
            msg += `➩ ${toBold(cmd)} 🌹\n`;
          });
          msg += "\n";
        });

      msg += `╚═══════════════╝\n`;
      msg += `✨ Total: ${commands.size} commandes\n`;
      msg += `📌 Use: ${prefix}help <commande>`;

      // Générer la carte image
      let imgBuffer = null;
      try {
        const avatarBuffer = await downloadAvatar(senderID);
        imgBuffer = await generateProfileCard({
          name:        userName,
          uid:         senderID,
          totalCmds:   commands.size,
          prefix,
          avatarBuffer // Buffer ou null
        });
      } catch (e) {
        console.error("[help] Erreur génération image:", e.message);
      }

      // ✅ Envoi texte + image en une seule fois
      if (imgBuffer) {
        // Sauvegarder dans tmp puis streamer
        const tmpDir  = path.join(__dirname, "../tmp");
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tmpPath = path.join(tmpDir, `help_${senderID}.png`);
        fs.writeFileSync(tmpPath, imgBuffer);

        try {
          await message.reply({
            body:       msg,
            attachment: fs.createReadStream(tmpPath)
          });
        } catch {
          try {
            await message.reply({
              body:       msg,
              attachment: [fs.createReadStream(tmpPath)]
            });
          } catch {
            await message.reply(msg);
          }
        } finally {
          setTimeout(() => { try { fs.unlinkSync(tmpPath); } catch {} }, 15000);
        }
      } else {
        await message.reply(msg);
      }

      return;
    }

    // ─────────── DÉTAIL COMMANDE ───────────
    const cmdName = args[0].toLowerCase();
    const cmd     = commands.get(cmdName) || commands.get(aliases.get(cmdName));

    if (!cmd)
      return message.reply(`❌ Commande "${cmdName}" introuvable.`);

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
};
