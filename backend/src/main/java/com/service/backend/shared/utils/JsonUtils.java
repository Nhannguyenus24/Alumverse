package com.service.backend.shared.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class JsonUtils {

    private JsonUtils() {}

    private static final ObjectMapper MAPPER = new ObjectMapper()
        .registerModule(new JavaTimeModule())
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
        .configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

    /**
     * Convert object to JSON string
     */
    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        }

        // Object → Jackson
        try {
            return MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize object to JSON", e);
        }
    }


    /**
     * Convert object to pretty JSON string with indentation
     */
    public static String toPrettyJson(Object obj) {
        try {
            return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize object to pretty JSON", e);
        }
    }

    /**
     * Convert JSON string to object
     */
    public static <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return MAPPER.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize JSON to " + clazz.getName(), e);
        }
    }

    /**
     * Convert JSON string to object using TypeReference (for generic types)
     * Example: List<User> users = JsonUtils.fromJson(json, new TypeReference<List<User>>(){});
     */
    public static <T> T fromJson(String json, TypeReference<T> typeReference) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return MAPPER.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize JSON", e);
        }
    }

    /**
     * Read a classpath resource file as UTF-8 string
     */
    public static String readResourceAsString(String resourcePath) {
        try (InputStream inputStream = JsonUtils.class.getClassLoader().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new RuntimeException("Resource not found: " + resourcePath);
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read resource: " + resourcePath, e);
        }
    }

    /**
     * Convert classpath resource JSON file to object
     */
    public static <T> T fromResource(String resourcePath, Class<T> clazz) {
        try (InputStream inputStream = JsonUtils.class.getClassLoader().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new RuntimeException("Resource not found: " + resourcePath);
            }
            return MAPPER.readValue(inputStream, clazz);
        } catch (IOException e) {
            throw new RuntimeException("Failed to deserialize resource JSON to " + clazz.getName(), e);
        }
    }

    /**
     * Convert classpath resource JSON file to object using TypeReference (for generic types)
     */
    public static <T> T fromResource(String resourcePath, TypeReference<T> typeReference) {
        try (InputStream inputStream = JsonUtils.class.getClassLoader().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new RuntimeException("Resource not found: " + resourcePath);
            }
            return MAPPER.readValue(inputStream, typeReference);
        } catch (IOException e) {
            throw new RuntimeException("Failed to deserialize resource JSON", e);
        }
    }

    /**
     * Convert JSON string to List
     */
    public static <T> List<T> fromJsonToList(String json, Class<T> clazz) {
        if (json == null || json.trim().isEmpty()) {
            return List.of();
        }
        try {
            JsonNode node = MAPPER.readTree(json);
            if (node == null || !node.isArray()) {
                throw new RuntimeException("JSON value is not an array");
            }
            return MAPPER.readValue(json, 
                MAPPER.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize JSON to List", e);
        }
    }

    /**
     * Check if string is valid JSON array.
     */
    public static boolean isJsonArray(String json) {
        if (json == null || json.trim().isEmpty()) {
            return false;
        }
        try {
            JsonNode node = MAPPER.readTree(json);
            return node != null && node.isArray();
        } catch (JsonProcessingException e) {
            return false;
        }
    }

    /**
     * Convert JSON string to Map
     */
    public static Map<String, Object> fromJsonToMap(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Map.of();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize JSON to Map", e);
        }
    }

    /**
     * Convert JSON string to JsonNode for tree navigation
     */
    public static JsonNode toJsonNode(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse JSON to JsonNode", e);
        }
    }

    /**
     * Convert object to Map
     */
    public static Map<String, Object> toMap(Object obj) {
        return MAPPER.convertValue(obj, new TypeReference<Map<String, Object>>() {});
    }

    /**
     * Convert Map to object
     */
    public static <T> T fromMap(Map<String, Object> map, Class<T> clazz) {
        return MAPPER.convertValue(map, clazz);
    }

    /**
     * Deep copy an object using Jackson TokenBuffer (Faster than String serialization)
     */
    public static <T> T deepCopy(T obj, Class<T> clazz) {
        if (obj == null) return null;
        try {
            com.fasterxml.jackson.databind.util.TokenBuffer tb = new com.fasterxml.jackson.databind.util.TokenBuffer(MAPPER, false);
            MAPPER.writeValue(tb, obj);
            return MAPPER.readValue(tb.asParser(), clazz);
        } catch (IOException e) {
            throw new RuntimeException("Failed to deep copy object", e);
        }
    }

    /**
     * Check if string is valid JSON without building a full DOM tree in memory
     */
    public static boolean isValidJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return false;
        }
        try (com.fasterxml.jackson.core.JsonParser parser = MAPPER.getFactory().createParser(json)) {
            while (parser.nextToken() != null) {}
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Merge two JSON objects
     */
    public static String mergeJson(String json1, String json2) {
        try {
            JsonNode node1 = MAPPER.readTree(json1);
            JsonNode node2 = MAPPER.readTree(json2);
            JsonNode merged = merge(node1, node2);
            return MAPPER.writeValueAsString(merged);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to merge JSON objects", e);
        }
    }

    private static JsonNode merge(JsonNode mainNode, JsonNode updateNode) {
        if (updateNode == null) {
            return mainNode;
        }
        if (mainNode == null || !mainNode.isObject()) {
            return updateNode;
        }
        updateNode.fields().forEachRemaining(entry -> {
            String fieldName = entry.getKey();
            JsonNode value = entry.getValue();
            ((com.fasterxml.jackson.databind.node.ObjectNode) mainNode).set(fieldName, value);
        });
        return mainNode;
    }

}