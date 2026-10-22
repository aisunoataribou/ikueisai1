
// ===== 初期 =====
const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")


canvas.width = window.innerWidth
canvas.height = window.innerHeight

let mode = "title" // ← "explore" じゃなくこれにする
const titleBg = new Image()
titleBg.src = "assets/images/title_bg.png"
let titleButton = null

let currentBattle = null

const TILE_SIZE = 32
const MAP_SIZE = 31

// 出現確率はすべて同じ（rollItem で均等に抽選）
const ITEMS = [
  { name:"パン", type:"hp", value:30 },
  { name:"ポテト", type:"hp", value:50 },
  { name:"ピザ", type:"hp", value:70 },
  { name:"水", type:"mp", value:15 },
  { name:"お茶", type:"mp", value:30 },
  { name:"スポーツドリンク", type:"mp", value:50 },
  { name:"ハンバーガー", type:"hp", value:80 },
  { name:"寿司", type:"hp", value:100 },
  { name:"唐揚げ", type:"hp", value:120 },
  { name:"コーラ", type:"mp", value:60 },
  { name:"ジュース", type:"mp", value:80 },
  { name:"牛乳", type:"mp", value:120 },
  { name:"ダッシューズ", type:"speed", value:2 },
  { name:"バインダー", type:"stun", value:2 }   // 相手全体を value ターン動けなくする
]

let map = []
let seen = []
let itemsOnFloor = []

const itemImg = new Image()
itemImg.src = "assets/images/something.png"

// ===== 画像 =====
const stairImg = new Image()
stairImg.src = "assets/images/stairs.png"

// ===== エリア =====
const AREAS = [
  { name:"A", color:"#aa0000", min:1, max:5 },   // 赤
  { name:"B", color:"#ff8800", min:6, max:10 },  // オレンジ
  { name:"C", color:"#ffff00", min:11, max:15 }, // 黄
  { name:"D", color:"#88ff00", min:16, max:20 }, // 黄緑
  { name:"E", color:"#00ff00", min:21, max:25 }, // 緑
  { name:"F", color:"#00ffff", min:26, max:30 }, // 水色
  { name:"G", color:"#0000ff", min:31, max:35 }, // 青
  { name:"H", color:"#8800ff", min:36, max:40 }, // 紫
  { name:"I", color:"#ff88cc", min:41, max:45 }, // ピンク
  { name:"J", color:"#888888", min:46, max:50 }, // 灰色
  { name:"K", color:"#ffffff", min:51, max:55 }, // 白
  { name:"L", color:"#ffd700", min:56, max:9999 }  // 金
]
function getArea(floor){
  return AREAS.find(a => floor >= a.min && floor <= a.max)
}

// ===== プレイヤー =====
let player = {
  x:0,
  y:0,
  hp:100,
  mp:100,
  speed:2,
  baseSpeed:2,      // ★基本移動速度（SPEEDで上がる）
  level:1,
  exp:0,
  atkMul:1,         // ★攻撃力倍率（ATKで上がる）
  lvBonusHp:0,      // ★レベルアップで得た最大HP（リトライで消える）
  lvBonusMp:0,
  speedLv:0,        // ★SPEED強化回数（最大5）
  physLv:0,         // ★PHYSICAL強化回数（最大5）
  physMul:1,        // ★物理技（斬りつけ・正拳突き・ピストル）の倍率
  dmgTakenMul:1,    // ★被ダメージ倍率
  learnedSkills:[], // ★NEW SKILLで覚えた技
hasDash:false,
maxHp:100, // ★追加
  maxMp:100, // ★追加

  inventory:[] // ★追加
}
let recordMaxHp = player.maxHp
let recordMaxMp = player.maxMp

let floor = 1
let stair = {x:0,y:0}
let escapeCount = 1   // 最初は1（=50%成功）
let winCount = 0      // 勝利カウント
let pendingLevelUps = 0   // 未選択のレベルアップ数
let levelCursor = 0
// ===== サウンド =====
const sounds = {
  bgm:{
title:new Audio("assets/sounds/title_bgm.mp3"),
    dungeon:new Audio("assets/sounds/dungeon_bgm.mp3"),
gameover:new Audio("assets/sounds/gameoverbgm.mp3"), // ★追加
    battle:{
      A:new Audio("assets/sounds/battle_a.mp3"),
      B:new Audio("assets/sounds/battle_b.mp3"),
      C:new Audio("assets/sounds/battle_c.mp3"),
      D:new Audio("assets/sounds/battle_d.mp3"),
      E:new Audio("assets/sounds/battle_e.mp3"),
      F:new Audio("assets/sounds/battle_f.mp3"),
      G:new Audio("assets/sounds/battle_g.mp3"),
      H:new Audio("assets/sounds/battle_h.mp3"),
      I:new Audio("assets/sounds/battle_i.mp3"),
      J:new Audio("assets/sounds/battle_j.mp3"),
      K:new Audio("assets/sounds/battle_k.mp3"),
      L:new Audio("assets/sounds/battle_l.mp3")
    }
  },
se:{
    weak:new Audio("assets/sounds/weakness.mp3"),
    resist:new Audio("assets/sounds/resistance.mp3"),
    absorb:new Audio("assets/sounds/absorb.mp3"),
    victory:new Audio("assets/sounds/victory.mp3"),
    itemPickup:new Audio("assets/sounds/item_pickup.mp3"),
    itemHeal:new Audio("assets/sounds/item_heal.mp3"),
    damage:new Audio("assets/sounds/damage.mp3"),
dash:new Audio("assets/sounds/dash.mp3")
  }
}
sounds.bgm.title.loop = true
sounds.bgm.dungeon.loop = true
sounds.bgm.gameover.loop = true

Object.values(sounds.bgm.battle).forEach(a => {
  a.loop = true
})
let currentBGM=null
let audioUnlocked=false   // ブラウザが音の再生を許可したか
function playBGM(audio){
  if(currentBGM===audio) return
  if(currentBGM){
    currentBGM.pause()
    currentBGM.currentTime=0
  }
  currentBGM=audio
  const p = audio.play()
  if(p && p.then){
    p.then(()=>{ audioUnlocked=true })
     .catch(()=>{
       // 自動再生をブロックされた → 次の操作でもう一度鳴らせるようにする
       if(currentBGM===audio) currentBGM=null
     })
  }
}

// タイトル画面：最初のキー操作でも音を解禁する
window.addEventListener("keydown", ()=>{
  if(mode==="title" && !audioUnlocked){
    audioUnlocked = true
    playBGM(sounds.bgm.title)
  }
})

// ===== 入力 =====
const keys = {}

