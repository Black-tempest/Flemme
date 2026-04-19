module.exports = {
  config: {
    name: "greet",
    version: "1.3",
    author: "Ivdra Uchiwa",
    role: 0,
    description: "Répond aux salutations de façon naturelle",
  },

  onStart: async () => {},

  onChat: async ({ event, message, usersData }) => {
    const text = event.body?.toLowerCase();
    if (!text) return;

    const greetings = ["salut", "slt", "bonjour", "bonsoir", "hello", "hi", "yo"];

    const isGreeting = greetings.some(word => text.startsWith(word));
    if (!isGreeting) return;

    let name = "toi";

    try {
      const userData = await usersData.get(event.senderID);
      if (userData?.name) name = userData.name;
    } catch (e) {}

    const replies = [
      `Yo ${name} 👋`,
      `Hey ${name}, ça roule ?`,
      `Salut ${name} 😄 tranquille ?`,
      `Wesh ${name} 🔥`,
      `Hello ${name}, quoi de beau ?`,
      `Yo yo ${name} 😎`,
      `Hey ${name}, bien ou quoi ?`,
      `Salut ${name} 👀`
    ];

    const reply = replies[Math.floor(Math.random() * replies.length)];

    return message.reply(reply);
  }
};
