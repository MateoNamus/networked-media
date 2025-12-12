// =====================
// Speaker colors
// =====================
const speakerColors = {
  "OLD_MAN": "#ffffff",
  "YOU": "#ffffff",
  "PLAYER": "#ffffff",

  "perA": "#003366",
  "perB": "#004d26",
  "perC": "#4d2e00",
  "perD": "#3a0057",
  "perE": "#660000",
  "perF": "#006666",
  "perG": "#66004d",
  "perH": "#cc5500"
};

let script = [];

const typingSpeed = 40;
const pauseAfterLine = 500;
const slideDuration = 250;

let currentBranchId = "campfire-intro";
let endReflectionShown = false;

let historyViewport;
let historyList;
let currentLine;
let choiceArea;
let choiceButtons;
let narrationText;

let isTyping = false;
let scriptIndex = 0;

let narrationFadeTimeout = null;
let narrationClearTimeout = null;

let titleScreen;
let stickmanContainer;
let stickmanArt;
let introStarted = false;
let stickmanInterval = null;
let stickmanX = 120;          
const stickmanTargetX = 55;   

const stickmanFrames = [
  "  O\n /|\\\n / \\",
  "  O\n /|\\\n /< ",
  "  O\n /|\\\n /| ",
  "  O\n /|\\\n <| "
];
let stickmanFrameIndex = 0;

let oldManContainer;
let oldManArt;
let oldManInterval = null;
let oldManX = -20;           
const oldManTargetX = 40;    

const oldManFrames = [
  " _M_\n  O\n /|\\\n / \\",
  " _M_\n  O\n /|\\\n  >\\ ",
  " _M_\n  O\n /|\\\n  |\\",
  " _M_\n  O\n /|\\\n  |>"
];
let oldManFrameIndex = 0;

let fireAscii;
let fireStageButton;
let fireStageLabel;

let fireStages = ["stage1", "stage2", "stage3", "stage4", "stage5"];
let fireStageIndex = 0;
let fireTimer = null;

let fireClickCount = 0;
let logClickArea;
let fireHint;
let campfireFullyLit = false;

// =====================
// Hidden personality stats (per chapter / run)
// =====================
let stats = {
  CC: 0, // Cautious Connection
  SP: 0, // Self-Protection
  HO: 0, // Hopeful Outreach
  IE: 0, // Indirect Expression
  DI: 0, // Deep Introspection
  DB: 0  // Desired Belonging
};

// =====================
// Helpers
// =====================
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadScript(branchId = "campfire-intro") {
  const response = await fetch(`/api/script/${encodeURIComponent(branchId)}`);
  if (!response.ok) {
    console.error("Failed to load script", response.status);
    script = [];
    return;
  }
  script = await response.json();
  console.log("Loaded script entries:", script.length);

  currentBranchId = branchId;
  endReflectionShown = false;  

  resetStats();
}

function scrollHistoryToBottom() {
  historyViewport.scrollTop = historyViewport.scrollHeight;
}

// =====================
// Typing functions
// =====================

async function typeDialogEntry(entry) {
  isTyping = true;

  currentLine.innerHTML = "";

  if (entry.speaker === "YOU" || entry.speaker === "PLAYER") {
    currentLine.style.textAlign = "right";
  } else {
    currentLine.style.textAlign = "left";
  }

  const labelName =
    entry.speaker === "OLD_MAN"
      ? "Old man"
      : entry.speaker === "YOU" || entry.speaker === "PLAYER"
      ? "You"
      : entry.speaker || "";

  const speakerSpan = document.createElement("span");
  speakerSpan.textContent = labelName + ":";
  speakerSpan.style.color = "#ffffff";
  speakerSpan.style.fontWeight = "bold";
  currentLine.appendChild(speakerSpan);
  currentLine.appendChild(document.createElement("br"));

  const textSpan = document.createElement("span");
  const color = speakerColors[entry.speaker] || "#ffffff";
  textSpan.style.color = color;
  currentLine.appendChild(textSpan);

  const cursorSpan = document.createElement("span");
  cursorSpan.className = "cursor";
  cursorSpan.textContent = "█";
  currentLine.appendChild(cursorSpan);

  const text = entry.text || "";
  for (let i = 0; i < text.length; i++) {
    textSpan.textContent += text[i];
    await wait(typingSpeed);
  }

  cursorSpan.remove();
  isTyping = false;
}

