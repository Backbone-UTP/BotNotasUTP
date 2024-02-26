import puppeteer, { Page } from "puppeteer";
import {ICalCalendar, ICalAlarmType} from 'ical-generator';
import { writeFile } from 'node:fs/promises';
import * as randomUseragent from "random-useragent";
import { IncorrectData } from "./errors.js";

// import keytest from '../keytest.json' assert {type: 'json'};

const logInScraping = async (user, password) => {

    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
    });

    //console.log(`La dirección WebSocket es: ${browserWSEndpoint}`);

    const header = randomUseragent.getRandom((ua) => {
        return ua.browserName == 'Firefox';
    });

    const page = await browser.newPage();

    await page.setUserAgent(header);

    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto('https://app4.utp.edu.co/pe/')

    const loginInput = await page.waitForSelector('#txtUrio')
    const loginPassword = await page.waitForSelector('#txtPsswd')

    await loginInput.type(user);
    await loginPassword.type(password);

    await page.click("#enviar");

    await page.waitForNavigation();

    if (page.url() != 'https://app4.utp.edu.co/pe/utp.php')
        throw new IncorrectData("Usuario y/o contrasela incorrectos");

    return {page, browser}; // returns portal home page (After log in)

    //await page.goto("https://app4.utp.edu.co/reportes/ryc/ReporteDetalladoNotasxEstudiante.php", {timeout: 0})
}

const historicGradesScraping = async (page) => {
    await page.waitForSelector('#cmbprogramas');
    await new Promise(r => setTimeout(r, 600));
    const userPrograms = await page.evaluate(() => {
        var options = Array.from(document.querySelectorAll('select#cmbprogramas option'));
        var finalOptions = [];
        for(var op of options) {
            var subjectId = op.textContent.substring(0,2);
            var subjectName = op.textContent.substring(3);
            if(subjectId != "Pr"){ // Id diferent of Programa
                finalOptions.push({id: subjectId, name: subjectName});
            }
        }
        return finalOptions;
    });
    return userPrograms;
}

/**
 * getGrades
 * @param {Page} page 
 * @param {String} programId
 */
const getGrades = async (page, programId) => {
    // await page.goto("https://app4.utp.edu.co/MatAcad/verificacion/historial-web/programas.php");
    // await page.waitForNavigation();
    const selector = await page.waitForSelector('#cmbprogramas');
    await selector.select(programId);
    await new Promise(r => setTimeout(r, 600));


    const getGrades = await page.evaluate( () => {
        var subjects = Array.from(document.querySelectorAll('fieldset#infoHistorial table.tblNotas table.tblDetalle tr td:nth-child(2)'));
        var creds = Array.from(document.querySelectorAll('fieldset#infoHistorial table.tblNotas table.tblDetalle tr td:nth-child(3)'));
        var allGrades = Array.from(document.querySelectorAll('fieldset#infoHistorial table.tblNotas table.tblDetalle tr td:nth-child(5)'));
        var state = Array.from(document.querySelectorAll('fieldset#infoHistorial table.tblNotas table.tblDetalle tr td:nth-child(7)'));

        var gradesForSubject = {}
        var grades = []
        for (var i = 0; i < allGrades.length; i++) {
            if (state[i].innerText !== "Cursando") {
                var grade = allGrades[i].innerText.replace(/\s/g, '').replace(/,/g, '.').toLowerCase();
                var data = {}
                if (grade.includes("aprobado")) grade = 5;
            
                data.grade = parseFloat(grade, 10);
                data.cred = parseInt(creds[i].innerText, 10);
            
                // It save in an object with grades and credits for subject
                gradesForSubject[subjects[i].innerText] = data;
                // It save in an array with grades and credits
                grades.push(data);
            }
        }
        return {grades, gradesForSubject}
    });
    
    // browser.close().then(setTimeout(() => console.log("Closing browser"), 600));
    return getGrades
}

const getSchedule = async (page) => {
    await new Promise(r => setTimeout(r, 600));

    const {info, subjects, teachers} = await page.evaluate( () => {
        var scheduleData = Array.from(document.querySelector('div>fieldset.form1line').childNodes);
        var info = [], subjects = [], teachers = [];

        for (var elemento of scheduleData){
            if (elemento.nodeName == '#text' && !elemento.textContent.includes('\n')){
                info.push(elemento.textContent.replace(/,\s$/, '').replace(/\sde\s/g,' ').replace(/\sa\s/g,' '));
            }
            if (elemento.nodeName == 'STRONG' && !elemento.textContent.includes('@')){
                subjects.push(elemento.innerText.slice(6));
            }

            if (elemento.nodeName == 'STRONG' && elemento.textContent.includes('@')){
                teachers.push(elemento.innerText.slice(3));
            }
        }

        for (var i = 0; i < info.length; i++){
            info[i] = info[i].replace(/,\s/g, ' ').split(' ')
        }

        return {info, subjects, teachers}
    });

    // Creating the schedule
    const calendar = new ICalCalendar({
        name: 'Horario de clases',
        prodId: {
            company: 'Universidad Tecnológica de Pereira',
            product: 'Horario asignado',
            language: 'ES'
        }
    });


    for (let i = 0; i < info.length; i++) {
        for (let j = 0; j < info[i].length; j+=4) {
            const {startDate, endDate} = getSubjectDate(info[i][j+1] ,info[i][j+2], info[i][j+3])
            calendar.createEvent({
                start: startDate,
                end: endDate,
                summary: subjects[i],
                description: teachers[i] + '\n\nAdvice: You would should go to the classroom 10min before',
                location: `Edificio ${info[i][j]}`,
                repeating: {
                    freq: 'WEEKLY',
                    until: new Date(2024, 5, 26, 0, 0, 0, 0),
                    wkst: 'SU'
                },
                alarms: [
                    {type: ICalAlarmType.display, trigger: 1200},
                ]
            });
        }
    }

    


    try {
    await writeFile('./calendar.ics', calendar.toString());
    } catch (error) {
      console.log(error);
    }
    return calendar;
}

const getSubjectDate = (day, timeInitial, timeEnd) => {
    const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

    let dayOfWeek = "";

    // Convierte el dia de la semana dado a un número entre 1 y 7
    for (let i = 0; i < 7; i++) {
        if (day === days[i]) {
            dayOfWeek = i+1;
        }
    }

    // Crea una fecha inicial
    const startDate = new Date();

    // Encuentra el día de la semana actual
    const startDayOfWeek = startDate.getDay();

    // Calcula la diferencia entre el día de la semana deseado y el día actual.
    const dayDifference = dayOfWeek - startDayOfWeek;

    // Calcula el número de días para agregar a la fecha inicial.
    const daysToAdd = dayDifference >= 0 ? dayDifference : dayDifference + 7;

    // Agrega los días necesarios para llegar al día de la semana deseado.
    startDate.setDate(startDate.getDate() + daysToAdd);

    // It saves hours and minutes like an array
    const timeI = timeInitial.split(':');
    const timeE = timeEnd.split(':');
    // Set time
    startDate.setHours(parseInt(timeI[0]));
    startDate.setMinutes(parseInt(timeI[1]));
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    // console.log(`HORA ${timeI[0]}:`, startDate.getHours());
    
    const endDate = new Date(startDate);
    endDate.setHours(parseInt(timeE[0]));
    endDate.setMinutes(parseInt(timeE[1]));

    return {startDate, endDate}
}

export { logInScraping, historicGradesScraping, getGrades, getSchedule };
