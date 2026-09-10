const MODULE_ID = "dice-privacy-fix";

function getCurrentRollMode() {
  try {
    const mode = game.settings.get("core", "rollMode");
    if (mode) return mode;
  } catch (err) {
    console.warn(`${MODULE_ID} | Could not read core.rollMode`, err);
  }

  const select = document.querySelector('select[name="rollMode"], #roll-type-select');
  return select?.value ?? "publicroll";
}

function getGMIds() {
  return game.users
    .filter(u => u.isGM && u.active)
    .map(u => u.id);
}

function buildPrivacy(mode, roller) {
  const rollerId = roller?.id ?? game.user?.id;
  const gmIds = getGMIds();

  switch (mode) {
    case "gmroll":
    case "private":
      return {
        whisper: [...new Set([...gmIds, rollerId].filter(Boolean))],
        blind: false
      };

    case "blindroll":
    case "blind":
      return {
        whisper: gmIds,
        blind: true
      };

    case "selfroll":
    case "self":
      return {
        whisper: rollerId ? [rollerId] : [],
        blind: false
      };

    default:
      return {
        whisper: [],
        blind: false
      };
  }
}

function shouldPatchPrivacy(whisper, blind) {
  const hasWhisper = Array.isArray(whisper) && whisper.length > 0;
  return !hasWhisper && !blind;
}

function patchDiceSoNice() {
  if (!game.dice3d) {
    console.warn(`${MODULE_ID} | Dice So Nice API was not found.`);
    return false;
  }

  if (game.dice3d.__dicePrivacyFixPatched) return true;

  for (const methodName of ["showForRoll", "show"]) {
    const original = game.dice3d[methodName];
    if (typeof original !== "function") continue;

    game.dice3d[methodName] = function(dataOrRoll, user = game.user, synchronize = false, whisper = [], blind = false, ...rest) {
      try {
        const mode = getCurrentRollMode();

        if (mode !== "publicroll" && mode !== "public" && shouldPatchPrivacy(whisper, blind)) {
          const privacy = buildPrivacy(mode, user);
          whisper = privacy.whisper;
          blind = privacy.blind;

          console.debug(`${MODULE_ID} | Applied DSN privacy`, {
            methodName,
            mode,
            roller: user?.id,
            whisper,
            blind
          });
        }
      } catch (err) {
        console.error(`${MODULE_ID} | Error applying Dice So Nice privacy fix`, err);
      }

      return original.call(this, dataOrRoll, user, synchronize, whisper, blind, ...rest);
    };
  }

  Object.defineProperty(game.dice3d, "__dicePrivacyFixPatched", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });

  console.log(`${MODULE_ID} | Dice So Nice privacy patch active.`);
  return true;
}

Hooks.once("ready", () => {
  if (patchDiceSoNice()) return;

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (patchDiceSoNice() || attempts >= 20) clearInterval(timer);
  }, 250);
});