async function typeNarration(text) {
  isTyping = true;

  if (narrationFadeTimeout) {
    clearTimeout(narrationFadeTimeout);
    narrationFadeTimeout = null;
  }
  if (narrationClearTimeout) {
    clearTimeout(narrationClearTimeout);
    narrationClearTimeout = null;
  }

  narrationText.style.opacity = 1;
  narrationText.innerHTML = "";

  const textSpan = document.createElement("span");
  narrationText.appendChild(textSpan);

  const cursorSpan = document.createElement("span");
  cursorSpan.className = "cursor";
  cursorSpan.textContent = "█";
  narrationText.appendChild(cursorSpan);

  const content = text || "";
  for (let i = 0; i < content.length; i++) {
    textSpan.textContent += content[i];
    await wait(typingSpeed);
  }

  cursorSpan.remove();
  isTyping = false;

  narrationFadeTimeout = setTimeout(() => {
    narrationText.style.opacity = 0;

    narrationClearTimeout = setTimeout(() => {
      narrationText.innerHTML = "";
    }, 2500);
  }, 2500);
}

// =====================
// History handling
// =====================

async function commitCurrentToHistory() {
  if (!currentLine.innerHTML.trim()) return;

  const block = document.createElement("div");
  block.className = "history-line";
  block.innerHTML = currentLine.innerHTML;
  block.style.textAlign = currentLine.style.textAlign;

  historyList.appendChild(block);

  currentLine.innerHTML = "";
  currentLine.style.textAlign = "left";

  scrollHistoryToBottom();
}



// =====================
// Stats
// =====================

function resetStats() {
  stats = { CC: 0, SP: 0, HO: 0, IE: 0, DI: 0, DB: 0 };
}

function applyChoiceStats(choiceEntry) {
  if (!choiceEntry || !choiceEntry.stats) return;

  const delta = choiceEntry.stats;
  for (const key of Object.keys(delta)) {
    if (typeof stats[key] !== "number") continue;
    const inc = Number(delta[key]) || 0;
    stats[key] += inc;
  }

  console.log("Stats updated:", JSON.stringify(stats));
}

function getDominantStatKey() {
  let bestKey = "CC";
  let bestVal = -Infinity;

  for (const key of Object.keys(stats)) {
    const val = stats[key];
    if (val > bestVal) {
      bestVal = val;
      bestKey = key;
    }
  }
  return bestKey;
}


// =====================
// Choices
// =====================

function showChoicesForGroup(choiceGroupId) {
  const groupChoices = script.filter(
    e => e.type === "choice" && e.choiceGroup === choiceGroupId
  );

  if (!groupChoices.length) {
    console.warn("No choices found for group:", choiceGroupId);
    return;
  }

  choiceArea.style.display = "block";
  choiceButtons.innerHTML = "";

  groupChoices.forEach(choiceEntry => {
    const btn = document.createElement("button");
    btn.className = "choiceButton";
    btn.textContent = choiceEntry.label || "[no label]";
    btn.dataset.choiceId = choiceEntry.choiceId || "";

    btn.addEventListener("click", async () => {
        if (isTyping) return;
      

        choiceArea.style.display = "none";
        choiceButtons.innerHTML = "";
      
        await typeDialogEntry({
          speaker: choiceEntry.playerSpeaker || "PLAYER",
          text: choiceEntry.playerText || ""
        });
        await wait(pauseAfterLine);
        await commitCurrentToHistory();
      
        if (choiceEntry.replyText && choiceEntry.replyText.trim()) {
          await typeDialogEntry({
            speaker: choiceEntry.replySpeaker || "OLD_MAN",
            text: choiceEntry.replyText
          });
          await wait(pauseAfterLine);
          await commitCurrentToHistory();
        }
      
        if (choiceEntry.followupLabel) {
          await showFollowupChoice(choiceEntry);
        } else {
          await runScript();
        }
      });
      
      

    choiceButtons.appendChild(btn);
  });
}

