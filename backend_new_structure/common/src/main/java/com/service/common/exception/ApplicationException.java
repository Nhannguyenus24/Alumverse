package com.service.common.exception;

import com.service.common.constants.ErrorCode;
import lombok.Getter;

@Getter
public class ApplicationException extends RuntimeException {

    private final String errorCode;

    public ApplicationException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode.name();
    }
}

