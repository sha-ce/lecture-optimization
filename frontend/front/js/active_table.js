let tc_el = document.getElementById('table-columns');
let days = ['', '月', '火', '水', '木', '金']
for (let day of days) { tc_el.insertAdjacentHTML("beforeend", `<th class="table-top">${day}</th>`); }

let tb_el = document.getElementById('table-body');
let course_times = ['1限', '2限', '3限', '4限', '5限', '6限'];
let days_en = ['mon', 'tue', 'wed', 'thu', 'fri'];
for (let time of course_times) {
    let incode = `<tr><td class="rows">${time}</td>`;
    for (let day of days_en) {
        incode += `<td><div id="${day}-${time[0]}" class="cell"><button onclick="popup(this)">+</button></div></td>`;
    }
    incode += `</tr>`;
    tb_el.insertAdjacentHTML('beforeend', incode);
}

let loader_el = document.getElementById('loader');
for (let i=1; i<=12; i++) { loader_el.insertAdjacentHTML("beforeend", `<div class="sk-circle${i} sk-circle"></div>`); }

loading();
new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 10);
}).then(() => {
    let data = {
        compulsory: localStorage.getItem('compulsory'),
        quarter: localStorage.getItem('quarter').replace('Q', ''),
        special: localStorage.getItem('special'),
        social: localStorage.getItem('social'),
        alphas: localStorage.getItem('alphas').split(',').map(Number),
        l_early: localStorage.getItem('l_early'),
        units: localStorage.getItem('units').split(',').map(Number),
        keywords: localStorage.getItem('keywords'),
        // pdf_file_path: '',
    }
    get(data);
});

let selected_conditions = document.getElementById('selected-conditions');
let conditions_code = `
    <div class="hover-up">
    <p>分野　　　　　　　　: ${localStorage.getItem('compulsory')}</p>
    <p>専門深化プログラム　: ${localStorage.getItem('special')}</p>
    <p>社会駆動プログラム　: ${localStorage.getItem('social')}</p>
    <p>クオーター　　　　　: ${localStorage.getItem('quarter')}</p>
    </div>
`;
selected_conditions.insertAdjacentHTML("beforeend", conditions_code);