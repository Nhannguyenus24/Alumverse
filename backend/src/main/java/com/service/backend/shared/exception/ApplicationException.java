package com.service.backend.shared.exception;

import com.service.backend.shared.enums.ErrorCode;
import lombok.Getter;

@Getter
public class ApplicationException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApplicationException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ApplicationException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public ApplicationException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public ApplicationException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }

    /**
     * Domain/control-flow exception: it is created eagerly at reactive-assembly time on ~200
     * {@code switchIfEmpty(Mono.error(new ApplicationException(...)))} sites — on every request,
     * whether or not the error ever fires. It carries a stable {@link ErrorCode} + message and its
     * stack trace is never logged ({@code GlobalExceptionHandler#handleApplicationException} reads
     * only the code/message), so we skip the expensive JVM stack-walk. Pure performance win, no
     * behaviour change.
     */
    @Override
    public Throwable fillInStackTrace() {
        return this;
    }
}

