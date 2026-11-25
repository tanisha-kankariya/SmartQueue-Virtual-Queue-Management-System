/**
 * SmartQueue – Shared State Store, Demo Data & Global UI Components
 * -------------------------------------------------------------------------
 * Manages localStorage persistence, token generation, queue calculations,
 * live cross-tab synchronization, toast notifications, confirmation modals,
 * and responsive sidebar navigation across all SmartQueue pages.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'smartqueue_demo_state_v1';

  /**
   * Returns YYYY-MM-DD formatted date relative to today.
   * @param {number} offsetDays - e.g., 0 for today, -1 for yesterday
   */
  function getRelativeDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Formats a date string nicely (e.g. "Nov 26, 2026").
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr) return 'Today';
    const today = getRelativeDate(0);
    if (dateStr === today) return 'Today';
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Formats ISO timestamp into readable time (e.g., "10:42 AM").
   */
  function formatTime(isoStr) {
    if (!isoStr) return '--';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Escapes HTML special characters to prevent XSS in dynamic rendering.
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Creates fresh realistic hackathon demo seed data.
   */
  function createDefaultState() {
    const today = getRelativeDate(0);
    const yesterday = getRelativeDate(-1);
    const twoDaysAgo = getRelativeDate(-2);
    const now = Date.now();

    const centers = [
      {
        id: 'ctr-1',
        name: 'City Care General Hospital',
        category: 'Healthcare',
        address: '420 Wellness Blvd, Downtown',
        hours: '08:00 AM – 08:00 PM',
      },
      {
        id: 'ctr-2',
        name: 'Metro National Bank – Central',
        category: 'Banking',
        address: '118 Financial Plaza, Suite 100',
        hours: '09:30 AM – 04:30 PM',
      },
      {
        id: 'ctr-3',
        name: 'Apex University Student Hub',
        category: 'College Office',
        address: 'North Campus Admin Block B',
        hours: '09:00 AM – 05:00 PM',
      },
      {
        id: 'ctr-4',
        name: 'CivicOne Citizen Service Center',
        category: 'Service Center',
        address: '75 Civic Square, East Wing',
        hours: '08:30 AM – 05:30 PM',
      },
    ];

    const departments = [
      { id: 'dept-opd', centerId: 'ctr-1', name: 'General OPD Consultation', code: 'OPD', avgMinutes: 7, active: true },
      { id: 'dept-lab', centerId: 'ctr-1', name: 'Diagnostics & Blood Lab', code: 'LAB', avgMinutes: 6, active: true },
      { id: 'dept-phm', centerId: 'ctr-1', name: 'Pharmacy Pickup', code: 'PHM', avgMinutes: 4, active: true },
      { id: 'dept-acc', centerId: 'ctr-2', name: 'Account & KYC Services', code: 'ACC', avgMinutes: 8, active: true },
      { id: 'dept-lon', centerId: 'ctr-2', name: 'Loan & Mortgage Desk', code: 'LON', avgMinutes: 12, active: true },
      { id: 'dept-csh', centerId: 'ctr-2', name: 'Cashier & Forex', code: 'CSH', avgMinutes: 5, active: true },
      { id: 'dept-reg', centerId: 'ctr-3', name: 'Registrar & Transcripts', code: 'REG', avgMinutes: 6, active: true },
      { id: 'dept-aid', centerId: 'ctr-3', name: 'Financial Aid Office', code: 'AID', avgMinutes: 10, active: true },
      { id: 'dept-civ', centerId: 'ctr-4', name: 'Passport & ID Verification', code: 'CIV', avgMinutes: 9, active: true },
      { id: 'dept-prm', centerId: 'ctr-4', name: 'Permits & Utility Billing', code: 'PRM', avgMinutes: 7, active: true },
    ];

    const counters = [
      { id: 'cnt-1', name: 'Counter 1', centerId: 'ctr-1', departmentId: 'dept-opd', staffName: 'Dr. Priya Nair', status: 'Active' },
      { id: 'cnt-2', name: 'Lab Desk A', centerId: 'ctr-1', departmentId: 'dept-lab', staffName: 'Rohan Verma', status: 'Active' },
      { id: 'cnt-3', name: 'Teller Window 2', centerId: 'ctr-2', departmentId: 'dept-acc', staffName: 'Sneha Kapoor', status: 'Active' },
      { id: 'cnt-4', name: 'Advisory Desk 1', centerId: 'ctr-2', departmentId: 'dept-lon', staffName: 'Vikram Singh', status: 'Paused' },
      { id: 'cnt-5', name: 'Registrar Window 4', centerId: 'ctr-3', departmentId: 'dept-reg', staffName: 'Elena Brooks', status: 'Active' },
      { id: 'cnt-6', name: 'Civic Desk 2', centerId: 'ctr-4', departmentId: 'dept-civ', staffName: 'Marcus Chen', status: 'Active' },
    ];

    const tokens = [
      // City Care Hospital - General OPD (Active User Queue Demo)
      {
        id: 'tok-103',
        tokenNumber: 'OPD-103',
        centerId: 'ctr-1',
        departmentId: 'dept-opd',
        counterId: 'cnt-1',
        customerName: 'Meera Patel',
        phone: '9811204512',
        preferredDate: today,
        status: 'Completed',
        isUserBooking: false,
        createdAt: new Date(now - 75 * 60000).toISOString(),
        updatedAt: new Date(now - 55 * 60000).toISOString(),
      },
      {
        id: 'tok-104',
        tokenNumber: 'OPD-104',
        centerId: 'ctr-1',
        departmentId: 'dept-opd',
        counterId: 'cnt-1',
        customerName: 'Karan Malhotra',
        phone: '9822310098',
        preferredDate: today,
        status: 'Completed',
        isUserBooking: false,
        createdAt: new Date(now - 60 * 60000).toISOString(),
        updatedAt: new Date(now - 38 * 60000).toISOString(),
      },
      {
        id: 'tok-105',
        tokenNumber: 'OPD-105',
        centerId: 'ctr-1',
        departmentId: 'dept-opd',
        counterId: 'cnt-1',
        customerName: 'Neha Joshi',
        phone: '9833091234',
        preferredDate: today,
        status: 'Serving',
        isUserBooking: false,
        createdAt: new Date(now - 45 * 60000).toISOString(),
        updatedAt: new Date(now - 4 * 60000).toISOString(),
      },
      {
        id: 'tok-106',
        tokenNumber: 'OPD-106',
        centerId: 'ctr-1',
        departmentId: 'dept-opd',
        counterId: 'cnt-1',
        customerName: 'Rahul Deshmukh',
        phone: '9844123456',
        preferredDate: today,
        status: 'Waiting',
        isUserBooking: false,
        createdAt: new Date(now - 32 * 60000).toISOString(),
        updatedAt: new Date(now - 32 * 60000).toISOString(),
      },
      {
        id: 'tok-107',
        tokenNumber: 'OPD-107',
        centerId: 'ctr-1',
        departmentId: 'dept-opd',
        counterId: 'cnt-1',
        customerName: 'Ananya Iyer',
        phone: '9855678901',
        preferredDate: today,
        status: 'Waiting',
        isUserBooking: false,
        createdAt: new Date(now - 24 * 60000).toISOString(),
        updatedAt: new Date(now - 24 * 60000).toISOString(),
      },
      {
        id: 'tok-108',
        tokenNumber: 'OPD-108',
        centerId: 'ctr-1',
        departmentId: 'dept-opd',
        counterId: 'cnt-1',
        customerName: 'Aarav Sharma',
        phone: '9876543210',
        preferredDate: today,
        status: 'Waiting',
        isUserBooking: true,
        createdAt: new Date(now - 18 * 60000).toISOString(),
        updatedAt: new Date(now - 18 * 60000).toISOString(),
      },
      {
        id: 'tok-109',
        tokenNumber: 'OPD-109',
        centerId: 'ctr-1',
        departmentId: 'dept-opd',
        counterId: 'cnt-1',
        customerName: 'Devansh Kulkarni',
        phone: '9866781122',
        preferredDate: today,
        status: 'Waiting',
        isUserBooking: false,
        createdAt: new Date(now - 11 * 60000).toISOString(),
        updatedAt: new Date(now - 11 * 60000).toISOString(),
      },

      // City Care Hospital - Diagnostics Lab
      {
        id: 'tok-201',
        tokenNumber: 'LAB-201',
        centerId: 'ctr-1',
        departmentId: 'dept-lab',
        counterId: 'cnt-2',
        customerName: 'Sonal Mehta',
        phone: '9871102233',
        preferredDate: today,
        status: 'Completed',
        isUserBooking: false,
        createdAt: new Date(now - 50 * 60000).toISOString(),
        updatedAt: new Date(now - 28 * 60000).toISOString(),
      },
      {
        id: 'tok-202',
        tokenNumber: 'LAB-202',
        centerId: 'ctr-1',
        departmentId: 'dept-lab',
        counterId: 'cnt-2',
        customerName: 'Kabir Bedi',
        phone: '9872203344',
        preferredDate: today,
        status: 'Serving',
        isUserBooking: false,
        createdAt: new Date(now - 29 * 60000).toISOString(),
        updatedAt: new Date(now - 3 * 60000).toISOString(),
      },
      {
        id: 'tok-203',
        tokenNumber: 'LAB-203',
        centerId: 'ctr-1',
        departmentId: 'dept-lab',
        counterId: 'cnt-2',
        customerName: 'Pooja Rao',
        phone: '9873304455',
        preferredDate: today,
        status: 'Waiting',
        isUserBooking: false,
        createdAt: new Date(now - 14 * 60000).toISOString(),
        updatedAt: new Date(now - 14 * 60000).toISOString(),
      },

      // Metro National Bank
      {
        id: 'tok-302',
        tokenNumber: 'ACC-302',
        centerId: 'ctr-2',
        departmentId: 'dept-acc',
        counterId: 'cnt-3',
        customerName: 'Daniel Foster',
        phone: '9881122334',
        preferredDate: today,
        status: 'Serving',
        isUserBooking: false,
        createdAt: new Date(now - 22 * 60000).toISOString(),
        updatedAt: new Date(now - 5 * 60000).toISOString(),
      },
      {
        id: 'tok-303',
        tokenNumber: 'ACC-303',
        centerId: 'ctr-2',
        departmentId: 'dept-acc',
        counterId: 'cnt-3',
        customerName: 'Sophia Martinez',
        phone: '9882233445',
        preferredDate: today,
        status: 'Waiting',
        isUserBooking: false,
        createdAt: new Date(now - 12 * 60000).toISOString(),
        updatedAt: new Date(now - 12 * 60000).toISOString(),
      },

      // Apex University Student Hub
      {
        id: 'tok-402',
        tokenNumber: 'REG-402',
        centerId: 'ctr-3',
        departmentId: 'dept-reg',
        counterId: 'cnt-5',
        customerName: 'Liam O\'Connor',
        phone: '9891122330',
        preferredDate: today,
        status: 'Serving',
        isUserBooking: false,
        createdAt: new Date(now - 20 * 60000).toISOString(),
        updatedAt: new Date(now - 2 * 60000).toISOString(),
      },
      {
        id: 'tok-403',
        tokenNumber: 'REG-403',
        centerId: 'ctr-3',
        departmentId: 'dept-reg',
        counterId: 'cnt-5',
        customerName: 'Noah Kim',
        phone: '9892233441',
        preferredDate: today,
        status: 'Skipped',
        isUserBooking: false,
        createdAt: new Date(now - 35 * 60000).toISOString(),
        updatedAt: new Date(now - 16 * 60000).toISOString(),
      },

      // CivicOne Citizen Service Center
      {
        id: 'tok-501',
        tokenNumber: 'CIV-501',
        centerId: 'ctr-4',
        departmentId: 'dept-civ',
        counterId: 'cnt-6',
        customerName: 'Zara Khan',
        phone: '9819988776',
        preferredDate: today,
        status: 'Waiting',
        isUserBooking: false,
        createdAt: new Date(now - 8 * 60000).toISOString(),
        updatedAt: new Date(now - 8 * 60000).toISOString(),
      },

      // Historical tokens for User Dashboard History
      {
        id: 'tok-hist-1',
        tokenNumber: 'REG-388',
        centerId: 'ctr-3',
        departmentId: 'dept-reg',
        counterId: 'cnt-5',
        customerName: 'Aarav Sharma',
        phone: '9876543210',
        preferredDate: yesterday,
        status: 'Completed',
        isUserBooking: true,
        createdAt: new Date(now - 25 * 3600000).toISOString(),
        updatedAt: new Date(now - 24 * 3600000).toISOString(),
      },
      {
        id: 'tok-hist-2',
        tokenNumber: 'ACC-295',
        centerId: 'ctr-2',
        departmentId: 'dept-acc',
        counterId: 'cnt-3',
        customerName: 'Aarav Sharma',
        phone: '9876543210',
        preferredDate: twoDaysAgo,
        status: 'Completed',
        isUserBooking: true,
        createdAt: new Date(now - 50 * 3600000).toISOString(),
        updatedAt: new Date(now - 49 * 3600000).toISOString(),
      },
      {
        id: 'tok-hist-3',
        tokenNumber: 'CIV-419',
        centerId: 'ctr-4',
        departmentId: 'dept-civ',
        counterId: 'cnt-6',
        customerName: 'Aarav Sharma',
        phone: '9876543210',
        preferredDate: twoDaysAgo,
        status: 'Cancelled',
        isUserBooking: true,
        createdAt: new Date(now - 54 * 3600000).toISOString(),
        updatedAt: new Date(now - 53 * 3600000).toISOString(),
      },
    ];

    const notifications = [
      {
        id: 'not-1',
        title: 'Queue Moving Fast',
        message: 'OPD-105 is currently being served at Counter 1. 3 turns ahead of your token OPD-108.',
        time: '2 min ago',
        read: false,
      },
      {
        id: 'not-2',
        title: 'Token Confirmed',
        message: 'Digital token OPD-108 booked for City Care General Hospital.',
        time: '18 min ago',
        read: false,
      },
      {
        id: 'not-3',
        title: 'Transcript Picked Up',
        message: 'Token REG-388 was marked Completed at Registrar Window 4.',
        time: 'Yesterday',
        read: true,
      },
    ];

    const weeklyBaseline = [
      { day: 'Mon', booked: 64, completed: 59 },
      { day: 'Tue', booked: 78, completed: 74 },
      { day: 'Wed', booked: 71, completed: 68 },
      { day: 'Thu', booked: 86, completed: 81 },
      { day: 'Fri', booked: 92, completed: 87 },
      { day: 'Sat', booked: 54, completed: 50 },
    ];

    return {
      currentUser: {
        name: 'Aarav Sharma',
        phone: '9876543210',
        role: 'Citizen / Visitor',
      },
      activeTokenId: 'tok-108',
      centers,
      departments,
      counters,
      tokens,
      notifications,
      weeklyBaseline,
    };
  }

  /**
   * Loads state from localStorage, falling back to default seed if empty/corrupt.
   */
  function getState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = createDefaultState();
        saveState(initial, false);
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tokens) || !Array.isArray(parsed.centers)) {
        const initial = createDefaultState();
        saveState(initial, false);
        return initial;
      }
      return parsed;
    } catch (err) {
      return createDefaultState();
    }
  }

  /**
   * Persists state to localStorage and triggers an internal update event.
   */
  function saveState(state, notify = true) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (notify) {
        window.dispatchEvent(new CustomEvent('smartqueue:updated', { detail: state }));
      }
    } catch (err) {
      console.error('Failed to persist SmartQueue state:', err);
    }
  }

  /**
   * Resets all demo data back to initial seeded state.
   */
  function resetDemoData() {
    const fresh = createDefaultState();
    saveState(fresh, true);
    showToast('Demo Data Reset', 'All queues, tokens, and counters restored to default state.', 'info');
    return fresh;
  }

  /**
   * Adds a notification item to the topbar bell feed.
   */
  function pushNotification(state, title, message) {
    state.notifications = state.notifications || [];
    state.notifications.unshift({
      id: `not-${Date.now()}`,
      title,
      message,
      time: 'Just now',
      read: false,
    });
    if (state.notifications.length > 12) {
      state.notifications = state.notifications.slice(0, 12);
    }
  }

  /**
   * Generates a unique token number like OPD-110 for a given department code.
   */
  function generateUniqueTokenNumber(state, deptCode) {
    const prefix = (deptCode || 'SQ').toUpperCase();
    const existingNums = state.tokens
      .filter((t) => t.tokenNumber.startsWith(`${prefix}-`))
      .map((t) => parseInt(t.tokenNumber.split('-')[1], 10))
      .filter((n) => !Number.isNaN(n));

    let nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 101;
    while (state.tokens.some((t) => t.tokenNumber === `${prefix}-${nextNum}`)) {
      nextNum += 1;
    }
    return `${prefix}-${nextNum}`;
  }

  /**
   * Computes live queue metrics for any given token object.
   */
  function computeQueueMetrics(state, token) {
    if (!token) {
      return {
        currentlyServingToken: null,
        peopleAhead: 0,
        position: 0,
        estimatedWait: 0,
        progress: 0,
        counterName: 'Unassigned',
        lineup: [],
      };
    }

    const dept = state.departments.find((d) => d.id === token.departmentId);
    const avgMin = dept ? Number(dept.avgMinutes) || 6 : 6;

    // Group queue by department and same preferred date
    const sameDeptTokens = state.tokens
      .filter((t) => t.departmentId === token.departmentId && t.preferredDate === token.preferredDate)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const servingToken = sameDeptTokens.find((t) => t.status === 'Serving') || null;
    const waitingTokens = sameDeptTokens.filter((t) => t.status === 'Waiting');
    const completedTokens = sameDeptTokens.filter((t) => t.status === 'Completed');

    const assignedCounter =
      state.counters.find((c) => c.id === token.counterId) ||
      state.counters.find((c) => c.departmentId === token.departmentId && c.status === 'Active') ||
      state.counters.find((c) => c.departmentId === token.departmentId);

    const counterName = assignedCounter ? assignedCounter.name : 'Counter 1';

    let peopleAhead = 0;
    let position = 0;
    let estimatedWait = 0;
    let progress = 0;
    let stepIndex = 1; // 1=Booked, 2=Waiting, 3=Almost Ready, 4=Now Serving

    if (token.status === 'Serving') {
      peopleAhead = 0;
      position = 1;
      estimatedWait = 0;
      progress = 95;
      stepIndex = 4;
    } else if (token.status === 'Completed') {
      peopleAhead = 0;
      position = 0;
      estimatedWait = 0;
      progress = 100;
      stepIndex = 4;
    } else if (token.status === 'Waiting') {
      const waitIdx = waitingTokens.findIndex((t) => t.id === token.id);
      const aheadInWait = waitIdx >= 0 ? waitIdx : 0;
      peopleAhead = aheadInWait + (servingToken ? 1 : 0);
      position = peopleAhead + 1;
      estimatedWait = peopleAhead === 0 ? Math.max(2, Math.round(avgMin / 2)) : peopleAhead * avgMin;

      const finishedUnits = completedTokens.length + 1;
      const totalUnits = finishedUnits + peopleAhead;
      progress = peopleAhead === 0 ? 85 : Math.min(82, Math.max(18, Math.round((finishedUnits / totalUnits) * 100)));
      stepIndex = peopleAhead <= 1 ? 3 : 2;
    } else {
      // Skipped or Cancelled
      peopleAhead = 0;
      position = 0;
      estimatedWait = 0;
      progress = 0;
      stepIndex = 1;
    }

    // Build visible lineup (currently serving + waiting tokens in this dept)
    const lineup = [];
    if (servingToken) lineup.push(servingToken);
    waitingTokens.forEach((wt) => lineup.push(wt));

    return {
      currentlyServingToken: servingToken,
      peopleAhead,
      position,
      estimatedWait,
      progress,
      stepIndex,
      counterName,
      lineup,
      avgMinutes: avgMin,
      totalWaitingInDept: waitingTokens.length,
    };
  }

  /**
   * Returns user's active token (Serving first, else earliest Waiting) or null.
   */
  function getActiveUserToken(state) {
    const userTokens = state.tokens.filter((t) => t.isUserBooking);
    if (state.activeTokenId) {
      const explicit = state.tokens.find((t) => t.id === state.activeTokenId);
      if (explicit && (explicit.status === 'Waiting' || explicit.status === 'Serving')) {
        return explicit;
      }
    }
    return (
      userTokens.find((t) => t.status === 'Serving') ||
      userTokens.find((t) => t.status === 'Waiting') ||
      null
    );
  }

  /**
   * Returns readable Center & Department lookup helpers.
   */
  function getCenterName(state, centerId) {
    const c = state.centers.find((item) => item.id === centerId);
    return c ? c.name : 'Service Center';
  }

  function getDepartmentName(state, deptId) {
    const d = state.departments.find((item) => item.id === deptId);
    return d ? d.name : 'General Service';
  }

  function getCounterName(state, counterId, deptId) {
    const cnt =
      state.counters.find((c) => c.id === counterId) ||
      state.counters.find((c) => c.departmentId === deptId);
    return cnt ? cnt.name : 'Counter 1';
  }

  /**
   * Generates HTML for semantic status badges.
   */
  function getStatusBadgeHTML(status) {
    const map = {
      Waiting: { cls: 'sq-badge-waiting', icon: 'fa-clock' },
      Serving: { cls: 'sq-badge-serving', icon: 'fa-circle-play' },
      Completed: { cls: 'sq-badge-completed', icon: 'fa-circle-check' },
      Skipped: { cls: 'sq-badge-skipped', icon: 'fa-forward' },
      Cancelled: { cls: 'sq-badge-cancelled', icon: 'fa-circle-xmark' },
      Active: { cls: 'sq-badge-active', icon: 'fa-check' },
      Paused: { cls: 'sq-badge-paused', icon: 'fa-pause' },
      Inactive: { cls: 'sq-badge-inactive', icon: 'fa-ban' },
    };
    const cfg = map[status] || { cls: 'sq-badge-completed', icon: 'fa-circle-info' };
    const pulse = status === 'Serving' ? '<span class="pulse-dot" style="width:6px;height:6px;"></span>' : `<i class="fa-solid ${cfg.icon}"></i>`;
    return `<span class="sq-badge ${cfg.cls}">${pulse} ${escapeHtml(status)}</span>`;
  }

  /**
   * Toast Notification System
   */
  function ensureToastContainer() {
    let container = document.getElementById('sq-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sq-toast-container';
      container.className = 'sq-toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(title, message, type = 'info') {
    const container = ensureToastContainer();
    const icons = {
      success: { icon: 'fa-circle-check', color: 'var(--sq-success)' },
      warning: { icon: 'fa-triangle-exclamation', color: 'var(--sq-warning)' },
      error: { icon: 'fa-circle-exclamation', color: 'var(--sq-danger)' },
      info: { icon: 'fa-circle-info', color: 'var(--sq-primary)' },
    };
    const cfg = icons[type] || icons.info;

    const toast = document.createElement('div');
    toast.className = `sq-toast toast-${type}`;
    toast.innerHTML = `
      <div style="color:${cfg.color}; font-size:1.15rem; padding-top:2px;">
        <i class="fa-solid ${cfg.icon}"></i>
      </div>
      <div style="flex:1; min-width:0;">
        <div style="font-weight:700; font-size:0.88rem; color:var(--sq-navy);">${escapeHtml(title)}</div>
        <div style="font-size:0.81rem; color:var(--sq-text-secondary); margin-top:2px;">${escapeHtml(message)}</div>
      </div>
      <button type="button" class="btn-icon" style="width:26px;height:26px;border:none;" aria-label="Close notification">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    const removeToast = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(18px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    };
    closeBtn.addEventListener('click', removeToast);

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.isConnected) removeToast();
    }, 4500);
  }

  /**
   * Reusable Modal Dialog Helper (Zero dependency on external Bootstrap JS)
   */
  function ensureModalOverlay() {
    let overlay = document.getElementById('sq-global-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sq-global-modal';
      overlay.className = 'sq-modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <div class="sq-modal-dialog">
          <div class="sq-modal-header">
            <h5 class="mb-0 fw-bold" id="sq-modal-title">Dialog</h5>
            <button type="button" class="btn-icon" id="sq-modal-close-x" aria-label="Close modal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="sq-modal-body" id="sq-modal-body"></div>
          <div class="sq-modal-footer" id="sq-modal-footer"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
      overlay.querySelector('#sq-modal-close-x').addEventListener('click', closeModal);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
          closeModal();
        }
      });
    }
    return overlay;
  }

  function closeModal() {
    const overlay = document.getElementById('sq-global-modal');
    if (overlay) overlay.classList.remove('open');
  }

  /**
   * Opens a custom confirmation or info/form modal.
   * @param {Object} opts - { title, bodyHtml, confirmText, cancelText, confirmClass, onConfirm }
   */
  function openModal({
    title = 'Confirm Action',
    bodyHtml = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmClass = 'btn-sq-primary',
    hideCancel = false,
    onConfirm = null,
  }) {
    const overlay = ensureModalOverlay();
    overlay.querySelector('#sq-modal-title').textContent = title;
    overlay.querySelector('#sq-modal-body').innerHTML = bodyHtml;

    const footer = overlay.querySelector('#sq-modal-footer');
    footer.innerHTML = '';

    if (!hideCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn-sq-outline';
      cancelBtn.textContent = cancelText;
      cancelBtn.addEventListener('click', closeModal);
      footer.appendChild(cancelBtn);
    }

    if (confirmText) {
      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = confirmClass;
      confirmBtn.textContent = confirmText;
      confirmBtn.addEventListener('click', () => {
        if (typeof onConfirm === 'function') {
          const shouldClose = onConfirm(overlay);
          if (shouldClose !== false) closeModal();
        } else {
          closeModal();
        }
      });
      footer.appendChild(confirmBtn);
    }

    overlay.classList.add('open');
    return overlay;
  }

  /**
   * Initializes shared App Shell interactions (Sidebar, Notifications, Reset Demo, Cross-Tab sync).
   */
  function initAppShell() {
    // 1. Mobile Sidebar Drawer
    const sidebar = document.getElementById('sq-sidebar');
    const backdrop = document.getElementById('sq-sidebar-backdrop');
    const menuBtn = document.getElementById('sq-mobile-menu-btn');
    const closeSidebarBtn = document.getElementById('sq-sidebar-close');

    function toggleSidebar(open) {
      if (!sidebar || !backdrop) return;
      sidebar.classList.toggle('open', open);
      backdrop.classList.toggle('show', open);
    }

    if (menuBtn) menuBtn.addEventListener('click', () => toggleSidebar(true));
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
    if (backdrop) backdrop.addEventListener('click', () => toggleSidebar(false));

    // 2. Landing Page Mobile Nav Toggle (if on index.html)
    const landingToggle = document.getElementById('landing-nav-toggle');
    const landingCollapse = document.getElementById('landing-nav-links');
    if (landingToggle && landingCollapse) {
      landingToggle.addEventListener('click', () => {
        landingCollapse.classList.toggle('d-none');
        landingCollapse.classList.toggle('d-flex');
      });
    }

    // 3. Notification Bell Dropdown
    const notifBtn = document.getElementById('sq-notif-btn');
    const notifDropdown = document.getElementById('sq-notif-dropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !notifDropdown.classList.contains('open');
        notifDropdown.classList.toggle('open', willOpen);
        if (willOpen) {
          const st = getState();
          st.notifications.forEach((n) => {
            n.read = true;
          });
          saveState(st, false);
          renderNotifications();
        }
      });

      document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
          notifDropdown.classList.remove('open');
        }
      });
    }

    // 4. Reset Demo Data Buttons
    document.querySelectorAll('[data-action="reset-demo"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openModal({
          title: 'Reset Demo Data?',
          bodyHtml: `
            <p class="mb-2 text-secondary">This will restore all sample service centers, counters, and live queue tokens back to their clean initial hackathon demo state.</p>
            <div class="p-3 rounded-3" style="background: var(--sq-primary-light); font-size:0.85rem; color: var(--sq-primary-dark);">
              <i class="fa-solid fa-circle-info me-1"></i> Active demo token <strong>OPD-108</strong> will be restored to the live waiting queue.
            </div>
          `,
          confirmText: 'Reset Now',
          confirmClass: 'btn-sq-primary',
          onConfirm: () => {
            resetDemoData();
          },
        });
      });
    });

    // 5. Render Notifications initially & on update
    renderNotifications();
    window.addEventListener('smartqueue:updated', renderNotifications);

    // 6. Real-time Cross-Tab Synchronization (e.g., Staff tab updates User Tracking tab!)
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        window.dispatchEvent(new CustomEvent('smartqueue:updated', { detail: getState() }));
        renderNotifications();
      }
    });
  }

  /**
   * Renders the notification bell count & dropdown list.
   */
  function renderNotifications() {
    const countEl = document.getElementById('sq-notif-count');
    const listEl = document.getElementById('sq-notif-list');
    if (!countEl || !listEl) return;

    const state = getState();
    const unreadCount = (state.notifications || []).filter((n) => !n.read).length;

    if (unreadCount > 0) {
      countEl.textContent = unreadCount;
      countEl.style.display = 'inline-flex';
    } else {
      countEl.style.display = 'none';
    }

    if (!state.notifications || state.notifications.length === 0) {
      listEl.innerHTML = `<div class="p-3 text-center text-muted small">No notifications yet.</div>`;
      return;
    }

    listEl.innerHTML = state.notifications
      .slice(0, 5)
      .map(
        (n) => `
      <div class="p-3 border-bottom" style="border-color: var(--sq-surface-subtle) !important;">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong style="font-size:0.82rem; color:var(--sq-navy);">${escapeHtml(n.title)}</strong>
          <span style="font-size:0.72rem; color:var(--sq-muted);">${escapeHtml(n.time)}</span>
        </div>
        <div style="font-size:0.79rem; color:var(--sq-text-secondary);">${escapeHtml(n.message)}</div>
      </div>
    `
      )
      .join('');
  }

  // Initialize shell once DOM is ready
  document.addEventListener('DOMContentLoaded', initAppShell);

  // Expose public SmartQueue API
  window.SmartQueue = {
    STORAGE_KEY,
    getState,
    saveState,
    resetDemoData,
    pushNotification,
    generateUniqueTokenNumber,
    computeQueueMetrics,
    getActiveUserToken,
    getCenterName,
    getDepartmentName,
    getCounterName,
    getStatusBadgeHTML,
    getRelativeDate,
    formatDisplayDate,
    formatTime,
    escapeHtml,
    showToast,
    openModal,
    closeModal,
  };
})(window);
