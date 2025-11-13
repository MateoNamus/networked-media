window.onload = () =>{
    refreshMessages()
  }
  
  async function refreshMessages() {
    const url = '/all-posts'
    const response = await fetch(url)
    const data = await response.json()
    console.log(data.posts)
  }
  