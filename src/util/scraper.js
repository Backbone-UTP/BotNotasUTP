import puppeteer from "puppeteer";
import * as randomUseragent from "random-useragent";
import { message } from "telegraf/filters";
import { IncorrectData } from "./errors";
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

    await page.setViewport({ width: 1920, height: 1080});

    await page.goto('https://app4.utp.edu.co/pe/')

    const loginInput = await page.waitForSelector('#txtUrio')
    const loginPassword = await page.waitForSelector('#txtPsswd')

    await loginInput.type(user);
    await loginPassword.type(password);

    await page.click("#enviar");

    await page.waitForNavigation();

    if(page.url() != 'https://app4.utp.edu.co/pe/utp.php')
        throw new IncorrectData("Usuario y/o contrasela incorrectos");
    
    return page; // returns portal home page (After log in)

    //await page.goto("https://app4.utp.edu.co/reportes/ryc/ReporteDetalladoNotasxEstudiante.php", {timeout: 0})

    // console.log(await page.$("//html/body/table/tbody/tr[4]/td/table/tbody/tr/td/table/tbody/tr[3]/td/table"))
    //return page;
}

const goToPage = async (homePage, pageUrl) => {
    return await homePage.goto(pageUrl);
}

const historicGradesScraping = async (programsPage) => {
    const comboBoxPrograms = await programsPage.waitForSelector('#cmbprogramas');

}

// scraping('1004995317', 'MatiaS!181120.');
export { logInScraping, goToPage, historicGradesScraping};
