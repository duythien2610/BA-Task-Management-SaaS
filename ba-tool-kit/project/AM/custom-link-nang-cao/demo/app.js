/**
 * Demo SOP - Affiliate Marketing: Custom Link Nâng Cao
 * Logic điều khiển giao diện chuẩn 100% Mockup pic_01, pic_03, pic_04, pic_08 & FPT SOP Design System
 * 
 * ĐẶC TẢ NGHIỆP VỤ NÂNG CAO:
 * 1. KIẾN TRÚC 2-TAB FORM (Mentor & PO Approved):
 *    - Form TẠO link: Bắt buộc URL-First. Tab "URL đích" active; Tab "Chọn từ danh sách" DISABLED.
 *    - Form SỬA link: Tab "URL đích" Read-only vĩnh viễn; Tab "Chọn từ danh sách" ENABLED & active mặc định.
 * 2. BỘ CHỌN KHU VỰC 2 CẤP & QUY TẮC RESET:
 *    - Bắt buộc chọn Tỉnh/Thành & Phường/Xã khi Chỉnh sửa link.
 *    - Khi thay đổi Tỉnh/Thành hoặc Phường/Xã: Tự động reset toàn bộ các gói cước đã chọn (không hiện toast) để bảo đảm đúng đơn giá và chính sách khu vực mới.
 * 3. PRICING GUARDRAIL & FLIP DRAG-AND-DROP:
 *    - Gói cước chưa duyệt giá (pricingReady = false): Vô hiệu hóa màu xám, khóa checkbox, giá "---".
 *    - Kéo thả sắp xếp thứ tự hiển thị ưu tiên trên Landing Page với chuyển động FLIP Realtime mượt mà.
 * 4. BỘ LỌC NÂNG CAO (Loại link, Chọn tất cả, Khoảng ngày tùy chỉnh, Đếm số lượng), SẮP XẾP REALTIME & TÌM KIẾM THÔNG MINH.
 * 5. TẢI ẢNH MÃ QR PNG THẬT THEO ĐÚNG LINK ĐANG THAO TÁC.
 */

