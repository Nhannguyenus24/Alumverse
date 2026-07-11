package com.service.backend.survey.service;

import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.SurveyForm;
import com.service.backend.shared.entity.SurveySubmission;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.SurveyStatus;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.SurveyInsightService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.survey.dao.SurveyFormR2dbcRepository;
import com.service.backend.survey.dao.SurveySubmissionR2dbcRepository;
import com.service.backend.survey.dto.*;
import com.service.backend.user.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Service
public class SurveyService {

    private static final Logger log = LoggerFactory.getLogger(SurveyService.class);

    private final SurveyFormR2dbcRepository formRepo;
    private final SurveySubmissionR2dbcRepository submissionRepo;
    private final NotificationService notificationService;
    private final SurveyInsightService surveyInsightService;

    public SurveyService(SurveyFormR2dbcRepository formRepo,
                         SurveySubmissionR2dbcRepository submissionRepo,
                         NotificationService notificationService,
                         SurveyInsightService surveyInsightService) {
        this.formRepo = formRepo;
        this.submissionRepo = submissionRepo;
        this.notificationService = notificationService;
        this.surveyInsightService = surveyInsightService;
    }

    // ============================ ADMIN ============================

    public Mono<SurveyResponse> createSurvey(CreateSurveyRequest request) {
        return Mono.zip(
                        SecurityUtils.getCurrentUserId(),
                        SecurityUtils.resolveOrganizationId(
                                request.getOrganizationId() == null ? null : request.getOrganizationId().intValue())
                                // ADMIN without an explicit org falls back to the org in their token.
                                .switchIfEmpty(SecurityUtils.getCurrentOrganizationId())
                                .switchIfEmpty(Mono.error(new ApplicationException(
                                        ErrorCode.ORGANIZATION_ID_REQUIRED,
                                        "organizationId is required when creating a survey")))
                )
                .flatMap(tuple -> {
                    Long creatorId = tuple.getT1();
                    Long orgId = tuple.getT2().longValue();
                    String questionsJson = JsonUtils.toJson(request.getQuestions());
                    return formRepo.insertForm(
                            orgId,
                            creatorId,
                            request.getTitle(),
                            request.getDescription(),
                            questionsJson,
                            request.getStartAt(),
                            request.getDurationMinutes(),
                            SurveyStatus.DRAFT.name(),
                            request.getAllowMultiple() != null && request.getAllowMultiple());
                })
                .flatMap(this::toResponseWithCount)
                .doOnSuccess(r -> log.info("createSurvey created id={}", r.getId()))
                .doOnError(e -> log.error("Error creating survey", e));
    }

