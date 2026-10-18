package helpers

import (
	"regexp"
	"strings"
)

var subjectPrefixRegex = regexp.MustCompile(`(?i)^(?:\[(?:external|spam)\]\s*:?|(?:\b(?:re|fwd|fw|aw|sv|vs|balas|teruskan)(?:\[\d+\]|\(\d+\))?)\s*:\s*)`)

// NormalizeMailSubject removes Re:, Fwd:, FW:, Re[2]:, Balas:, Teruskan:, [External] prefixes iteratively
func NormalizeMailSubject(subj string) string {
	s := strings.TrimSpace(subj)
	if s == "" {
		return ""
	}
	for {
		clean := subjectPrefixRegex.ReplaceAllString(s, "")
		clean = strings.TrimSpace(clean)
		if clean == s {
			break
		}
		s = clean
	}
	return s
}
