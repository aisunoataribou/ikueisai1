// ===== 属性 =====
const ALL_TYPES = [
  "斬撃","打撃","銃撃",
  "火炎","氷結","電撃","疾風",
  "核熱","念動",
  "地震","流水",
  "黄金","猛毒",
  "光","闇",
  "万能"
]

// ===== スキル→属性 =====
function spellToType(name){
  const map = {

    // ★攻撃
    "斬りつけ":"斬撃",
    "正拳突き":"打撃",
    "ピストル":"銃撃",

    // 魔法
    "ファイヤー":"火炎",
    "アイス":"氷結",
    "サンダー":"電撃",
    "ウィンド":"疾風",
    "ヌーク":"核熱",
    "サイ":"念動",
    "クエイク":"地震",
    "ウォーター":"流水",
    "ゴールド":"黄金",
    "バイオ":"猛毒",
    "ハマ":"光",
    "ムド":"闇",
    "メギド":"万能"
  }

  return map[name] || (NEW_SKILLS[name] && NEW_SKILLS[name].label) || "斬撃"

}

// ===== MPコスト =====
const SPELL_COST = {
  "ファイヤー":5,"アイス":5,"サンダー":5,"ウィンド":5,
  "ヌーク":5,"サイ":5,
  "クエイク":5,"ウォーター":5,
  "ゴールド":5,"バイオ":5,
  "ハマ":5,"ムド":5,
  "メギド":10
}

// ===== NEW SKILL（レベルアップで覚える技）=====
// kind: spell(魔法) / attack(攻撃) ・ target: one / all / self
const NEW_SKILLS = {
  "ヒール":        { kind:"spell",  cost:20, label:"回復", target:"self", desc:"自分のHPを100回復" },
  "乱れ斬り":      { kind:"attack", label:"斬撃", target:"all", desc:"相手全体に斬撃（斬りつけの1/2）" },
  "スピニングキック":{ kind:"attack", label:"打撃", target:"all", desc:"相手全体に打撃（正拳突きの1/2）" },
  "マシンガン":    { kind:"attack", label:"銃撃", target:"all", desc:"相手全体に銃撃（ピストルの1/2）" },
  "メギドラ":      { kind:"spell",  cost:50, label:"万能", target:"all", desc:"相手全体に万能（メギドの3/2）" },
  "エスケープ":    { kind:"spell",  cost:60, label:"逃走", target:"self", desc:"確定で逃走できる" },
  "サーチ":        { kind:"spell",  cost:15, label:"解析", target:"one", desc:"相手1体の弱点を表示し続ける" },
  "チェーンソー":  { kind:"attack", label:"斬撃", target:"one", desc:"斬撃（斬りつけの1/4）＋1/2で即死" },
  "チャージパンチ":{ kind:"attack", label:"打撃", target:"one", mpGain:20, desc:"打撃（正拳突きの1/4）＋MP20回復" },
  "ロケットランチャー":{ kind:"attack", label:"銃撃", target:"one", hpCost:30, desc:"銃撃（ピストルの2倍）／HP30消費" }
}
const NEW_SKILL_ORDER = Object.keys(NEW_SKILLS)
for(const [n,s] of Object.entries(NEW_SKILLS)){
  if(s.cost) SPELL_COST[n] = s.cost
}
// 覚えている技のうち、指定の種類のものを返す
function learnedOf(player, kind){
  return (player.learnedSkills || []).filter(n => NEW_SKILLS[n] && NEW_SKILLS[n].kind === kind)
}
const ENEMY_ATK_RANGE = {
  A:[5,10],
  B:[10,15],
  C:[10,20],
  D:[15,20],
  E:[20,25],
  F:[25,50],
  G:[35,50],
  H:[55,70],   // ←後半の値を採用
  I:[60,70],
  J:[80,120],
  K:[5,50],
  L:[120,150]
}
const enemyImages = {
  "スライム": loadImg("slime"),
  "ゴブリン": loadImg("goblin"),
  "ピクシー": loadImg("pixie"),
  "オーク": loadImg("orc"),
  "ゾンビ": loadImg("zombie"),
  "エルフ": loadImg("elf"),
  "スケルトン": loadImg("skeleton"),
  "リッチ": loadImg("lich"),

  "ファイヤースライム": loadImg("fireSlime"),
  "アイススライム": loadImg("iceSlime"),
  "ウィンドスライム": loadImg("windSlime"),
  "サンダースライム": loadImg("thunderSlime"),

  "ダークエルフ": loadImg("darkElf"),
  "サラマンダー": loadImg("salamander"),
  "オートマトン": loadImg("automaton"),
  "マーメイド": loadImg("mermaid"),
  "バジリスク": loadImg("basilisk"),
  "ウィル・オ・ウィスプ": loadImg("wisp"),
  "デーモン": loadImg("demon"),
  "バイオゾンビ": loadImg("bioZombie"),
  "ゴーレム": loadImg("golem"),
  "ドライアド": loadImg("dryad"),
  "フェニックス": loadImg("phoenix"),
  "キメラ": loadImg("chimera"),
  "マジシャン": loadImg("magician"),

  "シヴァ": loadImg("shiva"),
  "スルト": loadImg("surtr"),
  "志那都比古神": loadImg("shinatobe"),
  "ゼウス": loadImg("zeus"),
  "トト": loadImg("thoth"),
  "ラー": loadImg("ra"),
  "ポセイドン": loadImg("poseidon"),
  "イザナギ": loadImg("izanagi"),
  "ヒュドラ": loadImg("hydra"),
  "ラクシュミ": loadImg("lakshmi"),
  "ニュクス": loadImg("nyx"),
  "天照大神": loadImg("amaterasu"),

  "嫉妬": loadImg("shitto"),
  "執念": loadImg("shunen"),
  "煩悩": loadImg("bonno"),
  "妬み": loadImg("netami"),
  "死": loadImg("death")
}

