const fs = require("fs-extra");
const { utils } = global;
const axios = require("axios");
const fsN = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ═══════════════════════════════════════════════════════
//  SCRIPT PYTHON — CARTE ORBITALE
//  Génère une image "système solaire" avec :
//   • Soleil rouge  = préfixe système (centre)
//   • Planètes colorées orbitant autour = infos du bot
// ═══════════════════════════════════════════════════════
function buildPythonScript(sysPrefix, threadPrefix, userName, creator, fbLink) {
  // On échappe les apostrophes pour éviter de casser le shell
  const esc = s => String(s).replace(/'/g, "\\'").slice(0, 18);
  return `
import sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 900, 900
FONT = '/data/data/com.termux/files/usr/share/fonts/truetype'
import os

def find_font(bold=False, mono=False):
    candidates = []
    if mono:
        candidates = ['LiberationMono-Bold','DejaVuSansMono-Bold','FreeMono']
    elif bold:
        candidates = ['LiberationSans-Bold','DejaVuSans-Bold','FreeSansBold']
    else:
        candidates = ['LiberationSans-Regular','DejaVuSans','FreeSans']
    dirs = [
        '/data/data/com.termux/files/usr/share/fonts',
        '/usr/share/fonts/truetype/liberation',
        '/usr/share/fonts/truetype/dejavu',
        '/usr/share/fonts/truetype/freefont',
        '/system/fonts',
    ]
    for d in dirs:
        if not os.path.isdir(d): continue
        for root,_,files in os.walk(d):
            for f in files:
                for c in candidates:
                    if c.lower() in f.lower() and f.endswith('.ttf'):
                        return os.path.join(root, f)
    return None

fp_b = find_font(bold=True)
fp_r = find_font(bold=False)
fp_m = find_font(mono=True)

def fb(s):
    try: return ImageFont.truetype(fp_b, s)
    except: return ImageFont.load_default()
def fr(s):
    try: return ImageFont.truetype(fp_r, s)
    except: return ImageFont.load_default()
def fm(s):
    try: return ImageFont.truetype(fp_m or fp_b, s)
    except: return ImageFont.load_default()

SYS_PREFIX    = '${esc(sysPrefix)}'
THREAD_PREFIX = '${esc(threadPrefix)}'
USER_NAME     = '${esc(userName)}'
CREATOR       = '${esc(creator)}'
FB_LINK       = '${esc(fbLink)}'
OUT_PATH      = sys.argv[1]

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

cx, cy = W//2, H//2 + 10
img = Image.new('RGB',(W,H),'#06061a')
draw = ImageDraw.Draw(img)

# Grid
for x in range(0,W,45): draw.line([(x,0),(x,H)],fill=(18,18,38))
for y in range(0,H,45): draw.line([(0,y),(W,y)],fill=(18,18,38))

# Orbites
for r,col,a in [(145,'#ff4444',28),(255,'#00ff9d',22),(360,'#7b61ff',16)]:
    rgb = hex2rgb(col)
    ring = Image.new('RGBA',(W,H),(0,0,0,0))
    ImageDraw.Draw(ring).ellipse([cx-r,cy-r,cx+r,cy+r], outline=rgb+(a,), width=2)
    img = Image.alpha_composite(img.convert('RGBA'),ring).convert('RGB')
draw = ImageDraw.Draw(img)

# SOLEIL — glow rouge
SUN_R = 88
glow = Image.new('RGBA',(W,H),(0,0,0,0))
gd = ImageDraw.Draw(glow)
for i in range(80,0,-3):
    a = int(130*(i/80)**2.4)
    gd.ellipse([cx-SUN_R-i,cy-SUN_R-i,cx+SUN_R+i,cy+SUN_R+i],fill=(255,40,40,min(a,255)))
glow = glow.filter(ImageFilter.GaussianBlur(24))
img = Image.alpha_composite(img.convert('RGBA'),glow).convert('RGB')
draw = ImageDraw.Draw(img)

draw.ellipse([cx-SUN_R,cy-SUN_R,cx+SUN_R,cy+SUN_R], fill='#aa0e0e', outline='#ff5555', width=4)
draw.ellipse([cx-SUN_R+8,cy-SUN_R+8,cx+SUN_R-8,cy+SUN_R-8], outline=(255,100,100,50), width=1)
draw.text((cx,cy-22),'SYSTEM', font=fb(16), fill='#ffcccc', anchor='mm')
draw.text((cx,cy+2), 'PREFIX', font=fr(12), fill='#ff9999', anchor='mm')
draw.text((cx,cy+22),SYS_PREFIX, font=fb(24), fill='#ffffff', anchor='mm')

# PLANETES
planets = [
    ( 45, 145, 55, '#0a2218','#00ff9d','THREAD', THREAD_PREFIX),
    (225, 145, 55, '#180a22','#cc44ff','USER',   USER_NAME),
    (315, 255, 50, '#221a08','#ffd60a','BOT',    'GoatBot'),
    (135, 255, 48, '#08181f','#00b4d8','CMD',    SYS_PREFIX+'help'),
    ( 20, 360, 44, '#1a0822','#ff3cac','CREATOR',CREATOR),
    (200, 360, 44, '#0a1822','#4cc9f0','LINK',   FB_LINK),
]

# Glows d'abord
for ang,orb_r,pr,fill,outline,label,val in planets:
    rad = math.radians(ang)
    px = int(cx + orb_r*math.cos(rad))
    py = int(cy + orb_r*math.sin(rad))
    rgb = hex2rgb(outline)
    pg = Image.new('RGBA',(W,H),(0,0,0,0))
    pgd = ImageDraw.Draw(pg)
    for i in range(28,0,-3):
        a = int(90*(i/28)**2.2)
        pgd.ellipse([px-pr-i,py-pr-i,px+pr+i,py+pr+i],fill=rgb+(min(a,255),))
    pg = pg.filter(ImageFilter.GaussianBlur(9))
    img = Image.alpha_composite(img.convert('RGBA'),pg).convert('RGB')

draw = ImageDraw.Draw(img)

# Corps + texte
for ang,orb_r,pr,fill,outline,label,val in planets:
    rad = math.radians(ang)
    px = int(cx + orb_r*math.cos(rad))
    py = int(cy + orb_r*math.sin(rad))
    rgb = hex2rgb(outline)
    # Ligne de connexion
    sx = int(cx + SUN_R*math.cos(rad))
    sy = int(cy + SUN_R*math.sin(rad))
    ex = int(px - pr*math.cos(rad))
    ey = int(py - pr*math.sin(rad))
    draw.line([(sx,sy),(ex,ey)], fill=rgb+(25,), width=1)
    # Corps planète
    draw.ellipse([px-pr,py-pr,px+pr,py+pr], fill=fill, outline=outline, width=3)
    # Texte
    draw.text((px,py-9), label, font=fb(13), fill=outline, anchor='mm')
    draw.text((px,py+9), val,   font=fm(12), fill='#ffffff', anchor='mm')

# Coins
def bracket(x,y,dx,dy,col):
    draw.line([(x,y),(x+dx*28,y)],fill=col,width=3)
    draw.line([(x,y),(x,y+dy*28)],fill=col,width=3)
bracket(18,18,1,1,'#00ff9d'); bracket(W-18,18,-1,1,'#7b61ff')
bracket(18,H-18,1,-1,'#00ff9d'); bracket(W-18,H-18,-1,-1,'#7b61ff')

# Titre
draw.text((cx,30),'PREFIX  SYSTEM',font=fb(24),fill='#ffffff',anchor='mm')
draw.text((cx,56),'· système orbital ·',font=fr(14),fill='#444488',anchor='mm')

# Barre bas
draw.rectangle([0,H-46,W,H],fill=(4,4,18))
draw.line([(0,H-46),(W,H-46)],fill='#1a1a3a',width=1)
draw.text((cx,H-24),f'Tape "{SYS_PREFIX}help" pour voir les commandes  •  GoatBot',
          font=fr(15),fill='#3a3a66',anchor='mm')

img.save(OUT_PATH,'PNG')
print('done')
`;
}

// ═══════════════════════════════════════════════════════
//  GÉNÉRATION IMAGE
// ═══════════════════════════════════════════════════════
async function generateOrbitalCard({ sysPrefix, threadPrefix, userName, creator, fbLink, uid, tmpDir }) {
  const outPath = path.join(tmpDir, `prefix_card_${uid}.png`);
  const pyPath  = path.join(tmpDir, "gen_prefix.py");

  fsN.writeFileSync(pyPath, buildPythonScript(sysPrefix, threadPrefix, userName, creator, fbLink));

  try {
    execSync(`python3 "${pyPath}" "${outPath}"`, { timeout: 20000 });
    return fsN.existsSync(outPath) ? outPath : null;
  } catch (e) {
    console.error("[prefix] Erreur image:", e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
//  ENVOI IMAGE + TEXTE
// ═══════════════════════════════════════════════════════
async function sendWithImage(message, event, body, imgPath) {
  if (!imgPath || !fsN.existsSync(imgPath)) {
    return message.reply(body);
  }
  const stream = () => fsN.createReadStream(imgPath);
  // Méthode 1
  try { return await message.reply({ body, attachment: stream() }); } catch {}
  // Méthode 2
  try { return await message.reply({ body, attachment: [stream()] }); } catch {}
  // Méthode 3
  try {
    await new Promise((res, rej) => {
      const api = message.api || global.client?.api;
      if (!api) return rej();
      api.sendMessage({ body, attachment: stream() }, event.threadID, e => e ? rej(e) : res());
    });
    return;
  } catch {}
  // Fallback texte
  return message.reply(body);
}

// ═══════════════════════════════════════════════════════
//  MODULE
// ═══════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "prefix",
    version: "1.5",
    author: "Ivdra Uchiwa",
    countDown: 5,
    role: 0,
    description: "Change bot prefix",
    category: "config",
    guide: {
      en:
        "   {pn} <new prefix>: change prefix\n" +
        "   Example:\n" +
        "    {pn} #\n\n" +
        "   {pn} <new prefix> -g: system (admin)\n" +
        "   Example:\n" +
        "    {pn} # -g\n\n" +
        "   {pn} reset: reset prefix"
    }
  },

  langs: {
    en: {
      reset:           "Your prefix has been reset: %1",
      onlyAdmin:       "Only admin can change system prefix",
      confirmGlobal:   "React to confirm",
      confirmThisThread:"React to confirm",
      successGlobal:   "System prefix changed to: %1",
      successThisThread:"Group prefix changed to: %1"
    }
  },

  // ── /prefix <new> ──────────────────────────────────
  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet = { commandName, author: event.senderID, newPrefix };

    if (args[1] === "-g") {
      if (role < 2) return message.reply(getLang("onlyAdmin"));
      formSet.setGlobal = true;
    } else {
      formSet.setGlobal = false;
    }

    return message.reply(
      args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"),
      (err, info) => {
        formSet.messageID = info.messageID;
        global.GoatBot.onReaction.set(info.messageID, formSet);
      }
    );
  },

  // ── Réaction de confirmation ──────────────────────
  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  // ── Taper "prefix" sans commande → carte orbitale ─
  onChat: async function ({ event, message, usersData }) {
    if (!event.body || event.body.toLowerCase() !== "prefix") return;

    const senderID    = event.senderID;
    const userName    = await usersData.getName(senderID) || "User";
    const sysPrefix   = global.GoatBot.config.prefix || "•";
    const threadPrefix = utils.getPrefix(event.threadID) || sysPrefix;

    const creator = "Ivdra Uchiwa";
    const fbLink  = "fb.me/kakashi.cmr";

    // Texte de secours (envoyé si image échoue)
    const msg =
`╭══════════════╮
 ┃
 ┃ 💠 Current prefix : ${threadPrefix}
 ┃ 🗝️ System prefix  : ${sysPrefix}
 ┃ 😊 ${userName}
 ┃ 📌 ${threadPrefix}help pour voir les cmds
 ┃ 👑 Creator: ${creator}
 ┃ 🔗 ${fbLink}
 ┃
 ╰══════════════╯`;

    // Générer la carte
    const tmpDir = path.join(__dirname, "../tmp");
    if (!fsN.existsSync(tmpDir)) fsN.mkdirSync(tmpDir, { recursive: true });

    const imgPath = await generateOrbitalCard({
      sysPrefix, threadPrefix, userName,
      creator, fbLink,
      uid: senderID, tmpDir
    });

    await sendWithImage(message, event, msg, imgPath);

    // Nettoyage
    setTimeout(() => { try { if (imgPath) fsN.unlinkSync(imgPath); } catch {} }, 15000);
  }
};
