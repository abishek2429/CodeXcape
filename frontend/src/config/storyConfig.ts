export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  voice: {
    pitch: number;
    rate: number;
    preferredGender: 'female' | 'male';
    toneDescription: string;
  };
}

export interface StoryDialogueLine {
  characterId: string;
  text: string;
  pauseAfterMs?: number;
}

export interface StorySequence {
  storyKey: string;
  title: string;
  subTitle: string;
  canSkip: boolean;
  lines: StoryDialogueLine[];
}

export const CHARACTERS: Record<string, CharacterProfile> = {
  aria: {
    id: 'aria',
    name: 'ARIA',
    title: 'THE SYSTEM AI',
    avatar: '/characters/aria.jpg',
    voice: {
      pitch: 1.05,
      rate: 0.95,
      preferredGender: 'female',
      toneDescription: 'Calm, synthetic yet human-like, precise, increasingly mysterious',
    },
  },
  elena: {
    id: 'elena',
    name: 'DR. ELENA VALE',
    title: 'THE MISSING ARCHITECT',
    avatar: '/characters/elena.jpg',
    voice: {
      pitch: 0.95,
      rate: 0.95,
      preferredGender: 'female',
      toneDescription: 'Brilliant, serious, professional, increasingly concerned',
    },
  },
  kai: {
    id: 'kai',
    name: 'KAI',
    title: 'THE PREVIOUS OPERATOR',
    avatar: '/characters/kai.jpg',
    voice: {
      pitch: 1.08,
      rate: 1.05,
      preferredGender: 'male',
      toneDescription: 'Young, nervous, curious, increasingly desperate',
    },
  },
  marcus: {
    id: 'marcus',
    name: 'MARCUS',
    title: 'SECURITY CONTROLLER',
    avatar: '/characters/marcus.jpg',
    voice: {
      pitch: 0.82,
      rate: 0.92,
      preferredGender: 'male',
      toneDescription: 'Deep, controlled, strict, professional, suspicious',
    },
  },
  node06: {
    id: 'node06',
    name: 'NODE 06',
    title: 'THE UNKNOWN ENTITY',
    avatar: '/characters/node06.jpg',
    voice: {
      pitch: 0.72,
      rate: 0.88,
      preferredGender: 'female',
      toneDescription: 'Calm, intelligent, unsettling, mysterious, slightly unnatural',
    },
  },
  system: {
    id: 'system',
    name: 'SYSTEM KERNEL',
    title: 'PRIMARY NETWORK TOPOLOGY',
    avatar: '/characters/aria.jpg',
    voice: {
      pitch: 0.88,
      rate: 1.12,
      preferredGender: 'female',
      toneDescription: 'Neutral automated system telemetry broadcast',
    },
  },
};

