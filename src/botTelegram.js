import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters';
import * as dotenv from 'dotenv' 
import { readHTML } from "./util/extractValues.js"
import { scraping } from "./util/scraper.js"
dotenv.config()
/*
const {
    URL_BOT,
    ENVIRONMENT
} = process.env
*/
const URL_BOT = process.env;
const bot = new Telegraf(URL_BOT);

bot.use((ctx, next) => {
  ctx.state.users = 75;
  next(ctx); 
})

bot.start((ctx) => {
  ctx.reply('Welcome');
  ctx.reply('Para usar el bot usa el siguiente comando\n /notas cedula contraseña\nLos datos del portal estudiantil')
  
})

bot.help(ctx => ctx.reply('help command'))

bot.settings(ctx => ctx.reply('settings command'))

bot.command([/notas.*/], async (ctx) => {
    let inforeplymessage
    ctx.reply('Vamos a procesar su peticion, esto puede tardar algunos minutos.').then(data => inforeplymessage = data)
    console.log("Respondiendo a",ctx.from.first_name, ctx.from.username)
    const input = ctx.update.message.text.split(" ")
    if(input.length != 3){
      ctx.reply('No ingreso bien los datos /nDebe ser /notas [Cedula] [contraseña]')
    }else {
      const username = input[1]
      const password = input[2]
      const page = await scraping(username, password)
      const values = await readHTML(page);
      page.close();
      for(const ms of values){
        ctx.reply(ms)
      }
    }
    ctx.deleteMessage(ctx.update.message.message_id)
    // ctx.deleteMessage(inforeplymessage.message_id)
})

bot.launch()