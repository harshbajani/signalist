import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest/client";
import {sendDailyNewsSummary, sendSignUpEmail, sendInactiveUserEmails} from "@/lib/inngest/functions";
import { sendPriceAlertsDaily, sendPriceAlertsMonthly, sendPriceAlertsWeekly } from "@/lib/inngest/alerts";

export const {GET, POST, PUT} = serve({
    client: inngest,
    functions: [
        sendSignUpEmail,
        sendDailyNewsSummary,
        sendInactiveUserEmails,
        sendPriceAlertsDaily,
        sendPriceAlertsWeekly,
        sendPriceAlertsMonthly,
    ],
})
