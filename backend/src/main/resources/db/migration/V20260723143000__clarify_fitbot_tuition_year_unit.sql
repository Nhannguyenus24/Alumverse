UPDATE public.fitbot_knowledge_documents
SET content = replace(
        content,
        '10. Học phí dự kiến (năm)
STT Tên ngành Học phí 2026-2027 (VNĐ)
1 Sinh học 38.600.000',
        '10. Học phí dự kiến năm học 2026-2027
Đơn vị: VNĐ/năm. Các mức dưới đây là học phí dự kiến theo năm, không phải theo học kỳ.
STT Tên ngành Học phí 2026-2027 (VNĐ/năm)
1 Sinh học 38.600.000'
    ),
    sync_status = 'PENDING',
    sync_error = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE source_name = 'fitbot-db-data1'
  AND content LIKE '%10. Học phí dự kiến (năm)%';
