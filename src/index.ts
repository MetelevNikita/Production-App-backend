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
let AGREED : any = []



// YOUGILE



  const url = 'https://ru.yougile.com/api-v2/'


const getYGKey = () => {

return fetch(`${url}auth/companies`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({login: 'Kyle.B@mail.ru', password: 'Metelev1989'})

    }).then(responce => responce.json())
      .then((data : any) => {
        const companyId = data.content[3].id

        return fetch(`${url}auth/keys/get`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({login: 'Kyle.B@mail.ru', password: 'Metelev1989', companyId: companyId})
          })
        })
          .then(responce => responce.json())
          .then((data: any) => {
            const companyKey = data[2].key
            localStorage.setItem('apiYg', data[2].key)


              return fetch(`${url}columns`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${companyKey}`
                }
              })
              .then(responce => responce.json())
              .then((data : any) => {

                  const messageID = data.content[0].id
                  const agreedID = data.content[1].id


                    localStorage.setItem('messageID',data.content[0].id)
                    localStorage.setItem('agreedID',data.content[1].id)


                  })
              })
          }


  getYGKey()


  const apiKeyYG = localStorage.getItem('apiYg')
  const messageID = localStorage.getItem('messageID')
  const agreedID = localStorage.getItem('agreedID')


  console.log(apiKeyYG)
  console.log(messageID)
  console.log(agreedID)



    // Получить все карточки в Yougile

  const getAllCardsYG = async () => {
    return await fetch(`${url}tasks`, {
      method:'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyYG}`
      }

    }).then(responce => responce.json())
      .then(data => CARDS.push(data))
  }



  // Изменить карточку


  const ChangeCardYG = async (id : any) => {
    return await fetch(`${url}tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyYG}`
      },
      body: JSON.stringify({deleted: false, columnId: agreedID})

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

const TGMessage = (text : any) => {return `№ ${text.id} \nзаголовок: ${text.title} \nсообщение: ${text.message}`}

//



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
        console.log(data)
        return data.content.map((card: any) => {
          return tg.sendMessage(chatID, card.description, {
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


  console.log(data.message)


  if(data.message === 'true') {


    console.log(data.id)
    ChangeCardYG(data.id)

    tg.deleteMessage(chatID, query.message.message_id)


  } else if (data.message === 'false') {
    console.log('не согласовано')

  }

})











// listen


const PORT = 5000
app.listen(PORT, () => {console.log(`server start ${PORT}`)})