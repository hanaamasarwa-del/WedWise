(() => {
  const defaultGreeting = 'שלום! אני כאן כדי לעזור בקצרה עם WedWise, השאלון, הדוח וכלי האתר.';
  const i18n = window.WedWiseI18n;
  const isEnglish = () => i18n?.isEnglish?.() === true;
  const tx = (heText, enText) => (isEnglish() ? enText : heText);

  const fallbackWidget = `
    <aside class="chat-widget" id="chat-widget">
      <section class="chat-panel" id="chat-panel" aria-labelledby="chat-title" aria-hidden="true" hidden>
        <header class="chat-header">
          <div class="chat-brand">
            <span class="chat-avatar" aria-hidden="true">W</span>
            <h2 id="chat-title">WedWise Assistant</h2>
          </div>
          <button type="button" class="chat-close" id="chat-close" aria-label="סגירת הצ'אט">×</button>
        </header>
        <div class="chat-messages" id="chat-messages" aria-live="polite">
          <div class="chat-message chat-message--assistant">${defaultGreeting}</div>
          <div class="chat-suggestions" aria-label="שאלות מהירות">
            <button type="button" data-chat-prompt="מה WedWise עושה?">מה WedWise עושה?</button>
            <button type="button" data-chat-prompt="איך מתחילים את השאלון?">איך מתחילים?</button>
            <button type="button" data-chat-prompt="מה כולל הדוח הראשוני?">מה כולל הדוח?</button>
          </div>
        </div>
        <form class="chat-form" id="chat-form">
          <label class="sr-only" for="chat-input">כתבו הודעה</label>
          <textarea id="chat-input" rows="1" maxlength="2000" placeholder="איך אפשר לעזור?" required></textarea>
          <button type="submit" class="chat-send" id="chat-send" aria-label="שליחת הודעה">
            <span aria-hidden="true">➤</span>
          </button>
        </form>
      </section>
      <button type="button" class="chat-launcher" id="chat-launcher" aria-label="פתיחת הצ'אט" aria-controls="chat-panel" aria-expanded="false">
        <span class="chat-launcher-icon" aria-hidden="true">✦</span>
        <span class="chat-launcher-label">אפשר לעזור?</span>
      </button>
    </aside>
  `;

  function ensureWidget() {
    let widget = document.getElementById('chat-widget');
    if (!widget) {
      document.body.insertAdjacentHTML('beforeend', fallbackWidget);
      widget = document.getElementById('chat-widget');
    }
    return widget;
  }

  function createMessage(content, role) {
    const message = document.createElement('div');
    message.className = `chat-message chat-message--${role}`;
    message.textContent = content;
    return message;
  }

  function normalizeWidgetCopy(panel, launcher, closeButton, messagesEl, input, sendButton) {
    const header = panel.querySelector('.chat-header');
    if (header && !header.querySelector('.chat-brand')) {
      header.innerHTML = `
        <div class="chat-brand">
          <span class="chat-avatar" aria-hidden="true">W</span>
          <h2 id="chat-title">WedWise Assistant</h2>
        </div>
      `;
      if (closeButton) header.appendChild(closeButton);
    }

    const title = document.getElementById('chat-title');
    const launcherIcon = launcher.querySelector('.chat-launcher-icon');
    const launcherLabel = launcher.querySelector('.chat-launcher-label');
    const firstMessage = messagesEl.querySelector('.chat-message--assistant');
    const sendIcon = sendButton.querySelector('[aria-hidden="true"]');

    if (title) title.textContent = 'WedWise Assistant';
    if (launcherIcon) launcherIcon.textContent = '✦';
    if (launcherLabel) launcherLabel.textContent = tx('אפשר לעזור?', 'Need help?');
    if (firstMessage) firstMessage.textContent = tx(defaultGreeting, 'Hi! I am here to help with WedWise, the questionnaire, the report, and the site tools.');
    if (closeButton) closeButton.textContent = '×';
    if (sendIcon) sendIcon.textContent = '➤';
    input.placeholder = tx('איך אפשר לעזור?', 'How can I help?');

    if (!messagesEl.querySelector('.chat-suggestions')) {
      const suggestions = document.createElement('div');
      suggestions.className = 'chat-suggestions';
      suggestions.setAttribute('aria-label', tx('שאלות מהירות', 'Quick questions'));
      suggestions.innerHTML = `
        <button type="button" data-chat-prompt="${tx('מה WedWise עושה?', 'What does WedWise do?')}">${tx('מה WedWise עושה?', 'What does WedWise do?')}</button>
        <button type="button" data-chat-prompt="${tx('איך מתחילים את השאלון?', 'How do I start the questionnaire?')}">${tx('איך מתחילים?', 'How do I start?')}</button>
        <button type="button" data-chat-prompt="${tx('מה כולל הדוח הראשוני?', 'What is included in the initial report?')}">${tx('מה כולל הדוח?', 'What is in the report?')}</button>
      `;
      messagesEl.appendChild(suggestions);
    }
  }

  function initChatWidget() {
    const widget = ensureWidget();
    if (widget.dataset.ready === 'true') return;
    widget.dataset.ready = 'true';

    const panel = document.getElementById('chat-panel');
    const launcher = document.getElementById('chat-launcher');
    const closeButton = document.getElementById('chat-close');
    const messagesEl = document.getElementById('chat-messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send');
    const conversation = [];

    if (!panel || !launcher || !messagesEl || !form || !input || !sendButton) return;

    launcher.removeAttribute('onclick');
    closeButton?.removeAttribute('onclick');
    normalizeWidgetCopy(panel, launcher, closeButton, messagesEl, input, sendButton);

    function setOpen(isOpen) {
      panel.hidden = !isOpen;
      panel.setAttribute('aria-hidden', String(!isOpen));
      launcher.setAttribute('aria-expanded', String(isOpen));

      if (isOpen) {
        window.setTimeout(() => input.focus(), 50);
      }
    }

    function appendMessage(content, role) {
      messagesEl.appendChild(createMessage(content, role));
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function setBusy(isBusy) {
      input.disabled = isBusy;
      sendButton.disabled = isBusy;
      widget.classList.toggle('chat-widget--busy', isBusy);
    }

    launcher.addEventListener('click', () => setOpen(panel.hidden));
    closeButton?.addEventListener('click', () => setOpen(false));

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
    });

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      if (!input.disabled) form.requestSubmit();
    });

    messagesEl.addEventListener('click', (event) => {
      const promptButton = event.target.closest('[data-chat-prompt]');
      if (!promptButton || input.disabled) return;
      input.value = promptButton.dataset.chatPrompt || '';
      form.requestSubmit();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      input.style.height = 'auto';
      appendMessage(text, 'user');
      conversation.push({ role: 'user', content: text });

      const typing = createMessage(tx('רגע, בודק בשבילכם...', 'One moment, checking for you...'), 'assistant');
      typing.classList.add('chat-message--typing');
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      setBusy(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversation.slice(-10) }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Chat request failed');
        }

        const reply = data.reply || tx('לא הצלחתי לנסח תשובה כרגע. נסו שוב בעוד רגע.', 'I could not write an answer right now. Please try again in a moment.');
        conversation.push({ role: 'assistant', content: reply });
        typing.replaceWith(createMessage(reply, 'assistant'));
      } catch (error) {
        console.error('Chat widget error:', error);
        typing.replaceWith(createMessage(tx('הצ׳אט לא זמין כרגע. אפשר להשאיר פרטים דרך השאלון ונחזור אליכם.', 'The chat is not available right now. You can leave details through the questionnaire and we will get back to you.'), 'assistant'));
      } finally {
        setBusy(false);
        input.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatWidget);
  } else {
    initChatWidget();
  }
})();
