/**
 * SmartQueue – Unified Dashboard Controller
 * -------------------------------------------------------------------------
 * Powers:
 * 1. User Dashboard (dashboard.html)
 * 2. Staff Dashboard (staff.html)
 * 3. Admin Dashboard (admin.html) — including pure SVG interactive charts,
 *    service counter CRUD, and department CRUD.
 */

(function (window, document) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const SQ = window.SmartQueue;
    if (!SQ) return;

    const pageType = document.body.dataset.page;
    if (pageType === 'user-dashboard') initUserDashboard(SQ);
    if (pageType === 'staff-dashboard') initStaffDashboard(SQ);
    if (pageType === 'admin-dashboard') initAdminDashboard(SQ);
  });

  /* ========================================================================
     1. USER DASHBOARD (dashboard.html)
     ======================================================================== */
  function initUserDashboard(SQ) {
    const searchInput = document.getElementById('user-search-input');
    const statusFilter = document.getElementById('user-status-filter');
    const tbody = document.getElementById('user-history-tbody');
    const spotlightEl = document.getElementById('user-spotlight-container');

    function getGreeting() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    }

    function render() {
      const state = SQ.getState();
      const userName = (state.currentUser && state.currentUser.name) || 'Visitor';
      const userTokens = state.tokens
        .filter((t) => t.isUserBooking)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const activeToken = SQ.getActiveUserToken(state);
      const metrics = activeToken ? SQ.computeQueueMetrics(state, activeToken) : null;

      // Welcome Banner
      const welcomeHeading = document.getElementById('user-welcome-heading');
      const welcomeSub = document.getElementById('user-welcome-sub');
      if (welcomeHeading) {
        welcomeHeading.textContent = `${getGreeting()}, ${userName}!`;
      }
      if (welcomeSub) {
        welcomeSub.textContent = activeToken
          ? `You have an active token (${activeToken.tokenNumber}) at ${SQ.getCenterName(state, activeToken.centerId)}.`
          : 'No active queues right now. Book a digital token in seconds to skip the line.';
      }

      // KPI Cards
      document.getElementById('stat-total-tokens').textContent = String(userTokens.length);
      document.getElementById('stat-active-token').textContent = activeToken ? activeToken.tokenNumber : 'None';
      document.getElementById('stat-active-center').textContent = activeToken
        ? SQ.getDepartmentName(state, activeToken.departmentId)
        : 'Ready to book';

      if (activeToken && metrics) {
        document.getElementById('stat-est-wait').textContent =
          activeToken.status === 'Serving' ? 'Now!' : `${metrics.estimatedWait} min`;
        document.getElementById('stat-queue-pos').textContent =
          activeToken.status === 'Serving' ? '#1 (Serving)' : `#${metrics.position}`;
        document.getElementById('stat-ahead-meta').textContent =
          activeToken.status === 'Serving'
            ? `Proceed to ${metrics.counterName}`
            : `${metrics.peopleAhead} ${metrics.peopleAhead === 1 ? 'person' : 'people'} ahead`;
      } else {
        document.getElementById('stat-est-wait').textContent = '--';
        document.getElementById('stat-queue-pos').textContent = '--';
        document.getElementById('stat-ahead-meta').textContent = 'No active queue';
      }

      // Spotlight Card
      if (spotlightEl) {
        if (activeToken && metrics) {
          const servingNum = metrics.currentlyServingToken ? metrics.currentlyServingToken.tokenNumber : 'Ready';
          spotlightEl.innerHTML = `
            <div class="token-spotlight-card">
              <div class="row align-items-center g-4 position-relative" style="z-index:1;">
                <div class="col-lg-7">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="badge rounded-pill bg-white text-primary fw-bold px-3 py-1">
                      ${activeToken.status === 'Serving' ? 'NOW SERVING' : 'ACTIVE QUEUE'}
                    </span>
                    <span class="small opacity-75">${SQ.escapeHtml(SQ.getCenterName(state, activeToken.centerId))}</span>
                  </div>
                  <div class="token-code-display mb-1">${SQ.escapeHtml(activeToken.tokenNumber)}</div>
                  <p class="mb-3 opacity-90">
                    ${SQ.escapeHtml(SQ.getDepartmentName(state, activeToken.departmentId))} • ${SQ.escapeHtml(metrics.counterName)}
                  </p>
                  <div class="mb-2 d-flex justify-content-between small fw-semibold">
                    <span>Currently Serving: <strong>${SQ.escapeHtml(servingNum)}</strong></span>
                    <span>${metrics.progress}% Complete</span>
                  </div>
                  <div class="sq-progress" style="background: rgba(255,255,255,0.22);">
                    <div class="sq-progress-bar bg-light-blue" style="width:${metrics.progress}%;"></div>
                  </div>
                </div>
                <div class="col-lg-5 text-lg-end">
                  <div class="p-3 rounded-3 mb-3 text-start" style="background: rgba(255,255,255,0.14); backdrop-filter: blur(8px);">
                    <div class="d-flex justify-content-between mb-1 small">
                      <span class="opacity-75">Estimated Wait</span>
                      <strong>${activeToken.status === 'Serving' ? 'Your Turn!' : `~${metrics.estimatedWait} mins`}</strong>
                    </div>
                    <div class="d-flex justify-content-between small">
                      <span class="opacity-75">People Ahead</span>
                      <strong>${metrics.peopleAhead}</strong>
                    </div>
                  </div>
                  <div class="d-flex flex-wrap gap-2 justify-content-lg-end">
                    <a href="tracking.html?token=${encodeURIComponent(activeToken.tokenNumber)}" class="btn btn-light fw-semibold text-primary px-3">
                      <i class="fa-solid fa-location-crosshairs me-1"></i> Track Live
                    </a>
                    ${
                      activeToken.status === 'Waiting'
                        ? `<button type="button" class="btn btn-outline-light fw-semibold px-3" id="dash-cancel-active">
                             <i class="fa-solid fa-xmark me-1"></i> Cancel
                           </button>`
                        : ''
                    }
                  </div>
                </div>
              </div>
            </div>
          `;

          const quickCancel = document.getElementById('dash-cancel-active');
          if (quickCancel) {
            quickCancel.addEventListener('click', () => {
              SQ.openModal({
                title: `Cancel Token ${activeToken.tokenNumber}?`,
                bodyHtml: `<p class="text-secondary mb-0">Are you sure you want to cancel your active booking at <strong>${SQ.escapeHtml(SQ.getCenterName(state, activeToken.centerId))}</strong>?</p>`,
                confirmText: 'Cancel Token',
                confirmClass: 'btn-sq-danger-soft',
                onConfirm: () => {
                  const st = SQ.getState();
                  const t = st.tokens.find((x) => x.id === activeToken.id);
                  if (t) {
                    t.status = 'Cancelled';
                    t.updatedAt = new Date().toISOString();
                    st.activeTokenId = null;
                    SQ.pushNotification(st, 'Token Cancelled', `Token ${t.tokenNumber} cancelled from dashboard.`);
                    SQ.saveState(st);
                    SQ.showToast('Token Cancelled', `${t.tokenNumber} has been cancelled.`, 'warning');
                  }
                },
              });
            });
          }
        } else {
          spotlightEl.innerHTML = `
            <div class="sq-card d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
              <div class="d-flex align-items-center gap-3">
                <img src="assets/images/empty-queue.svg" alt="No active queue" style="width:96px; height:auto;">
                <div>
                  <h5 class="fw-bold mb-1">No Active Queue Token</h5>
                  <p class="text-secondary small mb-0">Skip physical lines at hospitals, banks, and student offices by booking a virtual token.</p>
                </div>
              </div>
              <a href="booking.html" class="btn-sq-primary flex-shrink-0">
                <i class="fa-solid fa-ticket"></i> Book New Token
              </a>
            </div>
          `;
        }
      }

      // Token History Table
      renderHistoryTable(state, userTokens);
    }

    function renderHistoryTable(state, userTokens) {
      if (!tbody) return;
      const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const status = statusFilter ? statusFilter.value : 'All';

      const filtered = userTokens.filter((tok) => {
        const centerName = SQ.getCenterName(state, tok.centerId).toLowerCase();
        const deptName = SQ.getDepartmentName(state, tok.departmentId).toLowerCase();
        const matchesQuery =
          !q ||
          tok.tokenNumber.toLowerCase().includes(q) ||
          centerName.includes(q) ||
          deptName.includes(q);
        const matchesStatus = status === 'All' || tok.status === status;
        return matchesQuery && matchesStatus;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-muted">
              <i class="fa-solid fa-inbox me-1"></i> No matching tokens found in your history.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered
        .map((tok) => {
          const centerName = SQ.getCenterName(state, tok.centerId);
          const deptName = SQ.getDepartmentName(state, tok.departmentId);
          const isTrackable = tok.status === 'Waiting' || tok.status === 'Serving';

          return `
            <tr>
              <td><span class="token-chip">${SQ.escapeHtml(tok.tokenNumber)}</span></td>
              <td class="fw-semibold">${SQ.escapeHtml(centerName)}</td>
              <td class="text-secondary">${SQ.escapeHtml(deptName)}</td>
              <td class="tabular-nums text-secondary">${SQ.escapeHtml(SQ.formatDisplayDate(tok.preferredDate))}</td>
              <td>${SQ.getStatusBadgeHTML(tok.status)}</td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  ${
                    isTrackable
                      ? `<a href="tracking.html?token=${encodeURIComponent(tok.tokenNumber)}" class="btn-sq-soft py-1 px-2" style="font-size:0.78rem;">
                           <i class="fa-solid fa-location-dot"></i> Track
                         </a>`
                      : ''
                  }
                  <button type="button" class="btn-icon" data-view-token="${SQ.escapeHtml(tok.id)}" title="View Token Details">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      tbody.querySelectorAll('[data-view-token]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const st = SQ.getState();
          const tok = st.tokens.find((x) => x.id === btn.dataset.viewToken);
          if (!tok) return;
          const m = SQ.computeQueueMetrics(st, tok);
          SQ.openModal({
            title: `Token Details • ${tok.tokenNumber}`,
            hideCancel: true,
            confirmText: 'Close',
            bodyHtml: `
              <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                <span class="fs-4 fw-bold font-display text-primary">${SQ.escapeHtml(tok.tokenNumber)}</span>
                ${SQ.getStatusBadgeHTML(tok.status)}
              </div>
              <div class="row g-2 small">
                <div class="col-5 text-muted">Service Center</div>
                <div class="col-7 fw-semibold">${SQ.escapeHtml(SQ.getCenterName(st, tok.centerId))}</div>
                <div class="col-5 text-muted">Department</div>
                <div class="col-7 fw-semibold">${SQ.escapeHtml(SQ.getDepartmentName(st, tok.departmentId))}</div>
                <div class="col-5 text-muted">Assigned Counter</div>
                <div class="col-7 fw-semibold">${SQ.escapeHtml(m.counterName)}</div>
                <div class="col-5 text-muted">Customer</div>
                <div class="col-7 fw-semibold">${SQ.escapeHtml(tok.customerName)} (${SQ.escapeHtml(tok.phone)})</div>
                <div class="col-5 text-muted">Date & Time</div>
                <div class="col-7 fw-semibold">${SQ.escapeHtml(SQ.formatDisplayDate(tok.preferredDate))} • ${SQ.escapeHtml(SQ.formatTime(tok.createdAt))}</div>
              </div>
            `,
          });
        });
      });
    }

    if (searchInput) searchInput.addEventListener('input', render);
    if (statusFilter) statusFilter.addEventListener('change', render);
    render();
    window.addEventListener('smartqueue:updated', render);
  }

  /* ========================================================================
     2. STAFF DASHBOARD (staff.html)
     ======================================================================== */
  function initStaffDashboard(SQ) {
    const centerFilter = document.getElementById('staff-center-filter');
    const deptFilter = document.getElementById('staff-dept-filter');
    const searchInput = document.getElementById('staff-search-input');
    const statusFilter = document.getElementById('staff-status-filter');
    const tbody = document.getElementById('staff-tokens-tbody');
    const servingBox = document.getElementById('staff-serving-box');

    const callNextBtn = document.getElementById('btn-call-next');
    const completeBtn = document.getElementById('btn-mark-completed');
    const skipBtn = document.getElementById('btn-skip-token');

    function populateFilters() {
      const state = SQ.getState();
      const prevCenter = centerFilter.value;
      centerFilter.innerHTML = `<option value="All">All Service Centers</option>`;
      state.centers.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        if (c.id === prevCenter) opt.selected = true;
        centerFilter.appendChild(opt);
      });

      populateDeptFilter();
    }

    function populateDeptFilter() {
      const state = SQ.getState();
      const cId = centerFilter.value;
      const prevDept = deptFilter.value;
      deptFilter.innerHTML = `<option value="All">All Departments</option>`;
      state.departments
        .filter((d) => cId === 'All' || d.centerId === cId)
        .forEach((d) => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = `${d.name} (${d.code})`;
          if (d.id === prevDept) opt.selected = true;
          deptFilter.appendChild(opt);
        });
    }

    function getScopedTodayTokens(state) {
      const today = SQ.getRelativeDate(0);
      const cId = centerFilter.value;
      const dId = deptFilter.value;

      return state.tokens
        .filter((t) => t.preferredDate === today)
        .filter((t) => (cId === 'All' ? true : t.centerId === cId))
        .filter((t) => (dId === 'All' ? true : t.departmentId === dId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    function render() {
      const state = SQ.getState();
      const scopedTokens = getScopedTodayTokens(state);

      const waitingList = scopedTokens.filter((t) => t.status === 'Waiting');
      const servingList = scopedTokens.filter((t) => t.status === 'Serving');
      const completedList = scopedTokens.filter((t) => t.status === 'Completed');

      const activeServing = servingList[0] || null;

      // Update Staff KPI Cards
      document.getElementById('staff-stat-total').textContent = String(scopedTokens.length);
      document.getElementById('staff-stat-waiting').textContent = String(waitingList.length);
      document.getElementById('staff-stat-serving').textContent = activeServing ? activeServing.tokenNumber : 'Idle';
      document.getElementById('staff-stat-completed').textContent = String(completedList.length);

      // Currently Serving Console Box
      if (activeServing) {
        const counterName = SQ.getCounterName(state, activeServing.counterId, activeServing.departmentId);
        servingBox.innerHTML = `
          <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                ${SQ.getStatusBadgeHTML('Serving')}
                <span class="small text-muted">${SQ.escapeHtml(counterName)}</span>
              </div>
              <div class="d-flex align-items-baseline gap-3">
                <span class="fs-2 fw-extrabold font-display text-primary tabular-nums">${SQ.escapeHtml(activeServing.tokenNumber)}</span>
                <span class="fw-bold fs-5 text-dark">${SQ.escapeHtml(activeServing.customerName)}</span>
              </div>
              <div class="small text-secondary mt-1">
                <i class="fa-solid fa-hospital-user me-1"></i> ${SQ.escapeHtml(SQ.getCenterName(state, activeServing.centerId))} •
                ${SQ.escapeHtml(SQ.getDepartmentName(state, activeServing.departmentId))} •
                <i class="fa-solid fa-phone ms-1 me-1"></i> ${SQ.escapeHtml(activeServing.phone)}
              </div>
            </div>
            <div class="text-md-end">
              <div class="small text-muted">Next in Waiting Line</div>
              <div class="fw-bold text-dark">
                ${waitingList[0] ? `${SQ.escapeHtml(waitingList[0].tokenNumber)} (${SQ.escapeHtml(waitingList[0].customerName)})` : 'No waiting customers'}
              </div>
            </div>
          </div>
        `;
      } else {
        servingBox.innerHTML = `
          <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-1">
            <div>
              <span class="sq-badge sq-badge-inactive mb-2"><i class="fa-solid fa-mug-hot"></i> Desk Idle</span>
              <h5 class="fw-bold mb-1">No Customer Currently Being Served</h5>
              <p class="small text-secondary mb-0">
                ${waitingList.length > 0 ? `${waitingList.length} customer(s) waiting. Click "Call Next Token" to begin.` : 'Queue is clear in this view.'}
              </p>
            </div>
          </div>
        `;
      }

      completeBtn.disabled = !activeServing;
      skipBtn.disabled = !activeServing && waitingList.length === 0;

      // Render Queue Table
      const q = (searchInput.value || '').trim().toLowerCase();
      const statusVal = statusFilter.value;

      const filteredRows = scopedTokens.filter((t) => {
        const matchesQuery =
          !q ||
          t.tokenNumber.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.phone.toLowerCase().includes(q);
        const matchesStatus = statusVal === 'All' || t.status === statusVal;
        return matchesQuery && matchesStatus;
      });

      if (filteredRows.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-muted">No customer tokens match your filter criteria.</td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filteredRows
        .map((t) => {
          const deptName = SQ.getDepartmentName(state, t.departmentId);
          const centerName = SQ.getCenterName(state, t.centerId);
          return `
            <tr>
              <td><span class="token-chip">${SQ.escapeHtml(t.tokenNumber)}</span></td>
              <td>
                <div class="fw-semibold text-dark">${SQ.escapeHtml(t.customerName)}</div>
                <div class="small text-muted">${SQ.escapeHtml(t.phone)}</div>
              </td>
              <td>
                <div class="fw-medium">${SQ.escapeHtml(deptName)}</div>
                <div class="small text-muted">${SQ.escapeHtml(centerName)}</div>
              </td>
              <td class="tabular-nums text-secondary">${SQ.escapeHtml(SQ.formatTime(t.createdAt))}</td>
              <td>${SQ.getStatusBadgeHTML(t.status)}</td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  ${
                    t.status === 'Waiting'
                      ? `<button type="button" class="btn-sq-soft py-1 px-2" style="font-size:0.78rem;" data-row-call="${SQ.escapeHtml(t.id)}" title="Call Now">
                           <i class="fa-solid fa-bullhorn"></i> Call
                         </button>`
                      : ''
                  }
                  ${
                    t.status === 'Serving'
                      ? `<button type="button" class="btn-sq-success py-1 px-2" style="font-size:0.78rem;" data-row-complete="${SQ.escapeHtml(t.id)}" title="Mark Completed">
                           <i class="fa-solid fa-check"></i> Done
                         </button>`
                      : ''
                  }
                  ${
                    t.status === 'Waiting' || t.status === 'Serving'
                      ? `<button type="button" class="btn-sq-warning-soft py-1 px-2" style="font-size:0.78rem;" data-row-skip="${SQ.escapeHtml(t.id)}" title="Skip Token">
                           <i class="fa-solid fa-forward"></i>
                         </button>`
                      : ''
                  }
                  ${
                    t.status === 'Skipped'
                      ? `<button type="button" class="btn-sq-outline py-1 px-2" style="font-size:0.78rem;" data-row-recall="${SQ.escapeHtml(t.id)}" title="Recall to Waiting">
                           <i class="fa-solid fa-rotate-left"></i> Recall
                         </button>`
                      : ''
                  }
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      // Row action handlers
      tbody.querySelectorAll('[data-row-call]').forEach((btn) => {
        btn.addEventListener('click', () => callSpecificToken(btn.dataset.rowCall));
      });
      tbody.querySelectorAll('[data-row-complete]').forEach((btn) => {
        btn.addEventListener('click', () => updateTokenStatus(btn.dataset.rowComplete, 'Completed'));
      });
      tbody.querySelectorAll('[data-row-skip]').forEach((btn) => {
        btn.addEventListener('click', () => updateTokenStatus(btn.dataset.rowSkip, 'Skipped'));
      });
      tbody.querySelectorAll('[data-row-recall]').forEach((btn) => {
        btn.addEventListener('click', () => updateTokenStatus(btn.dataset.rowRecall, 'Waiting'));
      });
    }

    function callSpecificToken(tokenId) {
      const state = SQ.getState();
      const target = state.tokens.find((t) => t.id === tokenId);
      if (!target) return;

      // Complete any currently serving token in the SAME department first
      const currentServing = state.tokens.find(
        (t) => t.departmentId === target.departmentId && t.preferredDate === target.preferredDate && t.status === 'Serving'
      );
      if (currentServing && currentServing.id !== target.id) {
        currentServing.status = 'Completed';
        currentServing.updatedAt = new Date().toISOString();
      }

      target.status = 'Serving';
      target.updatedAt = new Date().toISOString();
      SQ.pushNotification(state, 'Now Serving', `Token ${target.tokenNumber} called to counter.`);
      SQ.saveState(state);
      SQ.showToast('Calling Token', `Now serving ${target.tokenNumber} (${target.customerName}).`, 'success');
    }

    function updateTokenStatus(tokenId, newStatus) {
      const state = SQ.getState();
      const target = state.tokens.find((t) => t.id === tokenId);
      if (!target) return;

      target.status = newStatus;
      target.updatedAt = new Date().toISOString();

      const msgMap = {
        Completed: [`Token Completed`, `${target.tokenNumber} marked as completed.`, 'success'],
        Skipped: [`Token Skipped`, `${target.tokenNumber} moved to Skipped list.`, 'warning'],
        Waiting: [`Token Recalled`, `${target.tokenNumber} placed back in Waiting queue.`, 'info'],
      };
      const [title, msg, toastType] = msgMap[newStatus] || ['Updated', `${target.tokenNumber} updated.`, 'info'];

      SQ.pushNotification(state, title, msg);
      SQ.saveState(state);
      SQ.showToast(title, msg, toastType);
    }

    // Main Control Console Buttons
    if (callNextBtn) {
      callNextBtn.addEventListener('click', () => {
        const state = SQ.getState();
        const scoped = getScopedTodayTokens(state);
        const currentServing = scoped.find((t) => t.status === 'Serving');
        const nextWaiting = scoped.find((t) => t.status === 'Waiting');

        if (!nextWaiting) {
          SQ.showToast('Queue Clear', 'There are no waiting customers in the selected queue.', 'info');
          return;
        }

        if (currentServing) {
          currentServing.status = 'Completed';
          currentServing.updatedAt = new Date().toISOString();
        }
        nextWaiting.status = 'Serving';
        nextWaiting.updatedAt = new Date().toISOString();

        SQ.pushNotification(state, 'Next Token Called', `Now serving ${nextWaiting.tokenNumber} (${nextWaiting.customerName}).`);
        SQ.saveState(state);
        SQ.showToast('Now Serving Next Token', `${nextWaiting.tokenNumber} • ${nextWaiting.customerName}`, 'success');
      });
    }

    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        const state = SQ.getState();
        const scoped = getScopedTodayTokens(state);
        const currentServing = scoped.find((t) => t.status === 'Serving');
        if (!currentServing) {
          SQ.showToast('Nothing Active', 'No token is currently marked as Serving.', 'warning');
          return;
        }
        updateTokenStatus(currentServing.id, 'Completed');
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        const state = SQ.getState();
        const scoped = getScopedTodayTokens(state);
        const target = scoped.find((t) => t.status === 'Serving') || scoped.find((t) => t.status === 'Waiting');
        if (!target) {
          SQ.showToast('Queue Empty', 'No active or waiting token to skip.', 'warning');
          return;
        }
        updateTokenStatus(target.id, 'Skipped');
      });
    }

    // Bind Filters
    centerFilter.addEventListener('change', () => {
      populateDeptFilter();
      render();
    });
    deptFilter.addEventListener('change', render);
    searchInput.addEventListener('input', render);
    statusFilter.addEventListener('change', render);

    populateFilters();
    render();
    window.addEventListener('smartqueue:updated', render);
  }

  /* ========================================================================
     3. ADMIN DASHBOARD (admin.html)
     ======================================================================== */
  function initAdminDashboard(SQ) {
    const countersTbody = document.getElementById('admin-counters-tbody');
    const deptsTbody = document.getElementById('admin-departments-tbody');
    const addCounterBtn = document.getElementById('btn-add-counter');
    const addDeptBtn = document.getElementById('btn-add-department');

    function renderStats(state) {
      const today = SQ.getRelativeDate(0);
      const todayTokens = state.tokens.filter((t) => t.preferredDate === today);
      const completedToday = todayTokens.filter((t) => t.status === 'Completed').length;
      const completionRate = todayTokens.length > 0 ? Math.round((completedToday / todayTokens.length) * 100) : 0;

      // Unique customer identities across tokens
      const uniquePhones = new Set(state.tokens.map((t) => t.phone));
      const activeCounters = state.counters.filter((c) => c.status === 'Active').length;

      document.getElementById('admin-stat-centers').textContent = String(state.centers.length);
      document.getElementById('admin-stat-customers').textContent = String(uniquePhones.size + 124); // Realistic cumulative + live
      document.getElementById('admin-stat-daily').textContent = String(todayTokens.length);
      document.getElementById('admin-stat-daily-sub').textContent = `${completedToday} completed (${completionRate}%)`;
      document.getElementById('admin-stat-counters').textContent = `${activeCounters}/${state.counters.length}`;
    }

    /**
     * Renders an interactive, responsive SVG Weekly Token Statistics Bar Chart.
     */
    function renderBarChart(state) {
      const container = document.getElementById('admin-bar-chart');
      if (!container) return;

      const today = SQ.getRelativeDate(0);
      const todayTokens = state.tokens.filter((t) => t.preferredDate === today);
      const todayCompleted = todayTokens.filter((t) => t.status === 'Completed').length;

      const data = [
        ...(state.weeklyBaseline || []),
        { day: 'Today', booked: todayTokens.length, completed: todayCompleted },
      ];

      const maxVal = Math.max(100, ...data.map((d) => d.booked + 10));
      const width = 560;
      const height = 230;
      const padLeft = 36;
      const padBottom = 32;
      const padTop = 18;
      const chartW = width - padLeft - 16;
      const chartH = height - padBottom - padTop;
      const groupW = chartW / data.length;

      let gridLines = '';
      for (let i = 0; i <= 4; i++) {
        const y = padTop + (chartH / 4) * i;
        const val = Math.round(maxVal - (maxVal / 4) * i);
        gridLines += `
          <line x1="${padLeft}" y1="${y}" x2="${width - 12}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3 3"/>
          <text x="${padLeft - 6}" y="${y + 4}" text-anchor="end" fill="#64748B" font-size="10">${val}</text>
        `;
      }

      const bars = data
        .map((item, idx) => {
          const xBase = padLeft + idx * groupW + groupW * 0.2;
          const barW = Math.min(18, groupW * 0.26);
          const hBooked = Math.max(4, (item.booked / maxVal) * chartH);
          const hComp = Math.max(4, (item.completed / maxVal) * chartH);
          const yBooked = padTop + chartH - hBooked;
          const yComp = padTop + chartH - hComp;
          const labelX = padLeft + idx * groupW + groupW / 2;

          return `
            <g class="chart-bar-group" data-day="${SQ.escapeHtml(item.day)}" data-booked="${item.booked}" data-completed="${item.completed}">
              <rect x="${xBase}" y="${yBooked}" width="${barW}" height="${hBooked}" rx="4" fill="#2563EB" opacity="0.9"/>
              <rect x="${xBase + barW + 4}" y="${yComp}" width="${barW}" height="${hComp}" rx="4" fill="#10B981" opacity="0.9"/>
              <text x="${labelX}" y="${height - 10}" text-anchor="middle" fill="${item.day === 'Today' ? '#2563EB' : '#64748B'}" font-weight="${item.day === 'Today' ? '700' : '500'}" font-size="11">${SQ.escapeHtml(item.day)}</text>
            </g>
          `;
        })
        .join('');

      container.innerHTML = `
        <div class="chart-tooltip" id="bar-chart-tooltip"></div>
        <svg viewBox="0 0 ${width} ${height}" class="w-100" style="height:230px; overflow:visible;" role="img" aria-label="Daily Token Statistics Chart">
          ${gridLines}
          ${bars}
        </svg>
      `;

      const tooltip = document.getElementById('bar-chart-tooltip');
      container.querySelectorAll('.chart-bar-group').forEach((g) => {
        g.style.cursor = 'pointer';
        g.addEventListener('mouseenter', (e) => {
          const rect = container.getBoundingClientRect();
          const gRect = g.getBoundingClientRect();
          tooltip.innerHTML = `<strong>${g.dataset.day}</strong>: ${g.dataset.booked} Booked • ${g.dataset.completed} Completed`;
          tooltip.style.left = `${gRect.left - rect.left + gRect.width / 2}px`;
          tooltip.style.top = `${gRect.top - rect.top}px`;
          tooltip.classList.add('visible');
        });
        g.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
      });
    }

    /**
     * Renders an interactive SVG Status Breakdown Donut Chart & Dept Performance Bars.
     */
    function renderDonutAndPerformance(state) {
      const donutEl = document.getElementById('admin-donut-chart');
      const legendEl = document.getElementById('admin-donut-legend');
      const perfEl = document.getElementById('admin-dept-perf');

      const counts = {
        Completed: state.tokens.filter((t) => t.status === 'Completed').length,
        Waiting: state.tokens.filter((t) => t.status === 'Waiting').length,
        Serving: state.tokens.filter((t) => t.status === 'Serving').length,
        Skipped: state.tokens.filter((t) => t.status === 'Skipped' || t.status === 'Cancelled').length,
      };

      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      const segments = [
        { label: 'Completed', value: counts.Completed, color: '#10B981' },
        { label: 'Waiting', value: counts.Waiting, color: '#2563EB' },
        { label: 'Serving', value: counts.Serving, color: '#0EA5E9' },
        { label: 'Skipped / Cancelled', value: counts.Skipped, color: '#F59E0B' },
      ];

      if (donutEl && legendEl) {
        const radius = 56;
        const circumference = 2 * Math.PI * radius;
        let offset = 0;

        const circles = segments
          .map((seg) => {
            const pct = seg.value / total;
            const dash = pct * circumference;
            const circle = `
              <circle cx="80" cy="80" r="${radius}" fill="transparent"
                stroke="${seg.color}" stroke-width="20"
                stroke-dasharray="${dash} ${circumference - dash}"
                stroke-dashoffset="${-offset}" />
            `;
            offset += dash;
            return circle;
          })
          .join('');

        donutEl.innerHTML = `
          <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Queue Status Distribution">
            <g transform="rotate(-90 80 80)">
              ${circles}
            </g>
            <text x="80" y="76" text-anchor="middle" fill="#0F172A" font-size="22" font-weight="800">${total}</text>
            <text x="80" y="95" text-anchor="middle" fill="#64748B" font-size="10" font-weight="600">TOTAL TOKENS</text>
          </svg>
        `;

        legendEl.innerHTML = segments
          .map(
            (seg) => `
            <div class="d-flex align-items-center justify-content-between py-1 small">
              <div class="d-flex align-items-center gap-2">
                <span style="width:10px;height:10px;border-radius:3px;background:${seg.color};display:inline-block;"></span>
                <span class="text-secondary">${seg.label}</span>
              </div>
              <strong class="tabular-nums">${seg.value} (${Math.round((seg.value / total) * 100)}%)</strong>
            </div>
          `
          )
          .join('');
      }

      if (perfEl) {
        perfEl.innerHTML = state.departments
          .slice(0, 6)
          .map((dept) => {
            const waitingCount = state.tokens.filter((t) => t.departmentId === dept.id && t.status === 'Waiting').length;
            const loadPct = Math.min(100, Math.max(12, waitingCount * 22));
            return `
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center small mb-1">
                  <span class="fw-semibold text-dark">${SQ.escapeHtml(dept.name)} <span class="text-muted">(${SQ.escapeHtml(dept.code)})</span></span>
                  <span class="text-muted tabular-nums">Avg ${dept.avgMinutes}m • ${waitingCount} waiting</span>
                </div>
                <div class="sq-progress" style="height:8px;">
                  <div class="sq-progress-bar" style="width:${loadPct}%;"></div>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }

    /**
     * Renders Service Counters Management Table.
     */
    function renderCountersTable(state) {
      if (!countersTbody) return;
      if (state.counters.length === 0) {
        countersTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No service counters configured.</td></tr>`;
        return;
      }

      countersTbody.innerHTML = state.counters
        .map((cnt) => {
          const centerName = SQ.getCenterName(state, cnt.centerId);
          const deptName = SQ.getDepartmentName(state, cnt.departmentId);
          return `
            <tr>
              <td class="fw-bold text-dark">${SQ.escapeHtml(cnt.name)}</td>
              <td class="text-secondary">${SQ.escapeHtml(centerName)}</td>
              <td class="text-secondary">${SQ.escapeHtml(deptName)}</td>
              <td>${SQ.escapeHtml(cnt.staffName)}</td>
              <td>${SQ.getStatusBadgeHTML(cnt.status)}</td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  <button type="button" class="btn-icon" data-toggle-counter="${SQ.escapeHtml(cnt.id)}" title="Toggle Active/Paused">
                    <i class="fa-solid ${cnt.status === 'Active' ? 'fa-pause' : 'fa-play'}"></i>
                  </button>
                  <button type="button" class="btn-icon" data-edit-counter="${SQ.escapeHtml(cnt.id)}" title="Edit Counter">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button type="button" class="btn-icon text-danger" data-delete-counter="${SQ.escapeHtml(cnt.id)}" title="Delete Counter">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      countersTbody.querySelectorAll('[data-toggle-counter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const st = SQ.getState();
          const c = st.counters.find((x) => x.id === btn.dataset.toggleCounter);
          if (!c) return;
          c.status = c.status === 'Active' ? 'Paused' : 'Active';
          SQ.saveState(st);
          SQ.showToast('Counter Updated', `${c.name} is now ${c.status}.`, 'info');
        });
      });

      countersTbody.querySelectorAll('[data-edit-counter]').forEach((btn) => {
        btn.addEventListener('click', () => openCounterModal(btn.dataset.editCounter));
      });

      countersTbody.querySelectorAll('[data-delete-counter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const st = SQ.getState();
          const c = st.counters.find((x) => x.id === btn.dataset.deleteCounter);
          if (!c) return;
          SQ.openModal({
            title: `Remove ${c.name}?`,
            bodyHtml: `<p class="text-secondary mb-0">Are you sure you want to delete service counter <strong>${SQ.escapeHtml(c.name)}</strong>?</p>`,
            confirmText: 'Delete Counter',
            confirmClass: 'btn-sq-danger-soft',
            onConfirm: () => {
              const fresh = SQ.getState();
              fresh.counters = fresh.counters.filter((x) => x.id !== c.id);
              SQ.saveState(fresh);
              SQ.showToast('Counter Removed', `${c.name} deleted.`, 'warning');
            },
          });
        });
      });
    }

    /**
     * Renders Departments Management Table.
     */
    function renderDepartmentsTable(state) {
      if (!deptsTbody) return;
      if (state.departments.length === 0) {
        deptsTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No departments configured.</td></tr>`;
        return;
      }

      deptsTbody.innerHTML = state.departments
        .map((dept) => {
          const centerName = SQ.getCenterName(state, dept.centerId);
          return `
            <tr>
              <td><span class="token-chip">${SQ.escapeHtml(dept.code)}</span></td>
              <td class="fw-bold text-dark">${SQ.escapeHtml(dept.name)}</td>
              <td class="text-secondary">${SQ.escapeHtml(centerName)}</td>
              <td class="tabular-nums">${dept.avgMinutes} min</td>
              <td>${SQ.getStatusBadgeHTML(dept.active ? 'Active' : 'Inactive')}</td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  <button type="button" class="btn-icon" data-toggle-dept="${SQ.escapeHtml(dept.id)}" title="Toggle Active/Inactive">
                    <i class="fa-solid ${dept.active ? 'fa-ban' : 'fa-check'}"></i>
                  </button>
                  <button type="button" class="btn-icon" data-edit-dept="${SQ.escapeHtml(dept.id)}" title="Edit Department">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button type="button" class="btn-icon text-danger" data-delete-dept="${SQ.escapeHtml(dept.id)}" title="Delete Department">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      deptsTbody.querySelectorAll('[data-toggle-dept]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const st = SQ.getState();
          const d = st.departments.find((x) => x.id === btn.dataset.toggleDept);
          if (!d) return;
          d.active = !d.active;
          SQ.saveState(st);
          SQ.showToast('Department Updated', `${d.name} is now ${d.active ? 'Active' : 'Inactive'}.`, 'info');
        });
      });

      deptsTbody.querySelectorAll('[data-edit-dept]').forEach((btn) => {
        btn.addEventListener('click', () => openDepartmentModal(btn.dataset.editDept));
      });

      deptsTbody.querySelectorAll('[data-delete-dept]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const st = SQ.getState();
          const d = st.departments.find((x) => x.id === btn.dataset.deleteDept);
          if (!d) return;
          SQ.openModal({
            title: `Remove ${d.name}?`,
            bodyHtml: `<p class="text-secondary mb-0">Delete department <strong>${SQ.escapeHtml(d.name)} (${SQ.escapeHtml(d.code)})</strong> from ${SQ.escapeHtml(SQ.getCenterName(st, d.centerId))}?</p>`,
            confirmText: 'Delete Department',
            confirmClass: 'btn-sq-danger-soft',
            onConfirm: () => {
              const fresh = SQ.getState();
              fresh.departments = fresh.departments.filter((x) => x.id !== d.id);
              SQ.saveState(fresh);
              SQ.showToast('Department Removed', `${d.name} deleted.`, 'warning');
            },
          });
        });
      });
    }

    /**
     * Add / Edit Service Counter Modal
     */
    function openCounterModal(counterId = null) {
      const state = SQ.getState();
      const existing = counterId ? state.counters.find((c) => c.id === counterId) : null;

      const centerOptions = state.centers
        .map(
          (c) =>
            `<option value="${SQ.escapeHtml(c.id)}" ${existing && existing.centerId === c.id ? 'selected' : ''}>${SQ.escapeHtml(c.name)}</option>`
        )
        .join('');

      const deptOptions = state.departments
        .map(
          (d) =>
            `<option value="${SQ.escapeHtml(d.id)}" ${existing && existing.departmentId === d.id ? 'selected' : ''}>${SQ.escapeHtml(d.name)} (${SQ.escapeHtml(d.code)})</option>`
        )
        .join('');

      SQ.openModal({
        title: existing ? 'Edit Service Counter' : 'Add New Service Counter',
        confirmText: existing ? 'Save Changes' : 'Create Counter',
        bodyHtml: `
          <div class="mb-3">
            <label class="form-label fw-semibold small">Counter Name</label>
            <input type="text" id="m-counter-name" class="sq-input" placeholder="e.g., Counter 5" value="${existing ? SQ.escapeHtml(existing.name) : ''}">
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold small">Service Center</label>
            <select id="m-counter-center" class="sq-select">${centerOptions}</select>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold small">Assigned Department</label>
            <select id="m-counter-dept" class="sq-select">${deptOptions}</select>
          </div>
          <div class="row g-2">
            <div class="col-7">
              <label class="form-label fw-semibold small">Assigned Staff</label>
              <input type="text" id="m-counter-staff" class="sq-input" placeholder="Staff member name" value="${existing ? SQ.escapeHtml(existing.staffName) : ''}">
            </div>
            <div class="col-5">
              <label class="form-label fw-semibold small">Status</label>
              <select id="m-counter-status" class="sq-select">
                <option value="Active" ${!existing || existing.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Paused" ${existing && existing.status === 'Paused' ? 'selected' : ''}>Paused</option>
              </select>
            </div>
          </div>
        `,
        onConfirm: (overlay) => {
          const name = overlay.querySelector('#m-counter-name').value.trim();
          const centerId = overlay.querySelector('#m-counter-center').value;
          const departmentId = overlay.querySelector('#m-counter-dept').value;
          const staffName = overlay.querySelector('#m-counter-staff').value.trim() || 'Assigned Officer';
          const status = overlay.querySelector('#m-counter-status').value;

          if (name.length < 2) {
            SQ.showToast('Validation Error', 'Please enter a valid counter name.', 'warning');
            return false;
          }

          const st = SQ.getState();
          if (existing) {
            const target = st.counters.find((c) => c.id === existing.id);
            if (target) {
              Object.assign(target, { name, centerId, departmentId, staffName, status });
            }
            SQ.showToast('Counter Updated', `${name} updated successfully.`, 'success');
          } else {
            st.counters.push({
              id: `cnt-${Date.now()}`,
              name,
              centerId,
              departmentId,
              staffName,
              status,
            });
            SQ.showToast('Counter Created', `${name} added to system.`, 'success');
          }
          SQ.saveState(st);
          return true;
        },
      });
    }

    /**
     * Add / Edit Department Modal
     */
    function openDepartmentModal(deptId = null) {
      const state = SQ.getState();
      const existing = deptId ? state.departments.find((d) => d.id === deptId) : null;

      const centerOptions = state.centers
        .map(
          (c) =>
            `<option value="${SQ.escapeHtml(c.id)}" ${existing && existing.centerId === c.id ? 'selected' : ''}>${SQ.escapeHtml(c.name)}</option>`
        )
        .join('');

      SQ.openModal({
        title: existing ? 'Edit Department' : 'Add New Department',
        confirmText: existing ? 'Save Changes' : 'Create Department',
        bodyHtml: `
          <div class="mb-3">
            <label class="form-label fw-semibold small">Department / Service Name</label>
            <input type="text" id="m-dept-name" class="sq-input" placeholder="e.g., Cardiology Desk" value="${existing ? SQ.escapeHtml(existing.name) : ''}">
          </div>
          <div class="row g-2 mb-3">
            <div class="col-5">
              <label class="form-label fw-semibold small">Token Prefix (2-4 chars)</label>
              <input type="text" id="m-dept-code" class="sq-input text-uppercase" maxlength="4" placeholder="CRD" value="${existing ? SQ.escapeHtml(existing.code) : ''}">
            </div>
            <div class="col-7">
              <label class="form-label fw-semibold small">Avg. Service Time (mins)</label>
              <input type="number" id="m-dept-time" class="sq-input" min="1" max="60" value="${existing ? existing.avgMinutes : 8}">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold small">Service Center</label>
            <select id="m-dept-center" class="sq-select">${centerOptions}</select>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="m-dept-active" ${!existing || existing.active ? 'checked' : ''}>
            <label class="form-check-label small fw-medium" for="m-dept-active">Department is active and accepting bookings</label>
          </div>
        `,
        onConfirm: (overlay) => {
          const name = overlay.querySelector('#m-dept-name').value.trim();
          const code = overlay.querySelector('#m-dept-code').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const avgMinutes = parseInt(overlay.querySelector('#m-dept-time').value, 10) || 6;
          const centerId = overlay.querySelector('#m-dept-center').value;
          const active = overlay.querySelector('#m-dept-active').checked;

          if (name.length < 2 || code.length < 2) {
            SQ.showToast('Validation Error', 'Please provide a department name and 2-4 char code.', 'warning');
            return false;
          }

          const st = SQ.getState();
          if (existing) {
            const target = st.departments.find((d) => d.id === existing.id);
            if (target) {
              Object.assign(target, { name, code, avgMinutes, centerId, active });
            }
            SQ.showToast('Department Updated', `${name} (${code}) updated.`, 'success');
          } else {
            st.departments.push({
              id: `dept-${Date.now()}`,
              centerId,
              name,
              code,
              avgMinutes,
              active,
            });
            SQ.showToast('Department Created', `${name} (${code}) is ready for bookings.`, 'success');
          }
          SQ.saveState(st);
          return true;
        },
      });
    }

    if (addCounterBtn) addCounterBtn.addEventListener('click', () => openCounterModal(null));
    if (addDeptBtn) addDeptBtn.addEventListener('click', () => openDepartmentModal(null));

    function renderAll() {
      const state = SQ.getState();
      renderStats(state);
      renderBarChart(state);
      renderDonutAndPerformance(state);
      renderCountersTable(state);
      renderDepartmentsTable(state);
    }

    renderAll();
    window.addEventListener('smartqueue:updated', renderAll);
  }
})(window, document);