async function showFollowupChoice(choiceEntry) {
  choiceArea.style.display = "block";
  choiceButtons.innerHTML = "";

  const btn = document.createElement("button");
  btn.className = "choiceButton";
  btn.textContent = choiceEntry.followupLabel || "Continue";

  btn.addEventListener("click", async () => {
    if (isTyping) return;
    btn.disabled = true;

    applyChoiceStats(choiceEntry);

    await typeDialogEntry({
      speaker: choiceEntry.playerSpeaker || "PLAYER",
      text:
        choiceEntry.followupPlayerText ||
        choiceEntry.followupLabel ||
        ""
    });
    await wait(pauseAfterLine);
    await commitCurrentToHistory();

    if (
      choiceEntry.followupReplyText &&
      choiceEntry.followupReplyText.trim().length > 0
    ) {
      await typeDialogEntry({
        speaker: choiceEntry.replySpeaker || "OLD_MAN",
        text: choiceEntry.followupReplyText
      });
      await wait(pauseAfterLine);
      await commitCurrentToHistory();
    }

    choiceArea.style.display = "none";
    await runScript();
  });

  choiceButtons.appendChild(btn);
}

  

// =====================
// Final decision
// =====================

// const endReflections = {
//     CC: `So… you walk gently toward people.
//   You place your feet as though the ground might crack beneath you.
//   You know what that tells me?
//   You have learned that connection is something precious. Something not to mishandle.
//   Your heart approaches others like someone holding a fragile lantern in a storm.
//   Not because you are weak…
//   but because you understand how valuable true closeness is.
//   People like you notice details most overlook. The shift in someone’s tone, the quiet invitation in a glance, the warmth in a small gesture.
//   But your careful steps mean sometimes you wait longer than you should.
//   Opportunity passes quietly when you move quietly too.
//   Nira was like that.
//   Her hands were steady, but her hope was timid.
//   She needed someone to tug the thread first.
//   Traveler… cautious souls do not need to change their nature.
//   But they must remember this:
//   even gentle steps can cross distances,
//   and even soft voices deserve to be heard.
//   If you wait for certainty, you will wait forever.
//   Take the next small step, not a leap, never a leap.
//   Just enough movement for the world to move toward you in return.`,
  
//     SP: `Look at you… a heart that built walls before it even realized it was doing so.
//   A survivor.
//   You learned early that closeness carries risk.
//   Maybe someone left too soon.
//   Maybe someone stayed, but their presence felt colder than absence.
//   Maybe you were once open, only to find the world harsh against a soft heart.
//   And so, you built defenses. Sturdy ones.
//   When Nira stood outside that cottage door, she almost turned away.
//   Not because she didn’t want warmth…
//   but because part of her believed warmth wasn’t meant for her.
//   I see that in you too.
//   A fear that reaching out will lead to hurt.
//   You protect yourself not out of coldness, but out of memory.
//   But traveler… walls do not only keep danger out.
//   They keep comfort out as well.
//   They keep recognition out.
//   They keep the laughter you haven’t heard yet out.
//   You do not need to tear your walls down.
//   Just open a gate.
//   A small one.
//   Enough for light to slip through.
//   Enough for someone to meet you halfway.
//   Safety is built with others, not without them.`,
  
//     HO: `Ah… a courageous heart.
//   You might not see yourself that way, but I do.
//   You feel the tremble of loneliness yet still reach toward others.
//   That takes more strength than swinging a sword or climbing a mountain.
//   People like you approach connection with quiet bravery.
//   The bravery of someone who knows fear and moves anyway.
//   You are willing to show up even when unsure how you’ll be received.
//   Your heart is naturally warm.
//   But here’s the danger:
//   you might pour yourself into others so quickly that you forget to refill your own cup.
//   You may give before knowing whether the ground beneath the connection is steady.
//   Nira learned this too.
//   She visited Linna again because her heart pulled her toward warmth, but she had to learn to pace that hope.
//   Hopeful hearts shine brightly, traveler.
//   But even a bright flame needs room to breathe.
//   Your next step is not to dim your hope…
//   but to temper it, nurture it, and direct it toward people who meet your effort with their own.
//   You are brave.
//   Do not forget that.
//   But bravery does not mean rushing.
//   It means choosing connection with intention.`,
  
