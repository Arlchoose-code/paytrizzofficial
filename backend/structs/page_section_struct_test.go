package structs

import (
	"encoding/json"
	"testing"
)

func TestReorderPageSectionsRequest_Unmarshal(t *testing.T) {
	// 1. section_ids payload
	json1 := `{"section_ids": [10, 20, 30]}`
	var req1 ReorderPageSectionsRequest
	if err := json.Unmarshal([]byte(json1), &req1); err != nil {
		t.Fatalf("failed to unmarshal section_ids payload: %v", err)
	}
	if len(req1.SectionIDs) != 3 || req1.SectionIDs[0] != 10 {
		t.Errorf("unexpected SectionIDs: %v", req1.SectionIDs)
	}

	// 2. legacy ordered_ids payload
	json2 := `{"ordered_ids": [40, 50]}`
	var req2 ReorderPageSectionsRequest
	if err := json.Unmarshal([]byte(json2), &req2); err != nil {
		t.Fatalf("failed to unmarshal ordered_ids payload: %v", err)
	}
	if len(req2.OrderedIDs) != 2 || req2.OrderedIDs[0] != 40 {
		t.Errorf("unexpected OrderedIDs: %v", req2.OrderedIDs)
	}
}
