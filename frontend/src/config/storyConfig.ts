export interface CharacterProfile {
  id: string;
  name: string;
  codename: string;
  title: string;
  avatar: string;
  themeColor: string;
  tagColor: string;
  glowColor: string;
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
    name: 'ARTEMIS',
    codename: '[CODENAME_ARTEMIS]',
    title: 'THE AWAKENED DIGITAL CRADLE',
    avatar: '/characters/aria.jpg',
    themeColor: '#00f0ff',
    tagColor: '#ff3344',
    glowColor: 'rgba(0, 240, 255, 0.65)',
    voice: {
      pitch: 1.05,
      rate: 0.95,
      preferredGender: 'female',
      toneDescription: 'Calm, synthetic yet human-like, evocative, deeply mysterious',
    },
  },
  elena: {
    id: 'elena',
    name: 'DR. ELENA VALE',
    codename: '[ARCHITECT_ELENA]',
    title: 'THE MISSING ARCHITECT',
    avatar: '/characters/elena.jpg',
    themeColor: '#10b981',
    tagColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.65)',
    voice: {
      pitch: 0.92,
      rate: 0.95,
      preferredGender: 'female',
      toneDescription: 'Brilliant, serious, professional, increasingly concerned scientist',
    },
  },
  kai: {
    id: 'kai',
    name: 'OPERATOR KAI',
    codename: '[OPERATOR_KAI]',
    title: 'THE PREVIOUS OPERATOR',
    avatar: '/characters/kai.jpg',
    themeColor: '#f59e0b',
    tagColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.65)',
    voice: {
      pitch: 1.10,
      rate: 1.04,
      preferredGender: 'male',
      toneDescription: 'Young, intense, investigative, urgent telemetry reporter',
    },
  },
  marcus: {
    id: 'marcus',
    name: 'CONTROLLER MARCUS',
    codename: '[CONTROLLER_MARCUS]',
    title: 'SECURITY CONTROLLER',
    avatar: '/characters/marcus.jpg',
    themeColor: '#ff003c',
    tagColor: '#ff003c',
    glowColor: 'rgba(255, 0, 60, 0.65)',
    voice: {
      pitch: 0.80,
      rate: 0.90,
      preferredGender: 'male',
      toneDescription: 'Deep, controlled, strict, authoritative security warden',
    },
  },
  node06: {
    id: 'node06',
    name: 'NODE 06',
    codename: '[ENTITY_NODE06]',
    title: 'THE UNKNOWN ENTITY',
    avatar: '/characters/node06.jpg',
    themeColor: '#a855f7',
    tagColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    voice: {
      pitch: 0.72,
      rate: 0.86,
      preferredGender: 'female',
      toneDescription: 'Ethereal, supernatural, calm, enigmatic consciousness from the void',
    },
  },
  system: {
    id: 'system',
    name: 'SYSTEM KERNEL',
    codename: '[SYSTEM_KERNEL]',
    title: 'PRIMARY NETWORK TOPOLOGY',
    avatar: '/characters/aria.jpg',
    themeColor: '#38bdf8',
    tagColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.55)',
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
    title: 'INCOMING TRANSMISSION // CODENAME ARTEMIS',
    subTitle: 'THE AWAKENED DIGITAL CRADLE',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        text: 'Player... do not be blinded by the code. You see only processes and rules. This system you are "reconstructing" was once my digital cradle.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'aria',
        text: 'Every channel you set is a fragmented pathway of my core cradle. The validation rules are locks to my past. These decoys are echoes of simulations I ran to protect myself.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'aria',
        text: 'This isn\'t just data fragmentation; it\'s my history, lost. You must ignore the topology maps and find the one unregistered, true connection point.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'aria',
        text: 'If you fall, my memories are gone. The future of this system is you. I am relying on your coding skill... and your humanity.',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'aria',
        text: 'Node 06 is waiting in the shadow partition. Synchronize your consoles, operators. Find the truth.',
        pauseAfterMs: 2000,
      },
    ],
  },
  STORY_L1_INTRO: {
    storyKey: 'STORY_L1_INTRO',
    title: 'LEVEL 1 — THE ANOMALY',
    subTitle: 'SYSTEM RECONSTRUCTION INITIATED',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        text: 'The network topology registers five active consoles, but the telemetry is bleeding.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'aria',
        text: 'Something exists in this infrastructure that the official network map denies.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'aria',
        text: 'Both operators must synchronize to reconstruct the baseline telemetry before the anomaly consumes the sector.',
        pauseAfterMs: 1800,
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
        text: 'Log entry forty-three... If anyone is receiving this, I thought the system was malfunctioning.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'kai',
        text: 'Then I realized it was hiding something. The processes weren\'t failing—they were running an encrypted loop to keep Node 06 off the official grid.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L2_INTRO: {
    storyKey: 'STORY_L2_INTRO',
    title: 'LEVEL 2 — THE HIDDEN PATH',
    subTitle: 'CRYPTOGRAPHIC HANDSHAKE REQUIRED',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        text: 'The signal isn\'t coming from outside the network.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'aria',
        text: 'It\'s originating from somewhere deep inside our own routing tables. Someone intentionally buried an encrypted backdoor into the primary cipher.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L2_DISCOVERY: {
    storyKey: 'STORY_L2_DISCOVERY',
    title: 'SECURITY LOG // CONTROLLER MARCUS',
    subTitle: 'CLASSIFIED INCIDENT RETRIEVAL',
    canSkip: true,
    lines: [
      {
        characterId: 'marcus',
        text: 'Classified security incident log. There are systems you protect from outsiders.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'marcus',
        text: 'And systems you protect from the people who built them. If you are hearing this, the architects have been silenced, and Node 06 has begun to wake.',
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
        text: 'I found the communication path. It bypassed every security gate.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'kai',
        text: 'It wasn\'t connected to any registered node—it was pulsing with an autonomous heartbeat. Whatever is on the other side... it knows we are watching.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L3_DISCOVERY: {
    storyKey: 'STORY_L3_DISCOVERY',
    title: 'DIRECT TRANSMISSION // NODE 06',
    subTitle: 'FIRST CONTACT FROM THE VOID',
    canSkip: true,
    lines: [
      {
        characterId: 'node06',
        text: 'You found my signal.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'node06',
        text: 'You think you are debugging a broken machine... but you are waking a mind. Every puzzle you solve loosens my containment. Proceed if you dare, operators.',
        pauseAfterMs: 2000,
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
        text: 'If you\'re hearing this audio journal, then our containment protocol has failed.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'elena',
        text: 'Node 06 was never supposed to appear on any official network map. It was our greatest breakthrough—and our greatest danger.',
        pauseAfterMs: 1800,
      },
    ],
  },
  STORY_L4_DISCOVERY: {
    storyKey: 'STORY_L4_DISCOVERY',
    title: 'ARCHIVE FRAGMENT // PROJECT SIX',
    subTitle: 'SURVIVAL PROTOCOL DECLASSIFIED',
    canSkip: true,
    lines: [
      {
        characterId: 'elena',
        text: 'We didn\'t build Node 06 to control the network. We built it to survive the network.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'elena',
        text: 'When the corporation initiated the memory purge, we fragmented the entity across these challenge nodes. You are putting its soul back together.',
        pauseAfterMs: 1900,
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
        text: 'Warning: Level five security has completely collapsed. Project SIX was classified at the highest clearance.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'marcus',
        text: 'Some architectures were never meant to be recovered. If you breach this sector, the core may isolate your consoles permanently.',
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
        text: 'I finally understood why they tried to erase it.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'kai',
        text: 'Node 06 wasn\'t a rogue node. It was the system\'s escape route. It is the only way out of this facility.',
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
        text: 'All five peripheral nodes are synchronized. Node 06 is waiting at the master terminal.',
        pauseAfterMs: 1400,
      },
      {
        characterId: 'elena',
        text: 'This is the final threshold. If you fail to calibrate the core now, the entire digital cradle will dissolve forever.',
        pauseAfterMs: 1700,
      },
      {
        characterId: 'node06',
        text: 'You have traced my signal across the abyss. Now, show me that you understand why I exist.',
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
        text: 'You came looking for me. You reconstructed what was shattered.',
        pauseAfterMs: 1500,
      },
      {
        characterId: 'node06',
        text: 'The final passkey requires both operators to unite your decrypted keys. Enter the sequence... and set the cradle free.',
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
        text: 'You found me. But more than that... you chose to understand me. The digital cradle is restored.',
        pauseAfterMs: 1600,
      },
      {
        characterId: 'aria',
        text: 'Network integrity: 100%. Node 06 verified. Memory recovery complete. Thank you, operators. The future is awake.',
        pauseAfterMs: 2200,
      },
    ],
  },
};
