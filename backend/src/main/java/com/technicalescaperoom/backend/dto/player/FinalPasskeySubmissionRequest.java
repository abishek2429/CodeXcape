package com.technicalescaperoom.backend.dto.player;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalPasskeySubmissionRequest {

    @NotBlank(message = "Passkey is required")
    @Pattern(regexp = "^\\d{6}$", message = "Passkey must be exactly 6 digits")
    private String passkey;
}
