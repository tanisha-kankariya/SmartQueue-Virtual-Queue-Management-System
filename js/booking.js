/**
 * SmartQueue – Token Booking Page Controller (booking.html)
 * -------------------------------------------------------------------------
 * Handles cascading Service Center -> Department selection, live queue
 * wait-time preview, client-side form validation, unique token generation,
 * localStorage persistence, and digital confirmation ticket display.
 */

(function (window, document) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const SQ = window.SmartQueue;
    if (!SQ) return;

    const form = document.getElementById('booking-form');
    if (!form) return;

    const centerSelect = document.getElementById('book-center');
    const deptSelect = document.getElementById('book-department');
    const nameInput = document.getElementById('book-name');
    const phoneInput = document.getElementById('book-phone');
    const dateInput = document.getElementById('book-date');

    const confirmCard = document.getElementById('booking-confirmation-card');
    const formCard = document.getElementById('booking-form-card');

    // Initialize date constraints (today as minimum and default)
    const todayStr = SQ.getRelativeDate(0);
    dateInput.min = todayStr;
    dateInput.value = todayStr;

    // Pre-fill demo user info gently or keep helpful placeholder
    const initialState = SQ.getState();
    if (initialState.currentUser) {
      nameInput.value = initialState.currentUser.name || '';
      phoneInput.value = initialState.currentUser.phone || '';
    }

    /**
     * Populates Service Center dropdown.
     */
    function populateCenters(selectedCenterId = '') {
      const state = SQ.getState();
      centerSelect.innerHTML = `<option value="">Choose a service center...</option>`;
      state.centers.forEach((center) => {
        const opt = document.createElement('option');
        opt.value = center.id;
        opt.textContent = `${center.name} (${center.category})`;
        if (selectedCenterId && center.id === selectedCenterId) opt.selected = true;
        centerSelect.appendChild(opt);
      });
    }

    /**
     * Populates active Departments belonging to the selected Service Center.
     */
    function populateDepartments(centerId) {
      const state = SQ.getState();
      deptSelect.innerHTML = '';

      if (!centerId) {
        deptSelect.disabled = true;
        deptSelect.innerHTML = `<option value="">Select a service center first...</option>`;
        updateLivePreview();
        return;
      }

      const depts = state.departments.filter((d) => d.centerId === centerId && d.active);
      if (depts.length === 0) {
        deptSelect.disabled = true;
        deptSelect.innerHTML = `<option value="">No active departments available</option>`;
        updateLivePreview();
        return;
      }

      deptSelect.disabled = false;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select department or service...';
      deptSelect.appendChild(placeholder);

      depts.forEach((dept) => {
        const waitingCount = state.tokens.filter(
          (t) =>
            t.departmentId === dept.id &&
            t.preferredDate === (dateInput.value || todayStr) &&
            t.status === 'Waiting'
        ).length;

        const opt = document.createElement('option');
        opt.value = dept.id;
        opt.textContent = `${dept.name} (~${dept.avgMinutes}m/person • ${waitingCount} waiting)`;
        deptSelect.appendChild(opt);
      });

      updateLivePreview();
    }

    /**
     * Updates the real-time Queue Preview panel beside the booking form.
     */
    function updateLivePreview() {
      const state = SQ.getState();
      const centerId = centerSelect.value;
      const deptId = deptSelect.value;
      const selectedDate = dateInput.value || todayStr;

      const centerEl = document.getElementById('preview-center-name');
      const deptEl = document.getElementById('preview-dept-name');
      const servingEl = document.getElementById('preview-serving-now');
      const waitingEl = document.getElementById('preview-waiting-count');
      const waitTimeEl = document.getElementById('preview-est-wait');
      const nextPrefixEl = document.getElementById('preview-next-prefix');

      const center = state.centers.find((c) => c.id === centerId);
      const dept = state.departments.find((d) => d.id === deptId);

      centerEl.textContent = center ? center.name : 'Select a service center';
      deptEl.textContent = dept ? dept.name : 'Choose a department to preview wait time';

      if (!dept) {
        servingEl.textContent = '--';
        waitingEl.textContent = '--';
        waitTimeEl.textContent = '--';
        nextPrefixEl.textContent = 'SQ-###';
        return;
      }

      const queueTokens = state.tokens.filter(
        (t) => t.departmentId === dept.id && t.preferredDate === selectedDate
      );
      const serving = queueTokens.find((t) => t.status === 'Serving');
      const waiting = queueTokens.filter((t) => t.status === 'Waiting');

      const aheadCount = waiting.length + (serving ? 1 : 0);
      const estMinutes = aheadCount === 0 ? Math.max(2, Math.round(dept.avgMinutes / 2)) : aheadCount * dept.avgMinutes;

      servingEl.textContent = serving ? serving.tokenNumber : 'Ready';
      waitingEl.textContent = `${waiting.length} ${waiting.length === 1 ? 'person' : 'people'}`;
      waitTimeEl.textContent = `~${estMinutes} mins`;
      nextPrefixEl.textContent = SQ.generateUniqueTokenNumber(state, dept.code);
    }

    /**
     * Validates a single input/select field and toggles error classes.
     */
    function setFieldValidity(el, isValid, errorMsgEl, message = '') {
      if (isValid) {
        el.classList.remove('is-invalid');
        el.classList.add('is-valid');
      } else {
        el.classList.remove('is-valid');
        el.classList.add('is-invalid');
        if (errorMsgEl && message) errorMsgEl.textContent = message;
      }
      return isValid;
    }

    function validateForm() {
      const centerOk = setFieldValidity(
        centerSelect,
        Boolean(centerSelect.value),
        document.getElementById('err-center'),
        'Please select a service center.'
      );

      const deptOk = setFieldValidity(
        deptSelect,
        Boolean(deptSelect.value),
        document.getElementById('err-dept'),
        'Please select a department or service.'
      );

      const nameVal = nameInput.value.trim();
      const nameOk = setFieldValidity(
        nameInput,
        nameVal.length >= 2,
        document.getElementById('err-name'),
        'Please enter customer full name (at least 2 characters).'
      );

      const digitsOnly = phoneInput.value.replace(/\D/g, '');
      const phoneOk = setFieldValidity(
        phoneInput,
        digitsOnly.length >= 10 && digitsOnly.length <= 15,
        document.getElementById('err-phone'),
        'Please enter a valid 10-digit mobile number.'
      );

      const dateVal = dateInput.value;
      const dateOk = setFieldValidity(
        dateInput,
        Boolean(dateVal) && dateVal >= todayStr,
        document.getElementById('err-date'),
        'Please choose today or a future date.'
      );

      return centerOk && deptOk && nameOk && phoneOk && dateOk;
    }

    // Event bindings
    centerSelect.addEventListener('change', () => {
      populateDepartments(centerSelect.value);
      centerSelect.classList.remove('is-invalid');
    });

    deptSelect.addEventListener('change', () => {
      updateLivePreview();
      deptSelect.classList.remove('is-invalid');
    });

    dateInput.addEventListener('change', () => {
      if (centerSelect.value) {
        const currentDept = deptSelect.value;
        populateDepartments(centerSelect.value);
        if (currentDept) deptSelect.value = currentDept;
      }
      updateLivePreview();
    });

    [nameInput, phoneInput].forEach((input) => {
      input.addEventListener('input', () => input.classList.remove('is-invalid'));
    });

    // Handle Form Submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm()) {
        SQ.showToast('Check Form Fields', 'Please complete all required booking details.', 'warning');
        return;
      }

      const state = SQ.getState();
      const centerId = centerSelect.value;
      const deptId = deptSelect.value;
      const dept = state.departments.find((d) => d.id === deptId);
      const counter =
        state.counters.find((c) => c.departmentId === deptId && c.status === 'Active') ||
        state.counters.find((c) => c.departmentId === deptId);

      const tokenNumber = SQ.generateUniqueTokenNumber(state, dept ? dept.code : 'SQ');
      const nowIso = new Date().toISOString();

      const newToken = {
        id: `tok-${Date.now()}`,
        tokenNumber,
        centerId,
        departmentId: deptId,
        counterId: counter ? counter.id : null,
        customerName: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        preferredDate: dateInput.value,
        status: 'Waiting',
        isUserBooking: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Update current user & save token
      state.currentUser = {
        ...state.currentUser,
        name: newToken.customerName,
        phone: newToken.phone,
      };
      state.tokens.push(newToken);
      state.activeTokenId = newToken.id;

      SQ.pushNotification(
        state,
        'New Token Booked',
        `Token ${newToken.tokenNumber} confirmed at ${SQ.getCenterName(state, centerId)}.`
      );
      SQ.saveState(state);

      // Compute exact position & estimated wait
      const metrics = SQ.computeQueueMetrics(state, newToken);

      // Populate confirmation card
      document.getElementById('confirm-token-number').textContent = newToken.tokenNumber;
      document.getElementById('confirm-center').textContent = SQ.getCenterName(state, centerId);
      document.getElementById('confirm-department').textContent = SQ.getDepartmentName(state, deptId);
      document.getElementById('confirm-counter').textContent = metrics.counterName;
      document.getElementById('confirm-customer').textContent = newToken.customerName;
      document.getElementById('confirm-phone').textContent = newToken.phone;
      document.getElementById('confirm-date').textContent = SQ.formatDisplayDate(newToken.preferredDate);
      document.getElementById('confirm-wait').textContent = `~${metrics.estimatedWait} mins`;
      document.getElementById('confirm-position').textContent = `#${metrics.position} (${metrics.peopleAhead} ahead)`;

      const trackLink = document.getElementById('confirm-track-link');
      if (trackLink) {
        trackLink.href = `tracking.html?token=${encodeURIComponent(newToken.tokenNumber)}`;
      }

      formCard.classList.add('d-none');
      confirmCard.classList.remove('d-none');
      confirmCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

      SQ.showToast(
        'Token Booked Successfully!',
        `Your token ${newToken.tokenNumber} is confirmed. Est. wait ~${metrics.estimatedWait} mins.`,
        'success'
      );
    });

    // Book Another Token button
    const bookAnotherBtn = document.getElementById('btn-book-another');
    if (bookAnotherBtn) {
      bookAnotherBtn.addEventListener('click', () => {
        confirmCard.classList.add('d-none');
        formCard.classList.remove('d-none');
        form.querySelectorAll('.is-valid, .is-invalid').forEach((el) => {
          el.classList.remove('is-valid', 'is-invalid');
        });
        populateDepartments(centerSelect.value);
      });
    }

    // Print Ticket button
    const printBtn = document.getElementById('btn-print-ticket');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Check URL query parameter (?center=ctr-1)
    const params = new URLSearchParams(window.location.search);
    const presetCenter = params.get('center') || '';
    populateCenters(presetCenter);
    if (presetCenter) {
      populateDepartments(presetCenter);
    }

    // Sync live preview if state updates in another tab
    window.addEventListener('smartqueue:updated', () => {
      updateLivePreview();
    });
  });
})(window, document);
