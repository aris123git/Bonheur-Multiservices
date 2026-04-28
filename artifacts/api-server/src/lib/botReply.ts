export interface IncomingMessage {
  from: string;
  body: string;
  profileName?: string;
  numMedia: number;
}

export function generateBotReply(message: IncomingMessage): string {
  const text = message.body.trim().toLowerCase();
  const name = message.profileName?.split(" ")[0] ?? "there";

  if (message.numMedia > 0 && !text) {
    return `Thanks for the media, ${name}! I can't process attachments yet, but feel free to send me a text command. Type *help* to see what I can do.`;
  }

  if (!text) {
    return `Hi ${name}! Type *help* to see available commands.`;
  }

  if (/^(hi|hello|hey|hola|yo)\b/.test(text)) {
    return `Hello ${name}! I'm a bot powered by Twilio. Type *help* to see what I can do.`;
  }

  if (text === "help" || text === "menu" || text === "/help") {
    return [
      "Here's what I can do:",
      "",
      "*help* — show this menu",
      "*time* — current server time",
      "*ping* — check if I'm alive",
      "*joke* — hear a random joke",
      "*about* — what is this bot?",
      "*echo <text>* — repeat your text back",
      "",
      "Send anything else and I'll do my best to respond.",
    ].join("\n");
  }

  if (text === "ping") {
    return "pong";
  }

  if (text === "time") {
    return `Server time: ${new Date().toISOString()}`;
  }

  if (text === "about") {
    return "I'm a WhatsApp bot built with Node.js, Express, and Twilio. Type *help* for commands.";
  }

  if (text === "joke") {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything.",
      "I told my computer I needed a break — it said 'No problem, I'll go to sleep.'",
      "Why did the developer go broke? Because he used up all his cache.",
      "There are 10 types of people in this world: those who understand binary and those who don't.",
      "Why do programmers prefer dark mode? Because light attracts bugs.",
    ];
    const pick = jokes[Math.floor(Math.random() * jokes.length)];
    return pick ?? jokes[0]!;
  }

  if (text.startsWith("echo ")) {
    return message.body.slice(5);
  }

  return `You said: "${message.body}"\n\nType *help* to see what I can do.`;
}
