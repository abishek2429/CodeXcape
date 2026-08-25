package com.technicalescaperoom.backend.config.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;

public class PlayerAuthenticationToken extends AbstractAuthenticationToken {

    private final PlayerPrincipal principal;
    private final String sessionToken;

    public PlayerAuthenticationToken(PlayerPrincipal principal, String sessionToken) {
        super(Collections.singletonList(new SimpleGrantedAuthority("ROLE_PLAYER")));
        this.principal = principal;
        this.sessionToken = sessionToken;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return sessionToken;
    }

    @Override
    public PlayerPrincipal getPrincipal() {
        return principal;
    }
}
