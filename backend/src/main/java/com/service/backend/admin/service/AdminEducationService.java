package com.service.backend.admin.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.admin.dto.EducationChangeRequestAdminDTO;
import com.service.backend.admin.dto.ReviewEducationChangeRequestDTO;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.EducationChangeRequest;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.user.dao.EducationChangeRequestRepository;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.service.NotificationService;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AdminEducationService {

    private static final Logger log = LoggerFactory.getLogger(AdminEducationService.class);

    private final EducationChangeRequestRepository educationChangeRequestRepository;
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;
    private final NotificationService notificationService;

    public Mono<PaginatedResponse<EducationChangeRequestAdminDTO>> getRequests(
            Integer organizationId, String status, int page, int size) {
        long offset = (long) page * size;

        Flux<EducationChangeRequest> requestFlux;
        Mono<Long> countMono;

        if (status != null && !status.isBlank()) {
            Status statusEnum = Status.valueOf(status.toUpperCase());
            requestFlux = educationChangeRequestRepository
                    .findByOrganizationIdAndStatusWithPagination(organizationId, statusEnum, size, offset);
            countMono = educationChangeRequestRepository
                    .countByOrganizationIdAndStatus(organizationId, statusEnum);
        } else {
            requestFlux = educationChangeRequestRepository
                    .findByOrganizationIdWithPagination(organizationId, size, offset);
            countMono = educationChangeRequestRepository.countByOrganizationId(organizationId);
        }

        Flux<EducationChangeRequestAdminDTO> enrichedFlux = requestFlux
                .flatMap(request -> userOrganizationMemberRepository.findById(request.getMemberId())
                        .map(member -> toAdminDTO(request, member.getStudentId()))
                        .defaultIfEmpty(toAdminDTO(request, null)));

        return PaginationHelper.paginate(enrichedFlux, countMono, page, size);
    }

    public Mono<Boolean> reviewRequest(Integer requestId, ReviewEducationChangeRequestDTO dto, Integer adminUserId) {
        String upperDecision = dto.getDecision() == null ? null : dto.getDecision().toUpperCase();
        if (!"APPROVED".equals(upperDecision) && !"REJECTED".equals(upperDecision)) {
            return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Decision phải là APPROVED hoặc REJECTED"));
        }

        return educationChangeRequestRepository.findById(requestId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EDUCATION_REQUEST_NOT_FOUND)))
                .flatMap(request -> {
                    if (request.getStatus() != Status.PENDING) {
                        return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST,
                                "Yêu cầu này đã được xử lý trước đó"));
                    }

                    Mono<Void> actionMono = "APPROVED".equals(upperDecision)
                            ? applyEducationData(request)
                            : sendRejectionNotification(request, dto.getAdminNote());

                    return actionMono.then(Mono.defer(() -> {
                        request.setStatus(Status.valueOf(upperDecision));
                        request.setAdminNote(dto.getAdminNote());
                        request.setReviewedByUserId(adminUserId);
                        request.setReviewedAt(LocalDateTime.now());
                        return educationChangeRequestRepository.save(request);
                    }));
                })
                .map(r -> true)
                .doOnSuccess(r -> log.info("Education request {} reviewed: {}", requestId, upperDecision));
    }

    private Mono<Void> applyEducationData(EducationChangeRequest request) {
        Map<String, Object> newDataMap = JsonUtils.fromJsonToMap(request.getNewData());

        String program = JsonUtils.toJson(getList(newDataMap, "program"));
        String major = JsonUtils.toJson(getList(newDataMap, "major"));
        String faculty = JsonUtils.toJson(getList(newDataMap, "faculty"));
        String department = JsonUtils.toJson(getList(newDataMap, "department"));
        String startedYear = JsonUtils.toJson(getList(newDataMap, "startedYear"));
        String graduatedYear = JsonUtils.toJson(getList(newDataMap, "graduatedYear"));
        String graduationStatus = JsonUtils.toJson(getList(newDataMap, "graduationStatus"));

        return userOrganizationMemberRepository
                .updateAcademicProfileByMemberId(
                        request.getMemberId(),
                        program, startedYear, graduatedYear, graduationStatus,
                        major, faculty, department)
                .then();
    }

    private Mono<Void> sendRejectionNotification(EducationChangeRequest request, String adminNote) {
        String note = (adminNote != null && !adminNote.isBlank()) ? adminNote : "Không có ghi chú từ admin";
        String message = "Yêu cầu thay đổi học vấn của bạn đã bị từ chối. Lý do: " + note;
        notificationService.createNotificationAsync(
                request.getMemberId(),
                "Yêu cầu thay đổi học vấn bị từ chối",
                message,
                "/settings?tab=personal");
        return Mono.empty();
    }

    @SuppressWarnings("unchecked")
    private List<Object> getList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List) return (List<Object>) val;
        return List.of();
    }

    private EducationChangeRequestAdminDTO toAdminDTO(EducationChangeRequest request,
            String studentId) {
        return EducationChangeRequestAdminDTO.builder()
                .id(request.getId())
                .memberId(request.getMemberId())
                .organizationId(request.getOrganizationId())
                .oldData(request.getOldData() != null ? JsonUtils.fromJsonToMap(request.getOldData()) : null)
                .newData(request.getNewData() != null ? JsonUtils.fromJsonToMap(request.getNewData()) : null)
                .status(request.getStatus())
                .adminNote(request.getAdminNote())
                .reviewedByUserId(request.getReviewedByUserId())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .memberStudentId(studentId)
                .memberFullName(null)
                .build();
    }
}
