package services

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

type MailSSEEvent struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type SSEHub struct {
	clients   map[uint64]map[chan string]bool
	clientsMu sync.RWMutex
}

var GlobalSSEHub = NewSSEHub()

func NewSSEHub() *SSEHub {
	hub := &SSEHub{
		clients: make(map[uint64]map[chan string]bool),
	}
	// Start heartbeat routine
	go hub.heartbeatRoutine()
	return hub
}

func (h *SSEHub) heartbeatRoutine() {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.BroadcastAll("ping", map[string]interface{}{"time": time.Now().Unix()})
	}
}

func (h *SSEHub) Register(userID uint64) chan string {
	h.clientsMu.Lock()
	defer h.clientsMu.Unlock()

	ch := make(chan string, 10)
	if _, ok := h.clients[userID]; !ok {
		h.clients[userID] = make(map[chan string]bool)
	}
	h.clients[userID][ch] = true
	return ch
}

func (h *SSEHub) Unregister(userID uint64, ch chan string) {
	h.clientsMu.Lock()
	defer h.clientsMu.Unlock()

	if userClients, ok := h.clients[userID]; ok {
		delete(userClients, ch)
		close(ch)
		if len(userClients) == 0 {
			delete(h.clients, userID)
		}
	}
}

func (h *SSEHub) BroadcastUser(userID uint64, eventType string, payload interface{}) {
	h.clientsMu.RLock()
	defer h.clientsMu.RUnlock()

	userClients, ok := h.clients[userID]
	if !ok || len(userClients) == 0 {
		return
	}

	dataBytes, _ := json.Marshal(MailSSEEvent{Type: eventType, Payload: payload})
	msg := fmt.Sprintf("event: %s\ndata: %s\n\n", eventType, string(dataBytes))

	for ch := range userClients {
		select {
		case ch <- msg:
		default:
		}
	}
}

func (h *SSEHub) BroadcastAll(eventType string, payload interface{}) {
	h.clientsMu.RLock()
	defer h.clientsMu.RUnlock()

	dataBytes, _ := json.Marshal(MailSSEEvent{Type: eventType, Payload: payload})
	msg := fmt.Sprintf("event: %s\ndata: %s\n\n", eventType, string(dataBytes))

	for _, userClients := range h.clients {
		for ch := range userClients {
			select {
			case ch <- msg:
			default:
			}
		}
	}
}
