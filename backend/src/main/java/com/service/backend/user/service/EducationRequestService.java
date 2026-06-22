package com.service.backend.user.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.shared.entity.EducationChangeRequest;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.user.dao.EducationChangeRequestRepository;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.dto.CreateEducationChangeRequestDTO;
import com.service.backend.user.dto.EducationChangeRequestResponseDTO;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class EducationRequestService {

    private static final Logger log = LoggerFactory.getLogger(EducationRequestService.class);

    private final EducationChangeRequestRepository educationChangeRequestRepository;
    private final UserOrganizationMemberRepository userOrganizationMemberRepository;

    public Mono<EducationChangeRequestResponseDTO> submitRequest(Long currentUserId, CreateEducationChangeRequestDTO dto) {
        return userOrganizationMemberRepository
                .findByOrganizationIdAndUserId(dto.getOrganizationId(), currentUserId.intValue())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND)))
                .flatMap(member -> educationChangeRequestRepository
                        .findByMemberIdAndStatus(member.getId(), Status.PENDING)
                        .flatMap(existing -> Mono.<EducationChangeRequest>error(
                                new ApplicationException(ErrorCode.EDUCATION_REQUEST_ALREADY_PENDING)))
                        .switchIfEmpty(Mono.defer(() -> {
                            Map<String, Object> oldDataMap = buildDataMap(
                                    member.getProgram(), member.getMajor(), member.getFaculty(),
                                    member.getDepartment(), member.getStartedYear(),
                                    member.getGraduatedYear(), member.getGraduationStatus());

                            Map<String, Object> newDataMap = buildDataMapFromLists(
                                    dto.getProgram(), dto.getMajor(), dto.getFaculty(),
                                    dto.getDepartment(), dto.getStartedYear(),
                                    dto.getGraduatedYear(), dto.getGraduationStatus());

                            EducationChangeRequest request = EducationChangeRequest.builder()
                                    .memberId(member.getId())
                                    .organizationId(dto.getOrganizationId())
                                    .oldData(JsonUtils.toJson(oldDataMap))
                                    .newData(JsonUtils.toJson(newDataMap))
                                    .status(Status.PENDING)
                                    .build();

                            return educationChangeRequestRepository.save(request);
                        })))
                .map(this::toResponseDTO)
                .doOnSuccess(r -> log.info("Education change request submitted: id={}", r.getId()));
    }

    public Mono<EducationChangeRequestResponseDTO> getPendingRequest(Long currentUserId, Integer organizationId) {
        return userOrganizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                .flatMap(member -> educationChangeRequestRepository
                        .findByMemberIdAndStatus(member.getId(), Status.PENDING))
                .map(this::toResponseDTO);
    }

    public Mono<Void> cancelRequest(Long currentUserId, Integer requestId, Integer organizationId) {
        return userOrganizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, currentUserId.intValue())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND)))
                .flatMap(member -> educationChangeRequestRepository.findById(requestId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EDUCATION_REQUEST_NOT_FOUND)))
                        .flatMap(request -> {
                            if (!request.getMemberId().equals(member.getId())) {
                                return Mono.error(new ApplicationException(ErrorCode.EDUCATION_REQUEST_FORBIDDEN));
                            }
                            if (request.getStatus() != Status.PENDING) {
                                return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST,
                                        "Chỉ có thể hủy yêu cầu đang ở trạng thái chờ duyệt"));
                            }
                            return educationChangeRequestRepository.delete(request);
                        }));
    }

    private Map<String, Object> buildDataMap(String program, String major, String faculty,
            String department, String startedYear, String graduatedYear, String graduationStatus) {
        Map<String, Object> map = new HashMap<>();
        map.put("program", parseJsonList(program));
        map.put("major", parseJsonList(major));
        map.put("faculty", parseJsonList(faculty));
        map.put("department", parseJsonList(department));
        map.put("startedYear", parseJsonList(startedYear));
        map.put("graduatedYear", parseJsonList(graduatedYear));
        map.put("graduationStatus", parseJsonList(graduationStatus));
        return map;
    }

    private Map<String, Object> buildDataMapFromLists(List<String> program, List<String> major,
            List<String> faculty, List<String> department, List<String> startedYear,
            List<String> graduatedYear, List<String> graduationStatus) {
        Map<String, Object> map = new HashMap<>();
        map.put("program", program != null ? program : List.of());
        map.put("major", major != null ? major : List.of());
        map.put("faculty", faculty != null ? faculty : List.of());
        map.put("department", department != null ? department : List.of());
        map.put("startedYear", startedYear != null ? startedYear : List.of());
        map.put("graduatedYear", graduatedYear != null ? graduatedYear : List.of());
        map.put("graduationStatus", graduationStatus != null ? graduationStatus : List.of());
        return map;
    }

    private List<Object> parseJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return JsonUtils.fromJsonToList(json, Object.class);
        } catch (Exception e) {
            return List.of();
        }
    }

    private EducationChangeRequestResponseDTO toResponseDTO(EducationChangeRequest request) {
        return EducationChangeRequestResponseDTO.builder()
                .id(request.getId())
                .memberId(request.getMemberId())
                .organizationId(request.getOrganizationId())
                .oldData(request.getOldData() != null ? JsonUtils.fromJsonToMap(request.getOldData()) : null)
                .newData(request.getNewData() != null ? JsonUtils.fromJsonToMap(request.getNewData()) : null)
                .status(request.getStatus())
                .adminNote(request.getAdminNote())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .build();
    }
}
