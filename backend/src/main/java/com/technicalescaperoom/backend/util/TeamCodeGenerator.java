package com.technicalescaperoom.backend.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Random;
import java.util.function.Predicate;

@Component
public class TeamCodeGenerator {

    private static final String CHARACTERS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // Excludes ambiguous: 0, O, 1, I, L
    private static final Random RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 10;

    /**
     * Generates a unique team code for an event.
     * Starts with sequential format e.g., TEAM-001, TEAM-002 based on target index,
     * or generates readable 4-character alphanumeric code e.g. TEAM-7821.
     * Validates against existencePredicate to ensure uniqueness.
     */
    public String generateUniqueTeamCode(long currentTeamCount, Predicate<String> isCodeTaken) {
        // Attempt sequential format first (e.g., TEAM-001, TEAM-002...)
        long candidateIndex = currentTeamCount + 1;
        String candidateCode = String.format("TEAM-%03d", candidateIndex);
        if (!isCodeTaken.test(candidateCode)) {
            return candidateCode;
        }

        // Retry with padded or random alphanumeric code if collision occurs
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            StringBuilder sb = new StringBuilder("TEAM-");
            for (int i = 0; i < 4; i++) {
                sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
            }
            String randomCode = sb.toString();
            if (!isCodeTaken.test(randomCode)) {
                return randomCode;
            }
        }

        // Fallback with timestamp suffix if extreme collisions occur
        return "TEAM-" + System.currentTimeMillis() % 10000;
    }
}