window.addEventListener("keydown", e => {
// ===== デバッグ：階層移動 =====
if(keys["t"] && e.key === "1"){
  floor++
  stairCooldown = 30

  let start = generateMaze()
  player.x = start.sx * TILE_SIZE
  player.y = start.sy * TILE_SIZE

  placeStair()
  placeItems()
  updateSeen()

  console.log("デバッグ: 次の階 →", floor)
}

if(keys["t"] && e.key === "2"){
  if(floor > 1) floor--
  stairCooldown = 30

  let start = generateMaze()
  player.x = start.sx * TILE_SIZE
  player.y = start.sy * TILE_SIZE

  placeStair()
  placeItems()
  updateSeen()

  console.log("デバッグ: 前の階 →", floor)
}
if(keys["t"] && e.key === "3"){

  player.hasDash = true
  player.speed = player.baseSpeed * 2

  playSE(sounds.se.dash)

  console.log("デバッグ: ダッシュ装備")
}
// ===== デバッグ：逃走回数表示 =====
if(keys["t"] && e.key === "p"){
  console.log("逃走回数:", escapeCount)
  console.log("現在の成功率:", Math.floor(100 / (escapeCount + 1)) + "%")
currentBattle?.log.push("逃走回数: " + escapeCount)
}
if(mode === "gameover" && e.key === "r"){

  // ★最大値を復元
  player.maxHp = recordMaxHp
  player.maxMp = recordMaxMp

  player.hp = player.maxHp
  player.mp = player.maxMp

  // ★アイテムリセット
  player.inventory = []

  // ★階層リセット
  floor = 1

  // ★逃走・勝利カウント、ダッシュ、エンカウント状態もリセット
  escapeCount = 1
  winCount = 0
  player.hasDash = false
  player.baseSpeed = 2
  player.speed = 2
  player.level = 1
  player.exp = 0
  player.atkMul = 1
  player.lvBonusHp = 0
  player.lvBonusMp = 0
  player.speedLv = 0
  player.physLv = 0
  player.physMul = 1
  player.dmgTakenMul = 1
  player.learnedSkills = []
  pendingLevelUps = 0
  encounterCounter = 0
  encounterCooldown = 0
  stairCooldown = 30
  currentBattle = null

  // ★マップ再生成
  let start = generateMaze()
  player.x = start.sx * TILE_SIZE
  player.y = start.sy * TILE_SIZE

  placeStair()
  placeItems()
  updateSeen()

  mode = "explore"
playBGM(sounds.bgm.dungeon)
}
  // ===== レベルアップ選択 =====
  if(mode === "levelup"){
    handleLevelUpKey(e)
    return
  }

  // ===== 探索 =====
  if(mode !== "battle"){
    keys[e.key] = true
    return
  }

  if(!currentBattle) return

  // ===== 戦闘終了 =====
  if(currentBattle.result !== null){
    if(e.key==="Enter"){
      mode="explore"
      currentBattle=null
      encounterCooldown=60
      playBGM(sounds.bgm.dungeon)
    }
    return
  }

  // ★ 敵ターンの進行：Enter でもクリックと同じく進める
  if(currentBattle.turn === "enemy" && currentBattle.waitingInput){
    if(e.key==="Enter" && !e.repeat){
      currentBattle.waitingInput=false
      updateBattle(currentBattle,player)
    }
    return
  }

  // ★ プレイヤーターンのみ操作可能
  if(currentBattle.turn !== "player") return

  // ===== ターゲット =====
  if(e.key==="ArrowLeft"){
    currentBattle.targetIndex--
    if(currentBattle.targetIndex<0){
      currentBattle.targetIndex=currentBattle.enemies.length-1
    }
  }

  if(e.key==="ArrowRight"){
    currentBattle.targetIndex++
    if(currentBattle.targetIndex>=currentBattle.enemies.length){
      currentBattle.targetIndex=0
    }
  }
if(currentBattle.phase==="attack"){

  if(e.key==="ArrowUp"){
    currentBattle.attackIndex--
    if(currentBattle.attackIndex<0){
      currentBattle.attackIndex=currentBattle.attackSkills.length-1
    }
  }

  if(e.key==="ArrowDown"){
    currentBattle.attackIndex++
    if(currentBattle.attackIndex>=currentBattle.attackSkills.length){
      currentBattle.attackIndex=0
    }
  }

  if(e.key==="Enter"){
    const sk = currentBattle.attackSkills[currentBattle.attackIndex]
    if(!skillUsable(sk)){
      // ★HP不足など：ターンは消費せず、選択画面に留まる
      if(!e.repeat) currentBattle.log.push(skillShortMsg(sk))
      return
    }
    currentBattle.attackType = sk

    currentBattle.turn="processing"
    currentBattle.phase="command"

    updateBattle(currentBattle,player)
  }

  if(e.key==="Escape" || e.key===" "){   // ★キャンセル（Esc / Space）
      e.preventDefault()
    currentBattle.phase="command"
  }

  return
}

  // ===== 魔法選択 =====
  if(currentBattle.phase==="spell"){

    if(e.key==="ArrowUp"){
      currentBattle.spellIndex--
      if(currentBattle.spellIndex<0){
        currentBattle.spellIndex=currentBattle.spells.length-1
      }
    }

    if(e.key==="ArrowDown"){
      currentBattle.spellIndex++
      if(currentBattle.spellIndex>=currentBattle.spells.length){
        currentBattle.spellIndex=0
      }
    }

    if(e.key==="Enter"){
      const sp = currentBattle.spells[currentBattle.spellIndex]
      if(!skillUsable(sp)){
        // ★MP不足：ターンは消費せず、選択画面に留まる
        if(!e.repeat) currentBattle.log.push(skillShortMsg(sp))
        return
      }
      currentBattle.attackType=currentBattle.spells[currentBattle.spellIndex]
      currentBattle.turn="processing"
      currentBattle.phase="command"
      updateBattle(currentBattle,player)
    }

    if(e.key==="Escape" || e.key===" "){   // ★キャンセル（Esc / Space）
      e.preventDefault()
      currentBattle.phase="command"
    }

    return
  }
if(currentBattle.phase==="item"){

  const list = getItemCounts()

if(e.key==="ArrowUp"){
  currentBattle.itemIndex--
  if(currentBattle.itemIndex<0){
    currentBattle.itemIndex = list.length-1
  }
}

if(e.key==="ArrowDown"){
  currentBattle.itemIndex++
  if(currentBattle.itemIndex>=list.length){
    currentBattle.itemIndex = 0
  }
}

  if(e.key==="Enter"){

    const list = getItemCounts()
let entry = list[currentBattle.itemIndex]
let item = entry.item

    if(!item){
      currentBattle.log.push("アイテムがない")
      return
    }

    // ===== 使用 =====
    if(item.type==="hp"){
  player.hp += item.value
playSE(sounds.se.itemHeal)
  // ★上限チェック
  if(player.hp > player.maxHp){
    player.hp = player.maxHp
  }
}

if(item.type==="mp"){
  player.mp += item.value
playSE(sounds.se.itemHeal)
  // ★上限チェック
  if(player.mp > player.maxMp){
    player.mp = player.maxMp
  }
}

    if(item.type==="stun"){
      currentBattle.enemies.forEach((en,i)=>{
        en.stun = item.value
        spawnPopup(i, currentBattle.enemies.length, "動けない", "stun")
      })
      currentBattle.log.push("バインダーを使った！ 相手全体が" + item.value + "ターン動けない！")
      playSE(sounds.se.itemHeal)
    }

    if(item.type==="speed"){
      currentBattle.log.push("これは戦闘では使えない")
      return
    }

    // ★削除
    let index = player.inventory.findIndex(i => i.name === item.name)
if(index !== -1){
  player.inventory.splice(index,1)
}

    currentBattle.turn="enemy"
    currentBattle.phase="command"
    currentBattle.waitingInput=true
  }

  if(e.key==="Escape" || e.key===" "){   // ★キャンセル（Esc / Space）
      e.preventDefault()
    currentBattle.phase="command"
  }

  return
}
  // ===== コマンド =====
  if(currentBattle.phase==="command"){

    if(e.key==="ArrowUp"){
      currentBattle.commandIndex--
      if(currentBattle.commandIndex<0){
        currentBattle.commandIndex=currentBattle.commands.length-1
      }
    }

    if(e.key==="ArrowDown"){
      currentBattle.commandIndex++
      if(currentBattle.commandIndex>=currentBattle.commands.length){
        currentBattle.commandIndex=0
      }
    }

    if(e.key==="Enter"){

      let cmd=currentBattle.commands[currentBattle.commandIndex]

      if(cmd==="攻撃"){
  currentBattle.phase="attack"
}

      else if(cmd==="魔法"){
        currentBattle.phase="spell"
      }
else if(cmd==="アイテム"){

  if(player.inventory.length===0){
    currentBattle.log.push("アイテムを持っていない")
  }else{
    currentBattle.phase="item"
    currentBattle.itemIndex = 0
  }
}
      else if(cmd==="逃げる"){

  let rate = 1 / (escapeCount + 1)

  if(Math.random() < rate){

    currentBattle.log.push("逃げ切れた！")
    playEscapeSE()
    currentBattle.result = true

    escapeCount++   // ★逃げた回数増加

  }else{

    currentBattle.log.push("逃げられなかった！")
    currentBattle.turn = "enemy"
    currentBattle.waitingInput = true

  }
}
    }
  }
})

window.addEventListener("keyup", e=>keys[e.key]=false)

// ===== クリック（ターン進行）=====
canvas.addEventListener("click", (e)=>{
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  // タイトル
  if(mode === "title" && !audioUnlocked){
    // 最初のクリックは音の解禁だけ（BGMを鳴らす）
    // ★音が鳴る/鳴らないに関係なく、次のクリックで始められるようにする
    audioUnlocked = true
    playBGM(sounds.bgm.title)
    return
  }
  if(mode === "title" && titleButton){
    if(
      mx >= titleButton.x &&
      mx <= titleButton.x + titleButton.w &&
      my >= titleButton.y &&
      my <= titleButton.y + titleButton.h
    ){
      mode = "explore"
      playBGM(sounds.bgm.dungeon)
      return
    }
  }

  // 戦闘
  if(mode==="battle" && currentBattle){
ctx.textAlign = "left"
    if(currentBattle.waitingInput){
      currentBattle.waitingInput=false
      updateBattle(currentBattle,player)
    }
  }
})