function loadImg(name){
  const img = new Image()
  img.src = "assets/images/monsters/" + name + ".png"
  return img
}

// ===== 敵 =====
const ENEMY_DATA = {
  A: [
    { name:"スライム", hp:10, weak:["斬撃","火炎"], resist:[], absorb:["猛毒"] },
    { name:"ゴブリン", hp:10, weak:["銃撃","氷結","念動","猛毒"], resist:["火炎"], absorb:[] }
  ],
  B: [
    { name:"ピクシー", hp:20,
      weak:["斬撃","打撃","銃撃"],
      resist:["火炎","氷結","電撃","疾風"],
      absorb:[]
    },
    { name:"オーク", hp:25,
      weak:["氷結","念動"],
      resist:["火炎","猛毒"],
      absorb:[]
    }
  ],
C: [
    { name:"ゾンビ", hp:26,
      weak:["打撃","核熱","光"],
      resist:["猛毒","闇"],
      absorb:["銃撃"]
    },
    { name:"エルフ", hp:26,
      weak:["銃撃","闇"],
      resist:["火炎","氷結","電撃","疾風","猛毒","光"],
      absorb:["念動"]
    }
  ],
D: [
    { name:"スケルトン", hp:28,
      weak:["火炎","光"],
      resist:["斬撃","打撃","銃撃","闇"],
      absorb:[]
    },
    { name:"リッチ", hp:29,
      weak:["光"],
      resist:["猛毒"],
      absorb:["闇"]
    }
  ],
E: [
    { name:"ファイヤースライム", hp:35,
      weak:["氷結"],
      resist:["電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["火炎"]
    },
    { name:"アイススライム", hp:35,
      weak:["火炎"],
      resist:["電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["氷結"]
    },
    { name:"ウィンドスライム", hp:35,
      weak:["電撃"],
      resist:["火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["疾風"]
    },
    { name:"サンダースライム", hp:35,
      weak:["疾風"],
      resist:["火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["電撃"]
    }
  ],
F: [
    { name:"エルフ", hp:26,
      weak:["銃撃","闇"],
      resist:["火炎","氷結","電撃","疾風","猛毒","光"],
      absorb:[]
    },
    { name:"ダークエルフ", hp:40,
      weak:["銃撃","光"],
      resist:["火炎","氷結","電撃","疾風","猛毒","闇"],
      absorb:[]
    }
  ],
G: [
    { name:"サラマンダー", hp:40,
      weak:["打撃","氷結","疾風","流水"],
      resist:["斬撃","銃撃","地震"],
      absorb:["火炎"]
    },
    { name:"オートマトン", hp:40,
      weak:["電撃","流水"],
      resist:["斬撃","打撃","銃撃","核熱","念動"],
      absorb:["氷結","黄金"]
    }
  ],
H: [
    { name:"マーメイド", hp:40,
      weak:["斬撃","地震","念動"],
      resist:["氷結","猛毒"],
      absorb:["流水"]
    },
    { name:"バジリスク", hp:40,
      weak:["猛毒"],
      resist:["火炎","氷結","核熱","光","闇"],
      absorb:["黄金"]
    }
  ],
I: [
    { name:"ウィル・オ・ウィスプ", hp:45,
      weak:["闇"],
      resist:["核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["光"]
    },
    { name:"デーモン", hp:45,
      weak:["光"],
      resist:["核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["闇"]
    },
    { name:"バイオゾンビ", hp:45,
      weak:["黄金","光"],
      resist:["火炎","氷結","電撃","疾風","核熱","念動","地震","流水"],
      absorb:["猛毒","闇"]
    },
    { name:"ゴーレム", hp:45,
      weak:["流水"],
      resist:["火炎","氷結","電撃","疾風","核熱","念動","黄金","猛毒","光","闇"],
      absorb:["地震"]
    },
    { name:"ドライアド", hp:45,
      weak:["斬撃","火炎","地震"],
      resist:["氷結","電撃"],
      absorb:["流水","猛毒"]
    },
    { name:"フェニックス", hp:45,
      weak:["氷結","流水"],
      resist:["電撃","核熱","念動","地震","黄金","猛毒","光","闇"],
      absorb:["火炎"]
    },
    { name:"キメラ", hp:45,
      weak:["打撃","念動"],
      resist:["火炎","氷結","電撃","疾風","地震","流水","黄金","闇"],
      absorb:["核熱","猛毒"]
    },
    { name:"マジシャン", hp:45,
      weak:["銃撃"],
      resist:[],
      absorb:["火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"]
    }
  ],
J: [
    { name:"シヴァ", hp:9999,
      weak:["火炎"],
      resist:["打撃","斬撃","銃撃","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["氷結"]
    },
    { name:"スルト", hp:9999,
      weak:["氷結"],
      resist:["打撃","斬撃","銃撃","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["火炎"]
    },
    { name:"志那都比古神", hp:9999,
      weak:["電撃"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["疾風"]
    },
    { name:"ゼウス", hp:9999,
      weak:["疾風"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["電撃"]
    },
    { name:"トト", hp:9999,
      weak:["核熱"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","地震","流水","黄金","猛毒","光","闇"],
      absorb:["念動"]
    },
    { name:"ラー", hp:9999,
      weak:["念動"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","地震","流水","黄金","猛毒","光","闇"],
      absorb:["核熱"]
    },
    { name:"ポセイドン", hp:9999,
      weak:["地震"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","黄金","猛毒","光","闇"],
      absorb:["流水"]
    },
    { name:"イザナギ", hp:9999,
      weak:["流水"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","黄金","猛毒","光","闇"],
      absorb:["地震"]
    },
    { name:"ヒュドラ", hp:9999,
      weak:["黄金"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","光","闇"],
      absorb:["猛毒"]
    },
    { name:"ラクシュミ", hp:9999,
      weak:["猛毒"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","光","闇"],
      absorb:["黄金"]
    },
    { name:"ニュクス", hp:9999,
      weak:["光"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["闇"]
    },
    { name:"天照大神", hp:9999,
      weak:["闇"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["光"]
    }
  ],
K: [
    { name:"煩悩", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"執念", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"妬み", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"嫉妬", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"死", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    }
  ],
L: [
    { name:"スライム", hp:10,
      weak:["斬撃","火炎"],
      resist:["猛毒"],
      absorb:[]
    },
    { name:"ゴブリン", hp:10,
      weak:["銃撃","氷結","念動","猛毒"],
      resist:["火炎"],
      absorb:[]
    },
    { name:"ピクシー", hp:20,
      weak:["斬撃","打撃","銃撃"],
      resist:["火炎","氷結","電撃","疾風"],
      absorb:[]
    },
    { name:"オーク", hp:25,
      weak:["氷結","念動"],
      resist:["火炎","猛毒"],
      absorb:[]
    },
    { name:"ゾンビ", hp:26,
      weak:["打撃","核熱","光"],
      resist:["猛毒","闇"],
      absorb:["銃撃"]
    },
    { name:"エルフ", hp:26,
      weak:["銃撃","闇"],
      resist:["火炎","氷結","電撃","疾風","猛毒","光"],
      absorb:[]
    },
    { name:"スケルトン", hp:28,
      weak:["火炎","光"],
      resist:["斬撃","打撃","銃撃","闇"],
      absorb:[]
    },
    { name:"リッチ", hp:29,
      weak:["光"],
      resist:["猛毒"],
      absorb:["闇"]
    },
    { name:"ファイヤースライム", hp:35,
      weak:["氷結"],
      resist:["電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["火炎"]
    },
    { name:"アイススライム", hp:35,
      weak:["火炎"],
      resist:["電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["氷結"]
    },
    { name:"ウィンドスライム", hp:35,
      weak:["電撃"],
      resist:["火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["疾風"]
    },
    { name:"サンダースライム", hp:35,
      weak:["疾風"],
      resist:["火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["電撃"]
    },
    { name:"ダークエルフ", hp:40,
      weak:["銃撃","光"],
      resist:["火炎","氷結","電撃","疾風","猛毒","闇"],
      absorb:[]
    },
    { name:"サラマンダー", hp:40,
      weak:["打撃","氷結","疾風","流水"],
      resist:["斬撃","銃撃","地震"],
      absorb:["火炎"]
    },
    { name:"オートマトン", hp:40,
      weak:["電撃","流水"],
      resist:["斬撃","打撃","銃撃","核熱","念動"],
      absorb:["氷結","黄金"]
    },
    { name:"マーメイド", hp:40,
      weak:["斬撃","地震","念動"],
      resist:["氷結","猛毒"],
      absorb:["流水"]
    },
    { name:"バジリスク", hp:40,
      weak:["猛毒"],
      resist:["火炎","氷結","核熱","光","闇"],
      absorb:["黄金"]
    },
    { name:"ウィル・オ・ウィスプ", hp:45,
      weak:["闇"],
      resist:["核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["光"]
    },
    { name:"デーモン", hp:45,
      weak:["光"],
      resist:["核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["闇"]
    },
    { name:"バイオゾンビ", hp:45,
      weak:["黄金","光"],
      resist:["火炎","氷結","電撃","疾風","核熱","念動","地震","流水"],
      absorb:["猛毒","闇"]
    },
    { name:"ゴーレム", hp:45,
      weak:["流水"],
      resist:["火炎","氷結","電撃","疾風","核熱","念動","黄金","猛毒","光","闇"],
      absorb:["地震"]
    },
    { name:"ドライアド", hp:45,
      weak:["斬撃","火炎","地震"],
      resist:["氷結","電撃"],
      absorb:["流水","猛毒"]
    },
    { name:"フェニックス", hp:45,
      weak:["氷結","流水"],
      resist:["電撃","核熱","念動","地震","黄金","猛毒","光","闇"],
      absorb:["火炎"]
    },
    { name:"キメラ", hp:45,
      weak:["打撃","念動"],
      resist:["火炎","氷結","電撃","疾風","地震","流水","黄金","闇"],
      absorb:["核熱","猛毒"]
    },
    { name:"マジシャン", hp:45,
      weak:["銃撃"],
      resist:[],
      absorb:["火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"]
    },
    { name:"シヴァ", hp:90,
      weak:["火炎"],
      resist:["打撃","斬撃","銃撃","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["氷結"]
    },
    { name:"スルト", hp:90,
      weak:["氷結"],
      resist:["打撃","斬撃","銃撃","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["火炎"]
    },
    { name:"志那都比古神", hp:90,
      weak:["電撃"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["疾風"]
    },
    { name:"ゼウス", hp:90,
      weak:["疾風"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:["電撃"]
    },
    { name:"トト", hp:90,
      weak:["核熱"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","地震","流水","黄金","猛毒","光","闇"],
      absorb:["念動"]
    },
    { name:"ラー", hp:90,
      weak:["念動"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","地震","流水","黄金","猛毒","光","闇"],
      absorb:["核熱"]
    },
    { name:"ポセイドン", hp:90,
      weak:["地震"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","黄金","猛毒","光","闇"],
      absorb:["流水"]
    },
    { name:"イザナギ", hp:90,
      weak:["流水"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","黄金","猛毒","光","闇"],
      absorb:["地震"]
    },
    { name:"ヒュドラ", hp:90,
      weak:["黄金"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","光","闇"],
      absorb:["猛毒"]
    },
    { name:"ラクシュミ", hp:90,
      weak:["猛毒"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","光","闇"],
      absorb:["黄金"]
    },
    { name:"ニュクス", hp:90,
      weak:["光"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["闇"]
    },
    { name:"天照大神", hp:90,
      weak:["闇"],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒"],
      absorb:["光"]
    },
    { name:"煩悩", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"執念", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"妬み", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"嫉妬", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    },
    { name:"死", hp:10,
      weak:[],
      resist:["打撃","斬撃","銃撃","火炎","氷結","電撃","疾風","核熱","念動","地震","流水","黄金","猛毒","光","闇"],
      absorb:[]
    }
  ]
}

function onVictory(b){
  b.log.push("勝利！")

  if(currentBGM){
    currentBGM.pause()
    currentBGM.currentTime = 0
  }

  playSE(sounds.se.victory)

  b.result = true
winCount++

  if(winCount >= 3){
    winCount = 0

    if(escapeCount > 0){
      escapeCount--
      b.log.push("逃走しやすくなった！")
    }
  }
}
// ===== 戦闘開始 =====
function battle(player, inventory, area){

  const enemies = createEnemies(area)

  return {
    enemies,
    turn:"player",

    commands:["攻撃","魔法","アイテム","逃げる"],
    commandIndex:0,

    // ★追加
    attackSkills:["斬りつけ","正拳突き","ピストル", ...learnedOf(player,"attack")],
    attackIndex:0,

    targetIndex:0,

    spells:[
      "ファイヤー","アイス","サンダー","ウィンド",
      "ヌーク","サイ",
      "クエイク","ウォーター",
      "ゴールド","バイオ",
      "ハマ","ムド",
      "メギド",
      ...learnedOf(player,"spell")
    ],
    spellIndex:0,

itemIndex:0,

    phase:"command",

    attackType:null,

    log:[
      "=== 戦闘開始 ===",
      enemies.map(e=>e.name).join(",")+" が現れた！"
    ],

    result:null,
    waitingInput:false,
    enemyIndex:0
  }
}
// ===== 敵生成 =====
function createEnemies(area){
  let list = ENEMY_DATA?.[area.name] || ENEMY_DATA?.["A"]

  // ★防御コード
  if(!list || list.length === 0){
    console.error("ENEMY_DATAが壊れてる", area)
    return []
  }

  let count = Math.floor(Math.random()*3)+1
  let enemies=[]

  for(let i=0;i<count;i++){
    let base = list[Math.floor(Math.random()*list.length)]
    enemies.push({
      name:base.name,
      hp:base.hp,
      maxHp:base.hp,
      weak:base.weak,
      resist:base.resist,
      absorb:base.absorb,
      stun:0
    })
  }

  return enemies
}
// ===== ダメージ =====
function calcDamage(enemy,type){

  // ===== 吸収 =====
  if(enemy.absorb && enemy.absorb.includes(type)){
    let dmg = Math.floor(Math.random()*20)+20
    return {type:"absorb", value:dmg}
  }

  // ===== 耐性 =====
  if(enemy.resist.includes(type)){
    return {type:"resist"}
  }

  // ===== 弱点 =====
  if(enemy.weak.includes(type)){
    let dmg = Math.floor(Math.random()*20)+20
    let bonus = Math.floor(enemy.maxHp*0.25)
    return {type:"weak", value:dmg+bonus}
  }

  // ===== 万能 =====
  if(type==="万能"){
    let dmg = Math.floor(Math.random()*25)+20
    return {type:"normal", value:dmg}
  }

  // ===== 通常 =====
  let dmg = Math.floor(Math.random()*10)+20
  return {type:"normal", value:dmg}
}
// ===== SE =====
function playSE(audio){
  if(!audio) return
  audio.currentTime = 0
  audio.play()
}

// ===== 新スキル用の共通処理 =====
function popupAt(idx, count, text, kind){
  if(typeof spawnPopup === "function") spawnPopup(idx, count, text, kind)
}

// 1体への結果を反映（ログ・SE・数字）。弱点を突いたら true
function applyHitResult(b, enemy, idx, count, r){
  if(r.type === "absorb"){
    playSE(sounds.se.absorb)
    enemy.maxHp += r.value
    enemy.hp += r.value
    b.log.push(`${enemy.name}は吸収した！(+${r.value})`)
    popupAt(idx, count, "+"+r.value, "absorb")
    return false
  }
  if(r.type === "resist"){
    playSE(sounds.se.resist)
    b.log.push(`${enemy.name}には効かない！`)
    popupAt(idx, count, "効かない", "resist")
    return false
  }
  enemy.hp = Math.max(0, enemy.hp - r.value)
  b.log.push(`${enemy.name}に${r.value}ダメージ`)
  popupAt(idx, count, String(r.value), r.type === "weak" ? "weak" : "normal")
  if(r.type === "weak"){
    playSE(sounds.se.weak)
    b.log.push(`${enemy.name} WEAK!`)
    return true
  }
  return false
}

// 行動後の共通処理：撃破の除去 → 勝利 / 1MORE / 敵ターン
function finishPlayerAction(b, gotWeak){
  for(let i = b.enemies.length-1; i >= 0; i--){
    if(b.enemies[i].hp <= 0){
      b.log.push(b.enemies[i].name+" 撃破")
      if(typeof gainExp === "function") gainExp(1)
      b.enemies.splice(i,1)
    }
  }
  if(b.targetIndex >= b.enemies.length) b.targetIndex = 0

  if(b.enemies.length === 0){
    onVictory(b)
    return
  }
  if(gotWeak){
    b.log.push("1MORE!")
    b.turn = "player"
  }else{
    b.turn = "enemy"
  }
  b.waitingInput = true
}

function handleNewSkill(b, player, spell, enemy){
  const info = NEW_SKILLS[spell]
  const type = spellToType(spell)
  const count = b.enemies.length

  // 物理系（攻撃技）はPHYSICALの倍率も乗る
  const calc = (en, scale) => {
    const r = calcDamage(en, type)
    if(r.type === "normal" || r.type === "weak"){
      let mul = player.atkMul || 1
      if(info.kind === "attack") mul *= (player.physMul || 1)
      r.value = Math.max(1, Math.round(r.value * mul * scale))
    }
    return r
  }

  // ----- 魔法（自分・逃走・解析）-----
  if(spell === "ヒール"){
    const before = player.hp
    player.hp = Math.min(player.maxHp, player.hp + 100)
    playSE(sounds.se.itemHeal)
    b.log.push(`ヒール！ HPが${player.hp - before}回復した`)
    b.turn = "enemy"
    b.waitingInput = true
    return
  }

  if(spell === "エスケープ"){
    b.log.push("エスケープ！ 逃げ切れた！")
    if(typeof playEscapeSE === "function") playEscapeSE()
    b.result = true
    escapeCount++
    return
  }

  if(spell === "サーチ"){
    if(enemy.weak && enemy.weak.length > 0){
      enemy.searched = true
      b.log.push(`${enemy.name}の弱点を見抜いた！（${enemy.weak.join("・")}）`)
    }else{
      b.log.push("何も起こらなかった！")
      popupAt(b.targetIndex, count, "何も起こらなかった！", "resist")
    }
    b.turn = "enemy"
    b.waitingInput = true
    return
  }

  // ----- 全体攻撃 -----
  if(info.target === "all"){
    const scale = (spell === "メギドラ") ? 1.5 : 0.5
    b.log.push(`${spell}！`)
    let gotWeak = false
    b.enemies.forEach((en, i)=>{
      if(applyHitResult(b, en, i, count, calc(en, scale))) gotWeak = true
    })
    finishPlayerAction(b, gotWeak)
    return
  }

  // ----- 単体攻撃 -----
  if(spell === "ロケットランチャー"){
    if(player.hp <= info.hpCost){
      b.log.push("HPが足りない！")
      b.turn = "player"
      return
    }
    player.hp -= info.hpCost
    b.log.push(`ロケットランチャー！ (HP-${info.hpCost})`)
    playSE(sounds.se.damage)
    const gotWeak = applyHitResult(b, enemy, b.targetIndex, count, calc(enemy, 2))
    finishPlayerAction(b, gotWeak)
    return
  }

  if(spell === "チェーンソー"){
    b.log.push("チェーンソー！")
    const r = calc(enemy, 0.25)
    const gotWeak = applyHitResult(b, enemy, b.targetIndex, count, r)
    if((r.type === "normal" || r.type === "weak") && Math.random() < 0.5){
      enemy.hp = 0
      b.log.push(`${enemy.name}を即死させた！`)
      popupAt(b.targetIndex, count, "即死", "kill")
    }
    finishPlayerAction(b, gotWeak)
    return
  }

  if(spell === "チャージパンチ"){
    b.log.push("チャージパンチ！")
    const gotWeak = applyHitResult(b, enemy, b.targetIndex, count, calc(enemy, 0.25))
    const before = player.mp
    player.mp = Math.min(player.maxMp, player.mp + info.mpGain)
    b.log.push(`MPが${player.mp - before}回復した`)
    finishPlayerAction(b, gotWeak)
    return
  }
}

// ===== 更新 =====
function updateBattle(b,player){
if(b.result !== null) return
if(b.processing) return
b.processing = true
try {

  // ===== 勝利チェック =====
  if(b.enemies.length === 0){
  onVictory(b)
  return
}

  // ===== ターゲット補正 =====
  if(b.targetIndex >= b.enemies.length){
    b.targetIndex = 0
  }

  let enemy = b.enemies[b.targetIndex]
  if(!enemy){
    b.targetIndex = 0
    enemy = b.enemies[0]
    if(!enemy) return
  }

  // ===== プレイヤー =====
  if(b.turn === "processing"){

    let spell = b.attackType

    // ===== MP =====
    if(SPELL_COST[spell]){
      let cost = SPELL_COST[spell]

      if(player.mp < cost){
        b.log.push("MPが足りない！")
        b.turn = "player"
        return
      }

      player.mp -= cost
      b.log.push(`${spell} (MP-${cost})`)
    }

    // ★新スキル（NEW SKILL）
    if(NEW_SKILLS[spell]){
      handleNewSkill(b, player, spell, enemy)
      return
    }

    let type = spellToType(spell || "斬撃")
    let result = calcDamage(enemy,type)

    // ★ATK / PHYSICAL（レベルアップ）による攻撃力倍率
    if(result.type==="normal" || result.type==="weak"){
      let mul = player.atkMul || 1
      if(["斬りつけ","正拳突き","ピストル"].includes(spell)){
        mul *= (player.physMul || 1)
      }
      result.value = Math.round(result.value * mul)
    }

    // ===== ダメージ処理 =====
    if(result.type==="absorb"){
playSE(sounds.se.absorb)
  enemy.maxHp += result.value
  enemy.hp += result.value

  b.log.push(`${enemy.name}は吸収した！(+${result.value})`)
  if(typeof spawnPopup==="function") spawnPopup(b.targetIndex, b.enemies.length, "+"+result.value, "absorb")
}
    else if(result.type==="resist"){
playSE(sounds.se.resist)
      b.log.push("効かない！")
      if(typeof spawnPopup==="function") spawnPopup(b.targetIndex, b.enemies.length, "効かない", "resist")
    }
    else{
      enemy.hp -= result.value
// ===== 死亡処理 =====

      // ★ マイナス防止
      if(enemy.hp < 0) enemy.hp = 0

      b.log.push(`${enemy.name}に${result.value}ダメージ`)
      if(typeof spawnPopup==="function") spawnPopup(b.targetIndex, b.enemies.length, String(result.value), result.type==="weak" ? "weak" : "normal")

      // ===== WEAK =====
      if(result.type==="weak"){
playSE(sounds.se.weak)
  b.log.push("WEAK!")
  b.log.push("1MORE!")

  if(enemy.hp === 0){
    b.log.push(enemy.name+" 撃破")
    if(typeof gainExp==="function") gainExp(1)
    b.enemies.splice(b.targetIndex,1)

    if(b.targetIndex >= b.enemies.length){
      b.targetIndex = 0
    }

    // ★ここ追加
    if(b.enemies.length === 0){
  onVictory(b)
  return
}
  }

  b.turn="player"
  b.waitingInput=true
  return
}
    }

    // ===== 通常撃破判定 =====
    if(enemy.hp === 0){
      b.log.push(enemy.name+" 撃破")
    if(typeof gainExp==="function") gainExp(1)
      b.enemies.splice(b.targetIndex,1)

      if(b.targetIndex >= b.enemies.length){
        b.targetIndex = 0
      }
    }

    if(b.enemies.length === 0){
  onVictory(b)
  return
}

    b.turn="enemy"
    b.waitingInput=true
    return
  }

  // ===== 敵 =====
  if(b.turn === "enemy"){

    let enemyTurn = b.enemies[b.enemyIndex]

    if(!enemyTurn){
      b.enemyIndex = 0
      b.turn = "player"
      return
    }

    // ★バインダーで拘束中の敵は動けない
    if(enemyTurn.stun > 0){
      enemyTurn.stun--
      b.log.push(`${enemyTurn.name} は動けない！`)
      b.enemyIndex++
      if(b.enemyIndex >= b.enemies.length){
        b.enemyIndex = 0
        b.turn = "player"
      }
      b.waitingInput = true
      return
    }

    const area = getArea(floor)
const range = ENEMY_ATK_RANGE[area.name] || [5,10]

let dmg = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
    // ★PHYSICAL（レベルアップ）による被ダメージ軽減
    dmg = Math.max(1, Math.round(dmg * (player.dmgTakenMul || 1)))
    player.hp -= dmg
playSE(sounds.se.damage)
if(player.hp <= 0){
  player.hp = 0

  b.log.push("あなたは倒れた…")

  b.result = "gameover"
  return
}
    b.log.push(`${enemyTurn.name} の攻撃 ${dmg}`)

    b.enemyIndex++

    if(b.enemyIndex >= b.enemies.length){
      b.enemyIndex = 0
      b.turn = "player"
    }

    b.waitingInput = true
  }
} finally {
    b.processing = false
}
}

window.battle = battle
window.updateBattle = updateBattle
window.createEnemies = createEnemies
window.playSE = playSE