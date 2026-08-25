package com.technicalescaperoom.backend.dto.admin;

import com.technicalescaperoom.backend.enums.PlayerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDto {
    private Long id;
    private Integer playerNumber;
    private String displayName;
    private PlayerStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