//     IE: `You speak in gestures, not declarations.
//   Your kindness is the sort that appears on doorsteps, in small notes, in quiet acts no one else notices.
//   There is an elegance to that.
//   A softness not many possess.
//   But… subtle people often misunderstand themselves.
//   They think their quiet offering is too small to matter.
//   They underestimate the power of the smallest stitch in a tapestry.
//   Nira left a gift on Linna’s table before she had the courage to speak fully.
//   It was her way of saying, “I want connection, but gently… gently.”
//   You are like that.
//   But traveler… not everyone speaks the language of subtlety.
//   If your gifts, your messages, your signals are too quiet,
//   people may never realize what you’re offering.
//   You do not need to shout.
//   But now and then, let the lantern of your intent shine a little brighter.
//   Give people a chance to meet you in the open.
//   Your heart communicates through warmth, not volume.
//   That is a gift.
//   Just don’t let your gestures be lost in the noise of the world.`,
  
//     DI: `Your mind is a long hallway with many rooms.
//   You wander through them often, thinking, reflecting, wondering.
//   You try to understand yourself before letting others understand you.
//   There is rare wisdom in that.
//   But great introspection can become great isolation if left unchecked.
//   People like you often hesitate not because they don’t care,
//   but because they want to act with meaning.
//   They want connection that feels authentic, not rushed.
//   So they wait for clarity before reaching.
//   But connection is not something found fully formed.
//   It grows through imperfect attempts: awkward greetings, half-finished thoughts, soft beginnings.
//   Nira discovered this when she spent days thinking before making her next move.
//   Her thoughts were rich, but her world stayed still until she acted.
//   Traveler… don’t wait for perfect understanding before you step toward others.
//   Understanding often comes after the step, not before it.
//   Let your thoughts guide you,
//   but let your actions lead the way.`,
  
//     DB: `Ah… a tender truth.
//   You want to be wanted.
//   You want someone to look at you the way Nira looked at that woven bracelet, as if it meant she was seen.
//   There is no weakness in longing.
//   Belonging is one of the oldest hungers of the human heart.
//   But here is the ache:
//   When you want to be chosen, you may wait…
//   and wait…
//   and wait…
//   for someone to open the door first.
//   Traveler, listen carefully.
//   Wanting to be welcomed does not make you fragile.
//   But waiting for others to always make the first move keeps your life in pause.
//   Nira learned that the night she held the bracelet in her hands.
//   She wanted them to invite her again…
//   but she realized she treasured the connection enough to risk stepping forward too.
//   The truth is simple and difficult:
//   You deserve to belong.
//   But belonging grows from shared steps.
//   Let yourself step at least halfway.
//   The right people will meet you.`
// };
  
// async function playEndReflectionIfNeeded() {
//   if (endReflectionShown) return;
//   if (currentBranchId !== "alone-story") return;

//   endReflectionShown = true;

//   const dominantKey = getDominantStatKey();
//   const text = endReflections[dominantKey] || endReflections.CC;

//   await typeDialogEntry({
//     speaker: "OLD_MAN",
//     text
//   });
//   await wait(pauseAfterLine);
//   await commitCurrentToHistory();
// }

  
// =====================
// Main 
// =====================

async function runScript() {
  while (scriptIndex < script.length) {
    const entry = script[scriptIndex];

    if (entry.type === "narration") {
      await typeNarration(entry.text);
      await wait(pauseAfterLine);

      if (entry.text && entry.text.trim() === "A frail figure steps forward.") {
        await startOldManIntro();
      }

      scriptIndex++;
      continue;
    }

    if (entry.type === "dialog") {
      await typeDialogEntry(entry);
      await wait(pauseAfterLine);
      await commitCurrentToHistory();
      scriptIndex++;
      continue;
    }

    if (entry.type === "choice") {
      const groupId = entry.choiceGroup;

      let lastIndex = scriptIndex;
      for (let j = scriptIndex; j < script.length; j++) {
        if (
          script[j].type === "choice" &&
          script[j].choiceGroup === groupId
        ) {
          lastIndex = j;
        } else if (
          script[j].type === "choice" &&
          script[j].choiceGroup !== groupId
        ) {
          break;
        }
      }

      scriptIndex = lastIndex + 1;

      showChoicesForGroup(groupId);
      break;
    }

    scriptIndex++;
  }
  if (scriptIndex >= script.length) {
    await playEndReflectionIfNeeded();
  }
  
}

