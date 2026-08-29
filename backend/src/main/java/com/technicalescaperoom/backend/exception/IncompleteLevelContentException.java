package com.technicalescaperoom.backend.exception;

public class IncompleteLevelContentException extends RuntimeException {
    public IncompleteLevelContentException(String message) {
        super(message);
    }
}