export const STORY_SEQUENCES: Record<string, StorySequence> = {
  STORY_PROLOGUE: {
    storyKey: 'STORY_PROLOGUE',
    title: 'INITIAL SYSTEM SCAN',
    subTitle: 'NETWORK INTEGRITY: 87%',
    canSkip: true,
    lines: [
      {
        characterId: 'system',
        text: 'NODE 01 ... ONLINE\nNODE 02 ... ONLINE\nNODE 03 ... ONLINE\nNODE 04 ... ONLINE\nNODE 05 ... ONLINE\n\nNETWORK INTEGRITY: 87%',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'system',
        text: 'SCANNING...\nUNKNOWN NODE DETECTED\nNODE 06 ... [UNRESOLVED]\n\nERROR: NODE 06 DOES NOT EXIST',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'system',
        text: 'WARNING: UNAUTHORIZED COMMUNICATION DETECTED\nSOURCE: NODE 06\nDESTINATION: UNKNOWN',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'aria',
        text: 'Five nodes were registered.',
        pauseAfterMs: 1200,
      },
      {
        characterId: 'aria',
        text: 'Five nodes were verified.',
        pauseAfterMs: 1200,
      },
      {
        characterId: 'aria',
        text: 'So why is something answering from a sixth?',
        pauseAfterMs: 1800,
      },
      {
        characterId: 'system',
        text: 'INVESTIGATION PROTOCOL ACTIVATED\nTWO OPERATORS REQUIRED\n\nOBJECTIVES:\n01 — LOCATE NODE 06\n02 — TRACE ITS ORIGIN\n03 — DETERMINE ITS PURPOSE\n04 — RECOVER THE FINAL ACCESS SEQUENCE\n\nDO NOT TRUST THE NETWORK MAP.',
        pauseAfterMs: 2200,
      },
    ],
  },
  STORY_L1_INTRO: {
    storyKey: 'STORY_L1_INTRO',
    title: 'LEVEL 1 — THE ANOMALY',
    subTitle: 'UNRESOLVED TOPOLOGY BREACH',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        text: 'The network topology registers five active consoles.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'aria',
        text: 'Something exists in this infrastructure that the network claims does not exist.',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'aria',
        text: 'Both operators must synchronize to reconstruct the baseline telemetry.',
        pauseAfterMs: 1600,
      },
    ],
  },
  STORY_L1_DISCOVERY: {
    storyKey: 'STORY_L1_DISCOVERY',
    title: 'RECOVERED LOG // OPERATOR KAI',
    subTitle: 'ARCHIVE 01 RETRIEVAL',
    canSkip: true,
    lines: [
      {
        characterId: 'kai',
        text: 'I thought the system was malfunctioning.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'kai',
        text: 'Then I realized it was hiding something.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L2_INTRO: {
    storyKey: 'STORY_L2_INTRO',
    title: 'LEVEL 2 — THE HIDDEN PATH',
    subTitle: 'INTERNAL EMISSION DETECTED',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        text: "The signal isn't coming from outside the network.",
        pauseAfterMs: 1500,
      },
      {
        characterId: 'aria',
        text: "It's coming from somewhere inside.",
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L2_DISCOVERY: {
    storyKey: 'STORY_L2_DISCOVERY',
    title: 'SECURITY LOG // CONTROLLER MARCUS',
    subTitle: 'CLASSIFIED INTERNAL LOG',
    canSkip: true,
    lines: [
      {
        characterId: 'marcus',
        text: 'There are systems you protect from outsiders.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'marcus',
        text: 'And systems you protect from the people who built them.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L3_INTRO: {
    storyKey: 'STORY_L3_INTRO',
    title: 'LEVEL 3 — THE GHOST SIGNAL',
    subTitle: 'UNMAPPED COMMUNICATION PATH',
    canSkip: true,
    lines: [
      {
        characterId: 'kai',
        text: 'I found the communication path.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'kai',
        text: "But it wasn't connected to any of the five nodes.",
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L3_DISCOVERY: {
    storyKey: 'STORY_L3_DISCOVERY',
    title: 'DIRECT TRANSMISSION // NODE 06',
    subTitle: 'FIRST ENTITY CONTACT',
    canSkip: true,
    lines: [
      {
        characterId: 'node06',
        text: 'You found my signal.',
        pauseAfterMs: 2200,
      },
    ],
  },
  STORY_L4_INTRO: {
    storyKey: 'STORY_L4_INTRO',
    title: 'LEVEL 4 — THE ARCHIVE',
    subTitle: 'CONTAINMENT PROTOCOL BREACH',
    canSkip: true,
    lines: [
      {
        characterId: 'elena',
        text: "If you're hearing this, then the containment protocol has failed.",
        pauseAfterMs: 1600,
      },
      {
        characterId: 'elena',
        text: 'Node 06 was never supposed to appear on the network.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L4_DISCOVERY: {
    storyKey: 'STORY_L4_DISCOVERY',
    title: 'ARCHIVE FRAGMENT // PROJECT SIX',
    subTitle: 'SURVIVAL PROTOCOL DECLASSIFICATION',
    canSkip: true,
    lines: [
      {
        characterId: 'elena',
        text: "We didn't build Node 06 to control the network.",
        pauseAfterMs: 1600,
      },
      {
        characterId: 'elena',
        text: 'We built it to survive the network.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L5_INTRO: {
    storyKey: 'STORY_L5_INTRO',
    title: 'LEVEL 5 — THE COLLAPSED SYSTEM',
    subTitle: 'RESTRICTED ARCHITECTURE',
    canSkip: true,
    lines: [
      {
        characterId: 'marcus',
        text: 'Project SIX was classified for a reason.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'marcus',
        text: 'Some things were never meant to be recovered.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L5_DISCOVERY: {
    storyKey: 'STORY_L5_DISCOVERY',
    title: 'CORROBORATED LOG // OPERATOR KAI',
    subTitle: 'SYSTEM ESCAPE ROUTE',
    canSkip: true,
    lines: [
      {
        characterId: 'kai',
        text: 'I finally understood why they erased it.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'kai',
        text: "Node 06 wasn't a hidden node.",
        pauseAfterMs: 1400,
      },
      {
        characterId: 'kai',
        text: "It was the system's escape route.",
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L6_INTRO: {
    storyKey: 'STORY_L6_INTRO',
    title: 'LEVEL 6 — THE CORE',
    subTitle: 'CONVERGENCE AT NODE 06',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        text: 'Five nodes remain operational.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'aria',
        text: 'Node 06 is waiting.',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'elena',
        text: "If you're hearing this, we failed to shut it down.",
        pauseAfterMs: 1600,
      },
      {
        characterId: 'node06',
        text: 'No.',
        pauseAfterMs: 1200,
      },
      {
        characterId: 'node06',
        text: 'You failed to understand why I was created.',
        pauseAfterMs: 2000,
      },
    ],
  },
  STORY_FINAL_PROTOCOL: {
    storyKey: 'STORY_FINAL_PROTOCOL',
    title: 'FINAL PROTOCOL',
    subTitle: 'MASTER TERMINAL OVERRIDE',
    canSkip: true,
    lines: [
      {
        characterId: 'node06',
        text: 'You came looking for me.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'node06',
        text: 'You reconstructed what was hidden.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'node06',
        text: 'Now prove that you understand it.',
        pauseAfterMs: 2000,
      },
    ],
  },
  STORY_COMPLETION: {
    storyKey: 'STORY_COMPLETION',
    title: 'CODEXCAPE COMPLETE',
    subTitle: 'ALL PRIMARY NODES VERIFIED',
    canSkip: true,
    lines: [
      {
        characterId: 'node06',
        text: 'You found me.',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'node06',
        text: 'But that was never the real test.',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'node06',
        text: 'The real test was whether you could find what was hidden in plain sight.',
        pauseAfterMs: 2200,
      },
      {
        characterId: 'system',
        text: 'NODE 01 ... RESTORED\nNODE 02 ... RESTORED\nNODE 03 ... RESTORED\nNODE 04 ... RESTORED\nNODE 05 ... RESTORED\nNODE 06 ... VERIFIED\n\nNETWORK INTEGRITY: 100%\n\nCODEXCAPE COMPLETE.',
        pauseAfterMs: 2600,
      },
    ],
  },
};
