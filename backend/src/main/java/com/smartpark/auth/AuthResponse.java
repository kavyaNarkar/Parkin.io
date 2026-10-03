package com.smartpark.auth;

import com.smartpark.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {

    private UUID userId;
    private String name;
    private String email;
    private Role role;
    private String token;
}
