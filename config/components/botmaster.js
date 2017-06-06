const config = require('config');
const logger = require('../../lib/logging');
const _ = require('lodash');
const Botmaster = require('botmaster');

let botmaster = null;

/*
 * Initialisation of botmaster
 *
 * Some bot types such as messenger mount a webhook; in order to avoid csrf errors
 * these routes must be defined before csrf middleware is installed in the app.
 * Unfortunately some bot types such as socket.io require a server to install
 * into which is only available after all express initialisation is complete.
 * Hence split botmaster initialisation into two phases; one pre-express
 * configuragtion and one post.
 */

/**
 * Early initialisation of botmaster prior to express.
 *
 * @param {object} app
 *
 */
function initPreExpress(app) {
  botmaster = new Botmaster({
    app: app,
  });

  const messengerSettings = config.get('messengerSettings');
  const messengerBot = new Botmaster.botTypes.MessengerBot(messengerSettings);
  botmaster.addBot(messengerBot);
}

/**
 * Late initialisation of botmaster prior after express.
 *
 * @param {object} server
 *
 */
function initPostExpress(server) {
  const sessionLog = require('../../middlewares/session');
  const enrich = require('../../middlewares/enrich');
  const command = require('../../lib/commands');
  const fulfill = require('../../lib/fulfill');
  const utils = require('../../lib/utils');
  const postActions = require('../../postActions');
  const schedAlerts = require('../../lib/sched');
  const watson = require('watson-developer-cloud');
  const extend = require('extend');
  const watsonConversation = watson.conversation(
    extend(global.appEnv.getService('Conversation').credentials, {
      version: 'v1',
      version_date: '2016-09-20',
    }));

  const socketioSettings = {
    id: 'test-bot-svc.socketio',
    server: server,
  };
  const socketioBot = new Botmaster.botTypes.SocketioBot(socketioSettings);
  botmaster.addBot(socketioBot);
  schedAlerts.init(botmaster);

  const cp = require('socket.io-cookie');
  socketioBot.ioServer.use(cp);

  const mns = require('../../middlewares/passportSocket');
  socketioBot.ioServer.use(mns({
    cookieName: 'session',
    secret: 'gsjdhhslfhflhlkhlfyuiufr',
  }));

  botmaster.use('incoming', sessionLog.retrieveSession);
  botmaster.use('incoming', enrich); // context entity enrichment
  botmaster.use('outgoing', sessionLog.updateSession);

  botmaster.on('server running', (message) => {
    const environ = process.env.NODE_ENV ? process.env.NODE_ENV : 'NODE_ENV not set.';
    logger.info(message + ', NODE_ENV=' + environ);
  });

  botmaster.on('error', (bot, err) => {
    logger.info(err);
  });

  botmaster.on('update', (bot, update) => {
    logger.debug('Update received from: ' + JSON.stringify(update.sender));
    if (_.has(update.message, 'text'))
      logger.debug('Update msg text: ' + update.message.text);
    if (_.has(update.message, 'attachment'))
      logger.debug('Update msg attachment: ' + JSON.stringify(update.message.attachment));
    logger.silly('Update msg sessions: ' + JSON.stringify(update.sessions));
    const ws = update.sessions.current.workspace_id;

    const cmdRe = /^\/[a-zA-Z]/;
    if (cmdRe.test(update.message.text)) {
      command(bot, update); // Process bot command, don't send to Watson
    } else {
      const msgForWatson = {
        context: update.sessions.contexts[ws] ?
          update.sessions.contexts[ws] : {},
        workspace_id: ws,
        input: {
          text: update.message.text,
        },
      };
      // call conversation and any post output actions via fulfill
      watsonConversation.message(msgForWatson, (err, watsonResponse) => {
        if (!err) {
          logger.debug('WatsonText: ' + watsonResponse.output.text);
          update.sessions.contexts[ws] = watsonResponse.context;
          fulfill(
            postActions,
            update.sessions,
            watsonResponse.output.text,
            function(err, finalText) {
              if (err) {
                logger.error(err);
                finalText = ['postAction: ' + err.message];
              }
              delete update.sessions.contexts[ws].req;
              logger.debug('finalText: ' + finalText);
              utils.sendMessage(bot, update, finalText);
            });
        } else {
          delete update.sessions.contexts[ws].req;
          logger.error(err);
          utils.sendMessage(bot, update, ['Watson: ' + err.message]);
        }
      });
    }
  });
}

module.exports = {
  initPreExpress: initPreExpress,
  initPostExpress: initPostExpress,
};
