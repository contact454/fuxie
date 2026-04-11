const key = 'AIzaSyBUS1j5ET5ZZFfY2UGfkU61hBGk17Hv7I8'
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`

const body = {
  contents: [{
    parts: [
      { text: "test" }
    ]
  }]
}

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
.then(async (res) => {
  console.log('Status', res.status)
  console.log('Response', await res.text())
})
.catch(err => console.error(err))
