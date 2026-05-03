// ================= LIST =================
if (!args.length) {

  let msg =
`╔ ✓ ℂ𝕆𝕄𝕄𝔸ℕ𝔻 𝕃𝕀𝕊𝕋 ✓╗
║ 😉 hey ${toBold(userName)}, voici la liste des commandes dispo
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

  // ✅ PHOTO DE PROFIL EN BAS
  const axios = require("axios");

  try {
    const avatarUrl = `https://graph.facebook.com/${event.senderID}/picture?width=512&height=512`;

    const res = await axios.get(avatarUrl, {
      responseType: "stream"
    });

    return message.reply({
      body: msg,
      attachment: res.data
    });

  } catch (e) {
    return message.reply(msg);
  }
        }
