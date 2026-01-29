package com.service.backend.shared.utils;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.function.Supplier;

/**
 * Reactive utility class for cache operations with TTL support
 * Fully WebFlux compatible with non-blocking operations
 * Uses Caffeine in-memory cache for high performance
 */
@Slf4j
@Component
public class CacheUtils {

    private final ConcurrentMap<String, Cache<String, Object>> caches;

    public CacheUtils() {
        this.caches = new ConcurrentHashMap<>();
    }

    /**
     * Get value from cache by key (Reactive)
     *
     * @param cacheName Cache name
     * @param key       Cache key
     * @return Mono containing the cached value if present
     */
    public <T> Mono<T> get(String cacheName, String key) {
        return Mono.fromCallable(() -> {
                    Cache<String, Object> cache = caches.get(cacheName);
                    if (cache != null) {
                        @SuppressWarnings("unchecked")
                        T value = (T) cache.getIfPresent(key);
                        return value;
                    }
                    return null;
                });
    }

    /**
     * Put value into cache (Reactive)
     *
     * @param cacheName Cache name
     * @param key       Cache key
     * @param value     Value to cache
     * @return Mono<Void> completing when operation is done
     */
    public Mono<Void> put(String cacheName, String key, Object value) {
        return Mono.fromRunnable(() -> {
                    Cache<String, Object> cache = caches.get(cacheName);
                    if (cache != null) {
                        cache.put(key, value);
                        log.debug("Cached value for cache: {} with key: {}", cacheName, key);
                    } else {
                        log.warn("Cache not found: {}, creating default cache", cacheName);
                        Cache<String, Object> newCache = getOrCreateCache(cacheName, Duration.ofMinutes(10));
                        newCache.put(key, value);
                    }
                })
                .then();
    }

    /**
     * Evict specific key from cache (Reactive)
     *
     * @param cacheName Cache name
     * @param key       Cache key to evict
     * @return Mono<Void> completing when operation is done
     */
    public Mono<Void> evict(String cacheName, String key) {
        return Mono.fromRunnable(() -> {
                    Cache<String, Object> cache = caches.get(cacheName);
                    if (cache != null) {
                        cache.invalidate(key);
                        log.debug("Evicted cache: {} with key: {}", cacheName, key);
                    }
                })
                .then();
    }

    /**
     * Clear all entries from a cache (Reactive)
     *
     * @param cacheName Cache name to clear
     * @return Mono<Void> completing when operation is done
     */
    public Mono<Void> clear(String cacheName) {
        return Mono.fromRunnable(() -> {
                    Cache<String, Object> cache = caches.get(cacheName);
                    if (cache != null) {
                        cache.invalidateAll();
                        log.debug("Cleared cache: {}", cacheName);
                    }
                })
                .then();
    }

    /**
     * Get or compute value with custom TTL (Reactive)
     *
     * @param cacheName Cache name
     * @param key       Cache key
     * @param ttl       Time to live
     * @param supplier  Mono supplier to compute value if not in cache
     * @return Mono of cached or computed value
     */
    public <T> Mono<T> getOrCompute(String cacheName, String key, Duration ttl, Supplier<Mono<T>> supplier) {
        return Mono.defer(() -> {
            Cache<String, Object> cache = getOrCreateCache(cacheName, ttl);
            @SuppressWarnings("unchecked")
            T cached = (T) cache.getIfPresent(key);

            if (cached != null) {
                log.debug("Cache hit for cache: {} with key: {}", cacheName, key);
                return Mono.just(cached);
            }

            log.debug("Cache miss for cache: {} with key: {}", cacheName, key);
            return supplier.get()
                    .doOnNext(value -> {
                        cache.put(key, value);
                        log.debug("Cached value for cache: {} with key: {}", cacheName, key);
                    });
        });
    }

