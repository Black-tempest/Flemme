const fs = require("fs-extra");
const path = require("path");

const ROLES_PATH = path.join(process.cwd(), "database/json/roles_config.json");

function loadRoles() {
	try {
		if (!fs.existsSync(ROLES_PATH)) return {};
		return JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
	} catch {
		return {};
	}
}

function saveRoles(roles) {
	fs.ensureDirSync(path.dirname(ROLES_PATH));
	fs.writeFileSync(ROLES_PATH, JSON.stringify(roles, null, 2));
}

function applyRoles() {
	const roles = loadRoles();
	for (const [name, role] of Object.entries(roles)) {
		const cmd = global.GoatBot?.commands?.get(name);
		if (cmd) cmd.config.role = role;
	}
}

module.exports = {
	config: {
		name: "roles",
		version: "1.0",
		author: "Samy Guindo",
		role: 2,
		category: "admin",
		description: "Manage command role permissions"
	},

	onStart: async function ({ message, args }) {
		const { commands, aliases } = global.GoatBot;
		const sub = args[0]?.toLowerCase();

		if (!sub) {
			return message.reply(global.box([
				"🔐  ROLES MANAGEMENT  🔐",
				"---",
				"📌 Usage:",
				"⚙️  roles set <cmd> <0/1/2>",
				"🔄 roles reset <cmd>",
				"📋 roles list",
				"---",
				"🔹 0 = Everyone",
				"🔸 1 = Group Admin",
				"👑 2 = Bot Admin"
			]));
		}

		if (sub === "set") {
			if (!args[1] || !args[2])
				return message.reply(global.box([
					"⚠️  MISSING ARGUMENTS",
					"---",
					"Usage: roles set <command> <0/1/2>"
				]));

			const cmdName = args[1].toLowerCase();
			const role = parseInt(args[2]);
			if (![0, 1, 2].includes(role))
				return message.reply(global.box([
					"❌  INVALID ROLE",
					"---",
					"Must be 0 (everyone), 1 (group admin) or 2 (bot admin)."
				]));

			const command = commands.get(cmdName) || commands.get(aliases.get(cmdName));
			if (!command)
				return message.reply(global.box([
					"❓  COMMAND NOT FOUND",
					"---",
					`"${cmdName}" does not exist.`
				]));

			const roles = loadRoles();
			roles[cmdName] = role;
			saveRoles(roles);
			applyRoles();

			const roleLabel = role === 0 ? "Everyone" : role === 1 ? "Group Admin" : "Bot Admin";
			return message.reply(global.box([
				"✅  ROLE UPDATED",
				"---",
				`Command: ${cmdName}`,
				`New role: ${role} (${roleLabel})`
			]));
		}

		if (sub === "reset") {
			if (!args[1])
				return message.reply(global.box([
					"⚠️  MISSING ARGUMENTS",
					"---",
					"Usage: roles reset <command>"
				]));

			const cmdName = args[1].toLowerCase();
			const roles = loadRoles();
			if (!roles.hasOwnProperty(cmdName))
				return message.reply(global.box([
					"ℹ️  NO CUSTOM ROLE",
					"---",
					`"${cmdName}" already uses default role.`
				]));

			delete roles[cmdName];
			saveRoles(roles);
			applyRoles();

			return message.reply(global.box([
				"🔄  ROLE RESET",
				"---",
				`"${cmdName}" reset to default role.`
			]));
		}

		if (sub === "list") {
			const roles = loadRoles();
			const entries = Object.entries(roles);
			if (entries.length === 0)
				return message.reply(global.box([
					"📋  CUSTOM ROLES",
					"---",
					"No custom roles configured."
				]));

			let list = [];
			list.push("📋  CUSTOM ROLES");
			list.push("---");
			for (const [cmd, role] of entries) {
				const roleLabel = role === 0 ? "Everyone" : role === 1 ? "Group Admin" : "Bot Admin";
				list.push(`🔹 ${cmd}: ${role} (${roleLabel})`);
			}
			return message.reply(global.box(list));
		}

		return message.reply(global.box([
			"❌  UNKNOWN SUBCOMMAND",
			"---",
			"Use: set, reset, list"
		]));
	}
};