// =====================
// Campfire functions
// =====================

function setFireStage(stageKey) {
  if (typeof FIRE_FRAMES === "undefined") {
    console.error("FIRE_FRAMES is not defined. Is fire_frame.js loaded correctly?");
    return;
  }
  if (!FIRE_FRAMES[stageKey]) {
    console.warn("Unknown fire stage:", stageKey);
    return;
  }

  fireStageIndex = fireStages.indexOf(stageKey);
  if (fireStageIndex < 0) fireStageIndex = 0;

  const stage = FIRE_FRAMES[stageKey];
  fireStageLabel.textContent = `Stage ${fireStageIndex + 1}: ${stage.name || ""}`;

  startFireAnimation();
}

function startFireAnimation() {
  if (typeof FIRE_FRAMES === "undefined") return;

  const stageKey = fireStages[fireStageIndex];
  const stage = FIRE_FRAMES[stageKey];
  if (!stage) return;

  const frames = stage.frames || [];
  const fps = stage.fps || 0;

  if (fireTimer) {
    clearInterval(fireTimer);
    fireTimer = null;
  }

  if (!frames.length) {
    fireAscii.textContent = "";
    return;
  }

  if (fps <= 0 || frames.length === 1) {
    fireAscii.textContent = frames[0];
    return;
  }

  let idx = 0;
  fireAscii.textContent = frames[idx];

  const interval = 1000 / fps;
  fireTimer = setInterval(() => {
    idx = (idx + 1) % frames.length;
    fireAscii.textContent = frames[idx];
  }, interval);
}

function updateFireStageFromCounter() {
  let stageKey = "stage1";

  if (fireClickCount > 10) {
    stageKey = "stage5";      // roaring
  } else if (fireClickCount > 8) {
    stageKey = "stage4";      // lit fire
  } else if (fireClickCount > 6) {
    stageKey = "stage3";      // small flame
  } else if (fireClickCount > 4) {
    stageKey = "stage2";      // embers
  } else if (fireClickCount > 2) {
    stageKey = "stage2";      // first bump up from unlit
  }

  setFireStage(stageKey);

  if (stageKey === "stage5") {
    if (logClickArea) logClickArea.style.display = "none";
    if (fireHint) fireHint.style.display = "none";

    if (!campfireFullyLit) {
      campfireFullyLit = true;
      onCampfireFullyLit();
    }
  }
}

async function onCampfireFullyLit() {
  await typeNarration(
    "A small flame blossoms into a campfire. You lean closer to the campfire to warm yourself in a cold weather."
  );
  await wait(pauseAfterLine);

  runScript();
}



// =====================
// stickman animation
// =====================

async function playIntroNarrations() {
  if (fireHint) fireHint.style.display = "none";
  if (logClickArea) logClickArea.style.display = "none";

  await typeNarration(
    "The forest is still. Only the faint chirping of night insects fills the air."
  );
  await wait(pauseAfterLine);

  await typeNarration(
    "The night is colder than you think which made you to decide to warm yourself with a campfire."
  );
  await wait(pauseAfterLine);

  if (fireHint) fireHint.style.display = "block";
  if (logClickArea) logClickArea.style.display = "block";
}

