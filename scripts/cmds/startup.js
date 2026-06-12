const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const GITHUB_USER = "Black-tempest";
const GITHUB_REPO = "Flemme";
const GITHUB_BRANCH = "main";
const CMDS_DIR = path.join(process.cwd(), "scripts/cmds");
const GITHUB_API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/scripts/cmds`;

async function getGithubFiles() {
  const res = await axios.get(GITHUB_API, {
    params: { ref: GITHUB_BRANCH }
  });
  return res.data.filter(f => f.name.endsWith(".js") && f.type === "file");
}

async function downloadFile(url) {
  const res = await axios.get(url, {
    headers: { Accept: "application/vnd.github.v3.raw" }
  });
  return res.data;
}

async function syncCmds() {
  const githubFiles = await getGithubFiles();
  const githubNames = new Set(githubFiles.map(f => f.name));
  const localFiles = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith(".js"));

  let deleted = [], updated = [], added = [];

  for (const local of localFiles) {
    if (!githubNames.has(local)) {
      fs.removeSync(path.join(CMDS_DIR, local));
      deleted.push(local);
    }
  }

  for (const ghFile of githubFiles) {
    const localPath = path.join(CMDS_DIR, ghFile.name);
    const content = await downloadFile(ghFile.download_url);
    const exists = fs.existsSync(localPath);
    fs.writeFileSync(localPath, typeof content === "string" ? content : JSON.stringify(content));
    if (exists) updated.push(ghFile.name);
    else added.push(ghFile.name);
  }

  return { deleted, updated, added };
}

async function reloadCommands() {
  const { commands, aliases } = global.GoatBot;
  commands.clear();
  aliases.clear();

  const files = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith(".js"));
  let loaded = 0, errors = [];

  for (const file of files) {
    try {
      const cmdPath = path.join(CMDS_DIR, file);
      delete require.cache[require.resolve(cmdPath)];
      const cmd = require(cmdPath);
      if (!cmd.config?.name) continue;
      commands.set(cmd.config.name, cmd);
      if (cmd.config.aliases)
        for (const alias of cmd.config.aliases)
          aliases.set(alias, cmd.config.name);
      if (typeof cmd.onLoad === "function")
        await cmd.onLoad({ GoatBot: global.GoatBot });
      loaded++;
    } catch (e) {
      errors.push(file);
    }
  }

  return { loaded, errors };
}

module.exports = {
  config: {
    name: "startup",
    aliases: ["sync", "resync"],
    version: "1.0",
    author: "Samy Gundo",
    countDown: 30,
    role: 2,
    shortDescription: { en: "🔄 Sync les cmds depuis GitHub" },
    longDescription: { en: "Supprime les cmds non présentes sur GitHub et recharge tout depuis le fork." },
    category: "owner",
    guide: { en: "{pn} | {pn} check | {pn} reload" }
  },

  async onStart({ message, args }) {
    const box = global.box;
    const cmd = args[0]?.toLowerCase();

    if (cmd === "check") {
      await message.reply(box([
        "  🔍  VÉRIFICATION  🔍",
        "---",
        "  Comparaison GitHub...",
      ]));

      try {
        const githubFiles = await getGithubFiles();
        const githubNames = new Set(githubFiles.map(f => f.name));
        const localFiles = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith(".js"));
        const localNames = new Set(localFiles);

        const onlyLocal = localFiles.filter(f => !githubNames.has(f));
        const onlyGithub = [...githubNames].filter(f => !localNames.has(f));

        return message.reply(box([
          "  🔍  RÉSULTAT CHECK  🔍",
          "---",
          `  📁 Local   : ${localFiles.length} cmds`,
          `  🌐 GitHub  : ${githubFiles.length} cmds`,
          "---",
          onlyLocal.length ? "  ⚠️ Seulement en local :" : "  ✅ Aucune cmd extra",
          ...onlyLocal.map(f => `    • ${f}`),
          "---",
          onlyGithub.length ? "  📥 Manquantes en local :" : "  ✅ Aucune cmd manquante",
          ...onlyGithub.map(f => `    • ${f}`),
          "---",
          "  startup — pour synchroniser",
        ]));
      } catch (err) {
        return message.reply(box([
          "  ❌  ERREUR CHECK  ❌",
          "---",
          `  ${err.message.slice(0, 40)}`,
        ]));
      }
    }

    if (cmd === "reload") {
      await message.reply(box([
        "  🔄  RELOAD CMDS  🔄",
        "---",
        "  Rechargement en cours...",
      ]));

      try {
        const { loaded, errors } = await reloadCommands();
        return message.reply(box([
          "  ✅  RELOAD TERMINÉ  ✅",
          "---",
          `  ✔️ ${loaded} cmds chargées`,
          errors.length ? `  ❌ ${errors.length} erreurs` : "  ✅ Aucune erreur",
          ...errors.map(e => `    • ${e}`),
        ]));
      } catch (err) {
        return message.reply(box([
          "  ❌  ERREUR RELOAD  ❌",
          "---",
          `  ${err.message.slice(0, 40)}`,
        ]));
      }
    }

    await message.reply(box([
      "  🔄  STARTUP SYNC  🔄",
      "---",
      "  Sync depuis GitHub...",
      "  Patiente quelques secondes",
    ]));

    try {
      const { deleted, updated, added } = await syncCmds();

      await message.reply(box([
        "  📥  SYNC TERMINÉE  📥",
        "---",
        `  ✅ Ajoutées     : ${added.length}`,
        `  🔁 Mises à jour : ${updated.length}`,
        `  🗑️ Supprimées   : ${deleted.length}`,
        "---",
        "  🔄 Rechargement...",
      ]));

      const { loaded, errors } = await reloadCommands();

      return message.reply(box([
        "  ✅  STARTUP COMPLET  ✅",
        "---",
        `  📦 ${loaded} cmds actives`,
        errors.length ? `  ❌ ${errors.length} erreurs` : "  ✅ Aucune erreur",
        ...errors.slice(0, 5).map(e => `    • ${e}`),
        "---",
        "  Bot synchro avec GitHub ! 🎉",
      ]));
    } catch (err) {
      return message.reply(box([
        "  ❌  ERREUR SYNC  ❌",
        "---",
        `  ${err.message.slice(0, 40)}`,
        "---",
        "  Vérifie GITHUB_USER et REPO",
      ]));
    }
  }
};
