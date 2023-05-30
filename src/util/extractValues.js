
const makeMessage = (values) => {

  const allmessages = []
  for(const value of values){
    let message = ""
    if(value.name === undefined) continue;
    message += `${value.name}\n`;
    message += `Nota definitiva: ${value.grade}\n`;
    for(const individualGrade of value.value){
        message += ` ${individualGrade.name} - ${individualGrade.porcentage}: ${individualGrade.grade}\n`;
    }
    allmessages.push(message)
  }

  return allmessages;
}

const readHTML = async (page) => {

  const data = await page.evaluate( async () => {
    let flag2 = true; 
    let subjectArea = []
    let subjectareaN = 4;
    while(flag2){
        let grades = []
        let gradeN = 2;
        let flag = true;  
        while(flag){
            let vec = []
            for(let valueN=1; valueN<5; valueN++){
                const tds = document.querySelector(`body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(${subjectareaN}) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(${gradeN}) > td:nth-child(${valueN})`)
                                                    
                try{
                    vec.push(await tds.innerText)
                } catch(e) {
                    console.log(e)
                    flag = false; 
                    break; 
                }                     
            }

            if(flag){
                grades.push({
                    name: vec[0],
                    date: vec[1],
                    porcentage: vec[2],
                    grade: vec[3],
                })
                gradeN++; 
            }
        }
        if(grades.length < 1){
            flag2 = false; 
            break;
        }
        const name = document.querySelector(`body > table > tbody > tr:nth-child(${subjectareaN}) > td > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td`)
        const grade = document.querySelector(`body > table > tbody > tr:nth-child(${subjectareaN}) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td:nth-child(1)`)
        subjectArea.push({
            name: await name.innerText.split(" -")[1].slice(1),
            grade: await grade.innerText,
            value: grades,
        });
        subjectareaN+=2;
    }
    return subjectArea;
  });

  const messages = makeMessage(data);
  return messages
}

export { readHTML }
