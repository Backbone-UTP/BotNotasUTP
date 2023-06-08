import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters';
import * as dotenv from 'dotenv'
import { readHTML } from "./util/extractValues.js"
import { goToPage, historicGradesScraping, logInScraping } from "./util/scraper.js"
import { HTTPResponse } from "puppeteer";
dotenv.config()
/*
const {
    URL_BOT,
    ENVIRONMENT
} = process.env
*/
//const URL_BOT = process.env;
const GRADES_PAGE_URL = "https://app4.utp.edu.co/reportes/ryc/ReporteDetalladoNotasxEstudiante.php";
const HISTORIC_PAGE_URL = "https://app4.utp.edu.co/MatAcad/verificacion/historial-web/programas.php";

const bot = new Telegraf("6151207917:AAFQ9aHQJcPb5qmFRe__GJznRC-jAe0gDoE");

bot.use((ctx, next) => {
  ctx.state.users = 75;
  next(ctx);
})

bot.start((ctx) => {
  ctx.reply('Welcome');
  ctx.reply(`Para usar el bot alguno de los siguientes comando\n
    /notas cedula contraseña\n
    /promedio cedula contraeña\n
    Los datos del portal estudiantil`)

})

bot.help(ctx => ctx.reply('help command'))

bot.settings(ctx => ctx.reply('settings command'))

// Command for current semester grades.
bot.command([/notas.*/], async (ctx) => {
  let inforeplymessage
  ctx.reply('Vamos a procesar su peticion, esto puede tardar algunos minutos.').then(data => inforeplymessage = data)
  console.log("Respondiendo a", ctx.from.first_name, ctx.from.username)
  const input = ctx.update.message.text.split(" ")
  if (input.length != 3) {
    ctx.reply('No ingreso bien los datos /nDebe ser /notas [Cedula] [contraseña]')
  } else {
    const username = input[1];
    const password = input[2];

    try {
      const page = await logInScraping(username, password);
      await page.goto(GRADES_PAGE_URL);
      const values = await readHTML(page);
      console.log(values);
      for (const ms of values) {
        ctx.reply(ms)
      }
      page.close();
    } catch (error) {
      console.log("Error: " + error);
    }
  }
  //ctx.deleteMessage(ctx.update.message.message_id)
})



bot.launch()