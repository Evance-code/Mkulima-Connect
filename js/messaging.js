// messaging.js - In-app communication system for Mkulima Connect

class MessagingManager {
    constructor() {
        this.conversations = JSON.parse(localStorage.getItem('mkulima_conversations') || '[]');
        this.messages = JSON.parse(localStorage.getItem('mkulima_messages') || '[]');
        this.currentConversation = null;
        this.pollingInterval = null;
        this.init();
    }

    init() {
        this.loadConversations();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
        this.renderConversations();
    }

    loadConversations() {
        // Load conversations from localStorage
        // Sort by last message date
        this.conversations.sort((a, b) =>
            new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
    }

    setupEventListeners() {
        // Message form submission
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        // Conversation selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.conversation')) {
                const conversationId = e.target.closest('.conversation').dataset.id;
                this.selectConversation(conversationId);
            }
        });

        // Search conversations
        const searchInput = document.getElementById('searchConversations');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchConversations(e.target.value));
        }
    }

    setupRealTimeUpdates() {
        if (navigator.onLine) {
            // Start polling for new messages (in production, use WebSockets)
            this.pollingInterval = setInterval(() => {
                this.checkForNewMessages();
            }, 10000); // Every 10 seconds
        }

        // Stop polling when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(this.pollingInterval);
            } else {
                this.setupRealTimeUpdates();
            }
        });
    }

    async handleSendMessage(e) {
        e.preventDefault();

        const messageInput = document.getElementById('messageInput');
        const messageText = messageInput.value.trim();

        if (!messageText || !this.currentConversation) {
            return;
        }

        try {
            await this.sendMessage(this.currentConversation.id, messageText);
            messageInput.value = '';
            messageInput.focus();
        } catch (error) {
            this.showNotification('Failed to send message', 'error');
        }
    }

    async sendMessage(conversationId, text) {
        const user = window.userManager?.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to send messages');
        }

        const message = {
            id: this.generateMessageId(),
            conversationId,
            senderId: user.id,
            senderName: user.name,
            text,
            timestamp: new Date().toISOString(),
            status: 'sent',
            isRead: false
        };

        // Add to messages
        this.messages.push(message);
        localStorage.setItem('mkulima_messages', JSON.stringify(this.messages));

        // Update conversation
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.lastMessage = text;
            conversation.lastMessageAt = message.timestamp;
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
            localStorage.setItem('mkulima_conversations', JSON.stringify(this.conversations));
        }

        // Render the message
        this.renderMessage(message);

        // Simulate server acknowledgment
        setTimeout(() => {
            this.updateMessageStatus(message.id, 'delivered');
        }, 1000);

        // Simulate recipient reading (in real app, this would come from server)
        if (Math.random() > 0.5) {
            setTimeout(() => {
                this.updateMessageStatus(message.id, 'read');
            }, 3000);
        }

        return message;
    }

    async startConversation(recipientId, initialMessage = null) {
        const user = window.userManager?.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to start a conversation');
        }

        // Check if conversation already exists
        let conversation = this.conversations.find(c =>
            (c.participants.includes(user.id) && c.participants.includes(recipientId))
        );

        if (!conversation) {
            // Create new conversation
            conversation = {
                id: this.generateConversationId(),
                participants: [user.id, recipientId],
                createdAt: new Date().toISOString(),
                lastMessage: initialMessage || 'Conversation started',
                lastMessageAt: new Date().toISOString(),
                unreadCount: 0
            };

            this.conversations.push(conversation);
            localStorage.setItem('mkulima_conversations', JSON.stringify(this.conversations));
        }

        // Select the conversation
        this.selectConversation(conversation.id);

        // Send initial message if provided
        if (initialMessage) {
            await this.sendMessage(conversation.id, initialMessage);
        }

        return conversation;
    }

    selectConversation(conversationId) {
        this.currentConversation = this.conversations.find(c => c.id === conversationId);

        if (!this.currentConversation) {
            return;
        }

        // Mark messages as read
        this.markConversationAsRead(conversationId);

        // Render conversation
        this.renderConversation(this.currentConversation);

        // Update UI
        document.querySelectorAll('.conversation').forEach(conv => {
            conv.classList.remove('active');
            if (conv.dataset.id === conversationId) {
                conv.classList.add('active');
            }
        });
    }

    renderConversations() {
        const container = document.getElementById('conversationList');
        if (!container) return;

        container.innerHTML = '';

        if (this.conversations.length === 0) {
            container.innerHTML = '<div class="no-conversations">No conversations yet</div>';
            return;
        }

        this.conversations.forEach(conversation => {
            const convElement = this.createConversationElement(conversation);
            container.appendChild(convElement);
        });
    }

    createConversationElement(conversation) {
        const element = document.createElement('div');
        element.className = 'conversation';
        element.dataset.id = conversation.id;

        if (conversation.id === this.currentConversation?.id) {
            element.classList.add('active');
        }

        // Get other participant (not current user)
        const user = window.userManager?.getCurrentUser();
        const otherParticipantId = conversation.participants.find(id => id !== user.id);
        // In real app, you would fetch user details
        const participantName = `User ${otherParticipantId?.substr(0, 8)}`;

        const lastMessageTime = new Date(conversation.lastMessageAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        element.innerHTML = `
            <div class="conversation-avatar">
                ${participantName.charAt(0)}
            </div>
            <div class="conversation-details">
                <h4>${participantName}</h4>
                <p class="last-message">${conversation.lastMessage}</p>
                <span class="time">${lastMessageTime}</span>
                ${conversation.unreadCount > 0 ?
                `<span class="unread-badge">${conversation.unreadCount}</span>` : ''}
            </div>
        `;

        return element;
    }

    renderConversation(conversation) {
        const container = document.getElementById('messageThread');
        const header = document.getElementById('conversationHeader');

        if (!container) return;

        // Clear container
        container.innerHTML = '';

        // Get messages for this conversation
        const conversationMessages = this.messages
            .filter(m => m.conversationId === conversation.id)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Render messages
        conversationMessages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            container.appendChild(messageElement);
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Update header
        if (header) {
            const user = window.userManager?.getCurrentUser();
            const otherParticipantId = conversation.participants.find(id => id !== user.id);
            header.innerHTML = `
                <h3>User ${otherParticipantId?.substr(0, 8)}</h3>
                <span class="user-status">Online</span>
            `;
        }
    }

    createMessageElement(message) {
        const element = document.createElement('div');
        const user = window.userManager?.getCurrentUser();
        const isOwnMessage = message.senderId === user.id;

        element.className = `message ${isOwnMessage ? 'sent' : 'received'}`;
        element.dataset.id = message.id;

        const time = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        element.innerHTML = `
            <div class="message-content">
                ${!isOwnMessage ? `<div class="sender-name">${message.senderName}</div>` : ''}
                <div class="message-text">${this.formatMessageText(message.text)}</div>
                <div class="message-meta">
                    <span class="time">${time}</span>
                    ${isOwnMessage ? `<span class="status ${message.status}"></span>` : ''}
                </div>
            </div>
        `;

        return element;
    }

    formatMessageText(text) {
        // Simple URL detection
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, url =>
            `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );
    }

    renderMessage(message) {
        if (message.conversationId !== this.currentConversation?.id) {
            return;
        }

        const container = document.getElementById('messageThread');
        if (!container) return;

        const messageElement = this.createMessageElement(message);
        container.appendChild(messageElement);

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    markConversationAsRead(conversationId) {
        // Mark all messages in conversation as read
        this.messages = this.messages.map(message => {
            if (message.conversationId === conversationId && !message.isRead) {
                return { ...message, isRead: true, status: 'read' };
            }
            return message;
        });

        // Update conversation unread count
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
        }

        // Save to localStorage
        localStorage.setItem('mkulima_messages', JSON.stringify(this.messages));
        localStorage.setItem('mkulima_conversations', JSON.stringify(this.conversations));

        // Update UI
        this.renderConversations();
    }

    updateMessageStatus(messageId, status) {
        const messageIndex = this.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        this.messages[messageIndex].status = status;
        localStorage.setItem('mkulima_messages', JSON.stringify(this.messages));

        // Update UI if message is visible
        const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('.status');
            if (statusElement) {
                statusElement.className = `status ${status}`;
            }
        }
    }

    async checkForNewMessages() {
        // In production, this would poll your server for new messages
        // For now, we'll simulate by checking localStorage (other tabs)
        try {
            const latestMessages = JSON.parse(localStorage.getItem('mkulima_messages') || '[]');
            const latestConversations = JSON.parse(localStorage.getItem('mkulima_conversations') || '[]');

            // Check if there are new messages
            if (latestMessages.length > this.messages.length) {
                const newMessages = latestMessages.slice(this.messages.length);
                this.messages = latestMessages;

                // Update conversations
                this.conversations = latestConversations;

                // Render new messages if in the right conversation
                newMessages.forEach(message => {
                    if (message.conversationId === this.currentConversation?.id) {
                        this.renderMessage(message);
                    }
                });

                // Update conversation list
                this.renderConversations();

                // Show notification for messages in other conversations
                newMessages.forEach(message => {
                    if (message.conversationId !== this.currentConversation?.id &&
                        message.senderId !== window.userManager?.getCurrentUser()?.id) {
                        this.showNotification(`New message from ${message.senderName}`, 'info');
                    }
                });
            }
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }

    searchConversations(searchTerm) {
        if (!searchTerm) {
            this.renderConversations();
            return;
        }

        const filtered = this.conversations.filter(conversation => {
            // In real app, you would search participant names and message content
            const messages = this.messages.filter(m => m.conversationId === conversation.id);
            return messages.some(m =>
                m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.senderName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });

        const container = document.getElementById('conversationList');
        if (!container) return;

        container.innerHTML = '';
        filtered.forEach(conversation => {
            const convElement = this.createConversationElement(conversation);
            container.appendChild(convElement);
        });
    }

    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message, type) {
        if (window.mkulimaApp && window.mkulimaApp.showNotification) {
            window.mkulimaApp.showNotification(message, type);
        }
    }

    // Public API
    getConversations() {
        return this.conversations;
    }

    getMessages(conversationId) {
        return this.messages
            .filter(m => m.conversationId === conversationId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    getUnreadCount() {
        return this.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
    }

    sendSystemMessage(conversationId, text) {
        const message = {
            id: this.generateMessageId(),
            conversationId,
            senderId: 'system',
            senderName: 'System',
            text,
            timestamp: new Date().toISOString(),
            status: 'sent',
            isRead: false,
            isSystem: true
        };

        this.messages.push(message);
        localStorage.setItem('mkulima_messages', JSON.stringify(this.messages));

        // Update conversation
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.lastMessage = text;
            conversation.lastMessageAt = message.timestamp;
            localStorage.setItem('mkulima_conversations', JSON.stringify(this.conversations));
        }

        return message;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.messagingManager = new MessagingManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessagingManager;
}