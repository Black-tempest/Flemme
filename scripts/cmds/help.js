const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

// ✅ BOLD
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

// ✅ NORMALISATION
function normalizeCategory(cat) {
  if (!cat) return "other";

  return cat
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ✅ NOM PROPRE
function cleanCategoryName(cat) {
  if (!cat) return "OTHER";
  return cat.toUpperCase();
}

module.exports = {
  config: {
    name: "help",
    version: "10.1",
    author: "Ivdra Uchiwa",
    role: 0,
    category: "info"
  },

  onStart: async function ({ message, args, event, usersData }) {
    const prefix = await getPrefix(event.threadID);

    // ✅ NOM UTILISATEUR
    const userName = await usersData.getName(event.senderID) || "User";

    // ================= LIST =================
    if (!args.length) {

      let msg =
`╔ ✓ ℂ𝕆𝕄𝕄𝔸ℕ𝔻 𝕃𝕀𝕊𝕋 ✓╗
║ 😉 hey ${toBold(userName)}, voici la liste de commandes dispo
╠═══════════════╝

`;

      const categories = {};

      for (const [name, value] of commands) {

        const rawCategory = value.config.category || "OTHER";
        const key = normalizeCategory(rawCategory);

        if (!categories[key]) {
          categories[key] = {
            name: cleanCategoryName(rawCategory),
            cmds: new Set()
          };
        }

        categories[key].cmds.add(name);
      }

      // 🔥 TRI CATÉGORIES
      const sortedCategories = Object.values(categories).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      for (const cat of sortedCategories) {

        msg += `【 ${toBold(cat.name)} 】\n`;

        const sortedCmds = [...cat.cmds].sort((a, b) =>
          a.localeCompare(b)
        );

        for (const cmd of sortedCmds) {
          msg += `➩ ${toBold(cmd)} 🌹\n`;
        }

        msg += "\n";
      }

      msg += `╚═══════════════╝\n`;
      msg += `✨ Total: ${commands.size}\n`;
      msg += `📌 Use: ${prefix}help <command>`;

      return message.reply(msg);
    }

    // ================= DETAIL =================
    const name = args[0].toLowerCase();
    const cmd = commands.get(name) || commands.get(aliases.get(name));

    if (!cmd)
      return message.reply(`❌ Command "${name}" not found`);

    const cfg = cmd.config;

    return message.reply(
`╔『 📌ℂ𝕆𝕄𝕄𝔸𝔻 𝕀ℕ𝔽𝕆』╗

➩ Name: ${toBold(cfg.name)}
➩ Description: ${cfg.longDescription?.en || "No description"}
➩ Aliases: ${cfg.aliases?.join(", ") || "None"}
➩ Version: ${cfg.version || "1.0"}
➩ Role: ${roleText(cfg.role)}
➩ Cooldown: ${cfg.countDown || 2}s
➩ Author: ${cfg.author || "Unknown"}

📖 Usage:
${toBold((cfg.guide?.en || "No guide")
  .replace(/{pn}/g, prefix)
  .replace(/{n}/g, cfg.name))}

╚═══════════════╝`
    );
  }
};

// ✅ ROLE
function roleText(role) {
  if (role == 0) return "All users";
  if (role == 1) return "Group admin";
  if (role == 2) return "Bot admin";
  return "Unknown";
  }
