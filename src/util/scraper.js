import puppeteer from "puppeteer";
import * as randomUseragent from "random-useragent";
import { message } from "telegraf/filters";
import keytest from '../keytest.json' assert {type: 'json'};

const scraping = async (user, password) => {

    const header = randomUseragent.getRandom((ua) => {
        return ua.browserName == 'Firefox'; 
    });

    const browser = await puppeteer.launch({
        headless: true, 
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

    await page.waitForNavigation()

    await page.goto("https://app4.utp.edu.co/reportes/ryc/ReporteDetalladoNotasxEstudiante.php", {timeout: 0})

    return await page.content()
}

export { scraping }
