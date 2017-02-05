var BattleConstants = {};

export default BattleConstants;

BattleConstants.statuses = {
    0: "",
    1: "par",
    2: "slp",
    3: "frz",
    4: "brn",
    5: "psn",
    6: "confusion",
    31: "fnt"
};

BattleConstants.weathers = {
    0: "none",
    1: "hail",
    2: "raindance",
    3: "sandstorm",
    4: "sunnyday",
    5: "strongsun",
    6: "strongrain",
    7: "strongwinds"
};

BattleConstants.clauses = {
    0: "Sleep Clause",
    1: "Freeze Clause",
    2: "Disallow Spects",
    3: "Item Clause",
    4: "Challenge Cup",
    5: "No Timeout",
    6: "Species Clause",
    7: "Team Preview",
    8: "Self-KO Clause",
    9: "Inverted Clause"
};

BattleConstants.clauseDescs = {
    0:"You can not put more than one Pokemon of the opposing team to sleep at the same time.",
    1:"You can not freeze more than one Pokemon of the opposing team at the same time.",
    2:"Nobody can watch your battle.",
    3:"No more than one of the same items is allowed per team.",
    4:"Random teams are given to trainers.",
    5:"No time limit for playing.",
    6:"One player cannot have more than one of the same pokemon per team.",
    7:"At the beginning of the battle, you can see the opponent's team and rearrange yours accordingly.",
    8:"The one who causes a tie (Recoil, Explosion, Destinybond, ...) loses the battle.",
    9:"All Type Effectivenesses are inverted (Ex: Water is weak to Fire)"
};

BattleConstants.clauseTexts = [
    "Sleep Clause prevented the sleep inducing effect of the move from working.",
    "Freeze Clause prevented the freezing effect of the move from working.",
    "",
    "",
    "",
    "The battle ended by timeout.",
    "",
    "",
    "The Self-KO Clause acted as a tiebreaker.",
    ""
];

BattleConstants.modes = {
    0: "Singles",
    1: "Doubles",
    2: "Triples",
    3: "Rotation"
};

export const modes = BattleConstants.modes;
export const clauses = BattleConstants.clauses;
export const clauseTexts = BattleConstants.clauseTexts;
export const clauseDescs = BattleConstants.clauseDescs;
export const statuses = BattleConstants.statuses;
export const weathers = BattleConstants.weathers;