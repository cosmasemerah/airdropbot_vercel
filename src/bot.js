const { Telegraf } = require('telegraf');
const mongoose = require('../database');
const User = require('../models/User');
const fastifyPlugin = require('fastify-plugin');
require('dotenv').config();

module.exports = fastifyPlugin(async (app) => {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  console.log(process.env.NODE_ENV);

  const userStates = {};

  const AIRDROP_AMOUNT = 100;
  const REFERRAL_BONUS = 20;
  const REFERRAL_THRESHOLD = 5;
  const ADMIN_CHAT_ID = '1363994494';
  const GWEI_CHANNEL_ID = '@testgwei';

  bot.start(async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const username = ctx.from.username;

      let user = await User.findOne({ telegramId });
      const referrerId = ctx.startPayload;
      console.log(referrerId);

      if (!user) {
        user = new User({ telegramId });
        await user.save();

        if (referrerId) {
          const referrer = await User.findOne({ telegramId: referrerId });
          if (referrer) {
            referrer.referrals = (referrer.referrals || 0) + 1;
            await referrer.save();

            // Notify the referrer about the new referral
            await bot.telegram.sendMessage(
              referrerId,
              `🎉 You have a new referral! @${username} has joined using your referral link.`
            );
          }
        }
      }

      ctx.reply(
        `<b>Hello, ${username}! I am your friendly GWEI Token Airdrop bot.</b> \n\n<b>🔹 Earn 100 $GWEI (~50$) For Completing Tasks</b>\n🔹 <b>Earn  20  $GWEI (~10$) For Each Refer</b>\n\n📢 Airdrop Rules\n\n<b>✏️ Mandatory Tasks :</b>\n🔹 <a href="http://t.me/GWEITOKEN">Join our Telegram Channel</a>\n🔹 <a href="https://x.com/gweitoken_eth">Follow our Twitter</a>\n🔹 <a href="https://discord.gg/Z5tuKzeN5q">Join our Discord Server</a>\n🔹 Refer at least 5 Friends\n\nClick On  <b>"✨ Join Airdrop"</b> to Proceed`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'ℹ About', callback_data: '/about' },
                { text: '🌐 Visit Website', url: 'https://gweitoken.io' },
              ],
              [{ text: '✨ Join Airdrop', callback_data: 'join_airdrop' }],
            ],
          },
        }
      );
    } catch (error) {
      const telegramId = ctx.from.id;
      console.error(`Error starting bot by ${telegramId}:`, error);
      ctx.reply('An error occurred while starting the bot. Try again later');
      bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `${telegramId} Error in /start command: ${error.message}`
      );
    }
  });

  // About command handler
  bot.command('about', (ctx) => {
    ctx.reply('Gwei Token is a revolutionary new cryptocurrency...');
  });

  bot.command('balance', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await User.findOne({ telegramId });

      if (user) {
        ctx.reply(
          `💰 <b>Your Airdrop Balance</b> 💰\n\n` +
            `🎉 <b>Tokens Earned:</b> ${user.balance} $GWEI\n` +
            `👥 <b>Referral Balance:</b> ${user.referrals * 20} $GWEI\n\n` +
            `🔗 <b>Your Referral Link:</b> ${user.referralLink || 'N/A'}`,
          { parse_mode: 'HTML' }
        );
      } else {
        ctx.reply('🚫 You are not registered for the airdrop.', {
          parse_mode: 'HTML',
        });
      }
    } catch (error) {
      const telegramId = ctx.from.id;

      console.error(error);
      ctx.reply('An error occurred while processing the request.');
      bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `${telegramId} Error in /balance command: ${error.message}`
      );
    }
  });

  bot.command('referral', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      const user = await User.findOne({ telegramId });

      if (user) {
        ctx.reply(
          `👥 <b>Your Referrals</b> 👥\n\n` +
            `You have <b>${user.referrals}</b> referrals.\n` +
            `Keep sharing your referral link to earn more tokens!`,
          { parse_mode: 'HTML' }
        );
      } else {
        ctx.reply('🚫 You are not registered for the airdrop.', {
          parse_mode: 'HTML',
        });
      }
    } catch (error) {
      const telegramId = ctx.from.id;

      console.error(error);
      ctx.reply('An error occurred while processing the request.');
      bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `${telegramId} Error in /referral command: ${error.message}`
      );
    }
  });

  bot.command('links', (ctx) => {
    ctx.reply(
      '🌐 <b>Our Social Links</b> 🌐\n\n' +
        `📢 <a href="https://t.me/your_channel">Join our Telegram Channel</a>\n` +
        `🐦 <a href="https://twitter.com/your_profile">Follow us on Twitter</a>\n` +
        `💬 <a href="https://discord.gg/your_invite">Join our Discord Server</a>\n` +
        `✍️ <a href="https://medium.com/@your_profile">Follow us on Medium</a>`,
      { parse_mode: 'HTML' }
    );
  });

  // Handler for "✨ Join Airdrop" button
  bot.action('join_airdrop', async (ctx) => {
    try {
      await ctx.reply(
        '🔰 Join our <a href="http://t.me/GWEITOKEN">Telegram Channel</a>\n\n<b><i>🚨 Must Complete This Task Join Telegram Channel To Proceed</i></b>',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Continue', callback_data: 'check_telegram' }],
            ],
          },
        }
      );
    } catch (error) {
      const telegramId = ctx.from.id;

      console.error(error);
      ctx.reply('An error occurred while processing the request.');
      bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `${telegramId} Error in /join_airdrop command: ${error.message}`
      );
    }
  });

  // Check if user joined Telegram channel
  bot.action('check_telegram', async (ctx) => {
    try {
      const member = await bot.telegram.getChatMember(
        GWEI_CHANNEL_ID,
        ctx.from.id
      );
      if (
        member &&
        (member.status === 'administrator' ||
          member.status === 'member' ||
          member.status === 'creator')
      ) {
        ctx.reply(
          '🔰 Follow Our <a href="https://x.com/gweitoken_eth">$GWEI Twitter</a>\n\n<b><i>🚨 Must Complete This Task Then Submit Your Twitter Username To Proceed</i></b>',
          {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '📝 Submit Twitter Username',
                    callback_data: 'twitter',
                  },
                ],
              ],
            },
          }
        );
      } else {
        throw new Error('User is not a member of the channel');
      }
    } catch (error) {
      ctx.reply('<b>🚨 Must Complete The Task Before You Can Proceed</b>', {
        parse_mode: 'HTML',
      });
    }
  });

  // Handler for submitting Twitter username
  bot.action('twitter', (ctx) => {
    const telegramId = ctx.from.id;
    userStates[telegramId] = 'twitter';
    ctx.reply('Please submit your Twitter username starting with "@".');
  });

  // Handler for submitting Discord username
  bot.action('discord', (ctx) => {
    const telegramId = ctx.from.id;
    userStates[telegramId] = 'discord';
    ctx.reply('Please submit your Discord username.');
  });

  // Handler for submitting Medium username
  bot.action('medium', (ctx) => {
    const telegramId = ctx.from.id;
    userStates[telegramId] = 'medium';
    ctx.reply('Please submit your Medium username.');
  });

  // Handler for submitting wallet address
  bot.action('wallet', (ctx) => {
    const telegramId = ctx.from.id;
    userStates[telegramId] = 'wallet';
    ctx.reply('Please submit your Arbitrum wallet address.');
  });

  // Balance command handler
  bot.action('balance', async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const user = await User.findOne({ telegramId });

      if (user) {
        ctx.reply(
          `Your current balance is ${user.balance} GWEI TOKEN. Referral Bonus: ${
            user.referrals * REFERRAL_BONUS
          } GWEI TOKEN`
        );
      } else {
        ctx.reply('User not found.');
      }
    } catch (error) {
      const telegramId = ctx.from.id;

      console.error(error);
      ctx.reply('An error occurred while processing the request.');
      bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `${telegramId} Error in /balance command: ${error.message}`
      );
    }
  });

  bot.on('text', async (ctx) => {
    try {
      const telegramId = ctx.from.id;
      const state = userStates[telegramId];

      if (state) {
        const userAnswer = ctx.message.text;
        delete userStates[telegramId]; // Clear the state after receiving input

        switch (state) {
          case 'twitter':
            await User.findOneAndUpdate(
              { telegramId },
              { twitterUsername: userAnswer },
              { new: true }
            );
            await ctx.deleteMessage(ctx.message.message_id - 1);
            await ctx.reply(`✅ Twitter username set to <b>${userAnswer}</b>`, {
              parse_mode: 'HTML',
            });
            await ctx.reply(
              '🔰 Join our <a href="https://discord.gg/Z5tuKzeN5q">Discord Server</a>\n\n<b><i>🚨 Must Complete This Task Then Submit Your Discord Username To Proceed</i></b>',
              {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '📝 Submit Discord Username',
                        callback_data: 'discord',
                      },
                    ],
                  ],
                },
              }
            );
            break;
          case 'discord':
            await User.findOneAndUpdate(
              { telegramId },
              { discordUsername: userAnswer },
              { new: true }
            );
            await ctx.deleteMessage(ctx.message.message_id - 1);
            await ctx.reply(`✅ Discord username set to <b>${userAnswer}</b>`, {
              parse_mode: 'HTML',
            });
            await ctx.reply(
              '🔰 Follow our <a href="https://medium.com/@gweitoken">Medium</a>\n\n<b><i>🚨 Must Complete This Task Then Submit Your Medium Username To Proceed</i></b>',
              {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '📝 Submit Medium Username',
                        callback_data: 'medium',
                      },
                    ],
                  ],
                },
              }
            );
            break;
          case 'medium':
            await User.findOneAndUpdate(
              { telegramId },
              { mediumUsername: userAnswer },
              { new: true }
            );
            await ctx.deleteMessage(ctx.message.message_id - 1);
            await ctx.reply(`✅ Medium username set to <b>${userAnswer}</b>`, {
              parse_mode: 'HTML',
            });
            await ctx.reply(
              '🔰 Almost done! Please submit your Arbitrum wallet address.',
              {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '📝 Submit Wallet Address',
                        callback_data: 'wallet',
                      },
                    ],
                  ],
                },
              }
            );
            break;
          case 'wallet':
            await User.findOneAndUpdate(
              { telegramId },
              { walletAddress: userAnswer },
              { balance: AIRDROP_AMOUNT },
              { new: true }
            );
            const referralLink = `https://t.me/YourBot?start=${telegramId}`;
            await User.findOneAndUpdate(
              { telegramId },
              { referralLink },
              { new: true }
            );
            await ctx.deleteMessage(ctx.message.message_id - 1);
            await ctx.reply(`✅ Wallet address set to <b>${userAnswer}</b>`, {
              parse_mode: 'HTML',
            });
            await ctx.reply(
              `<b>🎉 Congratulations ${ctx.from.first_name}!</b>\n\n<b>Your airdrop reward: ${AIRDROP_AMOUNT} GWEI has been credited to your balance.</b>\n\n<b>‼ You need at least ${REFERRAL_THRESHOLD} to withdraw your reward.</b>\n\nEarn ${REFERRAL_BONUS} GWEI per referral.\n<b>Referral link:</b> ${referralLink}`,
              {
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: 'Check Balance', callback_data: 'balance' },
                      { text: 'Withdraw', callback_data: 'withdraw' },
                    ],
                  ],
                },
              }
            );
            break;
          default:
            break;
        }
      }
    } catch (error) {
      const telegramId = ctx.from.id;

      console.error(error);
      ctx.reply('An error occurred while processing the request.');
      bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `${telegramId} Error in text handler: ${error.message}`
      );
    }
  });

  // Start the bot
  bot.launch();

  console.log('Bot is running...');

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
});