// ===== 迷路生成 =====
function generateMaze(){
  map=[]; seen=[]

  for(let y=0;y<MAP_SIZE;y++){
    map[y]=[]; seen[y]=[]
    for(let x=0;x<MAP_SIZE;x++){
      map[y][x]=1
      seen[y][x]=false
    }
  }

  function dig(x,y){
    map[y][x]=0
    const dirs=[[0,-2],[2,0],[0,2],[-2,0]].sort(()=>Math.random()-0.5)

    for(let [dx,dy] of dirs){
      let nx=x+dx, ny=y+dy
      if(nx>0&&ny>0&&nx<MAP_SIZE-1&&ny<MAP_SIZE-1){
        if(map[ny][nx]===1){
          map[y+dy/2][x+dx/2]=0
          dig(nx,ny)
        }
      }
    }
  }

  let sx=15, sy=15
  dig(sx,sy)
  return {sx,sy}
}

// ===== 階段 =====
function placeStair(){
  while(true){
    let x=Math.floor(Math.random()*MAP_SIZE)
    let y=Math.floor(Math.random()*MAP_SIZE)
    if(map[y][x]===0){
      stair.x=x
      stair.y=y
      return
    }
  }
}

function placeItems(){

  itemsOnFloor = []

  let count = Math.floor(Math.random()*5)+3 // 3〜7

  while(itemsOnFloor.length < count){

    let x = Math.floor(Math.random()*MAP_SIZE)
    let y = Math.floor(Math.random()*MAP_SIZE)

    if(map[y][x]===0 && !(x===stair.x && y===stair.y) &&
       !itemsOnFloor.some(it => it.x===x && it.y===y)){

      itemsOnFloor.push({
        x,
        y,
        data: rollItem()
      })
    }
  }
}
function rollItem(){
  return { ...ITEMS[Math.floor(Math.random()*ITEMS.length)] }
}
function getItemCounts(){

  const counts = {}

  player.inventory.forEach(item=>{
    if(!counts[item.name]){
      counts[item.name] = {
        item:item,
        count:0
      }
    }
    counts[item.name].count++
  })

  return Object.values(counts)
}

// ===== 視界 =====
function updateSeen(){
  let tx=Math.floor(player.x/TILE_SIZE)
  let ty=Math.floor(player.y/TILE_SIZE)

  for(let dy=-2;dy<=2;dy++){
    for(let dx=-2;dx<=2;dx++){
      let nx=tx+dx, ny=ty+dy
      if(nx>=0&&ny>=0&&nx<MAP_SIZE&&ny<MAP_SIZE){
        seen[ny][nx]=true
      }
    }
  }
}

// ===== 壁判定 =====
function isWall(x,y){
  let tx=Math.floor(x/TILE_SIZE)
  let ty=Math.floor(y/TILE_SIZE)
  return map[ty]?.[tx]===1
}

// ===== エンカウント =====
let encounterCounter=0
let encounterCooldown=0
let stairCooldown = 0
// ===== 更新 =====
function update(){
if(stairCooldown > 0) stairCooldown--
  


  // ★レベルアップ待ちがあれば選択画面へ
  if(mode==="explore" && pendingLevelUps>0 && player.hp>0){
    mode = "levelup"
    levelCursor = 0
    playLevelUpSE()
  }

  if(mode==="battle" || mode==="levelup") return
if(player.hp <= 0){
  mode = "gameover"
playBGM(sounds.bgm.gameover)
}
  let nx=player.x, ny=player.y
  let moved=false

  if(keys["w"]){ ny-=player.speed; moved=true }
  if(keys["s"]){ ny+=player.speed; moved=true }
  if(keys["a"]){ nx-=player.speed; moved=true }
  if(keys["d"]){ nx+=player.speed; moved=true }

  if(!isWall(nx,player.y)) player.x=nx
  if(!isWall(player.x,ny)) player.y=ny

  updateSeen()

  if(moved) encounterCounter++
  if(encounterCooldown>0) encounterCooldown--

  if(encounterCounter>40 && encounterCooldown===0){
    if(Math.random()<0.001){

      encounterCounter=0
      encounterCooldown=60

      let area=getArea(floor)
      currentBattle=battle(player,[],area)
      mode="battle"

      playBGM(sounds.bgm.battle[area.name] || sounds.bgm.battle.A)
    }
  }

  // ===== 階段 =====
  let tx=Math.floor(player.x/TILE_SIZE)
  let ty=Math.floor(player.y/TILE_SIZE)

itemsOnFloor = itemsOnFloor.filter(item=>{

  if(item.x===tx && item.y===ty){

    console.log(item.data.name + " を拾った！")
    pushToast(item.data)

    // ★保存
    if(item.data.type==="speed"){

  player.hasDash = true
  player.speed = player.baseSpeed * 2

  playSE(sounds.se.dash)

}else{

  player.inventory.push(item.data)
  playSE(sounds.se.itemPickup)

}

    return false
  }

  return true
})
  if(tx===stair.x && ty===stair.y && stairCooldown === 0){

  floor++
// ★ダッシューズ解除
player.hasDash = false
player.speed = player.baseSpeed
  stairCooldown = 30

  let start = generateMaze()
  player.x = start.sx * TILE_SIZE
  player.y = start.sy * TILE_SIZE

  placeStair()
  placeItems()
  updateSeen()

  if(Math.random() < 0.25){
    let up = Math.floor(Math.random()*6)+5
    player.maxHp += up
    player.hp += up
    console.log("最大HP+"+up)
  }

  if(Math.random() < 0.25){
    let up = Math.floor(Math.random()*11)+10
    player.maxMp += up
    player.mp += up
    console.log("最大MP+"+up)
  }

  // ★記録はHP・MPの上昇が両方終わってから更新
  // （レベルアップで得た分は記録しない＝リトライで元に戻る）
  if(player.maxHp - player.lvBonusHp > recordMaxHp){
    recordMaxHp = player.maxHp - player.lvBonusHp
  }
  if(player.maxMp - player.lvBonusMp > recordMaxMp){
    recordMaxMp = player.maxMp - player.lvBonusMp
  }

  if(player.hp > player.maxHp) player.hp = player.maxHp
  if(player.mp > player.maxMp) player.mp = player.maxMp
}

// 👇これが足りない！！
}
// ===== 描画 =====
// ===== 逃走成功SE（WebAudioで生成。音源ファイル不要）=====
let audioCtx = null
function playEscapeSE(){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const ac = audioCtx
    if(ac.state === "suspended") ac.resume()
    const t0 = ac.currentTime

    // 駆け抜ける上昇音
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(300, t0)
    osc.frequency.exponentialRampToValueAtTime(1400, t0+0.28)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.25, t0+0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, t0+0.32)
    osc.connect(g).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0+0.35)

    // 最後に「ピロン」と2音
    ;[[1046.5, 0.24],[1568, 0.34]].forEach(([f,st])=>{
      const o = ac.createOscillator()
      const gg = ac.createGain()
      o.type = "sine"
      o.frequency.value = f
      gg.gain.setValueAtTime(0.0001, t0+st)
      gg.gain.exponentialRampToValueAtTime(0.22, t0+st+0.02)
      gg.gain.exponentialRampToValueAtTime(0.0001, t0+st+0.22)
      o.connect(gg).connect(ac.destination)
      o.start(t0+st)
      o.stop(t0+st+0.25)
    })
  }catch(e){}
}

// ===== 敵の配置（描画とダメージ表示で共通）=====
function getEnemyLayout(count){
  const area = getArea(floor)
  let size = 96
  let gap = 20
  if(area && area.name === "J"){
    size = 320
    gap = 120
  }
  const totalWidth = count * size + (count - 1) * gap
  return {
    size, gap,
    startX: canvas.width / 2 - totalWidth / 2,
    y: canvas.height / 2 - size / 2
  }
}

// ===== ダメージ数字ポップアップ =====
let damagePopups = []
// index: 敵の並び順 / count: そのときの敵の数 / kind: normal | weak | resist | absorb
function spawnPopup(index, count, text, kind){
  const L = getEnemyLayout(count)
  damagePopups.push({
    x: L.startX + index*(L.size+L.gap) + L.size/2 + (Math.random()-0.5)*30,
    y: L.y + L.size*0.3,
    text, kind,
    born: performance.now()
  })
}

