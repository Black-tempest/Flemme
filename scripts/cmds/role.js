const fs = require("fs");
const path = require("path");

const ROLES_PATH = path.join(process.cwd(), "database/json/roles_config.json");

function loadRoles() {
	try {
		if (!fs.existsSync(ROLES_PATH)) return {};
		return JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
	} catch { return {}; }
}

function saveRoles(data) {
	try {
		const dir = path.dirname(ROLES_PATH);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(ROLES_PATH, JSON.stringify(data, null, 2));
	} catch (e) { console.error("role save error:", e); }
}

const ROLES = {
	0: "👥 Tout le monde",
	1: "🛡️ Admin groupe",
	2: "👑 Admin bot",
};

module.exports = {
	config: {
		name: "role",
		aliases: ["setrole", "cmdrole"],
		version: "2.0",
		author: "GoatBot Custom",
		countDown: 3,
		role: 2,
		shortDescription: { en: "🔐 Change le rôle d'une commande" },
		longDescription: { en: "Change et sauvegarde le rôle requis pour utiliser une commande." },
		category: "owner",
		guide: { en: "{pn} <cmd> <0|1|2>\nEx: {pn} slot 0" }
	},

	onLoad() {
		const saved = loadRoles();
		for (const [name, role] of Object.entries(saved)) {
			const cmd = global.GoatBot?.commands?.get(name);
			if (cmd) cmd.config.role = role;
		}
	},

	async onStart({ message, args }) {
		const box = global.box;
		const cmdName = args[0]?.toLowerCase();
		const roleNum = parseInt(args[1]);

		if (!cmdName || isNaN(roleNum)) {
			return message.reply(box([
				"  🔐  GESTION DES RÔLES  🔐",
				"---",
				"  UTILISATION",
				"  role <cmd> <niveau>",
				"---",
				"  NIVEAUX",
				"  0 › 👥 Tout le monde",
				"  1 › 🛡️ Admin groupe",
				"  2 › 👑 Admin bot",
				"---",
				"  EXEMPLES",
				"  role slot 0",
				"  role daily 1",
				"  role ban 2",
			]));
		}

		if (![0, 1, 2].includes(roleNum)) {
			return message.reply(box([
				"  ❌  NIVEAU INVALIDE  ❌",
				"---",
				"  Utilise 0, 1 ou 2",
				"  0 › 👥 Tout le monde",
				"  1 › 🛡️ Admin groupe",
				"  2 › 👑 Admin bot",
			]));
		}

		const cmd = global.GoatBot?.commands?.get(cmdName)
			|| (() => {
				const entry = [...(global.GoatBot?.commands?.entries() || [])]
					.find(([, v]) => v.config?.aliases?.includes(cmdName));
				return entry ? global.GoatBot.commands.get(entry[0]) : null;
			})();

		if (!cmd) {
			return message.reply(box([
				"  ❌  CMD INTROUVABLE  ❌",
				"---",
				`  « ${cmdName} » inconnue`,
				"  Vérifie le nom de la cmd",
			]));
		}

		const realName = cmd.config.name;
		const oldRole = cmd.config.role ?? 0;
		cmd.config.role = roleNum;

		const saved = loadRoles();
		saved[realName] = roleNum;
		saveRoles(saved);

		return message.reply(box([
			"  ✅  RÔLE MODIFIÉ  ✅",
			"---",
			`  Cmd : ${realName}`,
			"---",
			`  Avant : ${ROLES[oldRole]}`,
			`  Après : ${ROLES[roleNum]}`,
			"---",
			"  💾 Sauvegardé !",
			"  Persiste après restart",
		]));
	}
};

