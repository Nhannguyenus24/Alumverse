package main

import (
	"strings"
	"testing"
)

func TestEndpointInventoryCount(t *testing.T) {
	all, err := resolveEndpoints(defaultFixtures(), true)
	if err != nil {
		t.Fatal(err)
	}
	if got, want := len(all), 205; got != want {
		t.Fatalf("inventory contains %d endpoints, want %d", got, want)
	}

	ordinary, err := resolveEndpoints(defaultFixtures(), false)
	if err != nil {
		t.Fatal(err)
	}
	if got, want := len(ordinary), 204; got != want {
		t.Fatalf("ordinary workload contains %d endpoints, want %d", got, want)
	}
	for _, endpoint := range ordinary {
		if strings.Contains(endpoint, "{") || strings.Contains(endpoint, "}") {
			t.Fatalf("unresolved fixture in %q", endpoint)
		}
		if endpoint == "/api/sse/connect" {
			t.Fatal("SSE endpoint must be excluded from the ordinary workload")
		}
	}
}

func TestInventoryHasNoDuplicateResolvedURLs(t *testing.T) {
	endpoints, err := resolveEndpoints(defaultFixtures(), true)
	if err != nil {
		t.Fatal(err)
	}
	seen := make(map[string]bool, len(endpoints))
	for _, endpoint := range endpoints {
		if seen[endpoint] {
			t.Fatalf("duplicate endpoint %q", endpoint)
		}
		seen[endpoint] = true
	}
}
