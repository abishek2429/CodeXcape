package com.technicalescaperoom.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HintConfigDto {
    private Long id;
    private Integer levelNumber;
    
    @NotBlank
    private String hintContent;
    
    @Builder.Default
    private Integer displayOrder = 1;
    
    @Builder.Default
    private Boolean isActive = true;
}
