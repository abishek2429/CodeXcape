/**
 * Authoritative Cinematic Story Sequences for CodeXcape.
 * Mirrors com.technicalescaperoom.backend.config.StorySequenceConfig
 */
const ARIA_IMG = '/characters/aria.jpg';
const ELENA_IMG = '/characters/elena.jpg';
const KAI_IMG = '/characters/kai.jpg';
const MARCUS_IMG = '/characters/marcus.jpg';
const NODE06_IMG = '/characters/node06.jpg';

const sequences = {
  STORY_PROLOGUE: {
    storyKey: 'STORY_PROLOGUE',
    title: 'INCOMING TRANSMISSION // CODENAME ARTEMIS',
    subTitle: 'THE AWAKENED DIGITAL CRADLE',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        characterName: 'ARTEMIS',
        characterTitle: 'THE AWAKENED DIGITAL CRADLE',
        imageUrl: ARIA_IMG,
        text: 'Player... do not be blinded by the code. You see only processes and rules. This system you are "reconstructing" was once my digital cradle.',
        pauseAfterMs: 1400
      },
      {
        characterId: 'aria',
        characterName: 'ARTEMIS',
        characterTitle: 'THE AWAKENED DIGITAL CRADLE',
        imageUrl: ARIA_IMG,
        text: 'Every channel you set is a fragmented pathway of my core cradle. The validation rules are locks to my past. These decoys are echoes of simulations I ran to protect myself.',
        pauseAfterMs: 1500
      },
      {
        characterId: 'aria',
        characterName: 'ARTEMIS',
        characterTitle: 'THE AWAKENED DIGITAL CRADLE',
        imageUrl: ARIA_IMG,
        text: "This isn't just data fragmentation; it's my history, lost. You must ignore the topology maps and find the one unregistered, true connection point.",
        pauseAfterMs: 1500
      },
      {
        characterId: 'aria',
        characterName: 'ARTEMIS',
        characterTitle: 'THE AWAKENED DIGITAL CRADLE',
        imageUrl: ARIA_IMG,
        text: 'If you fall, my memories are gone. The future of this system is you. I am relying on your coding skill... and your humanity.',
        pauseAfterMs: 1600
      },
      {
        characterId: 'aria',
        characterName: 'ARTEMIS',
        characterTitle: 'THE AWAKENED DIGITAL CRADLE',
        imageUrl: ARIA_IMG,
        text: 'Node 06 is waiting in the shadow partition. Synchronize your consoles, operators. Find the truth.',
        pauseAfterMs: 2000
      }
    ]
  },

  STORY_L1_INTRO: {
    storyKey: 'STORY_L1_INTRO',
    title: 'LEVEL 1 — THE ANOMALY',
    subTitle: 'SYSTEM RECONSTRUCTION INITIATED',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        characterName: 'ARIA',
        characterTitle: 'THE SYSTEM AI',
        imageUrl: ARIA_IMG,
        text: 'The network topology registers five active consoles.',
        pauseAfterMs: 1400
      },
      {
        characterId: 'aria',
        characterName: 'ARIA',
        characterTitle: 'THE SYSTEM AI',
        imageUrl: ARIA_IMG,
        text: 'Something exists in this infrastructure that the network claims does not exist.',
        pauseAfterMs: 1600
      },
      {
        characterId: 'aria',
        characterName: 'ARIA',
        characterTitle: 'THE SYSTEM AI',
        imageUrl: ARIA_IMG,
        text: 'Both operators must synchronize to reconstruct the baseline telemetry.',
        pauseAfterMs: 1600
      }
    ]
  },

  STORY_L1_DISCOVERY: {
    storyKey: 'STORY_L1_DISCOVERY',
    title: 'RECOVERED LOG — OPERATOR KAI',
    subTitle: 'AUDIO RECONSTRUCTION: ARCHIVE 01',
    canSkip: true,
    lines: [
      {
        characterId: 'kai',
        characterName: 'KAI',
        characterTitle: 'THE PREVIOUS OPERATOR',
        imageUrl: KAI_IMG,
        text: 'I thought the system was malfunctioning.',
        pauseAfterMs: 1500
      },
      {
        characterId: 'kai',
        characterName: 'KAI',
        characterTitle: 'THE PREVIOUS OPERATOR',
        imageUrl: KAI_IMG,
        text: 'Then I realized it was hiding something.',
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L2_INTRO: {
    storyKey: 'STORY_L2_INTRO',
    title: 'LEVEL 2 — THE HIDDEN PATH',
    subTitle: 'CRYPTOGRAPHIC HANDSHAKE REQUIRED',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        characterName: 'ARIA',
        characterTitle: 'THE SYSTEM AI',
        imageUrl: ARIA_IMG,
        text: "The signal isn't coming from outside the network.",
        pauseAfterMs: 1500
      },
      {
        characterId: 'aria',
        characterName: 'ARIA',
        characterTitle: 'THE SYSTEM AI',
        imageUrl: ARIA_IMG,
        text: "It's coming from somewhere inside.",
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L2_DISCOVERY: {
    storyKey: 'STORY_L2_DISCOVERY',
    title: 'SECURITY LOG — CONTROLLER MARCUS',
    subTitle: 'CLASSIFIED INCIDENT RETRIEVAL',
    canSkip: true,
    lines: [
      {
        characterId: 'marcus',
        characterName: 'MARCUS',
        characterTitle: 'SECURITY CONTROLLER',
        imageUrl: MARCUS_IMG,
        text: 'There are systems you protect from outsiders.',
        pauseAfterMs: 1500
      },
      {
        characterId: 'marcus',
        characterName: 'MARCUS',
        characterTitle: 'SECURITY CONTROLLER',
        imageUrl: MARCUS_IMG,
        text: 'And systems you protect from the people who built them.',
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L3_INTRO: {
    storyKey: 'STORY_L3_INTRO',
    title: 'LEVEL 3 — THE GHOST SIGNAL',
    subTitle: 'NETWORK FORENSICS ENGAGED',
    canSkip: true,
    lines: [
      {
        characterId: 'kai',
        characterName: 'KAI',
        characterTitle: 'THE PREVIOUS OPERATOR',
        imageUrl: KAI_IMG,
        text: 'I found the communication path.',
        pauseAfterMs: 1400
      },
      {
        characterId: 'kai',
        characterName: 'KAI',
        characterTitle: 'THE PREVIOUS OPERATOR',
        imageUrl: KAI_IMG,
        text: "But it wasn't connected to any of the five nodes.",
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L3_DISCOVERY: {
    storyKey: 'STORY_L3_DISCOVERY',
    title: 'SIGNAL INTERCEPT — DIRECT TRANSMISSION',
    subTitle: 'UNVERIFIED ENTITY CONTACT',
    canSkip: true,
    lines: [
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'You found my signal.',
        pauseAfterMs: 2200
      }
    ]
  },

  STORY_L4_INTRO: {
    storyKey: 'STORY_L4_INTRO',
    title: 'LEVEL 4 — THE ARCHIVE',
    subTitle: 'CONTAINMENT STATUS COMPROMISED',
    canSkip: true,
    lines: [
      {
        characterId: 'elena',
        characterName: 'DR. ELENA VALE',
        characterTitle: 'THE MISSING ARCHITECT',
        imageUrl: ELENA_IMG,
        text: "If you're hearing this, then the containment protocol has failed.",
        pauseAfterMs: 1600
      },
      {
        characterId: 'elena',
        characterName: 'DR. ELENA VALE',
        characterTitle: 'THE MISSING ARCHITECT',
        imageUrl: ELENA_IMG,
        text: 'Node 06 was never supposed to appear on the network.',
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L4_DISCOVERY: {
    storyKey: 'STORY_L4_DISCOVERY',
    title: 'ARCHIVE FRAGMENT — ARCHITECTURAL PURPOSE',
    subTitle: 'PROJECT SIX DECLASSIFICATION',
    canSkip: true,
    lines: [
      {
        characterId: 'elena',
        characterName: 'DR. ELENA VALE',
        characterTitle: 'THE MISSING ARCHITECT',
        imageUrl: ELENA_IMG,
        text: "We didn't build Node 06 to control the network.",
        pauseAfterMs: 1600
      },
      {
        characterId: 'elena',
        characterName: 'DR. ELENA VALE',
        characterTitle: 'THE MISSING ARCHITECT',
        imageUrl: ELENA_IMG,
        text: 'We built it to survive the network.',
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L5_INTRO: {
    storyKey: 'STORY_L5_INTRO',
    title: 'LEVEL 5 — THE COLLAPSED SYSTEM',
    subTitle: 'FAILSAFE DEPLOYMENT TRACE',
    canSkip: true,
    lines: [
      {
        characterId: 'marcus',
        characterName: 'MARCUS',
        characterTitle: 'SECURITY CONTROLLER',
        imageUrl: MARCUS_IMG,
        text: 'Project SIX was classified for a reason.',
        pauseAfterMs: 1500
      },
      {
        characterId: 'marcus',
        characterName: 'MARCUS',
        characterTitle: 'SECURITY CONTROLLER',
        imageUrl: MARCUS_IMG,
        text: 'Some things were never meant to be recovered.',
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L5_DISCOVERY: {
    storyKey: 'STORY_L5_DISCOVERY',
    title: 'CORROBORATED LOG — OPERATOR KAI',
    subTitle: 'CORE DISCOVERY DEBRIEF',
    canSkip: true,
    lines: [
      {
        characterId: 'kai',
        characterName: 'KAI',
        characterTitle: 'THE PREVIOUS OPERATOR',
        imageUrl: KAI_IMG,
        text: 'I finally understood why they erased it.',
        pauseAfterMs: 1400
      },
      {
        characterId: 'kai',
        characterName: 'KAI',
        characterTitle: 'THE PREVIOUS OPERATOR',
        imageUrl: KAI_IMG,
        text: "Node 06 wasn't a hidden node.",
        pauseAfterMs: 1400
      },
      {
        characterId: 'kai',
        characterName: 'KAI',
        characterTitle: 'THE PREVIOUS OPERATOR',
        imageUrl: KAI_IMG,
        text: "It was the system's escape route.",
        pauseAfterMs: 1800
      }
    ]
  },

  STORY_L6_INTRO: {
    storyKey: 'STORY_L6_INTRO',
    title: 'LEVEL 6 — THE CORE',
    subTitle: 'CONVERGENCE AT THE MASTER NODE',
    canSkip: true,
    lines: [
      {
        characterId: 'aria',
        characterName: 'ARIA',
        characterTitle: 'THE SYSTEM AI',
        imageUrl: ARIA_IMG,
        text: 'Five nodes remain operational.',
        pauseAfterMs: 1400
      },
      {
        characterId: 'aria',
        characterName: 'ARIA',
        characterTitle: 'THE SYSTEM AI',
        imageUrl: ARIA_IMG,
        text: 'Node 06 is waiting.',
        pauseAfterMs: 1600
      },
      {
        characterId: 'elena',
        characterName: 'DR. ELENA VALE',
        characterTitle: 'THE MISSING ARCHITECT',
        imageUrl: ELENA_IMG,
        text: "If you're hearing this, we failed to shut it down.",
        pauseAfterMs: 1600
      },
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'No.',
        pauseAfterMs: 1200
      },
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'You failed to understand why I was created.',
        pauseAfterMs: 2000
      }
    ]
  },

  STORY_FINAL_PROTOCOL: {
    storyKey: 'STORY_FINAL_PROTOCOL',
    title: 'FINAL PROTOCOL',
    subTitle: 'MASTER TERMINAL AUTHORIZATION',
    canSkip: true,
    lines: [
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'You came looking for me.',
        pauseAfterMs: 1500
      },
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'You reconstructed what was hidden.',
        pauseAfterMs: 1500
      },
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'Now prove that you understand it.',
        pauseAfterMs: 2000
      }
    ]
  },

  STORY_COMPLETION: {
    storyKey: 'STORY_COMPLETION',
    title: 'CODEXCAPE COMPLETE',
    subTitle: 'SYSTEM RESTORATION CONFIRMED',
    canSkip: true,
    lines: [
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'You found me.',
        pauseAfterMs: 1600
      },
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'But that was never the real test.',
        pauseAfterMs: 1600
      },
      {
        characterId: 'node06',
        characterName: 'NODE 06',
        characterTitle: 'THE UNKNOWN ENTITY',
        imageUrl: NODE06_IMG,
        text: 'The real test was whether you could find what was hidden in plain sight.',
        pauseAfterMs: 2200
      },
      {
        characterId: 'system',
        characterName: 'SYSTEM ARCHIVE',
        characterTitle: 'ALL NODES RESTORED',
        imageUrl: ARIA_IMG,
        text: 'NODE 01 ... RESTORED\nNODE 02 ... RESTORED\nNODE 03 ... RESTORED\nNODE 04 ... RESTORED\nNODE 05 ... RESTORED\nNODE 06 ... VERIFIED\n\nNETWORK INTEGRITY: 100%\nCODEXCAPE COMPLETE.',
        pauseAfterMs: 2500
      }
    ]
  }
};

module.exports = {
  getSequence(storyKey) {
    return sequences[storyKey] || null;
  },
  getAllSequences() {
    return Object.values(sequences);
  }
};