    public Mono<SurveyResponse> updateSurvey(Long id, UpdateSurveyRequest request) {
        return formRepo.findByIdWithJson(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                        "Survey not found with id: " + id)))
                .flatMap(existing -> {
                    if (!SurveyStatus.DRAFT.name().equalsIgnoreCase(existing.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_EDITABLE));
                    }
                    String questionsJson = JsonUtils.toJson(request.getQuestions());
                    return formRepo.updateForm(
                            id,
                            request.getTitle(),
                            request.getDescription(),
                            questionsJson,
                            request.getStartAt(),
                            request.getDurationMinutes(),
                            request.getAllowMultiple() != null && request.getAllowMultiple());
                })
                .flatMap(this::toResponseWithCount)
                .doOnSuccess(r -> log.info("updateSurvey updated id={}", id))
                .doOnError(e -> log.error("Error updating survey id={}", id, e));
    }

    public Mono<SurveyResponse> getSurveyById(Long id) {
        return formRepo.findByIdWithJson(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                        "Survey not found with id: " + id)))
                .flatMap(this::toResponseWithCount);
    }

    public Mono<PaginatedResponse<SurveyResponse>> listSurveys(Long organizationId, String status,
                                                               String keyword, int page, int size) {
        int offset = page * size;
        Flux<SurveyForm> items;
        Mono<Long> total;

        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasStatus = status != null && !status.isBlank();

        if (hasKeyword) {
            if (organizationId != null) {
                items = formRepo.searchByOrganization(organizationId, keyword, size, offset);
                total = formRepo.countSearchByOrganization(organizationId, keyword);
            } else {
                items = formRepo.searchAll(keyword, size, offset);
                total = formRepo.countSearchAll(keyword);
            }
        } else if (hasStatus) {
            String st = SurveyStatus.fromValue(status) == null ? status : SurveyStatus.fromValue(status).name();
            if (organizationId != null) {
                items = formRepo.findByOrganizationAndStatus(organizationId, st, size, offset);
                total = formRepo.countByOrganizationAndStatus(organizationId, st);
            } else {
                items = formRepo.findByStatus(st, size, offset);
                total = formRepo.countByStatus(st);
            }
        } else if (organizationId != null) {
            items = formRepo.findByOrganization(organizationId, size, offset);
            total = formRepo.countByOrganization(organizationId);
        } else {
            items = formRepo.findAllForms(size, offset);
            total = formRepo.countAllForms();
        }

        return PaginationHelper.paginate(items, total, page, size,
                forms -> Flux.fromIterable(forms)
                        .concatMap(this::toResponseWithCount)
                        .collectList());
    }

    /** Open (or reopen) a survey: begins the active window now. */
    public Mono<SurveyResponse> openSurvey(Long id) {
        return formRepo.findByIdWithJson(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                        "Survey not found with id: " + id)))
                .flatMap(form -> formRepo.updateStatusAndStart(id, SurveyStatus.OPEN.name(), LocalDateTime.now())
                        .then(formRepo.findByIdWithJson(id)))
                .flatMap(this::toResponseWithCount)
                .doOnSuccess(r -> log.info("openSurvey id={}", id));
    }

    /** Close/disable a survey. */
    public Mono<SurveyResponse> closeSurvey(Long id) {
        return formRepo.findByIdWithJson(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                        "Survey not found with id: " + id)))
                .flatMap(form -> formRepo.updateStatus(id, SurveyStatus.CLOSED.name())
                        .then(formRepo.findByIdWithJson(id)))
                .flatMap(this::toResponseWithCount)
                .doOnSuccess(r -> log.info("closeSurvey id={}", id));
    }

    public Mono<Void> deleteSurvey(Long id) {
        return formRepo.findByIdWithJson(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                        "Survey not found with id: " + id)))
                .flatMap(form -> formRepo.deleteById(id))
                .doOnSuccess(v -> log.info("deleteSurvey id={}", id));
    }

    public Mono<PaginatedResponse<SurveySubmissionResponse>> getSubmissions(Long formId, int page, int size) {
        int offset = page * size;
        return formRepo.findByIdWithJson(formId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                        "Survey not found with id: " + formId)))
                .then(PaginationHelper.paginate(
                        submissionRepo.findByFormIdWithMember(formId, size, offset)
                                .map(p -> SurveySubmissionResponse.builder()
                                        .id(p.getId())
                                        .formId(p.getFormId())
                                        .memberId(p.getMemberId())
                                        .memberName(p.getMemberName())
                                        .memberEmail(p.getMemberEmail())
                                        .answers(JsonUtils.fromJsonToMap(p.getAnswersData()))
                                        .submittedAt(p.getSubmittedAt())
                                        .build()),
                        submissionRepo.countByFormId(formId),
                        page, size));
    }

    public Mono<SurveySummaryResponse> getSummary(Long formId) {
        return formRepo.findByIdWithJson(formId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                        "Survey not found with id: " + formId)))
                .flatMap(form -> submissionRepo.findAllByFormId(formId).collectList()
                        .map(subs -> buildSummary(form, subs)));
    }

    public Mono<SurveyInsightResponse> getInsight(Long formId) {
        return getSummary(formId)
                .flatMap(summary -> {
                    String summaryJson = JsonUtils.toJson(summary);
                    return Mono.fromCallable(() -> surveyInsightService.summarize(summaryJson))
                            .subscribeOn(Schedulers.boundedElastic())
                            .map(text -> SurveyInsightResponse.builder()
                                    .surveyId(formId)
                                    .totalSubmissions(summary.getTotalSubmissions())
                                    .insight(text)
                                    .generatedByAi(text != null && !text.contains("Chưa cấu hình khóa AI"))
                                    .build())
                            .onErrorResume(e -> {
                                log.error("AI insight failed for survey {}", formId, e);
                                return Mono.just(SurveyInsightResponse.builder()
                                        .surveyId(formId)
                                        .totalSubmissions(summary.getTotalSubmissions())
                                        .insight("Không thể tạo phân tích AI vào lúc này. Vui lòng thử lại sau.")
                                        .generatedByAi(false)
                                        .build());
                            });
                });
    }

    // ============================ USER ============================

    public Mono<List<SurveyResponse>> getActiveSurveys() {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentOrganizationId())
                .flatMap(tuple -> {
                    Long userId = tuple.getT1();
                    Long orgId = tuple.getT2().longValue();
                    return formRepo.findActiveByOrganization(orgId, LocalDateTime.now())
                            .concatMap(form -> toResponseForUser(form, userId))
                            .collectList();
                });
    }

    public Mono<SurveyResponse> getSurveyForUser(Long formId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> formRepo.findByIdWithJson(formId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                                "Survey not found with id: " + formId)))
                        .flatMap(form -> toResponseForUser(form, userId)));
    }

    public Mono<SurveySubmissionResponse> submitSurvey(Long formId, SubmitSurveyRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> formRepo.findByIdWithJson(formId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                                "Survey not found with id: " + formId)))
                        .flatMap(form -> {
                            if (!isActive(form)) {
                                return Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_OPEN));
                            }
                            validateRequiredAnswers(form, request.getAnswers());
                            boolean allowMultiple = Boolean.TRUE.equals(form.getAllowMultiple());
                            Mono<Long> alreadyCount = allowMultiple
                                    ? Mono.just(0L)
                                    : submissionRepo.countByFormIdAndMemberId(formId, userId);
                            return alreadyCount.flatMap(cnt -> {
                                if (!allowMultiple && cnt > 0) {
                                    return Mono.error(new ApplicationException(ErrorCode.SURVEY_ALREADY_SUBMITTED));
                                }
                                String answersJson = JsonUtils.toJson(request.getAnswers());
                                return submissionRepo.insertSubmission(formId, userId, answersJson)
                                        .doOnSuccess(sub -> notifySubmission(userId, form))
                                        .map(sub -> SurveySubmissionResponse.builder()
                                                .id(sub.getId())
                                                .formId(sub.getFormId())
                                                .memberId(sub.getMemberId())
                                                .answers(request.getAnswers())
                                                .submittedAt(sub.getSubmittedAt())
                                                .build());
                            });
                        }))
                .doOnError(e -> log.error("Error submitting survey id={}", formId, e));
    }

    public Mono<SurveySubmissionResponse> getMySubmission(Long formId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> submissionRepo.findLatestByFormIdAndMemberId(formId, userId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.SURVEY_NOT_FOUND,
                                "No submission found for this survey")))
                        .map(sub -> SurveySubmissionResponse.builder()
                                .id(sub.getId())
                                .formId(sub.getFormId())
                                .memberId(sub.getMemberId())
                                .answers(sub.getAnswers())
                                .submittedAt(sub.getSubmittedAt())
                                .build()));
    }

    // ============================ helpers ============================

    private void notifySubmission(Long userId, SurveyForm form) {
        try {
            notificationService.createNotificationAsync(
                    userId.intValue(),
                    "Đã hoàn thành khảo sát",
                    "Bạn đã hoàn thành khảo sát \"" + form.getTitle() + "\". Bấm để xem lại câu trả lời.",
                    "/surveys/" + form.getId() + "/my-submission");
        } catch (Exception e) {
            log.warn("Failed to enqueue survey submission notification for user {}", userId, e);
        }
    }

    private void validateRequiredAnswers(SurveyForm form, Map<String, Object> answers) {
        List<SurveyQuestionDto> questions = form.getQuestions();
        for (SurveyQuestionDto q : questions) {
            if (Boolean.TRUE.equals(q.getIsRequired())) {
                Object val = answers == null ? null : answers.get(q.getId());
                boolean missing = val == null
                        || (val instanceof String s && s.isBlank())
                        || (val instanceof Collection<?> c && c.isEmpty());
                if (missing) {
                    throw new ApplicationException(ErrorCode.SURVEY_ANSWER_INVALID,
                            "Missing required answer for question: " + q.getId());
                }
            }
        }
    }

    private LocalDateTime endAt(SurveyForm form) {
        if (form.getStartAt() == null || form.getDurationMinutes() == null) return null;
        return form.getStartAt().plusMinutes(form.getDurationMinutes());
    }

    private String effectiveStatus(SurveyForm form) {
        String status = form.getStatus();
        if (SurveyStatus.OPEN.name().equalsIgnoreCase(status)) {
            LocalDateTime end = endAt(form);
            if (end != null && LocalDateTime.now().isAfter(end)) {
                return SurveyStatus.CLOSED.name();
            }
        }
        return status;
    }

    private boolean isActive(SurveyForm form) {
        if (!SurveyStatus.OPEN.name().equalsIgnoreCase(form.getStatus())) return false;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = endAt(form);
        boolean started = form.getStartAt() == null || !now.isBefore(form.getStartAt());
        boolean notEnded = end == null || now.isBefore(end);
        return started && notEnded;
    }

    private SurveyResponse toResponse(SurveyForm form) {
        return SurveyResponse.builder()
                .id(form.getId())
                .organizationId(form.getOrganizationId())
                .creatorMemberId(form.getCreatorMemberId())
                .title(form.getTitle())
                .description(form.getDescription())
                .questions(form.getQuestions())
                .startAt(form.getStartAt())
                .durationMinutes(form.getDurationMinutes())
                .endAt(endAt(form))
                .status(form.getStatus())
                .effectiveStatus(effectiveStatus(form))
                .allowMultiple(form.getAllowMultiple())
                .createdAt(form.getCreatedAt())
                .updatedAt(form.getUpdatedAt())
                .build();
    }

    private Mono<SurveyResponse> toResponseWithCount(SurveyForm form) {
        return submissionRepo.countByFormId(form.getId())
                .map(count -> {
                    SurveyResponse r = toResponse(form);
                    r.setSubmissionCount(count);
                    return r;
                });
    }

    private Mono<SurveyResponse> toResponseForUser(SurveyForm form, Long userId) {
        return submissionRepo.countByFormIdAndMemberId(form.getId(), userId)
                .map(count -> {
                    SurveyResponse r = toResponse(form);
                    r.setHasSubmitted(count > 0);
                    return r;
                });
    }

    private SurveySummaryResponse buildSummary(SurveyForm form, List<SurveySubmission> submissions) {
        List<SurveyQuestionDto> questions = form.getQuestions();
        List<Map<String, Object>> allAnswers = submissions.stream()
                .map(SurveySubmission::getAnswers)
                .toList();

        List<SurveySummaryResponse.QuestionSummary> qSummaries = new ArrayList<>();
        for (SurveyQuestionDto q : questions) {
            SurveySummaryResponse.QuestionSummary.QuestionSummaryBuilder qs =
                    SurveySummaryResponse.QuestionSummary.builder()
                            .questionId(q.getId())
                            .text(q.getText())
                            .type(q.getType());

            String type = q.getType() == null ? "" : q.getType().toUpperCase();
            switch (type) {
                case "SINGLE_CHOICE", "MULTI_CHOICE" -> qs.optionCounts(countOptions(q, allAnswers));
                case "NUMBER", "RATING" -> qs.numericStats(numericStats(q, allAnswers));
                default -> qs.textAnswers(textAnswers(q, allAnswers)); // SHORT_TEXT, DATE, others
            }
            qSummaries.add(qs.build());
        }

        return SurveySummaryResponse.builder()
                .surveyId(form.getId())
                .title(form.getTitle())
                .totalSubmissions((long) submissions.size())
                .questions(qSummaries)
                .build();
    }

    private List<SurveySummaryResponse.OptionCount> countOptions(SurveyQuestionDto q,
                                                                 List<Map<String, Object>> allAnswers) {
        List<SurveySummaryResponse.OptionCount> counts = new ArrayList<>();
        List<SurveyOptionDto> options = q.getOptions() == null ? List.of() : q.getOptions();
        for (SurveyOptionDto opt : options) {
            long c = 0;
            for (Map<String, Object> ans : allAnswers) {
                Object val = ans.get(q.getId());
                if (val instanceof Collection<?> coll) {
                    if (coll.stream().anyMatch(v -> String.valueOf(v).equals(opt.getId()))) c++;
                } else if (val != null && String.valueOf(val).equals(opt.getId())) {
                    c++;
                }
            }
            counts.add(SurveySummaryResponse.OptionCount.builder()
                    .optionId(opt.getId())
                    .optionText(opt.getText())
                    .count(c)
                    .build());
        }
        return counts;
    }

    private List<String> textAnswers(SurveyQuestionDto q, List<Map<String, Object>> allAnswers) {
        List<String> texts = new ArrayList<>();
        for (Map<String, Object> ans : allAnswers) {
            Object val = ans.get(q.getId());
            if (val != null && !String.valueOf(val).isBlank()) {
                texts.add(String.valueOf(val));
            }
        }
        return texts;
    }

    private SurveySummaryResponse.NumericStats numericStats(SurveyQuestionDto q,
                                                           List<Map<String, Object>> allAnswers) {
        List<Double> nums = new ArrayList<>();
        for (Map<String, Object> ans : allAnswers) {
            Object val = ans.get(q.getId());
            if (val == null) continue;
            try {
                nums.add(Double.parseDouble(String.valueOf(val)));
            } catch (NumberFormatException ignored) {
                // skip non-numeric answers
            }
        }
        if (nums.isEmpty()) {
            return SurveySummaryResponse.NumericStats.builder()
                    .count(0).average(0).min(0).max(0).build();
        }
        double sum = 0, min = nums.get(0), max = nums.get(0);
        for (double n : nums) {
            sum += n;
            min = Math.min(min, n);
            max = Math.max(max, n);
        }
        return SurveySummaryResponse.NumericStats.builder()
                .count(nums.size())
                .average(sum / nums.size())
                .min(min)
                .max(max)
                .build();
    }
}