function drawDamagePopups(){
  const now = performance.now()
  const LIFE = 1000
  damagePopups = damagePopups.filter(p => now - p.born < LIFE)

  const STYLE = {
    normal:{ color:"#ffffff", size:34 },
    weak:  { color:"#ffd23f", size:46 },
    resist:{ color:"#9aa3b5", size:26 },
    absorb:{ color:"#5dff8a", size:34 },
    stun:  { color:"#c77dff", size:28 },
    kill:  { color:"#ff4d4d", size:44 }
  }

  ctx.save()
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.lineJoin = "round"

  for(const p of damagePopups){
    const t = (now - p.born) / LIFE
    const st = STYLE[p.kind] || STYLE.normal

    // ポンッと弾んでから上へ昇る
    const scale = t < 0.12 ? 0.5 + (t/0.12)*0.9
                : t < 0.25 ? 1.4 - ((t-0.12)/0.13)*0.4
                : 1
    const rise = 70 * (1 - Math.pow(1 - Math.min(1, t*1.4), 3))
    const alpha = t < 0.7 ? 1 : 1 - (t-0.7)/0.3

    const px = p.x
    const py = p.y - rise
    const fs = Math.round(st.size * scale)

    ctx.globalAlpha = alpha
    ctx.font = `bold ${fs}px sans-serif`
    ctx.lineWidth = 6
    ctx.strokeStyle = "rgba(0,0,0,0.85)"
    ctx.strokeText(p.text, px, py)
    ctx.fillStyle = st.color
    ctx.fillText(p.text, px, py)

    if(p.kind === "weak"){
      ctx.font = "bold 18px sans-serif"
      ctx.lineWidth = 4
      ctx.strokeText("WEAK!", px, py - fs*0.75)
      ctx.fillStyle = "#ff5a3d"
      ctx.fillText("WEAK!", px, py - fs*0.75)
    }
  }
  ctx.restore()
}

// ===== アイテムメニュー（効果つき）=====
const ITEM_COLORS = { hp:"#6fe38a", mp:"#6fb8ff", speed:"#ffb347", stun:"#c77dff" }

function itemEffectText(it){
  if(it.type === "hp") return "HP +" + it.value
  if(it.type === "mp") return "MP +" + it.value
  if(it.type === "speed") return "ダッシュ"
  if(it.type === "stun") return "全体拘束 " + it.value + "T"
  return ""
}

function drawItemMenu(b){
  const list = getItemCounts()
  const n = list.length
  if(n === 0) return

  const sel = Math.max(0, Math.min(b.itemIndex, n-1))
  const VIS = 6, ROW = 30
  const W = 380, H = 268
  const x0 = 30
  const y0 = canvas.height - H - 20
  const listY = y0 + 46

  ctx.save()
  ctx.textBaseline = "middle"

  // パネル
  ctx.fillStyle = "rgba(8,10,22,0.92)"
  rrect(x0, y0, W, H, 12)
  ctx.fill()
  ctx.strokeStyle = "rgba(160,190,255,0.45)"
  ctx.lineWidth = 1.5
  ctx.stroke()

  // ヘッダー：タイトル＋HP/MPゲージ
  ctx.textAlign = "left"
  ctx.font = "bold 16px sans-serif"
  ctx.fillStyle = "#9fc0ff"
  ctx.fillText("◆ アイテム", x0+16, y0+20)

  ctx.textAlign = "right"
  ctx.font = "13px sans-serif"
  ctx.fillStyle = ITEM_COLORS.hp
  ctx.fillText(`HP ${player.hp}/${player.maxHp}`, x0+W-110, y0+20)
  ctx.fillStyle = ITEM_COLORS.mp
  ctx.fillText(`MP ${player.mp}/${player.maxMp}`, x0+W-16, y0+20)

  const half = (W-32-10)/2
  ;[[x0+16, player.hp, player.maxHp, ITEM_COLORS.hp],
    [x0+16+half+10, player.mp, player.maxMp, ITEM_COLORS.mp]].forEach(([bx,v,mx,c])=>{
    ctx.fillStyle = "rgba(255,255,255,0.12)"
    ctx.fillRect(bx, y0+33, half, 4)
    ctx.fillStyle = c
    ctx.fillRect(bx, y0+33, half*(mx>0 ? Math.max(0,Math.min(1,v/mx)) : 0), 4)
  })

  // 一覧（スクロール）
  const top = Math.max(0, Math.min(sel-2, n-VIS))
  for(let r=0; r<VIS; r++){
    const i = top + r
    if(i >= n) break
    const { item, count } = list[i]
    const col = ITEM_COLORS[item.type] || "#ffffff"
    const isSel = (i === sel)
    const ry = listY + r*ROW
    const cy = ry + ROW/2

    if(isSel){
      const g = ctx.createLinearGradient(x0+10, 0, x0+W-22, 0)
      g.addColorStop(0, col+"66")
      g.addColorStop(1, col+"00")
      ctx.fillStyle = g
      rrect(x0+10, ry+1, W-32, ROW-2, 6)
      ctx.fill()
      ctx.fillStyle = col
      ctx.fillRect(x0+10, ry+4, 3, ROW-8)
    }

    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(x0+30, cy, 6, 0, Math.PI*2)
    ctx.fill()

    ctx.textAlign = "left"
    ctx.font = isSel ? "bold 18px sans-serif" : "16px sans-serif"
    ctx.fillStyle = isSel ? "#ffffff" : "#c8d2e6"
    ctx.fillText(item.name, x0+46, cy)

    ctx.font = "13px sans-serif"
    ctx.fillStyle = "#8f9ab3"
    ctx.fillText("×" + count, x0+205, cy)

    ctx.textAlign = "right"
    ctx.font = "bold 15px sans-serif"
    ctx.fillStyle = col
    ctx.fillText(itemEffectText(item), x0+W-26, cy)
  }

  // スクロールバー
  if(n > VIS){
    const trackH = VIS*ROW
    ctx.fillStyle = "rgba(255,255,255,0.10)"
    ctx.fillRect(x0+W-14, listY, 3, trackH)
    ctx.fillStyle = "rgba(160,190,255,0.7)"
    ctx.fillRect(x0+W-14, listY + trackH*(top/n), 3, trackH*(VIS/n))
  }

  // フッター：選択中アイテムの効果
  const fy = listY + VIS*ROW + 4
  ctx.fillStyle = "rgba(160,190,255,0.25)"
  ctx.fillRect(x0+12, fy, W-24, 1)

  const cur = list[sel].item
  ctx.textAlign = "left"
  ctx.font = "14px sans-serif"
  if(cur.type === "hp" || cur.type === "mp"){
    const key = cur.type, maxKey = cur.type === "hp" ? "maxHp" : "maxMp"
    const label = cur.type === "hp" ? "HP" : "MP"
    const gain = Math.min(cur.value, player[maxKey] - player[key])
    if(gain <= 0){
      ctx.fillStyle = "#8f9ab3"
      ctx.fillText(`${label}は満タン（使っても回復しない）`, x0+16, fy+14)
    }else{
      ctx.fillStyle = ITEM_COLORS[cur.type]
      ctx.fillText(`${label} ${player[key]} → ${player[key]+gain}（+${gain}）`, x0+16, fy+14)
    }
  }else if(cur.type === "stun"){
    ctx.fillStyle = ITEM_COLORS.stun
    ctx.fillText(`相手全体を${cur.value}ターン動けなくする`, x0+16, fy+14)
  }else{
    ctx.fillStyle = "#ffb347"
    ctx.fillText("戦闘中は使えない", x0+16, fy+14)
  }

  ctx.font = "12px sans-serif"
  ctx.fillStyle = "#7f8aa3"
  ctx.fillText("↑↓ 選択　Enter 使う　Space 戻る", x0+16, fy+33)

  ctx.restore()
}

// ===== マップの「拾った！」通知 =====
let mapToasts = []
function pushToast(item){
  let sub = ""
  if(item.type === "hp") sub = "回復アイテム　HP +" + item.value
  else if(item.type === "mp") sub = "回復アイテム　MP +" + item.value
  else if(item.type === "speed") sub = "移動速度アップ（階段まで）"
  else if(item.type === "stun") sub = "戦闘で使える　相手全体を" + item.value + "ターン拘束"
  mapToasts.push({
    title: item.name + " を拾った！",
    sub,
    color: ITEM_COLORS[item.type] || "#ffffff",
    born: performance.now()
  })
  if(mapToasts.length > 4) mapToasts.shift()
}

