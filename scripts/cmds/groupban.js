const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "groupban",
        aliases: ["gban", "adminban"],
        version: "1.0.0",
        author: "Aryan Chauhan",
        countDown: 5,
        role: 1,
        description: {
            vi: "Cấm thành viên sử dụng bot trong nhóm này",
            en: "Ban member from using bot in this group"
        },
        category: "box chat",
        guide: {
            vi: "   {pn} [@tag|uid|link fb|reply] [<lý do cấm>]: Cấm thành viên sử dụng bot trong nhóm\n   {pn} unban [@tag|uid|link fb|reply]: Bỏ cấm thành viên\n   {pn} list: Xem danh sách thành viên bị cấm\n   {pn} check: Kiểm tra trạng thái cấm của thành viên",
            en: "   {pn} [@tag|uid|fb link|reply] [<reason>]: Ban member from using bot in group\n   {pn} unban [@tag|uid|fb link|reply]: Unban member\n   {pn} list: View list of banned members\n   {pn} check: Check ban status of member"
        }
    },

    langs: {
        vi: {
            notFoundTarget: "⚠️ | Vui lòng tag người cần cấm hoặc nhập uid hoặc link fb hoặc phản hồi tin nhắn của người cần cấm",
            notFoundTargetUnban: "⚠️ | Vui lòng tag người cần bỏ cấm hoặc nhập uid hoặc link fb hoặc phản hồi tin nhắn của người cần bỏ cấm",
            userNotBanned: "⚠️ | Người mang id %1 không bị cấm sử dụng bot trong nhóm này",
            unbannedSuccess: "✅ | Đã bỏ cấm %1 sử dụng bot trong nhóm!",
            cantSelfBan: "⚠️ | Bạn không thể tự cấm chính mình!",
            cantBanAdmin: "❌ | Bạn không thể cấm quản trị viên nhóm!",
            cantBanBotAdmin: "❌ | Bạn không thể cấm quản trị viên bot!",
            existedBan: "❌ | Người này đã bị cấm sử dụng bot trong nhóm từ trước!",
            noReason: "Không có lý do",
            bannedSuccess: "✅ | Đã cấm %1 sử dụng bot trong nhóm!",
            noName: "Người dùng facebook",
            noData: "📑 | Không có thành viên nào bị cấm sử dụng bot trong nhóm này",
            listBanned: "📑 | Danh sách thành viên bị cấm sử dụng bot trong nhóm (trang %1/%2)",
            content: "%1/ %2 (%3)\nLý do: %4\nThời gian cấm: %5\nBởi admin: %6\n\n",
            checkBanned: "⚠️ | %1 đã bị cấm sử dụng bot trong nhóm này!\nUID: %2\nLý do: %3\nThời gian cấm: %4\nBởi admin: %5",
            checkNotBanned: "✅ | %1 không bị cấm sử dụng bot trong nhóm này",
            onlyInGroup: "❌ | Lệnh này chỉ có thể sử dụng trong nhóm!"
        },
        en: {
            notFoundTarget: "⚠️ | Please tag the person to ban or enter uid or fb link or reply to the message of the person to ban",
            notFoundTargetUnban: "⚠️ | Please tag the person to unban or enter uid or fb link or reply to the message of the person to unban",
            userNotBanned: "⚠️ | The person with id %1 is not banned from using bot in this group",
            unbannedSuccess: "✅ | Unbanned %1 from using bot in this group!",
            cantSelfBan: "⚠️ | You can't ban yourself!",
            cantBanAdmin: "❌ | You can't ban group administrators!",
            cantBanBotAdmin: "❌ | You can't ban bot administrators!",
            existedBan: "❌ | This person has been banned from using bot in this group before!",
            noReason: "No reason",
            bannedSuccess: "✅ | Banned %1 from using bot in this group!",
            noName: "Facebook user",
            noData: "📑 | There are no members banned from using bot in this group",
            listBanned: "📑 | List of members banned from using bot in this group (page %1/%2)",
            content: "%1/ %2 (%3)\nReason: %4\nBan time: %5\nBy admin: %6\n\n",
            checkBanned: "⚠️ | %1 has been banned from using bot in this group!\nUID: %2\nReason: %3\nBan time: %4\nBy admin: %5",
            checkNotBanned: "✅ | %1 is not banned from using bot in this group",
            onlyInGroup: "❌ | This command can only be used in groups!"
        }
    },

    onStart: async function ({ message, event, args, threadsData, getLang, usersData, api }) {
        const { members, adminIDs, threadID } = await threadsData.get(event.threadID);
        const { senderID } = event;

        if (!event.isGroup) {
            return message.reply(getLang('onlyInGroup'));
        }

        if (!adminIDs.includes(senderID)) {
            return message.reply("❌ | Only group administrators can use this command!");
        }

        let target;
        let reason;

        const dataGroupBanned = await threadsData.get(event.threadID, 'data.groupBanned', []);

        if (args[0] == 'unban') {
            if (!isNaN(args[1]))
                target = args[1];
            else if (args[1]?.startsWith('https'))
                target = await findUid(args[1]);
            else if (Object.keys(event.mentions || {}).length)
                target = Object.keys(event.mentions)[0];
            else if (event.messageReply?.senderID)
                target = event.messageReply.senderID;
            else
                return api.sendMessage(getLang('notFoundTargetUnban'), event.threadID, event.messageID);

            const index = dataGroupBanned.findIndex(item => item.id == target);
            if (index == -1)
                return api.sendMessage(getLang('userNotBanned', target), event.threadID, event.messageID);

            dataGroupBanned.splice(index, 1);
            await threadsData.set(event.threadID, dataGroupBanned, 'data.groupBanned');
            const userName = members[target]?.name || await usersData.getName(target) || getLang('noName');

            return api.sendMessage(getLang('unbannedSuccess', userName), event.threadID, event.messageID);
        }
        else if (args[0] == "check") {
            let checkTarget;
            if (!isNaN(args[1]))
                checkTarget = args[1];
            else if (args[1]?.startsWith('https'))
                checkTarget = await findUid(args[1]);
            else if (Object.keys(event.mentions || {}).length)
                checkTarget = Object.keys(event.mentions)[0];
            else if (event.messageReply?.senderID)
                checkTarget = event.messageReply.senderID;
            else
                return api.sendMessage(getLang('notFoundTarget'), event.threadID, event.messageID);

            const banned = dataGroupBanned.find(item => item.id == checkTarget);
            const userName = members[checkTarget]?.name || await usersData.getName(checkTarget) || getLang('noName');
            const adminName = members[banned?.adminID]?.name || await usersData.getName(banned?.adminID) || getLang('noName');

            if (banned) {
                return api.sendMessage(getLang('checkBanned', userName, checkTarget, banned.reason, banned.time, adminName), event.threadID, event.messageID);
            } else {
                return api.sendMessage(getLang('checkNotBanned', userName), event.threadID, event.messageID);
            }
        }

        if (event.messageReply?.senderID) {
            target = event.messageReply.senderID;
            reason = args.join(' ');
        }
        else if (Object.keys(event.mentions || {}).length) {
            target = Object.keys(event.mentions)[0];
            reason = args.join(' ').replace(event.mentions[target], '');
        }
        else if (!isNaN(args[0])) {
            target = args[0];
            reason = args.slice(1).join(' ');
        }
        else if (args[0]?.startsWith('https')) {
            target = await findUid(args[0]);
            reason = args.slice(1).join(' ');
        }
        else if (args[0] == 'list') {
            if (!dataGroupBanned.length)
                return message.reply(getLang('noData'));
            const limit = 20;
            const page = parseInt(args[1] || 1) || 1;
            const start = (page - 1) * limit;
            const end = page * limit;
            const data = dataGroupBanned.slice(start, end);
            let msg = '';
            let count = 0;
            for (const user of data) {
                count++;
                const name = members[user.id]?.name || await usersData.getName(user.id) || getLang('noName');
                const adminName = members[user.adminID]?.name || await usersData.getName(user.adminID) || getLang('noName');
                const time = user.time;
                msg += getLang('content', start + count, name, user.id, user.reason, time, adminName);
            }
            return message.reply(getLang('listBanned', page, Math.ceil(dataGroupBanned.length / limit)) + '\n\n' + msg);
        }

        if (!target)
            return message.reply(getLang('notFoundTarget'));
        if (target == senderID)
            return message.reply(getLang('cantSelfBan'));
        if (adminIDs.includes(target))
            return message.reply(getLang('cantBanAdmin'));

        const botAdmins = global.GoatBot.config.adminBot || [];
        if (botAdmins.includes(target))
            return message.reply(getLang('cantBanBotAdmin'));

        const banned = dataGroupBanned.find(item => item.id == target);
        if (banned)
            return message.reply(getLang('existedBan'));

        const name = members[target]?.name || (await usersData.getName(target)) || getLang('noName');
        const time = moment().tz(global.GoatBot.config.timeZone).format('HH:mm:ss DD/MM/YYYY');
        const data = {
            id: target,
            time,
            reason: reason || getLang('noReason'),
            adminID: senderID
        };

        dataGroupBanned.push(data);
        await threadsData.set(event.threadID, dataGroupBanned, 'data.groupBanned');
        message.reply(getLang('bannedSuccess', name));
    }
};
