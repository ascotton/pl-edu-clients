module.exports = `
mutation customerDashboardUpdateUserLastSeen {
    updateCurrentUserProfileLastSeen(input: {}) {
        lastSeen
    }
}`;