function pushToastCustom(title, sub, color){
  mapToasts.push({ title, sub, color, born: performance.now(), life: 5000 })
  if(mapToasts.length > 4) mapToasts.shift()
}

function drawToasts(){
  const now = performance.now()
  mapToasts = mapToasts.filter(t => now - t.born < (t.life || 2800))
  if(mapToasts.length === 0) return

  const W = 340, H = 46, GAP = 8
  const x = canvas.width - W - 20
  const baseY = canvas.height - H - 24

  ctx.save()
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"

  mapToasts.forEach((t, i) => {
    const age = now - t.born
    const inT = Math.min(1, age/180)
    const LIFE = t.life || 2800
    const out = age > LIFE-500 ? (LIFE-age)/500 : 1
    const y = baseY - (mapToasts.length-1-i)*(H+GAP) + (1-inT)*14

    ctx.globalAlpha = inT * out
    ctx.fillStyle = "rgba(8,10,22,0.88)"
    rrect(x, y, W, H, 10)
    ctx.fill()
    ctx.strokeStyle = t.color
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = t.color
    ctx.fillRect(x+6, y+8, 3, H-16)

    ctx.font = "bold 16px sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(t.title, x+20, y+16)
    ctx.font = "12px sans-serif"
    ctx.fillStyle = t.color
    ctx.fillText(t.sub, x+20, y+34)
  })
  ctx.restore()
}

// ===== レベルシステム =====
const LEVEL_CAP = 5   // SPEED / PHYSICAL を上げられる回数

// 次のレベルまでに必要な撃破数（ここを変えると調整できる）
function expToNext(level){
  return 4 + level
}

// 敵を1体倒すたびに呼ばれる
function gainExp(n){
  player.exp += n
  while(player.exp >= expToNext(player.level)){
    player.exp -= expToNext(player.level)
    player.level++
    pendingLevelUps++
    currentBattle?.log.push("レベルアップ！ Lv" + player.level)
  }
}

function playLevelUpSE(){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const ac = audioCtx
    if(ac.state === "suspended") ac.resume()
    const t0 = ac.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f,i)=>{
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = "triangle"
      o.frequency.value = f
      const st = t0 + i*0.09
      g.gain.setValueAtTime(0.0001, st)
      g.gain.exponentialRampToValueAtTime(0.22, st+0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, st+0.3)
      o.connect(g).connect(ac.destination)
      o.start(st)
      o.stop(st+0.32)
    })
  }catch(e){}
}

const fmt2 = v => (Math.round(v*100)/100).toFixed(2)

const LEVEL_CHOICES = [
  { key:"ATK", color:"#ff6a3d", desc:"攻撃力が1.2倍になる",
    preview:()=>`攻撃力 ×${fmt2(player.atkMul)} → ×${fmt2(player.atkMul*1.2)}` },
  { key:"PHYSICAL", color:"#e8a0ff", lvKey:"physLv",
    desc:"斬りつけ・正拳突き・ピストル ×1.6、被ダメージ ×0.9",
    preview:()=>`物理技 ×${fmt2(player.physMul)} → ×${fmt2(player.physMul*1.6)}　被ダメ ×${fmt2(player.dmgTakenMul)} → ×${fmt2(player.dmgTakenMul*0.9)}` },
  { key:"RECOVER", color:"#6fe38a", desc:"HPとMPが最大まで回復する",
    preview:()=>`HP ${player.hp}/${player.maxHp}　MP ${player.mp}/${player.maxMp}` },
  { key:"MAXHP", color:"#ff8fa3", desc:"最大HPが20上がる",
    preview:()=>`最大HP ${player.maxHp} → ${player.maxHp+20}` },
  { key:"MAXMP", color:"#6fb8ff", desc:"最大MPが30上がる",
    preview:()=>`最大MP ${player.maxMp} → ${player.maxMp+30}` },
  { key:"SPEED", color:"#ffb347", lvKey:"speedLv", desc:"基本の移動速度が1.3倍になる",
    preview:()=>`移動速度 ${fmt2(player.baseSpeed)} → ${fmt2(player.baseSpeed*1.3)}` },
  { key:"NEWSKILL", color:"#5df2c9",
    desc:"ランダムで新しい技を1つ覚える",
    preview:()=>`習得済み ${player.learnedSkills.length}/${NEW_SKILL_ORDER.length}`,
    avail:()=> player.learnedSkills.length < NEW_SKILL_ORDER.length,
    counter:()=> `${player.learnedSkills.length}/${NEW_SKILL_ORDER.length}`,
    maxText:"全習得", noText:"覚えられる技がもうない" }
]

// 5/5に達した選択肢は選べない
function choiceAvailable(i){
  const c = LEVEL_CHOICES[i]
  if(c.avail) return c.avail()
  return !c.lvKey || player[c.lvKey] < LEVEL_CAP
}

// NEW SKILL：まだ覚えていない技からランダムに1つ習得
function learnRandomSkill(){
  const pool = NEW_SKILL_ORDER.filter(n => !player.learnedSkills.includes(n))
  if(pool.length === 0) return
  const pick = pool[Math.floor(Math.random()*pool.length)]
  player.learnedSkills.push(pick)
  const info = NEW_SKILLS[pick]
  pushToastCustom(
    "新技習得！ " + pick,
    (info.kind === "spell" ? "魔法　" : "攻撃　") + info.desc,
    info.kind === "spell" ? "#6fb8ff" : "#ff9f68"
  )
}

function applyLevelUp(i){
  if(!choiceAvailable(i)) return
  const k = LEVEL_CHOICES[i].key
  if(k === "ATK"){
    player.atkMul *= 1.2
  }else if(k === "PHYSICAL"){
    player.physLv++
    player.physMul *= 1.6
    player.dmgTakenMul *= 0.9
  }else if(k === "RECOVER"){
    player.hp = player.maxHp
    player.mp = player.maxMp
  }else if(k === "MAXHP"){
    player.maxHp += 20
    player.hp += 20
    player.lvBonusHp += 20
  }else if(k === "MAXMP"){
    player.maxMp += 30
    player.mp += 30
    player.lvBonusMp += 30
  }else if(k === "SPEED"){
    player.speedLv++
    player.baseSpeed *= 1.3
    player.speed = player.hasDash ? player.baseSpeed*2 : player.baseSpeed
  }else if(k === "NEWSKILL"){
    learnRandomSkill()
  }
  playSE(sounds.se.itemHeal)

  pendingLevelUps--
  levelCursor = 0
  if(pendingLevelUps <= 0){
    pendingLevelUps = 0
    mode = "explore"
  }
}

function moveLevelCursor(dir){
  const n = LEVEL_CHOICES.length
  for(let k=0; k<n; k++){
    levelCursor = (levelCursor + dir + n) % n
    if(choiceAvailable(levelCursor)) return
  }
}

function handleLevelUpKey(e){
  const n = LEVEL_CHOICES.length
  if(e.key==="ArrowUp" || e.key==="w" || e.key==="W"){
    moveLevelCursor(-1)
  }else if(e.key==="ArrowDown" || e.key==="s" || e.key==="S"){
    moveLevelCursor(1)
  }else if(e.key>="1" && e.key<=String(n)){
    const i = Number(e.key) - 1
    if(choiceAvailable(i)) levelCursor = i
  }else if(e.key==="Enter" && !e.repeat){
    applyLevelUp(levelCursor)
  }
}

// レベルゲージ（探索画面・戦闘画面で共通）
function drawLevelGauge(x, y, w){
  const need = expToNext(player.level)
  const ratio = Math.max(0, Math.min(1, player.exp / need))

  ctx.save()
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.font = "bold 16px sans-serif"
  ctx.fillStyle = "#ffd23f"
  ctx.fillText("Lv " + player.level, x, y)

  ctx.textAlign = "right"
  ctx.font = "12px sans-serif"
  ctx.fillStyle = "#cfd6e6"
  ctx.fillText(`${player.exp} / ${need}`, x + w, y)

  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.fillRect(x, y+6, w, 8)
  const g = ctx.createLinearGradient(x, 0, x+w, 0)
  g.addColorStop(0, "#ffb347")
  g.addColorStop(1, "#ffe066")
  ctx.fillStyle = g
  ctx.fillRect(x, y+6, w*ratio, 8)
  ctx.strokeStyle = "rgba(255,255,255,0.35)"
  ctx.lineWidth = 1
  ctx.strokeRect(x+0.5, y+6.5, w-1, 7)
  ctx.restore()
}