// Helper tạo chuỗi ngày giờ tương đối so với thời điểm hiện tại (phục vụ test bộ lọc Hôm nay / 7 ngày / 30 ngày)
function getRelativeDateStr(daysAgo, hour = 8, min = 30) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, min, 0);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${h}:${m}:${s}`;
}

// ==========================================================================
// 1. Dữ liệu Địa giới Hành chính 2 cấp (Tỉnh/Thành + Phường/Xã)
// ==========================================================================
const PROVINCES = {
    "HN": {
        name: "Hà Nội", region: "Vùng 1 - Giá Tiêu chuẩn",
        wards: [
            { code: "HN-HK", name: "Phường Hàng Kênh" },
            { code: "HN-HC", name: "Phường Hàng Cót" },
            { code: "HN-CG", name: "Phường Cầu Giấy" },
            { code: "HN-TD", name: "Phường Tây Hồ" },
            { code: "HN-HM", name: "Phường Hoàng Mai" },
            { code: "HN-TB", name: "Phường Thanh Xuân Bắc" }
        ]
    },
    "HCM": {
        name: "TP. Hồ Chí Minh", region: "Vùng 1 - Giá Tiêu chuẩn",
        wards: [
            { code: "HCM-TT", name: "Phường Tân Thuận" },
            { code: "HCM-BT", name: "Phường Bình Thạnh" },
            { code: "HCM-Q1", name: "Phường Bến Nghé (Q1)" },
            { code: "HCM-TD", name: "Phường Tân Định" },
            { code: "HCM-GV", name: "Phường Gò Vấp" },
            { code: "HCM-TB", name: "Phường Tân Bình" }
        ]
    },
    "DN": {
        name: "Đà Nẵng", region: "Vùng 2 - Giá Ưu đãi Miền Trung",
        wards: [
            { code: "DN-TK", name: "Phường Thanh Khê" },
            { code: "DN-HC", name: "Phường Hải Châu" },
            { code: "DN-SH", name: "Phường Sơn Trà" },
            { code: "DN-LK", name: "Phường Liên Chiểu" }
        ]
    },
    "HP": {
        name: "Hải Phòng", region: "Vùng 2 - Giá Đô thị Loại 1",
        wards: [
            { code: "HP-LB", name: "Phường Lạch Tray" },
            { code: "HP-HB", name: "Phường Hồng Bàng" },
            { code: "HP-NQ", name: "Phường Ngô Quyền" }
        ]
    },
    "CT": {
        name: "Cần Thơ", region: "Vùng 3 - Giá Tây Nam Bộ",
        wards: [
            { code: "CT-NK", name: "Phường Ninh Kiều" },
            { code: "CT-TN", name: "Phường Tân Hưng" },
            { code: "CT-BT", name: "Phường Bình Thủy" }
        ]
    },
    "BD": {
        name: "Bình Dương", region: "Vùng 3 - Giá Đông Nam Bộ",
        wards: [
            { code: "BD-PR", name: "Phường Phú Riềng" },
            { code: "BD-DK", name: "Phường Dĩ An" },
            { code: "BD-TC", name: "Phường Thủ Dầu Một" }
        ]
    },
    "DN2": {
        name: "Đồng Nai", region: "Vùng 3 - Giá Đông Nam Bộ",
        wards: [
            { code: "DN2-BH", name: "Phường Biên Hòa" },
            { code: "DN2-LK", name: "Phường Long Khánh" }
        ]
    },
    "AG": {
        name: "An Giang", region: "Vùng 4 - Giá Đồng Bằng Sông Cửu Long",
        wards: [
            { code: "AG-LC", name: "Phường Long Xuyên" },
            { code: "AG-CH", name: "Phường Châu Hòa" }
        ]
    }
};

const LOCATIONS = Object.fromEntries(
    Object.entries(PROVINCES).map(([k, v]) => [k, { code: k, name: v.name, region: v.region }])
);

// ==========================================================================
// 2. Mock Data: Danh mục Sản phẩm / Dịch vụ & Pricing Guardrail Flag
// ==========================================================================
const SYSTEM_PRODUCTS = [
    {
        id: "prod_01",
        name: "SpeedX 1 (SpeedX Ultra)",
        category: "Internet Wi-Fi 7",
        speed: "Tốc độ 1 Gbps • Modem Wi-Fi 7 Dual-Band",
        pricingReady: true,
        prices: {
            HN: "299.000đ/tháng", HCM: "310.000đ/tháng", DN: "285.000đ/tháng",
            HP: "290.000đ/tháng", CT: "280.000đ/tháng", BD: "280.000đ/tháng",
            DN2: "280.000đ/tháng", AG: "275.000đ/tháng"
        },
        img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=120&auto=format&fit=crop&q=80"
    },
    {
        id: "prod_02",
        name: "SpeedX 2 (SpeedX Pro)",
        category: "Internet Wi-Fi 7",
        speed: "Tốc độ 2 Gbps • Modem Wi-Fi 7 Tri-Band (3 băng tần)",
        pricingReady: true,
        prices: {
            HN: "399.000đ/tháng", HCM: "410.000đ/tháng", DN: "385.000đ/tháng",
            HP: "390.000đ/tháng", CT: "380.000đ/tháng", BD: "380.000đ/tháng",
            DN2: "380.000đ/tháng", AG: "375.000đ/tháng"
        },
        img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=120&auto=format&fit=crop&q=80"
    },
    {
        id: "prod_03",
        name: "SpeedX 10 (SpeedX Max 10Gbps)",
        category: "Internet Wi-Fi 7",
        speed: "Tốc độ đối xứng 10 Gbps • Router XGS-PON 10G",
        pricingReady: true,
        prices: {
            HN: "899.000đ/tháng", HCM: "920.000đ/tháng", DN: "880.000đ/tháng",
            HP: "890.000đ/tháng", CT: "870.000đ/tháng", BD: "870.000đ/tháng",
            DN2: "870.000đ/tháng", AG: "860.000đ/tháng"
        },
        img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80"
    },
    {
        id: "prod_04",
        name: "SpeedX F-GameX",
        category: "Internet Wi-Fi 7",
        speed: "Tốc độ 1 Gbps • Tích hợp Ultra Fast giảm Ping 50+ Game",
        pricingReady: true,
        prices: {
            HN: "349.000đ/tháng", HCM: "359.000đ/tháng", DN: "339.000đ/tháng",
            HP: "345.000đ/tháng", CT: "335.000đ/tháng", BD: "335.000đ/tháng",
            DN2: "335.000đ/tháng", AG: "330.000đ/tháng"
        },
        img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=120&auto=format&fit=crop&q=80"
    },
    {
        id: "prod_05",
        name: "Wi-Fi 7 Mesh SpeedX Pro",
        category: "Thiết bị Wi-Fi 7",
        speed: "Access Point Wi-Fi 7 Mở rộng Mesh 3 băng tần",
        pricingReady: true,
        prices: {
            HN: "120.000đ/tháng", HCM: "120.000đ/tháng", DN: "120.000đ/tháng",
            HP: "120.000đ/tháng", CT: "120.000đ/tháng", BD: "120.000đ/tháng",
            DN2: "120.000đ/tháng", AG: "120.000đ/tháng"
        },
        img: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=120&auto=format&fit=crop&q=80"
    },
    {
        id: "prod_06",
        name: "Combo SpeedX 1 + FPT Play 4K",
        category: "Combo Wi-Fi 7 & Truyền hình",
        speed: "Internet 1 Gbps Wi-Fi 7 + Gói VIP FPT Play",
        pricingReady: true,
        prices: {
            HN: "360.000đ/tháng", HCM: "370.000đ/tháng", DN: "345.000đ/tháng",
            HP: "350.000đ/tháng", CT: "340.000đ/tháng", BD: "340.000đ/tháng",
            DN2: "340.000đ/tháng", AG: "335.000đ/tháng"
        },
        img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&auto=format&fit=crop&q=80"
    },
    // Gói cước giới hạn khu vực (Chỉ bán tại HN & TP.HCM)
    {
        id: "prod_07",
        name: "SpeedX Doanh Nghiệp 10G Chuyên dụng",
        category: "Internet Doanh nghiệp",
        speed: "Băng thông quốc tế 50 Mbps • IP Tĩnh riêng biệt (Chỉ HN & HCM)",
        pricingReady: true,
        prices: {
            HN: "1.490.000đ/tháng", HCM: "1.520.000đ/tháng"
        },
        img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=120&auto=format&fit=crop&q=80"
    },
    // Gói cước đang chờ phê duyệt giá (pricingReady = false để demo Pricing Guardrail disable xám)
    {
        id: "prod_08",
        name: "Wi-Fi 7 Mesh 16-Port Enterprise Hub",
        category: "Thiết bị Thử nghiệm",
        speed: "Switching Hub quang 16 cổng 10G • Đang duyệt chính sách giá",
        pricingReady: false,
        prices: {},
        img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80"
    }
];

// ==========================================================================
// 3. Mock Data: Danh sách Link tôi tạo (Khớp 100% Mockup pic_01 & BR01-03)
// ==========================================================================
let customLinks = [
    {
        id: "link_001",
        title: "Đăng ký Wi-Fi 7 SpeedX FPT Toàn quốc",
        avatar: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&auto=format&fit=crop&q=80",
        avatarName: "wifi7-speedx.jpg",
        targetUrl: "https://fpt.vn/dang-ky-nang-cap-wifi7",
        slug: "speedx7",
        shortlink: "https://fpt.vn/speedx7",
        location: "",
        ward: "",
        qrImg: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fpt.vn/speedx7",
        createdAt: getRelativeDateStr(0, 11, 43), // Tạo hôm nay
        updatedAt: getRelativeDateStr(0, 11, 43),
        productIds: [], // Chưa cấu hình SP/DV -> Hiển thị URL đích
        hasBeenEdited: false, // Chưa từng sửa qua Form SP/DV (để test badge "Mới")
        kpi: { leads: "142", processed: "110", contracts: "45", cr: "31.8%" }
    },
    {
        id: "link_002",
        title: "Wi-Fi 7 Hạ tầng XGS-PON - Hà Nội",
        avatar: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=80",
        avatarName: "xgapon-hn.png",
        targetUrl: "https://fpt.vn/dang-ky-nang-cap-wifi7",
        slug: "wifi7hn",
        shortlink: "https://fpt.vn/wifi7hn",
        location: "HN",
        ward: "HN-CG",
        qrImg: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fpt.vn/wifi7hn",
        createdAt: getRelativeDateStr(2, 8, 0), // 2 ngày trước
        updatedAt: getRelativeDateStr(2, 8, 0),
        productIds: ["prod_01", "prod_02", "prod_03"], // Đã cấu hình 3 gói SpeedX
        hasBeenEdited: true,
        kpi: { leads: "32.384", processed: "10.345", contracts: "12.480", cr: "12.8%" }
    },
    {
        id: "link_003",
        title: "Nâng cấp Wi-Fi 7 SpeedX TP.HCM",
        avatar: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80",
        avatarName: "wifi7-hcm.jpg",
        targetUrl: "https://fpt.vn/dang-ky-nang-cap-wifi7",
        slug: "wifi7hcm",
        shortlink: "https://fpt.vn/wifi7hcm",
        location: "HCM",
        ward: "HCM-Q1",
        qrImg: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fpt.vn/wifi7hcm",
        createdAt: getRelativeDateStr(5, 9, 30), // 5 ngày trước
        updatedAt: getRelativeDateStr(5, 9, 30),
        productIds: ["prod_01", "prod_04"],
        hasBeenEdited: true,
        kpi: { leads: "18.250", processed: "14.120", contracts: "8.900", cr: "16.4%" }
    },
    {
        id: "link_004",
        title: "Combo SpeedX & Truyền hình FPT Play Đà Nẵng",
        avatar: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&auto=format&fit=crop&q=80",
        avatarName: "combo-speedx.jpg",
        targetUrl: "https://fpt.vn/dang-ky-nang-cap-wifi7",
        slug: "combospeedx",
        shortlink: "https://fpt.vn/combospeedx",
        location: "DN",
        ward: "DN-TK",
        qrImg: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fpt.vn/combospeedx",
        createdAt: getRelativeDateStr(12, 7, 15), // 12 ngày trước
        updatedAt: getRelativeDateStr(12, 7, 15),
        productIds: ["prod_06"],
        hasBeenEdited: true,
        kpi: { leads: "64", processed: "50", contracts: "12", cr: "18.8%" }
    },
    {
        id: "link_005",
        title: "SpeedX Doanh Nghiệp 10Gbps Chuyên dụng",
        avatar: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=100&auto=format&fit=crop&q=80",
        avatarName: "speedx-10g.jpg",
        targetUrl: "https://fpt.vn/dang-ky-nang-cap-wifi7",
        slug: "speedx10g",
        shortlink: "https://fpt.vn/speedx10g",
        location: "HN",
        ward: "HN-HK",
        qrImg: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fpt.vn/speedx10g",
        createdAt: getRelativeDateStr(20, 22, 43), // 20 ngày trước
        updatedAt: getRelativeDateStr(20, 22, 43),
        productIds: ["prod_03", "prod_07"],
        hasBeenEdited: true,
        kpi: { leads: "95", processed: "78", contracts: "28", cr: "29.5%" }
    },
    {
        id: "link_006",
        title: "Khuyến mãi Wi-Fi 7 Hải Phòng Mới",
        avatar: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80",
        avatarName: "wifi7-hp.png",
        targetUrl: "https://fpt.vn/dang-ky-nang-cap-wifi7",
        slug: "wifi7hp",
        shortlink: "https://fpt.vn/wifi7hp",
        location: "HP",
        ward: "HP-LB",
        qrImg: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fpt.vn/wifi7hp",
        createdAt: getRelativeDateStr(45, 14, 20), // 45 ngày trước
        updatedAt: getRelativeDateStr(45, 14, 20),
        productIds: ["prod_01"],
        hasBeenEdited: true,
        kpi: { leads: "32", processed: "28", contracts: "10", cr: "31.2%" }
    }
];

// ==========================================================================
// 4. Trạng thái Ứng dụng & Quản lý Bộ lọc / Phân trang
// ==========================================================================
let isEditMode = false;
let editingLinkId = null;
let currentDetailLinkId = null;
let formDraftProductIds = [];
let draggedCardIndex = null;
let selectedLocationCode = ""; // Province code
let selectedWardCode = ""; // Ward code
let isFirstSessionNewBadge = false;

// Table Filter, Sort & Pagination State
let currentPage = 1;
let pageSize = 10;
let currentSort = "newest";
let currentSearchKeyword = "";
let filterDatePreset = "all";
let filterLinkTypes = ["url", "custom"];
let isFilterPanelOpen = false;

const SAMPLE_AVATARS = [
    { url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&auto=format&fit=crop&q=80", name: "chien-dich-fpt.jpg" },
    { url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80", name: "banner-sky.png" },
    { url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=80", name: "meta-gaming.jpg" },
    { url: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=100&auto=format&fit=crop&q=80", name: "combo-home.png" }
];

// ==========================================================================
// 5. Khởi tạo và Bắt sự kiện Tổng quát
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    applyListFilteringAndRender();

    // Đóng Dropdown SP/DV khi click ra ngoài
    document.addEventListener("click", (e) => {
        const insideFormSelect = document.getElementById("form-select-trigger")?.contains(e.target) || 
                                 document.getElementById("form-select-menu")?.contains(e.target);
        if (!insideFormSelect) {
            document.getElementById("form-select-menu")?.classList.remove("open");
        }
    });
});

// Helper: Chuẩn hóa Tiếng Việt không dấu phục vụ tìm kiếm thông minh
function removeVietnameseTones(str) {
    if (!str) return "";
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str.toLowerCase().trim();
}

// Helper: Parse chuỗi thời gian dd/mm/yyyy hh:mm:ss sang đối tượng Date
function parseDateTimeStr(str) {
    if (!str) return new Date(0);
    // Ví dụ: "24/03/2026 11:43:00" hoặc "Hôm nay 08:30:00"
    if (str.startsWith("Hôm nay")) return new Date();
    const parts = str.split(" ");
    if (parts.length >= 2) {
        const dParts = parts[0].split("/");
        const tParts = parts[1].split(":");
        if (dParts.length === 3 && tParts.length >= 2) {
            return new Date(Number(dParts[2]), Number(dParts[1]) - 1, Number(dParts[0]), Number(tParts[0]), Number(tParts[1]), Number(tParts[2] || 0));
        }
    }
    return new Date();
}

// ==========================================================================
// VIEW 1: Render Danh sách Link tôi tạo (FR01 / Use Case 1)
// ==========================================================================
function getFilteredAndSortedLinks() {
    let result = [...customLinks];

    // 1. Lọc theo từ khóa tìm kiếm (hỗ trợ Tiếng Việt có dấu và không dấu)
    if (currentSearchKeyword) {
        const kwNorm = removeVietnameseTones(currentSearchKeyword);
        result = result.filter(link => {
            const titleNorm = removeVietnameseTones(link.title);
            const urlNorm = removeVietnameseTones(link.targetUrl);
            const slugNorm = removeVietnameseTones(link.slug);
            return titleNorm.includes(kwNorm) || urlNorm.includes(kwNorm) || slugNorm.includes(kwNorm);
        });
    }

    // 2. Lọc theo Loại link (URL đích / Sản phẩm dịch vụ)
    result = result.filter(link => {
        const isCustom = link.productIds && link.productIds.length > 0;
        if (isCustom && filterLinkTypes.includes("custom")) return true;
        if (!isCustom && filterLinkTypes.includes("url")) return true;
        return false;
    });

    // 3. Lọc theo Khoảng thời gian (Hôm nay / 7 ngày / 30 ngày / Tùy chỉnh)
    if (filterDatePreset !== "all") {
        const now = new Date();
        result = result.filter(link => {
            const linkDate = parseDateTimeStr(link.createdAt);
            if (filterDatePreset === "today") {
                const isToday = linkDate.getDate() === now.getDate() &&
                                linkDate.getMonth() === now.getMonth() &&
                                linkDate.getFullYear() === now.getFullYear();
                return isToday;
            }
            if (filterDatePreset === "last7days") {
                const diffDays = (now - linkDate) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 7;
            }
            if (filterDatePreset === "last30days") {
                const diffDays = (now - linkDate) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 30;
            }
            if (filterDatePreset === "custom") {
                const fromVal = document.getElementById("filter-date-from")?.value;
                const toVal = document.getElementById("filter-date-to")?.value;
                const linkTime = linkDate.getTime();
                if (fromVal) {
                    const fromDate = new Date(fromVal);
                    fromDate.setHours(0, 0, 0, 0);
                    if (linkTime < fromDate.getTime()) return false;
                }
                if (toVal) {
                    const toDate = new Date(toVal);
                    toDate.setHours(23, 59, 59, 999);
                    if (linkTime > toDate.getTime()) return false;
                }
                return true;
            }
            return true;
        });
    }

    // 4. Sắp xếp danh sách (Mới nhất / Cũ nhất - Use Case 1.3)
    result.sort((a, b) => {
        const timeA = parseDateTimeStr(a.createdAt).getTime();
        const timeB = parseDateTimeStr(b.createdAt).getTime();
        return currentSort === "oldest" ? (timeA - timeB) : (timeB - timeA);
    });

    return result;
}

function applyListFilteringAndRender() {
    const filteredData = getFilteredAndSortedLinks();
    const totalRecords = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    if (currentPage > totalPages) currentPage = 1;

    // Phân trang dữ liệu
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const paginatedSlice = filteredData.slice(startIndex, endIndex);

    renderLinksTable(paginatedSlice, startIndex, totalRecords);
    renderPagination(totalRecords, totalPages);
}

function renderLinksTable(data, startIndex, totalRecords) {
    const tbody = document.getElementById("links-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Cập nhật thông tin phân trang
    const infoEl = document.getElementById("pagination-info");
    if (infoEl) {
        if (totalRecords === 0) {
            infoEl.innerText = "Không có bản ghi nào";
        } else {
            infoEl.innerText = `Hiển thị ${startIndex + 1} - ${startIndex + data.length} / ${totalRecords} bản ghi`;
        }
    }

    // EMPTY STATE CHUẨN KHI KHÔNG CÓ BẢN GHI (ALT-01 & ALT-02)
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state-cell">
                    <div class="empty-state-box">
                        <div class="empty-state-icon-wrap">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <div class="empty-state-title">Không tìm thấy kết quả phù hợp!</div>
                        <div class="empty-state-desc">Vui lòng thử lại với từ khóa khác hoặc điều chỉnh lại các tiêu chí trong Bộ lọc nâng cao.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach((link, index) => {
        const tr = document.createElement("tr");

        // CỘT LINK / SẢN PHẨM DỊCH VỤ (BR01-02)
        let linkOrProductsHtml = "";
        if (link.productIds && link.productIds.length > 0) {
            let badges = "";
            link.productIds.forEach(pid => {
                const prod = SYSTEM_PRODUCTS.find(p => p.id === pid);
                if (prod) {
                    badges += `
                        <span class="badge-spdv-chip">
                            <img src="${prod.img}" alt="${prod.name}" class="spdv-chip-icon">
                            ${prod.name}
                        </span>
                    `;
                }
            });
            linkOrProductsHtml = `<div class="spdv-chips-wrap">${badges}</div>`;
        } else {
            linkOrProductsHtml = `<a href="${link.targetUrl}" target="_blank" class="table-link-text">${link.targetUrl}</a>`;
        }

        tr.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>
                <div class="link-name-cell" onclick="openDetailView('${link.id}')">
                    <img src="${link.avatar}" alt="Avatar" class="avatar-sm">
                    <span class="link-title-text">${link.title}</span>
                </div>
            </td>
            <td>${linkOrProductsHtml}</td>
            <td>${link.createdAt}</td>
            <td>${link.updatedAt}</td>
            <td>
                <div class="action-icons-wrap">
                    <button class="btn-icon-action" title="Xem chi tiết" onclick="openDetailView('${link.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-icon-action" title="Cấu hình SP/DV" onclick="openEditForm('${link.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon-action" title="Sao chép link" onclick="copyShortlink('${link.shortlink}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPagination(totalRecords, totalPages) {
    const pagesContainer = document.getElementById("pagination-pages");
    if (!pagesContainer) return;
    pagesContainer.innerHTML = "";

    if (totalRecords === 0) return;

    // Nút Trang trước (<)
    const prevBtn = document.createElement("button");
    prevBtn.className = `page-nav-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = "&lsaquo;";
    prevBtn.title = "Trang trước";
    prevBtn.onclick = () => { if (currentPage > 1) goToPage(currentPage - 1); };
    pagesContainer.appendChild(prevBtn);

    // Render danh sách các số trang
    for (let p = 1; p <= totalPages; p++) {
        const pageBtn = document.createElement("button");
        pageBtn.className = `page-btn ${currentPage === p ? 'active' : ''}`;
        pageBtn.innerText = p;
        pageBtn.onclick = () => goToPage(p);
        pagesContainer.appendChild(pageBtn);
    }

    // Nút Trang sau (>)
    const nextBtn = document.createElement("button");
    nextBtn.className = `page-nav-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = "&rsaquo;";
    nextBtn.title = "Trang tiếp theo";
    nextBtn.onclick = () => { if (currentPage < totalPages) goToPage(currentPage + 1); };
    pagesContainer.appendChild(nextBtn);
}

function goToPage(page) {
    currentPage = page;
    applyListFilteringAndRender();
}

function handlePageSizeChange(newSize) {
    pageSize = Number(newSize) || 10;
    currentPage = 1;
    applyListFilteringAndRender();
}

function handleSortChange() {
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
        currentSort = sortSelect.value;
        currentPage = 1;
        applyListFilteringAndRender();
    }
}

// Search Handler (Realtime & Clear Button)
function handleSearch() {
    const input = document.getElementById("search-input");
    const clearBtn = document.getElementById("search-clear-btn");
    currentSearchKeyword = input ? input.value : "";

    if (clearBtn) {
        clearBtn.style.display = currentSearchKeyword.length > 0 ? "flex" : "none";
    }

    currentPage = 1;
    applyListFilteringAndRender();
}

function clearSearchInput() {
    const input = document.getElementById("search-input");
    const clearBtn = document.getElementById("search-clear-btn");
    if (input) input.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    currentSearchKeyword = "";
    currentPage = 1;
    applyListFilteringAndRender();
}

// Advanced Filter Handlers (Use Case 1.1 trong Excel & BR01-03)
function toggleAdvancedFilter() {
    const panel = document.getElementById("advanced-filter-panel");
    if (!panel) return;
    isFilterPanelOpen = !isFilterPanelOpen;
    panel.style.display = isFilterPanelOpen ? "block" : "none";
}

function handleFilterDatePresetChange() {
    const preset = document.getElementById("filter-date-preset")?.value || "all";
    const customContainer = document.getElementById("filter-custom-date-container");
    if (customContainer) {
        customContainer.style.display = (preset === "custom") ? "flex" : "none";
    }
}

function toggleFilterTypeAll(checked) {
    const typeUrlEl = document.getElementById("filter-type-url");
    const typeCustomEl = document.getElementById("filter-type-custom");
    if (typeUrlEl) typeUrlEl.checked = checked;
    if (typeCustomEl) typeCustomEl.checked = checked;
    updateFilterTypeCountText();
}

function syncFilterTypeCheckboxes() {
    const typeUrlEl = document.getElementById("filter-type-url");
    const typeCustomEl = document.getElementById("filter-type-custom");
    const typeAllEl = document.getElementById("filter-type-all");

    const urlChecked = typeUrlEl ? typeUrlEl.checked : false;
    const customChecked = typeCustomEl ? typeCustomEl.checked : false;

    if (typeAllEl) {
        typeAllEl.checked = urlChecked && customChecked;
        typeAllEl.indeterminate = (urlChecked !== customChecked);
    }
    updateFilterTypeCountText();
}

function updateFilterTypeCountText() {
    const typeUrlEl = document.getElementById("filter-type-url");
    const typeCustomEl = document.getElementById("filter-type-custom");
    const countEl = document.getElementById("filter-type-count");
    let count = 0;
    if (typeUrlEl && typeUrlEl.checked) count++;
    if (typeCustomEl && typeCustomEl.checked) count++;
    if (countEl) {
        countEl.innerText = `(Đã chọn: ${count}/2)`;
    }
}

function applyAdvancedFilter() {
    const datePresetEl = document.getElementById("filter-date-preset");
    const typeUrlEl = document.getElementById("filter-type-url");
    const typeCustomEl = document.getElementById("filter-type-custom");
    const dot = document.getElementById("filter-active-dot");

    filterDatePreset = datePresetEl ? datePresetEl.value : "all";
    filterLinkTypes = [];
    if (typeUrlEl && typeUrlEl.checked) filterLinkTypes.push("url");
    if (typeCustomEl && typeCustomEl.checked) filterLinkTypes.push("custom");

    // Edge Case: Cảnh báo nếu không chọn loại link nào
    if (filterLinkTypes.length === 0) {
        showToast("Vui lòng chọn ít nhất 1 loại link tiếp thị!");
        if (typeUrlEl) typeUrlEl.checked = true;
        if (typeCustomEl) typeCustomEl.checked = true;
        syncFilterTypeCheckboxes();
        filterLinkTypes = ["url", "custom"];
        return;
    }

    if (filterDatePreset === "custom") {
        const fromVal = document.getElementById("filter-date-from")?.value;
        const toVal = document.getElementById("filter-date-to")?.value;
        if (!fromVal && !toVal) {
            showToast("Vui lòng chọn khoảng ngày bắt đầu hoặc kết thúc!");
            return;
        }
    }

    // Chỉ báo dot cam nếu đang có filter khác mặc định
    const isFiltered = (filterDatePreset !== "all") || (filterLinkTypes.length < 2);
    if (dot) dot.style.display = isFiltered ? "inline-block" : "none";

    currentPage = 1;
    applyListFilteringAndRender();
    showToast("Đã áp dụng tiêu chí lọc!");
}

function resetAdvancedFilter() {
    const datePresetEl = document.getElementById("filter-date-preset");
    const typeUrlEl = document.getElementById("filter-type-url");
    const typeCustomEl = document.getElementById("filter-type-custom");
    const typeAllEl = document.getElementById("filter-type-all");
    const dot = document.getElementById("filter-active-dot");
    const customContainer = document.getElementById("filter-custom-date-container");
    const dateFromEl = document.getElementById("filter-date-from");
    const dateToEl = document.getElementById("filter-date-to");

    if (datePresetEl) datePresetEl.value = "all";
    if (typeUrlEl) typeUrlEl.checked = true;
    if (typeCustomEl) typeCustomEl.checked = true;
    if (typeAllEl) {
        typeAllEl.checked = true;
        typeAllEl.indeterminate = false;
    }
    if (dot) dot.style.display = "none";
    if (customContainer) customContainer.style.display = "none";
    if (dateFromEl) dateFromEl.value = "";
    if (dateToEl) dateToEl.value = "";

    filterDatePreset = "all";
    filterLinkTypes = ["url", "custom"];
    updateFilterTypeCountText();
    currentPage = 1;
    applyListFilteringAndRender();
    showToast("Đã thiết lập lại bộ lọc mặc định!");
}

// Switch Views & State Resets
function showSection(sectionId) {
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(sectionId)?.classList.add("active");
}

function showListView() {
    currentDetailLinkId = null;
    editingLinkId = null;
    showSection("view-list");
    applyListFilteringAndRender();
}

// ==========================================================================
// VIEW 2: Form Tạo link URL-First (FR02) vs Form Chỉnh sửa link (FR03)
// ==========================================================================
function openCreateForm() {
    isEditMode = false;
    editingLinkId = null;
    currentDetailLinkId = null;
    formDraftProductIds = [];
    isFirstSessionNewBadge = false;
    selectedLocationCode = "";
    selectedWardCode = "";

    showSection("view-form");

    // UI Titles
    document.getElementById("form-main-title").innerText = "Tạo link theo URL đích";
    document.getElementById("btn-save-form").innerText = "Tạo link";

    // Reset Form Fields
    document.getElementById("input-link-title").value = "";
    document.getElementById("input-avatar-preview").src = SAMPLE_AVATARS[0].url;
    document.getElementById("input-avatar-filename").innerText = SAMPLE_AVATARS[0].name;
    document.getElementById("input-target-url").value = "https://fpt.vn/dang-ky-nang-cap-wifi7";

    // Create mode: URL is editable
    document.getElementById("url-create-mode").style.display = "block";
    document.getElementById("url-edit-mode").style.display = "none";

    // 2-TAB SETUP FOR CREATE MODE:
    // Tab "URL đích" active; Tab "Chọn từ danh sách" DISABLED màu xám
    const tabUrl = document.getElementById("tab-btn-url");
    const tabProd = document.getElementById("tab-btn-products");
    tabUrl.classList.add("active");
    tabProd.classList.remove("active");
    tabProd.disabled = true; // KHÓA TAB SP/DV KHI TẠO MỚI

    document.getElementById("form-tab-badge-new").style.display = "none";
    document.getElementById("form-product-count-badge").style.display = "none";

    document.getElementById("form-tab-url-content").style.display = "block";
    document.getElementById("form-tab-products-content").style.display = "none";

    // Right Column Preview Placeholder
    document.getElementById("form-preview-placeholder").style.display = "block";
    document.getElementById("form-preview-active").style.display = "none";

    // Reset Province + Ward controls
    const provSelect = document.getElementById("select-province");
    if (provSelect) provSelect.value = "";
    populateWards("", "");
    const provErr = document.getElementById("province-error");
    if (provErr) provErr.style.display = "none";
    const wardErr = document.getElementById("ward-error");
    if (wardErr) wardErr.style.display = "none";

    updateFormTabBadges();
    updateFormSelectTriggerText();
    renderProductsEditor();
    handleFormValidation();
}

function openEditForm(linkId) {
    const link = customLinks.find(l => l.id === linkId);
    if (!link) return;

    isEditMode = true;
    editingLinkId = linkId;
    currentDetailLinkId = null; // Reset detail context để tránh nhầm QR/link
    formDraftProductIds = [...(link.productIds || [])];
    selectedLocationCode = link.location || "";
    selectedWardCode = link.ward || "";
    isFirstSessionNewBadge = (link && !link.hasBeenEdited); // Chỉ hiện badge mới nếu chưa từng lưu qua Form Sửa (BR03-03)

    showSection("view-form");

    // UI Titles
    document.getElementById("form-main-title").innerText = "Chỉnh sửa link";
    document.getElementById("btn-save-form").innerText = "Lưu";

    // Fill basic fields
    document.getElementById("input-link-title").value = link.title;
    document.getElementById("input-avatar-preview").src = link.avatar;
    document.getElementById("input-avatar-filename").innerText = link.avatarName || "avatar.png";

    // URL đích LOCKED in edit mode (BR-AM-08 / BR03-05)
    document.getElementById("url-create-mode").style.display = "none";
    document.getElementById("url-edit-mode").style.display = "block";
    document.getElementById("url-display-readonly").innerText = link.targetUrl;
    document.getElementById("input-target-url").value = link.targetUrl;

    // 2-TAB SETUP FOR EDIT MODE:
    // Tab "Chọn từ danh sách" được kích hoạt và active mặc định
    const tabProd = document.getElementById("tab-btn-products");
    tabProd.disabled = false;

    switchFormTab("products");

    // Province + Ward
    const provSelect = document.getElementById("select-province");
    if (provSelect) {
        provSelect.value = selectedLocationCode;
        populateWards(selectedLocationCode, selectedWardCode);
    }

    const provErr = document.getElementById("province-error");
    if (provErr) provErr.style.display = "none";
    const wardErr = document.getElementById("ward-error");
    if (wardErr) wardErr.style.display = "none";

    updateFormTabBadges();
    updateFormSelectTriggerText();
    renderProductsEditor();
    filterFormDropdown();
    handleFormValidation();

    // Right Column Preview
    document.getElementById("form-preview-placeholder").style.display = "none";
    document.getElementById("form-preview-active").style.display = "block";
    document.getElementById("form-preview-shortlink").value = link.shortlink;
    document.getElementById("form-preview-qr").src = link.qrImg;
}

function cancelForm() {
    if (isEditMode && editingLinkId) {
        openDetailView(editingLinkId);
    } else {
        showListView();
    }
}

function openEditFormFromDetail() {
    if (currentDetailLinkId) {
        openEditForm(currentDetailLinkId);
    }
}

// Tab Switching inside Form
function switchFormTab(tab) {
    const tabUrl = document.getElementById("tab-btn-url");
    const tabProd = document.getElementById("tab-btn-products");
    const contentUrl = document.getElementById("form-tab-url-content");
    const contentProd = document.getElementById("form-tab-products-content");

    if (tab === "url") {
        tabUrl.classList.add("active");
        tabProd.classList.remove("active");
        contentUrl.style.display = "block";
        contentProd.style.display = "none";
    } else if (tab === "products") {
        if (tabProd.disabled) return;
        tabUrl.classList.remove("active");
        tabProd.classList.add("active");
        contentUrl.style.display = "none";
        contentProd.style.display = "block";

        updateFormTabBadges();
        updateFormSelectTriggerText();
        renderProductsEditor();
        filterFormDropdown();
    }
}

// ==========================================================================
// 6. Xử lý Địa giới Hành chính (Tỉnh/Thành & Phường/Xã)
// ==========================================================================
// Reset lỗi khi chọn Tỉnh/Thành hoặc Phường/Xã
function handleProvinceChange() {
    const provSelect = document.getElementById("select-province");
    if (!provSelect) return;

    const newLocation = provSelect.value;
    selectedLocationCode = newLocation;
    selectedWardCode = ""; // Reset Phường/Xã khi đổi Tỉnh (Ràng buộc toàn vẹn địa giới)

    populateWards(selectedLocationCode, "");

    const provErr = document.getElementById("province-error");
    if (provErr && newLocation) provErr.style.display = "none";

    // QUY TẮC NGHIỆP VỤ: Khi thay đổi Tỉnh/Thành phố -> Reset toàn bộ các gói cước đã chọn (không hiện toast)
    formDraftProductIds = [];

    updateFormTabBadges();
    updateFormSelectTriggerText();
    renderProductsEditor();
    filterFormDropdown();
}

function handleWardChange() {
    const wardSelect = document.getElementById("select-ward");
    if (!wardSelect) return;
    selectedWardCode = wardSelect.value;

    const wardErr = document.getElementById("ward-error");
    if (wardErr && selectedWardCode) wardErr.style.display = "none";

    // QUY TẮC NGHIỆP VỤ: Khi thay đổi Phường/Xã -> Reset toàn bộ các gói cước đã chọn (không hiện toast)
    formDraftProductIds = [];

    updateFormTabBadges();
    updateFormSelectTriggerText();
    renderProductsEditor();
    filterFormDropdown();
}

function populateWards(provinceCode, selectedWard) {
    const wardSelect = document.getElementById("select-ward");
    if (!wardSelect) return;

    wardSelect.innerHTML = "";

    if (!provinceCode || !PROVINCES[provinceCode]) {
        wardSelect.innerHTML = "<option value=''>-- Chọn Tỉnh/Thành trước --</option>";
        wardSelect.disabled = true;
        return;
    }

    wardSelect.disabled = false;
    const province = PROVINCES[provinceCode];
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.text = "-- Chọn Phường/Xã --";
    wardSelect.appendChild(defaultOpt);

    province.wards.forEach(ward => {
        const opt = document.createElement("option");
        opt.value = ward.code;
        opt.text = ward.name;
        if (ward.code === selectedWard) opt.selected = true;
        wardSelect.appendChild(opt);
    });
}

function updateFormTabBadges() {
    const badgeNew = document.getElementById("form-tab-badge-new");
    const badgeCount = document.getElementById("form-product-count-badge");
    const count = formDraftProductIds.length;

    if (count > 0) {
        badgeNew.style.display = "none";
        badgeCount.style.display = "inline-block";
        badgeCount.innerText = `${count}/3`;
    } else if (isFirstSessionNewBadge) {
        badgeNew.style.display = "inline-block";
        badgeCount.style.display = "none";
    } else {
        badgeNew.style.display = "none";
        badgeCount.style.display = "none";
    }
}

function updateFormSelectTriggerText() {
    const trigger = document.getElementById("form-select-trigger");
    const triggerText = document.getElementById("form-select-trigger-text");
    if (!trigger || !triggerText) return;

    if (!selectedLocationCode) {
        trigger.classList.add("disabled");
        triggerText.innerText = "Vui lòng chọn Tỉnh/Thành phố và Phường/Xã trước";
        triggerText.style.color = "#94a3b8";
        triggerText.style.fontWeight = "normal";
    } else if (!selectedWardCode) {
        trigger.classList.add("disabled");
        triggerText.innerText = "Vui lòng chọn Phường/Xã trước";
        triggerText.style.color = "#94a3b8";
        triggerText.style.fontWeight = "normal";
    } else {
        trigger.classList.remove("disabled");
        if (formDraftProductIds.length > 0) {
            triggerText.innerText = `Đã chọn ${formDraftProductIds.length}/3 sản phẩm / dịch vụ`;
            triggerText.style.color = "#1e293b";
            triggerText.style.fontWeight = "600";
        } else {
            triggerText.innerText = "Chọn sản phẩm / dịch vụ";
            triggerText.style.color = "#1e293b";
            triggerText.style.fontWeight = "500";
        }
    }
}

// Dropdown Multi-Select SP/DV Logic & Pricing Guardrail (AC-04.1.02)
function toggleFormDropdown() {
    if (!selectedLocationCode) {
        showToast("Vui lòng chọn Tỉnh/Thành phố trước khi chọn sản phẩm!");
        return;
    }
    if (!selectedWardCode) {
        showToast("Vui lòng chọn Phường/Xã trước khi chọn sản phẩm!");
        return;
    }

    const menu = document.getElementById("form-select-menu");
    menu.classList.toggle("open");
    if (menu.classList.contains("open")) {
        filterFormDropdown();
    }
}

function filterFormDropdown() {
    const keyword = document.getElementById("form-dropdown-filter")?.value.toLowerCase().trim() || "";
    const container = document.getElementById("form-dropdown-items");
    if (!container) return;
    container.innerHTML = "";

    const isMaxReached = formDraftProductIds.length >= 3;
    const currentLoc = selectedLocationCode;

    SYSTEM_PRODUCTS.forEach(prod => {
        if (keyword && !prod.name.toLowerCase().includes(keyword) && !prod.speed.toLowerCase().includes(keyword)) {
            return;
        }

        // PRICING GUARDRAIL: Kiểm tra nếu gói cước chưa có giá hoặc không bán tại Tỉnh đã chọn
        const isPricingMissing = !prod.pricingReady || (currentLoc && (!prod.prices || !prod.prices[currentLoc]));
        const isChecked = formDraftProductIds.includes(prod.id);
        const isDisabled = isPricingMissing || (!isChecked && isMaxReached);

        const itemDiv = document.createElement("div");
        itemDiv.className = `select-item-row ${isChecked ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isPricingMissing ? 'guardrail-disabled' : ''}`;

        // Hiển thị giá theo Tỉnh hoặc tag chưa có giá
        let priceTag = "";
        if (isPricingMissing) {
            priceTag = `<span class="spdv-guardrail-tag">Chưa có giá</span>`;
        } else if (currentLoc && prod.prices[currentLoc]) {
            priceTag = `<span style="color:#0284c7; font-weight:600; margin-left:6px;">(${prod.prices[currentLoc]})</span>`;
        }

        itemDiv.innerHTML = `
            <input type="checkbox" class="spdv-checkbox" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
            <img src="${prod.img}" alt="${prod.name}" class="spdv-item-thumb">
            <div class="spdv-item-info">
                <div class="spdv-item-title">${prod.name} ${priceTag}</div>
                <div class="spdv-item-sub">${prod.speed}</div>
            </div>
        `;

        if (isPricingMissing) {
            itemDiv.onclick = (e) => {
                e.stopPropagation();
                const provName = currentLoc && PROVINCES[currentLoc] ? PROVINCES[currentLoc].name : "khu vực này";
                showToast(`Gói cước "${prod.name}" chưa có chính sách giá tại ${provName}!`);
            };
        } else if (!isDisabled || isChecked) {
            itemDiv.onclick = (e) => {
                e.stopPropagation();
                toggleSelectProduct(prod.id);
            };
        }

        container.appendChild(itemDiv);
    });

    const hint = document.getElementById("form-selection-hint");
    if (hint) {
        if (isMaxReached) {
            hint.innerText = "Đã chọn tối đa 3 gói sản phẩm / dịch vụ.";
            hint.style.color = "#d97706";
        } else {
            hint.innerText = "";
        }
    }
}

function toggleSelectProduct(prodId) {
    const prod = SYSTEM_PRODUCTS.find(p => p.id === prodId);
    if (!prod) return;

    const index = formDraftProductIds.indexOf(prodId);
    if (index > -1) {
        formDraftProductIds.splice(index, 1);
    } else {
        if (formDraftProductIds.length >= 3) {
            showToast("Chỉ được chọn tối đa 3 gói sản phẩm / dịch vụ!");
            return;
        }
        formDraftProductIds.push(prodId);
    }

    updateFormTabBadges();
    updateFormSelectTriggerText();
    renderProductsEditor();
    filterFormDropdown();
}

function removeSelectedProduct(prodId) {
    const index = formDraftProductIds.indexOf(prodId);
    if (index > -1) {
        formDraftProductIds.splice(index, 1);
        updateFormTabBadges();
        updateFormSelectTriggerText();
        renderProductsEditor();
        filterFormDropdown();
    }
}

// Helper: Xác định phần tử liền sau vị trí con trỏ chuột khi kéo
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.configured-product-card-pic2:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// FLIP Animation: Hiệu ứng chuyển động hoán đổi vị trí Realtime mượt mà
function animateFLIP(container, mutationFn) {
    const cards = [...container.querySelectorAll('.configured-product-card-pic2')];
    const firstPositions = new Map();

    cards.forEach(card => {
        firstPositions.set(card, card.getBoundingClientRect().top);
    });

    mutationFn();

    const updatedCards = [...container.querySelectorAll('.configured-product-card-pic2')];
    updatedCards.forEach(card => {
        const firstTop = firstPositions.get(card);
        if (firstTop === undefined) return;
        const lastTop = card.getBoundingClientRect().top;
        const deltaY = firstTop - lastTop;

        if (deltaY !== 0) {
            card.style.transform = `translateY(${deltaY}px)`;
            card.style.transition = 'none';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.style.transition = 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)';
                    card.style.transform = '';
                });
            });
        }
    });
}

// Render các thẻ gói cước đã chọn chuẩn 100% Mockup pic2 kèm tính năng Kéo thả Realtime mượt mà
function renderProductsEditor() {
    const container = document.getElementById("form-products-editor");
    if (!container) return;
    container.innerHTML = "";
    const locCode = selectedLocationCode;

    if (formDraftProductIds.length === 0) {
        return; // Để trống sạch sẽ khi chưa chọn gói nào (chuẩn pic2)
    }

    formDraftProductIds.forEach((pid, index) => {
        const prod = SYSTEM_PRODUCTS.find(p => p.id === pid);
        if (!prod) return;

        const card = document.createElement("div");
        card.className = "configured-product-card-pic2";
        card.draggable = true;
        card.dataset.id = pid;

        const priceDisplay = (locCode && prod.prices && prod.prices[locCode]) ? ` &bull; <strong style="color:#0284c7;">${prod.prices[locCode]}</strong>` : "";
        card.innerHTML = `
            <div class="drag-handle-pic2" title="Kéo thả để sắp xếp thứ tự hiển thị ưu tiên trên Landing Page">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="8" cy="5" r="2"/>
                    <circle cx="8" cy="12" r="2"/>
                    <circle cx="8" cy="19" r="2"/>
                    <circle cx="16" cy="5" r="2"/>
                    <circle cx="16" cy="12" r="2"/>
                    <circle cx="16" cy="19" r="2"/>
                </svg>
            </div>
            <img src="${prod.img}" alt="${prod.name}" class="configured-card-thumb-pic2">
            <div class="configured-card-info-pic2">
                <div class="configured-card-name-pic2">${prod.name}</div>
                <div class="configured-card-meta-pic2">${prod.speed}${priceDisplay}</div>
            </div>
            <button class="btn-trash-card-pic2" title="Xóa gói" onclick="removeSelectedProduct('${prod.id}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;

        // Bắt đầu kéo
        card.addEventListener("dragstart", (e) => {
            card.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", pid);
        });

        // Kết thúc kéo -> Đồng bộ thứ tự mới vào formDraftProductIds
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            const newIds = Array.from(container.children).map(c => c.dataset.id).filter(Boolean);
            formDraftProductIds = newIds;
        });

        container.appendChild(card);
    });

    // Lắng nghe di chuyển kéo thả trên container để hoán đổi Realtime mượt mà
    container.ondragover = (e) => {
        e.preventDefault();
        const draggingCard = container.querySelector(".dragging");
        if (!draggingCard) return;

        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement == null) {
            if (container.lastElementChild !== draggingCard) {
                animateFLIP(container, () => {
                    container.appendChild(draggingCard);
                });
            }
        } else {
            if (afterElement !== draggingCard && afterElement.previousElementSibling !== draggingCard) {
                animateFLIP(container, () => {
                    container.insertBefore(draggingCard, afterElement);
                });
            }
        }
    };
}

