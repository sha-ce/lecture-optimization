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
    get();
});

const url = BASE_URL+'optimizer/only-items/';
const config = {method: "GET", headers: {"Content-Type": "application/json"}}
fetch(url, config)
.then(response => { return response.json(); })
.then(res => {
    let selected_conditions = document.getElementById('selected-conditions');
    let conditions_code = `
        <p>学科　　　　　　　　: ${res['compulsory']}</p>
        <p>専門深化プログラム　: ${res['special']}</p>
        <p>社会駆動プログラム　: ${res['social']}</p>
        <p>クオーター　　　　　: ${res['quarter']}</p>
    `;
    selected_conditions.insertAdjacentHTML("beforeend", conditions_code);
})
.catch(e  => {alert(e); return false; })

//     compulsory: str
//     grade: str
//     quarter: str
//     special: str
//     social: str
//     alphas: list
//     l_early: str
//     units: list
//     keywords: list