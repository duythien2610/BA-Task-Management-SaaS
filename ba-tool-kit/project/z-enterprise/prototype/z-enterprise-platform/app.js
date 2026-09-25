/**
 * Z Enterprise Management Platform — Admin Console Logic
 * 
 * Thống nhất chuẩn nghiệp vụ & UI/UX theo Clarification Harness (D-013 đến D-020):
 * 1. 1 Zalo Enterprise Account = 1 Quota.
 * 2. Tổng Quota = Đang sử dụng + Chưa sử dụng.
 * 3. Đang sử dụng = Đang hoạt động + Tạm khóa.
 * 4. Đã loại bỏ hoàn toàn 'Chờ kích hoạt' (Pending Activation). Cấp là Active ngay.
 * 5. Cấp Account: Ưu tiên gợi ý tái cấp Account đã thu hồi có leads trước để bảo toàn liên lạc.
 * 6. Bàn giao an toàn: Bắt buộc Mở khóa trước khi Bàn giao. Người cũ thành 'Đã bàn giao'.
 * 7. 3 Màn hình: Tổng quan, Quota (Nhân viên & Tài khoản), Nhật ký audit.
 * 8. Side Drawer trượt từ cạnh phải xem chi tiết và thao tác nhanh.
 * 9. Thuần Việt doanh nghiệp, loại bỏ hoàn toàn từ 'hạn ngạch'.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'z_enterprise_clean_v8_3_state';

  // =========================================================================
  // 1. DỮ LIỆU BAN ĐẦU & STATE CHUẨN HÓA
  // =========================================================================
  const INITIAL_STATE = {
    currentPersona: 'super_admin', // 'super_admin' | 'branch_admin'
    activeView: 'overview',        // 'overview' | 'quota' | 'audit_log'

    // Bộ lọc màn hình Tổng quan
    overviewFilters: {
      search: '',
      region: 'ALL'
    },

    // Bộ lọc màn hình Phân bổ Quota (Unified Table + Advanced Filters)
    allocationFilters: {
      search: '',
      region: 'ALL',              // 'ALL' | 'South' | 'Central' | 'North'
      utilizationStatus: 'ALL'    // 'ALL' | 'DANGER' (>=90%) | 'WARN' (80-89%) | 'GOOD' (<80%) | 'HIGH_FREE' (>=10)
    },

    // Bộ lọc màn hình Quota & Tài khoản
    quotaFilters: {
      search: '',
      region: 'ALL',
      branch: 'ALL',
      activeTab: 'ALL', // 'ALL' | 'UNASSIGNED_POOL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'ATTENTION'
      advancedOpen: false,
      advAccountStatus: 'ALL', // 'ALL' | 'Active' | 'Pending' | 'Suspended' | 'Unassigned'
      advAttentionType: 'ALL'  // 'ALL' | 'OVERDUE' | 'TERMINATED' | 'INACTIVE30'
    },

    // Bộ lọc màn hình Nhật ký audit
    auditFilters: {
      search: ''
    },

    // ID nhân sự/account đang mở Side Drawer
    selectedDrawerId: null,

    // Lựa chọn thao tác hàng loạt (Bulk actions)
    selectedBulkIds: [],

    // Phân trang danh sách Quota
    quotaPagination: {
      page: 1,
      pageSize: 10
    },

    // Cây tổ chức doanh nghiệp (Tổng hợp đồng: 1,200 Quota; Đã cấp chi nhánh: 1,100; Quỹ dự phòng: 100)
    orgTree: {
      totalCompanyQuota: 1200,
      regions: [
        {
          id: 'South',
          name: 'Miền Nam',
          branches: [
            { id: 'HCM-01', name: 'Hồ Chí Minh 01', totalQuota: 150, baseActive: 130, basePending: 4, baseSuspended: 4, baseAttention: 3 },
            { id: 'HCM-02', name: 'Hồ Chí Minh 02', totalQuota: 120, baseActive: 87, basePending: 1, baseSuspended: 6, baseAttention: 1 },
            { id: 'DNG-01', name: 'Đồng Nai 01', totalQuota: 90, baseActive: 65, basePending: 1, baseSuspended: 2, baseAttention: 2 },
            { id: 'OTHER-SOUTH', name: 'Các chi nhánh Miền Nam khác', totalQuota: 220, baseActive: 206, basePending: 2, baseSuspended: 10, baseAttention: 4 }
          ]
        },
        {
          id: 'Central',
          name: 'Miền Trung',
          branches: [
            { id: 'DAD-01', name: 'Đà Nẵng 01', totalQuota: 80, baseActive: 58, basePending: 1, baseSuspended: 2, baseAttention: 2 },
            { id: 'HUE-01', name: 'Huế 01', totalQuota: 60, baseActive: 46, basePending: 1, baseSuspended: 1, baseAttention: 1 },
            { id: 'OTHER-CENTRAL', name: 'Các chi nhánh Miền Trung khác', totalQuota: 90, baseActive: 67, basePending: 1, baseSuspended: 2, baseAttention: 1 }
          ]
        },
        {
          id: 'North',
          name: 'Miền Bắc',
          branches: [
            { id: 'HAN-01', name: 'Hà Nội 01', totalQuota: 160, baseActive: 140, basePending: 3, baseSuspended: 8, baseAttention: 5 },
            { id: 'HPG-01', name: 'Hải Phòng 01', totalQuota: 70, baseActive: 61, basePending: 1, baseSuspended: 2, baseAttention: 1 },
            { id: 'OTHER-NORTH', name: 'Các chi nhánh Miền Bắc khác', totalQuota: 60, baseActive: 52, basePending: 1, baseSuspended: 1, baseAttention: 1 }
          ]
        }
      ]
    },

    // Kho tài khoản đã thu hồi (Bảo tồn Leads khách hàng để ưu tiên tái cấp)
    revokedAccounts: [
      {
        accountId: 'ZENT-001089',
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        revokedAt: '18/09/2026',
        previousOwnerName: 'Nguyễn Thành Nam',
        previousOwnerEmail: 'namnt@fpt.com.vn',
        leadCount: 48,
        note: 'Có 48 leads khách hàng SME đang trao đổi, cần ưu tiên tái cấp'
      },
      {
        accountId: 'ZENT-001052',
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        revokedAt: '15/09/2026',
        previousOwnerName: 'Lê Quang Khải',
        previousOwnerEmail: 'khailq@fpt.com.vn',
        leadCount: 72,
        note: 'Có 72 khách hàng Internet Doanh nghiệp cần tiếp quản gấp'
      },
      {
        accountId: 'ZENT-002104',
        branchId: 'HAN-01',
        branchName: 'Hà Nội 01',
        region: 'North',
        revokedAt: '19/09/2026',
        previousOwnerName: 'Vũ Thị Lan',
        previousOwnerEmail: 'lanvt@fpt.com.vn',
        leadCount: 35,
        note: 'Có 35 leads dự án Camera Cloud đang chờ tái cấp'
      }
    ],

    // Danh sách nhân sự đại diện đầy đủ 3 miền và phản ánh các case cảnh báo
    employees: [
      // HCM-01
      {
        id: 'EMP-00128',
        name: 'Nguyễn Văn A',
        code: 'NV1088',
        email: 'anv@fpt.com.vn',
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: 'ZENT-001293',
        zaloAssignedDate: '15/08/2026',
        accountStatus: 'Active', // 'Active' | 'Suspended' | 'Unassigned' | 'HandedOver'
        employeeStatus: 'Active', // 'Active' | 'Terminated'
        leadCount: 48,
        attentionReason: null,
        lastActiveDate: '25/09/2026'
      },
      {
        id: 'EMP-00129',
        name: 'Trần Thị B',
        code: 'NV1092',
        email: 'btt@fpt.com.vn',
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: 'ZENT-001294',
        zaloAssignedDate: '20/07/2026',
        accountStatus: 'Active',
        employeeStatus: 'Active',
        leadCount: 65,
        attentionReason: null,
        lastActiveDate: '24/09/2026'
      },
      {
        id: 'EMP-00130',
        name: 'Lê Văn C',
        code: 'NV1104',
        email: 'clv@fpt.com.vn',
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: 'ZENT-001295',
        zaloAssignedDate: '10/06/2026',
        accountStatus: 'Suspended',
        employeeStatus: 'Active',
        leadCount: 32,
        attentionReason: 'Tài khoản đang tạm khóa do vi phạm chính sách giao tiếp',
        lastActiveDate: '14/09/2026'
      },
      {
        id: 'EMP-00131',
        name: 'Phạm Văn D',
        code: 'NV1120',
        email: 'dpv@fpt.com.vn',
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: 'ZENT-001296',
        zaloAssignedDate: '01/05/2026',
        accountStatus: 'Active',
        employeeStatus: 'Terminated', // Đã nghỉ việc
        leadCount: 127,
        attentionReason: 'Nhân sự đã nghỉ việc nhưng tài khoản Zalo vẫn mở (Nguy cơ rò rỉ dữ liệu)',
        lastActiveDate: '20/09/2026'
      },
      {
        id: 'EMP-00132',
        name: 'Hoàng Quốc E',
        code: 'NV1135',
        email: 'ehq@fpt.com.vn',
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: 'ZENT-001297',
        zaloAssignedDate: '23/09/2026',
        pendingAssignedAt: '23/09/2026 09:30',
        pendingHours: 52,
        pendingOverdue: true,
        accountStatus: 'Pending',
        employeeStatus: 'Active',
        leadCount: 15,
        attentionReason: 'Chờ kích hoạt quá hạn (52h chưa đăng nhập)',
        lastActiveDate: null
      },
      {
        id: 'EMP-00133',
        name: 'Đặng Ngọc F',
        code: 'NV1142',
        email: null,
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: null,
        zaloAssignedDate: null,
        accountStatus: 'Unassigned',
        employeeStatus: 'Active',
        leadCount: 0,
        attentionReason: null,
        lastActiveDate: null
      },
      {
        id: 'EMP-00134',
        name: 'Vũ Minh K',
        code: 'NV1150',
        email: null,
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: null,
        zaloAssignedDate: null,
        accountStatus: 'Unassigned',
        employeeStatus: 'Active',
        leadCount: 0,
        attentionReason: null,
        lastActiveDate: null
      },
      {
        id: 'EMP-00135',
        name: 'Bùi Tuấn M',
        code: 'NV1160',
        email: null, // Chưa có tài khoản thì không có email
        branchId: 'HCM-01',
        branchName: 'Hồ Chí Minh 01',
        region: 'South',
        accountId: null,
        zaloAssignedDate: null,
        accountStatus: 'Unassigned',
        employeeStatus: 'Active',
        leadCount: 0,
        attentionReason: null,
        lastActiveDate: null
      },

      // HCM-02
      {
        id: 'EMP-00201',
        name: 'Đỗ Hoàng Mai',
        code: 'NV2011',
        email: 'maidh@fpt.com.vn',
        branchId: 'HCM-02',
        branchName: 'Hồ Chí Minh 02',
        region: 'South',
        accountId: 'ZENT-002011',
        zaloAssignedDate: '12/04/2026',
        accountStatus: 'Active',
        employeeStatus: 'Active',
        leadCount: 54,
        attentionReason: null,
        lastActiveDate: '24/09/2026'
      },
      {
        id: 'EMP-00202',
        name: 'Ngô Thanh Tùng',
        code: 'NV2018',
        email: 'tungnt@fpt.com.vn',
        branchId: 'HCM-02',
        branchName: 'Hồ Chí Minh 02',
        region: 'South',
        accountId: 'ZENT-002019',
        zaloAssignedDate: '01/06/2026',
        accountStatus: 'Suspended',
        employeeStatus: 'Active',
        leadCount: 22,
        attentionReason: 'Tài khoản đang tạm khóa phục vụ rà soát hợp đồng',
        lastActiveDate: '12/09/2026'
      },
      {
        id: 'EMP-00203',
        name: 'Trịnh Thị Hà',
        code: 'NV2025',
        email: 'hatt@fpt.com.vn',
        branchId: 'HCM-02',
        branchName: 'Hồ Chí Minh 02',
        region: 'South',
        accountId: null,
        zaloAssignedDate: null,
        accountStatus: 'Unassigned',
        employeeStatus: 'Active',
        leadCount: 0,
        attentionReason: null,
        lastActiveDate: null
      },

      // DAD-01 (Đà Nẵng)
      {
        id: 'EMP-00301',
        name: 'Phan Văn Hưng',
        code: 'NV3012',
        email: 'hungpv@fpt.com.vn',
        branchId: 'DAD-01',
        branchName: 'Đà Nẵng 01',
        region: 'Central',
        accountId: 'ZENT-003012',
        zaloAssignedDate: '18/03/2026',
        accountStatus: 'Active',
        employeeStatus: 'Active',
        leadCount: 88,
        attentionReason: null,
        lastActiveDate: '25/09/2026'
      },
      {
        id: 'EMP-00302',
        name: 'Dương Thị Linh',
        code: 'NV3019',
        email: 'linhdt@fpt.com.vn',
        branchId: 'DAD-01',
        branchName: 'Đà Nẵng 01',
        region: 'Central',
        accountId: 'ZENT-003019',
        zaloAssignedDate: '22/07/2026',
        accountStatus: 'Active',
        employeeStatus: 'Terminated',
        leadCount: 41,
        attentionReason: 'Nhân sự đã nghỉ việc nhưng tài khoản Zalo vẫn mở (Nguy cơ rò rỉ dữ liệu)',
        lastActiveDate: '18/09/2026'
      },
      {
        id: 'EMP-00303',
        name: 'Nguyễn Hữu Trí',
        code: 'NV3028',
        email: 'trinh@fpt.com.vn',
        branchId: 'DAD-01',
        branchName: 'Đà Nẵng 01',
        region: 'Central',
        accountId: 'ZENT-003028',
        zaloAssignedDate: '24/09/2026',
        pendingAssignedAt: '24/09/2026 08:00',
        pendingHours: 30,
        pendingOverdue: true,
        accountStatus: 'Pending',
        employeeStatus: 'Active',
        leadCount: 12,
        attentionReason: 'Chờ kích hoạt quá hạn (30h chưa đăng nhập)',
        lastActiveDate: null
      },

      // HAN-01 (Hà Nội)
      {
        id: 'EMP-00401',
        name: 'Nguyễn Trọng Đại',
        code: 'NV4011',
        email: 'daint@fpt.com.vn',
        branchId: 'HAN-01',
        branchName: 'Hà Nội 01',
        region: 'North',
        accountId: 'ZENT-004011',
        zaloAssignedDate: '05/02/2026',
        accountStatus: 'Active',
        employeeStatus: 'Active',
        leadCount: 95,
        attentionReason: null,
        lastActiveDate: '25/09/2026'
      },
      {
        id: 'EMP-00402',
        name: 'Lê Thu Hương',
        code: 'NV4018',
        email: 'huonglt@fpt.com.vn',
        branchId: 'HAN-01',
        branchName: 'Hà Nội 01',
        region: 'North',
        accountId: 'ZENT-004018',
        zaloAssignedDate: '14/05/2026',
        accountStatus: 'Active',
        employeeStatus: 'Active',
        leadCount: 12,
        attentionReason: 'Tài khoản không phát sinh hoạt động trao đổi > 30 ngày (Lãng phí Quota)',
        lastActiveDate: '15/08/2026'
      },
      {
        id: 'EMP-00403',
        name: 'Phạm Đức Long',
        code: 'NV4025',
        email: 'longpd@fpt.com.vn',
        branchId: 'HAN-01',
        branchName: 'Hà Nội 01',
        region: 'North',
        accountId: 'ZENT-004025',
        zaloAssignedDate: '10/01/2026',
        accountStatus: 'Suspended',
        employeeStatus: 'Active',
        leadCount: 18,
        attentionReason: 'Tài khoản tạm khóa theo yêu cầu phòng Pháp chế',
        lastActiveDate: '01/09/2026'
      },
      {
        id: 'EMP-00404',
        name: 'Cao Thị Nguyệt',
        code: 'NV4032',
        email: 'nguyetct@fpt.com.vn',
        branchId: 'HAN-01',
        branchName: 'Hà Nội 01',
        region: 'North',
        accountId: 'ZENT-004032',
        zaloAssignedDate: '25/09/2026',
        pendingAssignedAt: '25/09/2026 09:00',
        pendingHours: 5,
        pendingOverdue: false,
        accountStatus: 'Pending',
        employeeStatus: 'Active',
        leadCount: 0,
        attentionReason: null,
        lastActiveDate: null
      }
    ],

    // Sổ nhật ký kiểm toán hành chính chuẩn 5 trường (D-020)
    auditLogs: [
      {
        id: 'LOG-001',
        timestamp: '25/09/2026 10:45',
        actor: 'Vũ Minh Tuấn (Super Admin)',
        action: 'Tạm khóa',
        target: 'Lê Văn C (ZENT-001295)',
        branch: 'Hồ Chí Minh 01 (HCM-01)',
        impact: 'Tạm khóa tài khoản'
      },
      {
        id: 'LOG-002',
        timestamp: '24/09/2026 15:30',
        actor: 'Lê Hoàng Nam (Admin Chi nhánh)',
        action: 'Bàn giao',
        target: 'Bùi Tuấn M ➔ Nguyễn Văn A (ZENT-001293)',
        branch: 'Hồ Chí Minh 01 (HCM-01)',
        impact: 'Quota giữ nguyên (chuyển quyền sở hữu)'
      },
      {
        id: 'LOG-003',
        timestamp: '18/09/2026 09:15',
        actor: 'Lê Hoàng Nam (Admin Chi nhánh)',
        action: 'Thu hồi',
        target: 'Nguyễn Thành Nam (ZENT-001089)',
        branch: 'Hồ Chí Minh 01 (HCM-01)',
        impact: 'Chưa sử dụng +1 (Lưu 48 leads vào kho)'
      },
      {
        id: 'LOG-004',
        timestamp: '15/09/2026 14:20',
        actor: 'Vũ Minh Tuấn (Super Admin)',
        action: 'Cấp mới',
        target: 'Trần Thị B (ZENT-001294)',
        branch: 'Hồ Chí Minh 01 (HCM-01)',
        impact: 'Đang dùng +1, Chưa dùng -1'
      },
      {
        id: 'LOG-005',
        timestamp: '10/09/2026 08:30',
        actor: 'Vũ Minh Tuấn (Super Admin)',
        action: 'Mở khóa',
        target: 'Nguyễn Văn A (ZENT-001293)',
        branch: 'Hồ Chí Minh 01 (HCM-01)',
        impact: 'Quota giữ nguyên'
      }
    ]
  };

  // State runtime
    // Snapshot số lượng mẫu nhân viên ban đầu để tính delta phản ứng thời gian thực
  const INITIAL_SAMPLE_COUNTS = {
    'HCM-01': { active: 3, pending: 1, suspended: 1, attention: 3 },
    'HCM-02': { active: 1, pending: 0, suspended: 1, attention: 1 },
    'DAD-01': { active: 2, pending: 1, suspended: 0, attention: 1 },
    'HAN-01': { active: 2, pending: 1, suspended: 1, attention: 2 }
  };

  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const loaded = JSON.parse(saved);
        loaded.activeView = 'overview'; // Tab mặc định khi mở web luôn là overview
        loaded.allocationFilters = loaded.allocationFilters || {
          search: '',
          region: 'ALL',
          utilizationStatus: 'ALL'
        };
        return loaded;
      }
    } catch (e) {
      console.warn('Cannot load state, using initial');
    }
    const initial = JSON.parse(JSON.stringify(INITIAL_STATE));
    initial.activeView = 'overview';
    return initial;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Cannot save state');
    }
  }

  function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString('vi-VN');
  }

  // =========================================================================
  // 2. ENGINE TÍNH TOÁN QUOTA & THỐNG KÊ TOÀN DIỆN
  // =========================================================================

  /**
   * Tính toán số liệu Quota cho một chi nhánh cụ thể:
   * Tổng Quota = Đang dùng + Chưa dùng
   * Đang dùng = Đang hoạt động + Tạm khóa
   */
  function getBranchQuotaStats(branchId) {
    let branchConfig = null;
    let regionId = '';
    for (const r of state.orgTree.regions) {
      const b = r.branches.find(x => x.id === branchId);
      if (b) {
        branchConfig = b;
        regionId = r.id;
        break;
      }
    }
    if (!branchConfig) return null;

    const baseActive = branchConfig.baseActive || 0;
    const basePending = branchConfig.basePending || 0;
    const baseSuspended = branchConfig.baseSuspended || 0;
    const baseAttention = branchConfig.baseAttention || 0;

    const branchEmps = state.employees.filter(e => e.branchId === branchId);
    const currentActive = branchEmps.filter(e => e.accountStatus === 'Active').length;
    const currentPending = branchEmps.filter(e => e.accountStatus === 'Pending').length;
    const currentSuspended = branchEmps.filter(e => e.accountStatus === 'Suspended').length;
    const currentAttention = branchEmps.filter(e => e.attentionReason !== null || e.employeeStatus === 'Terminated').length;

    const initS = INITIAL_SAMPLE_COUNTS[branchId] || { active: currentActive, pending: currentPending, suspended: currentSuspended, attention: currentAttention };
    const deltaActive = currentActive - initS.active;
    const deltaPending = currentPending - initS.pending;
    const deltaSuspended = currentSuspended - initS.suspended;
    const deltaAttention = currentAttention - initS.attention;

    const active = Math.max(0, baseActive + deltaActive);
    const pending = Math.max(0, basePending + deltaPending);
    const suspended = Math.max(0, baseSuspended + deltaSuspended);
    const attention = Math.max(0, baseAttention + deltaAttention);

    const inUse = active + pending + suspended;
    const totalQuota = branchConfig.totalQuota || 0;
    const available = Math.max(0, totalQuota - inUse);
    const utilization = totalQuota > 0 ? ((inUse / totalQuota) * 100).toFixed(1) : 0;

    return {
      branchId,
      branchName: branchConfig.name,
      regionId,
      totalQuota,
      inUse,
      available,
      active,
      pending,
      suspended,
      attention,
      utilization: parseFloat(utilization)
    };
  }

  function getSystemSummary() {
    let totalQuota = 0;
    let inUse = 0;
    let available = 0;
    let suspended = 0;
    let attention = 0;
    let active = 0;
    let pending = 0;

    if (state.currentPersona === 'branch_admin') {
      const stats = getBranchQuotaStats('HCM-01');
      return {
        scopeName: 'Chi nhánh Hồ Chí Minh 01 (HCM-01)',
        totalQuota: stats.totalQuota,
        inUse: stats.inUse,
        available: stats.available,
        active: stats.active,
        pending: stats.pending,
        suspended: stats.suspended,
        attention: stats.attention,
        utilization: stats.utilization
      };
    }

    for (const r of state.orgTree.regions) {
      for (const b of r.branches) {
        const stats = getBranchQuotaStats(b.id);
        totalQuota += stats.totalQuota;
        inUse += stats.inUse;
        available += stats.available;
        active += stats.active;
        pending += stats.pending;
        suspended += stats.suspended;
        attention += stats.attention;
      }
    }

    const companyReserve = Math.max(0, state.orgTree.totalCompanyQuota - totalQuota);
    const utilization = totalQuota > 0 ? ((inUse / totalQuota) * 100).toFixed(1) : 0;

    return {
      scopeName: 'Toàn công ty (3 Vùng)',
      totalCompanyQuota: state.orgTree.totalCompanyQuota,
      totalAllocated: totalQuota,
      companyReserve,
      totalQuota,
      inUse,
      available,
      active,
      pending,
      suspended,
      attention,
      utilization: parseFloat(utilization)
    };
  }

  // =========================================================================
  // 3. MAIN RENDER CONTROLLER
  // =========================================================================

  function renderApp() {
    updateSidebarNav();
    updateHeaderScope();

    const container = document.getElementById('page-container');
    if (!container) return;

    if (state.activeView === 'overview') {
      renderOverviewView(container);
    } else if (state.activeView === 'quota' || state.activeView === 'employees_accounts') {
      renderQuotaView(container);
    } else if (state.activeView === 'quota_allocation') {
      renderQuotaAllocationView(container);
    } else if (state.activeView === 'audit_log') {
      renderAuditLogView(container);
    }

    renderSideDrawer();
  }

  function updateSidebarNav() {
    document.querySelectorAll('.sidebar-nav .nav-link, .sidebar-secondary .nav-link').forEach(link => {
      const view = link.getAttribute('data-view');
      const isQuotaActive = (state.activeView === 'quota' || state.activeView === 'employees_accounts');
      const isQuotaLink = (view === 'quota' || view === 'employees_accounts');

      if (view === state.activeView || (isQuotaActive && isQuotaLink)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const attentionBadge = document.getElementById('sidebar-attention-badge');
    if (attentionBadge) {
      const summary = getSystemSummary();
      if (summary.attention > 0) {
        attentionBadge.textContent = summary.attention;
        attentionBadge.style.display = 'inline-block';
      } else {
        attentionBadge.style.display = 'none';
      }
    }

    const roleBadge = document.getElementById('user-role-badge');
    const displayName = document.getElementById('user-display-name');
    const avatar = document.getElementById('user-avatar-circle');

    if (state.currentPersona === 'super_admin') {
      if (roleBadge) roleBadge.textContent = 'Super Admin';
      if (displayName) displayName.textContent = 'Vũ Minh Tuấn';
      if (avatar) avatar.textContent = 'VT';
    } else {
      if (roleBadge) roleBadge.textContent = 'Admin Chi nhánh (HCM-01)';
      if (displayName) displayName.textContent = 'Lê Hoàng Nam';
      if (avatar) avatar.textContent = 'LN';
    }
  }

  function updateHeaderScope() {
    const scopeTag = document.getElementById('top-scope-tag');
    if (scopeTag) {
      if (state.currentPersona === 'super_admin') {
        scopeTag.textContent = 'Phạm vi: Toàn công ty';
        scopeTag.className = 'role-scope-tag';
      } else {
        scopeTag.textContent = 'Phạm vi: Chi nhánh HCM-01';
        scopeTag.className = 'role-scope-tag scope-branch-locked';
      }
    }
  }

  // =========================================================================
  // 4. VIEW 1: TỔNG QUAN (QUẢN LÝ QUOTA VÙNG & CHI NHÁNH)
  // =========================================================================


  // =========================================================================
  // 4B. TRUNG TÂM CẢNH BÁO & VIỆC QUAN TRỌNG CẦN XỬ LÝ (ACTION HUB)
  // =========================================================================

  function renderOverviewActionHub(isBranchAdmin, summary) {
    const pendingOverdue = state.employees.filter(e => e.accountStatus === 'Pending' && e.pendingOverdue);
    const terminatedWithAcc = state.employees.filter(e => e.employeeStatus === 'Terminated' && (e.accountStatus === 'Active' || e.accountStatus === 'Pending' || e.accountStatus === 'Suspended'));
    
    // Tìm chi nhánh có tỷ lệ tải cao nhất (tiệm cận trần >= 88%)
    let highestUtilBranch = null;
    state.orgTree.regions.forEach(r => {
      r.branches.forEach(b => {
        const stats = getBranchQuotaStats(b.id);
        if (!highestUtilBranch || stats.utilization > highestUtilBranch.utilization) {
          highestUtilBranch = stats;
        }
      });
    });

    // Tìm chi nhánh có Quota nhàn rỗi nhiều nhất (>= 20 Quota trống) để thu hồi về quỹ
    let idleQuotaBranch = null;
    state.orgTree.regions.forEach(r => {
      r.branches.forEach(b => {
        const stats = getBranchQuotaStats(b.id);
        if (stats.available >= 20 && (!idleQuotaBranch || stats.available > idleQuotaBranch.available)) {
          idleQuotaBranch = stats;
        }
      });
    });

    let alertCount = 0;
    if (pendingOverdue.length > 0) alertCount++;
    if (terminatedWithAcc.length > 0) alertCount++;
    if (highestUtilBranch && highestUtilBranch.utilization >= 88) alertCount++;
    if (idleQuotaBranch) alertCount++;

    return `
      <section class="overview-action-hub">
        <div class="action-hub-header">
          <div class="action-hub-title-wrap">
            <div class="action-hub-icon">⚡</div>
            <div>
              <div class="action-hub-title">
                <span>Việc Quan Trọng Cần Xử Lý</span>
                <span class="action-hub-badge">${alertCount} cảnh báo</span>
              </div>
              <div class="action-hub-subtitle">
                Cảnh báo nghiệp vụ Super Admin cần nắm bắt. Nhấp trực tiếp vào bất kỳ thẻ nào để chuyển ngay tới khu vực xử lý.
              </div>
            </div>
          </div>
        </div>

        <div class="action-hub-grid">
          <!-- Cảnh báo 1: Pending quá hạn -->
          <div class="action-card-item warn-critical" data-hub-link="pending" title="Nhấp để chuyển tới danh sách tài khoản Chờ kích hoạt quá hạn">
            <div class="action-card-top">
              <span class="action-card-icon">⏳</span>
              <div class="action-card-info">
                <div class="action-card-label flex-between">
                  <span>Tài khoản Chờ kích hoạt quá hạn (>24h)</span>
                  <span class="action-card-link-badge">Xem danh sách ➔</span>
                </div>
                <div class="action-card-desc">
                  Có <strong>${pendingOverdue.length} tài khoản</strong> đã cấp nhưng nhân sự chưa kích hoạt (quá 24h-48h). Quota đang bị chiếm dụng.
                </div>
              </div>
            </div>
            <div class="action-card-actions">
              <button class="btn btn-outline btn-xs" id="btn-hub-remind-all-pending" title="Gửi nhắc nhở tự động">Nhắc nhở tất cả</button>
              <button class="btn btn-primary btn-xs" id="btn-hub-view-pending">Xem chi tiết</button>
            </div>
          </div>

          <!-- Cảnh báo 2: Nghỉ việc chưa thu hồi -->
          <div class="action-card-item warn-critical" data-hub-link="terminated" title="Nhấp để xử lý thu hồi tài khoản nhân sự nghỉ việc">
            <div class="action-card-top">
              <span class="action-card-icon">🚨</span>
              <div class="action-card-info">
                <div class="action-card-label flex-between">
                  <span>Nhân sự nghỉ việc chưa thu hồi tài khoản</span>
                  <span class="action-card-link-badge">Xử lý ngay ➔</span>
                </div>
                <div class="action-card-desc">
                  Phát hiện <strong>${terminatedWithAcc.length} nhân sự thôi việc</strong> nhưng tài khoản Zalo vẫn mở. Cần thu hồi gấp để bảo vệ khách hàng.
                </div>
              </div>
            </div>
            <div class="action-card-actions">
              <button class="btn btn-danger btn-xs" id="btn-hub-view-terminated">Xử lý thu hồi ngay</button>
            </div>
          </div>

          <!-- Cảnh báo 3: Chạm trần Quota chi nhánh -->
          <div class="action-card-item warn-medium" data-hub-link="allocation" title="Nhấp để chuyển tới màn hình Phân bổ Quota chi nhánh">
            <div class="action-card-top">
              <span class="action-card-icon">📊</span>
              <div class="action-card-info">
                <div class="action-card-label flex-between">
                  <span>Chi nhánh ${highestUtilBranch ? highestUtilBranch.branchName : 'HCM-01'} sắp hết Quota (${highestUtilBranch ? highestUtilBranch.utilization : 92}%)</span>
                  <span class="action-card-link-badge">Phân bổ thêm ➔</span>
                </div>
                <div class="action-card-desc">
                  Chi nhánh đã sử dụng <strong>${highestUtilBranch ? highestUtilBranch.inUse : 138}/${highestUtilBranch ? highestUtilBranch.totalQuota : 150} Quota</strong>. Chỉ còn trống <strong>${highestUtilBranch ? highestUtilBranch.available : 12} Quota</strong> sẵn sàng.
                </div>
              </div>
            </div>
            <div class="action-card-actions">
              <button class="btn btn-outline btn-xs" id="btn-hub-view-allocation">Phân bổ thêm Quota</button>
            </div>
          </div>

          <!-- Cảnh báo 4: Thu hồi Quota nhàn rỗi -->
          ${idleQuotaBranch ? `
            <div class="action-card-item warn-info" data-hub-link="recall" title="Nhấp để thu hồi Quota nhàn rỗi về Quỹ dự phòng công ty">
              <div class="action-card-top">
                <span class="action-card-icon">🔄</span>
                <div class="action-card-info">
                  <div class="action-card-label flex-between">
                    <span>${idleQuotaBranch.branchName} có Quota nhàn rỗi (${idleQuotaBranch.available} trống)</span>
                    <span class="action-card-link-badge">Thu hồi về quỹ ➔</span>
                  </div>
                  <div class="action-card-desc">
                    Tỷ lệ sử dụng thấp (${idleQuotaBranch.utilization}%). Có thể thu hồi 10 Quota nhàn rỗi trả về Quỹ dự phòng Super Admin.
                  </div>
                </div>
              </div>
              <div class="action-card-actions">
                <button class="btn btn-outline btn-xs btn-warn" id="btn-hub-view-recall">Thu hồi về quỹ</button>
              </div>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }

  function renderOverviewView(container) {
    const summary = getSystemSummary();
    const isBranchAdmin = state.currentPersona === 'branch_admin';

    let html = `
      <div class="view-header">
        <div class="view-title-group">
          <div class="title-with-pill">
            <h1 class="view-page-title">${isBranchAdmin ? 'Tổng quan Quota Chi nhánh' : 'Tổng quan Quota Vùng'}</h1>
            <span class="scope-pill-badge">${summary.scopeName}</span>
          </div>
          <p class="view-page-desc">
            Theo dõi phân bổ Quota Zalo Enterprise, tỷ lệ sử dụng và phát hiện kịp thời các rủi ro vận hành.
          </p>
        </div>
        <div class="view-header-actions">
          ${isBranchAdmin ? '' : `
            <select class="filter-select-sm" id="overview-region-select">
              <option value="ALL" ${state.overviewFilters.region === 'ALL' ? 'selected' : ''}>Tất cả các Vùng</option>
              <option value="South" ${state.overviewFilters.region === 'South' ? 'selected' : ''}>Miền Nam</option>
              <option value="Central" ${state.overviewFilters.region === 'Central' ? 'selected' : ''}>Miền Trung</option>
              <option value="North" ${state.overviewFilters.region === 'North' ? 'selected' : ''}>Miền Bắc</option>
            </select>
          `}
          <button class="btn btn-outline btn-sm" id="btn-refresh-overview" title="Tải lại số liệu">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <!-- Trung Tâm Cảnh Báo & Việc Cần Làm Cho Super Admin (Action Hub) -->
      ${renderOverviewActionHub(isBranchAdmin, summary)}

      <section class="kpi-grid">
        ${!isBranchAdmin ? `
          <!-- Card 1: Tổng Hợp Đồng Toàn Quốc -->
          <div class="kpi-card" data-kpi-link="quota_allocation" title="Bấm để xem Phân bổ Quota chi nhánh">
            <div class="kpi-label">Tổng Hợp Đồng Toàn Quốc</div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono">${(summary.totalCompanyQuota || 1200).toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Đã cấp: <strong>${summary.totalAllocated.toLocaleString('vi-VN')}</strong> • Quỹ: <strong>${summary.companyReserve}</strong> Quota</span>
              <span class="action-card-link-badge">Phân bổ ➔</span>
            </div>
          </div>

          <!-- Card 2: Quỹ Dự Phòng Super Admin Giữ -->
          <div class="kpi-card" data-kpi-link="quota_allocation" title="Bấm để phân bổ Quota từ Quỹ dự phòng cho các chi nhánh">
            <div class="kpi-label">Quỹ Dự Phòng Super Admin</div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono num-green">${summary.companyReserve.toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Khả dụng cấp thêm ngay</span>
              <span class="action-card-link-badge">Cấp thêm ➔</span>
            </div>
          </div>

          <!-- Card 3: Thực Tế Đang Sử Dụng -->
          <div class="kpi-card" data-kpi-link="quota_active" title="Bấm để xem danh sách tài khoản Đang hoạt động">
            <div class="kpi-label-between">
              <span class="kpi-label">Thực Tế Đang Sử Dụng</span>
              <span class="kpi-tag-pct">${summary.utilization}%</span>
            </div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono">${summary.inUse.toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-progress-bar-wrap">
              <div class="kpi-progress-fill" style="width: ${Math.min(100, summary.utilization)}%;"></div>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">${summary.active || 912} Active • ${summary.pending || 16} Pending • ${summary.suspended || 38} Khóa</span>
            </div>
          </div>

          <!-- Card 4: Quota Còn Trống Tại Chi Nhánh -->
          <div class="kpi-card" data-kpi-link="quota_unassigned" title="Bấm để xem Quota còn trống tại các chi nhánh">
            <div class="kpi-label">Còn Trống Tại Chi Nhánh</div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono text-primary">${summary.available.toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Chi nhánh tự cấp phát</span>
              <span class="action-card-link-badge">Kho Quota ➔</span>
            </div>
          </div>

          <!-- Card 5: Cảnh Báo Cần Chú Ý -->
          <div class="kpi-card ${summary.attention > 0 ? 'kpi-card-attention' : ''}" data-kpi-link="quota_attention" title="Bấm để xử lý các cảnh báo an toàn và rủi ro Quota">
            <div class="kpi-label-between">
              <span class="kpi-label">Cảnh Báo Cần Chú Ý</span>
              <span class="kpi-alert-icon">⚠</span>
            </div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono num-orange">${summary.attention.toLocaleString('vi-VN')}</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Quá hạn, nghỉ việc, chạm trần</span>
              <span class="action-card-link-badge">Xử lý ngay ➔</span>
            </div>
          </div>
        ` : `
          <!-- Branch Admin Mode -->
          <div class="kpi-card">
            <div class="kpi-label">Hạn Mức Quota Được Cấp</div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono text-primary">${summary.totalQuota.toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Chi nhánh HCM-01</span>
            </div>
          </div>

          <div class="kpi-card" data-kpi-link="quota_active">
            <div class="kpi-label-between">
              <span class="kpi-label">Đang Sử Dụng</span>
              <span class="kpi-tag-pct">${summary.utilization}%</span>
            </div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono">${summary.inUse.toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-progress-bar-wrap">
              <div class="kpi-progress-fill" style="width: ${Math.min(100, summary.utilization)}%;"></div>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">${summary.active || 0} Active • ${summary.pending || 0} Pending</span>
            </div>
          </div>

          <div class="kpi-card" data-kpi-link="quota_unassigned">
            <div class="kpi-label">Còn Trống Khả Dụng</div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono num-green">${summary.available.toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Sẵn sàng cấp cho nhân sự</span>
            </div>
          </div>

          <div class="kpi-card" data-kpi-link="quota_suspended">
            <div class="kpi-label">Tạm Khóa</div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono num-muted">${summary.suspended.toLocaleString('vi-VN')} Quota</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Chờ rà soát mở lại</span>
            </div>
          </div>

          <div class="kpi-card ${summary.attention > 0 ? 'kpi-card-attention' : ''}" data-kpi-link="quota_attention">
            <div class="kpi-label-between">
              <span class="kpi-label">Cần Chú Ý</span>
              <span class="kpi-alert-icon">⚠</span>
            </div>
            <div class="kpi-number-row">
              <span class="kpi-big-num font-mono num-orange">${summary.attention.toLocaleString('vi-VN')}</span>
            </div>
            <div class="kpi-footer-row">
              <span class="kpi-footer-sub">Yêu cầu xử lý</span>
            </div>
          </div>
        `}
      </section>
    `;

    if (isBranchAdmin) {
      html += `
        <div class="branch-overview-jump-card">
          <div class="jump-card-content">
            <h3>Quản lý Tài khoản & Nhân sự Chi nhánh HCM-01</h3>
            <p>Chi nhánh hiện có <strong>${summary.available} Quota trống</strong> sẵn sàng cấp phát. Có <strong>${summary.attention} nhân sự/account</strong> đang có cảnh báo rủi ro cần xử lý.</p>
          </div>
          <button class="btn btn-primary" id="btn-jump-to-quota">
            <span>Mở danh sách Nhân viên & Tài khoản</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      `;
    } else {
      const branchesData = [];
      for (const r of state.orgTree.regions) {
        if (state.overviewFilters.region !== 'ALL' && r.id !== state.overviewFilters.region) continue;
        for (const b of r.branches) {
          const stats = getBranchQuotaStats(b.id);
          if (state.overviewFilters.search) {
            const q = state.overviewFilters.search.toLowerCase();
            if (!stats.branchName.toLowerCase().includes(q) && !stats.branchId.toLowerCase().includes(q)) {
              continue;
            }
          }
          branchesData.push(stats);
        }
      }

      let sumTotal = 0, sumInUse = 0, sumAvailable = 0, sumSuspended = 0, sumAttention = 0;
      branchesData.forEach(item => {
        sumTotal += item.totalQuota;
        sumInUse += item.inUse;
        sumAvailable += item.available;
        sumSuspended += item.suspended;
        sumAttention += item.attention;
      });
      const avgUtil = sumTotal > 0 ? ((sumInUse / sumTotal) * 100).toFixed(1) : 0;

      html += `
        <section class="overview-table-card">
          <div class="table-card-header">
            <div class="table-card-titles">
              <h2 class="table-card-title">Phân bổ Quota theo Đơn vị</h2>
              <span class="table-card-desc">Chi tiết chỉ tiêu và thực trạng khai thác Quota trên từng chi nhánh trực thuộc</span>
            </div>
            <div class="table-card-filters">
              <div class="table-search-box">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" class="input-sm" id="overview-branch-search" 
                       placeholder="Tìm chi nhánh..." value="${escapeHtml(state.overviewFilters.search)}">
              </div>
              <button class="btn btn-outline btn-xs" id="btn-reset-overview-filters">Đặt lại</button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 100px;">VÙNG</th>
                  <th style="width: 220px;">CHI NHÁNH</th>
                  <th style="width: 110px; text-align: right;">TỔNG QUOTA</th>
                  <th style="width: 110px; text-align: right;">ĐANG DÙNG</th>
                  <th style="width: 110px; text-align: right;">CHƯA DÙNG</th>
                  <th style="width: 110px; text-align: right;">TẠM KHÓA</th>
                  <th style="width: 120px; text-align: center;">CẦN CHÚ Ý</th>
                  <th style="width: 160px;">TỶ LỆ SỬ DỤNG</th>
                  <th style="width: 120px; text-align: right;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                ${branchesData.map(b => `
                  <tr class="table-row-clickable" data-branch-jump="${b.branchId}">
                    <td><span class="region-tag">${b.regionId}</span></td>
                    <td>
                      <div class="branch-name-cell">
                        <strong>${escapeHtml(b.branchName)}</strong>
                        <span class="branch-code-badge">${b.branchId}</span>
                      </div>
                    </td>
                    <td style="text-align: right;"><strong>${b.totalQuota}</strong></td>
                    <td style="text-align: right;">${b.inUse}</td>
                    <td style="text-align: right;"><span class="num-green font-semibold">${b.available}</span></td>
                    <td style="text-align: right;"><span class="num-red">${b.suspended}</span></td>
                    <td style="text-align: center;">
                      ${b.attention > 0 ? `
                        <span class="attention-pill-badge">
                          <span class="dot-orange">●</span> ${b.attention}
                        </span>
                      ` : `<span class="text-muted">—</span>`}
                    </td>
                    <td>
                      <div class="utilization-cell">
                        <span class="util-num">${b.utilization}%</span>
                        <div class="mini-progress-track">
                          <div class="mini-progress-bar" style="width: ${Math.min(100, b.utilization)}%;"></div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align: right;">
                      <button class="btn-link-action" data-branch-jump="${b.branchId}">
                        <span>Xem danh sách</span> ➔
                      </button>
                    </td>
                  </tr>
                `).join('')}

                <tr class="table-row-total">
                  <td colspan="2"><strong>Tổng cộng (${branchesData.length} Chi nhánh)</strong></td>
                  <td style="text-align: right;"><strong>${sumTotal}</strong></td>
                  <td style="text-align: right;"><strong>${sumInUse}</strong></td>
                  <td style="text-align: right;"><strong class="num-green">${sumAvailable}</strong></td>
                  <td style="text-align: right;"><strong class="num-red">${sumSuspended}</strong></td>
                  <td style="text-align: center;"><strong class="num-orange">${sumAttention}</strong></td>
                  <td><strong>${avgUtil}% Trung bình</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-card-footer">
            <span class="footer-count-text">Hiển thị <strong>${branchesData.length}</strong> chi nhánh trên toàn hệ thống</span>
          </div>
        </section>
      `;
    }

    html += `
      <div class="callout-box">
        <div class="callout-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div class="callout-content">
          <div class="callout-title">Quy chuẩn Quản trị Quota Zalo Enterprise</div>
          <p class="callout-desc">
            Hệ thống hỗ trợ quản lý tập trung tài khoản Zalo Enterprise theo từng chi nhánh. Khi nhân sự thôi việc, quản trị viên có thể bàn giao tài khoản hoặc thu hồi về kho lưu trữ để bảo tồn danh bạ khách hàng.
          </p>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const regSelect = document.getElementById('overview-region-select');
    if (regSelect) {
      regSelect.addEventListener('change', (e) => {
        state.overviewFilters.region = e.target.value;
        saveState();
        renderApp();
      });
    }

    const searchInput = document.getElementById('overview-branch-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.overviewFilters.search = e.target.value;
        renderApp();
      });
    }

    const resetBtn = document.getElementById('btn-reset-overview-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.overviewFilters.search = '';
        state.overviewFilters.region = 'ALL';
        saveState();
        renderApp();
      });
    }

    // Hub Action Listeners trên cả Card và Buttons (Ấn vào link tới đó ngay)
    container.querySelectorAll('[data-hub-link]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('#btn-hub-remind-all-pending')) return;

        const link = card.getAttribute('data-hub-link');
        if (link === 'pending') {
          state.activeView = 'quota';
          state.quotaFilters.activeTab = 'PENDING';
          state.quotaFilters.advAttentionType = 'OVERDUE';
          saveState();
          renderApp();
          showToast('Đang hiển thị danh sách tài khoản Chờ kích hoạt quá hạn (>24h)', 'info');
        } else if (link === 'terminated') {
          state.activeView = 'quota';
          state.quotaFilters.activeTab = 'ATTENTION';
          state.quotaFilters.advAttentionType = 'TERMINATED';
          saveState();
          renderApp();
          showToast('Đang hiển thị danh sách nhân sự thôi việc cần thu hồi tài khoản', 'info');
        } else if (link === 'allocation' || link === 'recall') {
          state.activeView = 'quota_allocation';
          saveState();
          renderApp();
          showToast('Đã chuyển tới Màn hình Phân bổ Quota chi nhánh', 'info');
        }
      });
    });

    const btnHubRemindPending = document.getElementById('btn-hub-remind-all-pending');
    if (btnHubRemindPending) {
      btnHubRemindPending.addEventListener('click', (e) => {
        e.stopPropagation();
        const pendingOverdue = state.employees.filter(e => e.accountStatus === 'Pending' && e.pendingOverdue);
        if (pendingOverdue.length === 0) {
          showToast('Không có tài khoản Chờ kích hoạt nào bị quá hạn', 'info');
          return;
        }

        pendingOverdue.forEach(emp => {
          state.auditLogs.unshift({
            id: `LOG-${Date.now().toString().slice(-4)}`,
            timestamp: '25/09/2026 14:20',
            actor: getActorName(),
            action: 'Nhắc nhở kích hoạt tài khoản',
            target: `${emp.name} (${emp.accountId})`,
            branch: `${emp.branchName} (${emp.branchId})`,
            impact: `Gửi email/SMS đôn đốc kích hoạt tài khoản Zalo Enterprise (đã cấp ${emp.pendingHours || 24}h)`
          });
        });

        saveState();
        showToast(`Đã gửi thông báo nhắc nhở thành công tới ${pendingOverdue.length} nhân sự quá hạn kích hoạt`, 'success');
        renderApp();
      });
    }

    // KPI Cards Direct Link Listeners
    container.querySelectorAll('[data-kpi-link]').forEach(card => {
      card.addEventListener('click', () => {
        const link = card.getAttribute('data-kpi-link');
        if (link === 'quota_allocation') {
          state.activeView = 'quota_allocation';
        } else if (link === 'quota_active') {
          state.activeView = 'quota';
          state.quotaFilters.activeTab = 'ACTIVE';
        } else if (link === 'quota_unassigned') {
          state.activeView = 'quota';
          state.quotaFilters.activeTab = 'UNASSIGNED_POOL';
        } else if (link === 'quota_suspended') {
          state.activeView = 'quota';
          state.quotaFilters.activeTab = 'SUSPENDED';
        } else if (link === 'quota_attention') {
          state.activeView = 'quota';
          state.quotaFilters.activeTab = 'ATTENTION';
        }
        saveState();
        renderApp();
      });
    });

    const refreshBtn = document.getElementById('btn-refresh-overview');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        showToast('Đã làm mới dữ liệu Quota toàn hệ thống', 'success');
        renderApp();
      });
    }

    const jumpBtn = document.getElementById('btn-jump-to-quota');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        state.activeView = 'quota';
        saveState();
        renderApp();
      });
    }

    container.querySelectorAll('[data-branch-jump]').forEach(el => {
      el.addEventListener('click', (e) => {
        const bId = el.getAttribute('data-branch-jump');
        if (bId) {
          state.activeView = 'quota';
          state.quotaFilters.branch = bId;
          saveState();
          renderApp();
        }
      });
    });
  }

  // =========================================================================
  // 5. VIEW 2: QUOTA (QUẢN LÝ QUOTA & TÀI KHOẢN NHÂN VIÊN)
  // =========================================================================

    function renderQuotaView(container) {
    const isBranchAdmin = state.currentPersona === 'branch_admin';
    if (isBranchAdmin) {
      state.quotaFilters.branch = 'HCM-01';
      state.quotaFilters.region = 'South';
    }

    const filteredBase = state.employees.filter(e => {
      if (isBranchAdmin) return e.branchId === 'HCM-01';
      if (state.quotaFilters.region !== 'ALL' && e.region !== state.quotaFilters.region) return false;
      if (state.quotaFilters.branch !== 'ALL' && e.branchId !== state.quotaFilters.branch) return false;
      return true;
    });

    const countAll = filteredBase.length;
    const countActive = filteredBase.filter(e => e.accountStatus === 'Active').length;
    const countPending = filteredBase.filter(e => e.accountStatus === 'Pending').length;
    const countSuspended = filteredBase.filter(e => e.accountStatus === 'Suspended').length;
    const countAttention = filteredBase.filter(e => e.attentionReason !== null || e.employeeStatus === 'Terminated').length;

    const revokedInScope = state.revokedAccounts.filter(r => {
      if (isBranchAdmin) return r.branchId === 'HCM-01';
      if (state.quotaFilters.region !== 'ALL' && r.region !== state.quotaFilters.region) return false;
      if (state.quotaFilters.branch !== 'ALL' && r.branchId !== state.quotaFilters.branch) return false;
      return true;
    });
    const unassignedEmps = filteredBase.filter(e => e.accountStatus === 'Unassigned');
    const countUnassignedPool = revokedInScope.length + unassignedEmps.length;

    const finalEmployees = filteredBase.filter(e => {
      if (state.quotaFilters.activeTab === 'ACTIVE' && e.accountStatus !== 'Active') return false;
      if (state.quotaFilters.activeTab === 'PENDING' && e.accountStatus !== 'Pending') return false;
      if (state.quotaFilters.activeTab === 'SUSPENDED' && e.accountStatus !== 'Suspended') return false;
      if (state.quotaFilters.activeTab === 'ATTENTION' && !e.attentionReason && e.employeeStatus !== 'Terminated') return false;
      if (state.quotaFilters.activeTab === 'UNASSIGNED_POOL' && e.accountStatus !== 'Unassigned') return false;

      // Advanced Filters
      if (state.quotaFilters.advAccountStatus !== 'ALL' && e.accountStatus !== state.quotaFilters.advAccountStatus) return false;
      if (state.quotaFilters.advAttentionType === 'OVERDUE' && (!e.pendingOverdue || e.accountStatus !== 'Pending')) return false;
      if (state.quotaFilters.advAttentionType === 'TERMINATED' && e.employeeStatus !== 'Terminated') return false;
      if (state.quotaFilters.advAttentionType === 'INACTIVE30' && (!e.attentionReason || !e.attentionReason.includes('30 ngày'))) return false;

      if (state.quotaFilters.search) {
        const q = state.quotaFilters.search.toLowerCase();
        const matchName = e.name.toLowerCase().includes(q);
        const matchCode = e.code ? e.code.toLowerCase().includes(q) : false;
        const matchEmail = e.email ? e.email.toLowerCase().includes(q) : false;
        const matchAcc = e.accountId ? e.accountId.toLowerCase().includes(q) : false;
        if (!matchName && !matchCode && !matchEmail && !matchAcc) return false;
      }
      return true;
    });

    // Pagination Calculation
    const totalItems = finalEmployees.length;
    const pageSize = state.quotaPagination ? (state.quotaPagination.pageSize || 10) : 10;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (!state.quotaPagination) {
      state.quotaPagination = { page: 1, pageSize: 10 };
    }
    if (state.quotaPagination.page > totalPages) state.quotaPagination.page = totalPages;
    if (state.quotaPagination.page < 1) state.quotaPagination.page = 1;
    const currentPage = state.quotaPagination.page;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedEmployees = finalEmployees.slice(startIndex, startIndex + pageSize);

    // Bulk selection check
    if (!state.selectedBulkIds) state.selectedBulkIds = [];
    const pageEmpIds = paginatedEmployees.map(e => e.id);
    const allSelectedOnPage = pageEmpIds.length > 0 && pageEmpIds.every(id => state.selectedBulkIds.includes(id));

    let html = `
      <div class="view-header">
        <div class="view-title-group">
          <div class="title-with-pill">
            <h1 class="view-page-title">Quản Lý Quota & Nhân Sự</h1>
            <span class="scope-pill-badge">${isBranchAdmin ? 'Chi nhánh HCM-01' : 'Toàn hệ thống'}</span>
          </div>
          <p class="view-page-desc">
            Quản trị danh sách nhân sự, trạng thái tài khoản Zalo Enterprise, bàn giao và bảo vệ dữ liệu khách hàng.
          </p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary btn-sm" id="btn-open-assign-new">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <span>Cấp Account</span>
          </button>
        </div>
      </div>

            <div class="quota-filter-toolbar">
        <div class="toolbar-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="input-text-main" id="quota-search-input" 
                 placeholder="Tìm theo tên nhân viên, email hoặc mã tài khoản Zalo..." 
                 value="${escapeHtml(state.quotaFilters.search)}">
        </div>

        <div class="toolbar-dropdown-group">
          <div class="toolbar-dropdown-item">
            <label class="dropdown-label">Vùng:</label>
            <select class="filter-select" id="quota-region-select" ${isBranchAdmin ? 'disabled' : ''}>
              <option value="ALL" ${state.quotaFilters.region === 'ALL' ? 'selected' : ''}>Tất cả Vùng</option>
              <option value="South" ${state.quotaFilters.region === 'South' ? 'selected' : ''}>Miền Nam</option>
              <option value="Central" ${state.quotaFilters.region === 'Central' ? 'selected' : ''}>Miền Trung</option>
              <option value="North" ${state.quotaFilters.region === 'North' ? 'selected' : ''}>Miền Bắc</option>
            </select>
          </div>

          <div class="toolbar-dropdown-item">
            <label class="dropdown-label">Chi nhánh:</label>
            <select class="filter-select" id="quota-branch-select" ${isBranchAdmin ? 'disabled' : ''}>
              <option value="ALL" ${state.quotaFilters.branch === 'ALL' ? 'selected' : ''}>Tất cả Chi nhánh</option>
              ${renderBranchOptions()}
            </select>
          </div>

          <!-- Nút mở Bộ Lọc Nâng Cao -->
          <button class="btn-filter-trigger ${state.quotaFilters.advancedOpen || state.quotaFilters.advAccountStatus !== 'ALL' || state.quotaFilters.advAttentionType !== 'ALL' ? 'active' : ''}" id="btn-toggle-advanced-filters">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span>Bộ lọc nâng cao</span>
            ${(state.quotaFilters.advAccountStatus !== 'ALL' ? 1 : 0) + (state.quotaFilters.advAttentionType !== 'ALL' ? 1 : 0) > 0 ? `
              <span class="filter-badge">${(state.quotaFilters.advAccountStatus !== 'ALL' ? 1 : 0) + (state.quotaFilters.advAttentionType !== 'ALL' ? 1 : 0)}</span>
            ` : ''}
          </button>

          ${state.quotaFilters.search || state.quotaFilters.region !== 'ALL' || state.quotaFilters.branch !== 'ALL' || state.quotaFilters.advAccountStatus !== 'ALL' || state.quotaFilters.advAttentionType !== 'ALL' ? `
            <button class="btn btn-outline btn-sm" id="btn-reset-quota-filters">Xóa lọc</button>
          ` : ''}
        </div>
      </div>

      <!-- Advanced Filters Panel (Bộ lọc nâng cao) -->
      ${state.quotaFilters.advancedOpen ? `
        <div class="advanced-filters-panel" id="advanced-filters-panel">
          <div class="advanced-filters-grid">
            <div class="filter-field-group">
              <label>Trạng Thái Tài Khoản Zalo</label>
              <select class="filter-select" id="adv-filter-status">
                <option value="ALL" ${state.quotaFilters.advAccountStatus === 'ALL' ? 'selected' : ''}>Tất cả trạng thái</option>
                <option value="Active" ${state.quotaFilters.advAccountStatus === 'Active' ? 'selected' : ''}>Đang hoạt động</option>
                <option value="Pending" ${state.quotaFilters.advAccountStatus === 'Pending' ? 'selected' : ''}>Chờ kích hoạt</option>
                <option value="Suspended" ${state.quotaFilters.advAccountStatus === 'Suspended' ? 'selected' : ''}>Tạm khóa</option>
                <option value="Unassigned" ${state.quotaFilters.advAccountStatus === 'Unassigned' ? 'selected' : ''}>Chưa cấp tài khoản</option>
              </select>
            </div>

            <div class="filter-field-group">
              <label>Loại Cảnh Báo & Rủi Ro</label>
              <select class="filter-select" id="adv-filter-attention">
                <option value="ALL" ${state.quotaFilters.advAttentionType === 'ALL' ? 'selected' : ''}>Tất cả nhân sự</option>
                <option value="OVERDUE" ${state.quotaFilters.advAttentionType === 'OVERDUE' ? 'selected' : ''}>Quá hạn kích hoạt (>24h)</option>
                <option value="TERMINATED" ${state.quotaFilters.advAttentionType === 'TERMINATED' ? 'selected' : ''}>Nhân sự đã nghỉ việc (Terminated)</option>
                <option value="INACTIVE30" ${state.quotaFilters.advAttentionType === 'INACTIVE30' ? 'selected' : ''}>Không hoạt động > 30 ngày</option>
              </select>
            </div>
          </div>

          <div class="advanced-filters-footer">
            <button class="btn btn-outline btn-sm" id="btn-cancel-advanced-filters">Đóng</button>
            <button class="btn btn-primary btn-sm" id="btn-apply-advanced-filters">Áp dụng bộ lọc</button>
          </div>
        </div>
      ` : ''}

      <div class="quota-tabs-bar">
        <button class="tab-btn ${state.quotaFilters.activeTab === 'ALL' ? 'active' : ''}" data-tab="ALL">
          <span>Tất cả nhân viên</span>
          <span class="tab-btn-count">${countAll}</span>
        </button>

        <button class="tab-btn ${state.quotaFilters.activeTab === 'UNASSIGNED_POOL' ? 'active' : ''}" data-tab="UNASSIGNED_POOL">
          <span>Kho tài khoản chưa cấp</span>
          <span class="tab-btn-count">${countUnassignedPool}</span>
        </button>

        <button class="tab-btn ${state.quotaFilters.activeTab === 'ACTIVE' ? 'active' : ''}" data-tab="ACTIVE">
          <span>Đang hoạt động</span>
          <span class="tab-btn-count">${countActive}</span>
        </button>

        <button class="tab-btn ${state.quotaFilters.activeTab === 'PENDING' ? 'active' : ''}" data-tab="PENDING">
          <span>Chờ kích hoạt</span>
          <span class="tab-btn-count">${countPending}</span>
        </button>

        <button class="tab-btn ${state.quotaFilters.activeTab === 'SUSPENDED' ? 'active' : ''}" data-tab="SUSPENDED">
          <span>Tạm khóa</span>
          <span class="tab-btn-count">${countSuspended}</span>
        </button>

        <button class="tab-btn tab-btn-warn ${state.quotaFilters.activeTab === 'ATTENTION' ? 'active' : ''}" data-tab="ATTENTION">
          <span>Cần chú ý</span>
          <span class="tab-btn-count">${countAttention}</span>
        </button>
      </div>
    `;

    if (state.quotaFilters.activeTab === 'UNASSIGNED_POOL') {
      html += renderUnassignedPoolSection(revokedInScope, unassignedEmps);
    } else {
      html += `
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 44px; text-align: center;">
                    <input type="checkbox" id="quota-select-all" class="table-checkbox" ${allSelectedOnPage ? 'checked' : ''} title="Chọn tất cả trên trang này">
                  </th>
                  <th style="width: 220px;">NHÂN VIÊN</th>
                  <th style="width: 210px;">EMAIL DOANH NGHIỆP</th>
                  <th style="width: 160px;">CHI NHÁNH</th>
                  <th style="width: 180px;">TÀI KHOẢN ZALO</th>
                  <th style="width: 160px;">TRẠNG THÁI</th>
                  <th style="width: 160px;">CẦN CHÚ Ý</th>
                  <th style="width: 130px;">HOẠT ĐỘNG</th>
                  <th style="width: 120px; text-align: right;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                ${paginatedEmployees.length === 0 ? `
                  <tr>
                    <td colspan="10" class="table-empty-cell">
                      Không tìm thấy nhân sự phù hợp với điều kiện lọc hiện tại.
                    </td>
                  </tr>
                ` : paginatedEmployees.map(e => {
                  const isChecked = state.selectedBulkIds.includes(e.id);
                  return `
                    <tr class="table-row-clickable ${isChecked ? 'row-selected' : ''}" data-open-drawer="${e.id}">
                      <td style="text-align: center;" onclick="event.stopPropagation();">
                        <input type="checkbox" class="table-checkbox quota-row-check" data-emp="${e.id}" ${isChecked ? 'checked' : ''}>
                      </td>

                      <td>
                        <div class="emp-profile-cell">
                          <div class="emp-avatar-circle">${getInitials(e.name)}</div>
                          <span class="emp-name-text font-semibold">${escapeHtml(e.name)}</span>
                        </div>
                      </td>

                      <td>
                        ${e.accountStatus !== 'Unassigned' && e.email ? `
                          <span class="text-secondary font-mono text-sm">${escapeHtml(e.email)}</span>
                        ` : `
                          <span class="text-muted text-xs font-mono">—</span>
                        `}
                      </td>
                      <td>
                        <div class="branch-cell-simple">
                          <span class="branch-main-name">${escapeHtml(e.branchName)}</span>
                          <span class="branch-code-badge font-mono">${e.branchId}</span>
                        </div>
                      </td>
                      <td>
                        ${e.accountId ? `
                          <div class="zalo-account-cell">
                            <span class="zalo-id-text font-mono text-primary font-semibold">${e.accountId}</span>
                            <span class="zalo-date-text">Cấp: ${e.zaloAssignedDate || '—'}</span>
                          </div>
                        ` : `
                          <span class="zalo-none-text">— Chưa cấp —</span>
                        `}
                      </td>
                      <td>
                        <div class="status-cell-group">
                          ${renderAccountStatusBadge(e)}
                        </div>
                      </td>
                      <td>
                        ${renderCompactAttentionTag(e)}
                      </td>

                      <td>
                        <span class="text-xs text-secondary font-mono">${e.lastActiveDate || e.zaloAssignedDate || '—'}</span>
                      </td>

                      <td style="text-align: right;" onclick="event.stopPropagation();">
                        ${renderRowActions(e)}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="table-pagination-bar">
            <div class="pagination-left">
              <span>Hiển thị <strong>${totalItems === 0 ? 0 : startIndex + 1}–${Math.min(startIndex + pageSize, totalItems)}</strong> trên <strong>${totalItems}</strong> nhân sự</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="text-xs text-muted">Số dòng:</span>
                <select class="pagination-size-select" id="quota-page-size-select">
                  <option value="10" ${pageSize === 10 ? 'selected' : ''}>10 / trang</option>
                  <option value="25" ${pageSize === 25 ? 'selected' : ''}>25 / trang</option>
                  <option value="50" ${pageSize === 50 ? 'selected' : ''}>50 / trang</option>
                </select>
              </div>
            </div>

            <div class="pagination-right">
              <button class="pagination-page-btn" id="pagination-btn-prev" ${currentPage <= 1 ? 'disabled' : ''}>‹</button>
              ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                <button class="pagination-page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
              `).join('')}
              <button class="pagination-page-btn" id="pagination-btn-next" ${currentPage >= totalPages ? 'disabled' : ''}>›</button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    attachQuotaViewListeners(container);
    updateBulkBar();
  }

  function renderBranchOptions() {
    const list = [];
    for (const r of state.orgTree.regions) {
      if (state.quotaFilters.region !== 'ALL' && r.id !== state.quotaFilters.region) continue;
      for (const b of r.branches) {
        list.push(`<option value="${b.id}" ${state.quotaFilters.branch === b.id ? 'selected' : ''}>${escapeHtml(b.name)} (${b.id})</option>`);
      }
    }
    return list.join('');
  }


  // Helper gọt bớt các dòng chú ý ngắn gọn (súc tích, không phá vỡ bố cục bảng)
  function renderCompactAttentionTag(emp) {
    if (!emp.attentionReason && emp.employeeStatus !== 'Terminated') {
      return '<span class="text-muted">—</span>';
    }

    if (emp.employeeStatus === 'Terminated') {
      return `<span class="attention-tag-compact danger" title="${escapeHtml(emp.attentionReason || 'Nhân sự đã nghỉ việc, cần thu hồi tài khoản')}">⚠ Nghỉ việc</span>`;
    }

    const r = emp.attentionReason.toLowerCase();
    if (emp.accountStatus === 'Pending' && (emp.pendingOverdue || r.includes('quá hạn') || r.includes('chờ kích hoạt'))) {
      const hours = emp.pendingHours ? ` (${emp.pendingHours}h)` : '';
      return `<span class="attention-tag-compact warning" title="${escapeHtml(emp.attentionReason)}">⚠ Quá hạn kích hoạt${hours}</span>`;
    }
    if (r.includes('30 ngày') || r.includes('không hoạt động') || r.includes('ko hoạt động')) {
      return `<span class="attention-tag-compact warning" title="${escapeHtml(emp.attentionReason)}">⚠ >30d ko dùng</span>`;
    }
    if (r.includes('chưa cấp') || emp.accountStatus === 'Unassigned') {
      return `<span class="attention-tag-compact neutral" title="${escapeHtml(emp.attentionReason)}">⚠ Chưa cấp</span>`;
    }
    if (r.includes('tạm khóa') || emp.accountStatus === 'Suspended') {
      return `<span class="attention-tag-compact danger" title="${escapeHtml(emp.attentionReason)}">⚠ Đang khóa</span>`;
    }

    // Cắt ngắn nếu lý do khác
    const shortText = emp.attentionReason.length > 20 ? emp.attentionReason.slice(0, 18) + '...' : emp.attentionReason;
    return `<span class="attention-tag-compact warning" title="${escapeHtml(emp.attentionReason)}">⚠ ${escapeHtml(shortText)}</span>`;
  }

  function renderAccountStatusBadge(e) {
    if (e.accountStatus === 'Active') {
      return `<span class="account-badge badge-active"><span class="dot-green">●</span> Đang hoạt động</span>`;
    } else if (e.accountStatus === 'Pending') {
      return `<span class="account-badge badge-pending"><span class="dot-amber">●</span> Chờ kích hoạt</span>`;
    } else if (e.accountStatus === 'Suspended') {
      return `<span class="account-badge badge-suspended"><span class="dot-red">●</span> Tạm khóa</span>`;
    } else if (e.accountStatus === 'HandedOver') {
      return `<span class="account-badge badge-handedover" title="Đã bàn giao cho ${escapeHtml(e.handedOverTo || 'nhân sự khác')}">
        Đã bàn giao ➔ ${escapeHtml(e.handedOverTo || '')}
      </span>`;
    } else {
      return `<span class="account-badge badge-unassigned">Chưa cấp</span>`;
    }
  }

  function renderRowActions(e) {
    if (e.accountStatus === 'Unassigned') {
      return `
        <button class="btn btn-primary btn-xs" data-action="assign" data-emp="${e.id}">Cấp account</button>
      `;
    } else if (e.accountStatus === 'Pending') {
      return `
        <div class="action-dropdown-wrap">
          <button class="btn btn-outline btn-xs" data-action="remind-pending" data-emp="${e.id}">Nhắc nhở</button>
          <button class="btn-more-dots" data-toggle-menu="${e.id}">•••</button>
          <div class="menu-popover" id="menu-${e.id}" style="display: none;">
            <button class="menu-item" data-action="view-drawer" data-emp="${e.id}">Xem chi tiết</button>
            <button class="menu-item menu-item-primary" data-action="activate-pending" data-emp="${e.id}">Kích hoạt ngay</button>
            <button class="menu-item menu-item-danger" data-action="revoke" data-emp="${e.id}">Hủy cấp phát (Thu hồi)</button>
          </div>
        </div>
      `;
    } else if (e.accountStatus === 'Active') {
      return `
        <div class="action-dropdown-wrap">
          <button class="btn btn-outline btn-xs" data-action="handover" data-emp="${e.id}">Bàn giao</button>
          <button class="btn-more-dots" data-toggle-menu="${e.id}">•••</button>
          <div class="menu-popover" id="menu-${e.id}" style="display: none;">
            <button class="menu-item" data-action="view-drawer" data-emp="${e.id}">Xem chi tiết</button>
            <button class="menu-item menu-item-warn" data-action="suspend" data-emp="${e.id}">Tạm khóa</button>
            <button class="menu-item menu-item-danger" data-action="revoke" data-emp="${e.id}">Thu hồi tài khoản</button>
          </div>
        </div>
      `;
    } else if (e.accountStatus === 'Suspended') {
      return `
        <div class="action-dropdown-wrap">
          <button class="btn btn-outline btn-xs" data-action="unlock" data-emp="${e.id}">Mở khóa</button>
          <button class="btn-more-dots" data-toggle-menu="${e.id}">•••</button>
          <div class="menu-popover" id="menu-${e.id}" style="display: none;">
            <button class="menu-item" data-action="view-drawer" data-emp="${e.id}">Xem chi tiết</button>
            <button class="menu-item menu-item-disabled" title="Bắt buộc phải mở khóa tài khoản trước khi bàn giao">Bàn giao (Khóa)</button>
            <button class="menu-item menu-item-danger" data-action="revoke" data-emp="${e.id}">Thu hồi tài khoản</button>
          </div>
        </div>
      `;
    } else {
      return `
        <button class="btn btn-outline btn-xs" data-action="view-drawer" data-emp="${e.id}">Chi tiết</button>
      `;
    }
  }

  function renderUnassignedPoolSection(revokedList, unassignedList) {
    return `
      <div class="unassigned-pool-card mb-20">
        <div class="pool-card-header">
          <div class="pool-header-titles">
            <div class="badge-priority-leads">ƯU TIÊN SỐ 1 • BẢO TỒN LEADS</div>
            <h3 class="pool-title">Tài khoản đã thu hồi sẵn sàng tái cấp</h3>
            <span class="pool-subtitle">
              Các tài khoản Zalo Enterprise đã thu hồi và đang lưu giữ danh bạ/leads khách hàng chưa được bàn giao. Ưu tiên tái cấp cho nhân sự mới để khai thác tiếp.
            </span>
          </div>
          <span class="pool-counter-tag">${revokedList.length} tài khoản trong kho</span>
        </div>

        ${revokedList.length === 0 ? `
          <div class="empty-state-box">Hiện không có tài khoản nào đã thu hồi trong kho thuộc chi nhánh này.</div>
        ` : `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 170px;">MÃ ACCOUNT</th>
                  <th style="width: 160px;">CHI NHÁNH</th>
                  <th style="width: 140px;">NGÀY THU HỒI</th>
                  <th style="width: 220px;">CHỦ SỞ HỮU CŨ</th>
                  <th style="width: 160px; text-align: center;">LEADS KHÁCH HÀNG</th>
                  <th style="width: 220px;">GHI CHÚ / KHÁCH HÀNG</th>
                  <th style="width: 130px; text-align: right;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                ${revokedList.map(r => `
                  <tr>
                    <td><strong class="zalo-id-text">${r.accountId}</strong></td>
                    <td>${escapeHtml(r.branchName)} <span class="branch-code-badge">${r.branchId}</span></td>
                    <td>${r.revokedAt}</td>
                    <td>
                      <div class="emp-text-group">
                        <span class="font-semibold">${escapeHtml(r.previousOwnerName)}</span>
                        <span class="emp-sub-text">${escapeHtml(r.previousOwnerEmail)}</span>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <span class="lead-count-badge">★ ${r.leadCount} Leads</span>
                    </td>
                    <td><span class="text-secondary text-sm">${escapeHtml(r.note)}</span></td>
                    <td style="text-align: right;">
                      <button class="btn btn-primary btn-xs" data-action="reassign-revoked" data-account="${r.accountId}">
                        Tái cấp ngay ➔
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <div class="unassigned-pool-card">
        <div class="pool-card-header">
          <div class="pool-header-titles">
            <h3 class="pool-title">Nhân sự chưa có tài khoản Zalo Enterprise</h3>
            <span class="pool-subtitle">Danh sách nhân viên đang công tác nhưng chưa được phân bổ tài khoản làm việc.</span>
          </div>
          <span class="pool-counter-tag">${unassignedList.length} nhân sự chờ cấp</span>
        </div>

        ${unassignedList.length === 0 ? `
          <div class="empty-state-box">Tất cả nhân sự trong phạm vi đã được cấp tài khoản đầy đủ.</div>
        ` : `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 260px;">NHÂN VIÊN</th>
                  <th style="width: 180px;">CHI NHÁNH</th>
                  <th style="width: 140px;">MÃ NHÂN VIÊN</th>
                  <th style="width: 200px;">EMAIL DOANH NGHIỆP</th>
                  <th style="width: 140px;">TRẠNG THÁI</th>
                  <th style="width: 140px; text-align: right;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                ${unassignedList.map(e => `
                  <tr class="table-row-clickable" data-open-drawer="${e.id}">
                    <td>
                      <div class="emp-profile-cell">
                        <div class="emp-avatar-circle">${getInitials(e.name)}</div>
                        <span class="emp-name-text">${escapeHtml(e.name)}</span>
                      </div>
                    </td>
                    <td>${escapeHtml(e.branchName)} <span class="branch-code-badge">${e.branchId}</span></td>
                    <td>${e.code}</td>
                    <td>${escapeHtml(e.email)}</td>
                    <td><span class="account-badge badge-unassigned">Chưa cấp</span></td>
                    <td style="text-align: right;" onclick="event.stopPropagation();">
                      <button class="btn btn-primary btn-xs" data-action="assign" data-emp="${e.id}">Cấp account</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

    function attachQuotaViewListeners(container) {
    const searchInput = document.getElementById('quota-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.quotaFilters.search = e.target.value;
        if (state.quotaPagination) state.quotaPagination.page = 1;
        renderApp();
      });
    }

    const regSelect = document.getElementById('quota-region-select');
    if (regSelect) {
      regSelect.addEventListener('change', (e) => {
        state.quotaFilters.region = e.target.value;
        state.quotaFilters.branch = 'ALL';
        state.quotaFilters.advAccountStatus = 'ALL';
        state.quotaFilters.advAttentionType = 'ALL';
        state.quotaFilters.advancedOpen = false;
        if (state.quotaPagination) state.quotaPagination.page = 1;
        saveState();
        renderApp();
      });
    }

    const branchSelect = document.getElementById('quota-branch-select');
    if (branchSelect) {
      branchSelect.addEventListener('change', (e) => {
        state.quotaFilters.branch = e.target.value;
        if (state.quotaPagination) state.quotaPagination.page = 1;
        saveState();
        renderApp();
      });
    }

    const resetBtn = document.getElementById('btn-reset-quota-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.quotaFilters.search = '';
        state.quotaFilters.region = 'ALL';
        state.quotaFilters.branch = 'ALL';
        if (state.quotaPagination) state.quotaPagination.page = 1;
        saveState();
        renderApp();
      });
    }

    container.querySelectorAll('.quota-tabs-bar .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        state.quotaFilters.activeTab = tab;
        if (state.quotaPagination) state.quotaPagination.page = 1;
        saveState();
        renderApp();
      });
    });

    // Checkbox chọn tất cả trên trang
    const selectAllCheck = document.getElementById('quota-select-all');
    if (selectAllCheck) {
      selectAllCheck.addEventListener('change', (e) => {
        const pageCheckboxes = container.querySelectorAll('.quota-row-check');
        if (e.target.checked) {
          pageCheckboxes.forEach(cb => {
            const empId = cb.getAttribute('data-emp');
            if (!state.selectedBulkIds.includes(empId)) {
              state.selectedBulkIds.push(empId);
            }
          });
        } else {
          pageCheckboxes.forEach(cb => {
            const empId = cb.getAttribute('data-emp');
            state.selectedBulkIds = state.selectedBulkIds.filter(id => id !== empId);
          });
        }
        renderApp();
      });
    }

    // Checkbox từng dòng
    container.querySelectorAll('.quota-row-check').forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      cb.addEventListener('change', (e) => {
        const empId = cb.getAttribute('data-emp');
        if (e.target.checked) {
          if (!state.selectedBulkIds.includes(empId)) state.selectedBulkIds.push(empId);
        } else {
          state.selectedBulkIds = state.selectedBulkIds.filter(id => id !== empId);
        }
        updateBulkBar();
        // Cập nhật class row
        const row = cb.closest('tr');
        if (row) {
          if (e.target.checked) row.classList.add('row-selected');
          else row.classList.remove('row-selected');
        }
      });
    });

    // Pagination listeners
    const pageSizeSelect = document.getElementById('quota-page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        state.quotaPagination.pageSize = parseInt(e.target.value, 10);
        state.quotaPagination.page = 1;
        saveState();
        renderApp();
      });
    }

    const btnPrev = document.getElementById('pagination-btn-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.quotaPagination.page > 1) {
          state.quotaPagination.page--;
          saveState();
          renderApp();
        }
      });
    }

    const btnNext = document.getElementById('pagination-btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        state.quotaPagination.page++;
        saveState();
        renderApp();
      });
    }

    container.querySelectorAll('.pagination-page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.getAttribute('data-page'), 10);
        state.quotaPagination.page = p;
        saveState();
        renderApp();
      });
    });

    // Row drawer click
    container.querySelectorAll('[data-open-drawer]').forEach(row => {
      row.addEventListener('click', () => {
        const empId = row.getAttribute('data-open-drawer');
        openSideDrawer(empId);
      });
    });

    // Row actions
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const empId = btn.getAttribute('data-emp');
        const accId = btn.getAttribute('data-account');

        if (action === 'assign') {
          openAssignModal(empId);
        } else if (action === 'reassign-revoked') {
          openReassignRevokedModal(accId);
        } else if (action === 'remind-pending') {
          const emp = state.employees.find(e => e.id === empId);
          if (emp) {
            state.auditLogs.unshift({
              id: `LOG-${Date.now().toString().slice(-4)}`,
              timestamp: '25/09/2026 14:22',
              actor: getActorName(),
              action: 'Nhắc nhở kích hoạt tài khoản',
              target: `${emp.name} (${emp.accountId})`,
              branch: `${emp.branchName} (${emp.branchId})`,
              impact: `Đã gửi thông báo SMS & Email nhắc nhở đăng nhập kích hoạt Zalo Enterprise tới ${emp.email}`
            });
            state.selectedDrawerId = emp.id;
            saveState();
            showToast(`Đã gửi thông báo nhắc kích hoạt tài khoản ${emp.accountId} tới email ${emp.email}`, 'success');
            renderApp();
            openSideDrawer(emp.id);
          }
        } else if (action === 'activate-pending') {
          const emp = state.employees.find(e => e.id === empId);
          if (emp) {
            emp.accountStatus = 'Active';
            emp.attentionReason = null;
            emp.pendingOverdue = false;
            state.auditLogs.unshift({
              id: `LOG-${Date.now().toString().slice(-4)}`,
              timestamp: '25/09/2026 14:23',
              actor: getActorName(),
              action: 'Kích hoạt tài khoản Zalo',
              target: `${emp.name} (${emp.accountId})`,
              branch: `${emp.branchName} (${emp.branchId})`,
              impact: 'Nhân sự đã hoàn tất đăng nhập, tài khoản chuyển sang Đang hoạt động'
            });
            state.selectedDrawerId = emp.id;
            saveState();
            showToast(`Tài khoản ${emp.accountId} của ${emp.name} đã được kích hoạt thành công`, 'success');
            renderApp();
            openSideDrawer(emp.id);
          }
        } else if (action === 'handover') {
          openHandoverModal(empId);
        } else if (action === 'suspend') {
          openSuspendModal(empId);
        } else if (action === 'unlock') {
          openUnlockModal(empId);
        } else if (action === 'revoke') {
          openRevokeModal(empId);
        } else if (action === 'view-drawer') {
          openSideDrawer(empId);
        }
      });
    });

    container.querySelectorAll('[data-toggle-menu]').forEach(dots => {
      dots.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = dots.getAttribute('data-toggle-menu');
        const menu = document.getElementById(`menu-${id}`);
        document.querySelectorAll('.menu-popover').forEach(m => {
          if (m !== menu) m.style.display = 'none';
        });
        if (menu) {
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.menu-popover').forEach(m => m.style.display = 'none');
    });

    const topAssignBtn = document.getElementById('btn-open-assign-new');
    if (topAssignBtn) {
      topAssignBtn.addEventListener('click', () => {
        openAssignModal();
      });
    }
  }

  // =========================================================================
  // 5C. FLOATING BULK ACTIONS CONTROLLER (THAO TÁC HÀNG LOẠT)
  // =========================================================================

  function updateBulkBar() {
    const bar = document.getElementById('floating-bulk-bar');
    const counterText = document.getElementById('bulk-selected-count');
    if (!bar) return;

    if (!state.selectedBulkIds) state.selectedBulkIds = [];
    const count = state.selectedBulkIds.length;

    if (count > 0 && state.activeView === 'quota') {
      bar.style.display = 'block';
      if (counterText) counterText.textContent = `Đã chọn ${count} nhân sự`;
    } else {
      bar.style.display = 'none';
    }
  }

  // Setup Global Bulk Action Listeners
  function setupBulkActionListeners() {
    const btnDeselect = document.getElementById('bulk-btn-deselect');
    if (btnDeselect) {
      btnDeselect.addEventListener('click', () => {
        state.selectedBulkIds = [];
        updateBulkBar();
        renderApp();
      });
    }

    const btnSuspend = document.getElementById('bulk-btn-suspend');
    if (btnSuspend) {
      btnSuspend.addEventListener('click', () => {
        if (!state.selectedBulkIds || state.selectedBulkIds.length === 0) return;

        const targetEmps = state.employees.filter(e => state.selectedBulkIds.includes(e.id) && e.accountStatus === 'Active');
        if (targetEmps.length === 0) {
          showToast('Không có nhân sự nào trong danh sách chọn đang ở trạng thái Hoạt động để tạm khóa', 'warning');
          return;
        }

        const confirmMsg = `Bạn có chắc muốn TẠM KHÓA ${targetEmps.length} tài khoản Zalo Enterprise đã chọn?`;
        if (!confirm(confirmMsg)) return;

        targetEmps.forEach(emp => {
          emp.accountStatus = 'Suspended';
          emp.attentionReason = 'Tạm khóa hàng loạt từ Admin Console';

          state.auditLogs.unshift({
            id: `LOG-${Date.now().toString().slice(-4)}`,
            timestamp: '25/09/2026 14:15',
            actor: getActorName(),
            action: 'Tạm khóa tài khoản (Hàng loạt)',
            target: `${emp.name} (${emp.accountId})`,
            branch: `${emp.branchName} (${emp.branchId})`,
            impact: 'Tạm dừng quyền truy cập Zalo (Hàng loạt)'
          });
        });

        state.selectedBulkIds = [];
        saveState();
        showToast(`Đã tạm khóa thành công ${targetEmps.length} tài khoản`, 'success');
        renderApp();
      });
    }

    const btnRevoke = document.getElementById('bulk-btn-revoke');
    if (btnRevoke) {
      btnRevoke.addEventListener('click', () => {
        if (!state.selectedBulkIds || state.selectedBulkIds.length === 0) return;

        const targetEmps = state.employees.filter(e => state.selectedBulkIds.includes(e.id) && (e.accountStatus === 'Active' || e.accountStatus === 'Suspended'));
        if (targetEmps.length === 0) {
          showToast('Không có nhân sự nào trong danh sách chọn có tài khoản Zalo để thu hồi', 'warning');
          return;
        }

        const confirmMsg = `CẢNH BÁO: Bạn có chắc muốn THU HỒI ${targetEmps.length} tài khoản Zalo Enterprise? Toàn bộ tài khoản và leads sẽ được chuyển về Kho tài khoản chưa cấp.`;
        if (!confirm(confirmMsg)) return;

        targetEmps.forEach(emp => {
          const oldAccId = emp.accountId;
          const oldLeads = emp.leadCount || 0;

          state.revokedAccounts.unshift({
            accountId: oldAccId,
            branchId: emp.branchId,
            branchName: emp.branchName,
            region: emp.region,
            revokedAt: '25/09/2026',
            previousOwnerName: emp.name,
            previousOwnerEmail: emp.email,
            leadCount: oldLeads,
            note: `Thu hồi hàng loạt từ ${emp.name}, bảo tồn ${oldLeads} leads`
          });

          emp.accountId = null;
          emp.accountStatus = 'Unassigned';
          emp.zaloAssignedDate = null;
          emp.leadCount = 0;
          emp.lastActiveDate = null;
          emp.attentionReason = null;

          state.auditLogs.unshift({
            id: `LOG-${Date.now().toString().slice(-4)}`,
            timestamp: '25/09/2026 14:16',
            actor: getActorName(),
            action: 'Thu hồi tài khoản (Hàng loạt)',
            target: `${emp.name} (${oldAccId})`,
            branch: `${emp.branchName} (${emp.branchId})`,
            impact: `Đưa ${oldAccId} về kho chưa cấp kèm ${oldLeads} leads (Đang dùng -1, Chưa dùng +1)`
          });
        });

        state.selectedBulkIds = [];
        saveState();
        showToast(`Đã thu hồi thành công ${targetEmps.length} tài khoản`, 'success');
        renderApp();
      });
    }

    const btnExport = document.getElementById('bulk-btn-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        if (!state.selectedBulkIds || state.selectedBulkIds.length === 0) return;
        const selectedEmps = state.employees.filter(e => state.selectedBulkIds.includes(e.id));
        exportSelectedCSV(selectedEmps);
      });
    }
  }

  function exportSelectedCSV(emps) {
    const headers = ['Mã NV', 'Họ Tên', 'Email', 'Chi Nhánh', 'Vùng', 'Tài Khoản Zalo', 'Trạng Thái', 'Leads', 'Ngày Cấp'];
    const rows = emps.map(e => [
      e.code,
      `"${e.name}"`,
      e.email,
      `"${e.branchName}"`,
      e.region,
      e.accountId || 'Chưa cấp',
      e.accountStatus,
      e.leadCount,
      e.zaloAssignedDate || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Z_Enterprise_Selected_Employees_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất danh sách ${emps.length} nhân sự đã chọn`, 'success');
  }

  // =========================================================================
  // 6. VIEW 3: NHẬT KÝ AUDIT (KIỂM TOÁN CHUẨN 5 CỘT D-020)
  // =========================================================================


  // =========================================================================
  // 5B. MÀN HÌNH PHÂN BỔ QUOTA THEO ĐƠN VỊ (QUOTA ALLOCATION VIEW)
  // =========================================================================

    function renderQuotaAllocationView(container) {
    const isBranchAdmin = state.currentPersona === 'branch_admin';

    // Đồng bộ 100% qua Engine getBranchQuotaStats
    let totalAllocatedToBranches = 0;
    let totalUsedActive = 0;
    let totalUsedPending = 0;
    let totalUsedSuspended = 0;

    state.orgTree.regions.forEach(r => {
      r.branches.forEach(b => {
        const bStats = getBranchQuotaStats(b.id);
        totalAllocatedToBranches += bStats.totalQuota;
        totalUsedActive += bStats.active;
        totalUsedPending += bStats.pending;
        totalUsedSuspended += bStats.suspended;
      });
    });

    const totalInUse = totalUsedActive + totalUsedPending + totalUsedSuspended;
    const companyReserve = Math.max(0, state.orgTree.totalCompanyQuota - totalAllocatedToBranches);
    const allocationRate = ((totalAllocatedToBranches / state.orgTree.totalCompanyQuota) * 100).toFixed(1);

    // Tính sức khỏe từng vùng đồng bộ
    const regionHealthData = state.orgTree.regions.map(reg => {
      let regAlloc = 0;
      let regUsed = 0;
      reg.branches.forEach(b => {
        const bStats = getBranchQuotaStats(b.id);
        regAlloc += bStats.totalQuota;
        regUsed += bStats.inUse;
      });
      const util = regAlloc > 0 ? ((regUsed / regAlloc) * 100).toFixed(1) : 0;
      let statusClass = 'health-good';
      let badgeClass = 'good';
      let statusText = '🟢 Ổn định';
      if (parseFloat(util) >= 90) {
        statusClass = 'health-danger';
        badgeClass = 'danger';
        statusText = '🔴 Chạm trần';
      } else if (parseFloat(util) >= 80) {
        statusClass = 'health-warn';
        badgeClass = 'warn';
        statusText = '🟡 Cảnh báo';
      }

      return {
        id: reg.id,
        name: reg.name,
        allocated: regAlloc,
        used: regUsed,
        free: Math.max(0, regAlloc - regUsed),
        util: parseFloat(util),
        statusClass,
        badgeClass,
        statusText,
        branchesCount: reg.branches.length
      };
    });

    let html = `
      <div class="view-header">
        <div class="view-title-group">
          <div class="title-with-pill">
            <h1 class="view-page-title">Phân Bổ Quota Theo Đơn Vị</h1>
            <span class="scope-pill-badge">${isBranchAdmin ? 'Chi nhánh HCM-01' : 'Toàn doanh nghiệp'}</span>
          </div>
          <p class="view-page-desc">
            Mô hình trực tiếp 1 cấp: Super Admin phân bổ và điều chuyển hạn mức Quota từ Quỹ công ty xuống từng Chi nhánh, theo dõi chỉ số sức khỏe 3 Miền.
          </p>
        </div>
        <div class="view-header-actions">
          ${!isBranchAdmin ? `
            <button class="btn btn-outline btn-sm" id="btn-export-allocation">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Xuất ma trận Quota</span>
            </button>
            <button class="btn btn-primary btn-sm" id="btn-top-grant-quota">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Phân Bổ Quota Cho Đơn Vị</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Thẻ Quỹ Dự Phòng Super Admin & Tổng quan Hạn mức -->
      <div class="allocation-summary-grid">
        <div class="allocation-stat-card" style="border-top: 3px solid var(--primary);">
          <div class="stat-title">Quỹ Dự Phòng Super Admin Giữ</div>
          <div class="stat-val font-mono num-green">${formatNumber(companyReserve)} Quota</div>
          <div class="stat-sub">Sẵn sàng cấp thêm ngay khi chi nhánh thiếu</div>
        </div>

        <div class="allocation-stat-card">
          <div class="stat-title">Tổng Hợp Đồng Toàn Quốc</div>
          <div class="stat-val font-mono">${formatNumber(state.orgTree.totalCompanyQuota)} Quota</div>
          <div class="stat-sub">Hạn mức Zalo Enterprise toàn công ty</div>
        </div>

        <div class="allocation-stat-card">
          <div class="stat-title">Đã Phân Bổ Chi Nhánh</div>
          <div class="stat-val font-mono text-primary">${formatNumber(totalAllocatedToBranches)} Quota</div>
          <div class="stat-sub">${allocationRate}% hạn mức đã giao chỉ tiêu</div>
        </div>

        <div class="allocation-stat-card">
          <div class="stat-title">Thực Tế Đang Sử Dụng</div>
          <div class="stat-val font-mono">${formatNumber(totalInUse)} Quota</div>
          <div class="stat-sub">${totalUsedActive} Active • ${totalUsedPending} Pending • ${totalUsedSuspended} Khóa</div>
        </div>
      </div>

      <!-- Trạng Thái Sức Khỏe Quota 3 Vùng (Brainstorm Feature) -->
      <div class="regional-health-grid">
        ${regionHealthData.map(rh => `
          <div class="regional-health-card ${rh.statusClass}">
            <div class="regional-card-header">
              <span class="regional-card-title">${escapeHtml(rh.name)} (${rh.branchesCount} chi nhánh)</span>
              <span class="regional-health-badge ${rh.badgeClass}">${rh.statusText}</span>
            </div>
            <div class="flex-between text-xs text-muted">
              <span>Được cấp: <strong>${formatNumber(rh.allocated)}</strong></span>
              <span>Đang dùng: <strong>${formatNumber(rh.used)}</strong></span>
              <span>Còn trống: <strong class="num-green">${formatNumber(rh.free)}</strong></span>
            </div>
            <div class="allocation-progress-bar">
              <div class="allocation-progress-fill ${rh.util >= 90 ? 'high' : (rh.util >= 80 ? 'warn' : '')}" style="width: ${Math.min(100, rh.util)}%;"></div>
            </div>
            <div class="text-xs text-secondary font-mono mt-4">Tỷ lệ khai thác Quota: <strong>${rh.util}%</strong></div>
          </div>
        `).join('')}
      </div>
    `;

    // Flatten all branches across regions
    const allBranches = [];
    state.orgTree.regions.forEach(reg => {
      reg.branches.forEach(b => {
        allBranches.push({
          ...b,
          regionId: reg.id,
          regionName: reg.name
        });
      });
    });

    // Filter branches based on state.allocationFilters
    const filteredBranches = allBranches.filter(b => {
      if (isBranchAdmin && b.id !== 'HCM-01') return false;

      // Filter by Search (name or code or region)
      if (state.allocationFilters.search) {
        const q = state.allocationFilters.search.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        const matchReg = b.regionName.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchReg) return false;
      }

      // Filter by Region
      if (state.allocationFilters.region !== 'ALL') {
        if (b.regionId !== state.allocationFilters.region) return false;
      }

      // Filter by Utilization Status
      if (state.allocationFilters.utilizationStatus !== 'ALL') {
        const bStats = getBranchQuotaStats(b.id);
        const util = bStats.utilization;
        if (state.allocationFilters.utilizationStatus === 'DANGER') {
          if (util < 90) return false;
        } else if (state.allocationFilters.utilizationStatus === 'WARN') {
          if (util < 80 || util >= 90) return false;
        } else if (state.allocationFilters.utilizationStatus === 'GOOD') {
          if (util >= 80) return false;
        } else if (state.allocationFilters.utilizationStatus === 'HIGH_FREE') {
          if (bStats.available < 10) return false;
        }
      }

      return true;
    });

    // Aggregate metrics for footer total row
    let sumAllocated = 0;
    let sumUsed = 0;
    let sumActive = 0;
    let sumPending = 0;
    let sumSuspended = 0;
    let sumFree = 0;

    filteredBranches.forEach(b => {
      const bStats = getBranchQuotaStats(b.id);
      sumAllocated += bStats.totalQuota;
      sumUsed += bStats.inUse;
      sumActive += bStats.active;
      sumPending += bStats.pending;
      sumSuspended += bStats.suspended;
      sumFree += bStats.available;
    });

    const avgUtil = sumAllocated > 0 ? ((sumUsed / sumAllocated) * 100).toFixed(1) : 0;

    html += `
      <!-- Thanh lọc nâng cao Quota Allocation -->
      <div class="allocation-filter-bar">
        <div class="allocation-filter-group">
          <div class="search-input-wrap" style="flex: 1; min-width: 250px;">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="alloc-search-input" class="search-input" placeholder="Tìm theo tên chi nhánh, mã đơn vị (VD: HCM, DAD, HAN...)" value="${escapeHtml(state.allocationFilters.search || '')}">
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="text-xs text-muted font-medium">Vùng:</span>
            <select class="form-select-box" id="alloc-filter-region" style="width: 160px; height: 34px; padding: 4px 8px;">
              <option value="ALL" ${state.allocationFilters.region === 'ALL' ? 'selected' : ''}>Tất cả các miền</option>
              <option value="South" ${state.allocationFilters.region === 'South' ? 'selected' : ''}>Miền Nam</option>
              <option value="Central" ${state.allocationFilters.region === 'Central' ? 'selected' : ''}>Miền Trung</option>
              <option value="North" ${state.allocationFilters.region === 'North' ? 'selected' : ''}>Miền Bắc</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="text-xs text-muted font-medium">Tình trạng tải:</span>
            <select class="form-select-box" id="alloc-filter-status" style="width: 210px; height: 34px; padding: 4px 8px;">
              <option value="ALL" ${state.allocationFilters.utilizationStatus === 'ALL' ? 'selected' : ''}>Tất cả tình trạng tải</option>
              <option value="DANGER" ${state.allocationFilters.utilizationStatus === 'DANGER' ? 'selected' : ''}>🔴 Chạm trần (≥ 90%)</option>
              <option value="WARN" ${state.allocationFilters.utilizationStatus === 'WARN' ? 'selected' : ''}>🟡 Cảnh báo (80 - 89%)</option>
              <option value="GOOD" ${state.allocationFilters.utilizationStatus === 'GOOD' ? 'selected' : ''}>🟢 Ổn định (&lt; 80%)</option>
              <option value="HIGH_FREE" ${state.allocationFilters.utilizationStatus === 'HIGH_FREE' ? 'selected' : ''}>📦 Có Quota trống (≥ 10)</option>
            </select>
          </div>

          ${(state.allocationFilters.search || state.allocationFilters.region !== 'ALL' || state.allocationFilters.utilizationStatus !== 'ALL') ? `
            <button class="btn btn-outline btn-xs" id="alloc-btn-reset-filter" title="Đặt lại bộ lọc" style="height: 34px; display: inline-flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Đặt lại</span>
            </button>
          ` : ''}
        </div>

        <div class="text-xs text-muted font-mono" style="white-space: nowrap;">
          Hiển thị <strong>${filteredBranches.length}</strong> / <strong>${allBranches.length}</strong> đơn vị
        </div>
      </div>

      <!-- Bảng Duy Nhất Toàn Bộ Chi Nhánh (Unified Allocation Table) -->
      <div class="card p-0 mb-20" style="overflow: hidden; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 230px;">CHI NHÁNH / ĐƠN VỊ</th>
                <th style="width: 110px;">MÃ ĐƠN VỊ</th>
                <th style="width: 120px;">VÙNG</th>
                <th style="width: 140px; text-align: right;">QUOTA ĐƯỢC CẤP</th>
                <th style="width: 160px; text-align: right;">ĐANG SỬ DỤNG</th>
                <th style="width: 120px; text-align: right;">CÒN TRỐNG</th>
                <th style="width: 190px;">TỶ LỆ KHAI THÁC</th>
                <th style="width: 180px; text-align: right;">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBranches.length === 0 ? `
                <tr>
                  <td colspan="8" class="table-empty-cell" style="padding: 36px; text-align: center; color: var(--text-muted);">
                    Không tìm thấy đơn vị chi nhánh nào khớp với bộ lọc nâng cao hiện tại.
                  </td>
                </tr>
              ` : filteredBranches.map(b => {
                const bStats = getBranchQuotaStats(b.id);
                const branchActive = bStats.active;
                const branchPending = bStats.pending;
                const branchSuspended = bStats.suspended;
                const branchUsed = bStats.inUse;
                const branchFree = bStats.available;
                const branchPercent = bStats.utilization;

                let regionTagClass = 'south';
                if (b.regionId === 'Central') regionTagClass = 'central';
                else if (b.regionId === 'North') regionTagClass = 'north';

                return `
                  <tr>
                    <td>
                      <span class="font-semibold text-main">${escapeHtml(b.name)}</span>
                    </td>
                    <td>
                      <span class="branch-code-badge font-mono">${b.id}</span>
                    </td>
                    <td>
                      <span class="region-tag ${regionTagClass}">${escapeHtml(b.regionName)}</span>
                    </td>
                    <td style="text-align: right;">
                      <span class="font-mono font-semibold text-primary">${formatNumber(b.totalQuota || 0)}</span>
                    </td>
                    <td style="text-align: right;">
                      <span class="font-mono font-semibold">${formatNumber(branchUsed)}</span>
                      <div class="text-xs text-muted">(${branchActive} Active • ${branchPending} Pending • ${branchSuspended} Khóa)</div>
                    </td>
                    <td style="text-align: right;">
                      <span class="font-mono ${branchFree > 0 ? 'num-green font-semibold' : 'num-red font-semibold'}">
                        ${formatNumber(branchFree)}
                      </span>
                    </td>
                    <td>
                      <div class="flex-between text-xs mb-4">
                        <span class="text-secondary font-mono">${branchPercent}%</span>
                        <span class="text-muted">${branchUsed}/${b.totalQuota}</span>
                      </div>
                      <div class="allocation-progress-bar">
                        <div class="allocation-progress-fill ${branchPercent >= 90 ? 'high' : (branchPercent >= 80 ? 'warn' : '')}" style="width: ${Math.min(100, branchPercent)}%;"></div>
                      </div>
                    </td>
                    <td style="text-align: right;">
                      ${!isBranchAdmin ? `
                        <div style="display: inline-flex; align-items: center; gap: 6px;">
                          ${branchFree > 0 ? `
                            <button class="btn btn-outline btn-xs btn-warn" data-action="open-recall-modal" data-branch="${b.id}" title="Cấu hình thu hồi Quota nhàn rỗi về Quỹ dự phòng">
                              Thu hồi
                            </button>
                          ` : `
                            <button class="btn btn-outline btn-xs btn-disabled" disabled title="Chi nhánh không còn Quota trống để thu hồi">
                              Thu hồi
                            </button>
                          `}
                          <button class="btn btn-primary btn-xs" data-action="open-grant-modal" data-branch="${b.id}" title="Cấu hình phân bổ thêm Quota từ Quỹ dự phòng">
                            Phân bổ
                          </button>
                        </div>
                      ` : `
                        <span class="text-xs text-muted">Chỉ xem</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            ${filteredBranches.length > 0 ? `
              <tfoot>
                <tr class="table-row-total">
                  <td colspan="3">
                    <span class="font-semibold text-main">TỔNG CỘNG (${filteredBranches.length} ĐƠN VỊ HIỂN THỊ)</span>
                  </td>
                  <td style="text-align: right;">
                    <span class="font-mono font-bold text-primary">${formatNumber(sumAllocated)}</span>
                  </td>
                  <td style="text-align: right;">
                    <span class="font-mono font-bold">${formatNumber(sumUsed)}</span>
                    <div class="text-xs text-muted">(${sumActive} Active • ${sumPending} Pending • ${sumSuspended} Khóa)</div>
                  </td>
                  <td style="text-align: right;">
                    <span class="font-mono font-bold ${sumFree > 0 ? 'num-green' : 'num-red'}">${formatNumber(sumFree)}</span>
                  </td>
                  <td>
                    <div class="flex-between text-xs mb-4">
                      <span class="font-mono font-semibold">${avgUtil}%</span>
                      <span class="text-muted">${sumUsed}/${sumAllocated}</span>
                    </div>
                    <div class="allocation-progress-bar">
                      <div class="allocation-progress-fill" style="width: ${Math.min(100, avgUtil)}%;"></div>
                    </div>
                  </td>
                  <td style="text-align: right; color: var(--text-muted); font-size: 11px;">
                    —
                  </td>
                </tr>
              </tfoot>
            ` : ''}
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach filter listeners
    const searchInput = container.querySelector('#alloc-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const cursor = e.target.selectionStart;
        state.allocationFilters.search = e.target.value;
        saveState();
        renderQuotaAllocationView(container);
        const newSearch = container.querySelector('#alloc-search-input');
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(cursor, cursor);
        }
      });
    }

    const regionSelect = container.querySelector('#alloc-filter-region');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        state.allocationFilters.region = e.target.value;
        saveState();
        renderQuotaAllocationView(container);
      });
    }

    const statusSelect = container.querySelector('#alloc-filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.allocationFilters.utilizationStatus = e.target.value;
        saveState();
        renderQuotaAllocationView(container);
      });
    }

    const resetBtn = container.querySelector('#alloc-btn-reset-filter');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.allocationFilters.search = '';
        state.allocationFilters.region = 'ALL';
        state.allocationFilters.utilizationStatus = 'ALL';
        saveState();
        renderQuotaAllocationView(container);
      });
    }

    // Attach listeners for Quota Allocation view
    container.querySelectorAll('[data-action="open-grant-modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const branchId = btn.getAttribute('data-branch');
        openGrantQuotaModal(branchId);
      });
    });

    container.querySelectorAll('[data-action="open-recall-modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const branchId = btn.getAttribute('data-branch');
        openRecallQuotaModal(branchId);
      });
    });

    const exportBtn = document.getElementById('btn-export-allocation');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportQuotaCSV);
    }

    const grantBtn = document.getElementById('btn-top-grant-quota');
    if (grantBtn) {
      grantBtn.addEventListener('click', openGrantQuotaModal);
    }
  }


  // Modal Phân Bổ Thêm Quota Cho Đơn Vị (Dành cho Super Admin)
  function openGrantQuotaModal(preselectedBranchId) {
    let totalAlloc = 0;
    state.orgTree.regions.forEach(r => r.branches.forEach(b => totalAlloc += (b.totalQuota || 0)));
    const reserve = Math.max(0, state.orgTree.totalCompanyQuota - totalAlloc);

    if (reserve <= 0) {
      showToast('Quỹ Quota dự phòng công ty đã hết (0 Quota), không thể phân bổ thêm', 'warning');
      return;
    }

    const branchOptions = [];
    state.orgTree.regions.forEach(r => {
      r.branches.forEach(b => {
        const isSel = (preselectedBranchId && b.id === preselectedBranchId) ? 'selected' : '';
        branchOptions.push(`<option value="${b.id}" ${isSel}>${escapeHtml(b.name)} (${b.id}) — Đang có ${b.totalQuota} Quota</option>`);
      });
    });

    const preset10 = reserve >= 10 ? `<button type="button" class="btn btn-outline btn-xs" data-preset="10">+10 Quota</button>` : '';
    const preset20 = reserve >= 20 ? `<button type="button" class="btn btn-outline btn-xs" data-preset="20">+20 Quota</button>` : '';
    const preset50 = reserve >= 50 ? `<button type="button" class="btn btn-outline btn-xs" data-preset="50">+50 Quota</button>` : '';

    const bodyHtml = `
      <form id="form-grant-quota">
        <div class="modal-notice-banner mb-14" style="background-color: #f0fdf4; border-color: #bbf7d0;">
          <div class="notice-title num-green" style="font-weight: 700;">Quỹ Dự Phòng Khả Dụng: ${formatNumber(reserve)} Quota</div>
          <div class="notice-desc">
            Super Admin trích trực tiếp từ Quỹ dự phòng công ty để phân bổ thêm cho Chi nhánh. Không được phân bổ vượt quá Quỹ dự phòng hiện có.
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Chọn Đơn Vị / Chi Nhánh Nhận Quota:</label>
          <select class="filter-select" id="grant-branch-select" style="width: 100%;">
            ${branchOptions.join('')}
          </select>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Chọn nhanh số lượng phân bổ:</label>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            ${preset10}
            ${preset20}
            ${preset50}
          </div>
          <label class="form-label">Số Lượng Quota Cần Phân Bổ Thêm:</label>
          <input type="number" class="input-text-main" id="grant-amount-input" 
                 min="1" max="${reserve}" value="${Math.min(10, reserve)}" required>
          <div class="form-hint">
            Tối đa có thể cấp thêm: <strong>${reserve} Quota</strong> (theo Quỹ dự phòng Super Admin hiện có).
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Ghi Chú Lý Do Phân Bổ:</label>
          <textarea class="input-text-main" id="grant-reason" rows="2" 
                    placeholder="Ví dụ: Bổ sung chỉ tiêu mở rộng kinh doanh Quý 4/2026..."></textarea>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-outline" id="modal-cancel-btn">Hủy bỏ</button>
      <button class="btn btn-primary" id="grant-submit-btn">Xác nhận phân bổ</button>
    `;

    openModal('Phân Bổ Thêm Quota Cho Đơn Vị', bodyHtml, footerHtml);

    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-preset'), 10);
        const input = document.getElementById('grant-amount-input');
        if (input && val <= reserve) input.value = val;
      });
    });

    document.getElementById('grant-submit-btn').addEventListener('click', () => {
      const branchId = document.getElementById('grant-branch-select').value;
      const amount = parseInt(document.getElementById('grant-amount-input').value, 10);
      const reason = document.getElementById('grant-reason').value.trim() || 'Phân bổ thêm Quota';

      if (isNaN(amount) || amount <= 0 || amount > reserve) {
        showToast(`Số lượng Quota phân bổ (${amount}) không hợp lệ hoặc vượt quá Quỹ dự phòng hiện có (${reserve} Quota)`, 'error');
        return;
      }

      quickAddQuota(branchId, amount, reason);
      closeModal();
    });
  }

  // Modal Thu Hồi Quota Nhàn Rỗi Về Quỹ Dự Phòng (Dành cho Super Admin)
  function openRecallQuotaModal(branchId) {
    let targetBranch = null;
    let targetRegion = null;
    for (const r of state.orgTree.regions) {
      for (const b of r.branches) {
        if (b.id === branchId) {
          targetBranch = b;
          targetRegion = r;
          break;
        }
      }
      if (targetBranch) break;
    }
    if (!targetBranch) return;

    const stats = getBranchQuotaStats(branchId);
    const maxRecall = stats.available;

    if (maxRecall <= 0) {
      showToast(`Chi nhánh ${targetBranch.name} hiện không còn Quota trống để thu hồi`, 'warning');
      return;
    }

    const preset10 = maxRecall >= 10 ? `<button type="button" class="btn btn-outline btn-xs" data-recall-preset="10">10 Quota</button>` : '';
    const preset20 = maxRecall >= 20 ? `<button type="button" class="btn btn-outline btn-xs" data-recall-preset="20">20 Quota</button>` : '';
    const presetAll = `<button type="button" class="btn btn-outline btn-xs btn-warn" data-recall-preset="${maxRecall}">Tất cả (${maxRecall} Quota)</button>`;

    const bodyHtml = `
      <form id="form-recall-quota">
        <div class="modal-notice-banner mb-14" style="background-color: #fff7ed; border-color: #fed7aa;">
          <div class="notice-title num-orange" style="font-weight: 700;">Thu Hồi Quota Nhàn Rỗi Về Quỹ Dự Phòng</div>
          <div class="notice-desc" style="color: var(--text-main);">
            Đơn vị: <strong>${escapeHtml(targetBranch.name)} (${targetBranch.id})</strong> • Vùng: <strong>${escapeHtml(targetRegion.name)}</strong><br/>
            Hạn mức hiện tại: <strong>${targetBranch.totalQuota} Quota</strong> • Đang sử dụng thực tế: <strong>${stats.inUse} Quota</strong>.<br/>
            Số Quota nhàn rỗi tối đa có thể thu hồi: <strong class="num-green">${maxRecall} Quota</strong>.
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Chọn nhanh số lượng thu hồi:</label>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            ${preset10}
            ${preset20}
            ${presetAll}
          </div>
          <label class="form-label">Số Lượng Quota Cần Thu Hồi:</label>
          <input type="number" class="input-text-main" id="recall-amount-input" 
                 min="1" max="${maxRecall}" value="${Math.min(10, maxRecall)}" required>
          <div class="form-hint">
            Tối thiểu 1 Quota. Tối đa <strong>${maxRecall} Quota</strong> (đảm bảo giữ nguyên ${stats.inUse} tài khoản đang sử dụng).
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Lý do thu hồi về Quỹ dự phòng:</label>
          <textarea class="input-text-main" id="recall-reason" rows="2" 
                    placeholder="Ví dụ: Tối ưu hóa Quota nhàn rỗi về Quỹ dự phòng công ty..."></textarea>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-outline" id="modal-cancel-btn">Hủy bỏ</button>
      <button class="btn btn-danger" id="recall-submit-btn">Xác nhận thu hồi</button>
    `;

    openModal(`Thu Hồi Quota — ${targetBranch.name}`, bodyHtml, footerHtml);

    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    document.querySelectorAll('[data-recall-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-recall-preset'), 10);
        const input = document.getElementById('recall-amount-input');
        if (input && val <= maxRecall) input.value = val;
      });
    });

    document.getElementById('recall-submit-btn').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('recall-amount-input').value, 10);
      const reason = document.getElementById('recall-reason').value.trim() || 'Thu hồi Quota nhàn rỗi';

      if (isNaN(amount) || amount <= 0 || amount > maxRecall) {
        showToast(`Số lượng Quota thu hồi không hợp lệ (phải từ 1 đến ${maxRecall})`, 'error');
        return;
      }

      quickRecallQuota(branchId, amount, reason);
      closeModal();
    });
  }

  // Quick Add Quota (+10) from Central Reserve Pool
  function quickAddQuota(branchId, amount) {
    let branch = null;
    state.orgTree.regions.forEach(r => {
      r.branches.forEach(b => {
        if (b.id === branchId) branch = b;
      });
    });
    if (!branch) return;

    let totalAlloc = 0;
    state.orgTree.regions.forEach(r => r.branches.forEach(b => totalAlloc += (b.totalQuota || 0)));
    const reserve = Math.max(0, state.orgTree.totalCompanyQuota - totalAlloc);

    if (reserve < amount) {
      showToast(`Quỹ dự phòng công ty không đủ (còn ${reserve} Quota)`, 'error');
      return;
    }

    branch.totalQuota += amount;
    state.auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: '25/09/2026 14:30',
      actor: getActorName(),
      action: 'Cấp nhanh Quota chi nhánh',
      target: `${branch.name} (${branch.id})`,
      branch: `${branch.name} (${branch.id})`,
      impact: `Cấp thêm +${amount} Quota từ Quỹ dự phòng công ty. Hạn mức mới: ${branch.totalQuota}`
    });
    saveState();
    showToast(`Đã cấp thêm +${amount} Quota cho ${branch.name}`, 'success');
    renderApp();
  }

  // Quick Recall Quota back to Central Reserve Pool
  function quickRecallQuota(branchId, amount, reason) {
    let branch = null;
    state.orgTree.regions.forEach(r => {
      r.branches.forEach(b => {
        if (b.id === branchId) branch = b;
      });
    });
    if (!branch) return;

    const stats = getBranchQuotaStats(branchId);
    if (stats.available < amount) {
      showToast(`Không thể thu hồi vì chi nhánh chỉ còn ${stats.available} Quota trống (cần tối thiểu ${amount} trống)`, 'error');
      return;
    }

    if (branch.totalQuota - amount < stats.inUse) {
      showToast(`Không thể thu hồi vì số Quota sau thu hồi (${branch.totalQuota - amount}) sẽ thấp hơn số đang dùng (${stats.inUse})`, 'error');
      return;
    }

    branch.totalQuota -= amount;
    
    // Tính lại Quỹ dự phòng công ty sau khi thu hồi
    let totalAlloc = 0;
    state.orgTree.regions.forEach(r => r.branches.forEach(b => totalAlloc += (b.totalQuota || 0)));
    const newReserve = Math.max(0, state.orgTree.totalCompanyQuota - totalAlloc);

    state.auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: '25/09/2026 14:31',
      actor: getActorName(),
      action: 'Thu hồi Quota nhàn rỗi',
      target: `${branch.name} (${branch.id})`,
      branch: `${branch.name} (${branch.id})`,
      impact: `Thu hồi ${amount} Quota nhàn rỗi về Quỹ dự phòng công ty. Hạn mức mới chi nhánh: ${branch.totalQuota} Quota. Quỹ dự phòng tăng lên: ${newReserve} Quota.`
    });
    saveState();
    showToast(`Đã thu hồi ${amount} Quota từ ${branch.name} về Quỹ dự phòng công ty`, 'success');
    renderApp();
  }

  function openAdjustQuotaModal(regionId, branchId) {
    let targetBranch = null;
    let targetRegion = null;

    for (const r of state.orgTree.regions) {
      for (const b of r.branches) {
        if (b.id === branchId) {
          targetBranch = b;
          targetRegion = r;
          break;
        }
      }
      if (targetBranch) break;
    }

    if (!targetBranch) return;

    // Tính số quota hiện đang sử dụng thực tế chuẩn xác qua Engine
    const stats = getBranchQuotaStats(branchId);
    const currentUsed = stats.inUse;

    // Tính quota công ty dự phòng hiện tại
    let totalAllocated = 0;
    state.orgTree.regions.forEach(r => {
      r.branches.forEach(b => {
        totalAllocated += (b.totalQuota || 0);
      });
    });
    const currentReserve = Math.max(0, state.orgTree.totalCompanyQuota - totalAllocated);

    const bodyHtml = `
      <form id="form-adjust-quota">
        <div class="modal-notice-banner mb-14" style="background-color: #f8fafc; border-color: #cbd5e1;">
          <div class="notice-title" style="font-weight: 700; color: var(--text-main);">Đơn vị: ${escapeHtml(targetBranch.name)} (${targetBranch.id})</div>
          <div class="notice-desc">
            Thuộc <strong>${escapeHtml(targetRegion.name)}</strong> • Đang sử dụng: <strong>${currentUsed} Quota</strong> (${stats.active} Active, ${stats.pending} Pending, ${stats.suspended} Khóa).<br/>
            Quỹ dự phòng toàn công ty sẵn sàng cấp thêm: <strong class="num-green">${currentReserve} Quota</strong>.
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Hạn mức Quota hiện tại:</label>
          <input type="text" class="input-text-main" value="${targetBranch.totalQuota} Quota (Còn trống: ${stats.available} Quota)" disabled>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Hạn mức Quota mới đề xuất:</label>
          <input type="number" class="input-text-main" id="adjust-new-quota" 
                 min="${currentUsed}" max="${targetBranch.totalQuota + currentReserve}" 
                 value="${targetBranch.totalQuota}" required>
          <div class="form-hint">
            Tối thiểu ${currentUsed} Quota (không được thấp hơn số tài khoản đang dùng). Tối đa ${targetBranch.totalQuota + currentReserve} Quota (dựa theo Quỹ dự phòng công ty).
          </div>
        </div>

        <div class="form-group mb-14">
          <label class="form-label">Lý do điều chỉnh hạn mức:</label>
          <textarea class="input-text-main" id="adjust-quota-reason" rows="2" 
                    placeholder="Ví dụ: Bổ sung chỉ tiêu kinh doanh Quý 4/2026 hoặc thu hồi Quota nhàn rỗi..."></textarea>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-outline" id="modal-cancel-btn">Hủy bỏ</button>
      <button class="btn btn-primary" id="adjust-submit-btn">Xác nhận điều chỉnh</button>
    `;

    openModal(`Điều Chỉnh Quota — ${targetBranch.name}`, bodyHtml, footerHtml);

    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    document.getElementById('adjust-submit-btn').addEventListener('click', () => {
      const newQuotaVal = parseInt(document.getElementById('adjust-new-quota').value, 10);
      const reason = document.getElementById('adjust-quota-reason').value.trim() || 'Điều chỉnh hạn mức định kỳ';

      if (isNaN(newQuotaVal) || newQuotaVal < currentUsed) {
        showToast(`Hạn mức mới không được nhỏ hơn số Quota đang dùng (${currentUsed})`, 'error');
        return;
      }

      const diff = newQuotaVal - targetBranch.totalQuota;
      if (diff > currentReserve) {
        showToast(`Số Quota tăng (${diff}) vượt quá Quỹ dự phòng toàn công ty (${currentReserve})`, 'error');
        return;
      }

      const oldQuota = targetBranch.totalQuota;
      targetBranch.totalQuota = newQuotaVal;

      const actionType = diff > 0 ? 'Phân bổ thêm Quota' : (diff < 0 ? 'Thu hồi Quota nhàn rỗi' : 'Điều chỉnh hạn mức Quota');
      const actionDesc = diff > 0 ? `Cấp thêm +${diff} Quota từ Quỹ dự phòng.` : (diff < 0 ? `Thu hồi ${Math.abs(diff)} Quota về Quỹ dự phòng.` : 'Giữ nguyên hạn mức.');

      state.auditLogs.unshift({
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: '25/09/2026 14:10',
        actor: getActorName(),
        action: actionType,
        target: `${targetBranch.name} (${targetBranch.id})`,
        branch: `${targetBranch.name} (${targetBranch.id})`,
        impact: `${actionDesc} Hạn mức mới: ${newQuotaVal} Quota (cũ: ${oldQuota}). Lý do: ${reason}`
      });

      saveState();
      closeModal();
      showToast(`Đã cập nhật hạn mức Quota cho ${targetBranch.name}: ${newQuotaVal} Quota`, 'success');
      renderApp();
    });
  }

  function renderAuditLogView(container) {
    const isBranchAdmin = state.currentPersona === 'branch_admin';

    const filteredLogs = state.auditLogs.filter(log => {
      if (isBranchAdmin && !log.branch.includes('HCM-01')) return false;
      if (state.auditFilters.search) {
        const q = state.auditFilters.search.toLowerCase();
        const matchAct = log.actor.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchTarget = log.target.toLowerCase().includes(q);
        const matchBranch = log.branch.toLowerCase().includes(q);
        if (!matchAct && !matchAction && !matchTarget && !matchBranch) return false;
      }
      return true;
    });

    let html = `
      <div class="view-header">
        <div class="view-title-group">
          <div class="title-with-pill">
            <h1 class="view-page-title">Nhật ký Audit</h1>
            <span class="scope-pill-badge">${isBranchAdmin ? 'Chi nhánh HCM-01' : 'Toàn hệ thống'}</span>
          </div>
          <p class="view-page-desc">
            Sổ bộ kiểm toán ghi nhận mọi biến động tài khoản Zalo Enterprise, phục vụ tra soát tuân thủ và giải trình Quota.
          </p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-outline btn-sm" id="btn-export-audit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Xuất file kiểm toán</span>
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-card-header">
          <div class="table-card-titles">
            <h2 class="table-card-title">Lịch sử Thao tác Hành chính</h2>
            <span class="table-card-desc">Chuẩn 5 trường thông tin kiểm toán cốt lõi</span>
          </div>
          <div class="table-card-filters">
            <div class="table-search-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" class="input-sm" id="audit-search-input" 
                     placeholder="Tìm trong nhật ký..." value="${escapeHtml(state.auditFilters.search)}">
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 160px;">THỜI GIAN</th>
                <th style="width: 220px;">NGƯỜI THỰC HIỆN</th>
                <th style="width: 140px;">THAO TÁC</th>
                <th style="width: 280px;">NHÂN VIÊN & ACCOUNT</th>
                <th style="width: 200px;">CHI NHÁNH</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.length === 0 ? `
                <tr>
                  <td colspan="5" class="table-empty-cell">Chưa ghi nhận sự kiện nào trong sổ nhật ký.</td>
                </tr>
              ` : filteredLogs.map(l => `
                <tr>
                  <td><span class="text-secondary font-mono">${l.timestamp}</span></td>
                  <td><strong>${escapeHtml(l.actor)}</strong></td>
                  <td>${renderAuditActionBadge(l.action)}</td>
                  <td>
                    <div class="audit-target-group">
                      <span class="font-semibold">${escapeHtml(l.target)}</span>
                      <span class="audit-impact-note">${escapeHtml(l.impact || '')}</span>
                    </div>
                  </td>
                  <td><span class="branch-tag">${escapeHtml(l.branch)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-card-footer">
          <span class="footer-count-text">Tổng cộng <strong>${filteredLogs.length}</strong> sự kiện được ghi vết bất biến</span>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const auditSearch = document.getElementById('audit-search-input');
    if (auditSearch) {
      auditSearch.addEventListener('input', (e) => {
        state.auditFilters.search = e.target.value;
        renderApp();
      });
    }

    const exportBtn = document.getElementById('btn-export-audit');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        exportAuditCSV();
      });
    }
  }

  function renderAuditActionBadge(action) {
    if (action.includes('Cấp')) {
      return `<span class="audit-badge audit-badge-green">${action}</span>`;
    } else if (action.includes('Bàn giao')) {
      return `<span class="audit-badge audit-badge-blue">${action}</span>`;
    } else if (action.includes('Tạm khóa')) {
      return `<span class="audit-badge audit-badge-orange">${action}</span>`;
    } else if (action.includes('Mở khóa')) {
      return `<span class="audit-badge audit-badge-teal">${action}</span>`;
    } else if (action.includes('Thu hồi')) {
      return `<span class="audit-badge audit-badge-red">${action}</span>`;
    }
    return `<span class="audit-badge">${action}</span>`;
  }

  // =========================================================================
  // 7. SIDE DRAWER CONTROLLER (NGĂN TRƯỢT CẠNH PHẢI D-019)
  // =========================================================================

  function openSideDrawer(empId) {
    state.selectedDrawerId = empId;
    renderSideDrawer();
  }

  function closeSideDrawer() {
    state.selectedDrawerId = null;
    const drawer = document.getElementById('side-drawer');
    const backdrop = document.getElementById('side-drawer-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.style.display = 'none';
  }

  function renderSideDrawer() {
    const drawer = document.getElementById('side-drawer');
    const backdrop = document.getElementById('side-drawer-backdrop');
    if (!drawer || !backdrop) return;

    if (!state.selectedDrawerId) {
      drawer.classList.remove('open');
      backdrop.style.display = 'none';
      return;
    }

    const emp = state.employees.find(e => e.id === state.selectedDrawerId);
    if (!emp) {
      closeSideDrawer();
      return;
    }

    backdrop.style.display = 'block';
    drawer.classList.add('open');

    const drawerTitle = document.getElementById('drawer-title');
    const drawerSubtitle = document.getElementById('drawer-subtitle');
    if (drawerTitle) drawerTitle.textContent = emp.name;
    if (drawerSubtitle) drawerSubtitle.textContent = emp.email ? `${emp.code} • ${emp.email}` : `${emp.code} • Chưa cấp email`;

    const drawerBody = document.getElementById('drawer-body');
    if (drawerBody) {
      drawerBody.innerHTML = `
        ${emp.attentionReason ? `
          <div class="drawer-alert-banner">
            <div class="alert-icon">⚠</div>
            <div class="alert-text">
              <strong>Yêu cầu chú ý:</strong> ${escapeHtml(emp.attentionReason)}
            </div>
          </div>
        ` : ''}

        <div class="drawer-section-card">
          <div class="drawer-section-title">Hồ sơ Nhân sự Doanh nghiệp</div>
          <div class="drawer-info-grid">
            <div class="drawer-info-cell">
              <span class="drawer-cell-label">Họ và tên</span>
              <span class="drawer-cell-value">${escapeHtml(emp.name)}</span>
            </div>
            <div class="drawer-info-cell">
              <span class="drawer-cell-label">Mã nhân viên</span>
              <span class="drawer-cell-value font-mono">${emp.code}</span>
            </div>
            <div class="drawer-info-cell">
              <span class="drawer-cell-label">Email công ty</span>
              <span class="drawer-cell-value">${escapeHtml(emp.email || '— (Chưa cấp)')}</span>
            </div>
            <div class="drawer-info-cell">
              <span class="drawer-cell-label">Trạng thái nhân sự</span>
              <span class="drawer-cell-value">
                ${emp.employeeStatus === 'Terminated' ? '<span class="text-red font-semibold">Đã nghỉ việc</span>' : 'Đang làm việc'}
              </span>
            </div>
            <div class="drawer-info-cell">
              <span class="drawer-cell-label">Chi nhánh trực thuộc</span>
              <span class="drawer-cell-value">${escapeHtml(emp.branchName)} (${emp.branchId})</span>
            </div>
            <div class="drawer-info-cell">
              <span class="drawer-cell-label">Vùng</span>
              <span class="drawer-cell-value">${emp.region}</span>
            </div>
          </div>
        </div>

        <div class="drawer-section-card">
          <div class="drawer-section-title">Tài khoản Zalo Enterprise & Quota</div>
          ${emp.accountId ? `
            <div class="drawer-info-grid mb-14">
              <div class="drawer-info-cell">
                <span class="drawer-cell-label">Mã tài khoản Zalo</span>
                <span class="drawer-cell-value font-mono text-primary">${emp.accountId}</span>
              </div>
              <div class="drawer-info-cell">
                <span class="drawer-cell-label">Ngày cấp Zalo</span>
                <span class="drawer-cell-value">${emp.zaloAssignedDate || '—'}</span>
              </div>
              <div class="drawer-info-cell">
                <span class="drawer-cell-label">Trạng thái tài khoản</span>
                <span class="drawer-cell-value">
                  ${emp.accountStatus === 'Active' ? '<span class="num-green font-semibold">Đang hoạt động</span>' : (emp.accountStatus === 'Pending' ? '<span class="font-semibold" style="color: #d97706;">Chờ kích hoạt</span>' : '<span class="num-red font-semibold">Tạm khóa</span>')}
                </span>
              </div>
              <div class="drawer-info-cell">
                <span class="drawer-cell-label">Tình trạng tài khoản</span>
                <span class="drawer-cell-value text-primary font-semibold">Đã phân bổ</span>
              </div>
              <div class="drawer-info-cell">
                <span class="drawer-cell-label">Hoạt động gần nhất</span>
                <span class="drawer-cell-value">${emp.lastActiveDate || '—'}</span>
              </div>
            </div>

            <div class="drawer-leads-highlight">
              <div>
                <div class="drawer-cell-label">Khách hàng & Leads tích lũy</div>
                <div class="text-secondary text-sm">Số lượng hội thoại/leads gắn liền với tài khoản</div>
              </div>
              <div class="drawer-leads-number">★ ${emp.leadCount}</div>
            </div>
          ` : `
            <div class="empty-state-box">
              Nhân viên hiện chưa được cấp tài khoản Zalo Enterprise. Chưa tiêu tốn Quota nào.
            </div>
          `}
        </div>

        <div class="drawer-section-card">
          <div class="drawer-section-title">Lịch sử Thao tác Gần nhất</div>
          <div class="drawer-timeline">
            ${getEmployeeTimeline(emp).map(step => `
              <div class="timeline-step">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <span class="timeline-time">${escapeHtml(step.time)}</span>
                  ${step.actor ? `<span class="timeline-actor">👤 Người thực hiện: <strong>${escapeHtml(step.actor)}</strong></span>` : ''}
                </div>
                <span class="timeline-desc">${escapeHtml(step.desc)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    const drawerFooter = document.getElementById('drawer-footer');
    if (drawerFooter) {
      if (emp.accountStatus === 'Unassigned') {
        drawerFooter.innerHTML = `
          <button class="btn btn-outline" id="drawer-btn-close">Đóng</button>
          <button class="btn btn-primary" id="drawer-btn-assign">Cấp account</button>
        `;
      } else if (emp.accountStatus === 'Pending') {
        drawerFooter.innerHTML = `
          <button class="btn btn-outline" id="drawer-btn-close">Đóng</button>
          <button class="btn btn-outline btn-danger" id="drawer-btn-revoke">Thu hồi</button>
          <button class="btn btn-outline btn-warn" id="drawer-btn-remind">Gửi nhắc nhở</button>
          <button class="btn btn-primary" id="drawer-btn-activate">Kích hoạt ngay</button>
        `;
        const btnClose = document.getElementById('drawer-btn-close');
        if (btnClose) btnClose.addEventListener('click', closeSideDrawer);
        const btnRevoke = document.getElementById('drawer-btn-revoke');
        if (btnRevoke) btnRevoke.addEventListener('click', () => { closeSideDrawer(); openRevokeModal(emp.id); });
        const btnRemind = document.getElementById('drawer-btn-remind');
        if (btnRemind) btnRemind.addEventListener('click', () => {
          state.auditLogs.unshift({
            id: `LOG-${Date.now().toString().slice(-4)}`,
            timestamp: '25/09/2026 14:25',
            actor: getActorName(),
            action: 'Nhắc nhở kích hoạt tài khoản',
            target: `${emp.name} (${emp.accountId})`,
            branch: `${emp.branchName} (${emp.branchId})`,
            impact: `Gửi nhắc nhở kích hoạt qua Side Drawer tới ${emp.email}`
          });
          state.selectedDrawerId = emp.id;
          saveState();
          showToast(`Đã gửi thông báo nhắc kích hoạt tới ${emp.email}`, 'success');
          renderApp();
          openSideDrawer(emp.id);
        });
        const btnActivate = document.getElementById('drawer-btn-activate');
        if (btnActivate) btnActivate.addEventListener('click', () => {
          emp.accountStatus = 'Active';
          emp.attentionReason = null;
          emp.pendingOverdue = false;
          state.auditLogs.unshift({
            id: `LOG-${Date.now().toString().slice(-4)}`,
            timestamp: '25/09/2026 14:26',
            actor: getActorName(),
            action: 'Kích hoạt tài khoản Zalo',
            target: `${emp.name} (${emp.accountId})`,
            branch: `${emp.branchName} (${emp.branchId})`,
            impact: 'Kích hoạt thành công tài khoản Zalo Enterprise qua Side Drawer'
          });
          state.selectedDrawerId = emp.id;
          saveState();
          showToast(`Đã kích hoạt thành công tài khoản ${emp.accountId}`, 'success');
          renderApp();
          openSideDrawer(emp.id);
        });
      } else if (emp.accountStatus === 'Active') {
        drawerFooter.innerHTML = `
          <button class="btn btn-outline" id="drawer-btn-close">Đóng</button>
          <button class="btn btn-outline btn-warn" id="drawer-btn-suspend">Tạm khóa</button>
          <button class="btn btn-outline btn-danger" id="drawer-btn-revoke">Thu hồi</button>
          <button class="btn btn-primary" id="drawer-btn-handover">Bàn giao tài khoản</button>
        `;
      } else if (emp.accountStatus === 'Suspended') {
        drawerFooter.innerHTML = `
          <button class="btn btn-outline" id="drawer-btn-close">Đóng</button>
          <button class="btn btn-outline btn-danger" id="drawer-btn-revoke">Thu hồi</button>
          <button class="btn btn-primary" id="drawer-btn-unlock">Mở khóa tài khoản</button>
        `;
      } else {
        drawerFooter.innerHTML = `
          <button class="btn btn-outline" id="drawer-btn-close">Đóng</button>
        `;
      }

      const btnClose = document.getElementById('drawer-btn-close');
      if (btnClose) btnClose.addEventListener('click', closeSideDrawer);

      const btnAssign = document.getElementById('drawer-btn-assign');
      if (btnAssign) btnAssign.addEventListener('click', () => { closeSideDrawer(); openAssignModal(emp.id); });

      const btnHandover = document.getElementById('drawer-btn-handover');
      if (btnHandover) btnHandover.addEventListener('click', () => { closeSideDrawer(); openHandoverModal(emp.id); });

      const btnSuspend = document.getElementById('drawer-btn-suspend');
      if (btnSuspend) btnSuspend.addEventListener('click', () => { closeSideDrawer(); openSuspendModal(emp.id); });

      const btnUnlock = document.getElementById('drawer-btn-unlock');
      if (btnUnlock) btnUnlock.addEventListener('click', () => { closeSideDrawer(); openUnlockModal(emp.id); });

      const btnRevoke = document.getElementById('drawer-btn-revoke');
      if (btnRevoke) btnRevoke.addEventListener('click', () => { closeSideDrawer(); openRevokeModal(emp.id); });
    }

    const closeBtnTop = document.getElementById('drawer-close-btn');
    if (closeBtnTop) closeBtnTop.addEventListener('click', closeSideDrawer);
    backdrop.addEventListener('click', closeSideDrawer);
  }

  function getEmployeeTimeline(emp) {
    const steps = [];

    // 1. Lấy tất cả lịch sử thao tác liên quan đến nhân sự này hoặc tài khoản của họ từ auditLogs
    if (state.auditLogs && Array.isArray(state.auditLogs)) {
      state.auditLogs.forEach(log => {
        const matchName = emp.name && log.target && log.target.includes(emp.name);
        const matchAcc = emp.accountId && log.target && log.target.includes(emp.accountId);
        if (matchName || matchAcc) {
          steps.push({
            time: log.timestamp || '25/09/2026',
            desc: `${log.action}: ${log.impact || log.target}`,
            actor: log.actor || 'Super Admin'
          });
        }
      });
    }

    // 2. Nếu chưa có mốc cấp phát trong auditLogs và nhân sự đã có tài khoản
    if (emp.zaloAssignedDate) {
      const hasAssign = steps.some(s => s.desc.toLowerCase().includes('cấp') || s.desc.toLowerCase().includes('bàn giao'));
      if (!hasAssign) {
        steps.push({
          time: `${emp.zaloAssignedDate} 09:00`,
          desc: `Khởi tạo & cấp phát tài khoản ${emp.accountId || ''}`,
          actor: 'Vũ Minh Tuấn (Super Admin)'
        });
      }
    }

    // 3. Nếu đang bị tạm khóa nhưng chưa có log khóa
    if (emp.accountStatus === 'Suspended') {
      const hasSuspend = steps.some(s => s.desc.toLowerCase().includes('khóa'));
      if (!hasSuspend) {
        steps.push({
          time: '14/09/2026 14:00',
          desc: `Tạm khóa tài khoản do ${emp.attentionReason || 'yêu cầu hành chính'}`,
          actor: 'Lê Hoàng Nam (Admin Chi nhánh)'
        });
      }
    }

    // 4. Nếu đã bàn giao nhưng chưa có log bàn giao
    if (emp.accountStatus === 'HandedOver') {
      const hasHandover = steps.some(s => s.desc.toLowerCase().includes('bàn giao'));
      if (!hasHandover) {
        steps.push({
          time: '10/09/2026 10:30',
          desc: `Bàn giao tài khoản Zalo sang nhân sự ${emp.handedOverTo || 'mới'}`,
          actor: 'Lê Hoàng Nam (Admin Chi nhánh)'
        });
      }
    }

    // 5. Nếu có hoạt động gần nhất
    if (emp.lastActiveDate) {
      steps.push({
        time: `${emp.lastActiveDate} 16:45`,
        desc: 'Tương tác khách hàng: Gửi/nhận tin nhắn Zalo Enterprise gần nhất',
        actor: `${emp.name} (Nhân viên)`
      });
    }

    if (steps.length === 0) {
      steps.push({
        time: 'Hôm nay',
        desc: 'Chưa có lịch sử phát sinh giao dịch Quota',
        actor: 'Hệ thống Quota'
      });
    }

    return steps;
  }

  // =========================================================================
  // 8. MODAL CONTROLLERS & WORKFLOW NGHIỆP VỤ (D-014, D-015)
  // =========================================================================

  function openAssignModal(preselectedEmpId = null, preferredAccountId = null) {
    const isBranchAdmin = state.currentPersona === 'branch_admin';
    const targetBranch = isBranchAdmin ? 'HCM-01' : (state.quotaFilters.branch !== 'ALL' ? state.quotaFilters.branch : 'HCM-01');

    const candidates = state.employees.filter(e => e.branchId === targetBranch && e.accountStatus === 'Unassigned');
    const branchStats = getBranchQuotaStats(targetBranch);
    const revokedInBranch = state.revokedAccounts.filter(r => r.branchId === targetBranch);

    if (branchStats.available <= 0 && revokedInBranch.length === 0) {
      openModal({
        title: 'Chi nhánh đã hết Quota khả dụng',
        content: `
          <div class="impact-box" style="border-left: 4px solid var(--color-red);">
            <strong>Cảnh báo:</strong> Chi nhánh <strong>${branchStats.branchName}</strong> hiện có 0 Quota chưa sử dụng và không còn tài khoản thu hồi nào trong kho.
            Không thể thực hiện cấp mới cho nhân sự vào thời điểm này.
          </div>
        `,
        confirmText: 'Đã hiểu',
        confirmClass: 'btn-outline',
        onConfirm: () => closeModal()
      });
      return;
    }

    let defaultEmpId = preselectedEmpId || (candidates.length > 0 ? candidates[0].id : '');
    let defaultAccMode = preferredAccountId ? 'REVOKED' : (revokedInBranch.length > 0 ? 'REVOKED' : 'NEW');
    let selectedRevokedAcc = preferredAccountId || (revokedInBranch.length > 0 ? revokedInBranch[0].accountId : '');

    const renderContent = () => `
      <div class="form-field mb-14">
        <label class="form-label">Chọn nhân viên nhận tài khoản:</label>
        ${candidates.length === 0 ? `
          <div class="empty-state-box">Không còn nhân sự nào ở trạng thái 'Chưa cấp' trong chi nhánh này.</div>
        ` : `
          <select class="form-select-box" id="assign-emp-select">
            ${candidates.map(c => `
              <option value="${c.id}" ${c.id === defaultEmpId ? 'selected' : ''}>
                ${escapeHtml(c.name)} (${c.code}) — ${escapeHtml(c.email)}
              </option>
            `).join('')}
          </select>
        `}
      </div>

      <div class="form-field mb-14">
        <label class="form-label">Phương thức cấp tài khoản Zalo Enterprise:</label>
        
        <div class="grant-method-card priority-card ${defaultAccMode === 'REVOKED' ? 'selected' : ''}" id="card-mode-revoked">
          <div class="flex-between">
            <strong>★ Tái cấp từ Kho tài khoản đã thu hồi (Bảo tồn Leads)</strong>
            <span class="badge-priority-leads">Khuyên dùng</span>
          </div>
          <p class="text-secondary text-sm mt-4">
            Gán tài khoản cũ đã thu hồi kèm toàn bộ danh bạ/leads khách hàng tồn dư cho nhân viên mới tiếp quản.
          </p>
          ${revokedInBranch.length > 0 ? `
            <div class="mt-8" id="revoked-dropdown-wrap" style="${defaultAccMode === 'REVOKED' ? '' : 'display:none;'}">
              <select class="form-select-box" id="assign-revoked-account-select">
                ${revokedInBranch.map(r => `
                  <option value="${r.accountId}" ${r.accountId === selectedRevokedAcc ? 'selected' : ''}>
                    ${r.accountId} — ${r.leadCount} Leads (Chủ cũ: ${escapeHtml(r.previousOwnerName)})
                  </option>
                `).join('')}
              </select>
            </div>
          ` : `
            <span class="text-muted text-xs mt-4 block">(Hiện kho chi nhánh không có account đã thu hồi nào)</span>
          `}
        </div>

        <div class="grant-method-card mt-8 ${defaultAccMode === 'NEW' ? 'selected' : ''}" id="card-mode-new">
          <div class="flex-between">
            <strong>Cấp tài khoản Zalo Enterprise mới hoàn toàn</strong>
            <span class="text-muted text-xs">Còn ${branchStats.available} Quota trống</span>
          </div>
          <p class="text-secondary text-sm mt-4">
            Hệ thống sẽ cấp 1 mã ZENT mới và trừ trực tiếp 1 điểm Quota khả dụng của chi nhánh.
          </p>
        </div>
      </div>

      <div class="impact-box">
        <div class="impact-box-title">Tác động Quota & Vận hành:</div>
        <div class="impact-item">
          <span>Chi nhánh áp dụng:</span>
          <strong>${branchStats.branchName} (${targetBranch})</strong>
        </div>
        <div class="impact-item">
          <span>Biến động Quota khả dụng:</span>
          <strong class="num-green">-1 Quota (Đang dùng +1)</strong>
        </div>
        <div class="impact-item">
          <span>Trạng thái sau cấp:</span>
          <strong class="num-green">Đang hoạt động (Active)</strong>
        </div>
      </div>
    `;

    openModal({
      title: 'Cấp Tài Khoản Zalo Enterprise',
      content: renderContent(),
      confirmText: 'Xác nhận cấp account',
      confirmClass: 'btn-primary',
      onConfirm: () => {
        const empSelect = document.getElementById('assign-emp-select');
        if (!empSelect) return;
        const empId = empSelect.value;
        const emp = state.employees.find(e => e.id === empId);
        if (!emp) return;

        let finalAccountId = '';
        let assignedLeads = 0;

        if (defaultAccMode === 'REVOKED' && revokedInBranch.length > 0) {
          const revSelect = document.getElementById('assign-revoked-account-select');
          finalAccountId = revSelect ? revSelect.value : selectedRevokedAcc;
          const revIndex = state.revokedAccounts.findIndex(r => r.accountId === finalAccountId);
          if (revIndex !== -1) {
            assignedLeads = state.revokedAccounts[revIndex].leadCount;
            state.revokedAccounts.splice(revIndex, 1);
          }
        } else {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          finalAccountId = `ZENT-00${randomSuffix}`;
          assignedLeads = 0;
        }

        emp.accountId = finalAccountId;
        emp.accountStatus = 'Active';
        emp.zaloAssignedDate = '25/09/2026';
        emp.leadCount = assignedLeads;
        emp.lastActiveDate = '25/09/2026';
        emp.attentionReason = null;

        state.auditLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: '25/09/2026 11:35',
          actor: getActorName(),
          action: defaultAccMode === 'REVOKED' ? 'Tái cấp account' : 'Cấp mới account',
          target: `${emp.name} (${finalAccountId})`,
          branch: `${emp.branchName} (${emp.branchId})`,
          impact: defaultAccMode === 'REVOKED' ? `Tái cấp kèm ${assignedLeads} leads (Đang dùng +1, Chưa dùng -1)` : 'Cấp mới hoàn toàn (Đang dùng +1, Chưa dùng -1)'
        });

        state.selectedDrawerId = emp.id;
        saveState();
        closeModal();
        showToast(`Đã cấp thành công tài khoản ${finalAccountId} cho ${emp.name}`, 'success');
        renderApp();
        openSideDrawer(emp.id);
      }
    });

    setTimeout(() => {
      const cardRevoked = document.getElementById('card-mode-revoked');
      const cardNew = document.getElementById('card-mode-new');
      const revWrap = document.getElementById('revoked-dropdown-wrap');

      if (cardRevoked && revokedInBranch.length > 0) {
        cardRevoked.addEventListener('click', () => {
          defaultAccMode = 'REVOKED';
          cardRevoked.classList.add('selected');
          if (cardNew) cardNew.classList.remove('selected');
          if (revWrap) revWrap.style.display = 'block';
        });
      }

      if (cardNew) {
        cardNew.addEventListener('click', () => {
          defaultAccMode = 'NEW';
          cardNew.classList.add('selected');
          if (cardRevoked) cardRevoked.classList.remove('selected');
          if (revWrap) revWrap.style.display = 'none';
        });
      }
    }, 50);
  }

  function openReassignRevokedModal(accountId) {
    const rev = state.revokedAccounts.find(r => r.accountId === accountId);
    if (!rev) return;
    openAssignModal(null, accountId);
  }

  function openHandoverModal(sourceEmpId) {
    const sourceEmp = state.employees.find(e => e.id === sourceEmpId);
    if (!sourceEmp) return;

    if (sourceEmp.accountStatus === 'Suspended') {
      openModal({
        title: 'Yêu cầu Mở khóa trước khi Bàn giao',
        content: `
          <div class="impact-box" style="border-left: 4px solid var(--color-orange);">
            Tài khoản <strong>${sourceEmp.accountId}</strong> hiện đang ở trạng thái <strong>Tạm khóa</strong>.
            Theo quy định bảo mật, Admin bắt buộc phải thực hiện <strong>Mở khóa tài khoản</strong> trước rồi mới được phép tiến hành bàn giao sang nhân sự khác.
          </div>
        `,
        confirmText: 'Mở khóa ngay',
        confirmClass: 'btn-primary',
        onConfirm: () => {
          closeModal();
          openUnlockModal(sourceEmp.id);
        }
      });
      return;
    }

    const candidates = state.employees.filter(e => e.branchId === sourceEmp.branchId && e.id !== sourceEmp.id && e.accountStatus === 'Unassigned');

    if (candidates.length === 0) {
      openModal({
        title: 'Không có nhân sự tiếp nhận phù hợp',
        content: `
          <div class="impact-box">
            Không tìm thấy nhân viên nào ở trạng thái <strong>Chưa cấp account</strong> trong cùng chi nhánh <strong>${sourceEmp.branchName}</strong>.
            Bạn có thể thực hiện <strong>Thu hồi tài khoản</strong> để đưa về kho lưu trữ và bảo tồn ${sourceEmp.leadCount} leads khách hàng chờ tái cấp sau.
          </div>
        `,
        confirmText: 'Đóng',
        confirmClass: 'btn-outline',
        onConfirm: () => closeModal()
      });
      return;
    }

    openModal({
      title: 'Bàn Giao Tài Khoản Zalo Enterprise',
      content: `
        <div class="impact-box mb-14" style="border-left: 4px solid var(--primary);">
          Bàn giao tài khoản <strong>${sourceEmp.accountId}</strong> cùng toàn bộ <strong>${sourceEmp.leadCount} leads khách hàng</strong> từ <strong>${escapeHtml(sourceEmp.name)}</strong> sang nhân sự tiếp nhận mới trong cùng chi nhánh.
        </div>

        <div class="form-field mb-14">
          <label class="form-label">Chọn nhân sự tiếp nhận trong chi nhánh:</label>
          <select class="form-select-box" id="handover-target-select">
            ${candidates.map(c => `
              <option value="${c.id}">${escapeHtml(c.name)} (${c.code}) — ${escapeHtml(c.email)}</option>
            `).join('')}
          </select>
        </div>

        <div class="impact-box">
          <div class="impact-box-title">Tác động Nghiệp vụ & Quota:</div>
          <div class="impact-item">
            <span>Tài khoản bàn giao:</span>
            <strong class="font-mono">${sourceEmp.accountId}</strong>
          </div>
          <div class="impact-item">
            <span>Biến động Quota chi nhánh:</span>
            <strong class="num-green">0 Quota (Không đổi)</strong>
          </div>
          <div class="impact-item">
            <span>Trạng thái người cũ (${sourceEmp.name}):</span>
            <strong>Đã bàn giao</strong>
          </div>
          <div class="impact-item">
            <span>Trạng thái người mới:</span>
            <strong class="num-green">Đang hoạt động (Active)</strong>
          </div>
        </div>
      `,
      confirmText: 'Xác nhận bàn giao',
      confirmClass: 'btn-primary',
      onConfirm: () => {
        const targetSelect = document.getElementById('handover-target-select');
        if (!targetSelect) return;
        const targetEmpId = targetSelect.value;
        const targetEmp = state.employees.find(e => e.id === targetEmpId);
        if (!targetEmp) return;

        const accId = sourceEmp.accountId;
        const leads = sourceEmp.leadCount;

        targetEmp.accountId = accId;
        targetEmp.accountStatus = 'Active';
        targetEmp.zaloAssignedDate = '25/09/2026';
        targetEmp.leadCount = leads;
        targetEmp.lastActiveDate = '25/09/2026';
        targetEmp.attentionReason = null;

        sourceEmp.accountId = null;
        sourceEmp.accountStatus = 'Unassigned';
        sourceEmp.accountId = null;
        sourceEmp.email = null; // Mất tài khoản thì không còn email
        sourceEmp.leadCount = 0;
        sourceEmp.attentionReason = null;
        sourceEmp.zaloAssignedDate = null;

        targetEmp.accountId = accId;
        targetEmp.email = targetEmp.email || (targetEmp.name.toLowerCase().replace(/\s+/g, '') + '@fpt.com.vn');
        targetEmp.accountStatus = 'Pending'; // Người mới ở trạng thái Chờ kích hoạt
        targetEmp.zaloAssignedDate = '25/09/2026';
        targetEmp.pendingAssignedAt = '25/09/2026 14:35';
        targetEmp.pendingHours = 0;
        targetEmp.pendingOverdue = false;
        targetEmp.attentionReason = null;

        state.auditLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: '25/09/2026 11:36',
          actor: getActorName(),
          action: 'Bàn giao',
          target: `${sourceEmp.name} ➔ ${targetEmp.name} (${accId})`,
          branch: `${sourceEmp.branchName} (${sourceEmp.branchId})`,
          impact: `Quota giữ nguyên (Chuyển quyền sở hữu kèm ${leads} leads)`
        });

        state.selectedDrawerId = targetEmp.id;
        saveState();
        closeModal();
        showToast(`Đã bàn giao tài khoản ${accId} cho ${targetEmp.name}`, 'success');
        renderApp();
        openSideDrawer(targetEmp.id);
      }
    });
  }

  function openSuspendModal(empId) {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;

    openModal({
      title: 'Tạm Khóa Tài Khoản Zalo Enterprise',
      content: `
        <div class="impact-box mb-14" style="border-left: 4px solid var(--color-orange);">
          Bạn đang thực hiện tạm khóa tài khoản <strong>${emp.accountId}</strong> của nhân sự <strong>${escapeHtml(emp.name)}</strong>.
          Nhân viên sẽ không thể đăng nhập hoặc trao đổi với khách hàng trên Zalo Enterprise.
        </div>

        <div class="form-field mb-14">
          <label class="form-label">Lý do tạm khóa:</label>
          <select class="form-select-box mb-8" id="suspend-reason-preset">
            <option value="Tạm đình chỉ phục vụ thanh tra nội bộ">Tạm đình chỉ phục vụ thanh tra nội bộ</option>
            <option value="Nhân viên nghỉ phép dài hạn / thai sản">Nhân viên nghỉ phép dài hạn / thai sản</option>
            <option value="Vi phạm quy chuẩn giao tiếp với khách hàng">Vi phạm quy chuẩn giao tiếp với khách hàng</option>
            <option value="Yêu cầu từ phòng Pháp chế & KSNB">Yêu cầu từ phòng Pháp chế & KSNB</option>
          </select>
        </div>

        <div class="impact-box">
          <div class="impact-box-title">Tác động Quota (Bất biến):</div>
          <div class="impact-item">
            <span>Biến động Quota khả dụng:</span>
            <strong>Không ảnh hưởng chỉ tiêu chi nhánh</strong>
          </div>
          <div class="impact-item">
            <span>Trạng thái sau thao tác:</span>
            <strong class="num-red">Tạm khóa (Suspended)</strong>
          </div>
        </div>
      `,
      confirmText: 'Xác nhận tạm khóa',
      confirmClass: 'btn-outline btn-warn',
      onConfirm: () => {
        const reasonSelect = document.getElementById('suspend-reason-preset');
        const reason = reasonSelect ? reasonSelect.value : 'Tạm khóa theo quy định';

        emp.accountStatus = 'Suspended';
        emp.attentionReason = reason;

        state.auditLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: '25/09/2026 11:37',
          actor: getActorName(),
          action: 'Tạm khóa',
          target: `${emp.name} (${emp.accountId})`,
          branch: `${emp.branchName} (${emp.branchId})`,
          impact: 'Tạm khóa tài khoản'
        });

        state.selectedDrawerId = emp.id;
        saveState();
        closeModal();
        showToast(`Đã tạm khóa tài khoản ${emp.accountId}`, 'warning');
        renderApp();
        openSideDrawer(emp.id);
      }
    });
  }

  function openUnlockModal(empId) {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp) return;

    openModal({
      title: 'Mở Khóa Tài Khoản Zalo Enterprise',
      content: `
        <div class="impact-box">
          Xác nhận khôi phục trạng thái hoạt động cho tài khoản <strong>${emp.accountId}</strong> của nhân sự <strong>${escapeHtml(emp.name)}</strong>.
          Nhân viên có thể đăng nhập và tiếp tục công tác ngay lập tức.
        </div>
      `,
      confirmText: 'Xác nhận mở khóa',
      confirmClass: 'btn-primary',
      onConfirm: () => {
        emp.accountStatus = 'Active';
        emp.attentionReason = null;

        state.auditLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: '25/09/2026 11:38',
          actor: getActorName(),
          action: 'Mở khóa',
          target: `${emp.name} (${emp.accountId})`,
          branch: `${emp.branchName} (${emp.branchId})`,
          impact: 'Quota giữ nguyên'
        });

        state.selectedDrawerId = emp.id;
        saveState();
        closeModal();
        showToast(`Đã mở khóa tài khoản ${emp.accountId}`, 'success');
        renderApp();
        openSideDrawer(emp.id);
      }
    });
  }

  function openRevokeModal(empId) {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp || !emp.accountId) return;

    openModal({
      title: 'Thu Hồi Tài Khoản Về Quỹ Doanh Nghiệp',
      content: `
        <div class="impact-box mb-14" style="border-left: 4px solid var(--color-red);">
          Bạn đang thu hồi tài khoản <strong>${emp.accountId}</strong> từ <strong>${escapeHtml(emp.name)}</strong>.
          Tài khoản cùng <strong>${emp.leadCount} leads khách hàng</strong> sẽ được chuyển vào <strong>Kho tài khoản đã thu hồi</strong> của chi nhánh để sẵn sàng tái cấp.
        </div>

        <div class="form-field mb-14">
          <label class="form-label">Lý do thu hồi:</label>
          <select class="form-select-box" id="revoke-reason-select">
            <option value="Nhân viên đã chính thức chấm dứt hợp đồng">Nhân viên đã chính thức chấm dứt hợp đồng</option>
            <option value="Thu hồi điều tiết Quota chi nhánh">Thu hồi điều tiết Quota chi nhánh</option>
            <option value="Nhân viên chuyển vị trí không cần dùng Zalo">Nhân viên chuyển vị trí không cần dùng Zalo</option>
          </select>
        </div>

        <div class="impact-box">
          <div class="impact-box-title">Tác động Quota & Kho dữ liệu:</div>
          <div class="impact-item">
            <span>Hoàn trả Quota trống:</span>
            <strong class="num-green">+1 Quota khả dụng (Đang dùng -1)</strong>
          </div>
          <div class="impact-item">
            <span>Bảo tồn Leads khách hàng:</span>
            <strong class="text-primary font-semibold">${emp.leadCount} leads lưu vào Kho thu hồi</strong>
          </div>
          <div class="impact-item">
            <span>Trạng thái nhân sự cũ:</span>
            <strong>Chưa cấp (Unassigned)</strong>
          </div>
        </div>
      `,
      confirmText: 'Xác nhận thu hồi',
      confirmClass: 'btn-outline btn-danger',
      onConfirm: () => {
        const reasonSelect = document.getElementById('revoke-reason-select');
        const reason = reasonSelect ? reasonSelect.value : 'Thu hồi tài khoản';
        const accId = emp.accountId;
        const leads = emp.leadCount;

        state.revokedAccounts.unshift({
          accountId: accId,
          branchId: emp.branchId,
          branchName: emp.branchName,
          region: emp.region,
          revokedAt: '25/09/2026',
          previousOwnerName: emp.name,
          previousOwnerEmail: emp.email,
          leadCount: leads,
          note: `Thu hồi từ ${emp.name}: ${reason}`
        });

        emp.accountId = null;
        emp.accountStatus = 'Unassigned';
        emp.zaloAssignedDate = null;
        emp.leadCount = 0;
        emp.attentionReason = null;

        state.auditLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: '25/09/2026 11:39',
          actor: getActorName(),
          action: 'Thu hồi',
          target: `${emp.name} (${accId})`,
          branch: `${emp.branchName} (${emp.branchId})`,
          impact: `Chưa dùng +1 (Lưu ${leads} leads vào kho thu hồi)`
        });

        state.selectedDrawerId = emp.id;
        saveState();
        closeModal();
        showToast(`Đã thu hồi tài khoản ${accId}, hoàn trả 1 Quota về quỹ`, 'success');
        renderApp();
        openSideDrawer(emp.id);
      }
    });
  }

  // =========================================================================
  // 9. MODAL GENERIC ENGINE & TOAST HUB
  // =========================================================================

  function openModal(optionsOrTitle, contentHtml, footerHtml) {
    const modal = document.getElementById('app-modal');
    if (!modal) return;

    let title = '';
    let content = '';
    let confirmText = 'Xác nhận';
    let confirmClass = 'btn-primary';
    let onConfirm = null;
    let customFooter = null;

    if (typeof optionsOrTitle === 'object' && optionsOrTitle !== null) {
      title = optionsOrTitle.title || '';
      content = optionsOrTitle.content || optionsOrTitle.body || '';
      confirmText = optionsOrTitle.confirmText || 'Xác nhận';
      confirmClass = optionsOrTitle.confirmClass || 'btn-primary';
      onConfirm = optionsOrTitle.onConfirm || null;
      customFooter = optionsOrTitle.footer || null;
    } else {
      title = optionsOrTitle || '';
      content = contentHtml || '';
      customFooter = footerHtml || null;
    }

    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = title;

    const bodyEl = document.getElementById('modal-body');
    if (bodyEl) bodyEl.innerHTML = content;

    const footerEl = document.getElementById('modal-footer');
    if (footerEl) {
      if (customFooter) {
        footerEl.innerHTML = customFooter;
      } else {
        footerEl.innerHTML = `
          <button class="btn btn-outline" id="modal-btn-cancel">Hủy bỏ</button>
          <button class="btn ${confirmClass}" id="modal-btn-confirm">${confirmText}</button>
        `;
        const btnCancel = document.getElementById('modal-btn-cancel');
        if (btnCancel) btnCancel.onclick = closeModal;
        const btnConfirm = document.getElementById('modal-btn-confirm');
        if (btnConfirm && onConfirm) btnConfirm.onclick = onConfirm;
      }
    }

    modal.style.display = 'flex';

    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.onclick = closeModal;

    const customCancelBtn = document.getElementById('modal-cancel-btn');
    if (customCancelBtn) customCancelBtn.onclick = closeModal;
  }

  function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.style.display = 'none';
  }

  function showToast(message, type = 'info') {
    const hub = document.getElementById('toast-hub');
    if (!hub) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    hub.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => { if (toast && toast.remove) toast.remove(); }, 300);
    }, 3200);
  }

  // =========================================================================
  // 10. TIỆN ÍCH XUẤT CSV & ĐỔI ROLE PERSONA
  // =========================================================================

  function exportQuotaCSV() {
    const rows = [
      ['VUNG', 'CHI_NHANH', 'MA_CHI_NHANH', 'TONG_QUOTA', 'DANG_DUNG', 'CHUA_DUNG', 'TAM_KHOA', 'CAN_CHU_Y', 'TY_LE_SU_DUNG_PCT']
    ];

    for (const r of state.orgTree.regions) {
      for (const b of r.branches) {
        const stats = getBranchQuotaStats(b.id);
        rows.push([
          stats.regionId,
          stats.branchName,
          stats.branchId,
          stats.totalQuota,
          stats.inUse,
          stats.available,
          stats.suspended,
          stats.attention,
          stats.utilization
        ]);
      }
    }

    downloadCSV(rows, 'Z_Enterprise_Quota_Allocation.csv');
    showToast('Đã xuất báo cáo Quota thành công', 'success');
  }

  function exportAuditCSV() {
    const rows = [
      ['THOI_GIAN', 'NGUOI_THUC_HIEN', 'THAO_TAC', 'NHAN_VIEN_ACCOUNT', 'CHI_NHANH', 'TAC_DONG_QUOTA']
    ];

    state.auditLogs.forEach(l => {
      rows.push([
        l.timestamp,
        l.actor,
        l.action,
        l.target,
        l.branch,
        l.impact
      ]);
    });

    downloadCSV(rows, 'Z_Enterprise_Audit_Log.csv');
    showToast('Đã xuất sổ nhật ký audit thành công', 'success');
  }

  function downloadCSV(rows, filename) {
    const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `\"${cell}\"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function togglePersona() {
    if (state.currentPersona === 'super_admin') {
      state.currentPersona = 'branch_admin';
      state.quotaFilters.region = 'South';
      state.quotaFilters.branch = 'HCM-01';
      showToast('Đã chuyển sang vai trò: Admin Chi nhánh (Hồ Chí Minh 01)', 'info');
    } else {
      state.currentPersona = 'super_admin';
      state.quotaFilters.region = 'ALL';
      state.quotaFilters.branch = 'ALL';
      showToast('Đã chuyển sang vai trò: Super Admin (Toàn quốc)', 'info');
    }
    saveState();
    renderApp();
  }


  // Helper lấy tên Actor thực hiện ghi nhận vào Nhật ký Audit
  function getActorName() {
    if (state.currentPersona === 'super_admin') {
      return 'Vũ Minh Tuấn (Super Admin)';
    } else {
      return 'Lê Hoàng Nam (Admin Chi nhánh HCM-01)';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  function getInitials(name) {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // =========================================================================
  // 11. KHỞI TẠO ỨNG DỤNG & GLOBAL LISTENERS
  // =========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    // Đảm bảo tab mặc định khi vừa mở web luôn là Tổng quan (Overview)
    state.activeView = 'overview';

    // Navigation router listeners (hỗ trợ cả selector generic lẫn id cụ thể)
    document.querySelectorAll('.sidebar-nav .nav-link, .sidebar-secondary .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const view = link.getAttribute('data-view');
        if (view === 'overview') {
          state.activeView = 'overview';
        } else if (view === 'quota' || view === 'employees_accounts') {
          state.activeView = 'quota';
        } else if (view === 'quota_allocation') {
          state.activeView = 'quota_allocation';
        } else if (view === 'audit_log') {
          state.activeView = 'audit_log';
        }
        saveState();
        renderApp();
      });
    });

    const navOverview = document.getElementById('nav-overview');
    if (navOverview) {
      navOverview.addEventListener('click', () => {
        state.activeView = 'overview';
        saveState();
        renderApp();
      });
    }

    const navEmpAcc = document.getElementById('nav-employees-accounts');
    if (navEmpAcc) {
      navEmpAcc.addEventListener('click', () => {
        state.activeView = 'quota';
        saveState();
        renderApp();
      });
    }

    const navQuota = document.getElementById('nav-quota');
    if (navQuota) {
      navQuota.addEventListener('click', () => {
        state.activeView = 'quota';
        saveState();
        renderApp();
      });
    }

    const navQuotaAlloc = document.getElementById('nav-quota-allocation');
    if (navQuotaAlloc) {
      navQuotaAlloc.addEventListener('click', () => {
        state.activeView = 'quota_allocation';
        saveState();
        renderApp();
      });
    }

    const navAudit = document.getElementById('nav-audit-log');
    if (navAudit) {
      navAudit.addEventListener('click', () => {
        state.activeView = 'audit_log';
        saveState();
        renderApp();
      });
    }

    const personaBtn = document.getElementById('btn-persona-switch');
    if (personaBtn) {
      personaBtn.addEventListener('click', togglePersona);
    }
    const userWidget = document.getElementById('user-profile-widget');
    if (userWidget) {
      userWidget.style.cursor = 'pointer';
      userWidget.addEventListener('click', togglePersona);
    }

    const exportBtn = document.getElementById('btn-export-quota');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportQuotaCSV);
    }

    const topAssign = document.getElementById('btn-top-assign-account');
    if (topAssign) {
      topAssign.addEventListener('click', () => {
        state.activeView = 'quota';
        saveState();
        renderApp();
        setTimeout(() => openAssignModal(), 50);
      });
    }

    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        const val = e.target.value;
        if (state.activeView === 'overview') {
          state.overviewFilters.search = val;
        } else if (state.activeView === 'quota') {
          state.quotaFilters.search = val;
        } else if (state.activeView === 'audit_log') {
          state.auditFilters.search = val;
        }
        renderApp();
      });
    }

    const helpBtn = document.getElementById('btn-help-modal');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        openModal({
          title: 'Quy Chuẩn Quản Trị Quota Z-Enterprise',
          content: `
            <div class="impact-box mb-12">
              <strong>1 Quota = 1 Tài khoản Zalo Enterprise</strong><br/>
              Mỗi tài khoản cấp cho nhân sự tiêu tốn đúng 1 điểm Quota.
            </div>
            <div class="impact-box mb-12">
              <strong>Phương trình Quota bất biến:</strong><br/>
              <code>Tổng Quota = Đang sử dụng + Chưa sử dụng</code><br/>
              <code>Đang sử dụng = Đang hoạt động + Tạm khóa</code>
            </div>
            <div class="impact-box mb-12">
              <strong>Bảo tồn Leads khách hàng:</strong><br/>
              Khi nhân sự thôi việc hoặc bàn giao, account được chuyển vào Kho thu hồi cùng toàn bộ danh bạ/leads để ưu tiên tái cấp cho nhân sự mới.
            </div>
            <div class="impact-box">
              <strong>Quy tắc An toàn Bàn giao:</strong><br/>
              Không cho phép bàn giao trực tiếp từ trạng thái Tạm khóa. Bắt buộc Mở khóa trước để xác nhận ủy quyền.
            </div>
          `,
          confirmText: 'Đã hiểu quy chuẩn',
          confirmClass: 'btn-primary',
          onConfirm: () => closeModal()
        });
      });
    }

    const notifBtn = document.getElementById('btn-notifications');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        const summary = getSystemSummary();
        openModal({
          title: 'Thông Báo Cảnh Báo Rủi Ro Vận Hành',
          content: `
            <div class="impact-box mb-12" style="border-left: 4px solid var(--color-orange);">
              <strong>Tổng số cảnh báo cần xử lý:</strong> ${summary.attention} trường hợp vi phạm quy tắc an toàn.
            </div>
            <ul style="padding-left: 18px; font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
              <li><strong>Nhân sự đã nghỉ việc nhưng account còn mở:</strong> Cần bàn giao hoặc thu hồi ngay để tránh thất thoát danh bạ.</li>
              <li><strong>Tài khoản không phát sinh trao đổi > 30 ngày:</strong> Cần rà soát để tái điều tiết Quota cho nhân viên có nhu cầu.</li>
              <li><strong>Tài khoản tạm khóa kéo dài:</strong> Cần xử lý dứt điểm hoặc thu hồi về quỹ chi nhánh.</li>
            </ul>
          `,
          confirmText: 'Xem danh sách Cần chú ý',
          confirmClass: 'btn-primary',
          onConfirm: () => {
            closeModal();
            state.activeView = 'quota';
            state.quotaFilters.activeTab = 'ATTENTION';
            saveState();
            renderApp();
          }
        });
      });
    }

    setupBulkActionListeners();
    renderApp();
  });

})();
