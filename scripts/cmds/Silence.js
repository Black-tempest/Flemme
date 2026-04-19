const { config } = global.GoatBot;

module.exports = {
	config: {
		name: "silence",
		version: "1.0",
		author: "Ivdra Uchiwa",
		countDown: 5,
		role: 2,
		longDescription: {
			en: "Activer le mode silence du bot"
		},
		category: "𝗔𝗗𝗠𝗜𝗡",
		guide: {
			en: '   {pn} on: Activer le silence'
				+ '\n   {pn} off: Désactiver le silence'
		}
	},

	langs: {
		en: {
			added: "✅ | Ajout effectué:\n%2",
			alreadyAdmin: "\n⚠ | Déjà présent:\n%2",
			missingIdAdd: "⚠ | Donne un ID ou tag",
			removed: "✅ | Retiré:\n%2",
			notAdmin: "⚠ | Non trouvé:\n%2",
			missingIdRemove: "⚠ | Donne un ID à retirer",
			listAdmin: "👑 | Liste:\n%1",
			enable: "silence_on",
			disable: "silence_off"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang }) {
		const { writeFileSync } = require("fs-extra");

		// 🔒 INIT (système wl interne conservé)
		if (!config.whiteListMode)
			config.whiteListMode = {};

		if (!config.whiteListMode.whiteListIds)
			config.whiteListMode.whiteListIds = [];

		if (typeof config.whiteListMode.enable === "undefined")
			config.whiteListMode.enable = false;

		switch (args[0]) {

			case "on": {
				config.whiteListMode.enable = true;

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				const name = await usersData.getName(event.senderID);

				return message.reply(
					`Je m'incline, maître ${name}, et cesserai de répondre, comme le king l'a ordonné.`
				);
			}

			case "off": {
				config.whiteListMode.enable = false;

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				const name = await usersData.getName(event.senderID);

				return message.reply(
					`Je suis honoré, ${name}, que vous m'ayez permis d'écrire.`
				);
			}

			default:
				return message.reply("Utilisation : silence on / off");
		}
	}
};
