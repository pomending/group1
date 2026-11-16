export function resetDashboardData() {

    // 고정된 저장 키 초기화
    localStorage.removeItem("communityPosts");
    localStorage.removeItem("noticePosts");

    // ID에 따라 달라지는 저장 키
    const prefixes = [
        "communityComments_",
        "noticeComments_",
        "erpProfilePhoto_",
        "erp_notifications_",
        "erp_notification_assignments_",
        "erpMyPageInfo_"
    ];

    Object.keys(localStorage).forEach(key => {
        if (prefixes.some(prefix => key.startsWith(prefix))) {
            localStorage.removeItem(key);
        }
    });
}