    /**
     * Put value with custom TTL (Reactive)
     *
     * @param cacheName Cache name
     * @param key       Cache key
     * @param value     Value to cache
     * @param ttl       Time to live
     * @return Mono<Void> completing when operation is done
     */
    public Mono<Void> putWithTtl(String cacheName, String key, Object value, Duration ttl) {
        return Mono.fromRunnable(() -> {
                    Cache<String, Object> cache = getOrCreateCache(cacheName, ttl);
                    cache.put(key, value);
                    log.debug("Cached value with TTL for cache: {} with key: {}, TTL: {}", cacheName, key, ttl);
                })
                .then();
    }



    /**
     * Get cache statistics (Reactive)
     *
     * @param cacheName Cache name
     * @return Mono of cache statistics as string
     */
    public Mono<String> getCacheStats(String cacheName) {
        return Mono.fromCallable(() -> {
                    Cache<String, Object> cache = caches.get(cacheName);
                    if (cache != null) {
                        return cache.stats().toString();
                    }
                    return "Cache not found: " + cacheName;
                });
    }

    /**
     * Check if key exists in cache (Reactive)
     *
     * @param cacheName Cache name
     * @param key       Cache key
     * @return Mono<Boolean> true if key exists
     */
    public Mono<Boolean> exists(String cacheName, String key) {
        return Mono.fromCallable(() -> {
                    Cache<String, Object> cache = caches.get(cacheName);
                    if (cache != null) {
                        return cache.getIfPresent(key) != null;
                    }
                    return false;
                });
    }

    /**
     * Create a cache with specific configuration (Reactive)
     *
     * @param cacheName    Cache name
     * @param ttl          Time to live
     * @param maxSize      Maximum cache size
     * @param recordStats  Whether to record statistics
     * @return Mono<Cache> of the created cache
     */
    public Mono<Cache<String, Object>> createCache(String cacheName, Duration ttl, long maxSize, boolean recordStats) {
        return Mono.fromCallable(() -> {
                    Caffeine<Object, Object> builder = Caffeine.newBuilder()
                            .expireAfterWrite(ttl)
                            .maximumSize(maxSize);

                    if (recordStats) {
                        builder.recordStats();
                    }

                    Cache<String, Object> cache = builder.build();
                    caches.put(cacheName, cache);
                    log.info("Created cache: {} with TTL: {}, maxSize: {}", cacheName, ttl, maxSize);
                    return cache;
                });
    }

    /**
     * Remove cache (Reactive)
     *
     * @param cacheName Cache name to remove
     * @return Mono<Void> completing when operation is done
     */
    public Mono<Void> removeCache(String cacheName) {
        return Mono.fromRunnable(() -> {
                    Cache<String, Object> removed = caches.remove(cacheName);
                    if (removed != null) {
                        removed.invalidateAll();
                        log.info("Removed cache: {}", cacheName);
                    }
                })
                .then();
    }

    /**
     * Get all cache names (Reactive)
     *
     * @return Mono containing set of all cache names
     */
    public Mono<java.util.Set<String>> getAllCacheNames() {
        return Mono.fromCallable(() -> caches.keySet());
    }

    /**
     * Get cache size (Reactive)
     *
     * @param cacheName Cache name
     * @return Mono<Long> containing the cache size
     */
    public Mono<Long> getCacheSize(String cacheName) {
        return Mono.fromCallable(() -> {
                    Cache<String, Object> cache = caches.get(cacheName);
                    if (cache != null) {
                        return cache.estimatedSize();
                    }
                    return 0L;
                });
    }

    /**
     * Get or create a Caffeine cache with specified TTL
     *
     * @param cacheName Cache name
     * @param ttl       Time to live
     * @return Caffeine cache instance
     */
    private Cache<String, Object> getOrCreateCache(String cacheName, Duration ttl) {
        return caches.computeIfAbsent(cacheName, k ->
                Caffeine.newBuilder()
                        .expireAfterWrite(ttl)
                        .maximumSize(10_000)
                        .recordStats()
                        .build()
        );
    }
}
