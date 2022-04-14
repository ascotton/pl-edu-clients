const { chromium } = require('playwright');
const { initApp } = require('./init-app');

(async () => {
    const { config } = initApp('ROOM');

    const b = await config.newBrowser(chromium);

    // therapist side (SLP user)
    const p1 = await config.newPageFromBrowser(b);
    p1.route('**/status/*', (route) => route.fulfill(config.USERS.AUTH_STATUS.SLP));
    await p1.goto(config.USERS.SLP.therapistRoomUrl);
    await p1.click('text="Close"');
    await p1.click('button.start-video');
    await p1.mouse.move(0, 0);

    // student side
    const p2 = await config.newPageFromBrowser(b);
    await p2.goto(config.USERS.SLP.studentRoomUrl);
    await p2.fill('#username', 'sam');
    await p2.click('.heap-login-button');

    // therapist side
    await config.bringToFront(p1);
    await p1.click('.waiting .admit-user');

    // student side
    await config.bringToFront(p2);
    await p2.click('button.start-video');
    await p2.mouse.move(0, 0);

    config.destroy(b, p1);
    config.destroy(b, p2);
})();
