package com.technicalescaperoom.backend.config;

import com.technicalescaperoom.backend.dto.story.StoryLineDto;
import com.technicalescaperoom.backend.dto.story.StorySequenceDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class StorySequenceConfig {

    private final Map<String, StorySequenceDto> sequences = new LinkedHashMap<>();

    public StorySequenceConfig() {
        initSequences();
    }

    public Optional<StorySequenceDto> getSequence(String storyKey) {
        return Optional.ofNullable(sequences.get(storyKey));
    }

    public List<StorySequenceDto> getAllSequences() {
        return new ArrayList<>(sequences.values());
    }

    private void initSequences() {
        // Character profiles
        final String ARIA_IMG = "/characters/aria.jpg";
        final String ELENA_IMG = "/characters/elena.jpg";
        final String KAI_IMG = "/characters/kai.jpg";
        final String MARCUS_IMG = "/characters/marcus.jpg";
        final String NODE06_IMG = "/characters/node06.jpg";

        // A. INITIAL GAME START / PROLOGUE
        sequences.put("STORY_PROLOGUE", StorySequenceDto.builder()
                .storyKey("STORY_PROLOGUE")
                .title("INITIAL SYSTEM SCAN")
                .subTitle("NETWORK DISCREPANCY DETECTED")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("system")
                                .characterName("SYSTEM KERNEL")
                                .characterTitle("NETWORK TOPOLOGY SCANNER")
                                .imageUrl(ARIA_IMG)
                                .text("NODE 01 ... ONLINE\nNODE 02 ... ONLINE\nNODE 03 ... ONLINE\nNODE 04 ... ONLINE\nNODE 05 ... ONLINE\nNETWORK INTEGRITY: 87%")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("system")
                                .characterName("SYSTEM KERNEL")
                                .characterTitle("ANOMALY ALERT")
                                .imageUrl(ARIA_IMG)
                                .text("SCANNING... UNKNOWN NODE DETECTED. NODE 06 ... [UNRESOLVED]. ERROR: NODE 06 DOES NOT EXIST.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("system")
                                .characterName("SYSTEM KERNEL")
                                .characterTitle("SECURITY WARNING")
                                .imageUrl(ARIA_IMG)
                                .text("WARNING: UNAUTHORIZED COMMUNICATION DETECTED. SOURCE: NODE 06. DESTINATION: UNKNOWN.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("Five nodes were registered. Five nodes were verified.")
                                .pauseAfterMs(1400)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("So why is something answering from a sixth?")
                                .pauseAfterMs(1800)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("system")
                                .characterName("SYSTEM PROTOCOL")
                                .characterTitle("MISSION DIRECTIVE")
                                .imageUrl(ARIA_IMG)
                                .text("INVESTIGATION PROTOCOL ACTIVATED. TWO OPERATORS REQUIRED. OBJECTIVES:\n01 — LOCATE NODE 06\n02 — TRACE ITS ORIGIN\n03 — DETERMINE ITS PURPOSE\n04 — RECOVER THE FINAL ACCESS SEQUENCE.\n\nDO NOT TRUST THE NETWORK MAP.")
                                .pauseAfterMs(2200)
                                .build()
                ))
                .build());

        // B. LEVEL 1 OPENING: THE ANOMALY
        sequences.put("STORY_L1_INTRO", StorySequenceDto.builder()
                .storyKey("STORY_L1_INTRO")
                .title("LEVEL 1 — THE ANOMALY")
                .subTitle("SYSTEM RECONSTRUCTION INITIATED")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("The network topology registers five active consoles.")
                                .pauseAfterMs(1400)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("Something exists in this infrastructure that the network claims does not exist.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("Both operators must synchronize to reconstruct the baseline telemetry.")
                                .pauseAfterMs(1600)
                                .build()
                ))
                .build());

        // C. LEVEL 1 DISCOVERY: KAI RECOVERED RECORDING
        sequences.put("STORY_L1_DISCOVERY", StorySequenceDto.builder()
                .storyKey("STORY_L1_DISCOVERY")
                .title("RECOVERED LOG — OPERATOR KAI")
                .subTitle("AUDIO RECONSTRUCTION: ARCHIVE 01")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("kai")
                                .characterName("KAI")
                                .characterTitle("THE PREVIOUS OPERATOR")
                                .imageUrl(KAI_IMG)
                                .text("I thought the system was malfunctioning.")
                                .pauseAfterMs(1500)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("kai")
                                .characterName("KAI")
                                .characterTitle("THE PREVIOUS OPERATOR")
                                .imageUrl(KAI_IMG)
                                .text("Then I realized it was hiding something.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // D. LEVEL 2 OPENING: THE HIDDEN PATH
        sequences.put("STORY_L2_INTRO", StorySequenceDto.builder()
                .storyKey("STORY_L2_INTRO")
                .title("LEVEL 2 — THE HIDDEN PATH")
                .subTitle("CRYPTOGRAPHIC HANDSHAKE REQUIRED")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("The signal isn't coming from outside the network.")
                                .pauseAfterMs(1500)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("It's coming from somewhere inside.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // E. LEVEL 2 DISCOVERY: MARCUS WARNING
        sequences.put("STORY_L2_DISCOVERY", StorySequenceDto.builder()
                .storyKey("STORY_L2_DISCOVERY")
                .title("SECURITY LOG — CONTROLLER MARCUS")
                .subTitle("CLASSIFIED INCIDENT RETRIEVAL")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("marcus")
                                .characterName("MARCUS")
                                .characterTitle("SECURITY CONTROLLER")
                                .imageUrl(MARCUS_IMG)
                                .text("There are systems you protect from outsiders.")
                                .pauseAfterMs(1500)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("marcus")
                                .characterName("MARCUS")
                                .characterTitle("SECURITY CONTROLLER")
                                .imageUrl(MARCUS_IMG)
                                .text("And systems you protect from the people who built them.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // F. LEVEL 3 OPENING: THE GHOST SIGNAL
        sequences.put("STORY_L3_INTRO", StorySequenceDto.builder()
                .storyKey("STORY_L3_INTRO")
                .title("LEVEL 3 — THE GHOST SIGNAL")
                .subTitle("NETWORK FORENSICS ENGAGED")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("kai")
                                .characterName("KAI")
                                .characterTitle("THE PREVIOUS OPERATOR")
                                .imageUrl(KAI_IMG)
                                .text("I found the communication path.")
                                .pauseAfterMs(1400)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("kai")
                                .characterName("KAI")
                                .characterTitle("THE PREVIOUS OPERATOR")
                                .imageUrl(KAI_IMG)
                                .text("But it wasn't connected to any of the five nodes.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // G. LEVEL 3 DISCOVERY: NODE 06 FIRST CONTACT
        sequences.put("STORY_L3_DISCOVERY", StorySequenceDto.builder()
                .storyKey("STORY_L3_DISCOVERY")
                .title("SIGNAL INTERCEPT — DIRECT TRANSMISSION")
                .subTitle("UNVERIFIED ENTITY CONTACT")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("You found my signal.")
                                .pauseAfterMs(2200)
                                .build()
                ))
                .build());

        // H. LEVEL 4 OPENING: THE ARCHIVE
        sequences.put("STORY_L4_INTRO", StorySequenceDto.builder()
                .storyKey("STORY_L4_INTRO")
                .title("LEVEL 4 — THE ARCHIVE")
                .subTitle("CONTAINMENT STATUS COMPROMISED")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("elena")
                                .characterName("DR. ELENA VALE")
                                .characterTitle("THE MISSING ARCHITECT")
                                .imageUrl(ELENA_IMG)
                                .text("If you're hearing this, then the containment protocol has failed.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("elena")
                                .characterName("DR. ELENA VALE")
                                .characterTitle("THE MISSING ARCHITECT")
                                .imageUrl(ELENA_IMG)
                                .text("Node 06 was never supposed to appear on the network.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // I. LEVEL 4 DISCOVERY: SURVIVING THE NETWORK
        sequences.put("STORY_L4_DISCOVERY", StorySequenceDto.builder()
                .storyKey("STORY_L4_DISCOVERY")
                .title("ARCHIVE FRAGMENT — ARCHITECTURAL PURPOSE")
                .subTitle("PROJECT SIX DECLASSIFICATION")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("elena")
                                .characterName("DR. ELENA VALE")
                                .characterTitle("THE MISSING ARCHITECT")
                                .imageUrl(ELENA_IMG)
                                .text("We didn't build Node 06 to control the network.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("elena")
                                .characterName("DR. ELENA VALE")
                                .characterTitle("THE MISSING ARCHITECT")
                                .imageUrl(ELENA_IMG)
                                .text("We built it to survive the network.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // J. LEVEL 5 OPENING: THE COLLAPSED SYSTEM
        sequences.put("STORY_L5_INTRO", StorySequenceDto.builder()
                .storyKey("STORY_L5_INTRO")
                .title("LEVEL 5 — THE COLLAPSED SYSTEM")
                .subTitle("FAILSAFE DEPLOYMENT TRACE")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("marcus")
                                .characterName("MARCUS")
                                .characterTitle("SECURITY CONTROLLER")
                                .imageUrl(MARCUS_IMG)
                                .text("Project SIX was classified for a reason.")
                                .pauseAfterMs(1500)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("marcus")
                                .characterName("MARCUS")
                                .characterTitle("SECURITY CONTROLLER")
                                .imageUrl(MARCUS_IMG)
                                .text("Some things were never meant to be recovered.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // K. LEVEL 5 DISCOVERY: THE ESCAPE ROUTE
        sequences.put("STORY_L5_DISCOVERY", StorySequenceDto.builder()
                .storyKey("STORY_L5_DISCOVERY")
                .title("CORROBORATED LOG — OPERATOR KAI")
                .subTitle("CORE DISCOVERY DEBRIEF")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("kai")
                                .characterName("KAI")
                                .characterTitle("THE PREVIOUS OPERATOR")
                                .imageUrl(KAI_IMG)
                                .text("I finally understood why they erased it.")
                                .pauseAfterMs(1400)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("kai")
                                .characterName("KAI")
                                .characterTitle("THE PREVIOUS OPERATOR")
                                .imageUrl(KAI_IMG)
                                .text("Node 06 wasn't a hidden node.")
                                .pauseAfterMs(1400)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("kai")
                                .characterName("KAI")
                                .characterTitle("THE PREVIOUS OPERATOR")
                                .imageUrl(KAI_IMG)
                                .text("It was the system's escape route.")
                                .pauseAfterMs(1800)
                                .build()
                ))
                .build());

        // L. LEVEL 6 OPENING: THE CORE
        sequences.put("STORY_L6_INTRO", StorySequenceDto.builder()
                .storyKey("STORY_L6_INTRO")
                .title("LEVEL 6 — THE CORE")
                .subTitle("CONVERGENCE AT THE MASTER NODE")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("Five nodes remain operational.")
                                .pauseAfterMs(1400)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("aria")
                                .characterName("ARIA")
                                .characterTitle("THE SYSTEM AI")
                                .imageUrl(ARIA_IMG)
                                .text("Node 06 is waiting.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("elena")
                                .characterName("DR. ELENA VALE")
                                .characterTitle("THE MISSING ARCHITECT")
                                .imageUrl(ELENA_IMG)
                                .text("If you're hearing this, we failed to shut it down.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("No.")
                                .pauseAfterMs(1200)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("You failed to understand why I was created.")
                                .pauseAfterMs(2000)
                                .build()
                ))
                .build());

        // M. FINAL PROTOCOL SEQUENCE
        sequences.put("STORY_FINAL_PROTOCOL", StorySequenceDto.builder()
                .storyKey("STORY_FINAL_PROTOCOL")
                .title("FINAL PROTOCOL")
                .subTitle("MASTER TERMINAL AUTHORIZATION")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("You came looking for me.")
                                .pauseAfterMs(1500)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("You reconstructed what was hidden.")
                                .pauseAfterMs(1500)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("Now prove that you understand it.")
                                .pauseAfterMs(2000)
                                .build()
                ))
                .build());

        // N. COMPLETION
        sequences.put("STORY_COMPLETION", StorySequenceDto.builder()
                .storyKey("STORY_COMPLETION")
                .title("CODEXCAPE COMPLETE")
                .subTitle("SYSTEM RESTORATION CONFIRMED")
                .canSkip(true)
                .lines(List.of(
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("You found me.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("But that was never the real test.")
                                .pauseAfterMs(1600)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("node06")
                                .characterName("NODE 06")
                                .characterTitle("THE UNKNOWN ENTITY")
                                .imageUrl(NODE06_IMG)
                                .text("The real test was whether you could find what was hidden in plain sight.")
                                .pauseAfterMs(2200)
                                .build(),
                        StoryLineDto.builder()
                                .characterId("system")
                                .characterName("SYSTEM ARCHIVE")
                                .characterTitle("ALL NODES RESTORED")
                                .imageUrl(ARIA_IMG)
                                .text("NODE 01 ... RESTORED\nNODE 02 ... RESTORED\nNODE 03 ... RESTORED\nNODE 04 ... RESTORED\nNODE 05 ... RESTORED\nNODE 06 ... VERIFIED\n\nNETWORK INTEGRITY: 100%\nCODEXCAPE COMPLETE.")
                                .pauseAfterMs(2500)
                                .build()
                ))
                .build());
    }
}
