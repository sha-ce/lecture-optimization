//////////////
// LLM chat //
//////////////
function openChat() { document.getElementById('dialog').style.display = 'block'; } // [func] chatウィンドウを表示する関数
function closeChat() { document.getElementById('dialog').style.display = 'none'; } // [func] chatウィンドウを非表示にする関数
function openCloseChat() {                                                         // [func] chatウィンドウの表示・非表示を切り替える関数
    let estyle = document.getElementById('dialog').style.display;
    if (estyle == 'none') { openChat(); } else { closeChat(); }
}

const chatWindow = document.getElementById("chat-window"); // [var] chatウィンドウを表示するエレメント
const chatInput = document.getElementById("chat-input");   // [var] テキスト入力部分のエレメント
const sendButton = document.getElementById("send-button"); // [var] テキスト送信ボタンのエレメント
function addMessage(content, sender) {                     // [func] 通常のメッセージを追加する関数
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = content;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
function typeMessage(message, sender) {                    // [func] LLMの出力をストリーミングアニメーションで出力する
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender, "typing");
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    let currentIndex = 0;
    const interval = setInterval(() => {
        messageDiv.classList.remove("typing");
        messageDiv.textContent += message[currentIndex];
        currentIndex++;
        if (currentIndex === message.length) { clearInterval(interval); messageDiv.classList.remove("typing"); }
    }, 20); // 20ms
}
// [var] チャット履歴を格納する変数、初期値にLLM側のテキストを入れる。
var chatHistory = ['僕はみんなの要望を受けて、時間割の提案を変更するエージェントだよ。何か要望があれば言ってね。'];
typeMessage(chatHistory[0], "bot");

function sendMessage() {                                                     // [func] メッセージ送信のハンドラー
    const message = chatInput.value.trim();                                  // [var] userが入力したテキスト
    if (message) {
        addMessage(message, 'user');                                         // [process] ウィンドウにテキストを表示
        chatInput.value = '';                                                // [process] 入力を空にする
        if (chatHistory.length > 5) { chatHistory.splice(1, 2); }            // [process] 履歴を全て送信するとターン数が多くなると遅くなるので3ターン(len=5)後からidx=0だけ残してidx=1,2の記憶を消去
        chatHistory.push(message);

        let alphas = localStorage.getItem('alphas').split(',').map(Number);
        const url = BASE_URL+'llm/chat/';
        const config = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                questions: chatHistory,
                preferences: {
                    "Few early morning classes": alphas[5],
                    "Optimization of class days": alphas[0],
                    "Optimization of credit hours": alphas[2],
                    "Fewer remote classes": alphas[3],
                    "Fewer courses of interest": alphas[4],
                    "Fewer exams": alphas[6],
                    "Fewer assignments": alphas[1],
                }
            }),
        }
        fetch(url, config)
        .then(data => { return data.json(); })
        .then(res  => {
            let resparams = res.new_params;
            console.log(resparams);
            if (resparams != null){
                let new_alphas = [
                    resparams["Optimization of class days"],
                    resparams["Fewer assignments"],
                    resparams["Optimization of credit hours"],
                    resparams["Fewer remote classes"],
                    resparams["Fewer courses of interest"],
                    resparams["Few early morning classes"],
                    resparams["Fewer exams"],
                ]
                localStorage.setItem('alphas', new_alphas);
            } else {
                console.log("Null response received, retaining original parameters");
            }
            setInfo();
            let llmans = res.response.slice(-1)[0];
            typeMessage(llmans, 'bot');
            chatHistory.push(llmans);
        })
        .catch(e   => {
            console.log(e);
            typeMessage('ERROR：もう一回入力して。', 'bot');
            chatHistory.pop();
            return false
        })
    }
}
sendButton.addEventListener("click", sendMessage);                                           // [process] 送信ボタンのクリックイベント
chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") { sendMessage(); }}); // [process] エンターでも送信ボタンをクリック

function reOptimize() { optimize(); }                                                        // [func] 再最適化のボタン