function startStickmanIntro() {
  if (titleScreen) {
    titleScreen.style.display = "none";
  }
  if (!stickmanContainer || !stickmanArt) return;

  stickmanContainer.style.display = "block";

  stickmanX = 120;                      
  stickmanFrameIndex = 0;
  stickmanArt.textContent = stickmanFrames[0];
  stickmanContainer.style.left = stickmanX + "vw";

  if (stickmanInterval) {
    clearInterval(stickmanInterval);
    stickmanInterval = null;
  }

  stickmanInterval = setInterval(() => {
    stickmanX -= 1;

    if (stickmanX <= stickmanTargetX) {
      stickmanX = stickmanTargetX;
      stickmanContainer.style.left = stickmanX + "vw";

      stickmanFrameIndex = 0;
      stickmanArt.textContent = stickmanFrames[0];

      clearInterval(stickmanInterval);
      stickmanInterval = null;

      playIntroNarrations();
      return;
    }

    stickmanContainer.style.left = stickmanX + "vw";

    stickmanFrameIndex = (stickmanFrameIndex + 1) % stickmanFrames.length;
    stickmanArt.textContent = stickmanFrames[stickmanFrameIndex];
  }, 140); 
}

// =====================
// old man animation
// =====================

function startOldManIntro() {
    return new Promise(resolve => {
      if (!oldManContainer || !oldManArt) {
        resolve();
        return;
      }
  
      oldManContainer.style.display = "block";
      oldManX = -20;                
      oldManFrameIndex = 0;
      oldManArt.textContent = oldManFrames[0];
      oldManContainer.style.left = oldManX + "vw";
  
      if (oldManInterval) {
        clearInterval(oldManInterval);
        oldManInterval = null;
      }
  
      oldManInterval = setInterval(() => {
        oldManX += 1; 
  
        if (oldManX >= oldManTargetX) {
          oldManX = oldManTargetX;
          oldManContainer.style.left = oldManX + "vw";
  
          oldManFrameIndex = 0;
          oldManArt.textContent = oldManFrames[0];
  
          clearInterval(oldManInterval);
          oldManInterval = null;
          resolve();              
          return;
        }
  
        oldManContainer.style.left = oldManX + "vw";
  
        oldManFrameIndex = (oldManFrameIndex + 1) % oldManFrames.length;
        oldManArt.textContent = oldManFrames[oldManFrameIndex];
      }, 140); 
    });
  }


// =====================
// DOM init
// =====================

window.addEventListener("DOMContentLoaded", () => {
  historyViewport = document.getElementById("historyViewport");
  historyList = document.getElementById("historyList");
  currentLine = document.getElementById("currentLine");
  choiceArea = document.getElementById("choiceArea");
  choiceButtons = document.getElementById("choiceButtons");
  narrationText = document.getElementById("narrationText");
  
  titleScreen = document.getElementById("titleScreen");
  stickmanContainer = document.getElementById("stickmanContainer");
  stickmanArt = document.getElementById("stickmanArt");

  oldManContainer = document.getElementById("oldManContainer");
  oldManArt = document.getElementById("oldManArt");

  if (oldManContainer) {
    oldManContainer.style.display = "none";
  }

  fireAscii = document.getElementById("fireAscii");
  fireStageButton = document.getElementById("fireStageButton");
  fireStageLabel = document.getElementById("fireStageLabel");

  logClickArea = document.getElementById("logClickArea");
  fireHint = document.getElementById("fireHint");

  if (fireHint) fireHint.style.display = "none";
  if (logClickArea) logClickArea.style.display = "none";

  function handleFirstClick() {
    if (introStarted) return;
    introStarted = true;

    document.removeEventListener("click", handleFirstClick);
    startStickmanIntro();
  }

  document.addEventListener("click", handleFirstClick);

  document.addEventListener("copy", event => event.preventDefault());
  document.addEventListener("cut", event => event.preventDefault());
  document.addEventListener("paste", event => event.preventDefault());

  document.addEventListener("keydown", event => {
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === "c" || event.key === "x" || event.key === "a")
    ) {
      event.preventDefault();
    }
  });

  document.body.oncontextmenu = () => false;

  if (fireStageButton && fireAscii && fireStageLabel) {
    fireStageButton.addEventListener("click", () => {
      fireStageIndex = (fireStageIndex + 1) % fireStages.length;
      const nextStageKey = fireStages[fireStageIndex];
      setFireStage(nextStageKey);
    });

    setFireStage("stage1");
  }

  if (logClickArea) {
    logClickArea.addEventListener("click", () => {
      fireClickCount++;
      updateFireStageFromCounter();
    });
  }

    loadScript("campfire-intro")
    .catch(err => console.error("Error loading script", err));
});