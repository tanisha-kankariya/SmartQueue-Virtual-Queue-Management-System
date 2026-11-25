/**
 * SmartQueue – Live Queue Tracking Page Controller (tracking.html)
 * -------------------------------------------------------------------------
 * Displays real-time token position, currently serving token, people ahead,
 * dynamic wait times, multi-step progress bar, live queue simulation via
 * Refresh Queue / Auto-Sync, and token cancellation with modal confirmation.
 */

(function (window, document) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const SQ = window.SmartQueue;
    if (!SQ) return;

    const activeView = document.getElementById('track-active-view');
    const emptyView = document.getElementById('track-empty-view');
    if (!activeView || !emptyView) return;

    const tokenSelect = document.getElementById('track-token-select');
    const searchForm = document.getElementById('track-search-form');
    const searchInput = document.getElementById('track-search-input');
    const refreshBtn = document.getElementById('btn-refresh-queue');
    const cancelBtn = document.getElementById('btn-cancel-token');
    const copyBtn = document.getElementById('btn-copy-token');
    const autoToggle = document.getElementById('toggle-auto-refresh');

    let selectedTokenId = null;
    let autoRefreshTimer = null;

    /**
     * Resolves which token should currently be tracked.
     */
    function resolveInitialToken() {
      const state = SQ.getState();
      const params = new URLSearchParams(window.location.search);
      const queryCode = params.get('token');

      if (queryCode) {
        const match = state.tokens.find(
          (t) => t.tokenNumber.toLowerCase() === queryCode.trim().toLowerCase()
        );
        if (match) {
          selectedTokenId = match.id;
          return;
        }
      }

      const active = SQ.getActiveUserToken(state);
      if (active) {
        selectedTokenId = active.id;
        return;
      }

      // Fall back to latest user booking if any exist
      const userBookings = state.tokens
        .filter((t) => t.isUserBooking)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      selectedTokenId = userBookings.length > 0 ? userBookings[0].id : null;
    }

    /**
     * Populates the token switcher dropdown with user bookings and active tokens.
     */
    function populateTokenDropdown(state) {
      if (!tokenSelect) return;

      const sortedTokens = [...state.tokens].sort((a, b) => {
        if (a.isUserBooking !== b.isUserBooking) return a.isUserBooking ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      tokenSelect.innerHTML = '';
      if (sortedTokens.length === 0) {
        tokenSelect.innerHTML = `<option value="">No tokens found</option>`;
        return;
      }

      sortedTokens.forEach((tok) => {
        const opt = document.createElement('option');
        opt.value = tok.id;
        const ownerTag = tok.isUserBooking ? 'My Token' : tok.customerName;
        opt.textContent = `${tok.tokenNumber} • ${ownerTag} (${tok.status})`;
        if (tok.id === selectedTokenId) opt.selected = true;
        tokenSelect.appendChild(opt);
      });
    }

    /**
     * Renders the complete live tracking view for the selected token.
     */
    function renderTracking() {
      const state = SQ.getState();
      populateTokenDropdown(state);

      const token = state.tokens.find((t) => t.id === selectedTokenId) || SQ.getActiveUserToken(state);

      if (!token) {
        activeView.classList.add('d-none');
        emptyView.classList.remove('d-none');
        return;
      }

      selectedTokenId = token.id;
      activeView.classList.remove('d-none');
      emptyView.classList.add('d-none');

      const metrics = SQ.computeQueueMetrics(state, token);
      const centerName = SQ.getCenterName(state, token.centerId);
      const deptName = SQ.getDepartmentName(state, token.departmentId);

      document.getElementById('track-user-token').textContent = token.tokenNumber;
      document.getElementById('track-status-badge').innerHTML = SQ.getStatusBadgeHTML(token.status);
      document.getElementById('track-center-dept').textContent = `${centerName} • ${deptName}`;
      document.getElementById('track-counter-name').textContent = metrics.counterName;
      document.getElementById('track-customer-meta').textContent = `${token.customerName} • ${SQ.formatDisplayDate(token.preferredDate)}`;

      // Currently Serving
      const servingTokenEl = document.getElementById('track-serving-token');
      const servingSubEl = document.getElementById('track-serving-customer');
      if (metrics.currentlyServingToken) {
        servingTokenEl.textContent = metrics.currentlyServingToken.tokenNumber;
        servingSubEl.textContent = `At ${metrics.counterName}`;
      } else {
        servingTokenEl.textContent = 'Ready';
        servingSubEl.textContent = 'Counter open for next call';
      }

      // People ahead & Wait time
      const aheadEl = document.getElementById('track-people-ahead');
      const waitEl = document.getElementById('track-est-wait');
      const posEl = document.getElementById('track-position-label');

      if (token.status === 'Serving') {
        aheadEl.textContent = '0';
        waitEl.textContent = 'Now!';
        posEl.textContent = `Please proceed to ${metrics.counterName}`;
      } else if (token.status === 'Completed') {
        aheadEl.textContent = '0';
        waitEl.textContent = 'Done';
        posEl.textContent = 'Service completed successfully';
      } else if (token.status === 'Cancelled' || token.status === 'Skipped') {
        aheadEl.textContent = '--';
        waitEl.textContent = '--';
        posEl.textContent = `Token is ${token.status.toLowerCase()}`;
      } else {
        aheadEl.textContent = String(metrics.peopleAhead);
        waitEl.textContent = `${metrics.estimatedWait} min`;
        posEl.textContent =
          metrics.peopleAhead === 0
            ? 'You are next in line!'
            : `Queue Position #${metrics.position}`;
      }

      // Progress Bar
      const progBar = document.getElementById('track-progress-bar');
      const progPct = document.getElementById('track-progress-pct');
      progBar.style.width = `${metrics.progress}%`;
      progPct.textContent = `${metrics.progress}%`;

      // Multi-Step Stepper
      const steps = document.querySelectorAll('#track-stepper .queue-step');
      steps.forEach((stepEl, idx) => {
        const stepNum = idx + 1;
        stepEl.classList.remove('completed', 'active');
        if (token.status === 'Cancelled' || token.status === 'Skipped') {
          if (stepNum === 1) stepEl.classList.add('completed');
          return;
        }
        if (token.status === 'Completed' || stepNum < metrics.stepIndex) {
          stepEl.classList.add('completed');
        } else if (stepNum === metrics.stepIndex) {
          stepEl.classList.add('active');
        }
      });

      // Live Queue Lineup Preview
      const lineupEl = document.getElementById('track-lineup-list');
      if (metrics.lineup.length === 0) {
        lineupEl.innerHTML = `
          <div class="text-center py-4 text-muted small">
            <i class="fa-solid fa-check-double mb-2 fs-5 d-block text-success"></i>
            No pending tokens remaining in this department queue.
          </div>
        `;
      } else {
        lineupEl.innerHTML = metrics.lineup
          .slice(0, 7)
          .map((item, index) => {
            const isMe = item.id === token.id;
            const isServing = item.status === 'Serving';
            const cls = isMe ? 'is-me' : isServing ? 'is-serving' : '';
            const label = isMe
              ? `<span class="fw-bold text-primary">${SQ.escapeHtml(item.tokenNumber)} (You)</span>`
              : `<span class="fw-semibold">${SQ.escapeHtml(item.tokenNumber)}</span>`;

            const sub = isServing
              ? `Serving at ${SQ.escapeHtml(metrics.counterName)}`
              : index === 0
              ? 'Next to be called'
              : `Waiting in queue`;

            return `
              <div class="queue-lineup-item ${cls}">
                <div class="d-flex align-items-center gap-3">
                  <div class="token-chip">${SQ.escapeHtml(item.tokenNumber)}</div>
                  <div>
                    <div style="font-size:0.88rem;">${label}</div>
                    <div style="font-size:0.76rem; color:var(--sq-muted);">${sub}</div>
                  </div>
                </div>
                <div>${SQ.getStatusBadgeHTML(item.status)}</div>
              </div>
            `;
          })
          .join('');
      }

      // Cancel Button state
      const canCancel = token.status === 'Waiting';
      cancelBtn.disabled = !canCancel;
      cancelBtn.style.opacity = canCancel ? '1' : '0.5';

      // Last updated timestamp
      const updatedEl = document.getElementById('track-last-updated');
      if (updatedEl) {
        updatedEl.textContent = `Updated at ${new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`;
      }
    }

    /**
     * Simulates live queue movement for the tracked department.
     * Moves currently serving token to Completed and calls the next Waiting token.
     */
    function simulateQueueProgress(silent = false) {
      const state = SQ.getState();
      const token = state.tokens.find((t) => t.id === selectedTokenId);
      if (!token) return;

      if (token.status === 'Cancelled' || token.status === 'Completed' || token.status === 'Skipped') {
        if (!silent) {
          SQ.showToast('Queue Refreshed', `Token ${token.tokenNumber} is currently ${token.status}.`, 'info');
        }
        renderTracking();
        return;
      }

      const deptQueue = state.tokens
        .filter((t) => t.departmentId === token.departmentId && t.preferredDate === token.preferredDate)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const serving = deptQueue.find((t) => t.status === 'Serving');
      const nextWaiting = deptQueue.find((t) => t.status === 'Waiting');

      let toastTitle = 'Queue Synced';
      let toastMsg = 'Live wait estimates recalculated.';
      let toastType = 'info';

      if (serving && serving.id === token.id) {
        // User's token was currently serving -> simulate finishing or remind user
        serving.status = 'Completed';
        serving.updatedAt = new Date().toISOString();
        if (nextWaiting) {
          nextWaiting.status = 'Serving';
          nextWaiting.updatedAt = new Date().toISOString();
        }
        toastTitle = 'Service Completed';
        toastMsg = `Your token ${token.tokenNumber} has been marked Completed.`;
        toastType = 'success';
      } else if (serving) {
        serving.status = 'Completed';
        serving.updatedAt = new Date().toISOString();
        if (nextWaiting) {
          nextWaiting.status = 'Serving';
          nextWaiting.updatedAt = new Date().toISOString();
          toastTitle = 'Queue Moved Forward!';
          toastMsg =
            nextWaiting.id === token.id
              ? `It's your turn! ${token.tokenNumber} is now being served.`
              : `Completed ${serving.tokenNumber}. Now serving ${nextWaiting.tokenNumber}.`;
          toastType = nextWaiting.id === token.id ? 'success' : 'info';

          if (nextWaiting.id === token.id) {
            SQ.pushNotification(state, 'Your Turn Now!', `Token ${token.tokenNumber} is now serving.`);
          }
        } else {
          toastMsg = `Completed ${serving.tokenNumber}. Desk is now ready.`;
        }
      } else if (nextWaiting) {
        nextWaiting.status = 'Serving';
        nextWaiting.updatedAt = new Date().toISOString();
        toastTitle = 'Counter Called Next';
        toastMsg =
          nextWaiting.id === token.id
            ? `It's your turn! Please proceed to the counter for ${token.tokenNumber}.`
            : `Now serving ${nextWaiting.tokenNumber}.`;
        toastType = nextWaiting.id === token.id ? 'success' : 'info';
      }

      SQ.saveState(state);
      renderTracking();
      if (!silent) {
        SQ.showToast(toastTitle, toastMsg, toastType);
      }
    }

    // Event: Switch token via dropdown
    if (tokenSelect) {
      tokenSelect.addEventListener('change', () => {
        selectedTokenId = tokenSelect.value;
        renderTracking();
      });
    }

    // Event: Search token by code
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const state = SQ.getState();
        const found = state.tokens.find((t) => t.tokenNumber.toLowerCase() === query);
        if (found) {
          selectedTokenId = found.id;
          renderTracking();
          SQ.showToast('Token Found', `Now tracking ${found.tokenNumber}.`, 'success');
        } else {
          SQ.showToast('Not Found', `No token matching "${searchInput.value.trim()}" was found.`, 'warning');
        }
      });
    }

    // Event: Refresh Queue Button (with spinner animation)
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
        setTimeout(() => {
          if (icon) icon.classList.remove('fa-spin');
          simulateQueueProgress(false);
        }, 350);
      });
    }

    // Event: Auto-Sync Toggle
    if (autoToggle) {
      autoToggle.addEventListener('change', () => {
        if (autoToggle.checked) {
          SQ.showToast('Auto-Live Mode On', 'Queue updates will simulate every 8 seconds.', 'info');
          autoRefreshTimer = window.setInterval(() => {
            simulateQueueProgress(false);
          }, 8000);
        } else {
          if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
          }
          SQ.showToast('Auto-Live Paused', 'You can still refresh manually at any time.', 'info');
        }
      });
    }

    // Event: Copy Token Code
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = document.getElementById('track-user-token').textContent;
        if (navigator.clipboard && code) {
          navigator.clipboard.writeText(code).catch(() => {});
        }
        SQ.showToast('Copied', `Token ${code} copied to clipboard.`, 'info');
      });
    }

    // Event: Cancel Token Button with Confirmation Modal
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const state = SQ.getState();
        const token = state.tokens.find((t) => t.id === selectedTokenId);
        if (!token || token.status !== 'Waiting') return;

        SQ.openModal({
          title: `Cancel Token ${token.tokenNumber}?`,
          bodyHtml: `
            <p class="text-secondary mb-2">
              Are you sure you want to cancel your spot in line at <strong>${SQ.escapeHtml(SQ.getCenterName(state, token.centerId))}</strong>?
            </p>
            <p class="small text-muted mb-0">
              Your slot will be released for the next waiting customer. You can book a new token anytime.
            </p>
          `,
          confirmText: 'Yes, Cancel Token',
          cancelText: 'Keep My Spot',
          confirmClass: 'btn-sq-danger-soft',
          onConfirm: () => {
            const fresh = SQ.getState();
            const target = fresh.tokens.find((t) => t.id === token.id);
            if (target) {
              target.status = 'Cancelled';
              target.updatedAt = new Date().toISOString();
              if (fresh.activeTokenId === target.id) {
                fresh.activeTokenId = null;
              }
              SQ.pushNotification(fresh, 'Token Cancelled', `Token ${target.tokenNumber} was cancelled.`);
              SQ.saveState(fresh);
              renderTracking();
              SQ.showToast('Token Cancelled', `Token ${target.tokenNumber} has been cancelled.`, 'warning');
            }
          },
        });
      });
    }

    // Initial load & live cross-tab listener
    resolveInitialToken();
    renderTracking();
    window.addEventListener('smartqueue:updated', renderTracking);
  });
})(window, document);
