package com.service.backend.config;

import io.r2dbc.spi.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.r2dbc.connection.R2dbcTransactionManager;
import org.springframework.transaction.ReactiveTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.reactive.TransactionalOperator;

@Configuration
@EnableTransactionManagement
public class R2dbcConfig {

    @Bean
    public ReactiveTransactionManager transactionManager(ConnectionFactory connectionFactory) {
        return new R2dbcTransactionManager(connectionFactory);
    }

    /**
     * Programmatic transaction boundary for flows that must recover after a failed
     * statement. Once a statement errors inside a transaction, PostgreSQL aborts it
     * ("current transaction is aborted") and rejects every further command, so retry
     * logic cannot re-query within the same transaction — it must run in a fresh one.
     * Wrapping only the mutation with this operator lets callers place their retry
     * outside the boundary, where it gets a new transaction.
     */
    @Bean
    public TransactionalOperator transactionalOperator(ReactiveTransactionManager transactionManager) {
        return TransactionalOperator.create(transactionManager);
    }
}
