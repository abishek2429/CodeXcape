package com.technicalescaperoom.backend.config.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerPrincipal implements Serializable {
    private Long playerId;
    private Long teamId;
    private Long eventId;
    private Integer playerNumber;
    private String teamCode;
    private String teamName;
    private String displayName;
    private String sessionToken;
}