function drawLevelUpMenu(){
  const n = LEVEL_CHOICES.length
  const ROW = 50
  const W = Math.min(640, canvas.width - 20)
  const H = 16 + 30 + 24 + n*ROW + 40
  const x0 = Math.round(canvas.width/2 - W/2)
  const y0 = Math.round(Math.max(10, canvas.height/2 - H/2))

  ctx.save()
  ctx.fillStyle = "rgba(0,0,0,0.65)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "rgba(8,10,22,0.96)"
  rrect(x0, y0, W, H, 14)
  ctx.fill()
  ctx.strokeStyle = "rgba(255,210,63,0.7)"
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  ctx.font = "bold 22px sans-serif"
  ctx.fillStyle = "#ffd23f"
  const lv = player.level - pendingLevelUps + 1
  ctx.fillText("◆ LEVEL UP！　Lv " + lv, x0+22, y0+30)

  ctx.font = "13px sans-serif"
  ctx.fillStyle = "#9aa3b5"
  ctx.fillText(pendingLevelUps > 1 ? `強化を選んでね（あと${pendingLevelUps}回）` : "強化を1つ選んでね", x0+22, y0+56)

  const listY = y0 + 70
  LEVEL_CHOICES.forEach((c,i)=>{
    const ry = listY + i*ROW
    const ok = choiceAvailable(i)
    const sel = (i === levelCursor) && ok

    if(sel){
      const g = ctx.createLinearGradient(x0+12, 0, x0+W-12, 0)
      g.addColorStop(0, c.color+"66")
      g.addColorStop(1, c.color+"08")
      ctx.fillStyle = g
      rrect(x0+12, ry+2, W-24, ROW-4, 8)
      ctx.fill()
      ctx.fillStyle = c.color
      ctx.fillRect(x0+12, ry+8, 4, ROW-16)
    }

    ctx.textAlign = "left"
    ctx.font = sel ? "bold 21px sans-serif" : "bold 19px sans-serif"
    ctx.fillStyle = !ok ? "#555c6e" : (sel ? c.color : "#b8c0d4")
    ctx.fillText(c.key, x0+28, ry+ROW/2)

    ctx.font = sel ? "bold 15px sans-serif" : "14px sans-serif"
    ctx.fillStyle = !ok ? "#555c6e" : (sel ? "#ffffff" : "#c8d2e6")
    ctx.fillText(c.desc, x0+150, ry+ROW/2-10)

    ctx.font = "12px sans-serif"
    ctx.fillStyle = !ok ? "#555c6e" : (sel ? c.color : "#8f9ab3")
    ctx.fillText(ok ? c.preview() : (c.noText || "これ以上強化できない"), x0+150, ry+ROW/2+11)

    // 強化回数（5/5 など）
    const cnt = c.lvKey ? `${player[c.lvKey]}/${LEVEL_CAP}` : (c.counter ? c.counter() : null)
    if(cnt){
      ctx.textAlign = "right"
      ctx.font = "bold 14px sans-serif"
      ctx.fillStyle = ok ? c.color : "#ff6b6b"
      ctx.fillText(ok ? cnt : (c.maxText || `MAX ${cnt}`), x0+W-26, ry+ROW/2)
    }
  })

  ctx.textAlign = "center"
  ctx.font = "12px sans-serif"
  ctx.fillStyle = "#7f8aa3"
  ctx.fillText("↑↓ 選択　Enter 決定", x0+W/2, y0+H-20)
  ctx.restore()
}

// ===== 画面中央下の自分のHPバー =====
let hpTrail = null
function drawPlayerHpBar(){
  const W = Math.round(Math.min(280, canvas.width*0.32))
  const H = 20
  const x = Math.round(canvas.width/2 - W/2)
  const y = canvas.height - H - 22
  const ratio = player.maxHp > 0 ? Math.max(0, Math.min(1, player.hp/player.maxHp)) : 0

  // 回復したら即追従、ダメージ時は遅れて減る
  if(hpTrail === null || hpTrail < player.hp) hpTrail = player.hp
  else hpTrail = Math.max(player.hp, hpTrail - player.maxHp*0.004)
  const trailRatio = player.maxHp > 0 ? Math.max(0, Math.min(1, hpTrail/player.maxHp)) : 0

  ctx.save()
  ctx.fillStyle = "rgba(0,0,0,0.65)"
  rrect(x-3, y-3, W+6, H+6, 8)
  ctx.fill()

  ctx.fillStyle = "rgba(255,255,255,0.10)"
  rrect(x, y, W, H, 5)
  ctx.fill()

  if(trailRatio > ratio){
    ctx.fillStyle = "rgba(255,255,255,0.55)"
    rrect(x, y, W*trailRatio, H, 5)
    ctx.fill()
  }
  if(ratio > 0){
    ctx.fillStyle = ratio > 0.5 ? "#4cd964" : (ratio > 0.25 ? "#ffcc00" : "#ff453a")
    rrect(x, y, W*ratio, H, 5)
    ctx.fill()
  }

  ctx.strokeStyle = "rgba(255,255,255,0.45)"
  ctx.lineWidth = 1.5
  rrect(x, y, W, H, 5)
  ctx.stroke()

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = "bold 13px sans-serif"
  ctx.lineWidth = 3
  ctx.strokeStyle = "rgba(0,0,0,0.8)"
  ctx.lineJoin = "round"
  const label = `HP ${player.hp} / ${player.maxHp}`
  ctx.strokeText(label, x+W/2, y+H/2+1)
  ctx.fillStyle = "#ffffff"
  ctx.fillText(label, x+W/2, y+H/2+1)
  ctx.restore()
}

// ===== 魔法メニュー（スタイリッシュ版）=====
const SPELL_COLORS = {
  "火炎":"#ff6a3d","氷結":"#6fd8ff","電撃":"#fff04d","疾風":"#7dffb0",
  "核熱":"#b6ff3d","念動":"#ff7de9","地震":"#c4915a","流水":"#4d8dff",
  "黄金":"#e0a82e","猛毒":"#a95dff","光":"#fffbd0","闇":"#8a5cff","万能":"#ffffff",
  "斬撃":"#d5dcf0","打撃":"#ff9f68","銃撃":"#b8bec9",
  "回復":"#6fe38a","逃走":"#ffb347","解析":"#5df2c9"
}

function rrect(x,y,w,h,r){
  ctx.beginPath()
  if(ctx.roundRect) ctx.roundRect(x,y,w,h,r)
  else ctx.rect(x,y,w,h)
}

// ===== 技メニュー（攻撃 / 魔法 共通）=====
function skillUsable(name){
  const info = NEW_SKILLS[name]
  if(SPELL_COST[name] && player.mp < SPELL_COST[name]) return false
  if(info && info.hpCost && player.hp <= info.hpCost) return false
  return true
}

function skillShortMsg(name){
  const info = NEW_SKILLS[name]
  if(SPELL_COST[name] && player.mp < SPELL_COST[name]) return "MPが足りない！"
  if(info && info.hpCost && player.hp <= info.hpCost) return "HPが足りない！"
  return ""
}

function skillDesc(name){
  const info = NEW_SKILLS[name]
  if(info) return info.desc
  return `相手1体に${spellToType(name)}属性のダメージ`
}

