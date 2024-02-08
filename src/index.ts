import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import EventEmitter from 'events'
import TelegramApi from 'node-telegram-bot-api'
import { LocalStorage } from 'node-localstorage'


//

const app = express()
global.localStorage = new LocalStorage('./scratch');


//

app.use(cors())
app.use(bodyParser.json())

let CARDS : any = []


// YOUGILE



  const url = 'https://ru.yougile.com/api-v2/'


  const getYGKey = async () => {

    const responce = await fetch(`${url}auth/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'Kyle.B@mail.ru', password: 'Metelev1989' })
    })
    const data = await responce.json()
    const companyId = data.content[3].id
    const responce_1 = await fetch(`${url}auth/keys/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'Kyle.B@mail.ru', password: 'Metelev1989', companyId: companyId })
    })
    const data_1 = await responce_1.json()
    const companyKey = data_1[2].key
    localStorage.setItem('apiYg', data_1[2].key)
    const responce_2 = await fetch(`${url}columns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${companyKey}`
      }
    })
    const data_2 = await responce_2.json()
    const messageID = data_2.content[0].id
    const agreedID = data_2.content[1].id
    const disagreedID = data_2.content[2].id
    localStorage.setItem('messageID', data_2.content[0].id)
    localStorage.setItem('agreedID', data_2.content[1].id)
    localStorage.setItem('disagreedID', data_2.content[2].id)
          }


  getYGKey()


  const apiKeyYG = localStorage.getItem('apiYg')
  const messageID = localStorage.getItem('messageID')
  const agreedID = localStorage.getItem('agreedID')
  const disagreedID = localStorage.getItem('disagreedID')





  // Получить все карточки в Yougile



  // Изменить карточку


  const ChangeCardYG = async (id : any, boardID: any) => {
    return await fetch(`${url}tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyYG}`
      },
      body: JSON.stringify({deleted: false, columnId: boardID})

    }).then(responce => responce.json())
      .then(data => console.log(data))
  }



// tg

const TOKEN = '6937785290:AAFbMOiH--yxkF7thAsohJQ6FHGQBdSivbM'
const tg = new TelegramApi(TOKEN, {polling: true})



// Вход в телеграм


tg.on('message', async (msg) => {
  const chatID = msg.chat.id
  const text = msg.text


  if(text === '/start') {
    await tg.sendMessage(chatID, 'Добро пожаловать', {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [{text: 'показать карточки'}, {text: 'показать крайнюю карточку'}]
        ]
      }
    })
  } else if (text === '/info') {
    await tg.sendMessage(chatID, 'информация о канале')
  }
})


// кнопки для карточек


tg.on('message', (msg) => {
  const chatID = msg.chat.id
  const text = msg.text
  if (text === 'показать карточки') {

    sendCardsToTG(chatID)

  } else {
    console.log('показать крайнюю карточку')
  }
})


// сообщение в телеграм




const sendCardsToTG = (chatID : number) => {

  const getAllCardsYG = async () => {
    return await fetch(`${url}tasks?columnId=${messageID}`, {
      method:'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyYG}`
      }

    }).then(responce => responce.json())
      .then((data: any) => {

        return data.content.map((card: any) => {
          return tg.sendMessage(chatID, card.description, {
            reply_to_message_id: Number(card.title),
            reply_markup: {
              inline_keyboard: [
                [{text: 'согласовать', callback_data: JSON.stringify({id: card.id, message: 'true'})}, {text: 'отклонить', callback_data: JSON.stringify({id: card.id, message: 'false'})}]
              ]
            }
          })
        })
      })


  }

  getAllCardsYG()

}


tg.on('callback_query', (query : any) => {

  const data = JSON.parse(query.data)
  const chatID = query.message.chat.id

  console.log(data)


  if(data.message === 'true') {

      ChangeCardYG(data.id, agreedID)
      tg.deleteMessage(chatID, query.message.message_id)
      tg.sendMessage(chatID, `Cообщение №${data.id} помечено как согалсованное`)


  } else if (data.message === 'false') {

      ChangeCardYG(data.id, disagreedID)
      tg.deleteMessage(chatID, query.message.message_id)
      tg.sendMessage(chatID, `Cообщение №${data.id} помечено как несогласованное`)

  }

})











// listen


const PORT = 5000
app.listen(PORT, () => {console.log(`server start ${PORT}`)})