// Avatar controls
function randomizeFormAvatar() {
    const randomAvatar = SAMPLE_AVATARS[Math.floor(Math.random() * SAMPLE_AVATARS.length)];
    document.getElementById("input-avatar-preview").src = randomAvatar.url;
    document.getElementById("input-avatar-filename").innerText = randomAvatar.name;
    showToast("Đã tải ảnh đại diện mới!");
}

function removeAvatar() {
    document.getElementById("input-avatar-preview").src = SAMPLE_AVATARS[0].url;
    document.getElementById("input-avatar-filename").innerText = SAMPLE_AVATARS[0].name;
    showToast("Đã đặt lại ảnh đại diện mặc định.");
}

// ==========================================================================
// 7. Validation Helpers & Ràng buộc Dữ liệu (BR-AM-01 / BR02-03)
// ==========================================================================
function validateLinkTitle(rawTitle) {
    const title = (rawTitle || "").trim();
    if (!title) {
        return { valid: false, message: "Vui lòng nhập Tên link!" };
    }
    if (title.length < 5) {
        return { valid: false, message: `Tên link phải có độ dài tối thiểu từ 5 ký tự (hiện tại: ${title.length} ký tự)!` };
    }
    if (title.length > 100) {
        return { valid: false, message: `Tên link không được vượt quá 100 ký tự (hiện tại: ${title.length} ký tự)!` };
    }
    // Ký tự đặc biệt cấm: @, #, !, $, %, ^, *, +, =, {, }, [, ], |, \, /, ?, <, >, ", ', `, ~
    const forbiddenRegex = /[@#!$%^*+={}\[\]|\\/?<>"'`~]/;
    if (forbiddenRegex.test(title)) {
        return { valid: false, message: "Tên link không được chứa ký tự đặc biệt (@, #, !, $, %, *, ...)!" };
    }
    return { valid: true, message: "" };
}

function validateTargetUrl(rawUrl) {
    const url = (rawUrl || "").trim();
    if (!url) {
        return { valid: false, message: "Vui lòng nhập URL đích!" };
    }
    // Must belong to fpt.vn or subdomains of fpt.vn
    const fptDomainRegex = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*fpt\.vn(?:\/.*)?$/i;
    if (!fptDomainRegex.test(url)) {
        return { valid: false, message: "Đường dẫn không hợp lệ. Vui lòng nhập đầy đủ URL của hệ thống fpt.vn!" };
    }
    // Blacklist localhost, 127.0.0.1, private IPs
    if (/localhost|127\.0\.0\.1|192\.168\.|10\./i.test(url)) {
        return { valid: false, message: "URL đích không được là địa chỉ mạng nội bộ!" };
    }
    return { valid: true, message: "" };
}

function handleFormValidation() {
    const titleVal = document.getElementById("input-link-title")?.value || "";
    const urlVal = document.getElementById("input-target-url")?.value || "";
    const titleErrEl = document.getElementById("link-title-error");
    const urlErrEl = document.getElementById("target-url-error");
    const btnSave = document.getElementById("btn-save-form");
    const btnPreview = document.getElementById("btn-form-preview-landing");

    const titleRes = validateLinkTitle(titleVal);
    const urlRes = validateTargetUrl(urlVal);

    // Title error display
    if (titleVal.length > 0 && !titleRes.valid) {
        if (titleErrEl) {
            titleErrEl.innerText = titleRes.message;
            titleErrEl.style.display = "block";
        }
    } else {
        if (titleErrEl) titleErrEl.style.display = "none";
    }

    // URL error display
    if (urlVal.length > 0 && !urlRes.valid) {
        if (urlErrEl) {
            urlErrEl.innerText = urlRes.message;
            urlErrEl.style.display = "block";
        }
        if (btnPreview) btnPreview.disabled = true;
    } else {
        if (urlErrEl) urlErrEl.style.display = "none";
        if (btnPreview) btnPreview.disabled = false;
    }

    // In Create Mode: button disabled if either is invalid
    if (!isEditMode && btnSave) {
        if (!titleRes.valid || !urlRes.valid) {
            btnSave.disabled = true;
            btnSave.style.opacity = "0.5";
            btnSave.style.cursor = "not-allowed";
        } else {
            btnSave.disabled = false;
            btnSave.style.opacity = "1";
            btnSave.style.cursor = "pointer";
        }
    } else if (btnSave) {
        btnSave.disabled = false;
        btnSave.style.opacity = "1";
        btnSave.style.cursor = "pointer";
    }
}

// ==========================================================================
// 8. Lưu Form Tạo & Sửa Link (Bảo toàn Định danh - BR-AM-07)
// ==========================================================================
function saveCustomLinkForm() {
    const title = document.getElementById("input-link-title").value.trim();
    const targetUrl = document.getElementById("input-target-url").value.trim();
    const avatar = document.getElementById("input-avatar-preview").src;
    const avatarName = document.getElementById("input-avatar-filename").innerText;
    const location = selectedLocationCode || "";
    const ward = selectedWardCode || "";

    // 1. Validate Tên link
    const titleRes = validateLinkTitle(title);
    if (!titleRes.valid) {
        showToast(titleRes.message);
        const titleErrEl = document.getElementById("link-title-error");
        if (titleErrEl) {
            titleErrEl.innerText = titleRes.message;
            titleErrEl.style.display = "block";
        }
        document.getElementById("input-link-title").focus();
        return;
    }

    // 2. Validate URL đích
    const urlRes = validateTargetUrl(targetUrl);
    if (!urlRes.valid) {
        showToast(urlRes.message);
        const urlErrEl = document.getElementById("target-url-error");
        if (urlErrEl) {
            urlErrEl.innerText = urlRes.message;
            urlErrEl.style.display = "block";
        }
        document.getElementById("input-target-url").focus();
        return;
    }

    // 3. Validate Khu vực & Phường/Xã (BẮT BUỘC trong chế độ Chỉnh sửa link)
    if (isEditMode) {
        if (!location) {
            showToast("Vui lòng chọn Tỉnh/Thành phố!");
            const provErr = document.getElementById("province-error");
            if (provErr) provErr.style.display = "block";
            document.getElementById("select-province")?.focus();
            return;
        } else {
            const provErr = document.getElementById("province-error");
            if (provErr) provErr.style.display = "none";
        }

        if (!ward) {
            showToast("Vui lòng chọn Phường/Xã!");
            const wardErr = document.getElementById("ward-error");
            if (wardErr) wardErr.style.display = "block";
            document.getElementById("select-ward")?.focus();
            return;
        } else {
            const wardErr = document.getElementById("ward-error");
            if (wardErr) wardErr.style.display = "none";
        }
    } else {
        if (formDraftProductIds.length > 0) {
            if (!location) {
                showToast("Vui lòng chọn Tỉnh/Thành phố!");
                document.getElementById("select-province")?.focus();
                return;
            }
            if (!ward) {
                showToast("Vui lòng chọn Phường/Xã!");
                document.getElementById("select-ward")?.focus();
                return;
            }
        }
    }

    if (isEditMode && editingLinkId) {
        // CẬP NHẬT LINK ĐÃ CÓ (Bảo toàn Shortlink & QR Code - BR-AM-07)
        const link = customLinks.find(l => l.id === editingLinkId);
        if (link) {
            link.title = title;
            link.avatar = avatar;
            link.avatarName = avatarName;
            link.location = location;
            link.ward = ward;
            link.productIds = [...formDraftProductIds];
            link.updatedAt = "Vừa xong";
            link.hasBeenEdited = true; // Kết thúc vĩnh viễn trạng thái mới (BR03-03)
        }
        showToast("Cập nhật thông tin link thành công!");
        showListView();
    } else {
        // TẠO LINK MỚI (URL-First) -> Chuyển hướng trực tiếp qua trang Chi tiết link
        const newSlug = "fpt" + Math.random().toString(36).substring(2, 7);
        const newLink = {
            id: "link_" + Date.now(),
            title: title,
            avatar: avatar,
            avatarName: avatarName,
            targetUrl: targetUrl,
            slug: newSlug,
            shortlink: `https://fpt.vn/${newSlug}`,
            location: location,
            ward: ward,
            qrImg: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fpt.vn/${newSlug}`,
            createdAt: "Hôm nay " + new Date().toLocaleTimeString('vi-VN'),
            updatedAt: "Vừa xong",
            productIds: [], // Tạo mới chưa có SP/DV tùy biến
            hasBeenEdited: false, // Chưa từng sửa SP/DV
            kpi: { leads: "0", processed: "0", contracts: "0", cr: "0.0%" }
        };
        customLinks.unshift(newLink);
        showToast("Tạo link thành công!");
        openDetailView(newLink.id);
    }
}

// ==========================================================================
// VIEW 3: Màn hình Chi tiết Link & Báo cáo KPI (FR04 — Chuẩn pic_04)
// ==========================================================================
function openDetailView(linkId) {
    const link = customLinks.find(l => l.id === linkId);
    if (!link) return;

    currentDetailLinkId = linkId;
    editingLinkId = null; // Đặt lại editing context để tránh nhầm QR
    showSection("view-detail");

    // Banner Header
    document.getElementById("detail-avatar").src = link.avatar;
    document.getElementById("detail-title").innerText = link.title;
    document.getElementById("detail-created-at").innerText = link.createdAt;
    document.getElementById("detail-updated-at").innerText = link.updatedAt;

    // 4 KPI Cards
    document.getElementById("detail-kpi-leads").innerText = link.kpi.leads;
    document.getElementById("detail-kpi-processed").innerText = link.kpi.processed;
    document.getElementById("detail-kpi-contracts").innerText = link.kpi.contracts;
    document.getElementById("detail-kpi-cr").innerText = link.kpi.cr;

    // Left Column: Shortlink & QR Code
    document.getElementById("detail-shortlink-input").value = link.shortlink;
    document.getElementById("detail-qr-img").src = link.qrImg;

    // Right Column: Render SP/DV (Read-only view chuẩn pic_04)
    const container = document.getElementById("detail-products-view-list");
    const countBadge = document.getElementById("detail-product-count-badge");
    container.innerHTML = "";

    if (link.productIds && link.productIds.length > 0) {
        countBadge.style.display = "inline-block";
        const locInfo = (link.location && LOCATIONS[link.location]) ? LOCATIONS[link.location].name : "Toàn quốc";
        countBadge.innerText = `${link.productIds.length} gói (${locInfo})`;

        link.productIds.forEach(pid => {
            const prod = SYSTEM_PRODUCTS.find(p => p.id === pid);
            if (!prod) return;

            const card = document.createElement("div");
            card.className = "configured-product-card-pic2 read-only";
            const price = (link.location && prod.prices && prod.prices[link.location]) ? prod.prices[link.location] : "250.000đ/tháng";
            card.innerHTML = `
                <img src="${prod.img}" alt="${prod.name}" class="configured-card-thumb-pic2">
                <div class="configured-card-info-pic2">
                    <div class="configured-card-name-pic2">${prod.name}</div>
                    <div class="configured-card-meta-pic2">${prod.speed} &bull; <strong style="color:#0284c7;">${price}</strong></div>
                </div>
            `;
            container.appendChild(card);
        });
    } else {
        // Link 0 gói: Để trống nội dung bên dưới Header (chuẩn clean dashboard pic_04)
        countBadge.style.display = "none";
        container.innerHTML = "";
    }
}

// ==========================================================================
// 9. Sao chép Shortlink & Tải file ảnh QR Code PNG Thật (Use Case 4.1 & 4.2)
// ==========================================================================
function copyShortlink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast("Đã sao chép Shortlink vào bộ nhớ tạm!");
    });
}

function copyDetailShortlink() {
    const val = document.getElementById("detail-shortlink-input").value;
    copyShortlink(val);
}

function copyFormPreviewShortlink() {
    const val = document.getElementById("form-preview-shortlink").value;
    copyShortlink(val);
}

// TẢI ẢNH MÃ QR THẬT ĐỊNH DẠNG PNG (Context-Aware: Không tải nhầm QR giữa các Link)
function downloadQRCode() {
    let activeLink = null;
    const isFormView = document.getElementById("view-form")?.classList.contains("active");
    const isDetailView = document.getElementById("view-detail")?.classList.contains("active");

    if (isFormView && editingLinkId) {
        activeLink = customLinks.find(l => l.id === editingLinkId);
    } else if (isDetailView && currentDetailLinkId) {
        activeLink = customLinks.find(l => l.id === currentDetailLinkId);
    } else if (editingLinkId) {
        activeLink = customLinks.find(l => l.id === editingLinkId);
    } else if (currentDetailLinkId) {
        activeLink = customLinks.find(l => l.id === currentDetailLinkId);
    } else {
        activeLink = customLinks[0];
    }

    const qrUrl = activeLink ? activeLink.qrImg : "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://fpt.vn";
    const slugName = activeLink ? (activeLink.slug || "custom-link") : "custom-link";
    const fileName = `QR_${slugName}.png`;

    showToast("Đang tải ảnh mã QR PNG chất lượng cao...");

    // Tạo download link ảo tải trực tiếp file PNG
    fetch(qrUrl)
        .then(res => res.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            showToast(`Đã tải file ảnh ${fileName} thành công!`);
        })
        .catch(() => {
            // Fallback tải trực tiếp
            const a = document.createElement("a");
            a.href = qrUrl;
            a.target = "_blank";
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
}

// ==========================================================================
// 10. Modal Live Preview: Giả lập Landing Page Thực tế (BR-AM-04 / BR-AM-05)
// ==========================================================================
function openFormLivePreview() {
    const modal = document.getElementById("modal-landing-preview");
    if (!modal) return;

    const targetUrl = document.getElementById("input-target-url").value || "https://fpt.vn/dang-ky-nang-cap-wifi7";
    document.getElementById("browser-mock-url").innerText = `${targetUrl}?utm_source=affiliate&aff_bypass=true`;

    // Salesman info
    const avatarImg = document.getElementById("input-avatar-preview")?.src || SAMPLE_AVATARS[0].url;
    const title = document.getElementById("input-link-title")?.value || "Nguyễn Văn A (FTEL)";
    const mockAvatar = document.getElementById("mock-salesman-avatar");
    const mockName = document.getElementById("mock-salesman-name");
    if (mockAvatar) mockAvatar.src = avatarImg;
    if (mockName) mockName.innerText = `${title} (0988.xxx.xxx)`;

    renderLandingMockCards(formDraftProductIds, selectedLocationCode);
    modal.classList.add("open");
}

function openDetailLivePreview() {
    if (!currentDetailLinkId) return;
    const link = customLinks.find(l => l.id === currentDetailLinkId);
    if (!link) return;

    const modal = document.getElementById("modal-landing-preview");
    if (!modal) return;

    document.getElementById("browser-mock-url").innerText = `${link.targetUrl}?utm_source=affiliate&aff_bypass=true`;

    const mockAvatar = document.getElementById("mock-salesman-avatar");
    const mockName = document.getElementById("mock-salesman-name");
    if (mockAvatar) mockAvatar.src = link.avatar;
    if (mockName) mockName.innerText = `${link.title} (0988.xxx.xxx)`;

    renderLandingMockCards(link.productIds || [], link.location || "");
    modal.classList.add("open");
}

function renderLandingMockCards(productIds, locationCode) {
    const grid = document.getElementById("mock-cards-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const badge = document.getElementById("preview-mode-badge");

    let displayProducts = [];
    if (productIds && productIds.length > 0) {
        badge.innerText = `Đang hiển thị ${productIds.length} gói cước Wi-Fi 7 tùy biến của bạn`;
        badge.className = "preview-mode-banner custom-active";
        displayProducts = productIds.map(pid => SYSTEM_PRODUCTS.find(p => p.id === pid)).filter(Boolean);
    } else if (locationCode) {
        // Đã chọn Tỉnh/Thành & Phường/Xã nhưng KHÔNG chọn gói nào -> Hiển thị "Không có sản phẩm dịch vụ khả dụng"
        const provName = (PROVINCES[locationCode] && PROVINCES[locationCode].name) ? PROVINCES[locationCode].name : "khu vực này";
        badge.innerText = `Khu vực: ${provName} — Không có sản phẩm dịch vụ khả dụng`;
        badge.className = "preview-mode-banner empty-loc-mode";

        grid.innerHTML = `
            <div class="landing-empty-products-box" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1; margin: 10px 0;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: #fef2f2; color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                    </svg>
                </div>
                <h4 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Không có sản phẩm dịch vụ khả dụng</h4>
                <p style="font-size: 13.5px; color: #64748b; max-width: 440px; margin: 0 auto 18px; line-height: 1.5;">Hiện tại liên kết này chưa cấu hình gói cước khả dụng tại khu vực <strong>${provName}</strong>. Vui lòng liên hệ chuyên viên tư vấn để được hỗ trợ trực tiếp.</p>
                <button class="btn-mock-order" style="max-width: 220px; margin: 0 auto; background: #0066cc;" onclick="showToast('Yêu cầu tư vấn đã được gửi tới chuyên viên!')">Yêu cầu tư vấn ngay</button>
            </div>
        `;
        return;
    } else {
        badge.innerText = `Đang hiển thị toàn bộ danh mục gói cước Wi-Fi 7 SpeedX mặc định của URL đích`;
        badge.className = "preview-mode-banner default-mode";
        displayProducts = [SYSTEM_PRODUCTS[0], SYSTEM_PRODUCTS[1], SYSTEM_PRODUCTS[2], SYSTEM_PRODUCTS[3]];
    }

    displayProducts.forEach(prod => {
        const card = document.createElement("div");
        card.className = "mock-product-card";
        const price = (locationCode && prod.prices && prod.prices[locationCode]) ? prod.prices[locationCode] : (prod.prices && prod.prices["HN"] ? prod.prices["HN"] : "299.000đ/tháng");
        card.innerHTML = `
            <div class="mock-card-badge">HOT - Wi-Fi 7</div>
            <img src="${prod.img}" alt="${prod.name}" class="mock-card-img">
            <h4 class="mock-card-title">${prod.name}</h4>
            <div class="mock-card-speed">${prod.speed}</div>
            <div class="mock-card-price">${price}</div>
            <button class="btn-mock-order" onclick="showToast('Bạn đã chọn gói ${prod.name}!')">Đăng ký gói này</button>
        `;
        grid.appendChild(card);
    });
}

function closeLandingPreviewModal() {
    document.getElementById("modal-landing-preview")?.classList.remove("open");
}

// Toast
function showToast(msg) {
    const toast = document.getElementById("sop-toast");
    const toastMsg = document.getElementById("toast-msg");
    if (!toast || !toastMsg) return;

    toastMsg.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}
