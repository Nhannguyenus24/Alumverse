package com.service.backend.user.service;

import com.service.backend.shared.entity.EducationChangeRequest;
import com.service.backend.shared.entity.OrganizationMember;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.user.dao.EducationChangeRequestRepository;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import com.service.backend.user.dto.CreateEducationChangeRequestDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("EducationRequestService Unit Tests")
class EducationRequestServiceTest {

    @Mock private EducationChangeRequestRepository educationChangeRequestRepository;
    @Mock private UserOrganizationMemberRepository userOrganizationMemberRepository;

    @InjectMocks
    private EducationRequestService educationRequestService;

    // ─── submitRequest ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("submitRequest()")
    class SubmitRequest {

        @Test
        @DisplayName("should submit request successfully")
        void submitRequest_success() {
            CreateEducationChangeRequestDTO requestDTO = new CreateEducationChangeRequestDTO();
            requestDTO.setOrganizationId(1);
            requestDTO.setProgram(List.of("Bachelor"));
            requestDTO.setMajor(List.of("CS"));

            OrganizationMember member = OrganizationMember.builder()
                    .id(1)
                    .userId(1)
                    .organizationId(1)
                    .build();

            EducationChangeRequest savedRequest = EducationChangeRequest.builder()
                    .id(1)
                    .memberId(1)
                    .organizationId(1)
                    .status(Status.PENDING)
                    .build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.just(member));
            when(educationChangeRequestRepository.findByMemberIdAndStatus(1, Status.PENDING))
                    .thenReturn(Mono.empty());
            when(educationChangeRequestRepository.save(any())).thenReturn(Mono.just(savedRequest));

            StepVerifier.create(educationRequestService.submitRequest(1L, requestDTO))
                    .assertNext(res -> assertThat(res.getStatus()).isEqualTo(Status.PENDING))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when user is not a member of the organization")
        void submitRequest_memberNotFound() {
            CreateEducationChangeRequestDTO requestDTO = new CreateEducationChangeRequestDTO();
            requestDTO.setOrganizationId(1);

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.empty());

            StepVerifier.create(educationRequestService.submitRequest(1L, requestDTO))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ORGANIZATION_MEMBER_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should fail when a pending request already exists")
        void submitRequest_alreadyPending() {
            CreateEducationChangeRequestDTO requestDTO = new CreateEducationChangeRequestDTO();
            requestDTO.setOrganizationId(1);

            OrganizationMember member = OrganizationMember.builder().id(1).build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.just(member));
            when(educationChangeRequestRepository.findByMemberIdAndStatus(1, Status.PENDING))
                    .thenReturn(Mono.just(EducationChangeRequest.builder().build()));

            StepVerifier.create(educationRequestService.submitRequest(1L, requestDTO))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EDUCATION_REQUEST_ALREADY_PENDING)
                    .verify();
        }
    }

    // ─── getPendingRequest ───────────────────────────────────────────────────

    @Nested
    @DisplayName("getPendingRequest()")
    class GetPendingRequest {

        @Test
        @DisplayName("should return pending request")
        void getPendingRequest_success() {
            OrganizationMember member = OrganizationMember.builder().id(1).build();

            EducationChangeRequest request = EducationChangeRequest.builder()
                    .id(1)
                    .memberId(1)
                    .status(Status.PENDING)
                    .build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.just(member));
            when(educationChangeRequestRepository.findByMemberIdAndStatus(1, Status.PENDING))
                    .thenReturn(Mono.just(request));

            StepVerifier.create(educationRequestService.getPendingRequest(1L, 1))
                    .assertNext(res -> assertThat(res.getStatus()).isEqualTo(Status.PENDING))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return empty if no pending request")
        void getPendingRequest_notFound() {
            OrganizationMember member = OrganizationMember.builder().id(1).build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.just(member));
            when(educationChangeRequestRepository.findByMemberIdAndStatus(1, Status.PENDING))
                    .thenReturn(Mono.empty());

            StepVerifier.create(educationRequestService.getPendingRequest(1L, 1))
                    .verifyComplete();
        }
    }

    // ─── cancelRequest ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("cancelRequest()")
    class CancelRequest {

        @Test
        @DisplayName("should cancel request successfully")
        void cancelRequest_success() {
            OrganizationMember member = OrganizationMember.builder().id(1).build();

            EducationChangeRequest request = EducationChangeRequest.builder()
                    .id(1)
                    .memberId(1)
                    .status(Status.PENDING)
                    .build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.just(member));
            when(educationChangeRequestRepository.findById(1))
                    .thenReturn(Mono.just(request));
            when(educationChangeRequestRepository.delete(request)).thenReturn(Mono.empty());

            StepVerifier.create(educationRequestService.cancelRequest(1L, 1, 1))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail if request doesn't belong to the user")
        void cancelRequest_forbidden() {
            OrganizationMember member = OrganizationMember.builder().id(1).build();

            EducationChangeRequest request = EducationChangeRequest.builder()
                    .id(1)
                    .memberId(99) // different member
                    .status(Status.PENDING)
                    .build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.just(member));
            when(educationChangeRequestRepository.findById(1))
                    .thenReturn(Mono.just(request));

            StepVerifier.create(educationRequestService.cancelRequest(1L, 1, 1))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EDUCATION_REQUEST_FORBIDDEN)
                    .verify();
        }

        @Test
        @DisplayName("should fail if request not found")
        void cancelRequest_notFound() {
            OrganizationMember member = OrganizationMember.builder().id(1).build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 1))
                    .thenReturn(Mono.just(member));
            when(educationChangeRequestRepository.findById(1)).thenReturn(Mono.empty());

            StepVerifier.create(educationRequestService.cancelRequest(1L, 1, 1))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.EDUCATION_REQUEST_NOT_FOUND)
                    .verify();
        }
    }
}
