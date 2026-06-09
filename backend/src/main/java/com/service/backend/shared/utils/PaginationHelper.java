package com.service.backend.shared.utils;

import com.service.backend.shared.dto.PaginatedResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.function.Function;

/**
 * Utility class to handle pagination logic for Reactive streams.
 */
public class PaginationHelper {

    /**
     * Paginates a Flux of items and a Mono of the total count into a Mono of PaginatedResponse.
     *
     * @param items the Flux of items to paginate
     * @param total the Mono of the total count of items
     * @param page  the current page number (0-indexed)
     * @param size  the number of items per page
     * @param <T>   the type of the items
     * @return a Mono containing the PaginatedResponse
     */
    public static <T> Mono<PaginatedResponse<T>> paginate(Flux<T> items, Mono<Long> total, int page, int size) {
        return items.collectList()
                .zipWith(total)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
    }

    /**
     * Paginates a Mono of list of items and a Mono of the total count into a Mono of PaginatedResponse.
     *
     * @param itemsMono the Mono of list of items to paginate
     * @param total     the Mono of the total count of items
     * @param page      the current page number (0-indexed)
     * @param size      the number of items per page
     * @param <T>       the type of the items
     * @return a Mono containing the PaginatedResponse
     */
    public static <T> Mono<PaginatedResponse<T>> paginate(Mono<List<T>> itemsMono, Mono<Long> total, int page, int size) {
        return itemsMono.zipWith(total)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
    }

    /**
     * Paginates a Mono of list of items with an asynchronous mapper and a Mono of the total count.
     *
     * @param itemsMono the Mono of list of items to paginate
     * @param total     the Mono of the total count of items
     * @param page      the current page number (0-indexed)
     * @param size      the number of items per page
     * @param mapper    asynchronous mapper function to enrich/transform items
     * @param <T>       the original type of the items
     * @param <R>       the result type of the items
     * @return a Mono containing the PaginatedResponse of R
     */
    public static <T, R> Mono<PaginatedResponse<R>> paginate(Mono<List<T>> itemsMono, Mono<Long> total, int page, int size, Function<List<T>, Mono<List<R>>> mapper) {
        return itemsMono.flatMap(mapper)
                .zipWith(total)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
    }

    /**
     * Paginates a Flux of items with an asynchronous mapper and a Mono of the total count.
     *
     * @param itemsFlux the Flux of items to paginate
     * @param total     the Mono of the total count of items
     * @param page      the current page number (0-indexed)
     * @param size      the number of items per page
     * @param mapper    asynchronous mapper function to enrich/transform items
     * @param <T>       the original type of the items
     * @param <R>       the result type of the items
     * @return a Mono containing the PaginatedResponse of R
     */
    public static <T, R> Mono<PaginatedResponse<R>> paginate(Flux<T> itemsFlux, Mono<Long> total, int page, int size, Function<List<T>, Mono<List<R>>> mapper) {
        return itemsFlux.collectList()
                .flatMap(mapper)
                .zipWith(total)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
    }

    /**
     * Paginates a full list in-memory.
     *
     * @param list the full list of items
     * @param page the current page number (0-indexed)
     * @param size the number of items per page
     * @param <T>  the type of the items
     * @return a Mono containing the PaginatedResponse
     */
    public static <T> Mono<PaginatedResponse<T>> paginateList(List<T> list, int page, int size) {
        long total = list.size();
        int fromIndex = Math.min(page * size, (int) total);
        int toIndex = Math.min(fromIndex + size, (int) total);
        return Mono.just(PaginatedResponse.of(list.subList(fromIndex, toIndex), total, page, size));
    }

    /**
     * Paginates a list of already collected items and a total count into a Mono of PaginatedResponse.
     *
     * @param items the list of items for the current page
     * @param total the total count of items
     * @param page  the current page number (0-indexed)
     * @param size  the number of items per page
     * @param <T>   the type of the items
     * @return a Mono containing the PaginatedResponse
     */
    public static <T> Mono<PaginatedResponse<T>> paginate(List<T> items, long total, int page, int size) {
        return Mono.just(PaginatedResponse.of(items, total, page, size));
    }
}