function drawSkillMenu(b, kind){
  const isAttack = (kind === "attack")
  const list = isAttack ? b.attackSkills : b.spells
  const sel  = isAttack ? b.attackIndex : b.spellIndex
  const n = list.length
  const VIS = 6, ROW = 30
  const W = 400, H = 292
  const x0 = 30
  const y0 = canvas.height - H - 20
  const listY = y0 + 46

  ctx.save()
  ctx.textBaseline = "middle"

  // --- パネル ---
  ctx.fillStyle = "rgba(8,10,22,0.92)"
  rrect(x0, y0, W, H, 12)
  ctx.fill()
  ctx.strokeStyle = "rgba(160,190,255,0.45)"
  ctx.lineWidth = 1.5
  ctx.stroke()

  // --- ヘッダー（タイトル＋HP/MP）---
  ctx.textAlign = "left"
  ctx.font = "bold 16px sans-serif"
  ctx.fillStyle = "#9fc0ff"
  ctx.fillText(isAttack ? "◆ 攻撃" : "◆ 魔法", x0+16, y0+20)

  ctx.textAlign = "right"
  ctx.font = "13px sans-serif"
  ctx.fillStyle = ITEM_COLORS.hp
  ctx.fillText(`HP ${player.hp}/${player.maxHp}`, x0+W-120, y0+20)
  ctx.fillStyle = ITEM_COLORS.mp
  ctx.fillText(`MP ${player.mp}/${player.maxMp}`, x0+W-16, y0+20)

  const half = (W-32-10)/2
  ;[[x0+16, player.hp, player.maxHp, ITEM_COLORS.hp],
    [x0+16+half+10, player.mp, player.maxMp, ITEM_COLORS.mp]].forEach(([bx,v,mx,c])=>{
    ctx.fillStyle = "rgba(255,255,255,0.12)"
    ctx.fillRect(bx, y0+33, half, 4)
    ctx.fillStyle = c
    ctx.fillRect(bx, y0+33, half*(mx>0 ? Math.max(0,Math.min(1,v/mx)) : 0), 4)
  })

  // --- 一覧（スクロール）---
  const top = Math.max(0, Math.min(sel-2, n-VIS))

  for(let r=0; r<VIS; r++){
    const i = top + r
    if(i >= n) break

    const name = list[i]
    const info = NEW_SKILLS[name]
    const type = spellToType(name)
    const col  = SPELL_COLORS[type] || "#ffffff"
    const ok   = skillUsable(name)
    const isSel = (i === sel)
    const ry   = listY + r*ROW
    const cy   = ry + ROW/2

    if(isSel){
      const g = ctx.createLinearGradient(x0+10, 0, x0+W-22, 0)
      g.addColorStop(0, col+"66")
      g.addColorStop(1, col+"00")
      ctx.fillStyle = g
      rrect(x0+10, ry+1, W-32, ROW-2, 6)
      ctx.fill()
      ctx.fillStyle = col
      ctx.fillRect(x0+10, ry+4, 3, ROW-8)
    }

    // 属性カラーの点
    ctx.globalAlpha = ok ? 1 : 0.35
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(x0+30, cy, 6, 0, Math.PI*2)
    ctx.fill()
    ctx.globalAlpha = 1

    // 名前
    ctx.textAlign = "left"
    ctx.font = isSel ? "bold 17px sans-serif" : "16px sans-serif"
    ctx.fillStyle = ok ? (isSel ? "#ffffff" : "#c8d2e6") : "#6b7385"
    ctx.fillText(name, x0+46, cy)

    // 属性名
    ctx.font = "12px sans-serif"
    ctx.fillStyle = ok ? "#8f9ab3" : "#5a6378"
    ctx.fillText(type, x0+212, cy)

    // 全体タグ
    if(info && info.target === "all"){
      ctx.fillStyle = "rgba(255,255,255,0.14)"
      rrect(x0+252, cy-8, 28, 16, 8)
      ctx.fill()
      ctx.textAlign = "center"
      ctx.font = "11px sans-serif"
      ctx.fillStyle = "#dfe6f5"
      ctx.fillText("全体", x0+266, cy)
    }

    // コスト列
    let costTxt = "", unit = "", costCol = "#8fd0ff"
    if(SPELL_COST[name]){
      costTxt = String(SPELL_COST[name]); unit = "MP"
      costCol = ok ? "#8fd0ff" : "#ff6b6b"
    }else if(info && info.hpCost){
      costTxt = String(info.hpCost); unit = "HP"
      costCol = ok ? "#ff9aa8" : "#ff6b6b"
    }else if(info && info.mpGain){
      costTxt = "+" + info.mpGain; unit = "MP"
      costCol = "#6fe38a"
    }
    if(costTxt){
      ctx.textAlign = "right"
      ctx.font = "bold 16px sans-serif"
      ctx.fillStyle = costCol
      ctx.fillText(costTxt, x0+W-26, cy)
      const tw = ctx.measureText(costTxt).width
      ctx.font = "11px sans-serif"
      ctx.fillStyle = "#7f8aa3"
      ctx.fillText(unit, x0+W-26-tw-4, cy)
    }
  }

  // スクロールバー
  if(n > VIS){
    const trackH = VIS*ROW
    ctx.fillStyle = "rgba(255,255,255,0.10)"
    ctx.fillRect(x0+W-14, listY, 3, trackH)
    ctx.fillStyle = "rgba(160,190,255,0.7)"
    ctx.fillRect(x0+W-14, listY + trackH*(top/n), 3, trackH*(VIS/n))
  }

  // --- フッター ---
  const fy = listY + VIS*ROW + 4
  ctx.fillStyle = "rgba(160,190,255,0.25)"
  ctx.fillRect(x0+12, fy, W-24, 1)

  const cur = list[sel]
  const cinfo = NEW_SKILLS[cur]
  const ctype = spellToType(cur)
  const support = ["回復","逃走","解析"].includes(ctype)

  ctx.textAlign = "left"
  ctx.font = "14px sans-serif"
  ctx.fillStyle = SPELL_COLORS[ctype] || "#fff"
  ctx.fillText((support ? "種類：" : "属性：") + ctype, x0+16, fy+14)

  ctx.textAlign = "right"
  if(!skillUsable(cur)){
    ctx.fillStyle = "#ff6b6b"
    if(SPELL_COST[cur] && player.mp < SPELL_COST[cur]){
      ctx.fillText(`MP不足（あと${SPELL_COST[cur]-player.mp}）`, x0+W-16, fy+14)
    }else{
      ctx.fillText(`HP不足（${cinfo.hpCost+1}以上必要）`, x0+W-16, fy+14)
    }
  }else if(SPELL_COST[cur]){
    ctx.fillStyle = "#cfe3ff"
    ctx.fillText(`MP ${player.mp} → ${player.mp-SPELL_COST[cur]}`, x0+W-16, fy+14)
  }else if(cinfo && cinfo.hpCost){
    ctx.fillStyle = "#ffc2cb"
    ctx.fillText(`HP ${player.hp} → ${player.hp-cinfo.hpCost}`, x0+W-16, fy+14)
  }else if(cinfo && cinfo.mpGain){
    ctx.fillStyle = "#b8f5c8"
    ctx.fillText(`MP ${player.mp} → ${Math.min(player.maxMp, player.mp+cinfo.mpGain)}`, x0+W-16, fy+14)
  }

  ctx.textAlign = "left"
  ctx.font = "12px sans-serif"
  ctx.fillStyle = "#aab4cc"
  ctx.fillText(skillDesc(cur), x0+16, fy+32)

  ctx.fillStyle = "#7f8aa3"
  ctx.fillText("↑↓ 選択　←→ 対象　Enter 決定　Space 戻る", x0+16, fy+51)

  ctx.restore()
}

