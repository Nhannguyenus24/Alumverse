package com.service.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("fund_expenses")
public class FundExpense {

    @Id
    private Long id;

    @Column("fund_id")
    private Long fundId;

    private String title;

    private BigDecimal amount;

    @Column("expense_date")
    private LocalDate expenseDate;

    @Column("proof_document_url")
    private String proofDocumentUrl;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
