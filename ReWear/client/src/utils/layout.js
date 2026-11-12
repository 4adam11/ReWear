// Pages with their own bottom actions (place order, the chat box) don't get the phone tab bar
const NO_TAB_BAR = ["/checkout", "/messages", "/success", "/login"];

export const showsTabBar = (pathname) => !NO_TAB_BAR.some((p) => pathname.startsWith(p));
