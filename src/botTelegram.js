import { Telegraf } from "telegraf";
import * as dotenv from 'dotenv'
import {historicGradesScraping, logInScraping } from "./util/scraper.js"
import { validateInputLogIn } from "./util/validations.js";
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
const USERS_ID_DEFAULT_LENGTH = 10; // Amount of numbers of the citizen's id

const bot = new Telegraf("6151207917:AAFQ9aHQJcPb5qmFRe__GJznRC-jAe0gDoE");

bot.use((ctx, next) => {
  ctx.state.users = 75;
  next(ctx);
})

bot.start((ctx) => {
  ctx.reply('Welcome');
  ctx.reply(`Para usar el bot alguno de los siguientes comando\n
    /notas cedula contraseña\n
    /promedio cedula contraseña\n
    Los datos del portal estudiantil`)

})

bot.help(ctx => ctx.reply('help command'))

bot.settings(ctx => ctx.reply('settings command'))

const showInfoMessage = (ctx, message) => {
  ctx.reply(message);
  console.log("Respondiendo a", ctx.from.first_name, ctx.from.username);
}

const ERRORS_HANDLING = {
  IdSyntaxError: (errorMessage, ctx) => {
    ctx.reply(errorMessage);
  },
  InvalidInputError: (errorMessage, ctx) => {
    ctx.reply(errorMessage);
  },
  IncorrectData: (errorMessage, ctx) => {
    ctx.reply(errorMessage);
  }
}

// Command for current semester grades.
bot.command([/notas.*/], async (ctx) => {

  showInfoMessage(ctx, 'Vamos a procesar su peticion, esto puede tardar algunos minutos.');
  
  try {
    const userInput = ctx.update.message.text.split(" ");
    const id = userInput[1];
    const password = userInput[2];

    validateInputLogIn(id, userInput)
    const page = await logInScraping(id, password);
    await page.goto(GRADES_PAGE_URL);
    const values = await logInScraping(page);

    console.log(values);

    for (const ms of values) {
      ctx.reply(ms)
    }
    page.close();
  } catch (error) {
    ERRORS_HANDLING[error.name](error.message, ctx)
  } finally {
    ctx.deleteMessage(ctx.update.message.message_id);
  }
})

// Command for current semester grades.
bot.command([/promedio.*/], async (ctx) => {

  showInfoMessage(ctx, 'Vamos a procesar su peticion, esto puede tardar algunos minutos.');

  try {
    const userInput = ctx.update.message.text.split(" ");
    const id = userInput[1];
    const password = userInput[2];

    validateInputLogIn(id, userInput)
    const page = await logInScraping(id, password);
    await page.goto(HISTORIC_PAGE_URL);
    const userPrograms = await historicGradesScraping(page);

    showInfoMessage(ctx, "Seleccione el programa del que desea ver el promedio de la forma /numero");
    console.log(userPrograms);
    
    userPrograms.forEach(program => showInfoMessage(ctx,"/" + program.id + " " + program.name));

    page.close();
  } catch (error) {
    //ERRORS_HANDLING[error.name](error.message, ctx)
    console.log(error);
  } finally {
    ctx.deleteMessage(ctx.update.message.message_id);
  }
})



bot.launch()