'use strict';
const config = require('config');
const logger = require('../lib/logging');
const _ = require('lodash');

/**
 * Botmaster send a message to a bot
 *
 * @param {object} bot
 * @param {object} update
 * @param {object} sessions
 * @param {array} text
 *
 */
const sendMessage = function(bot, update, text) {
  const ws = update.sessions.current.workspace_id;
  const context = update.sessions.contexts[ws] ? update.sessions.contexts[ws] : {};
  let botMsg = {
    recipient: {
      id: update.sender.id,
    },
    message: {},
    sessions: update.sessions,
    profile: update.profile,
  };
  if (typeof context.buttons !== 'undefined') {
    const btns = _.cloneDeep(context.buttons);
    if (botMsg.sessions.contexts[ws] !== undefined)
      delete botMsg.sessions.contexts[ws].buttons; // they're processed don't persist
    const length = btns.length;
    btns.forEach((item) => {
      item.title = htmlToFb(item.title);
      item.type = 'postback';
    });
    if (bot.type == 'messenger') {
      let arrayOfBtns = []; // split into chucnks of three for facebook
      let arrayOfMsgs = []; // as max no of buttons is three.
      for (let i = 0; i < btns.length; i += 3) {
        arrayOfBtns.push(btns.slice(i, i + 3));
        arrayOfMsgs.push(_.cloneDeep(botMsg));
      }
      for (let i = 0; i < arrayOfBtns.length; i++) {
        let startPg = i * 3 + 1;
        let endPg = startPg + arrayOfBtns[i].length - 1;
        arrayOfMsgs[i].message.attachment = {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text[0] + ': ' + (startPg !== endPg ? startPg + ' to ' + endPg : startPg),
            buttons: arrayOfBtns[i],
          },
        };
        bot.sendMessage(arrayOfMsgs[i]);
      }
    } else {
      botMsg.message.attachment = {
        type: 'template',
        payload: {
          template_type: 'button',
          text: text[0],
          buttons: btns,
        },
      };
      bot.sendMessage(botMsg);
    }
  } else if (typeof context.image !== 'undefined') {
    botMsg.message.attachment = {
      type: 'image',
      payload: {
        url: context.image.url,
      },
    };
    // do any text first
    text.forEach((item) => {
      let outp = item;
      if (bot.type == 'messenger')
        outp = htmlToFb(item);
      let msg = {
        recipient: {
          id: update.sender.id,
        },
        message: {
          text: outp,
        },
        sessions: update.sessions,
        profile: update.profile,
      };
      if (msg.sessions.contexts[ws] !== undefined)
        delete msg.sessions.contexts[ws].image;
      bot.sendMessage(msg);
    });
    // done text
    if (botMsg.sessions.contexts[ws] !== undefined)
      delete botMsg.sessions.contexts[ws].image; // they're processed don't persist
    bot.sendMessage(botMsg);
  } else if (typeof context.urls !== 'undefined') {
    const btns = context.urls;
    btns.forEach((item) => {
      item.type = 'web_url';
      if (item.view) {
        if (item.view === 'compact')
          item.webview_height_ratio = 'compact';
        else if (item.view === 'full')
          item.webview_height_ratio = 'full';
        else if (item.view === 'tall')
          item.webview_height_ratio = 'tall';
        else
          item.webview_height_ratio = 'full';
        delete item.view;
      } else {
        item.webview_height_ratio = 'full';
      }
    });
    botMsg.message.attachment = {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text[0],
        buttons: btns,
      },
    };
    if (botMsg.sessions.contexts[ws] !== undefined)
      delete botMsg.sessions.contexts[ws].urls; // they're processed, don't persist
    logger.debug('botMsg: ' + JSON.stringify(botMsg));
    bot.sendMessage(botMsg);
  } else if (typeof context.map !== 'undefined') {
    const latLong = context.map.latitude + ',' + context.map.longitude;
    const mapUrl = config.get('google-maps');
    const zoom = '&zoom=' + (context.map.zoom ? context.map.zoom : mapUrl.zoom);
    const mapType = '&maptype=' + (context.map.type ? context.map.type : mapUrl.type);
    const dim = context.map.size ? context.map.size : mapUrl.size;
    const size = '&size=' + dim + 'x' + dim;
    botMsg.message.attachment = {
      type: 'image',
      payload: {
        url: mapUrl.base + latLong + '&markers=' + latLong + mapType + size + zoom,
      },
    };
    if (botMsg.sessions.contexts[ws] !== undefined)
      delete botMsg.sessions.contexts[ws].map; // they're processed don't persist
    bot.sendMessage(botMsg);
  } else {
    text.forEach((item) => {
      let outp = item;
      if (bot.type == 'messenger')
        outp = htmlToFb(item);
      let msg = {
        recipient: {
          id: update.sender.id,
        },
        message: {
          text: outp,
        },
        sessions: update.sessions,
        profile: update.profile,
      };
      if (msg.sessions.contexts[ws] !== undefined)
        delete msg.sessions.contexts[ws].buttons;
      logger.debug('MSG: ' + msg.message.text + ' to: ' + msg.recipient.id);
      bot.sendMessage(msg);
    });
  }
};

/**
 * Botmaster send a raw message to a bot without context
 *
 * @param {object} bot
 * @param {text} recipient
 * @param {array} text
 *
 */
const sendRawFbMessage = function(bot, recipient, text) {
  let outp = text;
  if (bot.type == 'messenger') {
    outp = htmlToFb(text);
  }
  let msg = {
    recipient: {
      id: recipient,
    },
    message: {
      text: outp,
    },
  };
  bot.sendMessage(msg);
}

function htmlToFb(str) {
  const mapObj = {
    '<br\/>': '\u000A',
    '&nbsp;': ' ',
    '<b>': '',
    '<\/b>': '',
  };
  const re = new RegExp(Object.keys(mapObj).join('|'), 'g');
  return str.replace(re, function(matched) {
    return mapObj[matched];
  }).substring(0, 640); // truncate for fb messenger
};

module.exports = {
  sendMessage: sendMessage,
  sendRawFbMessage: sendRawFbMessage,
};
