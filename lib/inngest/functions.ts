import { inngest } from '@/lib/inngest/client';
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from '@/lib/inngest/prompt';
import {
  sendNewsSummaryEmail,
  sendWelcomeEmail,
  sendInactiveUserEmail,
} from '@/lib/nodemailer';
import {
  getAllUsersForNewsEmail,
  getInactiveUsers,
} from '@/lib/actions/user.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { getFormattedTodayDate } from '@/lib/utils';

export const sendSignUpEmail = inngest.createFunction(
  { id: 'sign-up-email' },
  { event: 'app/user.created' },
  async ({ event, step }) => {
    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      '{{userProfile}}',
      userProfile
    );

    const response = await step.ai.infer('generate-welcome-intro', {
      model: step.ai.models.gemini({ model: 'gemini-2.5-flash' }),
      body: {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run('send-welcome-email', async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && 'text' in part ? part.text : null) ||
        'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.';

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: 'Welcome email sent successfully',
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: 'daily-news-summary' },
  [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }],
  async ({ step }) => {
    // Step 1: get all users for delivery
    const users = await step.run('get-all-users', getAllUsersForNewsEmail);
    if (!users || users.length === 0) {
      // No users to send to; finish gracefully
      return { success: true };
    }

    // Step 2: For each user, get their watchlist and fetch news (fallback to general if needed)
    const results = await step.run('fetch-user-news', async () => {
      const perUser: Array<{ user: User; articles: MarketNewsArticle[] }> = [];
      for (const user of users as User[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error('daily-news: error preparing user news', user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step 3: Summarize news via AI (placeholder)
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          '{{newsData}}',
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
          body: {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && 'text' in part ? part.text : null) || 'No market news.';

        userNewsSummaries.push({ user, newsContent });
      } catch {
        console.error('Failed to summarize news for : ', user.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step 4: Send emails (placeholder)
    await step.run('send-news-emails', async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: 'Daily news summary emails sent successfully',
    };
  }
);

export const sendInactiveUserEmails = inngest.createFunction(
  { id: 'send-inactive-user-emails' },
  [{ event: 'app/send.inactive.user.emails' }, { cron: '0 10 */7 *' }], // Every 7 days at 10 AM
  async ({ step }) => {
    // Step 1: Get users who haven't visited in 15+ days
    const inactiveUsers = await step.run('get-inactive-users', async () => {
      return await getInactiveUsers(15);
    });

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return { success: true, message: 'No inactive users found' };
    }

    // Step 2: Send reminder emails to inactive users
    const results = await step.run('send-inactive-user-emails', async () => {
      const emailPromises = inactiveUsers.map(async (user) => {
        try {
          await sendInactiveUserEmail({
            email: user.email,
            name: user.name,
            dashboardUrl: 'https://stock-market-dev.vercel.app/',
            unsubscribeUrl: '#', // You can implement proper unsubscribe URL later
          });
          return { email: user.email, success: true };
        } catch (error) {
          console.error(
            `Failed to send inactive user email to ${user.email}:`,
            error
          );
          return { email: user.email, success: false, error: error };
        }
      });

      return await Promise.all(emailPromises);
    });

    const successful = results.filter((result) => result.success).length;
    const failed = results.filter((result) => !result.success).length;

    return {
      success: true,
      message: `Inactive user emails sent: ${successful} successful, ${failed} failed`,
      details: {
        totalUsers: inactiveUsers.length,
        successful,
        failed,
      },
    };
  }
);