function draw(){
if(mode === "title"){

  // 背景
  ctx.drawImage(titleBg, 0, 0, canvas.width, canvas.height)

  // タイトル
  ctx.fillStyle = "yellow"
  ctx.font = "48px sans-serif"
  ctx.textAlign = "center"

  ctx.fillText(
    "Shadow Labyrinth",
    canvas.width/2,
    canvas.height/3
  )

  // ボタン
  const btnX = canvas.width/2
  const btnY = canvas.height/2 + 100

  ctx.fillStyle = "white"
  ctx.font = "28px sans-serif"
  ctx.fillText(audioUnlocked ? "始める" : "クリックで開始", btnX, btnY)

  // ★クリック判定用に保存
  titleButton = {
    x: btnX - 80,
    y: btnY - 30,
    w: 160,
    h: 50
  }

  return
}
if(mode === "gameover"){
  ctx.fillStyle = "black"
  ctx.fillRect(0,0,canvas.width,canvas.height)

  ctx.fillStyle = "red"
  ctx.font = "40px sans-serif"
  ctx.fillText("GAME OVER", canvas.width/2-120, canvas.height/2-40)

  ctx.fillStyle = "white"
  ctx.font = "20px sans-serif"
  ctx.fillText("結果 " + floor + "階", canvas.width/2-80, canvas.height/2+10)
  ctx.fillText("Rでリトライ", canvas.width/2-80, canvas.height/2+40)

  return
}
  if(mode==="battle"){
  ctx.fillStyle="black"
  ctx.fillRect(0,0,canvas.width,canvas.height)
ctx.textAlign = "left"
  ctx.fillStyle="white"
  ctx.font="18px sans-serif"

  // ===== ログ（左上）=====
  let logs=currentBattle.log.slice(-6)
  logs.forEach((t,i)=>{
    ctx.fillText(t,30,40+i*22)
  })
// ===== 敵HP（右上）=====
currentBattle.enemies.forEach((enemy, i) => {

  let prefix = (i === currentBattle.targetIndex) ? "▶ " : "　"

  ctx.fillStyle = "white"
  ctx.font = "18px sans-serif"

  ctx.fillText(
    prefix + enemy.name + " HP:" + enemy.hp,
    canvas.width - 260,
    40 + i * 24
  )
})
// ===== 敵画像（中央横並び）=====
// ===== 敵画像（中央横並び）=====
const enemies = currentBattle.enemies

// ★ エリア取得
const area = getArea(floor)

const { size, gap, startX, y } = getEnemyLayout(enemies.length)

enemies.forEach((enemy, i) => {
  const img = enemyImages[enemy.name]
  const x = startX + i * (size + gap)

  if(img){
    ctx.drawImage(img, x, y, size, size)
  }

  // ★拘束中の表示
  if(enemy.stun > 0){
    ctx.save()
    ctx.fillStyle = "rgba(160,90,255,0.28)"
    ctx.fillRect(x, y, size, size)
    ctx.strokeStyle = "#c77dff"
    ctx.lineWidth = 2
    ctx.strokeRect(x+1, y+1, size-2, size-2)
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "center"
    ctx.fillStyle = "#e3b8ff"
    ctx.fillText("拘束 " + enemy.stun, x + size/2, y + size + 16)
    ctx.restore()
  }

  // ★サーチ：弱点を頭上に出し続ける
  if(enemy.searched && enemy.weak && enemy.weak.length > 0){
    ctx.save()
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    const label = "弱点 "
    const parts = enemy.weak
    let total = ctx.measureText(label).width
    parts.forEach(p => { total += ctx.measureText(p + " ").width })
    let tx = x + size/2 - total/2
    const ty = y - 34
    ctx.fillStyle = "rgba(0,0,0,0.65)"
    rrect(tx-8, ty-12, total+16, 24, 8)
    ctx.fill()
    ctx.fillStyle = "#ffffff"
    ctx.fillText(label, tx, ty)
    tx += ctx.measureText(label).width
    parts.forEach(p => {
      ctx.fillStyle = SPELL_COLORS[p] || "#ffd23f"
      ctx.fillText(p + " ", tx, ty)
      tx += ctx.measureText(p + " ").width
    })
    ctx.restore()
  }

  // ▼ターゲット
  if(i === currentBattle.targetIndex){
    ctx.fillStyle = "yellow"
    ctx.fillText("▼", x + size/2 - 5, y - 10)
  }
})

  // ===== ダメージ数字 =====
  drawDamagePopups()

  // ===== コマンド（左下）=====
  if(currentBattle.phase==="command"){
    currentBattle.commands.forEach((cmd,i)=>{
      let prefix=(i===currentBattle.commandIndex)?"▶ ":"　"
      ctx.fillText(
        prefix+cmd,
        30,
        canvas.height-120+i*24
      )
    })
  }

if(currentBattle.phase==="attack"){
  drawSkillMenu(currentBattle, "attack")
}
  // ===== 魔法メニュー =====
  if(currentBattle.phase==="spell"){
    drawSkillMenu(currentBattle, "spell")
  }

if(currentBattle.phase==="item"){
  drawItemMenu(currentBattle)
}
  // ===== キャンセルのヒント =====
  if(currentBattle.result===null && currentBattle.turn==="player" &&
     [].includes(currentBattle.phase)){
    ctx.fillStyle="yellow"
    ctx.fillText("Space / Esc：戻る", 30, canvas.height-150)
    ctx.fillStyle="white"
  }

  // ===== 進行ヒント =====
  if(currentBattle.result===null && currentBattle.turn==="enemy" && currentBattle.waitingInput){
    ctx.fillStyle="yellow"
    ctx.fillText("▼ Enter / クリックで進む", 30, canvas.height-150)
    ctx.fillStyle="white"
  }

  // ===== 自分のHPバー（中央下）=====
  drawPlayerHpBar()

  // ===== レベルゲージ =====
  drawLevelGauge(canvas.width-200, canvas.height-100, 160)

  // ===== HP / MP（右下）=====
  ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, canvas.width-200, canvas.height-60)
ctx.fillText(`MP: ${player.mp}/${player.maxMp}`, canvas.width-200, canvas.height-30)

  return
}
  ctx.fillStyle="black"
  ctx.fillRect(0,0,canvas.width,canvas.height)

  const camX=player.x-canvas.width/2
  const camY=player.y-canvas.height/2

  let area = getArea(floor) || {color:"#000", name:"?"} // ←これ追加！！

  for(let y=0;y<MAP_SIZE;y++){
    for(let x=0;x<MAP_SIZE;x++){
      if(!seen[y][x]) continue
      // ★床色
let floorColor = "#222"

// ★Lエリアだけ黄土色
if(area && area.name === "L"){
  floorColor = "#c2a060"
}

ctx.fillStyle = map[y][x] ? area.color : floorColor
      ctx.fillRect(x*TILE_SIZE-camX,y*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE)
    }
  }

  // 階段
  if(seen[stair.y][stair.x]){
    ctx.drawImage(
      stairImg,
      stair.x*TILE_SIZE-camX,
      stair.y*TILE_SIZE-camY,
      TILE_SIZE,
      TILE_SIZE
    )
  }

  // プレイヤー
  ctx.fillStyle = player.hasDash ? "#aaffff" : "white"
  ctx.fillRect(canvas.width/2-10,canvas.height/2-10,20,20)

ctx.fillStyle = "white"
ctx.font = "18px sans-serif"

ctx.textAlign = "left"

area = getArea(floor)

ctx.fillText("Area: " + area.name, 20, 30)
ctx.fillText("Floor: " + floor, 20, 55)
drawLevelGauge(20, 85, 160)

itemsOnFloor.forEach(item=>{
  if(!seen[item.y][item.x]) return

  ctx.drawImage(
    itemImg,
    item.x*TILE_SIZE-camX,
    item.y*TILE_SIZE-camY,
    TILE_SIZE,
    TILE_SIZE
  )
})
// ===== ミニマップ =====
const miniSize = 6          // 1マスのサイズ
const miniMapSize = MAP_SIZE * miniSize

const offsetX = 20
const offsetY = canvas.height - miniMapSize - 20

// 背景（見やすくする）
ctx.fillStyle = "rgba(0,0,0,0.6)"
ctx.fillRect(offsetX-4, offsetY-4, miniMapSize+8, miniMapSize+8)

// エリア取得
const miniArea = getArea(floor) || { color:"#fff" }

// マップ描画
for(let y=0; y<MAP_SIZE; y++){
  for(let x=0; x<MAP_SIZE; x++){
if(!seen[y][x]) continue

    if(map[y][x] === 1){
      // 壁 → エリアカラー
      ctx.fillStyle = miniArea.color
    }else{
      // 床 → 黒
      ctx.fillStyle = "#111"
    }

    ctx.fillRect(
      offsetX + x * miniSize,
      offsetY + y * miniSize,
      miniSize,
      miniSize
    )
  }
}

// ===== アイテム（茶色）=====
ctx.fillStyle = "#8B4513"
itemsOnFloor.forEach(item=>{
  ctx.fillRect(
    offsetX + item.x * miniSize,
    offsetY + item.y * miniSize,
    miniSize,
    miniSize
  )
})

// ===== 階段（暗い赤）=====
ctx.fillStyle = "#660000"
ctx.fillRect(
  offsetX + stair.x * miniSize,
  offsetY + stair.y * miniSize,
  miniSize,
  miniSize
)

// ===== プレイヤー（白）=====
const px = Math.floor(player.x / TILE_SIZE)
const py = Math.floor(player.y / TILE_SIZE)

ctx.fillStyle = "white"
ctx.fillRect(
  offsetX + px * miniSize,
  offsetY + py * miniSize,
  miniSize,
  miniSize
)

drawPlayerHpBar()
drawToasts()

if(mode === "levelup") drawLevelUpMenu()
}

// ===== ループ =====
// 画面のリフレッシュレートに関係なく、update を 60回/秒 で回す
const STEP = 1000 / 60
let lastTime = performance.now()
let acc = 0
function loop(now){
  acc += Math.min(now - lastTime, 250)   // タブ復帰時などの暴走防止
  lastTime = now
  while(acc >= STEP){
    update()
    acc -= STEP
  }
  draw()
  requestAnimationFrame(loop)
}

// ===== 初期化 =====
let start=generateMaze()
player.x=start.sx*TILE_SIZE
player.y=start.sy*TILE_SIZE

placeStair()
placeItems()
updateSeen()
playBGM(sounds.bgm.title)
requestAnimationFrame(loop)