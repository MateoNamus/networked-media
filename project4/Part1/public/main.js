window.onload = () => {
    refreshMessages()
}

//declaring functions inside window.onload is BAD
async function refreshMessages() {
    // the url I am retrieving on my server
    const url = '/all-posts'
    
    //this retrieves my data from my url
    const response = await fetch(url)
    const data = await response.json()
    console.log(data.posts)
}
