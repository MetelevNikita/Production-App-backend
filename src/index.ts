import express from "express";
import cors from "cors";
import bodyParser, { text } from "body-parser";
import TelegramApi from "node-telegram-bot-api";
import { LocalStorage } from "node-localstorage";

// firebase

import { appFirebase } from "./firebase/appFirebase";
import { getFirestore } from "firebase/firestore";
import {doc, getDocs, collection} from "firebase/firestore";

//

const app = express();
global.localStorage = new LocalStorage("./scratch");

//

app.use(cors());
app.use(bodyParser.json());


// YOUGILE

const url = "https://ru.yougile.com/api-v2/";

const getYGKey = async () => {

  try {

    const responce = await fetch(`${url}auth/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "Kyle.B@mail.ru", password: "Metelev1989" }),
    });
    const data = await responce.json();
    const companyId = data.content[3].id;
    const responce_1 = await fetch(`${url}auth/keys/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: "Kyle.B@mail.ru",
        password: "Metelev1989",
        companyId: companyId,
      }),
    });
    const data_1 = await responce_1.json();
    const companyKey = data_1[2].key;
    localStorage.setItem("apiYg", data_1[2].key);
    const responce_2 = await fetch(`${url}columns`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${companyKey}`,
      },
    });
    const data_2 = await responce_2.json();
    const messageID = data_2.content[0].id;
    const agreedID = data_2.content[1].id;
    const disagreedID = data_2.content[2].id;
    localStorage.setItem("messageID", data_2.content[0].id);
    localStorage.setItem("agreedID", data_2.content[1].id);
    localStorage.setItem("disagreedID", data_2.content[2].id);



  } catch (error) {
    console.error(error)
  }



};

getYGKey();

const apiKeyYG = localStorage.getItem("apiYg");
const messageID = localStorage.getItem("messageID");
const agreedID = localStorage.getItem("agreedID");
const disagreedID = localStorage.getItem("disagreedID");

let notification: any[] = []


// Изменить карточку

const ChangeCardYG = async (id: any, boardID: any) => {

  try {

    return await fetch(`${url}tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKeyYG}`,
      },
      body: JSON.stringify({ deleted: false, columnId: boardID }),
    })
      .then((responce) => responce.json())
      .then((data: any) => data);

  } catch (error) {
    console.error(error)

  }

};


// Согласовать или отклонить в ТГ


const messageTgIsAgreed = async (id: any) => {


  try {
    const responce = await fetch(`${url}tasks/${id}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKeyYG}`,
      }
    });
    const data = await responce.json();
    const tgId = data.title.split('').slice(1, 10).join('');
    const responce_1 = await fetch(`https://api.telegram.org/bot${TOKEN_USER}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chat_id: tgId, parse_mode: 'html', text: `Карточка с номером ${id} согласована О.Н Эделевой и передана в работу отделу Production студии UTV`})
    });
    const data_1 = await responce_1.json();
    return data_1

  } catch (error) {

    console.error(error)

  }



}


const messageTgIsDisAgreed = async (id: any) => {

  try {

    const responce = await fetch(`${url}tasks/${id}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKeyYG}`,
      }
    });
    const data = await responce.json();
    console.log(data)
    const tgId = data.title.split('').slice(1, 10).join('');
    const responce_1 = await fetch(`https://api.telegram.org/bot${TOKEN_USER}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chat_id: tgId, parse_mode: 'html', text: `Карточка с номером ${id} не согласована О.Н Эделевой подробности уточняйте` })
    });
    const data_1 = await responce_1.json();
    return data_1

  } catch (error) {
    console.error(error)
  }
}










// tg

const TOKEN = "6937785290:AAECcxUKtiOc0gU-R-y7GGZ71nI6MrWTXb8";
const TOKEN_USER = '6561343238:AAHQWfNwKLmEu-hlH_y6M00MUB_XyZqTzk8'
const tg = new TelegramApi(TOKEN, { polling: true });


// Вход в телеграм

tg.on("message", async (msg) => {
  const chatID = msg.chat.id;
  const text = msg.text;

  try {

    if (text === "/start") {
      await tg.sendMessage(chatID, "Добро пожаловать в сервис обработки заявок Продакшен студии UTV", {
        reply_markup: {
          resize_keyboard: true,
          keyboard: [
            [
              { text: "показать карточки" },
            ],
          ],
        },
      });
    } else if (text === "/info") {
      await tg.sendMessage(chatID, "Сервис создан для того что бы заявки заполненные сотрудниками других отделов попадали на согласования в этот чат");
    } else if (text === "показать карточки") {
      sendCardsToTG(chatID)
    }

  } catch (error) {
    console.error(error)
  }


});

// сообщение в телеграм

const sendCardsToTG = async (chatID: number) => {
  const getAllCardsYG = async () => {
    return await fetch(`${url}tasks?columnId=${messageID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKeyYG}`,
      },
    })
      .then((responce) => responce.json())
      .then((data: any) => {

        notification = data.content.map((card: any) => {
          return card
        })
        return (data.content.length < 1) ? tg.sendMessage(chatID, 'Нет активных карточек') : data.content.map((card: any) => {
          return tg.sendMessage(chatID, card.description, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "согласовать",
                    callback_data: JSON.stringify({
                      id: card.id,
                      message: 'true'
                    }),
                  },
                  {
                    text: "отклонить",
                    callback_data: JSON.stringify({
                      id: card.id,
                      message: 'false'
                    }),
                  },
                ],
              ],
            },
          });
        });
      });
  };

  getAllCardsYG();
};


// TG notification

console.log(notification)


tg.on('getUpdate', async (update: any) => {
  const chatID = update.message.chat.id;

  if(update) {
    tg.sendMessage(chatID, `Карточка согласована`);
  }
})




tg.on("callback_query", (query: any) => {
  const data = JSON.parse(query.data);
  const chatID = query.message.chat.id;

  if (data.message === "true") {


    ChangeCardYG(data.id, agreedID);
    messageTgIsAgreed(data.id)
    tg.deleteMessage(chatID, query.message.message_id);
    tg.sendMessage(chatID, `Карточка согласована`);


  } else if (data.message === "false") {

    ChangeCardYG(data.id, disagreedID);
    messageTgIsDisAgreed(data.id)
    tg.deleteMessage(chatID, query.message.message_id);
    tg.sendMessage(chatID,`Карточка не согласована`);
  }

});




// listen

const PORT = 6000;
app.listen(PORT, () => {
  console.log(`server start ${PORT}`);
});
