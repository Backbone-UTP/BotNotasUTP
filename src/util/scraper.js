import puppeteer from "puppeteer";
import * as randomUseragent from "random-useragent";
import { IncorrectData } from "./errors.js";

// import keytest from '../keytest.json' assert {type: 'json'};

const logInScraping = async (user, password) => {

    const header = randomUseragent.getRandom((ua) => {
        return ua.browserName == 'Firefox';
    });

    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
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

    return page; // returns portal home page (After log in)

    //await page.goto("https://app4.utp.edu.co/reportes/ryc/ReporteDetalladoNotasxEstudiante.php", {timeout: 0})
}

const goToPage = async (homePage, pageUrl) => {
    return await homePage.goto(pageUrl);
}

const historicGradesScraping = async (programsPage) => {
    await programsPage.waitForSelector('#cmbprogramas');
    const userPrograms = await programsPage.evaluate(() => {
        var options = Array.from(document.querySelectorAll('html body div#utp-contenedor div#utp-contenido div fieldset.form1line select#cmbprogramas option'));
        var finalOptions = [];
        for(var op of options) {
            var subjectId = op.textContent.substring(0,2);
            var subjectName = op.textContent.substring(3);
            if(subjectId.match(/^[0-9]+$/) != null){ // Id only has numbers
                finalOptions.push({id: subjectId, name: subjectName});
            }
        }
        return finalOptions;
    });
    return userPrograms;
}

export { logInScraping, goToPage, historicGradesScraping };
